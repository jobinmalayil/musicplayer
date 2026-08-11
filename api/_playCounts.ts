import { redis } from './_redis.js';

const PLAY_COUNTS_KEY = 'musically:playcounts';

export async function incrementPlayCount(trackId: string): Promise<number> {
  return redis().hincrby(PLAY_COUNTS_KEY, trackId, 1);
}

export async function getPlayCounts(): Promise<Record<string, number>> {
  const raw = (await redis().hgetall<Record<string, unknown>>(PLAY_COUNTS_KEY)) ?? {};
  const counts: Record<string, number> = {};
  for (const [id, value] of Object.entries(raw)) counts[id] = Number(value) || 0;
  return counts;
}
