
import React from 'react';
import { X, Download, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { FileNode, UserRole } from '../../../types/index.ts';
import { useAuth } from '../../../context/authContext.tsx';
import { AuditWorkflow } from '../quality/components/AuditWorkflow.tsx';
import { PdfViewport } from './components/PdfViewport.tsx';
import { useFilePreview } from './hooks/useFilePreview.ts';

export const FilePreviewModal: React.FC<{ 
  initialFile: FileNode | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onDownloadFile?: (file: FileNode) => void | Promise<void>; 
}> = ({ initialFile, isOpen, onClose }) => {
  const { user } = useAuth();
  
  const {
    currentFile,
    url,
    isSyncing,
    pageNum,
    setPageNum,
    zoom,
    setZoom,
    handleUpdateMetadata,
    handleDownload
  } = useFilePreview(user, initialFile);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-[#020617] flex animate-in fade-in duration-500 overflow-hidden font-sans">
      
      {/* Visualização Técnica (Esquerda) */}
      <div className="w-1/2 relative border-r border-white/5 flex flex-col bg-[#020617]">
        <header className="h-16 flex items-center justify-between px-8 bg-[#081437]/60 backdrop-blur-xl border-b border-white/5 z-20">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400"><FileText size={18} /></div>
             <div>
                <h2 className="text-white text-[10px] font-black uppercase tracking-[4px] leading-tight truncate max-w-xs">{currentFile?.name}</h2>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">Protocolo: {currentFile?.id.split('-')[0]}</p>
             </div>
          </div>
          {isSyncing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                <Loader2 size={12} className="animate-spin text-blue-400" />
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Sincronizando Ledger</span>
            </div>
          )}
        </header>

        <PdfViewport 
            url={url} 
            pageNum={pageNum} 
            zoom={zoom} 
            onPdfLoad={() => {}} 
            onPageChange={setPageNum} 
            onZoomChange={setZoom} 
        />
      </div>

      {/* Workflow de Auditoria (Direita) - Business Logic Component */}
      <div className="w-1/2 flex flex-col bg-white overflow-hidden">
        <header className="h-16 flex items-center justify-between px-10 bg-slate-50/50 border-b border-slate-100 backdrop-blur-md shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="text-xs font-black text-[#081437] uppercase tracking-[3px]">Estação de Auditoria B2B</h3>
           </div>
           <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm"><X size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
            <div className="max-w-xl mx-auto">
              <AuditWorkflow 
                metadata={currentFile?.metadata} 
                userRole={user?.role as UserRole} 
                userName={user?.name || ''}
                userEmail={user?.email || ''}
                fileId={currentFile?.id || ''}
                onUpdate={handleUpdateMetadata}
              />
            </div>
        </div>

        <footer className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-4 text-slate-400">
              <ShieldCheck size={20} className="text-emerald-500" />
              <p className="text-[9px] font-black uppercase tracking-[3px]">SGQ • VITAL COMPLIANCE</p>
           </div>
           <button 
              onClick={handleDownload}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[2px] hover:bg-[#b23c0e] transition-all flex items-center gap-2 active:scale-95"
           >
              <Download size={14} /> Exportar Ativo
           </button>
        </footer>
      </div>
    </div>
  );
};
