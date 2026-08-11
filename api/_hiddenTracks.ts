import { redis } from './_redis.js';

const HIDDEN_KEY = 'musically:hidden';

export async function getHiddenTrackIds(): Promise<Set<string>> {
  const ids = await redis().smembers(HIDDEN_KEY);
  return new Set(ids);
}

export async function isTrackHidden(trackId: string): Promise<boolean> {
  const result = await redis().sismember(HIDDEN_KEY, trackId);
  return result === 1;
}

export async function hideTrack(trackId: string): Promise<void> {
  await redis().sadd(HIDDEN_KEY, trackId);
}

export async function unhideTrack(trackId: string): Promise<void> {
  await redis().srem(HIDDEN_KEY, trackId);
}
