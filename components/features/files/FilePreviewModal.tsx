
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, Download, Loader2, ZoomIn, ZoomOut, 
  ShieldCheck, FileCheck, ChevronLeft, ChevronRight, 
  Maximize2, LayoutPanelLeft, FileText, Activity
} from 'lucide-react';
import { FileNode, UserRole, QualityStatus, SteelBatchMetadata } from '../../../types/index.ts';
import { fileService } from '../../../lib/services/index.ts';
import { useAuth } from '../../../context/authContext.tsx';
import { useToast } from '../../../context/notificationContext.tsx';
import { supabase } from '../../../lib/supabaseClient.ts';
import { AuditWorkflow } from '../quality/components/AuditWorkflow.tsx';

if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
  (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export const FilePreviewModal: React.FC<{ 
  initialFile: FileNode | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onDownloadFile: (file: FileNode) => void | Promise<void>; 
}> = ({ initialFile, isOpen, onClose, onDownloadFile }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentFile, setCurrentFile] = useState<FileNode | null>(initialFile);
  const [loading, setLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    if (isOpen && initialFile) {
      setCurrentFile(initialFile);
      setPageNum(1);
    }
  }, [isOpen, initialFile]);

  useEffect(() => {
    if (isOpen && currentFile && user) {
      setLoading(true);
      fileService.getFileSignedUrl(user, currentFile.id).then(async (url) => {
        const loadingTask = (window as any).pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
      }).catch(() => showToast("Erro crítico na renderização do PDF", "error"))
      .finally(() => setLoading(false));
    }
  }, [currentFile, user, isOpen]);

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: zoom * 2 }); 
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d')!;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
  }, [pdfDoc, pageNum, zoom]);

  useEffect(() => { renderPage(); }, [renderPage]);

  const handleUpdateMetadata = async (updatedMetadata: Partial<SteelBatchMetadata>) => {
    if (!currentFile || !user) return;
    try {
        const mergedMetadata = { ...currentFile.metadata, ...updatedMetadata };
        const { error } = await supabase.from('files').update({ metadata: mergedMetadata }).eq('id', currentFile.id);
        if (error) throw error;
        setCurrentFile({ ...currentFile, metadata: mergedMetadata as SteelBatchMetadata });
        showToast("Progresso da Auditoria Sincronizado", "success");
    } catch (e: any) { 
        showToast(`Falha: ${e.message}`, "error"); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-[#020617] flex animate-in fade-in duration-500 overflow-hidden font-sans">
      
      {/* 50% LEFT: TECHNICAL VIEWPORT (PDF) */}
      <div className="w-1/2 relative border-r border-white/5 flex flex-col bg-[#020617]">
        <header className="h-16 flex items-center justify-between px-8 bg-[#081437]/60 backdrop-blur-xl border-b border-white/5 z-20">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
               <FileText size={18} />
             </div>
             <div>
                <h2 className="text-white text-[10px] font-black uppercase tracking-[4px] leading-tight">{currentFile?.name}</h2>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">LOTE: {currentFile?.metadata?.batchNumber || 'N/A'}</p>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto custom-scrollbar flex justify-center p-12 bg-slate-950/50">
           <div className="relative shadow-[0_50px_120px_rgba(0,0,0,0.8)] rounded-sm bg-white overflow-hidden h-fit transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
              {loading && (
                <div className="absolute inset-0 bg-[#081437]/80 backdrop-blur-md flex items-center justify-center z-50">
                  <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
              )}
              <canvas ref={canvasRef} className="block w-full h-auto" />
           </div>
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-[#081437]/90 backdrop-blur-2xl border border-white/10 p-3 px-6 rounded-full shadow-2xl z-50">
            <div className="flex items-center gap-4 border-r border-white/10 pr-6">
                <button onClick={() => setPageNum(p => Math.max(1, p - 1))} className="text-slate-400 hover:text-white transition-all"><ChevronLeft size={20}/></button>
                <span className="text-[10px] font-black text-blue-400 tracking-[3px] min-w-[60px] text-center">{pageNum} / {numPages}</span>
                <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} className="text-slate-400 hover:text-white transition-all"><ChevronRight size={20}/></button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 text-slate-400 hover:text-white transition-all"><ZoomOut size={18}/></button>
              <button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} className="p-1.5 text-slate-400 hover:text-white transition-all"><ZoomIn size={18}/></button>
            </div>
        </div>
      </div>

      {/* 50% RIGHT: WORKFLOW STATION */}
      <div className="w-1/2 flex flex-col bg-white overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-10 bg-slate-50/50 border-b border-slate-100 backdrop-blur-md">
           <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <div>
                <h3 className="text-xs font-black text-[#081437] uppercase tracking-[3px]">Audit Station Vital v4</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Protocolo de Conformidade Metalúrgica</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm">
             <X size={20} />
           </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
           <div className="max-w-xl mx-auto py-12 px-8">
              <AuditWorkflow 
                metadata={currentFile?.metadata} 
                userRole={user?.role as UserRole} 
                userName={user?.name || ''}
                fileId={currentFile?.id || ''}
                onUpdate={handleUpdateMetadata}
              />
           </div>
        </div>

        <footer className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-4 text-slate-400">
              <ShieldCheck size={20} className="text-emerald-500" />
              <p className="text-[9px] font-black uppercase tracking-[3px]">Sessão Criptografada • SGQ-AÇOS VITAL</p>
           </div>
           <button 
              onClick={() => onDownloadFile(currentFile!)}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[2px] hover:bg-[#b23c0e] transition-all flex items-center gap-2"
           >
              <Download size={14} /> Exportar Laudo
           </button>
        </footer>
      </div>
    </div>
  );
};
