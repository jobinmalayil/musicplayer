import { redis } from './_redis.js';

const KEY = 'musically:metadata-overrides';

export interface MetadataOverride {
  title?: string;
  artist?: string;
  album?: string;
}

export async function getAllOverrides(): Promise<Record<string, MetadataOverride>> {
  return (await redis().hgetall<Record<string, MetadataOverride>>(KEY)) ?? {};
}

export async function setOverride(trackId: string, override: MetadataOverride): Promise<void> {
  await redis().hset(KEY, { [trackId]: override });
}

export async function clearOverride(trackId: string): Promise<void> {
  await redis().hdel(KEY, trackId);
}
