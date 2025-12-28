import { describe, it, expect } from 'vitest';
import { getFortune, wrapText } from './fortune.js';

describe('fortune handler', () => {
  describe('getFortune', () => {
    it('should return a fortune string', () => {
      const result = getFortune();
      expect(result.fortune).toBeDefined();
      expect(typeof result.fortune).toBe('string');
      expect(result.fortune.length).toBeGreaterThan(0);
    });

    it('should return a lucky number between 0 and 99', () => {
      for (let i = 0; i < 100; i++) {
        const result = getFortune();
        expect(result.luckyNumber).toBeGreaterThanOrEqual(0);
        expect(result.luckyNumber).toBeLessThan(100);
      }
    });

    it('should return a lucky item', () => {
      const result = getFortune();
      expect(result.luckyItem).toBeDefined();
      expect(typeof result.luckyItem).toBe('string');
      expect(result.luckyItem.length).toBeGreaterThan(0);
    });

    it('should return random fortunes', () => {
      const fortunes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        fortunes.add(getFortune().fortune);
      }
      // Should get at least a few different fortunes
      expect(fortunes.size).toBeGreaterThan(5);
    });
  });

  describe('wrapText', () => {
    it('should not wrap short text', () => {
      const result = wrapText('Hello world', 50);
      expect(result).toEqual(['Hello world']);
    });

    it('should wrap long text at word boundaries', () => {
      const text = 'This is a very long sentence that should be wrapped at the specified width';
      const result = wrapText(text, 30);
      expect(result.length).toBeGreaterThan(1);
      for (const line of result) {
        expect(line.length).toBeLessThanOrEqual(30);
      }
    });

    it('should handle empty string', () => {
      const result = wrapText('', 50);
      expect(result).toEqual([]);
    });

    it('should handle single word longer than width', () => {
      const result = wrapText('Supercalifragilisticexpialidocious', 10);
      expect(result).toHaveLength(1);
      // Word doesn't get split, just exceeds width
    });

    it('should preserve all words', () => {
      const text = 'one two three four five';
      const result = wrapText(text, 10);
      const rejoined = result.join(' ');
      expect(rejoined).toBe(text);
    });
  });
});
