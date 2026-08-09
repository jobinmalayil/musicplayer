/** Drive doesn't expose album art, so each track gets a stable color derived from its id. */
function trackHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function trackGradient(id: string): string {
  const hue = trackHue(id);
  return `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${(hue + 45) % 360}, 70%, 42%))`;
}
