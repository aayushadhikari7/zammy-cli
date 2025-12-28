import { createHash } from 'crypto';

export interface HashResult {
  algorithm: string;
  input: string;
  hash: string;
}

export const SUPPORTED_ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512'] as const;
export type HashAlgorithm = typeof SUPPORTED_ALGORITHMS[number];

export function isValidAlgorithm(algo: string): algo is HashAlgorithm {
  return SUPPORTED_ALGORITHMS.includes(algo.toLowerCase() as HashAlgorithm);
}

export function computeHash(text: string, algorithm: HashAlgorithm = 'sha256'): HashResult {
  const hash = createHash(algorithm).update(text).digest('hex');

  return {
    algorithm: algorithm.toUpperCase(),
    input: text,
    hash,
  };
}
