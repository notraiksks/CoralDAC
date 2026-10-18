import React from 'react';
import { Plus, Minus, Maximize2 } from 'lucide-react';

interface CartographicControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const CartographicControls: React.FC<CartographicControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  return (
    <div
      id="cartographic-zoom-controls"
      className="reef-r-xl flex flex-col bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] overflow-hidden pointer-events-auto select-none"
    >
      <button
        onClick={onZoomIn}
        className="w-10 h-10 flex items-center justify-center hover:bg-white/5 border-b border-[color:var(--color-reef-line)] text-[color:var(--color-reef-sand)] transition-colors cursor-pointer"
        title="Zoom in"
        type="button"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={onResetZoom}
        className="w-10 h-10 flex items-center justify-center hover:bg-white/5 border-b border-[color:var(--color-reef-line)] text-[color:var(--color-reef-sand)] transition-colors cursor-pointer"
        title="Reset view"
        type="button"
      >
        <Maximize2 size={14} />
      </button>
      <button
        onClick={onZoomOut}
        className="w-10 h-10 flex items-center justify-center hover:bg-white/5 text-[color:var(--color-reef-sand)] transition-colors cursor-pointer"
        title="Zoom out"
        type="button"
      >
        <Minus size={16} />
      </button>
    </div>
  );
};
