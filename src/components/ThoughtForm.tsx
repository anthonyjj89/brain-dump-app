'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, AlertCircle, Type } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import ProcessingStatus from './ProcessingStatus';
import MicrophoneSelector from './MicrophoneSelector';

interface AudioVisualizerProps {
  state: 'idle' | 'recording' | 'processing';
  volume: number;
  onClick?: () => void;
}

function AudioVisualizer({ state, volume, onClick }: AudioVisualizerProps) {
  return (
    <Button
      onClick={onClick}
      disabled={state === 'processing'}
      variant="ghost"
      size="lg"
      className={`
        relative w-32 h-32 rounded-full p-0
        ${state === 'recording' 
          ? 'bg-destructive hover:bg-destructive'
          : state === 'processing'
          ? 'bg-muted hover:bg-muted cursor-not-allowed'
          : 'bg-primary hover:bg-primary/90'
        }
        transition-all duration-300
      `}
    >
      {/* Pulse rings */}
      {state === 'recording' && (
        <>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-20"></span>
          <span
            className="absolute inline-flex rounded-full h-full w-full border-4 border-white/20 transition-transform duration-200"
            style={{
              transform: `scale(${1 + Math.min(volume * 0.8, 0.8)})`,
            }}
          ></span>
        </>
      )}
            
      {/* Icon */}
      <div className="relative z-10 flex items-center justify-center">
        {state === 'recording' ? (
          <Mic className="h-10 w-10 text-white animate-pulse" />
        ) : state === 'processing' ? (
          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
        ) : (
          <Mic className="h-10 w-10 text-white" />
        )}
      </div>
    </Button>
  );
}

