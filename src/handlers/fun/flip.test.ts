import { describe, it, expect } from 'vitest';
import { flipCoins, COIN_ART } from './flip.js';

describe('flip handler', () => {
  describe('COIN_ART', () => {
    it('should have art for heads and tails', () => {
      expect(COIN_ART.heads).toBeDefined();
      expect(COIN_ART.tails).toBeDefined();
    });

    it('should have same number of lines for heads and tails', () => {
      expect(COIN_ART.heads.length).toBe(COIN_ART.tails.length);
    });
  });

  describe('flipCoins', () => {
    it('should flip 1 coin by default', () => {
      const result = flipCoins();
      expect(result.count).toBe(1);
      expect(result.flips).toHaveLength(1);
    });

    it('should flip specified number of coins', () => {
      const result = flipCoins(5);
      expect(result.count).toBe(5);
      expect(result.flips).toHaveLength(5);
    });

    it('should cap at 10 coins maximum', () => {
      const result = flipCoins(20);
      expect(result.count).toBe(10);
      expect(result.flips).toHaveLength(10);
    });

    it('should flip at least 1 coin', () => {
      const result = flipCoins(0);
      expect(result.count).toBe(1);
    });

    it('should only produce heads or tails', () => {
      const result = flipCoins(10);
      for (const flip of result.flips) {
        expect(['heads', 'tails']).toContain(flip);
      }
    });

    it('should correctly count heads and tails', () => {
      const result = flipCoins(10);
      const heads = result.flips.filter(f => f === 'heads').length;
      const tails = result.flips.filter(f => f === 'tails').length;
      expect(result.headsCount).toBe(heads);
      expect(result.tailsCount).toBe(tails);
      expect(result.headsCount + result.tailsCount).toBe(10);
    });

    it('should produce roughly equal distribution over many flips', () => {
      // Flip 1000 coins and check distribution is roughly 50/50
      let totalHeads = 0;
      for (let i = 0; i < 100; i++) {
        const result = flipCoins(10);
        totalHeads += result.headsCount;
      }
      // Should be between 40% and 60% heads
      expect(totalHeads).toBeGreaterThan(400);
      expect(totalHeads).toBeLessThan(600);
    });
  });
});
