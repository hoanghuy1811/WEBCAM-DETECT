import React, { ChangeEvent } from 'react';
import { ReferenceFace } from '../types';
import { fileToBase64, resizeImage } from '../utils/imageUtils';

interface DatabasePanelProps {
  faces: ReferenceFace[];
  onAddFaces: (faces: ReferenceFace[]) => void;
  onClear: () => void;
  onRemoveFace: (id: string) => void;
}

export const DatabasePanel: React.FC<DatabasePanelProps> = ({ faces, onAddFaces, onClear, onRemoveFace }) => {
  
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFaces: ReferenceFace[] = [];
      
      // Convert FileList to Array
      const files = Array.from(e.target.files);

      for (const file of files) {
        // Use filename (minus extension) as the person's name
        const name = file.name.replace(/\.[^/.]+$/, "");
        try {
          const rawBase64 = await fileToBase64(file);
          // Optimization: Resize ref images to save bandwidth/tokens
          const optimizedBase64 = await resizeImage(rawBase64, 512);
          
          newFaces.push({
            id: Math.random().toString(36).substring(7),
            name: name,
            data: optimizedBase64,
            mimeType: file.type
          });
        } catch (err) {
          console.error(`Failed to load ${file.name}`, err);
        }
      }
      onAddFaces(newFaces);
      // Reset input value so the same files can be selected again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Reference Database
        </h2>
        <span className="text-xs font-mono text-zinc-500">{faces.length} ENTRIES</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar mb-4 space-y-2">
        {faces.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-lg p-6">
            <p className="text-center text-sm">No biometric data.</p>
            <p className="text-center text-xs mt-1">Upload images to begin.</p>
          </div>
        ) : (
          faces.map((face) => (
            <div key={face.id} className="flex items-center gap-3 bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50 hover:border-emerald-500/30 transition-colors group">
              <div className="w-10 h-10 rounded bg-zinc-900 overflow-hidden flex-shrink-0">
                <img src={`data:${face.mimeType};base64,${face.data}`} alt={face.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{face.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono">ID: {face.id.substring(0,6)}</p>
              </div>
              <button 
                onClick={() => onRemoveFace(face.id)}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                title="Remove Face"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <label className="flex items-center justify-center w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer transition-all text-sm font-medium shadow-lg shadow-emerald-900/20 group">
          <span className="group-hover:scale-105 transition-transform">Load Reference Faces</span>
          {/* Allow directory selection via webkitdirectory if supported, else multiple files */}
          <input 
            type="file" 
            className="hidden" 
            multiple 
            accept="image/*"
            onChange={handleFileUpload}
          />
        </label>
        {faces.length > 0 && (
          <button 
            onClick={onClear}
            className="w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
          >
            Purge Database
          </button>
        )}
      </div>
    </div>
  );
};