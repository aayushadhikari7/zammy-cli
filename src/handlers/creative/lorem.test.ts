import { describe, it, expect } from 'vitest';
import { generateLorem, wrapText } from './lorem.js';

describe('lorem handler', () => {
  describe('generateLorem', () => {
    it('should generate 1 paragraph by default', () => {
      const result = generateLorem();
      expect(result.paragraphCount).toBe(1);
      expect(result.paragraphs).toHaveLength(1);
    });

    it('should generate specified number of paragraphs', () => {
      const result = generateLorem(3);
      expect(result.paragraphCount).toBe(3);
      expect(result.paragraphs).toHaveLength(3);
    });

    it('should cap at 10 paragraphs maximum', () => {
      const result = generateLorem(20);
      expect(result.paragraphCount).toBe(10);
    });

    it('should generate at least 1 paragraph', () => {
      const result = generateLorem(0);
      expect(result.paragraphCount).toBe(1);
    });

    it('should use 5 sentences by default', () => {
      const result = generateLorem();
      expect(result.sentenceCount).toBe(5);
    });

    it('should use specified sentence count', () => {
      const result = generateLorem(1, 10);
      expect(result.sentenceCount).toBe(10);
    });

    it('should cap sentences at 20 maximum', () => {
      const result = generateLorem(1, 50);
      expect(result.sentenceCount).toBe(20);
    });

    it('should generate at least 1 sentence', () => {
      const result = generateLorem(1, 0);
      expect(result.sentenceCount).toBe(1);
    });

    it('should generate non-empty paragraphs', () => {
      const result = generateLorem(3, 5);
      for (const para of result.paragraphs) {
        expect(para.length).toBeGreaterThan(0);
      }
    });

    it('should capitalize first word of each sentence', () => {
      const result = generateLorem(1, 3);
      const sentences = result.paragraphs[0].split('. ');
      for (const sentence of sentences) {
        if (sentence.length > 0) {
          expect(sentence[0]).toMatch(/[A-Z]/);
        }
      }
    });

    it('should end sentences with periods', () => {
      const result = generateLorem(1, 3);
      expect(result.paragraphs[0].endsWith('.')).toBe(true);
    });
  });

  describe('wrapText', () => {
    it('should not wrap short text', () => {
      const result = wrapText('Short text', 50);
      expect(result).toEqual(['Short text']);
    });

    it('should wrap long text', () => {
      const text = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor';
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

    it('should handle width of 1', () => {
      const result = wrapText('a b c', 1);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });
});
