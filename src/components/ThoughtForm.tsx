'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import VoiceRecorder from './VoiceRecorder';

interface ThoughtFormProps {
  onSubmitSuccess?: () => void;
}

interface ThoughtInput {
  content: string;
  type: 'text' | 'voice';
  modelId?: string;
  rawAudio?: Blob;
}

type InputMode = 'text' | 'voice';
type ProcessingState = 
  | 'idle'
  | 'recording'
  | 'processing'
  | 'transcribing'
  | 'error'
  | 'success';

const models = {
  text: [
    {
      id: 'anthropic/claude-3-haiku',
      name: 'Claude 3 Haiku',
      icon: '🤖',
      description: 'Fast, efficient categorization',
      costPer1k: '$0.0005'
    },
    {
      id: 'deepseek-ai/deepseek-chat-7b',
      name: 'DeepSeek Chat',
      icon: '🧠',
      description: 'Cost-effective, good for basic tasks',
      costPer1k: '$0.0001'
    }
  ],
  voice: {
    id: 'openai/whisper',
    name: 'OpenAI Whisper',
    icon: '🎙️',
    description: 'High-accuracy voice transcription',
    costPerMinute: '$0.006'
  }
};

async function submitThought(input: ThoughtInput) {
  // Create form data if we have audio
  if (input.rawAudio) {
    try {
      console.log('Preparing audio submission:', {
        type: input.rawAudio.type,
        size: input.rawAudio.size
      });

      const formData = new FormData();
      formData.append('audio', new File([input.rawAudio], 'recording.webm', {
        type: input.rawAudio.type // Keep original WebM format
      }));
      formData.append('content', input.content);
      formData.append('type', input.type);
      if (input.modelId) formData.append('modelId', input.modelId);

      const response = await fetch('/api/thoughts', {
        method: 'POST',
        // Let browser set Content-Type with boundary
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Voice submission error:', errorData);
        throw new Error(errorData.error || 'Failed to submit thought');
      }

      return response.json();
    } catch (error) {
      console.error('Voice submission failed:', error);
      throw error;
    }
  }

  // Regular JSON submission for text
  const response = await fetch('/api/thoughts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to submit thought');
  }

  return response.json();
}

export default function ThoughtForm({ onSubmitSuccess }: ThoughtFormProps) {
  const [content, setContent] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [selectedModel, setSelectedModel] = useState(models.text[0].id);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const queryClient = useQueryClient();

  useEffect(() => {
    const savedModel = localStorage.getItem('selectedAIModel');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: submitThought,
    onSuccess: (data) => {
      setContent('');
      setAudioBlob(null);
      setProcessingState('idle');
      onSubmitSuccess?.();
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
      
      // Log token usage and cost
      console.log('Token Usage:', data.data.tokenUsage);
      console.log('Cost:', data.data.cost);
    },
    onError: () => {
      setProcessingState('error');
    }
  });

  const handleVoiceRecordingComplete = (blob: Blob) => {
    console.log('Voice recording complete:', {
      type: blob.type,
      size: blob.size
    });
    setAudioBlob(blob);
    setProcessingState('processing');
    // Set content to timestamp for now
    setContent(`Voice recording from ${new Date().toLocaleString()}`);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('selectedAIModel', modelId);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({
      content,
      type: inputMode,
      modelId: inputMode === 'text' ? selectedModel : models.voice.id,
      rawAudio: audioBlob || undefined
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mutation.isError && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong'}
        </div>
      )}

      {/* Input Type Selection */}
      <div className="mb-6">
        <div className="flex gap-4 p-1 bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
              inputMode === 'text' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>✍️ Text</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('voice')}
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
              inputMode === 'voice' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🎤 Voice</span>
          </button>
        </div>
      </div>

      {/* Text Model Selection */}
      {inputMode === 'text' && (
        <div className="mb-6 bg-slate-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-300">Processing Model</h3>
            <span className="text-xs text-gray-500">Cost per 1K tokens</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {models.text.map(model => (
              <button
                key={model.id}
                type="button"
                onClick={() => handleModelChange(model.id)}
                className={`relative p-4 rounded-lg border transition-all ${
                  selectedModel === model.id
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{model.icon}</span>
                  <span className="font-medium">{model.name}</span>
                </div>
                <div className="text-xs opacity-75">{model.costPer1k}</div>
                {selectedModel === model.id && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      {inputMode === 'text' ? (
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
            What&apos;s on your mind?
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-slate-600 rounded-lg shadow-inner
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              bg-slate-900
              text-gray-100
              placeholder-gray-500
              transition-all duration-200"
            placeholder="Type your thought here..."
            required
          />
        </div>
      ) : (
        <div className="mb-6 space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{models.voice.icon}</span>
              <div>
                <h3 className="font-medium text-white">{models.voice.name}</h3>
                <p className="text-xs text-gray-400">{models.voice.description}</p>
              </div>
            </div>
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              isProcessing={processingState === 'processing'}
              onError={() => setProcessingState('error')}
            />
            {processingState === 'processing' && (
              <div className="mt-3 text-sm text-blue-400 flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                Transcribing audio...
              </div>
            )}
            {processingState === 'error' && (
              <div className="mt-3 text-sm text-red-400 flex items-center gap-2">
                <span>⚠️</span>
                Failed to process audio. Please try again.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={mutation.isPending || (inputMode === 'voice' && !audioBlob)}
        className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200
          ${mutation.isPending || (inputMode === 'voice' && !audioBlob)
            ? 'bg-blue-800 cursor-not-allowed opacity-70' 
            : 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:scale-[1.02]'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900`}
      >
        {mutation.isPending ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {processingState === 'transcribing' ? 'Transcribing...' : 'Processing...'}
          </div>
        ) : (
          <>
            {inputMode === 'text' ? '💭 Dump Thought' : '🎙️ Process Recording'}
          </>
        )}
      </button>
    </form>
  );
}
