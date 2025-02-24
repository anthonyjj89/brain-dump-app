// Transcription response type
interface TranscriptionResponse {
  text: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

// Main AI response type
interface AIResponse {
  thoughtType: 'task' | 'event' | 'note' | 'uncertain';
  confidence: 'high' | 'low';
  possibleTypes?: Array<'task' | 'event' | 'note'>;
  processedContent: {
    title?: string;
    // For tasks
    dueDate?: string;
    priority?: string;
    // For events
    eventDate?: string;
    eventTime?: string;
    location?: string;
    // For notes
    tags?: string[];
    details?: string;
    // For uncertain
    suggestedDate?: string;
    suggestedAction?: string;
  };
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

function isValidAIResponse(response: any): response is AIResponse {
  return (
    response &&
    ['task', 'event', 'note', 'uncertain'].includes(response.thoughtType) &&
    ['high', 'low'].includes(response.confidence) &&
    typeof response.processedContent === 'object' &&
    (!response.possibleTypes || (
      Array.isArray(response.possibleTypes) &&
      response.possibleTypes.every((type: any) => 
        ['task', 'event', 'note'].includes(type)
      )
    ))
  );
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
    // Create FormData and append audio file
    const formData = new FormData();
    formData.append('file', audio, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');

    // Call Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Whisper API error:', error);
      throw new Error('Failed to transcribe audio');
    }

    const transcription = await response.text();
    console.log('Transcription result:', transcription);

    if (!transcription || transcription.trim() === '') {
      throw new Error('Empty transcription result');
    }

    return transcription;
  } catch (error) {
    console.error('Transcription error:', error);
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
              content: `Analyze this text and categorize STRICTLY as:
                - task: if it mentions an action to do (e.g., "finish", "complete", "do", "make")
                  Example: "finish the invoice" -> task with title "Finish invoice"
                  
                - event: if it mentions a time/date (e.g., "tomorrow", "at 2pm", "next week")
                  Example: "meeting at 2pm" -> event with title "Meeting" and time "2:00 PM"
                  
                - note: for general information without actions or times
                  Example: "the project looks good" -> note

                - uncertain: if you're not confident about the type
                  Example: "team sync next week" -> could be task or event

                If uncertain, include:
                - confidence: "low"
                - possibleTypes: array of likely types
                - suggestedDate: any date/time mentioned
                - suggestedAction: any action words

                For tasks, extract:
                - title (make it concise)
                - due date (if mentioned)
                - priority (high if urgent words used)

                For events, extract:
                - title (make it concise)
                - date (e.g., "tomorrow", "next week")
                - time (convert to standard format)
                - location (if mentioned)

                For notes, extract:
                - title (from first few words)
                - tags (key topics)
                - details (full content)

                Always include confidence level (high/low).
                Respond in JSON format with thoughtType, confidence, possibleTypes (if uncertain), and processedContent.
                
                Examples:
                "finish the report by tomorrow" -> {
                  "thoughtType": "task",
                  "confidence": "high",
                  "processedContent": {
                    "title": "Finish report",
                    "dueDate": "tomorrow",
                    "priority": "medium"
                  }
                }

                "team sync next week" -> {
                  "thoughtType": "uncertain",
                  "confidence": "low",
                  "possibleTypes": ["task", "event"],
                  "processedContent": {
                    "title": "Team Sync",
                    "suggestedDate": "next week",
                    "suggestedAction": "sync"
                  }
                }`
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
