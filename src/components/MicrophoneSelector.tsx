'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Settings, Check, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MicrophoneSelectorProps {
  onDeviceSelected: (deviceId: string) => void;
  selectedDeviceId?: string;
}

export default function MicrophoneSelector({ onDeviceSelected, selectedDeviceId }: MicrophoneSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [volume, setVolume] = useState(0);
  
  const audioContext = useRef<AudioContext | null>(null);
  const analyzer = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const animationFrame = useRef<number>();
  const mediaStream = useRef<MediaStream | null>(null);
  
  // Load available audio input devices
  useEffect(() => {
    async function loadDevices() {
      try {
        // Request permission first to ensure we get device labels
        await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            // Stop the stream immediately after getting permission
            stream.getTracks().forEach(track => track.stop());
          });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setDevices(audioInputs);
        
        // If no device is selected and we have devices, select the first one
        if (!selectedDeviceId && audioInputs.length > 0) {
          onDeviceSelected(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error('Error loading audio devices:', error);
      }
    }
    
    loadDevices();
    
    // Add device change listener
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, [onDeviceSelected, selectedDeviceId]);
  
  // Clean up audio context and animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Start testing the selected microphone
  const startMicTest = async () => {
    try {
      // Stop any existing stream
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop());
      }
      
      // Get a new stream with the selected device
      mediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
        }
      });
      
      // Set up audio context and analyzer
      audioContext.current = new AudioContext();
      analyzer.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(mediaStream.current);
      source.connect(analyzer.current);
      
      // Configure analyzer
      analyzer.current.fftSize = 256;
      dataArray.current = new Uint8Array(analyzer.current.frequencyBinCount);
      
      // Start volume monitoring
      setIsTestingMic(true);
      updateVolume();
    } catch (error) {
      console.error('Error testing microphone:', error);
    }
  };
  
  // Stop testing the microphone
  const stopMicTest = () => {
    setIsTestingMic(false);
    setVolume(0);
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
    
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
  };
  
  // Update the volume meter
  const updateVolume = () => {
    if (!analyzer.current || !dataArray.current || !isTestingMic) return;
    
    analyzer.current.getByteFrequencyData(dataArray.current);
    const average = dataArray.current.reduce((a, b) => a + b, 0) / dataArray.current.length;
    const normalizedVolume = average / 128; // 128 is half of possible byte value (0-255)
    
    setVolume(normalizedVolume);
    animationFrame.current = requestAnimationFrame(updateVolume);
  };
  
  // Handle device selection
  const selectDevice = (deviceId: string) => {
    onDeviceSelected(deviceId);
    setIsOpen(false);
  };
  
  // Get the name of the currently selected device
  const getSelectedDeviceName = () => {
    const device = devices.find(d => d.deviceId === selectedDeviceId);
    return device?.label || 'Default Microphone';
  };
  
  return (
    <div className="relative">
      {/* Settings button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Mic className="h-4 w-4 text-primary" />
        <span className="max-w-[150px] truncate">{getSelectedDeviceName()}</span>
        <Settings className="h-4 w-4 text-muted-foreground" />
      </Button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <Card className="absolute top-full left-0 mt-2 w-80 z-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Select Microphone</CardTitle>
            <CardDescription>
              Choose which microphone to use for voice input
            </CardDescription>
          </CardHeader>
          
          <CardContent className="max-h-60 overflow-y-auto p-0">
            {devices.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                No microphones detected
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {devices.map(device => (
                  <li key={device.deviceId}>
                    <Button
                      onClick={() => selectDevice(device.deviceId)}
                      variant="ghost"
                      className={cn(
                        "w-full justify-between text-left px-4 py-2 rounded-none h-auto",
                        device.deviceId === selectedDeviceId ? "bg-secondary" : ""
                      )}
                    >
                      <span className="truncate">{device.label || 'Unnamed Microphone'}</span>
                      {device.deviceId === selectedDeviceId && (
                        <Check className="h-4 w-4 text-primary ml-2" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          
          {/* Microphone test section */}
          <CardFooter className="flex-col items-stretch border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Test Microphone</span>
              <Button
                onClick={isTestingMic ? stopMicTest : startMicTest}
                variant={isTestingMic ? "destructive" : "secondary"}
                size="sm"
              >
                {isTestingMic ? 'Stop' : 'Test'}
              </Button>
            </div>
            
            {/* Volume meter */}
            <div className="h-5 bg-secondary rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-100"
                style={{ width: `${Math.min(volume * 100, 100)}%` }}
              />
            </div>
            
            {isTestingMic && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center">
                <Volume2 className="h-3 w-3 mr-1" />
                {volume < 0.1 
                  ? 'No sound detected. Try speaking louder.' 
                  : volume < 0.3 
                    ? 'Low volume detected. Try speaking louder.' 
                    : 'Microphone is working!'}
              </p>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
