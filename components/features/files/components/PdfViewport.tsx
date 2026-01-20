
import React, { useRef, useEffect, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// Configuração do Worker Global para evitar logs de "Deprecated API usage"
if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
  (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface PdfViewportProps {
  url: string | null;
  zoom: number;
  pageNum: number;
  onPdfLoad: (numPages: number) => void;
  onPageChange: (newPage: number) => void;
  onZoomChange: (newZoom: number) => void;
  renderOverlay?: (width: number, height: number) => React.ReactNode;
}

export const PdfViewport: React.FC<PdfViewportProps> = ({ 
  url, zoom, pageNum, onPdfLoad, onPageChange, onZoomChange, renderOverlay
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  
  const currentRenderTaskRef = useRef<any>(null);
  const lastRenderPromiseRef = useRef<Promise<void>>(Promise.resolve());

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
      console.error("Erro ao carregar PDF:", err);
      setLoading(false);
    });
    return () => currentRenderTaskRef.current?.cancel();
  }, [url, onPdfLoad]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let isEffectActive = true;
    const render = async () => {
      await lastRenderPromiseRef.current;
      if (!isEffectActive) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom * 2 });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        setCanvasSize({ w: viewport.width / 2, h: viewport.height / 2 });

        const renderTask = page.render({ canvasContext: context, viewport });
        currentRenderTaskRef.current = renderTask;
        lastRenderPromiseRef.current = renderTask.promise.catch(() => {});
        await lastRenderPromiseRef.current;
      } catch (e) {}
    };
    render();
    return () => { isEffectActive = false; currentRenderTaskRef.current?.cancel(); };
  }, [pdfDoc, pageNum, zoom]);

  return (
    <div className="flex-1 overflow-auto custom-scrollbar flex justify-center p-12 bg-slate-950/50 relative">
        <div 
          className="relative shadow-[0_50px_120px_rgba(0,0,0,0.8)] rounded-sm bg-white h-fit transition-transform duration-300" 
          style={{ width: canvasSize.w, height: canvasSize.h }}
        >
            {loading && (
                <div className="absolute inset-0 bg-[#081437]/80 backdrop-blur-md flex items-center justify-center z-50">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
            )}
            <canvas ref={canvasRef} className="block w-full h-auto" />
            {renderOverlay && renderOverlay(canvasSize.w, canvasSize.h)}
        </div>

        <div className="fixed bottom-10 left-1/4 -translate-x-1/2 flex items-center gap-6 bg-[#081437]/90 backdrop-blur-2xl border border-white/10 p-3 px-6 rounded-full shadow-2xl z-50">
            <div className="flex items-center gap-4 border-r border-white/10 pr-6">
                <button onClick={() => onPageChange(Math.max(1, pageNum - 1))} className="text-slate-400 hover:text-white"><ChevronLeft size={20}/></button>
                <span className="text-[10px] font-black text-blue-400 tracking-[3px] min-w-[60px] text-center">{pageNum} / {numPages}</span>
                <button onClick={() => onPageChange(Math.min(numPages, pageNum + 1))} className="text-slate-400 hover:text-white"><ChevronRight size={20}/></button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))} className="p-2 text-slate-400 hover:text-white"><ZoomOut size={18}/></button>
              <button onClick={() => onZoomChange(Math.min(2.5, zoom + 0.1))} className="p-2 text-slate-400 hover:text-white"><ZoomIn size={18}/></button>
            </div>
        </div>
    </div>
  );
};
