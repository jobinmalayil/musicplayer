import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { redis } from './_redis.js';
import type { Role } from './_session.js';

const USERS_KEY = 'musically:users';

export interface AppUser {
  username: string;
  passwordHash: string;
  role: Role;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, 'hex');
  const candidateBuf = scryptSync(password, salt, 64);
  return hashBuf.length === candidateBuf.length && timingSafeEqual(hashBuf, candidateBuf);
}

/** Seeds the very first admin from env vars — only used until any users are stored. */
function seedUsers(): AppUser[] {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;
  if (!username || !password) return [];
  return [{ username, passwordHash: hashPassword(password), role: 'admin' }];
}

export async function getUsers(): Promise<AppUser[]> {
  const users = await redis().get<AppUser[]>(USERS_KEY);
  return users && users.length > 0 ? users : seedUsers();
}

export async function saveUsers(users: AppUser[]): Promise<void> {
  await redis().set(USERS_KEY, users);
}

export { hashPassword };
