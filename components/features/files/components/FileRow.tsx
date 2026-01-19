
import React from 'react';
import { Folder, FileText, ChevronRight, CheckSquare, Square, Clock, ShieldCheck } from 'lucide-react';
import { FileNode, FileType } from '../../../../types/index.ts';
import { FileStatusBadge } from './FileStatusBadge.tsx';

interface FileRowProps {
  file: FileNode;
  isSelected: boolean;
  onNavigate: (id: string | null) => void;
  onPreview: (file: FileNode) => void;
  onToggleSelection: (fileId: string) => void;
}

export const FileRow: React.FC<FileRowProps> = ({ file, isSelected, onNavigate, onPreview, onToggleSelection }) => {
  const isFolder = file.type === FileType.FOLDER;
  
  return (
    <div 
      className={`group flex items-center px-6 py-3.5 hover:bg-blue-50/30 transition-all cursor-pointer relative border-b border-slate-50 last:border-0
        ${isSelected ? 'bg-blue-50/50' : ''}`}
      onClick={() => isFolder ? onNavigate(file.id) : onPreview(file)}
    >
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
      
      <div className="w-10 shrink-0">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border
           ${isFolder ? 'bg-blue-100/50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400 group-hover:border-blue-400 group-hover:text-blue-600'}`}>
           {isFolder ? <Folder size={18} fill="currentColor" className="opacity-20" /> : <FileText size={18} />}
         </div>
      </div>
      
      <div className="flex-1 min-w-0 px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-800 truncate tracking-tight uppercase">{file.name}</span>
          {!isFolder && file.metadata?.batchNumber && (
            <span className="text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded tracking-widest">LOT: {file.metadata.batchNumber}</span>
          )}
        </div>
      </div>

      <div className="w-24 hidden lg:block text-[10px] font-bold text-slate-400 font-mono tracking-tighter">
        {isFolder ? '--' : file.size || '--'}
      </div>

      <div className="w-36 hidden md:block">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <Clock size={12} className="text-slate-300" />
            {new Date(file.updatedAt).toLocaleDateString()}
        </div>
      </div>

      <div className="w-32">
        {!isFolder ? (
            <FileStatusBadge status={file.metadata?.status} />
        ) : (
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Pasta Estrutural</span>
        )}
      </div>

      <div className="w-20 flex items-center justify-end gap-3">
         <button 
            onClick={(e) => { e.stopPropagation(); onToggleSelection(file.id); }}
            className={`p-2 rounded-lg transition-all border ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-300 hover:text-blue-600'}`}
         >
            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
         </button>
      </div>
    </div>
  );
};
