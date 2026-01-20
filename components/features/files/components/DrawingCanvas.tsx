
import React, { useRef, useEffect, useState } from 'react';

export type DrawingTool = 'pencil' | 'marker' | 'rect' | 'circle' | 'eraser' | 'hand';

interface DrawingCanvasProps {
  tool: DrawingTool;
  color: string;
  width: number;
  height: number;
  onSave?: (dataUrl: string) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ tool, color, width, height, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'hand') return;
    const pos = getPos(e);
    setIsDrawing(true);
    setStartPos(pos);
    
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'hand') return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext('2d')!;

    if (tool === 'pencil' || tool === 'marker' || tool === 'eraser') {
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = tool === 'marker' ? `${color}44` : color;
      ctx.lineWidth = tool === 'marker' ? 20 : tool === 'eraser' ? 30 : 2;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext('2d')!;

    if (tool === 'rect') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    } else if (tool === 'circle') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    setIsRenderingPersistent();
    setIsDrawing(false);
  };

  const setIsRenderingPersistent = () => {
    const canvas = canvasRef.current;
    if (canvas && onSave) {
        onSave(canvas.toDataURL());
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute inset-0 z-10 ${tool === 'hand' ? 'cursor-grab' : 'cursor-crosshair'}`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={() => setIsDrawing(false)}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
};
