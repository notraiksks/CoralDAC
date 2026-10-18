import React, { useState, useRef } from 'react';
import { Layers, Grid3X3, EyeOff, Upload } from 'lucide-react';
import { ASSET_REFERENCES } from '../../assets';

interface BoundingBox {
  id: string;
  category: 'LC' | 'PB' | 'DC' | 'DCA';
  label: string;
  confidence: number;
  area: string;
  left: string;
  top: string;
  width: string;
  height: string;
  color: string;
}

const INITIAL_BOUNDING_BOXES: BoundingBox[] = [
  { id: 'box-1', category: 'LC', label: 'Living coral', confidence: 0.915, area: '0.13m²', left: '12%', top: '18%', width: '34%', height: '38%', color: 'var(--color-reef-lc)' },
  { id: 'box-2', category: 'PB', label: 'Partially bleached', confidence: 0.882, area: '0.12m²', left: '54%', top: '22%', width: '38%', height: '32%', color: 'var(--color-reef-pb)' },
  { id: 'box-3', category: 'DC', label: 'Dead coral', confidence: 0.820, area: '0.07m²', left: '16%', top: '62%', width: '28%', height: '26%', color: 'var(--color-reef-dc)' },
  { id: 'box-4', category: 'DCA', label: 'Dead coral, algae', confidence: 0.894, area: '0.11m²', left: '50%', top: '60%', width: '36%', height: '30%', color: 'var(--color-reef-dca)' },
];

interface QuadratViewportProps {
  onSelectCategory?: (category: 'LC' | 'PB' | 'DC' | 'DCA' | null) => void;
  selectedCategory?: string | null;
}

export const QuadratViewport: React.FC<QuadratViewportProps> = ({
  onSelectCategory,
  selectedCategory,
}) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.8);
  const [imageUrl, setImageUrl] = useState(ASSET_REFERENCES.quadratSurveySample);
  const [imageFileName, setImageFileName] = useState('IMG_4018_TRANSECT_B.JPG (8.4 MB)');
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageUrl(URL.createObjectURL(file));
      setImageFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    }
  };

  return (
    <div className="reef-r-xl bg-[color:var(--color-reef-deep)]/60 border border-[color:var(--color-reef-line)] flex flex-col overflow-hidden">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

      <div className="border-b border-[color:var(--color-reef-line)] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Grid3X3 className="text-[color:var(--color-reef-shallow-2)]" size={16} />
          <span className="text-[13px] font-medium text-[color:var(--color-reef-sand)]">
            1m² benthic survey quadrat
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className={`reef-r-full px-3 py-1.5 text-[11.5px] flex items-center gap-1.5 transition-colors cursor-pointer ${
              showBoxes
                ? 'bg-[color:var(--color-reef-shallow-2)] text-[#08191d] font-medium'
                : 'bg-white/5 text-[color:var(--color-reef-sand-dim)] hover:bg-white/10'
            }`}
          >
            {showBoxes ? <Layers size={12} /> : <EyeOff size={12} />}
            Detections
          </button>
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`reef-r-full px-3 py-1.5 text-[11.5px] flex items-center gap-1.5 transition-colors cursor-pointer ${
              showGrid
                ? 'bg-[color:var(--color-reef-shallow-2)] text-[#08191d] font-medium'
                : 'bg-white/5 text-[color:var(--color-reef-sand-dim)] hover:bg-white/10'
            }`}
          >
            <Grid3X3 size={12} />
            10cm grid
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="reef-r-full px-3 py-1.5 text-[11.5px] bg-white/5 hover:bg-white/10 text-[color:var(--color-reef-sand-dim)] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload size={12} />
            Replace photo
          </button>
        </div>
      </div>

      {/* ResNet50 confidence filter for the boxes below */}
      <div className="px-4 py-2.5 border-b border-[color:var(--color-reef-line)] flex items-center gap-3">
        <span className="text-[11px] text-[color:var(--color-reef-sand-dim)] whitespace-nowrap">
          ResNet50 confidence, minimum
        </span>
        <input
          type="range"
          min={0.5}
          max={0.99}
          step={0.01}
          value={confidenceThreshold}
          onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
          className="w-full accent-[color:var(--color-reef-shallow-2)] h-1.5 cursor-pointer"
        />
        <span className="text-[11.5px] text-[color:var(--color-reef-sand)] font-medium tabular-nums w-10 text-right">
          {confidenceThreshold.toFixed(2)}
        </span>
      </div>

      <div className="relative w-full aspect-[4/3] bg-black overflow-hidden">
        <img
          src={imageUrl}
          alt="Underwater photograph of a 1m² coral reef survey quadrat."
          className="w-full h-full object-cover opacity-95"
          referrerPolicy="no-referrer"
        />

        {showGrid && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-10 grid-rows-10 z-10">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="border border-white/10" />
            ))}
          </div>
        )}

        {showBoxes && (
          <div className="absolute inset-0 z-20">
            {INITIAL_BOUNDING_BOXES.map((box) => {
              const isSelected = selectedCategory === box.category;
              const isHovered = hoveredBox === box.id;
              const belowThreshold = box.confidence < confidenceThreshold;
              return (
                <div
                  key={box.id}
                  style={{
                    left: box.left,
                    top: box.top,
                    width: box.width,
                    height: box.height,
                    borderColor: box.color,
                    background: isHovered || isSelected ? `${box.color}33` : `${box.color}14`,
                    opacity: belowThreshold ? 0.25 : 1,
                  }}
                  onMouseEnter={() => setHoveredBox(box.id)}
                  onMouseLeave={() => setHoveredBox(null)}
                  onClick={() => onSelectCategory?.(isSelected ? null : box.category)}
                  className={`reef-r-md absolute border-2 cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-white' : ''
                  }`}
                >
                  <div
                    style={{ background: box.color }}
                    className="reef-r-full absolute -top-7 left-0 px-2 py-0.5 text-[10.5px] font-medium text-[#08191d] whitespace-nowrap"
                  >
                    {box.label} · {(box.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="absolute bottom-1 right-1 text-[9.5px] text-white bg-black/70 px-1 reef-r-md">
                    {box.area}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="reef-r-full absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 text-[10px] text-white/80 flex items-center gap-2 z-20">
          <span>0cm</span>
          <div className="w-14 h-[1.5px] bg-white/50" />
          <span>50cm</span>
          <div className="w-14 h-[1.5px] bg-white/50" />
          <span>100cm</span>
        </div>
      </div>

      <div className="px-4 py-2.5 text-[11.5px] text-[color:var(--color-reef-sand-dim)] flex flex-wrap items-center justify-between gap-y-1">
        <span>{imageFileName}</span>
        <span>Captured 2026-03-04 10:41 UTC</span>
      </div>
    </div>
  );
};
