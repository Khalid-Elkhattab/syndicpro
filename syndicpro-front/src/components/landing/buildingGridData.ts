import type { TileStatus } from './BuildingGrid';

export interface GridTile {
  status: TileStatus;
  label: string;
}

/** Deterministic sample facade (sample data only — never real figures). */
export function sampleFacade(seedStatuses: TileStatus[] = []): GridTile[] {
  const fallback: TileStatus[] = [
    'sold', 'sold', 'unsold', 'sold', 'pending', 'sold',
    'sold', 'unsold', 'sold', 'sold', 'sold', 'pending',
    'unsold', 'sold', 'sold', 'unsold', 'sold', 'sold',
    'sold', 'sold', 'pending', 'sold', 'unsold', 'sold',
  ];
  const statuses = seedStatuses.length > 0 ? seedStatuses : fallback;
  return statuses.map((status, i) => ({
    status,
    label: `Local ${i + 1} — ${status}`,
  }));
}
