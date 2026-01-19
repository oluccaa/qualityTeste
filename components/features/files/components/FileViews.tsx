
import React from 'react';
import { Folder, FileText, ChevronRight, CheckSquare, Square, Edit2, Download, Eye, Clock, ShieldCheck } from 'lucide-react';
import { FileNode, FileType, UserRole } from '../../../../types/index.ts';
import { FileStatusBadge } from './FileStatusBadge.tsx';
import { useTranslation } from 'react-i18next';

interface FileViewProps {
  files: FileNode[];
  onNavigate: (id: string | null) => void;
  onSelectFileForPreview: (file: FileNode | null) => void;
  selectedFileIds: string[];
  onToggleFileSelection: (fileId: string) => void;
  onDownload: (file: FileNode) => void;
  onRename: (file: FileNode) => void;
  onDelete: (fileId: string) => void;
  userRole: UserRole;
}

export const FileListView: React.FC<FileViewProps> = ({ 
  files, onNavigate, onSelectFileForPreview, selectedFileIds, onToggleFileSelection, onRename, onDelete, userRole 
}) => {
  const { t } = useTranslation();
  const isClient = userRole === UserRole.CLIENT;

  return (
    <div className="min-w-full divide-y divide-slate-100 bg-white">
      <div className="flex items-center px-8 py-5 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[3px] border-b border-slate-100">
        <div className="w-12 shrink-0" />
        <div className="flex-1">Identificador Técnico</div>
        <div className="w-32 hidden md:block">Dimensão</div>
        <div className="w-32">Status Vital</div>
        <div className="w-40 text-right">Ações</div>
      </div>
      {files.map((file) => {
        const isSelected = selectedFileIds.includes(file.id);
        const isFolder = file.type === FileType.FOLDER;
        
        return (
          <div 
            key={file.id} 
            className={`group flex items-center px-8 py-5 hover:bg-slate-50/80 transition-all cursor-pointer relative
              ${isSelected ? 'bg-blue-50/40' : ''}`}
            onClick={() => isFolder ? onNavigate(file.id) : onSelectFileForPreview(file)}
          >
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 animate-in slide-in-from-left-2" />}
            
            <div className="w-12 shrink-0">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm border-2
                 ${isFolder ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-slate-100 text-slate-400 group-hover:border-blue-400 group-hover:text-blue-600'}`}>
                 {isFolder ? <Folder size={24} fill="currentColor" className="opacity-20" /> : <FileText size={24} />}
               </div>
            </div>
            
            <div className="flex-1 min-w-0 pr-8 ml-4">
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-bold text-slate-900 truncate tracking-tight">{file.name}</span>
                {file.versionNumber && file.versionNumber > 1 && (
                  <span className="text-[9px] font-black text-blue-600 bg-blue-100/50 px-2.5 py-0.5 rounded-full border border-blue-200">REV {file.versionNumber}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 opacity-60">
                 <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <Clock size={12} />
                    {new Date(file.updatedAt).toLocaleDateString()}
                 </div>
                 {file.metadata?.batchNumber && (
                   <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">LOT: {file.metadata.batchNumber}</span>
                 )}
              </div>
            </div>

            <div className="w-32 hidden md:block text-[11px] font-black text-slate-500 font-mono">
              {file.size || '--'}
            </div>

            <div className="w-32">
              {!isFolder ? (
                  <FileStatusBadge status={file.metadata?.status} />
              ) : (
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Dossier Vital</span>
              )}
            </div>

            <div className="w-40 flex items-center justify-end gap-3">
               <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFileSelection(file.id); }}
                  className={`p-2.5 rounded-xl transition-all border-2 ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-110' : 'bg-white border-slate-200 text-slate-300 hover:border-blue-400 hover:text-blue-500'}`}
               >
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
               </button>
               {isFolder && <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const FileGridView: React.FC<FileViewProps> = ({ 
  files, onNavigate, onSelectFileForPreview, selectedFileIds, onToggleFileSelection, onRename, userRole 
}) => {
  const isClient = userRole === UserRole.CLIENT;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-8 p-8">
      {files.map((file) => {
        const isSelected = selectedFileIds.includes(file.id);
        const isFolder = file.type === FileType.FOLDER;

        return (
          <div 
            key={file.id}
            className={`group relative flex flex-col p-8 rounded-[3rem] border-2 transition-all duration-500 cursor-pointer overflow-hidden
              ${isSelected 
                ? 'bg-blue-50/50 border-blue-600 shadow-2xl shadow-blue-600/10 scale-[1.02]' 
                : 'bg-white border-slate-100 hover:border-blue-400 hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2'}`}
            onClick={() => isFolder ? onNavigate(file.id) : onSelectFileForPreview(file)}
          >
            {/* Background Texture */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-slate-900 pointer-events-none">
               {isFolder ? <Folder size={120} /> : <FileText size={120} />}
            </div>

            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className={`w-16 h-16 flex items-center justify-center rounded-[1.5rem] transition-all duration-500 shadow-lg
                 ${isFolder ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white group-hover:bg-blue-600 group-hover:scale-110'}`}>
                {isFolder ? <Folder size={32} fill="currentColor" /> : <FileText size={32} />}
              </div>
              
              <button 
                className={`p-3 rounded-2xl transition-all
                  ${isSelected ? 'text-white bg-blue-600 shadow-xl' : 'text-slate-200 bg-slate-50 hover:bg-white border border-slate-100 hover:text-blue-600 shadow-sm'}`}
                onClick={(e) => { e.stopPropagation(); onToggleFileSelection(file.id); }}
              >
                {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
              </button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <h4 className="text-lg font-black text-slate-800 leading-tight uppercase tracking-tight mb-4 group-hover:text-blue-700 transition-colors line-clamp-2">
                {file.name}
              </h4>
              
              <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {isFolder ? 'Estrutura / Pasta' : file.size || 'Arquivo Técnico'}
                     </span>
                     {!isFolder && <FileStatusBadge status={file.metadata?.status} />}
                  </div>
                  
                  {isFolder ? (
                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[3px] opacity-0 group-hover:opacity-100 transition-all">
                       Abrir Dossier <ChevronRight size={14} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                           <Eye size={12} /> {file.metadata?.viewedAt ? 'Visto' : 'Novo'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                           <ShieldCheck size={12} /> Certificado
                        </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Float Label for Batch */}
            {file.metadata?.batchNumber && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                Lote: {file.metadata.batchNumber}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
