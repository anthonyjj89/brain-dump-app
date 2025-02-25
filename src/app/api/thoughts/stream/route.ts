import { NextResponse } from 'next/server';
import { transcribeAudio, categorizeThought } from '@/utils/ai';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NLPService } from '@/services/nlp';

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
            // Process the transcription using the NLP service
            console.log('Processing transcription with NLP service...');
            const startTime = Date.now();
            
            // Initialize the NLP service
            const nlpService = new NLPService();
            
            // Process the transcription
            const processingResult = await nlpService.process(transcription);
            
            if (processingResult.thoughts.length === 0) {
              throw new Error('No thoughts extracted from transcription');
            }
            
            // Extract the sentences for client-side display
            const sentences = transcription
              .split(/(?<=[.!?])\s+/)
              .filter(s => s.trim().length > 0);
            
            console.log('Segments extracted:', {
              count: sentences.length,
              segments: sentences.map(s => s.substring(0, 50))
            });
            sendEvent('segments', { segments: sentences });
            
            // Save thoughts to database
            console.log('Getting MongoDB collection...');
            const thoughtsCollection = await getCollection('thoughts');
            console.log('MongoDB collection ready');
            const batchId = new ObjectId(); // Group thoughts from same input
            
            // Save each thought to the database
            const savedThoughts = await Promise.all(
              processingResult.thoughts.map(async thought => {
                try {
                  const dbThought = {
                    content: thought.processedContent.title || transcription,
                    inputType: 'voice',
                    rawAudio: true,
                    thoughtType: thought.thoughtType,
                    confidence: thought.confidence,
                    processedContent: thought.processedContent,
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    syncStatus: {},
                    metadata: {
                      source: 'voice',
                      batchId,
                      categorization: 'nlp-service',
                      processingTime: processingResult.metadata.processingTime,
                      strategy: processingResult.metadata.strategy
                    }
                  };
                  
                  const savedThought = await thoughtsCollection.insertOne(dbThought);
                  return {
                    id: savedThought.insertedId,
                    type: thought.thoughtType,
                    text: thought.processedContent.title || '',
                    metadata: thought.processedContent
                  };
                } catch (error) {
                  console.error('Error saving thought:', error);
                  // Return a minimal object if saving fails
                  return {
                    id: new ObjectId(),
                    type: thought.thoughtType,
                    text: thought.processedContent.title || '',
                    metadata: thought.processedContent,
                    error: 'Failed to save to database'
                  };
                }
              })
            );
            
            console.log('Thoughts processed:', {
              count: savedThoughts.length,
              types: savedThoughts.map(t => t.type),
              totalTime: `${Date.now() - startTime}ms`
            });
            
            sendEvent('complete', { thoughts: savedThoughts });
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
