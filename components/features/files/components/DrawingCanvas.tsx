
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnnotationItem, NormalizedPoint, AnnotationType } from '../../../../types/metallurgy.ts';

export type DrawingTool = AnnotationType | 'hand';

interface DrawingCanvasProps {
  tool: DrawingTool;
  color: string;
  width: number;
  height: number;
  pageAnnotations: AnnotationItem[];
  onAnnotationsChange: (annotations: AnnotationItem[]) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  tool, color, width, height, pageAnnotations, onAnnotationsChange 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<NormalizedPoint[]>([]);
  const [startPoint, setStartPoint] = useState<NormalizedPoint | null>(null);

  // Redesenha todas as anotações existentes quando o zoom, tamanho ou lista de anotações mudar
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    pageAnnotations.forEach(ann => {
      ctx.beginPath();
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = ann.type === 'marker' ? 0.4 : 1.0;
      ctx.globalCompositeOperation = ann.type === 'eraser' ? 'destination-out' : 'source-over';

      if (ann.type === 'pencil' || ann.type === 'marker' || ann.type === 'eraser') {
        if (ann.points && ann.points.length > 0) {
          ctx.moveTo(ann.points[0].x * width, ann.points[0].y * height);
          ann.points.forEach(p => ctx.lineTo(p.x * width, p.y * height));
          ctx.stroke();
        }
      } else if (ann.type === 'rect' && ann.startPoint && ann.endPoint) {
        const x = ann.startPoint.x * width;
        const y = ann.startPoint.y * height;
        const w = (ann.endPoint.x - ann.startPoint.x) * width;
        const h = (ann.endPoint.y - ann.startPoint.y) * height;
        ctx.strokeRect(x, y, w, h);
      } else if (ann.type === 'circle' && ann.startPoint && ann.endPoint) {
        const x1 = ann.startPoint.x * width;
        const y1 = ann.startPoint.y * height;
        const x2 = ann.endPoint.x * width;
        const y2 = ann.endPoint.y * height;
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // Reset alpha e composite para desenhos futuros
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }, [pageAnnotations, width, height]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getNormalizedPos = (e: React.MouseEvent | React.TouchEvent): NormalizedPoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) / width,
      y: (clientY - rect.top) / height
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'hand') return;
    const pos = getNormalizedPos(e);
    setIsDrawing(true);
    
    if (tool === 'rect' || tool === 'circle') {
      setStartPoint(pos);
    } else {
      setCurrentPoints([pos]);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'hand') return;
    const pos = getNormalizedPos(e);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    // Desenho temporário (feedback visual imediato)
    if (tool === 'pencil' || tool === 'marker' || tool === 'eraser') {
      ctx.beginPath();
      ctx.strokeStyle = tool === 'marker' ? `${color}66` : color;
      ctx.lineWidth = tool === 'eraser' ? 30 : 2;
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      
      const lastPoint = currentPoints[currentPoints.length - 1];
      ctx.moveTo(lastPoint.x * width, lastPoint.y * height);
      ctx.lineTo(pos.x * width, pos.y * height);
      ctx.stroke();
      
      setCurrentPoints(prev => [...prev, pos]);
    }
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getNormalizedPos(e);
    
    const newAnnotation: AnnotationItem = {
      id: crypto.randomUUID(),
      type: tool as AnnotationType,
      color: color,
      lineWidth: tool === 'eraser' ? 30 : 2,
    };

    if (tool === 'pencil' || tool === 'marker' || tool === 'eraser') {
      newAnnotation.points = [...currentPoints, pos];
    } else if (tool === 'rect' || tool === 'circle') {
      newAnnotation.startPoint = startPoint!;
      newAnnotation.endPoint = pos;
    }

    onAnnotationsChange([...pageAnnotations, newAnnotation]);
    
    setIsDrawing(false);
    setCurrentPoints([]);
    setStartPoint(null);
    redraw(); // Garante a renderização final limpa
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute inset-0 z-20 ${tool === 'hand' ? 'pointer-events-none' : 'cursor-crosshair'}`}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={() => setIsDrawing(false)}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  );
};
