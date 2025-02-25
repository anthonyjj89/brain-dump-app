'use client';

import { useState, useEffect, useRef } from 'react';
import { IoMdSettings, IoMdMic, IoMdCheckmark } from 'react-icons/io';

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        title="Microphone settings"
      >
        <IoMdMic className="text-blue-400" />
        <span className="max-w-[150px] truncate">{getSelectedDeviceName()}</span>
        <IoMdSettings className="text-gray-400" />
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-slate-700">
            <h3 className="font-medium text-white">Select Microphone</h3>
            <p className="text-xs text-gray-400 mt-1">
              Choose which microphone to use for voice input
            </p>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {devices.length === 0 ? (
              <div className="p-3 text-sm text-gray-400">
                No microphones detected
              </div>
            ) : (
              <ul>
                {devices.map(device => (
                  <li key={device.deviceId}>
                    <button
                      onClick={() => selectDevice(device.deviceId)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-700 transition-colors ${
                        device.deviceId === selectedDeviceId ? 'bg-slate-700' : ''
                      }`}
                    >
                      <span className="truncate">{device.label || 'Unnamed Microphone'}</span>
                      {device.deviceId === selectedDeviceId && (
                        <IoMdCheckmark className="text-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Microphone test section */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Test Microphone</span>
              <button
                onClick={isTestingMic ? stopMicTest : startMicTest}
                className={`px-2 py-1 text-xs rounded ${
                  isTestingMic 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-blue-600 hover:bg-blue-500'
                } transition-colors`}
              >
                {isTestingMic ? 'Stop' : 'Test'}
              </button>
            </div>
            
            {/* Volume meter */}
            <div className="h-6 bg-slate-900 rounded overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-100"
                style={{ width: `${Math.min(volume * 100, 100)}%` }}
              />
            </div>
            
            {isTestingMic && (
              <p className="text-xs text-gray-400 mt-1">
                {volume < 0.1 
                  ? 'No sound detected. Try speaking louder or check if the correct microphone is selected.' 
                  : volume < 0.3 
                    ? 'Low volume detected. Try speaking louder.' 
                    : 'Microphone is working!'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
