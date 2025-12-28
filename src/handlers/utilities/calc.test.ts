import { describe, it, expect } from 'vitest';
import { calculate, isCalcError } from './calc.js';

describe('calc handler', () => {
  describe('calculate - basic operations', () => {
    it('should add numbers', () => {
      const result = calculate('2 + 2');
      expect(isCalcError(result)).toBe(false);
      if (!isCalcError(result)) {
        expect(result.result).toBe(4);
      }
    });

    it('should subtract numbers', () => {
      const result = calculate('10 - 3');
      if (!isCalcError(result)) {
        expect(result.result).toBe(7);
      }
    });

    it('should multiply numbers', () => {
      const result = calculate('6 * 7');
      if (!isCalcError(result)) {
        expect(result.result).toBe(42);
      }
    });

    it('should divide numbers', () => {
      const result = calculate('100 / 4');
      if (!isCalcError(result)) {
        expect(result.result).toBe(25);
      }
    });

    it('should handle modulo', () => {
      const result = calculate('17 % 5');
      if (!isCalcError(result)) {
        expect(result.result).toBe(2);
      }
    });

    it('should handle exponents with ^', () => {
      const result = calculate('2^8');
      if (!isCalcError(result)) {
        expect(result.result).toBe(256);
      }
    });
  });

  describe('calculate - complex expressions', () => {
    it('should respect operator precedence', () => {
      const result = calculate('2 + 3 * 4');
      if (!isCalcError(result)) {
        expect(result.result).toBe(14);
      }
    });

    it('should handle parentheses', () => {
      const result = calculate('(2 + 3) * 4');
      if (!isCalcError(result)) {
        expect(result.result).toBe(20);
      }
    });

    it('should handle nested parentheses', () => {
      const result = calculate('((2 + 3) * (4 - 1))');
      if (!isCalcError(result)) {
        expect(result.result).toBe(15);
      }
    });

    it('should handle decimals', () => {
      const result = calculate('3.14 * 2');
      if (!isCalcError(result)) {
        expect(result.result).toBeCloseTo(6.28);
      }
    });
  });

  describe('calculate - formatting', () => {
    it('should format result with expression', () => {
      const result = calculate('1000 + 234');
      if (!isCalcError(result)) {
        expect(result.expression).toBe('1000 + 234');
        expect(result.formatted).toBe('1,234');
      }
    });

    it('should format large numbers with commas', () => {
      const result = calculate('1000000 + 1');
      if (!isCalcError(result)) {
        expect(result.formatted).toBe('1,000,001');
      }
    });
  });

  describe('calculate - error handling', () => {
    it('should return error for invalid characters', () => {
      const result = calculate('2 + abc');
      expect(isCalcError(result)).toBe(true);
    });

    it('should return error for empty expression', () => {
      const result = calculate('');
      expect(isCalcError(result)).toBe(true);
    });

    it('should return error for division by zero', () => {
      const result = calculate('1 / 0');
      expect(isCalcError(result)).toBe(true);
    });
  });

  describe('isCalcError', () => {
    it('should return true for error results', () => {
      const result = calculate('invalid');
      expect(isCalcError(result)).toBe(true);
    });

    it('should return false for valid results', () => {
      const result = calculate('1 + 1');
      expect(isCalcError(result)).toBe(false);
    });
  });
});
