/** Drive doesn't expose album art, so each track gets a stable color derived from its id. */
function hashString(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function trackHue(id: string): number {
  // Keep hues within the app's violet -> pink -> blue accent range for a cohesive theme.
  return 230 + (hashString(id) % 130);
}

export function trackGradient(id: string): string {
  const hue = trackHue(id);
  return `linear-gradient(135deg, hsl(${hue}, 85%, 65%), hsl(${(hue + 40) % 360}, 80%, 45%))`;
}

/** Deterministic pseudo-random bar heights (0-100) for a decorative waveform, stable per track id. */
export function waveformHeights(id: string, count: number): number[] {
  let seed = hashString(id) || 1;
  const next = () => {
    // xorshift32
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 0xffffffff;
  };
  return Array.from({ length: count }, () => 24 + Math.round(next() * 76));
}
