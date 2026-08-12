export interface Skin {
  id: string;
  name: string;
  swatch: string;
}

export const SKINS: Skin[] = [
  { id: 'violet', name: 'Violet', swatch: 'linear-gradient(135deg, #a855f7, #ec4899)' },
  { id: 'ocean', name: 'Ocean', swatch: 'linear-gradient(135deg, #0ea5e9, #22d3ee)' },
  { id: 'sunset', name: 'Sunset', swatch: 'linear-gradient(135deg, #f97316, #f43f5e)' },
  { id: 'forest', name: 'Forest', swatch: 'linear-gradient(135deg, #22c55e, #14b8a6)' },
  { id: 'midnight', name: 'Midnight', swatch: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
  { id: 'mono', name: 'Mono', swatch: 'linear-gradient(135deg, #a1a1aa, #e4e4e7)' },
];

export const DEFAULT_SKIN = 'violet';
