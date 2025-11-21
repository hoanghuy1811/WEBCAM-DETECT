import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface ActivityLogProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onClearLogs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Access Logs
        </h2>
        {logs.length > 0 && (
            <button 
                onClick={onClearLogs}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Clear
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {logs.length === 0 ? (
          <div className="text-zinc-600 text-xs font-mono text-center mt-10">
            > WAITING FOR SIGNALS...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 animate-fadeIn">
               <div className="w-12 h-12 rounded bg-zinc-900 overflow-hidden border border-zinc-700 flex-shrink-0">
                 <img src={`data:image/jpeg;base64,${log.thumbnail}`} alt="Capture" className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-emerald-400 truncate">{log.matchedName}</h3>
                    <span className="text-[10px] text-zinc-500 font-mono">{log.timestamp.toLocaleTimeString()}</span>
                 </div>
                 <div className="flex gap-2 mt-1">
                   <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded font-mono border border-zinc-700">
                     CONF: {(log.confidence * 100).toFixed(0)}%
                   </span>
                   {log.maskDetected && (
                     <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/30 text-blue-300 rounded font-mono border border-blue-800/50 flex items-center gap-1">
                       <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/></svg>
                       MASK
                     </span>
                   )}
                 </div>
               </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};