export default function ThoughtForm() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [content, setContent] = useState('');
  const [volume, setVolume] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [segments, setSegments] = useState<string[]>([]);
  const [foundItems, setFoundItems] = useState<Array<{ type: 'task' | 'event' | 'note'; text: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>('');
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const analyzer = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const animationFrame = useRef<number>();

  useEffect(() => {
    // Load saved microphone preference from localStorage
    const savedMicrophoneId = localStorage.getItem('selectedMicrophoneId');
    if (savedMicrophoneId) {
      setSelectedMicrophoneId(savedMicrophoneId);
    }
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);
  
  // Handle microphone selection
  const handleMicrophoneSelected = (deviceId: string) => {
    setSelectedMicrophoneId(deviceId);
    localStorage.setItem('selectedMicrophoneId', deviceId);
  };

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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          deviceId: selectedMicrophoneId ? { exact: selectedMicrophoneId } : undefined
        } 
      });
      
      // Set up audio context and analyzer
      audioContext.current = new AudioContext();
      const source = audioContext.current.createMediaStreamSource(stream);
      analyzer.current = audioContext.current.createAnalyser();
      analyzer.current.fftSize = 256;
      source.connect(analyzer.current);
      
      dataArray.current = new Uint8Array(analyzer.current.frequencyBinCount);
      
      // Start volume monitoring
      updateVolume();

      // Detect browser
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isOpera = /opera|opr/.test(userAgent);
      const isChrome = /chrome/.test(userAgent) && !isOpera;
      const isSafari = /safari/.test(userAgent) && !isChrome;
      
      console.log('Browser detection:', { isIOS, isOpera, isChrome, isSafari });
      
      // Get supported MIME types based on browser
      const getMimeType = () => {
        // Try browser-specific preferred formats first
        if (isIOS) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
        } else if (isOpera) {
          if (MediaRecorder.isTypeSupported('audio/ogg')) return 'audio/ogg';
        } else if (isChrome || isSafari) {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
        }
        
        // Fall back to checking general support
        const types = [
          'audio/webm',
          'audio/mp4',
          'audio/ogg',
          'audio/wav'
        ];
        
        const supported = types.find(type => MediaRecorder.isTypeSupported(type));
        console.log('Supported MIME type:', supported);
        return supported || 'audio/webm';
      };

      // Set up media recorder with browser-specific settings
      const mimeType = getMimeType();
      const audioBitsPerSecond = isIOS ? 64000 : 128000;
      
      console.log('Initializing MediaRecorder with:', {
        mimeType,
        audioBitsPerSecond,
        browser: isIOS ? 'iOS' : isOpera ? 'Opera' : isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Other'
      });
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond
      });

      // Add error handler
      mediaRecorder.current.onerror = (event: Event) => {
        console.error('MediaRecorder error:', {
          type: event.type,
          message: 'Recording failed',
          timestamp: new Date().toISOString()
        });
        setError('Recording failed. Please try again.');
        setRecordingState('idle');
      };
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
        console.log('MediaRecorder stopped');
        setRecordingState('processing');
        setError(null);
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        
        // Check audio blob size
        if (audioBlob.size === 0) {
          setError('No audio recorded. Please try again.');
          setRecordingState('idle');
          return;
        }

        console.log('Audio blob details:', {
          size: audioBlob.size,
          type: audioBlob.type,
          lastModified: new Date().toISOString()
        });
        setIsTranscribing(true);
        
        // Create a more compatible audio blob based on browser
        let processedBlob = audioBlob;
        
        // For iOS, ensure we're using a compatible format
        if (isIOS && audioBlob.type !== 'audio/mp4' && MediaRecorder.isTypeSupported('audio/mp4')) {
          try {
            // Try to convert to MP4 format for iOS
            const arrayBuffer = await audioBlob.arrayBuffer();
            processedBlob = new Blob([arrayBuffer], { type: 'audio/mp4' });
            console.log('Converted blob for iOS compatibility:', {
              originalType: audioBlob.type,
              newType: processedBlob.type,
              size: processedBlob.size
            });
          } catch (error) {
            console.warn('Failed to convert audio format for iOS:', error);
            // Continue with original blob
          }
        }
        
        // Log detailed information about the audio blob
        console.log('Audio blob details before sending:', {
          type: processedBlob.type,
          size: processedBlob.size,
          browser: isIOS ? 'iOS' : isOpera ? 'Opera' : isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Other'
        });
        
        // Send final audio for complete processing
        const formData = new FormData();
        
        try {
          // Ensure the blob is properly added to the form data
          formData.append('audio', processedBlob);
          formData.append('type', 'complete');
          formData.append('browser', isIOS ? 'ios' : isOpera ? 'opera' : isChrome ? 'chrome' : isSafari ? 'safari' : 'other');
          
          // Add additional metadata to help with debugging
          formData.append('audioSize', processedBlob.size.toString());
          formData.append('audioType', processedBlob.type);
          formData.append('timestamp', new Date().toISOString());
        } catch (error) {
          console.error('Error creating form data:', error);
          setError('Failed to prepare audio data. Please try again.');
          setRecordingState('idle');
          setIsTranscribing(false);
          return;
        }
        
        try {
          console.log('Sending audio to API...');
          const response = await fetch('/api/thoughts/stream', {
            method: 'POST',
            body: formData
          });

          console.log('API Response:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText
          });

          if (!response.ok) {
            throw new Error(`Failed to save thought: ${response.status} ${response.statusText}`);
          }

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          while (true) {
            console.log('Reading stream chunk...');
            const { value, done } = await reader.read();
            if (done) {
              console.log('Stream complete');
              break;
            }
            console.log('Received chunk:', value?.length, 'bytes');

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
      console.log('Stopping recording...');
      mediaRecorder.current.stop();
      
      // Stop all tracks in the stream
      mediaRecorder.current.stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      
      setVolume(0);
      
      if (animationFrame.current) {
        console.log('Canceling animation frame');
        cancelAnimationFrame(animationFrame.current);
      }
      if (audioContext.current) {
        console.log('Closing audio context');
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
    <div className="flex flex-col items-center w-full mx-auto">
      <Card className="w-full bg-card border shadow-sm">
        <CardHeader className="px-2 pt-2 sm:px-4 sm:pt-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium md:text-xl">New Dump</CardTitle>
            <div className="flex items-center gap-3 bg-card rounded-lg px-2 py-1 sm:px-3 sm:py-1.5">
              <span className="text-xs sm:text-sm text-muted-foreground">Voice</span>
              <Switch 
                checked={inputMode === 'text'}
                onCheckedChange={(checked) => setInputMode(checked ? 'text' : 'voice')}
              />
              <span className="text-xs sm:text-sm text-muted-foreground">Text</span>
            </div>
          </div>
          <div className="flex justify-end items-center mt-2 sm:mt-4">
            {inputMode === 'voice' && (
              <div className="w-full md:w-auto">
                <MicrophoneSelector 
                  onDeviceSelected={handleMicrophoneSelected}
                  selectedDeviceId={selectedMicrophoneId}
                />
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="px-2 pb-6 sm:px-4 flex flex-col items-center">
          {inputMode === 'voice' ? (
            <div className="py-6 flex items-center justify-center w-full h-full">
              <AudioVisualizer 
                state={recordingState} 
                volume={volume} 
                onClick={recordingState === 'recording' ? stopRecording : startRecording}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmitText} className="w-full">
              <div className="grid gap-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your thoughts..."
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button type="submit" className="w-full">Save Thought</Button>
              </div>
            </form>
          )}
        </CardContent>
        
        {/* Error Messages */}
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}
        
        {/* Processing Result Display */}
        <CardFooter className="px-0 flex flex-col items-stretch w-full">
          <div className="w-full max-w-full overflow-hidden mt-8">
            {isTranscribing && !transcribedText ? (
              <div className="bg-card/50 backdrop-blur rounded-lg p-6 border animate-pulse">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <div className="text-muted-foreground">Transcribing audio...</div>
                </div>
              </div>
            ) : transcribedText ? (
              <div className="space-y-6 animate-fade-in">
                {/* Voice Input Display */}
                <div className="bg-card/50 backdrop-blur rounded-lg p-6 border">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Voice Input:</div>
                  <div className="text-foreground pl-4 py-2 bg-muted/30 rounded-lg border-l-2 border-primary/50 animate-type-in">
                    &quot;{transcribedText}&quot;
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
        </CardFooter>
      </Card>
    </div>
  );
}
