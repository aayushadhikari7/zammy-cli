import { describe, it, expect } from 'vitest';
import { rollDice, DICE_ART } from './dice.js';

describe('dice handler', () => {
  describe('DICE_ART', () => {
    it('should have art for all 6 sides', () => {
      expect(DICE_ART[1]).toBeDefined();
      expect(DICE_ART[2]).toBeDefined();
      expect(DICE_ART[3]).toBeDefined();
      expect(DICE_ART[4]).toBeDefined();
      expect(DICE_ART[5]).toBeDefined();
      expect(DICE_ART[6]).toBeDefined();
    });

    it('should have 5 lines per die', () => {
      for (let i = 1; i <= 6; i++) {
        expect(DICE_ART[i]).toHaveLength(5);
      }
    });
  });

  describe('rollDice', () => {
    it('should roll 1d6 by default', () => {
      const result = rollDice();
      expect(result.count).toBe(1);
      expect(result.sides).toBe(6);
      expect(result.rolls).toHaveLength(1);
    });

    it('should roll specified number of dice', () => {
      const result = rollDice(3);
      expect(result.count).toBe(3);
      expect(result.rolls).toHaveLength(3);
    });

    it('should cap at 6 dice maximum', () => {
      const result = rollDice(10);
      expect(result.count).toBe(6);
      expect(result.rolls).toHaveLength(6);
    });

    it('should roll at least 1 die', () => {
      const result = rollDice(0);
      expect(result.count).toBe(1);
    });

    it('should use specified number of sides', () => {
      const result = rollDice(1, 20);
      expect(result.sides).toBe(20);
      expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0]).toBeLessThanOrEqual(20);
    });

    it('should produce rolls within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDice(6, 6);
        for (const roll of result.rolls) {
          expect(roll).toBeGreaterThanOrEqual(1);
          expect(roll).toBeLessThanOrEqual(6);
        }
      }
    });

    it('should calculate correct total', () => {
      const result = rollDice(3, 6);
      const expectedTotal = result.rolls.reduce((a, b) => a + b, 0);
      expect(result.total).toBe(expectedTotal);
    });

    it('should set isStandardD6 for d6 with 3 or fewer dice', () => {
      expect(rollDice(1, 6).isStandardD6).toBe(true);
      expect(rollDice(2, 6).isStandardD6).toBe(true);
      expect(rollDice(3, 6).isStandardD6).toBe(true);
      expect(rollDice(4, 6).isStandardD6).toBe(false);
      expect(rollDice(1, 20).isStandardD6).toBe(false);
    });
  });
});
