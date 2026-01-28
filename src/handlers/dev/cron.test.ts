import { describe, it, expect } from 'vitest';
import { parseCronExpression, describeCron, getNextOccurrences, buildCronFromDescription } from './cron.js';

describe('cron handler', () => {
  describe('parseCronExpression', () => {
    it('parses valid 5-field expression', () => {
      const result = parseCronExpression('0 9 * * 1-5');
      expect(result).not.toBeNull();
      expect(result!.minute).toBe('0');
      expect(result!.hour).toBe('9');
      expect(result!.dayOfMonth).toBe('*');
      expect(result!.month).toBe('*');
      expect(result!.dayOfWeek).toBe('1-5');
    });

    it('returns null for invalid expression', () => {
      expect(parseCronExpression('invalid')).toBeNull();
      expect(parseCronExpression('0 9 *')).toBeNull();
      expect(parseCronExpression('0 9 * * * *')).toBeNull();
    });

    it('handles extra whitespace', () => {
      const result = parseCronExpression('  0   9   *   *   *  ');
      expect(result).not.toBeNull();
      expect(result!.minute).toBe('0');
    });
  });

  describe('describeCron', () => {
    it('describes every minute', () => {
      const result = describeCron('* * * * *');
      expect(result.isValid).toBe(true);
      expect(result.description).toContain('Every minute');
    });

    it('describes specific time', () => {
      const result = describeCron('30 9 * * *');
      expect(result.isValid).toBe(true);
      expect(result.description).toContain('9:30');
    });

    it('describes weekdays', () => {
      const result = describeCron('0 9 * * 1-5');
      expect(result.isValid).toBe(true);
      expect(result.description).toContain('Monday through Friday');
    });

    it('returns error for invalid expression', () => {
      const result = describeCron('invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('describes step values', () => {
      const result = describeCron('*/15 * * * *');
      expect(result.isValid).toBe(true);
      expect(result.description).toContain('15');
    });

    it('describes specific months', () => {
      const result = describeCron('0 0 1 1,6 *');
      expect(result.isValid).toBe(true);
      expect(result.description).toContain('January');
    });
  });

  describe('getNextOccurrences', () => {
    it('returns next occurrences', () => {
      const from = new Date('2024-01-01T00:00:00');
      const results = getNextOccurrences('0 9 * * *', 3, from);
      expect(results).toHaveLength(3);
      expect(results[0].getHours()).toBe(9);
      expect(results[0].getMinutes()).toBe(0);
    });

    it('respects weekday filter', () => {
      const from = new Date('2024-01-01T00:00:00'); // Monday
      const results = getNextOccurrences('0 9 * * 1', 3, from); // Mondays only
      for (const date of results) {
        expect(date.getDay()).toBe(1);
      }
    });

    it('returns empty for invalid expression', () => {
      const results = getNextOccurrences('invalid', 5);
      expect(results).toHaveLength(0);
    });

    it('handles step values', () => {
      const from = new Date('2024-01-01T00:00:00');
      const results = getNextOccurrences('*/30 * * * *', 4, from);
      expect(results).toHaveLength(4);
      for (const date of results) {
        expect(date.getMinutes() % 30).toBe(0);
      }
    });
  });

  describe('buildCronFromDescription', () => {
    it('builds every minute', () => {
      expect(buildCronFromDescription('every minute')).toBe('* * * * *');
    });

    it('builds every hour', () => {
      expect(buildCronFromDescription('every hour')).toBe('0 * * * *');
    });

    it('builds every day at time', () => {
      const result = buildCronFromDescription('every day at 9:00');
      expect(result).toBe('0 9 * * *');
    });

    it('builds weekdays at time', () => {
      const result = buildCronFromDescription('every weekday at 9am');
      expect(result).toBe('0 9 * * 1-5');
    });

    it('handles PM times', () => {
      const result = buildCronFromDescription('every day at 2pm');
      expect(result).toBe('0 14 * * *');
    });

    it('handles noon', () => {
      const result = buildCronFromDescription('every day at noon');
      expect(result).toBe('0 12 * * *');
    });

    it('handles midnight', () => {
      const result = buildCronFromDescription('every day at midnight');
      expect(result).toBe('0 0 * * *');
    });

    it('returns null for unparseable description', () => {
      expect(buildCronFromDescription('something random')).toBeNull();
    });
  });
});
