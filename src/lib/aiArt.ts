/**
 * Free, no-API-key AI image generation via Pollinations.ai — used as a
 * fallback for tracks with no embedded cover art. The seed is derived from
 * the track id so the same track always gets the same image (acts as free
 * caching at the URL level too, since the URL itself is deterministic).
 */
function seededFrom(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 1_000_000;
}

export function getAiArtUrl(trackId: string, title: string): string {
  const prompt = [
    'abstract serene devotional album cover art',
    `for a spiritual song titled "${title}"`,
    'warm golden light, soft symbolic religious motifs, peaceful atmosphere',
    'minimalist digital painting, no text, no words, no letters',
  ].join(', ');

  const seed = seededFrom(trackId);
  const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
  url.searchParams.set('width', '512');
  url.searchParams.set('height', '512');
  url.searchParams.set('seed', String(seed));
  url.searchParams.set('nologo', 'true');
  return url.toString();
}
