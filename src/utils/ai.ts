// Transcription response type
interface TranscriptionResponse {
  text: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

// Thought type for compound responses
interface Thought {
  thoughtType: 'task' | 'event' | 'note' | 'uncertain';
  confidence: 'high' | 'low';
  possibleTypes?: Array<'task' | 'event' | 'note'>;
  processedContent: {
    title?: string;
    // For tasks
    dueDate?: string;
    dueTime?: string;
    priority?: string;
    // For events
    date?: string;
    time?: string;
    startTime?: string;
    endTime?: string;
    person?: string;
    location?: string;
    // For notes
    tags?: string[];
    details?: string;
    // For uncertain
    suggestedDate?: string;
    suggestedAction?: string;
  };
}

// Main AI response type
interface AIResponse extends Thought {
  thoughts?: Thought[]; // For compound inputs with multiple thoughts
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface AIResult extends AIResponse {
  tokenUsage: TokenUsage;
  cost: number;
}

// Helper functions
function createDefaultThought(content: string): AIResult {
  return {
    thoughtType: 'uncertain',
    confidence: 'low',
    possibleTypes: ['note'],
    processedContent: {
      title: content.split('\n')[0] || 'Untitled',
      details: content
    },
    tokenUsage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    cost: 0
  };
}

function isValidThought(thought: any): thought is Thought {
  return (
    thought &&
    ['task', 'event', 'note', 'uncertain'].includes(thought.thoughtType) &&
    ['high', 'low'].includes(thought.confidence) &&
    typeof thought.processedContent === 'object' &&
    (!thought.possibleTypes || (
      Array.isArray(thought.possibleTypes) &&
      thought.possibleTypes.every((type: any) => 
        ['task', 'event', 'note'].includes(type)
      )
    ))
  );
}

function isValidAIResponse(response: any): response is AIResponse {
  // Check if it's a compound response
  if ('thoughts' in response && Array.isArray(response.thoughts)) {
    return response.thoughts.every(isValidThought);
  }

  // If not compound, validate as a single thought
  return isValidThought(response);
}

function calculateCost(tokenUsage: TokenUsage, modelId?: string): number {
  const costPer1K = {
    'anthropic/claude-3-haiku': 0.0005,
    'deepseek-ai/deepseek-chat-7b': 0.0001
  };
  const modelCost = costPer1K[modelId as keyof typeof costPer1K] || costPer1K['anthropic/claude-3-haiku'];
  return (tokenUsage.total_tokens / 1000) * modelCost;
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  try {
    // Validate API key
    const apiKey = process.env.OPENAI_API_KEY ?? '';
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Preparing audio for transcription:', {
      size: audio.size,
      type: audio.type,
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      environment: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL
    });

    // Create FormData and append audio file with explicit filename and type
    const formData = new FormData();
    
    // Determine the best file extension and type based on the blob's type
    const fileExtension = audio.type.includes('mp4') ? 'mp4' : 
                         audio.type.includes('ogg') ? 'ogg' : 
                         'webm';
    
    const fileType = audio.type || 'audio/webm';
    
    // In Vercel environment, we need to be more explicit about the file
    const audioFile = new File(
      [audio], 
      `audio.${fileExtension}`, 
      { type: fileType }
    );
    
    console.log('Creating audio file for Whisper API:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      lastModified: new Date(audioFile.lastModified).toISOString()
    });
    
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');
    formData.append('language', 'en'); // Explicitly set language to English

    console.log('Calling Whisper API with file details:', {
      fileName: 'audio.webm',
      fileType: 'audio/webm',
      fileSize: audioFile.size
    });
    const startTime = Date.now();

    // Call Whisper API with more detailed error handling
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    console.log('Whisper API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      time: `${Date.now() - startTime}ms`
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Whisper API error:', {
        status: response.status,
        error,
        requestDetails: {
          audioSize: audio.size,
          audioType: audio.type,
          apiKeyPresent: true,
          apiKeyLength: apiKey.length,
          apiKeyPrefix: apiKey.substring(0, 7)
        }
      });
      throw new Error(`Failed to transcribe audio: ${error.error?.message || 'Unknown error'}`);
    }

    const transcription = await response.text();
    console.log('Transcription result:', {
      length: transcription?.length,
      preview: transcription?.substring(0, 100),
      time: `${Date.now() - startTime}ms`
    });

    if (!transcription || transcription.trim() === '') {
      throw new Error('Empty transcription result');
    }

    return transcription;
  } catch (error) {
    console.error('Transcription error:', {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error,
      audioDetails: {
        size: audio.size,
        type: audio.type
      }
    });
    throw error;
  }
}

