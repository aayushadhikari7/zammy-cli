import { describe, it, expect } from 'vitest';
import { computeHash, isValidAlgorithm, SUPPORTED_ALGORITHMS } from './hash.js';

describe('hash handler', () => {
  describe('SUPPORTED_ALGORITHMS', () => {
    it('should include md5, sha1, sha256, sha512', () => {
      expect(SUPPORTED_ALGORITHMS).toContain('md5');
      expect(SUPPORTED_ALGORITHMS).toContain('sha1');
      expect(SUPPORTED_ALGORITHMS).toContain('sha256');
      expect(SUPPORTED_ALGORITHMS).toContain('sha512');
    });
  });

  describe('isValidAlgorithm', () => {
    it('should return true for valid algorithms', () => {
      expect(isValidAlgorithm('md5')).toBe(true);
      expect(isValidAlgorithm('sha1')).toBe(true);
      expect(isValidAlgorithm('sha256')).toBe(true);
      expect(isValidAlgorithm('sha512')).toBe(true);
    });

    it('should return true for uppercase algorithms', () => {
      expect(isValidAlgorithm('MD5')).toBe(true);
      expect(isValidAlgorithm('SHA256')).toBe(true);
    });

    it('should return false for invalid algorithms', () => {
      expect(isValidAlgorithm('invalid')).toBe(false);
      expect(isValidAlgorithm('sha999')).toBe(false);
      expect(isValidAlgorithm('')).toBe(false);
    });
  });

  describe('computeHash', () => {
    it('should compute SHA256 hash by default', () => {
      const result = computeHash('hello');
      expect(result.algorithm).toBe('SHA256');
      expect(result.input).toBe('hello');
      expect(result.hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('should compute MD5 hash', () => {
      const result = computeHash('hello', 'md5');
      expect(result.algorithm).toBe('MD5');
      expect(result.hash).toBe('5d41402abc4b2a76b9719d911017c592');
    });

    it('should compute SHA1 hash', () => {
      const result = computeHash('hello', 'sha1');
      expect(result.algorithm).toBe('SHA1');
      expect(result.hash).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
    });

    it('should compute SHA512 hash', () => {
      const result = computeHash('hello', 'sha512');
      expect(result.algorithm).toBe('SHA512');
      expect(result.hash).toHaveLength(128);
    });

    it('should handle empty string', () => {
      const result = computeHash('');
      expect(result.hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should handle unicode text', () => {
      const result = computeHash('こんにちは');
      expect(result.hash).toHaveLength(64);
      expect(result.input).toBe('こんにちは');
    });
  });
});
