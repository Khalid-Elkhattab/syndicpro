import { useId } from 'react';

export type TileStatus = 'sold' | 'unsold' | 'pending' | 'paid' | 'overdue' | 'info' | 'neutral';

import type { GridTile } from './buildingGridData';
export type { GridTile };

const FILL: Record<TileStatus, string> = {
  sold: 'fill-success',
  paid: 'fill-success',
  unsold: 'fill-accent-400',
  pending: 'fill-info',
  overdue: 'fill-danger',
  info: 'fill-info',
  neutral: 'fill-brand-100',
};

const PATTERN: Record<TileStatus, string> = {
  sold: '✓',
  paid: '✓',
  unsold: '○',
  pending: '◐',
  overdue: '!',
  info: 'i',
  neutral: '',
};

/**
 * Building-grid motif: a facade of unit tiles by floor, tinted by status.
 * Never color alone — every tile carries a symbol plus a text legend.
 */
export function BuildingGrid({
  tiles,
  columns = 6,
  tileSize = 30,
  gap = 5,
  interactive = false,
  className = '',
  labelledBy,
}: {
  tiles: GridTile[];
  columns?: number;
  tileSize?: number;
  gap?: number;
  interactive?: boolean;
  className?: string;
  labelledBy?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const width = columns * (tileSize + gap) + gap;
  const rows = Math.ceil(tiles.length / columns);
  const height = rows * (tileSize + gap) + gap;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-labelledby={labelledBy ?? `bg-${uid}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      {tiles.map((tile, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = gap + col * (tileSize + gap);
        const y = gap + row * (tileSize + gap);
        const titleId = `bg-${uid}-t${i}`;
        return (
          <g key={i} className={interactive ? 'group cursor-pointer' : undefined}>
            <title id={titleId}>{tile.label}</title>
            <rect
              x={x}
              y={y}
              width={tileSize}
              height={tileSize}
              rx={6}
              className={`${FILL[tile.status]} ${interactive ? 'transition-transform group-hover:scale-105 group-focus:scale-105' : ''} stroke-white stroke-2`}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? tile.label : undefined}
            />
            {PATTERN[tile.status] !== '' && (
              <text
                x={x + tileSize / 2}
                y={y + tileSize / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={tileSize * 0.42}
                fontWeight={700}
                className="fill-white pointer-events-none select-none"
                aria-hidden="true"
              >
                {PATTERN[tile.status]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

