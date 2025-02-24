interface AIResponse {
  thoughtType: 'task' | 'event' | 'note';
  processedContent: {
    title?: string;
    dueDate?: string;
    priority?: string;
    eventDate?: string;
    eventTime?: string;
    location?: string;
    details?: string;
    tags?: string[];
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

export async function categorizeThought(content: string, modelId?: string): Promise<AIResult> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Brain Dump App'
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
      model: modelId || 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that categorizes user thoughts into one of three types:
              1. task (something that needs to be done)
              2. event (something happening at a specific time)
              3. note (general thoughts or information)
              
              For each thought, extract relevant information based on the type:
              - For tasks: title, due date (if mentioned), priority
              - For events: title, date, time, location (if mentioned)
              - For notes: title, tags (if applicable), details
              
              Respond in JSON format with thoughtType and processedContent.`
          },
          {
            role: 'user',
            content
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to categorize thought');
    }

    const result = await response.json();
    const aiResponse = JSON.parse(result.choices[0].message.content);

    // Validate the response format
    if (!aiResponse.thoughtType || !aiResponse.processedContent) {
      throw new Error('Invalid AI response format');
    }

    // Calculate token usage and cost
    const tokenUsage = result.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };

    // Cost per 1K tokens (in USD)
    const costPer1K = {
      'anthropic/claude-3-haiku': 0.0005,
      'deepseek-ai/deepseek-chat-7b': 0.0001
    };

    const modelCost = costPer1K[modelId as keyof typeof costPer1K] || costPer1K['anthropic/claude-3-haiku'];
    const cost = (tokenUsage.total_tokens / 1000) * modelCost;

    return {
      ...aiResponse,
      tokenUsage,
      cost
    };
  } catch (error) {
    console.error('Error categorizing thought:', error);
    // Default to note type if AI categorization fails
    return {
      thoughtType: 'note',
      processedContent: {
        title: 'Uncategorized Thought',
        details: content
      },
      tokenUsage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      cost: 0
    };
  }
}
