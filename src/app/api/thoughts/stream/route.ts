import { NextResponse } from 'next/server';
import { transcribeAudio, categorizeThought } from '@/utils/ai';
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
      console.log('API Request received');
      const formData = await request.formData();
      const audio = formData.get('audio') as Blob;
      const type = formData.get('type') as string;

      console.log('Request details:', {
        audioSize: audio?.size,
        audioType: audio?.type,
        requestType: type
      });

      // Validate audio blob
      if (!audio || audio.size === 0) {
        console.error('Invalid audio blob:', { audio });
      return NextResponse.json(
        { error: 'No audio data provided' },
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
          console.log('Starting transcription with Whisper API...');
          const transcription = await transcribeAudio(audio);
          
          // Validate transcription
          if (!transcription || transcription.trim() === '') {
            throw new Error('Empty transcription result');
          }
          if (transcription === 'Transcribed text will appear here') {
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
            const thoughtsCollection = await getCollection('thoughts');
            const batchId = new ObjectId(); // Group thoughts from same input
            
            const thoughts = await Promise.all(
              segments.map(async segment => {
                try {
                  // First check for meetings
                  const meetings = extractMeetings(segment);
                  if (meetings.length > 0) {
                    return Promise.all(meetings.map(async meeting => {
                      const thought = {
                        content: segment,
                        inputType: 'voice',
                        rawAudio: true,
                        thoughtType: 'event',
                        confidence: 'high',
                        processedContent: {
                          title: `Meeting${meeting.person ? ` with ${meeting.person}` : ''}`,
                          time: meeting.time ? formatTime(meeting.time) : undefined,
                          date: meeting.date,
                          person: meeting.person || '-'
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
            } : error,
            phase: 'stream-processing'
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
      } : error,
      phase: 'request-handler'
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process audio' },
      { status: 500 }
    );
  }
}
