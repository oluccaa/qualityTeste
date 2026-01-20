
import React from 'react';
import { Folder, FileText, CheckSquare, Square, Clock, HardDrive, Eye } from 'lucide-react';
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
  const isViewed = !!file.metadata?.viewedAt;
  
  return (
    <div 
      className={`group flex items-center px-8 py-3 hover:bg-slate-50 transition-all cursor-pointer relative border-b border-slate-100 last:border-0
        ${isSelected ? 'bg-[#132659]/5' : ''}`}
      onClick={() => isFolder ? onNavigate(file.id) : onPreview(file)}
      title={isFolder ? "Explorar Pasta" : "Abrir Certificado"}
    >
      <div className="w-10 shrink-0">
         <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border
           ${isFolder ? 'bg-[#132659]/5 border-[#132659]/10 text-[#132659]' : 'bg-white border-slate-200 text-slate-400 group-hover:text-[#132659]'}`}>
           {isFolder ? <Folder size={16} fill={isSelected ? "currentColor" : "none"} className="opacity-80" /> : <FileText size={16} />}
         </div>
      </div>
      
      <div className="flex-1 min-w-0 px-6">
        <div className="flex items-center gap-3">
          <span className={`text-[13px] tracking-tight uppercase transition-colors ${isSelected || isFolder ? 'font-bold text-slate-900' : 'font-medium text-slate-600 group-hover:text-slate-900'}`}>
            {file.name}
          </span>
          {isViewed && !isFolder && (
            <div className="flex items-center gap-1 text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100" title={`Visualizado pelo cliente em ${new Date(file.metadata!.viewedAt!).toLocaleDateString()}`}>
               <Eye size={10} strokeWidth={3} />
               <span className="text-[8px] font-black uppercase">Visto</span>
            </div>
          )}
          {!isFolder && file.metadata?.batchNumber && (
            <span className="text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded tracking-[2px]">
              LOT: {file.metadata.batchNumber}
            </span>
          )}
        </div>
      </div>

      <div className="w-24 hidden lg:block text-[10px] font-bold text-slate-400 font-mono tracking-tighter text-right px-4">
        {isFolder ? '--' : file.size || '--'}
      </div>

      <div className="w-40 hidden md:block">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <Clock size={12} className="text-slate-300" />
            {new Date(file.updatedAt).toLocaleDateString()}
        </div>
      </div>

      <div className="w-32">
        {!isFolder ? (
            <FileStatusBadge status={file.metadata?.status} />
        ) : (
            <div className="flex items-center gap-1.5 text-slate-300">
               <HardDrive size={12} />
               <span className="text-[8px] font-black uppercase tracking-widest">Dossier</span>
            </div>
        )}
      </div>

      <div className="w-16 flex items-center justify-end">
         <button 
            onClick={(e) => { e.stopPropagation(); onToggleSelection(file.id); }}
            className={`p-2 rounded-lg transition-all ${isSelected ? 'text-[#132659]' : 'text-slate-200 hover:text-slate-400 opacity-0 group-hover:opacity-100'}`}
         >
            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
         </button>
      </div>
    </div>
  );
};
