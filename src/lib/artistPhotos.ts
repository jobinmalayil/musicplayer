// Small hand-curated lookup — Drive has no concept of an "artist photo",
// so this is the simplest way to give the one artist that matters here
// (you) a proper profile page instead of a plain gradient tile.
const ARTIST_PHOTOS: Record<string, string> = {
  'Jobin Abraham': '/artist-photos/jobin-abraham.jpg',
};

export function getArtistPhoto(name: string): string | undefined {
  return ARTIST_PHOTOS[name];
}
