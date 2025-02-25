import { NextResponse } from 'next/server';
import { transcribeAudio, categorizeThought } from '@/utils/ai';

// Validate required environment variables and MongoDB connection
const validateSetup = async () => {
  // Check environment variables
  const requiredEnvVars = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    MONGODB_URI: process.env.MONGODB_URI
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

    // Test MongoDB connection
    try {
      const collection = await getCollection('thoughts');
      await collection.findOne({}); // Light operation to test connection
      console.log('MongoDB connection validated');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw new Error('Failed to connect to MongoDB');
    }
};
import { 
  splitIntoThoughts, 
  hasStrongEventIndicators, 
  hasStrongTaskIndicators,
  formatTime,
  extractDate,
  extractMeetings
} from '@/utils/text';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    // Validate setup before processing
    await validateSetup();
      console.log('Voice processing request received');
      
      let audioBlob: Blob;
      let type: string = 'complete'; // Default value
      
      try {
        const formData = await request.formData();
        const audio = formData.get('audio');
        type = formData.get('type') as string || 'complete';
        const browser = formData.get('browser') as string || 'unknown';
        
        // Log detailed information about the audio object
        console.log('Request details:', {
          audioExists: !!audio,
          audioType: audio ? (audio as any).type : 'unknown',
          audioSize: audio ? (audio instanceof Blob ? (audio as Blob).size : 'not a Blob') : 0,
          audioConstructor: audio ? audio.constructor.name : 'none',
          requestType: type,
          browser,
          environment: process.env.NODE_ENV,
          isVercel: !!process.env.VERCEL
        });

        // Validate audio data
        if (!audio) {
          console.error('No audio data provided');
          return NextResponse.json(
            { error: 'No audio data provided' },
            { status: 400 }
          );
        }
        
        // Get additional metadata from form data
        const audioSize = formData.get('audioSize');
        const audioType = formData.get('audioType');
        const timestamp = formData.get('timestamp');
        
        console.log('Additional metadata:', {
          audioSize,
          audioType,
          timestamp,
          browser
        });
        
        // Ensure we have a proper Blob to work with
        if (audio instanceof Blob) {
          console.log('Audio is a Blob instance');
          audioBlob = audio;
        } else if (typeof audio === 'object' && audio !== null) {
          console.log('Audio is an object, attempting to convert to Blob');
          
          // Check if it has arrayBuffer method
          if ('arrayBuffer' in audio) {
            try {
              console.log('Converting using arrayBuffer method');
              const buffer = await (audio as any).arrayBuffer();
              const blobType = audioType as string || 'audio/webm';
              audioBlob = new Blob([buffer], { type: blobType });
              console.log('Created blob from arrayBuffer:', { 
                size: audioBlob.size,
                type: audioBlob.type
              });
            } catch (error) {
              console.error('Error converting to Blob using arrayBuffer:', error);
              return NextResponse.json(
                { error: 'Failed to process audio data: arrayBuffer conversion failed' },
                { status: 400 }
              );
            }
          } else {
            // Try to convert directly
            try {
              console.log('Attempting direct Blob conversion');
              const blobType = audioType as string || 'audio/webm';
              audioBlob = new Blob([audio as any], { type: blobType });
              console.log('Created blob directly:', { 
                size: audioBlob.size,
                type: audioBlob.type
              });
            } catch (error) {
              console.error('Error converting to Blob directly:', error);
              return NextResponse.json(
                { error: 'Failed to process audio data: direct conversion failed' },
                { status: 400 }
              );
            }
          }
        } else {
          console.error('Unsupported audio format:', { 
            audioType: typeof audio,
            audioValue: audio
          });
          return NextResponse.json(
            { error: 'Unsupported audio format' },
            { status: 400 }
          );
        }
        
        // Final validation
        if (audioBlob.size === 0) {
          console.error('Empty audio blob');
          return NextResponse.json(
            { error: 'Empty audio data' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error processing audio data:', error);
        return NextResponse.json(
          { error: 'Failed to process audio data' },
          { status: 400 }
        );
      }

    // Create stream for sending updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type, ...data })}\n\n`
              )
            );
          } catch (error) {
            console.error('Error sending event:', error);
            controller.error(error);
          }
        };

        try {
          // First, transcribe the audio
          console.log('Starting transcription with Whisper API...', {
            blobSize: audioBlob.size,
            blobType: audioBlob.type
          });
          
          const transcription = await transcribeAudio(audioBlob);
          
          // Validate transcription
          if (!transcription || transcription.trim() === '') {
            console.error('Empty transcription result');
            throw new Error('Empty transcription result');
          }
          if (transcription === 'Transcribed text will appear here') {
            console.error('Invalid transcription result');
            throw new Error('Invalid transcription result');
          }

          console.log('Transcription complete:', {
            length: transcription?.length,
            preview: transcription?.substring(0, 100)
          });
          sendEvent('transcription', { text: transcription });

          if (type === 'complete') {
            // Process segments
            console.log('Processing segments...');
            const startTime = Date.now();
            const segments = splitIntoThoughts(transcription);
            if (segments.length === 0) {
              throw new Error('No segments found in transcription');
            }
            console.log('Segments extracted:', {
              count: segments.length,
              segments: segments.map(s => s.substring(0, 50))
            });
            sendEvent('segments', { segments });

            // Process thoughts (categorization)
            console.log('Categorizing thoughts...', {
              segmentCount: segments.length,
              processingTime: `${Date.now() - startTime}ms`
            });
            console.log('Getting MongoDB collection...');
            const thoughtsCollection = await getCollection('thoughts');
            console.log('MongoDB collection ready');
            const batchId = new ObjectId(); // Group thoughts from same input
            
            const thoughts = await Promise.all(
              segments.map(async segment => {
                try {
                  // First check for meetings
                  const meetings = extractMeetings(segment);
                  if (meetings.length > 0) {
                    return Promise.all(meetings.map(async meeting => {
                      const formattedTime = meeting.time ? formatTime(meeting.time) : undefined;
                      
                      const thought = {
                        content: segment,
                        inputType: 'voice',
                        rawAudio: true,
                        thoughtType: 'event',
                        confidence: 'high',
                        processedContent: {
                          title: `Meeting${meeting.person ? ` with ${meeting.person}` : ''}`,
                          // Store fields using both naming conventions for compatibility
                          time: formattedTime,
                          date: meeting.date,
                          eventTime: formattedTime,
                          eventDate: meeting.date,
                          person: meeting.person || '-',
                          location: meeting.location
                        },
                        status: 'pending',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        syncStatus: {},
                        metadata: {
                          source: 'voice',
                          batchId,
                          categorization: 'rule-based'
                        }
                      };

                      const savedThought = await thoughtsCollection.insertOne(thought);
                      return {
                        id: savedThought.insertedId,
                        type: 'event',
                        text: segment,
                        metadata: thought.processedContent
                      };
                    }));
                  }

                  // If not a meeting, check for task indicators
                  if (hasStrongTaskIndicators(segment)) {
                    const thought = {
                      content: segment,
                      inputType: 'voice',
                      rawAudio: true,
                      thoughtType: 'task',
                      confidence: 'high',
                      processedContent: {
                        title: segment,
                        priority: segment.match(/\b(?:urgent|asap|important)\b/i) ? 'high' : 'medium'
                      },
                      status: 'pending',
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      syncStatus: {},
                      metadata: {
                        source: 'voice',
                        batchId,
                        categorization: 'rule-based'
                      }
                    };

                    const savedThought = await thoughtsCollection.insertOne(thought);
                    return [{
                      id: savedThought.insertedId,
                      type: 'task',
                      text: segment,
                      metadata: thought.processedContent
                    }];
                  }

                  // Use AI for uncertain cases
                  const result = await categorizeThought(segment);
                  const thoughtType = result.thoughtType === 'uncertain' ? 'note' : result.thoughtType;
                  const thought = {
                    content: segment,
                    inputType: 'voice',
                    rawAudio: true,
                    thoughtType,
                    confidence: result.confidence,
                    processedContent: result.processedContent,
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    syncStatus: {},
                    metadata: {
                      source: 'voice',
                      batchId,
                      categorization: 'ai'
                    }
                  };

                  const savedThought = await thoughtsCollection.insertOne(thought);
                  return [{
                    id: savedThought.insertedId,
                    type: thoughtType,
                    text: segment,
                    metadata: result.processedContent
                  }];
                } catch (error) {
                  console.error('Error processing segment:', error);
                  // Create fallback thought
                  const thought = {
                    content: segment,
                    inputType: 'voice',
                    rawAudio: true,
                    thoughtType: 'note',
                    confidence: 'low',
                    processedContent: {
                      title: segment,
                      details: segment
                    },
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    syncStatus: {},
                    metadata: {
                      source: 'voice',
                      batchId,
                      categorization: 'fallback'
                    }
                  };

                  const savedThought = await thoughtsCollection.insertOne(thought);
                  return [{
                    id: savedThought.insertedId,
                    type: 'note',
                    text: segment,
                    metadata: {
                      title: segment,
                      details: segment
                    }
                  }];
                }
              })
            );

            // Flatten the array of arrays into a single array of thoughts
            const flattenedThoughts = thoughts.flat();
            console.log('Thoughts processed:', {
              count: flattenedThoughts.length,
              types: flattenedThoughts.map(t => t.type),
              totalTime: `${Date.now() - startTime}ms`
            });
            sendEvent('complete', { thoughts: flattenedThoughts });
          }

          controller.close();
        } catch (error) {
          console.error('Error in stream processing:', {
            error: error instanceof Error ? {
              message: error.message,
              name: error.name,
              stack: error.stack
            } : 'Unknown error',
            phase: 'stream-processing',
            audioDetails: {
              size: audioBlob?.size,
              type: audioBlob?.type
            }
          });
          sendEvent('error', { 
            message: error instanceof Error ? error.message : 'Unknown error'
          });
          controller.close();
        }
      }
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in POST handler:', {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : 'Unknown error',
      phase: 'request-handler',
      envVars: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasMongoDBURI: !!process.env.MONGODB_URI
      }
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process audio' },
      { status: 500 }
    );
  }
}
