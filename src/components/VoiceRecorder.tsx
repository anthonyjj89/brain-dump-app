'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing?: boolean;
  onError?: () => void;
}

export default function VoiceRecorder({ onRecordingComplete, isProcessing, onError }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context and analyser
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Configure analyser
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      
      // Get supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      console.log('Using MIME type:', mimeType);

      // Start recording
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('Recorded chunk size:', e.data.size, 'bytes');
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log('Final recording size:', blob.size, 'bytes');
        console.log('Recording format:', blob.type);
        onRecordingComplete(blob);
      };
      
      // Collect data every 100ms for smoother visualization
      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      
      // Start visualizer
      const updateVisualizer = () => {
        if (!analyserRef.current || !isRecording) return;
        
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Convert to percentage values for visualization
        const normalizedData = Array.from(dataArray).map(value => value / 255 * 100);
        setAudioData(normalizedData.slice(0, 32)); // Use first 32 values for visualization
        
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      
      updateVisualizer();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      onError?.();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setAudioData([]);
    }
  };

  return (
    <div className="relative">
      <div className="h-32 bg-slate-900 rounded-lg flex items-center justify-center p-4 overflow-hidden">
        {isRecording ? (
          <div className="flex items-center gap-1 h-full w-full">
            {audioData.map((value, index) => (
              <div
                key={index}
                className="flex-1 bg-blue-500/50 rounded-full"
                style={{
                  height: `${Math.max(15, value)}%`,
                  transition: 'height 0.1s ease'
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 flex flex-col items-center gap-2">
            <span className="text-3xl">🎤</span>
            <span className="text-sm">Click to start recording</span>
          </div>
        )}
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
          isRecording
            ? 'bg-red-600 hover:bg-red-500'
            : 'bg-blue-600 hover:bg-blue-500'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isProcessing ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : isRecording ? (
          <span className="text-xl">⏹️</span>
        ) : (
          <span className="text-xl">⏺️</span>
        )}
      </button>
    </div>
  );
}
