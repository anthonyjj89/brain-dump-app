'use client';

import { useState, useRef, useEffect } from 'react';
import ProcessingStatus from './ProcessingStatus';

interface AudioVisualizerProps {
  state: 'idle' | 'recording' | 'processing';
  volume: number;
}

function AudioVisualizer({ state, volume }: AudioVisualizerProps) {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Background gradient with glow */}
      <div className={`
        absolute inset-0 rounded-full
        ${state === 'recording' 
          ? 'bg-gradient-to-r from-red-500 to-pink-600 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
          : state === 'processing'
          ? 'bg-gradient-to-r from-yellow-500 to-orange-600 shadow-[0_0_30px_rgba(234,179,8,0.5)]'
          : 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_30px_rgba(59,130,246,0.5)]'
        }
        transition-all duration-500 ease-in-out
        ${state === 'recording' ? 'scale-110' : 'scale-100'}
      `} />

      {/* Animated rings */}
      {state === 'recording' && (
        <>
          <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
          <div
            className="absolute inset-0 rounded-full border-2 border-white/20 transition-all duration-200"
            style={{
              transform: `scale(${1 + Math.min(volume * 1.2, 1.2)})`,
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-white/10 transition-all duration-200"
            style={{
              transform: `scale(${1 + Math.min(volume * 1.5, 1.5)})`,
            }}
          />
        </>
      )}

      {/* Icon with animation */}
      <div className="relative z-10 text-2xl text-white transition-transform duration-200">
        {state === 'recording' ? (
          <div className="animate-pulse">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
        ) : state === 'processing' ? (
          <div className="w-10 h-10 border-4 border-t-transparent border-white rounded-full animate-spin" />
        ) : (
          <svg className="w-10 h-10 hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        )}
      </div>
    </div>
  );
}

export default function ThoughtForm() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [showText, setShowText] = useState(false);
  const [content, setContent] = useState('');
  const [volume, setVolume] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [segments, setSegments] = useState<string[]>([]);
  const [foundItems, setFoundItems] = useState<Array<{ type: 'task' | 'event' | 'note'; text: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const analyzer = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const animationFrame = useRef<number>();

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const updateVolume = () => {
    if (!analyzer.current || !dataArray.current) return;
    
    analyzer.current.getByteFrequencyData(dataArray.current);
    const average = dataArray.current.reduce((a, b) => a + b) / dataArray.current.length;
    const normalizedVolume = average / 128; // 128 is half of possible byte value (0-255)
    
    setVolume(normalizedVolume);
    animationFrame.current = requestAnimationFrame(updateVolume);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context and analyzer
      audioContext.current = new AudioContext();
      const source = audioContext.current.createMediaStreamSource(stream);
      analyzer.current = audioContext.current.createAnalyser();
      analyzer.current.fftSize = 256;
      source.connect(analyzer.current);
      
      dataArray.current = new Uint8Array(analyzer.current.frequencyBinCount);
      
      // Start volume monitoring
      updateVolume();

      // Set up media recorder with timeslice for streaming
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      audioChunks.current = [];

      // Handle data chunks during recording
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        } else {
          console.warn('Empty audio chunk received');
        }
      };

      mediaRecorder.current.onstop = async () => {
        setRecordingState('processing');
        setError(null);
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        
        // Check audio blob size
        if (audioBlob.size === 0) {
          setError('No audio recorded. Please try again.');
          setRecordingState('idle');
          return;
        }

        console.log('Audio blob size:', audioBlob.size);
        setIsTranscribing(true);
        
        // Send final audio for complete processing
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('type', 'complete');
        
        try {
          const response = await fetch('/api/thoughts/stream', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) throw new Error('Failed to save thought');

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              try {
                const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix

                switch (data.type) {
                  case 'transcription':
                    setTranscribedText(data.text);
                    setIsTranscribing(false);
                    break;
                  case 'segments':
                    setSegments(data.segments);
                    break;
                  case 'complete':
                    setFoundItems(data.thoughts);
                    setRecordingState('idle');
                    setIsTranscribing(false);
                    window.dispatchEvent(new Event('thought-created'));
                    break;
                  case 'error':
                    setError(data.message);
                    setRecordingState('idle');
                    setIsTranscribing(false);
                    break;
                }
              } catch (error) {
                console.error('Error parsing chunk:', error);
              }
            }
          }

          // Clear form and reset states
          setContent('');
          setSegments([]);
          setError(null);
          audioChunks.current = [];
        } catch (error) {
          console.error('Error saving thought:', error);
          setError(error instanceof Error ? error.message : 'Failed to process audio');
          setRecordingState('idle');
          setIsTranscribing(false);
        }
      };

      // Start recording with smaller chunks for more frequent updates
      mediaRecorder.current.start(500);
      setRecordingState('recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recordingState === 'recording') {
      mediaRecorder.current.stop();
      setVolume(0);
      
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    }
  };

  const handleSubmitText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type: 'text'
        })
      });

      if (!response.ok) throw new Error('Failed to save thought');
      
      window.dispatchEvent(new Event('thought-created'));
      setContent('');
    } catch (error) {
      console.error('Error saving thought:', error);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-[600px] mx-auto">
      {/* Voice Input */}
      <div className="w-full">
        <button
          onClick={recordingState === 'recording' ? stopRecording : startRecording}
          disabled={recordingState === 'processing'}
          className="focus:outline-none disabled:opacity-50"
        >
          <AudioVisualizer state={recordingState} volume={volume} />
        </button>

        {/* Processing Status with animations */}
        <div className="w-full max-w-full overflow-hidden mt-8">
          {error ? (
            <div className="bg-red-500/10 backdrop-blur rounded-xl p-6 border border-red-500/50 animate-fade-up">
              <div className="text-sm font-medium text-red-400 mb-2">Error:</div>
              <div className="text-red-300">{error}</div>
            </div>
          ) : isTranscribing && !transcribedText ? (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 animate-fade-up">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
                <div className="text-slate-400">Transcribing audio...</div>
              </div>
            </div>
          ) : transcribedText ? (
            <div className="space-y-6 animate-fade-up">
              {/* Voice Input Display */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
                <div className="text-sm font-medium text-slate-400 mb-2">Voice Input:</div>
                <div className="text-gray-300 font-mono pl-4 py-2 bg-slate-800/30 rounded-lg border-l-2 border-blue-500/50 animate-type-in">
                  "{transcribedText}"
                </div>
              </div>
              
              {/* Processing Status */}
              <ProcessingStatus
                transcribedText={transcribedText}
                segments={segments}
                foundItems={foundItems}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Text Toggle */}
      <button
        onClick={() => setShowText(!showText)}
        className="text-sm text-gray-400 hover:text-white transition-colors mb-4"
      >
        {showText ? 'Switch to voice' : 'Switch to text'}
      </button>

      {/* Text Input */}
      {showText && (
        <form onSubmit={handleSubmitText} className="w-full">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your thoughts..."
            className="w-full h-32 px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors"
          >
            Save Thought
          </button>
        </form>
      )}
    </div>
  );
}
