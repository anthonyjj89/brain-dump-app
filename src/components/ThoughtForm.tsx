'use client';

import { useState, useRef, useEffect } from 'react';
import ProcessingStatus from './ProcessingStatus';

interface AudioVisualizerProps {
  state: 'idle' | 'recording' | 'processing';
  volume: number;
}

function AudioVisualizer({ state, volume }: AudioVisualizerProps) {
  return (
    <div className="relative w-32 h-32">
      {/* Base circle */}
      <div className={`
        absolute inset-0 rounded-full
        ${state === 'recording' ? 'bg-red-500' : state === 'processing' ? 'bg-yellow-500' : 'bg-blue-500'}
        transition-all duration-200
      `} />

      {/* Pulsing circle */}
      <div className={`
        absolute inset-0 rounded-full
        ${state === 'recording' ? 'bg-red-500' : state === 'processing' ? 'bg-yellow-500' : 'bg-blue-500'}
        transform transition-all duration-200
        ${state === 'recording'
          ? 'animate-none scale-100'
          : state === 'processing'
          ? 'animate-spin'
          : 'animate-breathe'
        }
      `} />

      {/* Volume indicator */}
      {state === 'recording' && (
        <div
          className="absolute inset-0 rounded-full border-4 border-white transform transition-all duration-100"
          style={{
            transform: `scale(${1 + Math.min(volume * 1.5, 1)})`,
            opacity: 0.5
          }}
        />
      )}

      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center text-2xl text-white">
        {state === 'recording' ? '🎙️' : state === 'processing' ? '⏳' : '🎤'}
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
  const [foundItems, setFoundItems] = useState<Array<{ type: 'task' | 'event' | 'note'; text: string }>>([]);
  
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

      // Set up media recorder
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        setRecordingState('processing');
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        
        // Create form data
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('type', 'voice');
        
        try {
          const response = await fetch('/api/thoughts', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) throw new Error('Failed to save thought');
          
          const data = await response.json();
          
            // Show transcribed text immediately
            if (data.data) {
              const { transcribedText: text, items } = data.data;
              
              // Set transcribed text first
              setTranscribedText(text);

              // Then set found items after a short delay
              setTimeout(() => {
                setFoundItems(items.map((item: any) => ({
                  type: item.thoughtType,
                  text: item.content
                })));
              }, 500);

              // Reset recording state but keep display
              window.dispatchEvent(new Event('thought-created'));
              setRecordingState('idle');
            }
          
          // Clear form
          setContent('');
          audioChunks.current = [];
        } catch (error) {
          console.error('Error saving thought:', error);
          setRecordingState('idle');
        }
      };

      mediaRecorder.current.start();
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

        {/* Processing Status - Show immediately when text is ready */}
        <div className="w-full max-w-full overflow-hidden">
          {transcribedText && (
            <ProcessingStatus
              transcribedText={transcribedText}
              foundItems={foundItems}
            />
          )}
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
