import React, { useState, useRef } from 'react';
import { Layers, Grid3X3, EyeOff, Upload } from 'lucide-react';
import { ASSET_REFERENCES } from '../../assets';

interface BoundingBox {
  id: string;
  category: 'LC' | 'PB' | 'DC' | 'DCA';
  symbol: string;
  label: string;
  className: string;
  confidence: number;
  area: string;
  left: string;
  top: string;
  width: string;
  height: string;
  borderColor: string;
  bgColor: string;
  hoverBgColor: string;
  tagColor: string;
  tagTextColor: string;
}

const INITIAL_BOUNDING_BOXES: BoundingBox[] = [
  {
    id: 'box-1',
    category: 'LC',
    symbol: '■',
    label: '[LC]',
    className: 'Living Coral',
    confidence: 91.5,
    area: '0.13m²',
    left: '12%',
    top: '18%',
    width: '34%',
    height: '38%',
    borderColor: '#F2637A',
    bgColor: 'rgba(242, 99, 122, 0.12)',
    hoverBgColor: 'rgba(242, 99, 122, 0.25)',
    tagColor: '#F2637A',
    tagTextColor: '#FFFFFF',
  },
  {
    id: 'box-2',
    category: 'PB',
    symbol: '▲',
    label: '[PB]',
    className: 'Partially Bleached',
    confidence: 88.2,
    area: '0.12m²',
    left: '54%',
    top: '22%',
    width: '38%',
    height: '32%',
    borderColor: '#E8A93C',
    bgColor: 'rgba(232, 169, 60, 0.12)',
    hoverBgColor: 'rgba(232, 169, 60, 0.25)',
    tagColor: '#E8A93C',
    tagTextColor: '#1D1C13',
  },
  {
    id: 'box-3',
    category: 'DC',
    symbol: '■',
    label: '[DC]',
    className: 'Dead Coral',
    confidence: 82.0,
    area: '0.07m²',
    left: '16%',
    top: '62%',
    width: '28%',
    height: '26%',
    borderColor: '#8B8378',
    bgColor: 'rgba(139, 131, 120, 0.15)',
    hoverBgColor: 'rgba(139, 131, 120, 0.28)',
    tagColor: '#8B8378',
    tagTextColor: '#FFFFFF',
  },
  {
    id: 'box-4',
    category: 'DCA',
    symbol: '◆',
    label: '[DCA]',
    className: 'Dead Coral + Algae',
    confidence: 89.4,
    area: '0.11m²',
    left: '50%',
    top: '60%',
    width: '36%',
    height: '30%',
    borderColor: '#6B7A3A',
    bgColor: 'rgba(107, 122, 58, 0.15)',
    hoverBgColor: 'rgba(107, 122, 58, 0.28)',
    tagColor: '#6B7A3A',
    tagTextColor: '#FFFFFF',
  },
];

interface QuadratViewportProps {
  onSelectCategory?: (category: 'LC' | 'PB' | 'DC' | 'DCA' | null) => void;
  selectedCategory?: string | null;
}

