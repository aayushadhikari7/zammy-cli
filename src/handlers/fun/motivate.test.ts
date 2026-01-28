import { describe, it, expect } from 'vitest';
import { getRandomMotivation, getAllMotivations } from './motivate.js';

describe('motivate handler', () => {
  describe('getRandomMotivation', () => {
    it('returns a motivation object', () => {
      const result = getRandomMotivation();
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('category');
      expect(typeof result.text).toBe('string');
    });

    it('returns quotes when category is quote', () => {
      const result = getRandomMotivation('quote');
      expect(result.category).toBe('quote');
      expect(result.author).toBeDefined();
    });

    it('returns tips when category is tip', () => {
      const result = getRandomMotivation('tip');
      expect(result.category).toBe('tip');
    });

    it('returns affirmations when category is affirmation', () => {
      const result = getRandomMotivation('affirmation');
      expect(result.category).toBe('affirmation');
    });

    it('returns random motivations from all categories when no category specified', () => {
      const categories = new Set<string>();
      for (let i = 0; i < 50; i++) {
        categories.add(getRandomMotivation().category);
      }
      // Should eventually hit multiple categories
      expect(categories.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getAllMotivations', () => {
    it('returns all motivation categories', () => {
      const all = getAllMotivations();
      expect(all).toHaveProperty('quotes');
      expect(all).toHaveProperty('tips');
      expect(all).toHaveProperty('affirmations');
    });

    it('has non-empty arrays', () => {
      const all = getAllMotivations();
      expect(all.quotes.length).toBeGreaterThan(0);
      expect(all.tips.length).toBeGreaterThan(0);
      expect(all.affirmations.length).toBeGreaterThan(0);
    });

    it('quotes have authors', () => {
      const all = getAllMotivations();
      for (const quote of all.quotes) {
        expect(quote.author).toBeDefined();
      }
    });
  });
});
