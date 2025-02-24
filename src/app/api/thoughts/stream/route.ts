import { NextResponse } from 'next/server';
import { transcribeAudio, categorizeThought } from '@/utils/ai';
import { 
  splitIntoThoughts, 
  hasStrongEventIndicators, 
  hasStrongTaskIndicators,
  extractTime,
  extractDate
} from '@/utils/text';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as Blob;
    const type = formData.get('type') as string;

    // Validate audio blob
    if (!audio || audio.size === 0) {
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
          console.log('Starting transcription...');
          const transcription = await transcribeAudio(audio);
          
          // Validate transcription
          if (!transcription || transcription.trim() === '') {
            throw new Error('Empty transcription result');
          }
          if (transcription === 'Transcribed text will appear here') {
            throw new Error('Invalid transcription result');
          }

          console.log('Transcription complete:', transcription);
          sendEvent('transcription', { text: transcription });

          if (type === 'complete') {
            // Process segments
            console.log('Processing segments...');
            const segments = splitIntoThoughts(transcription);
            if (segments.length === 0) {
              throw new Error('No segments found in transcription');
            }
            console.log('Segments:', segments);
            sendEvent('segments', { segments });

            // Process thoughts (categorization)
            console.log('Categorizing thoughts...');
            const thoughtsCollection = await getCollection('thoughts');
            const batchId = new ObjectId(); // Group thoughts from same input
            
            const thoughts = await Promise.all(
              segments.map(async segment => {
                try {
                  // First check for strong indicators
                  let thoughtType: 'task' | 'event' | 'note';
                  let confidence: 'high' | 'low' = 'high';
                  let processedContent: any = {};

                  if (hasStrongEventIndicators(segment)) {
                    thoughtType = 'event';
                    const timeMatch = extractTime(segment);
                    const dateMatch = extractDate(segment);
                    processedContent = {
                      title: segment,
                      time: timeMatch,
                      date: dateMatch
                    };
                  } else if (hasStrongTaskIndicators(segment)) {
                    thoughtType = 'task';
                    processedContent = {
                      title: segment,
                      priority: segment.match(/\b(?:urgent|asap|important)\b/i) ? 'high' : 'medium'
                    };
                  } else {
                    // Use AI for uncertain cases
                    const result = await categorizeThought(segment);
                    // Handle uncertain type by defaulting to note
                    thoughtType = result.thoughtType === 'uncertain' ? 'note' : result.thoughtType;
                    confidence = result.confidence;
                    processedContent = result.processedContent;
                  }

                  // Create thought document
                  const thought = {
                    content: segment,
                    inputType: 'voice',
                    rawAudio: true,
                    thoughtType,
                    confidence,
                    processedContent,
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    syncStatus: {},
                    metadata: {
                      source: 'voice',
                      batchId,
                      categorization: confidence === 'high' ? 'rule-based' : 'ai'
                    }
                  };

                  // Save to MongoDB
                  const savedThought = await thoughtsCollection.insertOne(thought);

                  return {
                    id: savedThought.insertedId,
                    type: thoughtType,
                    text: segment,
                    metadata: processedContent
                  };
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

                  // Save to MongoDB
                  const savedThought = await thoughtsCollection.insertOne(thought);

                  return {
                    id: savedThought.insertedId,
                    type: 'note',
                    text: segment,
                    metadata: {
                      title: segment,
                      details: segment
                    }
                  };
                }
              })
            );
            console.log('Thoughts saved:', thoughts);
            sendEvent('complete', { thoughts });
          }

          controller.close();
        } catch (error) {
          console.error('Error in stream processing:', error);
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
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process audio' },
      { status: 500 }
    );
  }
}