export const QuadratViewport: React.FC<QuadratViewportProps> = ({
  onSelectCategory,
  selectedCategory,
}) => {
  const [showYolo, setShowYolo] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [confidenceThreshold] = useState(0.8);
  const [imageUrl, setImageUrl] = useState(ASSET_REFERENCES.quadratSurveySample);
  const [imageFileName, setImageFileName] = useState('IMG_4018_TRANSECT_B.JPG (8.4 MB)');
  const [activeHoveredBox, setActiveHoveredBox] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setImageFileName(`${file.name} (${sizeMB} MB)`);
    }
  };

  return (
    <div id="quadrat-viewport-card" className="bg-[#FEF9EB] border border-[#D1CBBF] flex flex-col">
      {/* Hidden File Input for Custom Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Card Structural Header with Controls */}
      <div className="border-b border-[#D1CBBF] bg-[#F9F3E5] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2">
          <Grid3X3 className="text-[#00475A]" size={18} />
          <span className="font-mono text-xs font-bold text-[#1D1C13] uppercase tracking-wider">
            1m² Benthic Survey Quadrat Photo
          </span>
        </div>

        {/* Overlay Control Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="toggle-yolo-btn"
            type="button"
            onClick={() => setShowYolo(!showYolo)}
            className={`px-2 py-0.5 font-mono text-[11px] border flex items-center gap-1 uppercase transition-colors ${
              showYolo
                ? 'border-[#00475A] bg-[#1E5F74] text-[#FFFFFF]'
                : 'border-[#D1CBBF] bg-[#FEF9EB] text-[#1D1C13] hover:bg-[#F3EEDF]'
            }`}
          >
            {showYolo ? <Layers size={13} /> : <EyeOff size={13} />}
            {showYolo ? 'Bounding Boxes [Active]' : 'Bounding Boxes [Hidden]'}
          </button>

          <button
            id="toggle-grid-btn"
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-0.5 font-mono text-[11px] border flex items-center gap-1 uppercase transition-colors ${
              showGrid
                ? 'border-[#00475A] bg-[#1E5F74] text-[#FFFFFF]'
                : 'border-[#D1CBBF] bg-[#FEF9EB] text-[#1D1C13] hover:bg-[#F3EEDF]'
            }`}
          >
            <Grid3X3 size={13} />
            {showGrid ? 'Hide 10cm Grid' : 'Show 10cm Grid'}
          </button>

          <button
            id="btn-upload-quadrat"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-0.5 font-mono text-[11px] border border-[#D1CBBF] bg-[#FEF9EB] text-[#1D1C13] hover:bg-[#F3EEDF] flex items-center gap-1 uppercase transition-colors"
            title="Upload custom survey photo"
          >
            <Upload size={12} className="text-[#00475A]" />
            Replace Photo
          </button>

          <div className="flex items-center gap-1 font-mono text-[11px] bg-[#F3EEDF] px-2 py-0.5 border border-[#D1CBBF]">
            <span className="text-[#70787C] uppercase">Conf:</span>
            <span className="font-semibold text-[#00475A]">
              ≥ {(confidenceThreshold).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Viewport Workspace Frame */}
      <div className="relative w-full aspect-[4/3] bg-[#0E171F] overflow-hidden select-none border-b border-[#D1CBBF] group">
        {/* Calibrated Photographic Plate */}
        <img
          id="quadrat-specimen-photo"
          src={imageUrl}
          alt="Scientific underwater marine photograph of a square one-meter coral reef survey quadrat resting on an ocean bed."
          className="w-full h-full object-cover opacity-95"
          referrerPolicy="no-referrer"
        />

        {/* Visual 10cm Reference Grid Overlay (10x10 Grid) */}
        {showGrid && (
          <div
            id="metric-grid-overlay"
            className="absolute inset-0 pointer-events-none grid grid-cols-10 grid-rows-10 border border-white/25 z-10"
          >
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="border border-white/10" />
            ))}
          </div>
        )}

        {/* Optical Registration Reticle Marks */}
        <div className="absolute top-2 left-2 text-white/60 font-mono text-[10px] pointer-events-none z-20">
          + [Q-LOC: NW 00,00]
        </div>
        <div className="absolute top-2 right-2 text-white/60 font-mono text-[10px] pointer-events-none z-20">
          + [Q-LOC: NE 10,00]
        </div>
        <div className="absolute bottom-2 left-2 text-white/60 font-mono text-[10px] pointer-events-none z-20">
          + [Q-LOC: SW 00,10]
        </div>
        <div className="absolute bottom-2 right-2 text-white/60 font-mono text-[10px] pointer-events-none z-20">
          + [Q-LOC: SE 10,10]
        </div>

        {/* BOUNDING BOXES CONTAINER */}
        {showYolo && (
          <div id="yolo-boxes-container" className="absolute inset-0 z-20">
            {INITIAL_BOUNDING_BOXES.map((box) => {
              const isSelected = selectedCategory === box.category;
              const isHovered = activeHoveredBox === box.id;

              return (
                <div
                  key={box.id}
                  id={`box-${box.category.toLowerCase()}`}
                  style={{
                    left: box.left,
                    top: box.top,
                    width: box.width,
                    height: box.height,
                    borderColor: box.borderColor,
                    backgroundColor: isHovered || isSelected ? box.hoverBgColor : box.bgColor,
                  }}
                  onMouseEnter={() => setActiveHoveredBox(box.id)}
                  onMouseLeave={() => setActiveHoveredBox(null)}
                  onClick={() => onSelectCategory?.(isSelected ? null : box.category)}
                  className={`absolute border-2 pointer-events-auto cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-white' : ''
                  }`}
                >
                  {/* Category Tag Badge */}
                  <div
                    style={{
                      backgroundColor: box.tagColor,
                      color: box.tagTextColor,
                    }}
                    className="absolute -top-6 left-0 px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap flex items-center gap-1 shadow-sm"
                  >
                    <span className="font-bold">{box.symbol} {box.label}</span>
                    <span>{box.confidence}% Conf · {box.className}</span>
                  </div>

                  {/* Surface Area Stamp */}
                  <div
                    style={{ color: box.tagColor }}
                    className="absolute bottom-1 right-1 font-mono text-[9px] bg-black/75 px-1 font-medium"
                  >
                    AREA: {box.area}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quadrat Frame Scale Bar */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/75 border border-white/30 px-2.5 py-0.5 font-mono text-[10px] text-white flex items-center gap-2 z-20">
          <span>0cm</span>
          <div className="w-16 h-[2px] bg-white relative">
            <div className="absolute left-1/2 -top-1 w-[1px] h-2 bg-white" />
          </div>
          <span>50cm</span>
          <div className="w-16 h-[2px] bg-white relative">
            <div className="absolute left-1/2 -top-1 w-[1px] h-2 bg-white" />
          </div>
          <span>100cm</span>
        </div>
      </div>

      {/* Photo File Attributes Ribbon */}
      <div className="px-4 py-2 bg-[#F9F3E5] font-mono text-xs text-[#53606D] flex flex-wrap items-center justify-between border-t border-[#D1CBBF] gap-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#1D1C13] font-semibold">File:</span>
          <span className="text-[#00475A] font-medium">{imageFileName}</span>
          <span className="text-[#70787C]">·</span>
          <span className="text-[#1D1C13] font-semibold">Format:</span>
          <span>Standard 1m² RGB Quadrat</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#1D1C13] font-semibold">Captured:</span>
          <span>2026-03-04 10:41:22 UTC</span>
        </div>
      </div>
    </div>
  );
};
