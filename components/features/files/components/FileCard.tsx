
import React from 'react';
import { Folder, FileText, CheckSquare, Square, Eye, ShieldCheck, ChevronRight, Clock } from 'lucide-react';
import { FileNode, FileType } from '../../../../types/index.ts';
import { FileStatusBadge } from './FileStatusBadge.tsx';

interface FileCardProps {
  file: FileNode;
  isSelected: boolean;
  onNavigate: (id: string | null) => void;
  onPreview: (file: FileNode) => void;
  onToggleSelection: (fileId: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, isSelected, onNavigate, onPreview, onToggleSelection }) => {
  const isFolder = file.type === FileType.FOLDER;

  return (
    <div 
      className={`group relative flex flex-col p-6 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer overflow-hidden h-64
        ${isSelected 
          ? 'bg-blue-50/50 border-blue-600 shadow-xl ring-1 ring-blue-600' 
          : 'bg-white border-slate-100 hover:border-blue-400 hover:shadow-lg'}`}
      onClick={(e) => {
        if (isFolder) onNavigate(file.id);
        else onPreview(file);
      }}
    >
      {/* Background Icon Watermark */}
      <div className="absolute -right-4 -bottom-4 p-4 opacity-[0.03] text-slate-900 pointer-events-none group-hover:opacity-[0.06] transition-opacity">
         {isFolder ? <Folder size={120} /> : <FileText size={120} />}
      </div>

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-md
           ${isFolder ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white group-hover:bg-blue-600'}`}>
          {isFolder ? <Folder size={24} fill="currentColor" className="opacity-40" /> : <FileText size={24} />}
        </div>
        
        <button 
          className={`p-2 rounded-xl transition-all
            ${isSelected ? 'text-white bg-blue-600' : 'text-slate-200 bg-slate-50 hover:bg-white border border-slate-100 hover:text-blue-600'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection(file.id);
          }}
        >
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <h4 className="text-[13px] font-black text-slate-800 leading-tight uppercase tracking-tight mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
          {file.name}
        </h4>
        
        <div className="flex items-center gap-2 mb-4">
           <Clock size={10} className="text-slate-300" />
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
             {new Date(file.updatedAt).toLocaleDateString()}
           </span>
        </div>
        
        <div className="mt-auto space-y-3">
            <div className="flex items-center justify-between">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {isFolder ? 'Dossier Vital' : file.size || 'Ativo'}
               </span>
               {!isFolder && <FileStatusBadge status={file.metadata?.status} />}
            </div>
            
            {isFolder && (
              <div className="flex items-center gap-2 text-blue-600 font-black text-[9px] uppercase tracking-[3px] group-hover:translate-x-1 transition-transform">
                 Explorar <ChevronRight size={12} />
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
