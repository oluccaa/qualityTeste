
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

export const PdfViewport: React.FC<PdfViewportProps> = ({ url, zoom, pageNum, onPdfLoad, onPageChange, onZoomChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);

  const renderPage = useCallback(async (pdf: any, page: number, scale: number) => {
    if (!pdf || !canvasRef.current) return;

    // Se houver uma tarefa de renderização em andamento, cancela-a
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    try {
      const pageObj = await pdf.getPage(page);
      const viewport = pageObj.getViewport({ scale: scale * 2 }); 
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d')!;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const renderTask = pageObj.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (e: any) {
      if (e.name === 'RenderingCancelledException') {
        // Ignora erro de cancelamento, pois é esperado ao trocar de página/zoom rápido
        return;
      }
      console.error("PDF Render Error:", e);
      renderTaskRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    
    // Resetar estado anterior ao carregar novo URL
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const loadingTask = (window as any).pdfjsLib.getDocument(url);
    loadingTask.promise.then((pdf: any) => {
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      onPdfLoad(pdf.numPages);
      renderPage(pdf, pageNum, zoom);
      setLoading(false);
    }).catch((err: any) => {
      console.error("PDF Task Error:", err);
      setLoading(false);
    });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [url]);

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, pageNum, zoom);
  }, [pdfDoc, pageNum, zoom, renderPage]);

  return (
    <div className="flex-1 overflow-auto custom-scrollbar flex justify-center p-12 bg-slate-950/50 relative">
        <div className="relative shadow-[0_50px_120px_rgba(0,0,0,0.8)] rounded-sm bg-white overflow-hidden h-fit transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
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
                <button onClick={() => onPageChange(Math.max(1, pageNum - 1))} className="text-slate-400 hover:text-white transition-all"><ChevronLeft size={20}/></button>
                <span className="text-[10px] font-black text-blue-400 tracking-[3px] min-w-[60px] text-center">{pageNum} / {numPages}</span>
                <button onClick={() => onPageChange(Math.min(numPages, pageNum + 1))} className="text-slate-400 hover:text-white transition-all"><ChevronRight size={20}/></button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))} className="p-1.5 text-slate-400 hover:text-white transition-all"><ZoomOut size={18}/></button>
              <button onClick={() => onZoomChange(Math.min(2.5, zoom + 0.1))} className="p-1.5 text-slate-400 hover:text-white transition-all"><ZoomIn size={18}/></button>
            </div>
        </div>
    </div>
  );
};