export async function categorizeThought(content: string, modelId?: string): Promise<AIResult> {
  // Don't process empty or placeholder content
  if (!content || content === "Transcribed text will appear here" || content.trim() === '') {
    console.warn('Empty or placeholder content, skipping categorization');
    return createDefaultThought('Empty or invalid content');
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Attempt ${attempt} to categorize:`, content.substring(0, 100));
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Brain Dump App'
        },
        body: JSON.stringify({
          model: modelId || 'anthropic/claude-3-haiku',
          messages: [
            {
              role: 'system',
              content: `You are a thought categorization system. Your task is to analyze text and categorize each distinct thought while preserving relationships and context.

CATEGORIZATION RULES:

1. Task Indicators:
- Action verbs: finish, complete, do, make, send, review
- Obligation words: need to, have to, must, should
- Project terms: task, project, deadline
Example: "need to finish the report" -> task

2. Event Indicators:
- Time mentions: at [time], [time] am/pm, o'clock
- Date references: tomorrow, next week, on Monday
- Meeting words: meeting, appointment, call, sync
Example: "meeting at 2pm" -> event

3. Note Indicators:
- Observations, facts, or information without actions/times
- Ideas or thoughts without specific timing
Example: "the project looks promising" -> note

TIME FORMAT RULES:
- Always normalize times to 12-hour format with am/pm
- Handle variations: "9am", "9:00", "9 a.m.", "9 in the morning"
- For ambiguous times (e.g. "at 5"), use context to determine am/pm
- Preserve time zones if mentioned

COMPOUND THOUGHT HANDLING:
Input: "I need to drink water and have a meeting at 9 a.m. tomorrow"
Output: {
  "thoughts": [
    {
      "thoughtType": "task",
      "confidence": "high",
      "processedContent": {
        "title": "Drink water",
        "priority": "medium"
      }
    },
    {
      "thoughtType": "event",
      "confidence": "high",
      "processedContent": {
        "title": "Meeting",
        "time": "9:00 AM",
        "date": "tomorrow"
      }
    }
  ]
}

MORE EXAMPLES:

1. Informal Meeting:
Input: "catch up with John at 3"
Output: {
  "thoughtType": "event",
  "confidence": "high",
  "processedContent": {
    "title": "Catch up with John",
    "time": "3:00 PM",
    "person": "John"
  }
}

2. Task with Deadline:
Input: "need to finish this by 5pm today"
Output: {
  "thoughtType": "task",
  "confidence": "high",
  "processedContent": {
    "title": "Finish this",
    "dueDate": "today",
    "dueTime": "5:00 PM",
    "priority": "high"
  }
}

3. Uncertain Case:
Input: "team sync sometime next week"
Output: {
  "thoughtType": "uncertain",
  "confidence": "low",
  "possibleTypes": ["event", "task"],
  "processedContent": {
    "title": "Team sync",
    "suggestedDate": "next week",
    "suggestedAction": "sync"
  }
}

4. Multiple Times:
Input: "meeting from 2pm to 4pm"
Output: {
  "thoughtType": "event",
  "confidence": "high",
  "processedContent": {
    "title": "Meeting",
    "startTime": "2:00 PM",
    "endTime": "4:00 PM"
  }
}

RESPONSE FORMAT:
Always respond with valid JSON containing:
- thoughtType: "task" | "event" | "note" | "uncertain"
- confidence: "high" | "low"
- possibleTypes?: ["task" | "event" | "note"] (if uncertain)
- processedContent: object with relevant fields
- thoughts?: array of multiple thoughts (for compound inputs)

For uncertain cases, include:
- suggestedDate: any time/date mentioned
- suggestedAction: any action words found
- possibleTypes: array of likely categorizations`
            },
            { role: 'user', content }
          ]
        })
      });

      // Log full response for debugging
      const responseText = await response.text();
      console.log(`Attempt ${attempt} response:`, responseText);

      if (!response.ok) {
        if (response.status >= 500 && attempt < 3) {
          console.log(`Server error on attempt ${attempt}, retrying...`);
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        console.warn(`Failed to categorize on attempt ${attempt}:`, response.status);
        return createDefaultThought(content);
      }

      const result = JSON.parse(responseText);
      let aiResponse;
      
      // Try to parse as JSON first
      try {
        aiResponse = JSON.parse(result.choices[0].message.content);
        console.log('AI response parsed:', aiResponse);
      } catch (parseError) {
        // If parsing fails, try to extract the type from the plain text
        const text = result.choices[0].message.content.toLowerCase();
        let thoughtType: 'task' | 'event' | 'note' | 'uncertain' = 'uncertain';
        
        if (text.includes('task') || text.includes('todo') || text.includes('action')) {
          thoughtType = 'task';
        } else if (text.includes('event') || text.includes('meeting') || text.includes('appointment')) {
          thoughtType = 'event';
        } else if (text.includes('note') || text.includes('information')) {
          thoughtType = 'note';
        }

        aiResponse = {
          thoughtType,
          confidence: 'low',
          processedContent: {
            title: content.split('\n')[0] || 'Untitled',
            details: content
          }
        };
        console.log('Created structured response from plain text:', aiResponse);
      }

      // Validate response format
      if (!isValidAIResponse(aiResponse)) {
        console.warn('Invalid AI response format:', aiResponse);
        if (attempt < 3) {
          console.log('Retrying due to invalid format...');
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        return createDefaultThought(content);
      }

      const tokenUsage = result.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      };

      console.log('Categorization successful:', {
        thoughtType: aiResponse.thoughtType,
        confidence: aiResponse.confidence,
        possibleTypes: aiResponse.possibleTypes,
        tokenUsage,
        cost: calculateCost(tokenUsage, modelId)
      });

      return {
        ...aiResponse,
        tokenUsage,
        cost: calculateCost(tokenUsage, modelId)
      };
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt < 3) {
        console.log('Retrying due to error...');
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      return createDefaultThought(content);
    }
  }

  // This should never be reached due to the returns in the loop,
  // but TypeScript needs it
  return createDefaultThought(content);
}
