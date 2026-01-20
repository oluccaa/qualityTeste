
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Hand, Pencil, Highlighter, Square, Circle, 
  Eraser, Download, PlayCircle, Loader2, ChevronLeft, 
  ChevronRight, ZoomIn, ZoomOut, Plus, Save, Undo
} from 'lucide-react';
import { useAuth } from '../../context/authContext.tsx';
import { useFilePreview } from '../../components/features/files/hooks/useFilePreview.ts';
import { PdfViewport } from '../../components/features/files/components/PdfViewport.tsx';
import { DrawingCanvas, DrawingTool } from '../../components/features/files/components/DrawingCanvas.tsx';
import { UserRole, normalizeRole, FileNode, DocumentAnnotations, AnnotationItem } from '../../types/index.ts';

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' }
];

const FilePreviewPage: React.FC = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTool, setActiveTool] = useState<DrawingTool>('hand');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [numPages, setNumPages] = useState(0);

  // Estado das anotações em formato de dicionário de páginas
  const [annotations, setAnnotations] = useState<DocumentAnnotations>({});

  const initialFileStub = useMemo(() => ({ id: fileId } as FileNode), [fileId]);

  const {
    currentFile,
    url,
    pageNum,
    setPageNum,
    zoom,
    setZoom,
    handleDownload,
    handleUpdateMetadata,
    isSyncing
  } = useFilePreview(user, initialFileStub);

  // Carrega as anotações iniciais vindas do banco de dados (se houver)
  useEffect(() => {
    if (currentFile?.metadata?.documentalDrawings) {
      try {
        const saved = JSON.parse(currentFile.metadata.documentalDrawings);
        setAnnotations(saved);
      } catch (e) {
        console.error("Falha ao analisar anotações salvas:", e);
      }
    }
  }, [currentFile?.id]);

  const handlePageAnnotationsChange = useCallback((page: number, newPageAnnotations: AnnotationItem[]) => {
    setAnnotations(prev => ({
      ...prev,
      [page]: newPageAnnotations
    }));
  }, []);

  const handleSaveAll = async () => {
    if (!currentFile) return;
    const jsonString = JSON.stringify(annotations);
    await handleUpdateMetadata({
        documentalDrawings: jsonString
    });
  };

  const handleUndo = () => {
    setAnnotations(prev => {
        const pageItems = prev[pageNum] || [];
        if (pageItems.length === 0) return prev;
        return {
            ...prev,
            [pageNum]: pageItems.slice(0, -1)
        };
    });
  };

  const role = normalizeRole(user?.role);
  // O botão de auditoria agora aparece para analistas, administradores e clientes.
  const canAudit = role === UserRole.QUALITY || role === UserRole.ADMIN || role === UserRole.CLIENT;

  return (
    <div className="h-screen w-screen bg-[#020617] flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#081437]/90 backdrop-blur-xl border-b border-white/5 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-white transition-all bg-white/5 rounded-xl border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-white text-xs font-black uppercase tracking-widest truncate max-w-xs">
              {currentFile?.name || "Carregando Ativo..."}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={handleSaveAll}
                disabled={isSyncing}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
            >
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Persistir Alterações
            </button>
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2 transition-all"
            >
              <Download size={14} /> Exportar Original
            </button>
        </div>
      </header>

      {/* Viewport */}
      <div className="flex-1 relative overflow-hidden">
        {url ? (
          <PdfViewport 
            url={url} 
            pageNum={pageNum} 
            zoom={zoom} 
            onPdfLoad={setNumPages} 
            onPageChange={setPageNum} 
            onZoomChange={setZoom} 
            renderOverlay={(w, h) => (
              <DrawingCanvas 
                tool={activeTool} 
                color={selectedColor} 
                width={w} 
                height={h} 
                pageAnnotations={annotations[pageNum] || []}
                onAnnotationsChange={(newItems) => handlePageAnnotationsChange(pageNum, newItems)}
              />
            )}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4 bg-[#020617]">
             <Loader2 size={40} className="animate-spin text-blue-500" />
             <p className="text-[10px] font-black uppercase tracking-[4px]">Autenticando Ledger...</p>
          </div>
        )}
      </div>

      {/* BARRA DE FERRAMENTAS PRINCIPAL */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-[#081437]/95 backdrop-blur-3xl border border-white/10 p-2 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom-10 duration-700">
        
        {/* Paginação */}
        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-full border border-white/10 px-4">
          <button 
            disabled={pageNum <= 1}
            onClick={() => setPageNum(pageNum - 1)}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-20"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-[10px] font-black text-blue-400 min-w-[50px] text-center tracking-widest">
            {pageNum} / {numPages || '--'}
          </span>
          <button 
            disabled={pageNum >= numPages}
            onClick={() => setPageNum(pageNum + 1)}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-20"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Ferramentas Base */}
        <div className="flex items-center gap-1.5 px-2">
          <ToolButton 
            icon={Hand} 
            active={activeTool === 'hand'} 
            onClick={() => setActiveTool('hand')} 
            label="Mão" 
          />
          
          <div className="relative">
            {showMoreMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-[#081437] border border-white/10 p-2 rounded-[2rem] shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-1">
                  <ToolButton icon={Pencil} active={activeTool === 'pencil'} onClick={() => { setActiveTool('pencil'); setShowMoreMenu(false); }} label="Lápis" />
                  <ToolButton icon={Highlighter} active={activeTool === 'marker'} onClick={() => { setActiveTool('marker'); setShowMoreMenu(false); }} label="Marcador" />
                  <ToolButton icon={Square} active={activeTool === 'rect'} onClick={() => { setActiveTool('rect'); setShowMoreMenu(false); }} label="Retângulo" />
                  <ToolButton icon={Circle} active={activeTool === 'circle'} onClick={() => { setActiveTool('circle'); setShowMoreMenu(false); }} label="Círculo" />
                  <ToolButton icon={Eraser} active={activeTool === 'eraser'} onClick={() => { setActiveTool('eraser'); setShowMoreMenu(false); }} label="Borracha" />
                </div>
                <div className="h-px bg-white/10 mx-2" />
                <div className="flex items-center justify-center gap-3 py-1 px-3">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => { setSelectedColor(c.value); setShowMoreMenu(false); }}
                      className={`w-6 h-6 rounded-full border-2 transition-all scale-100 hover:scale-125 ${selectedColor === c.value ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            )}
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`p-3.5 rounded-full transition-all flex items-center justify-center ${showMoreMenu ? 'bg-white text-[#081437]' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
            >
              <Plus size={20} className={`transition-transform duration-300 ${showMoreMenu ? 'rotate-45' : 'rotate-0'}`} />
            </button>
          </div>

          <ToolButton 
            icon={Undo} 
            active={false} 
            onClick={handleUndo} 
            label="Desfazer" 
            disabled={(annotations[pageNum] || []).length === 0}
          />
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 pr-2 border-r border-white/10">
          <ToolButton icon={ZoomOut} onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} label="Zoom Out" />
          <ToolButton icon={ZoomIn} onClick={() => setZoom(Math.min(3, zoom + 0.2))} label="Zoom In" />
        </div>

        {/* Iniciar Auditoria */}
        {canAudit && (
          <button 
            onClick={() => navigate(`/quality/inspection/${fileId}`)}
            className="ml-2 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-black text-[10px] uppercase tracking-[3px] shadow-2xl shadow-orange-600/30 transition-all active:scale-95 flex items-center gap-3"
          >
            <PlayCircle size={18} /> INICIAR AUDITORIA
          </button>
        )}
      </div>
    </div>
  );
};

const ToolButton = ({ icon: Icon, active, onClick, label, disabled }: any) => (
  <button 
    onClick={onClick}
    title={label}
    disabled={disabled}
    className={`p-3.5 rounded-full transition-all relative group flex items-center justify-center disabled:opacity-20 ${
        active 
        ? 'bg-blue-600 text-white shadow-xl' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon size={20} strokeWidth={active ? 3 : 2} />
  </button>
);

export default FilePreviewPage;
