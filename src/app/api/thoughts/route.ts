import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { categorizeThought } from '@/utils/ai';
import { 
  splitIntoThoughts,
  hasTaskIndicators,
  hasEventIndicators,
  hasStrongEventIndicators,
  hasStrongTaskIndicators,
  isUncertainType
} from '@/utils/text';

async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Keep original WebM format
  const formData = new FormData();
  
  // Log incoming audio details
  console.log('Transcribing audio:', {
    type: audioBlob.type,
    size: audioBlob.size
  });

  // Create file with original type
  const audioFile = new File([audioBlob], 'recording.webm', {
    type: audioBlob.type
  });

  // Prepare API request
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');
  formData.append('response_format', 'json');
  formData.append('temperature', '0.2');

  // Make API request with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    console.log('Sending request to Whisper API...');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Whisper API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(
        errorData?.error?.message || 
        response.statusText || 
        'Failed to transcribe audio'
      );
    }

    const data = await response.json();
    console.log('Transcription result:', {
      text: data.text?.substring(0, 100) + '...',
      duration: data.duration,
      language: data.language
    });
    return data.text;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Transcription request timed out');
      throw new Error('Transcription request timed out after 30 seconds');
    }
    console.error('Transcription error:', error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  try {
    let content: string;
    let type: string;
    let modelId: string | undefined;
    let rawAudio: Blob | undefined;

    // Check if the request is multipart form data (voice input)
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing voice input...');
      const formData = await request.formData();
      
      // Log received form data
      console.log('Received form data:', {
        hasAudio: formData.has('audio'),
        audioType: formData.get('audio') instanceof Blob ? (formData.get('audio') as Blob).type : null,
        content: formData.get('content'),
        type: formData.get('type'),
        modelId: formData.get('modelId')
      });

      content = formData.get('content') as string;
      type = formData.get('type') as string;
      modelId = formData.get('modelId') as string;
      rawAudio = formData.get('audio') as unknown as Blob;

      // Validate audio data
      if (!rawAudio) {
        console.error('No audio data received');
        return NextResponse.json(
          { error: 'No audio data received' },
          { status: 400 }
        );
      }

      if (!rawAudio.type.includes('audio/')) {
        console.error('Invalid audio format:', rawAudio.type);
        return NextResponse.json(
          { error: 'Invalid audio format' },
          { status: 400 }
        );
      }

      try {
        console.log('Starting transcription...');
        content = await transcribeAudio(rawAudio);
        console.log('Transcription completed:', content.substring(0, 100) + '...');
      } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to transcribe audio' },
          { status: 500 }
        );
      }
    } else {
      // Regular JSON request (text input)
      const body = await request.json();
      content = body.content;
      type = body.type;
      modelId = body.modelId;
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Split content into segments using improved segmentation
    let segments: string[];
    
    if (contentType.includes('multipart/form-data')) {
      // For voice input, transcribe then split
      const transcription = await transcribeAudio(rawAudio!);
      segments = splitIntoThoughts(transcription);
      console.log('Voice segments:', segments);
    } else {
      // For text input, split each line then further split by context
      const lines = content.split('\n').filter(line => line.trim());
      segments = lines.flatMap(line => splitIntoThoughts(line));
      console.log('Text segments:', segments);
    }

    // Process each segment with improved categorization
    const thoughts = await getCollection('thoughts');
    const results = [];
    const batchId = new ObjectId(); // Group thoughts from same input

    for (const segment of segments) {
      try {
        console.log('Processing segment:', segment);

        // Check for strong indicators first
        if (hasStrongEventIndicators(segment)) {
          const thought = {
            content: segment,
            inputType: type,
            rawAudio: rawAudio ? true : undefined,
            thoughtType: 'event',
            confidence: 'high' as const,
            processedContent: {
              title: segment,
              eventDate: segment.match(/tomorrow|today|tonight|\b(?:mon|tues|wednes|thurs|fri|satur|sun)day\b/i)?.[0],
              eventTime: segment.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\b/)?.[0]
            },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: {},
            metadata: {
              source: contentType.includes('multipart/form-data') ? 'voice' : 'text',
              batchId
            }
          };

          const result = await thoughts.insertOne(thought);
          results.push({
            id: result.insertedId,
            ...thought,
            tokenUsage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            cost: 0
          });
          continue;
        }

        if (hasStrongTaskIndicators(segment)) {
          const thought = {
            content: segment,
            inputType: type,
            rawAudio: rawAudio ? true : undefined,
            thoughtType: 'task',
            confidence: 'high' as const,
            processedContent: {
              title: segment,
              priority: segment.match(/\b(?:urgent|asap|important)\b/i) ? 'high' : 'medium'
            },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: {},
            metadata: {
              source: contentType.includes('multipart/form-data') ? 'voice' : 'text',
              batchId
            }
          };

          const result = await thoughts.insertOne(thought);
          results.push({
            id: result.insertedId,
            ...thought,
            tokenUsage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            cost: 0
          });
          continue;
        }

        // If no strong indicators, check for uncertainty
        if (isUncertainType(segment)) {
          console.log('Segment has both task and event indicators:', segment);
          const thought = {
            content: segment,
            inputType: type,
            rawAudio: rawAudio ? true : undefined,
            thoughtType: 'uncertain',
            confidence: 'low' as const,
            possibleTypes: ['task', 'event'],
            processedContent: {
              title: segment,
              suggestedDate: hasEventIndicators(segment) ? segment : undefined,
              suggestedAction: hasTaskIndicators(segment) ? segment : undefined
            },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: {},
            metadata: {
              source: contentType.includes('multipart/form-data') ? 'voice' : 'text',
              batchId
            }
          };

          const result = await thoughts.insertOne(thought);
          results.push({
            id: result.insertedId,
            ...thought,
            tokenUsage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            cost: 0
          });
          continue;
        }

        // If not uncertain, proceed with AI categorization
        const aiResult = await categorizeThought(segment, modelId);
        console.log('Segment categorized:', {
          type: aiResult.thoughtType,
          confidence: aiResult.confidence,
          title: aiResult.processedContent.title
        });

        const thought = {
          content: segment,
          inputType: type,
          rawAudio: rawAudio ? true : undefined,
          thoughtType: aiResult.thoughtType,
          confidence: aiResult.confidence,
          possibleTypes: aiResult.possibleTypes,
          processedContent: aiResult.processedContent,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: {},
          metadata: {
            categorization: aiResult.thoughtType === 'note' && !aiResult.tokenUsage.total_tokens ? 'fallback' : 'ai',
            source: contentType.includes('multipart/form-data') ? 'voice' : 'text',
            batchId
          }
        };

        const result = await thoughts.insertOne(thought);
        results.push({
          id: result.insertedId,
          ...thought,
          tokenUsage: aiResult.tokenUsage,
          cost: aiResult.cost
        });
      } catch (error) {
        console.error('Error processing segment:', error);
        // Continue with other segments even if one fails
      }
    }

    return NextResponse.json({
      status: 'success',
      message: `${results.length} thoughts captured and categorized successfully`,
      data: {
        transcribedText: content,
        items: results
      }
    });
  } catch (error) {
    console.error('Error in thoughts API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const thoughtType = searchParams.get('thoughtType');
    const cursor = searchParams.get('cursor'); // timestamp for pagination
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const thoughts = await getCollection('thoughts');

    // Build query
    const query: any = { status };
    if (thoughtType) {
      query.thoughtType = thoughtType;
    }
    if (cursor) {
      query[sortBy] = sortOrder === 'desc' 
        ? { $lt: new Date(cursor) }
        : { $gt: new Date(cursor) };
    }

    // Execute query
    const result = await thoughts
      .find(query)
      .limit(limit + 1) // Get one extra to check if there are more items
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .toArray();

    // Check if there are more items
    const hasNextPage = result.length > limit;
    const items = hasNextPage ? result.slice(0, -1) : result;
    const nextCursor = hasNextPage ? items[items.length - 1][sortBy].toISOString() : null;

    return NextResponse.json({
      status: 'success',
      data: {
        items,
        nextCursor,
        hasNextPage
      }
    });
  } catch (error) {
    console.error('Error in thoughts API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = await request.json();

    if (!id || !updates) {
      return NextResponse.json(
        { error: 'ID and updates are required' },
        { status: 400 }
      );
    }

    const thoughts = await getCollection('thoughts');

    const result = await thoughts.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Thought not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Thought updated successfully'
    });
  } catch (error) {
    console.error('Error in thoughts API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
