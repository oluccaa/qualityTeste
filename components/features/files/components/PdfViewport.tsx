import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

// 1. Importação correta do pacote NPM
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// 2. Configuração do Worker (A mágica acontece aqui)
// Usamos a propriedade 'version' da própria lib para garantir que o worker seja COMPATÍVEL.
// Isso evita o erro "Setting up fake worker failed".
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

interface PdfViewportProps {
  url: string | null;
  zoom: number;
  pageNum: number;
  onPdfLoad: (numPages: number) => void;
  renderOverlay?: (width: number, height: number) => React.ReactNode;
}

export const PdfViewport: React.FC<PdfViewportProps> = ({ 
  url, zoom, pageNum, onPdfLoad, renderOverlay
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [isRendering, setIsRendering] = useState(false);
  
  // Ref para guardar a tarefa atual e poder cancelar se o usuário mudar de página rápido
  const renderTaskRef = useRef<any>(null);

  // --- Efeito 1: Carregar o Documento PDF ---
  useEffect(() => {
    if (!url) return;

    let isMounted = true;

    const loadPdf = async () => {
      try {
        // Carrega o documento
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        if (isMounted) {
          setPdfDoc(pdf);
          onPdfLoad(pdf.numPages);
        }
      } catch (err) {
        console.error("Erro Crítico ao carregar PDF:", err);
      }
    };

    loadPdf();

    return () => { isMounted = false; };
  }, [url]); // Removemos onPdfLoad das dependências para evitar loops

  // --- Efeito 2: Renderizar a Página ---
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isMounted = true;

    const renderPage = async () => {
      // Se já houver uma renderização acontecendo, cancela ela
      if (renderTaskRef.current) {
        try {
          await renderTaskRef.current.cancel();
        } catch (error) {
          // Erros de cancelamento são esperados, ignoramos
        }
      }

      setIsRendering(true);

      try {
        const page = await pdfDoc.getPage(pageNum);
        
        // Configuração de Alta Resolução (Retina Display)
        const outputScale = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: zoom * outputScale });
        
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        // Define o tamanho real do canvas (memória)
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Define o tamanho visual (CSS) para manter o zoom correto
        // Dividimos pelo scale para voltar ao tamanho "lógico"
        const displayWidth = Math.floor(viewport.width / outputScale);
        const displayHeight = Math.floor(viewport.height / outputScale);
        
        if(isMounted) {
            setCanvasSize({ w: displayWidth, h: displayHeight });
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        
        if (isMounted) setIsRendering(false);

      } catch (e: any) {
        if (e.name !== 'RenderingCancelledException') {
          console.error("Erro de renderização:", e);
        }
        if (isMounted) setIsRendering(false);
      }
    };

    renderPage();

    return () => {
        isMounted = false;
        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }
    };
  }, [pdfDoc, pageNum, zoom]);

  return (
    <div className="flex-1 overflow-auto custom-scrollbar flex justify-center p-8 bg-[#020617] relative">
        <div 
          className={`relative shadow-[0_50px_100px_rgba(0,0,0,0.5)] bg-white transition-opacity duration-200 ${isRendering ? 'opacity-90' : 'opacity-100'}`}
          style={{ 
            width: canvasSize.w, 
            height: canvasSize.h, 
            minWidth: canvasSize.w,
            minHeight: canvasSize.h
          }}
        >
            <canvas ref={canvasRef} className="block w-full h-full" />
            {renderOverlay && renderOverlay(canvasSize.w, canvasSize.h)}
        </div>

        {(!pdfDoc || isRendering) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
             <div className="bg-[#020617]/80 p-4 rounded-xl flex flex-col items-center backdrop-blur-sm">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                   {pdfDoc ? 'Renderizando...' : 'Carregando...'}
                </p>
             </div>
          </div>
        )}
    </div>
  );
};