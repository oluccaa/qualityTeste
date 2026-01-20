
import React from 'react';
import { Folder, FileText, CheckSquare, Square, ChevronRight, Clock, Eye } from 'lucide-react';
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
  const isViewed = !!file.metadata?.viewedAt;

  return (
    <div 
      className="group relative h-56 flex flex-col cursor-pointer"
      onClick={() => isFolder ? onNavigate(file.id) : onPreview(file)}
    >
      {/* Tooltip Nativo */}
      <div className="absolute inset-0 z-20 cursor-pointer" title={isFolder ? `Explorar Dossier: ${file.name}` : `Visualizar Laudo: ${file.name}`} />

      {/* SILLUETE DE PASTA (Apenas para Folders) */}
      {isFolder && (
        <div className="absolute inset-0 flex flex-col">
          {/* Aba da Pasta */}
          <div className={`w-16 h-4 rounded-t-lg transition-colors duration-300 ${isSelected ? 'bg-[#132659]' : 'bg-slate-200 group-hover:bg-[#132659]/40'}`} />
          {/* Corpo da Pasta */}
          <div className={`flex-1 rounded-r-2xl rounded-bl-2xl border-t-2 transition-all duration-300 shadow-sm
            ${isSelected 
              ? 'bg-blue-50/50 border-[#132659] shadow-md' 
              : 'bg-white border-slate-200 group-hover:border-[#132659]/50 group-hover:shadow-lg'}`} 
          />
        </div>
      )}

      {/* CARD DE ARQUIVO (Visual Plano Minimalista) */}
      {!isFolder && (
        <div className={`absolute inset-0 rounded-2xl border transition-all duration-300
          ${isSelected 
            ? 'bg-blue-50/30 border-[#132659] shadow-md' 
            : 'bg-white border-slate-200 hover:border-[#132659] shadow-sm hover:shadow-lg'}`} 
        />
      )}

      {/* CONTEÚDO DO CARD */}
      <div className="relative z-10 flex flex-col h-full p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-500
             ${isFolder 
                ? (isSelected ? 'bg-[#132659] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#132659]/10 group-hover:text-[#132659]') 
                : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#132659] border border-slate-100'}`}>
            {isFolder ? <Folder size={20} fill={isSelected ? "currentColor" : "none"} /> : <FileText size={20} />}
          </div>
          
          <div className="flex items-center gap-2">
            {isViewed && !isFolder && (
                <div className="bg-blue-500 text-white p-1.5 rounded-lg shadow-sm animate-in zoom-in" title="Visto pelo cliente">
                    <Eye size={12} strokeWidth={3} />
                </div>
            )}
            <button 
                className={`p-2 rounded-lg transition-all z-30
                ${isSelected ? 'text-[#132659]' : 'text-slate-200 hover:text-[#132659]'}`}
                onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(file.id);
                }}
                title={isSelected ? "Desmarcar" : "Selecionar"}
            >
                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <h4 className="text-[13px] font-bold text-slate-800 leading-tight uppercase tracking-tight mb-1 line-clamp-2 group-hover:text-[#132659] transition-colors">
            {file.name}
          </h4>
          
          <div className="flex items-center gap-1.5 mt-auto">
             <Clock size={10} className="text-slate-300" />
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
               {new Date(file.updatedAt).toLocaleDateString()}
             </span>
          </div>
          
          <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                {isFolder ? 'Dossier' : file.size || 'PDF'}
             </span>
             {!isFolder && <FileStatusBadge status={file.metadata?.status} />}
             {isFolder && (
                <div className="flex items-center gap-1 text-[#132659] font-black text-[8px] uppercase tracking-[2px] group-hover:translate-x-1 transition-transform">
                   Abrir <ChevronRight size={10} />
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
