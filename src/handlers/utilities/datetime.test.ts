import { describe, it, expect } from 'vitest';
import {
  parseDate,
  parseDuration,
  addDuration,
  diffDates,
  getTimezoneOffset,
  formatDate,
  getRelativeTime,
  convertTimezone,
  formatInTimezone,
} from './datetime.js';

describe('datetime handler', () => {
  describe('parseDate', () => {
    it('parses "now" as current date', () => {
      const before = Date.now();
      const result = parseDate('now');
      const after = Date.now();
      expect(result!.getTime()).toBeGreaterThanOrEqual(before);
      expect(result!.getTime()).toBeLessThanOrEqual(after);
    });

    it('parses empty string as current date', () => {
      const result = parseDate('');
      expect(result).not.toBeNull();
    });

    it('parses unix timestamp in seconds', () => {
      const result = parseDate('1704067200');
      expect(result!.getTime()).toBe(1704067200000);
    });

    it('parses unix timestamp in milliseconds', () => {
      const result = parseDate('1704067200000');
      expect(result!.getTime()).toBe(1704067200000);
    });

    it('parses ISO date string', () => {
      const result = parseDate('2024-01-01T00:00:00Z');
      expect(result!.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });

    it('parses simple date string', () => {
      const result = parseDate('2024-01-15');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2024);
    });

    it('returns null for invalid date', () => {
      expect(parseDate('not a date xyz')).toBeNull();
    });
  });

  describe('parseDuration', () => {
    it('parses simple durations', () => {
      expect(parseDuration('5d')).toEqual({ days: 5 });
      expect(parseDuration('2h')).toEqual({ hours: 2 });
      expect(parseDuration('30m')).toEqual({ minutes: 30 });
    });

    it('parses full words', () => {
      expect(parseDuration('5 days')).toEqual({ days: 5 });
      expect(parseDuration('2 hours')).toEqual({ hours: 2 });
      expect(parseDuration('1 week')).toEqual({ weeks: 1 });
    });

    it('parses combined durations', () => {
      const result = parseDuration('2d 5h 30m');
      expect(result).toEqual({ days: 2, hours: 5, minutes: 30 });
    });

    it('returns null for invalid duration', () => {
      expect(parseDuration('invalid')).toBeNull();
    });
  });

  describe('addDuration', () => {
    it('adds days', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = addDuration(date, { days: 5 });
      expect(result.getDate()).toBe(6);
    });

    it('adds hours', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = addDuration(date, { hours: 3 });
      expect(result.getUTCHours()).toBe(3);
    });

    it('adds multiple units', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = addDuration(date, { days: 1, hours: 2, minutes: 30 });
      expect(result.getUTCDate()).toBe(2);
      expect(result.getUTCHours()).toBe(2);
      expect(result.getUTCMinutes()).toBe(30);
    });

    it('handles month overflow', () => {
      const date = new Date('2024-01-31T00:00:00Z');
      const result = addDuration(date, { months: 1 });
      expect(result.getUTCMonth()).toBe(2); // March (0-indexed)
    });
  });

  describe('diffDates', () => {
    it('calculates difference in days', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-06T00:00:00Z');
      const result = diffDates(date1, date2);
      expect(result.days).toBe(5);
      expect(result.hours).toBe(0);
    });

    it('calculates difference with hours and minutes', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-01T02:30:00Z');
      const result = diffDates(date1, date2);
      expect(result.days).toBe(0);
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(30);
    });

    it('works with dates in reverse order', () => {
      const date1 = new Date('2024-01-06T00:00:00Z');
      const date2 = new Date('2024-01-01T00:00:00Z');
      const result = diffDates(date1, date2);
      expect(result.days).toBe(5);
    });
  });

  describe('getTimezoneOffset', () => {
    it('returns offset for common timezones', () => {
      expect(getTimezoneOffset('UTC')).toBe(0);
      expect(getTimezoneOffset('EST')).toBe(-5);
      expect(getTimezoneOffset('PST')).toBe(-8);
      expect(getTimezoneOffset('JST')).toBe(9);
    });

    it('parses UTC+X format', () => {
      expect(getTimezoneOffset('UTC+5')).toBe(5);
      expect(getTimezoneOffset('UTC-8')).toBe(-8);
      expect(getTimezoneOffset('UTC+5:30')).toBe(5.5);
    });

    it('returns null for unknown timezone', () => {
      expect(getTimezoneOffset('INVALID')).toBeNull();
    });

    it('is case insensitive', () => {
      expect(getTimezoneOffset('utc')).toBe(0);
      expect(getTimezoneOffset('est')).toBe(-5);
    });
  });

  describe('formatDate', () => {
    it('formats with YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
    });

    it('formats with time', () => {
      const date = new Date('2024-01-15T10:30:45Z');
      // Note: this will format in local time
      const result = formatDate(date, 'HH:mm:ss');
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('formats with AM/PM', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatDate(date, 'hh:mm A');
      expect(result).toContain('PM');
    });
  });

  describe('getRelativeTime', () => {
    it('returns "ago" for past dates', () => {
      const date = new Date(Date.now() - 60000); // 1 minute ago
      expect(getRelativeTime(date)).toContain('ago');
    });

    it('returns "in" for future dates', () => {
      const date = new Date(Date.now() + 60000); // 1 minute from now
      expect(getRelativeTime(date)).toContain('in');
    });
  });

  describe('convertTimezone', () => {
    it('converts between timezones', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const result = convertTimezone(date, 'UTC', 'EST');
      expect(result).not.toBeNull();
    });

    it('returns null for invalid timezone', () => {
      const date = new Date();
      expect(convertTimezone(date, 'INVALID', 'UTC')).toBeNull();
    });
  });

  describe('formatInTimezone', () => {
    it('formats date in specified timezone', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const result = formatInTimezone(date, 0); // UTC
      // Result should be a formatted date string
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('applies timezone offset', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const utcResult = formatInTimezone(date, 0);
      const estResult = formatInTimezone(date, -5); // EST is UTC-5
      // EST should show 5 hours earlier
      expect(utcResult).not.toBe(estResult);
    });
  });
});
