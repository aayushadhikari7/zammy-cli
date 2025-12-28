import { randomUUID } from 'crypto';

export interface UuidResult {
  uuids: string[];
  count: number;
}

export function generateUuids(count: number = 1): UuidResult {
  const safeCount = Math.min(Math.max(1, count), 10);
  const uuids: string[] = [];

  for (let i = 0; i < safeCount; i++) {
    uuids.push(randomUUID());
  }

  return {
    uuids,
    count: safeCount,
  };
}
