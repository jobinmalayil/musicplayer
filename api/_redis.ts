import { Redis } from '@upstash/redis';

let client: Redis | null = null;

export function redis(): Redis {
  if (client) return client;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Missing KV_REST_API_URL / KV_REST_API_TOKEN');
  client = new Redis({ url, token });
  return client;
}
