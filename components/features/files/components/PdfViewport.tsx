
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface PdfViewportProps {
  url: string | null;
  zoom: number;
  pageNum: number;
  onPdfLoad: (numPages: number) => void;
  onPageChange: (newPage: number) => void;
  onZoomChange: (newZoom: number) => void;
}

/**
 * PdfViewport - Visualizador Técnico de Alta Performance
 * Implementa renderização sequencial para evitar erros de concorrência no Canvas.
 */
export const PdfViewport: React.FC<PdfViewportProps> = ({ 
  url, zoom, pageNum, onPdfLoad, onPageChange, onZoomChange 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  
  // Referências para controle de fluxo assíncrono
  const currentRenderTaskRef = useRef<any>(null);
  const lastRenderPromiseRef = useRef<Promise<void>>(Promise.resolve());

  // Carregamento do Documento
  useEffect(() => {
    if (!url) return;
    setLoading(true);
    
    const loadingTask = (window as any).pdfjsLib.getDocument(url);
    loadingTask.promise.then((pdf: any) => {
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      onPdfLoad(pdf.numPages);
      setLoading(false);
    }).catch((err: any) => {
      console.error("[PDF Engine] Erro ao carregar documento:", err);
      setLoading(false);
    });

    return () => {
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel();
      }
    };
  }, [url, onPdfLoad]);

  // Ciclo de Renderização da Página
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isEffectActive = true;

    const render = async () => {
      // 1. Aguarda qualquer renderização anterior terminar ou ser cancelada
      // Isso libera o bloqueio interno do canvas do pdf.js
      await lastRenderPromiseRef.current;

      if (!isEffectActive) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        if (!isEffectActive || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: zoom * 2 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')!;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        // 2. Inicia a nova tarefa e armazena sua promessa
        const renderTask = page.render(renderContext);
        currentRenderTaskRef.current = renderTask;
        
        // Encapsula a promessa para garantir que o catch não quebre o fluxo sequencial
        lastRenderPromiseRef.current = renderTask.promise.then(
          () => {},
          (err: any) => {
            if (err.name !== 'RenderingCancelledException') {
              console.error("[PDF Engine] Render error:", err);
            }
          }
        );

        await lastRenderPromiseRef.current;
      } catch (e) {
        console.error("[PDF Engine] Falha na preparação da página:", e);
      }
    };

    render();

    return () => {
      isEffectActive = false;
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNum, zoom]);

  return (
    <div className="flex-1 overflow-auto custom-scrollbar flex justify-center p-12 bg-slate-950/50 relative">
        <div 
          className="relative shadow-[0_50px_120px_rgba(0,0,0,0.8)] rounded-sm bg-white overflow-hidden h-fit transition-transform duration-300" 
          style={{ transform: `scale(${zoom})` }}
        >
            {loading && (
                <div className="absolute inset-0 bg-[#081437]/80 backdrop-blur-md flex items-center justify-center z-50">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
            )}
            <canvas ref={canvasRef} className="block w-full h-auto" />
        </div>

        {/* Floating Controls Interior */}
        <div className="fixed bottom-10 left-1/4 -translate-x-1/2 flex items-center gap-6 bg-[#081437]/90 backdrop-blur-2xl border border-white/10 p-3 px-6 rounded-full shadow-2xl z-50 scale-90 md:scale-100">
            <div className="flex items-center gap-4 border-r border-white/10 pr-6">
                <button onClick={() => onPageChange(Math.max(1, pageNum - 1))} className="text-slate-400 hover:text-white transition-all p-1 hover:bg-white/5 rounded-lg"><ChevronLeft size={20}/></button>
                <span className="text-[10px] font-black text-blue-400 tracking-[3px] min-w-[60px] text-center">{pageNum} / {numPages}</span>
                <button onClick={() => onPageChange(Math.min(numPages, pageNum + 1))} className="text-slate-400 hover:text-white transition-all p-1 hover:bg-white/5 rounded-lg"><ChevronRight size={20}/></button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))} className="p-2 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-lg"><ZoomOut size={18}/></button>
              <button onClick={() => onZoomChange(Math.min(2.5, zoom + 0.1))} className="p-2 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-lg"><ZoomIn size={18}/></button>
            </div>
        </div>
    </div>
  );
};
