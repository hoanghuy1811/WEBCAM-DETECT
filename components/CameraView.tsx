import React, { useRef, useEffect, useState } from 'react';
import { AppState } from '../types';

interface CameraViewProps {
  appState: AppState;
  onFrameCapture: (base64: string) => void;
  lastMatchName: string | null;
  processing: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({ 
  appState, 
  onFrameCapture, 
  lastMatchName,
  processing 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        // Prefer user-facing camera (Face ID style)
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play();
             setStreamActive(true);
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        alert("Cannot access webcam. Please allow permissions.");
      }
    };

    startCamera();

    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Capture Loop
  useEffect(() => {
    let intervalId: any;

    if (appState === AppState.MONITORING && streamActive) {
      intervalId = setInterval(() => {
        if (videoRef.current && canvasRef.current && !processing) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Get JPEG base64 (without prefix handled by receiver or helper)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64 = dataUrl.split(',')[1]; 
            onFrameCapture(base64);
          }
        }
      }, 4000); // Check every 4 seconds to balance API limits and responsiveness
    }

    return () => clearInterval(intervalId);
  }, [appState, streamActive, onFrameCapture, processing]);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800 group">
      {/* Video Feed */}
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect for selfie cam
        playsInline 
        muted 
      />
      
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid Overlay */}
        <div className="w-full h-full opacity-20 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Corner Brackets */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-emerald-500/50 rounded-tl-lg"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-emerald-500/50 rounded-tr-lg"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-emerald-500/50 rounded-bl-lg"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-emerald-500/50 rounded-br-lg"></div>

        {/* Status Indicators */}
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-zinc-700">
          <div className={`w-2 h-2 rounded-full ${appState === AppState.MONITORING ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className="text-xs font-mono text-white uppercase tracking-wider">
            {appState === AppState.MONITORING ? 'LIVE FEED // ACTIVE' : 'STANDBY'}
          </span>
        </div>

        {/* Processing Indicator */}
        {processing && (
           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
             <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-full animate-progress origin-left"></div>
             </div>
             <span className="text-xs font-mono text-emerald-400 animate-pulse">ANALYZING BIOMETRICS...</span>
           </div>
        )}

        {/* Scanning Laser Effect */}
        {appState === AppState.MONITORING && !processing && (
          <div className="scan-line"></div>
        )}
        
        {/* Match Overlay */}
        {lastMatchName && (
          <div className="absolute inset-0 flex items-center justify-center animate-flash">
             <div className="border-4 border-emerald-500 p-6 rounded-lg bg-emerald-900/20 backdrop-blur-sm shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <h2 className="text-2xl font-bold text-emerald-100 text-center uppercase tracking-widest">Target Identified</h2>
                <div className="text-4xl font-mono font-bold text-white text-center mt-2">{lastMatchName}</div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};