import React from 'react';
import { Crosshair, Plus, Minus, Maximize2 } from 'lucide-react';
import { CursorTelemetry } from '../../types';

interface CartographicControlsProps {
  cursorTelemetry: CursorTelemetry;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const CartographicControls: React.FC<CartographicControlsProps> = ({
  cursorTelemetry,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  return (
    <div
      id="cartographic-instrumentation-cluster"
      className="flex flex-col items-end gap-2.5 z-20 pointer-events-auto select-none"
    >
      {/* Coordinate & Cursor Telemetry Box */}
      <div
        id="cursor-telemetry-box"
        className="bg-[#FAF8F3] border border-[#16232E] px-3 py-1.5 flex items-center gap-3 font-mono text-[11px] shadow-[2px_2px_0px_#16232E]"
      >
        <div className="flex items-center gap-1.5">
          <Crosshair size={13} className="text-[#00475A]" />
          <span className="text-[#53606D] text-[10px]">CURSOR:</span>
          <span className="font-semibold text-[#1D1C13] tabular-nums">
            {cursorTelemetry.lat}, {cursorTelemetry.lng}
          </span>
        </div>
        <div className="h-3 w-[1px] bg-[#C0C8CC]" />
        <div>
          <span className="text-[#53606D] text-[10px]">DEPTH:</span>{' '}
          <span className="font-semibold text-[#1D1C13] tabular-nums">
            {cursorTelemetry.depth}
          </span>
        </div>
      </div>

      {/* Navigation & Technical Controls Group */}
      <div className="flex items-end gap-2.5">
        {/* Zoom Controls Stack */}
        <div
          id="cartographic-zoom-controls"
          className="flex flex-col bg-[#FAF8F3] border border-[#16232E] shadow-[2px_2px_0px_#16232E]"
        >
          <button
            id="btn-zoom-in"
            onClick={onZoomIn}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#F3EEDF] border-b border-[#16232E] text-[#1D1C13] transition-colors cursor-pointer"
            title="Zoom In (+)"
            type="button"
          >
            <Plus size={16} />
          </button>
          <button
            id="btn-zoom-reset"
            onClick={onResetZoom}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#F3EEDF] border-b border-[#16232E] text-[#1D1C13] transition-colors cursor-pointer"
            title="Reset Extents"
            type="button"
          >
            <Maximize2 size={14} />
          </button>
          <button
            id="btn-zoom-out"
            onClick={onZoomOut}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#F3EEDF] text-[#1D1C13] transition-colors cursor-pointer"
            title="Zoom Out (-)"
            type="button"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
