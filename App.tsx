import React, { useState, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { DatabasePanel } from './components/DatabasePanel';
import { ActivityLog } from './components/ActivityLog';
import { ReferenceFace, LogEntry, AppState } from './types';
import { identifyFace } from './services/geminiService';

const COOLDOWN_MS = 60000; // 1 minute constraint

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [referenceFaces, setReferenceFaces] = useState<ReferenceFace[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastMatchName, setLastMatchName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // To manage cooldowns efficiently without causing re-renders for every check
  // we store timestamps in a Ref or a generic Map.
  const cooldownsRef = React.useRef<Map<string, number>>(new Map());

  const handleAddFaces = (newFaces: ReferenceFace[]) => {
    setReferenceFaces(prev => [...prev, ...newFaces]);
  };

  const handleRemoveFace = (id: string) => {
    setReferenceFaces(prev => prev.filter(face => face.id !== id));
  };

  const handleClearFaces = () => {
    setReferenceFaces([]);
    setAppState(AppState.IDLE);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const toggleMonitoring = () => {
    if (appState === AppState.IDLE) {
      if (referenceFaces.length === 0) {
        alert("Please add reference faces to the database first.");
        return;
      }
      setAppState(AppState.MONITORING);
    } else {
      setAppState(AppState.IDLE);
      setLastMatchName(null);
    }
  };

  const handleFrameCapture = useCallback(async (base64Frame: string) => {
    if (isProcessing || referenceFaces.length === 0) return;

    setIsProcessing(true);

    try {
      const results = await identifyFace(base64Frame, referenceFaces);
      
      const validMatches = results.filter(r => r.matchFound && r.matchedName && r.confidence > 0.5);
      const newMatchesNames: string[] = [];
      const now = Date.now();

      // Process each valid match found in the frame
      validMatches.forEach(result => {
        const name = result.matchedName!;
        const lastSeen = cooldownsRef.current.get(name) || 0;

        // Constraint 5: 1 minute between consecutive matches for the SAME person
        if (now - lastSeen > COOLDOWN_MS) {
            // Update cooldown
            cooldownsRef.current.set(name, now);
            newMatchesNames.push(name);

            // Add Log
            const newLog: LogEntry = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                matchedName: name,
                thumbnail: base64Frame, // Save thumbnail for log
                maskDetected: result.maskDetected,
                confidence: result.confidence
            };
            setLogs(prev => [...prev, newLog]);
        } else {
            console.log(`Skipping ${name} due to cooldown.`);
        }
      });

      // Visual Feedback for all new matches in this frame
      if (newMatchesNames.length > 0) {
          // Combine names if multiple people are detected
          setLastMatchName(newMatchesNames.join(" + "));
          // Clear visual overlay after 3 seconds
          setTimeout(() => setLastMatchName(null), 3000);
      }

    } catch (error) {
      console.error("Recognition loop error", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, referenceFaces]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 p-4 md:p-6 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="M12 16v3"/><path d="M12 8V5"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">SENTINEL <span className="text-emerald-500">ID</span></h1>
            <p className="text-xs text-zinc-500 font-mono">SECURE BIOMETRIC GATEWAY // v1.0.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
            {/* API Key Warning (Implicit in logic, but good for UI if env var fails, though we assume env var is set per instructions) */}
            {!process.env.API_KEY && (
                 <div className="px-3 py-1 bg-red-900/30 border border-red-800 text-red-400 text-xs rounded font-mono">
                    WARNING: API_KEY MISSING
                 </div>
            )}
            
            <button
                onClick={toggleMonitoring}
                className={`
                    flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg
                    ${appState === AppState.IDLE 
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700' 
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50'}
                `}
            >
                {appState === AppState.IDLE ? (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        START MONITORING
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                        STOP SYSTEM
                    </>
                )}
            </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Col: Camera (8 cols) */}
        <div className="lg:col-span-8 h-full min-h-[400px] flex flex-col">
            <CameraView 
                appState={appState} 
                onFrameCapture={handleFrameCapture} 
                lastMatchName={lastMatchName}
                processing={isProcessing}
            />
        </div>

        {/* Right Col: Data & Logs (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full min-h-0">
            <div className="h-1/3 min-h-[200px]">
                <DatabasePanel 
                    faces={referenceFaces} 
                    onAddFaces={handleAddFaces} 
                    onClear={handleClearFaces}
                    onRemoveFace={handleRemoveFace}
                />
            </div>
            <div className="h-2/3 min-h-[300px]">
                <ActivityLog logs={logs} onClearLogs={handleClearLogs} />
            </div>
        </div>

      </div>
    </div>
  );
}