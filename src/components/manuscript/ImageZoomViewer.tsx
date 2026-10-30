import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  RefreshCw,
  Eye,
  EyeOff,
  Move,
} from 'lucide-react';
import { TranscriptionLine } from '../../types';

interface ImageZoomViewerProps {
  imageUrl: string;
  altText: string;
  lines?: TranscriptionLine[];
  activeLineId?: string | null;
  onLineClick?: (line: TranscriptionLine) => void;
  showBoxesDefault?: boolean;
}

export const ImageZoomViewer: React.FC<ImageZoomViewerProps> = ({
  imageUrl,
  altText,
  lines = [],
  activeLineId = null,
  onLineClick,
  showBoxesDefault = true,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showBoxes, setShowBoxes] = useState(showBoxesDefault);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 4));
  };

  return (
    <div className="relative flex flex-col h-full bg-[#181A1D] rounded-xl overflow-hidden border border-stone-800 shadow-inner select-none">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-900/90 border-b border-stone-800 text-stone-300 z-10 backdrop-blur-xs">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded text-[11px]">
            {Math.round(scale * 100)}%
          </span>
          {lines.length > 0 && (
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                showBoxes
                  ? 'bg-teal-900/80 text-teal-200 border border-teal-700/50'
                  : 'hover:bg-stone-800 text-stone-400'
              }`}
              title="نمایش/پنهان‌سازی کادرهای سطور بازشناسی شده"
            >
              {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>سطور بازشناسی ({lines.length})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-white transition-colors"
            title="بزرگ‌نمایی (+)"
            aria-label="بزرگ‌نمایی"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-white transition-colors"
            title="کوچک‌نمایی (-)"
            aria-label="کوچک‌نمایی"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-white transition-colors"
            title="چرخش ۹۰ درجه"
            aria-label="چرخش ۹۰ درجه"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-white transition-colors"
            title="بازنشانی اندازه و زاویه"
            aria-label="بازنشانی"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative flex-1 overflow-hidden flex items-center justify-center p-4 ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            transformOrigin: 'center center',
          }}
          className="relative max-w-full max-h-full inline-block shadow-2xl rounded-sm overflow-hidden"
        >
          <img
            src={imageUrl}
            alt={altText}
            className="max-h-[68vh] object-contain block select-none pointer-events-none rounded-sm border border-stone-800"
            draggable={false}
          />

          {/* Line Bounding Boxes Overlay */}
          {showBoxes &&
            lines.map((line) => {
              if (!line.bbox) return null;
              const isActive = activeLineId === line.id;
              return (
                <div
                  key={line.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLineClick?.(line);
                  }}
                  title={`سطر ${line.lineNumber}: ${line.text} (اطمینان: ${line.confidence}%)`}
                  style={{
                    left: `${line.bbox.x}%`,
                    top: `${line.bbox.y}%`,
                    width: `${line.bbox.w}%`,
                    height: `${line.bbox.h}%`,
                  }}
                  className={`absolute border transition-all cursor-pointer pointer-events-auto rounded-xs ${
                    isActive
                      ? 'border-teal-400 bg-teal-500/25 ring-2 ring-teal-400/80 shadow-md'
                      : 'border-amber-400/60 bg-amber-400/10 hover:border-teal-300 hover:bg-teal-400/20'
                  }`}
                >
                  <span className="absolute top-0 right-0 bg-stone-900/90 text-[9px] text-amber-200 px-1 rounded-bl font-mono">
                    {line.lineNumber}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Subtle guide hint */}
      {scale > 1 && (
        <div className="absolute bottom-3 right-3 bg-stone-900/80 text-stone-300 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs pointer-events-none">
          <Move className="w-3 h-3 text-stone-400" />
          <span>برای جابجایی تصویر کلیک کنید و بکشید</span>
        </div>
      )}
    </div>
  );
};
