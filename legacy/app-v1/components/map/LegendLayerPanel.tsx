import React from 'react';
import { MapFilters } from '../../types';

interface LegendLayerPanelProps {
  filters: MapFilters;
  onChangeFilters: (newFilters: MapFilters) => void;
}

const CLASSES: { key: keyof MapFilters['layers']; label: string; color: string }[] = [
  { key: 'lc', label: 'Living coral', color: 'var(--color-reef-lc)' },
  { key: 'pb', label: 'Partially bleached', color: 'var(--color-reef-pb)' },
  { key: 'dc', label: 'Dead coral', color: 'var(--color-reef-dc)' },
  { key: 'dca', label: 'Dead coral, algae', color: 'var(--color-reef-dca)' },
];

// Horizontal row of health-class toggles, styled to sit inline in the map
// topbar — mirrors the `.legend` block in the ui.zip reference exactly.
export const LegendLayerPanel: React.FC<LegendLayerPanelProps> = ({
  filters,
  onChangeFilters,
}) => {
  const toggleLayer = (layerKey: keyof MapFilters['layers']) => {
    onChangeFilters({
      ...filters,
      layers: { ...filters.layers, [layerKey]: !filters.layers[layerKey] },
    });
  };

  return (
    <div className="reef-r-xl ml-auto flex flex-wrap items-center gap-3.5 bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] px-3.5 py-2.5 pointer-events-auto select-none">
      {CLASSES.map((c) => {
        const active = filters.layers[c.key];
        return (
          <label
            key={c.key}
            className={`flex items-center gap-1.5 cursor-pointer text-[12.5px] transition-colors ${
              active ? 'text-[color:var(--color-reef-sand)]' : 'text-[color:var(--color-reef-sand-dim)]'
            }`}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggleLayer(c.key)}
              className="sr-only"
            />
            <span
              className="reef-r-sm w-[13px] h-[13px] flex-shrink-0 transition-opacity"
              style={{
                background: c.color,
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.25)',
                opacity: active ? 1 : 0.25,
              }}
            />
            <span>{c.label}</span>
          </label>
        );
      })}
    </div>
  );
};
