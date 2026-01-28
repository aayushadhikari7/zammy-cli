import { describe, it, expect } from 'vitest';
import { testRegex, parseFlags, getPattern, getPatternNames, highlightMatches, PATTERN_LIBRARY } from './regex.js';

describe('regex handler', () => {
  describe('testRegex', () => {
    it('finds matches with global flag', () => {
      const result = testRegex('\\d+', 'abc 123 def 456', 'g');
      expect(result.isValid).toBe(true);
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0].match).toBe('123');
      expect(result.matches[1].match).toBe('456');
    });

    it('finds single match without global flag', () => {
      const result = testRegex('\\d+', 'abc 123 def 456', '');
      expect(result.isValid).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].match).toBe('123');
    });

    it('returns empty matches for no match', () => {
      const result = testRegex('\\d+', 'no numbers here', 'g');
      expect(result.isValid).toBe(true);
      expect(result.matches).toHaveLength(0);
    });

    it('handles invalid regex', () => {
      const result = testRegex('[invalid', 'test', 'g');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('captures named groups', () => {
      const result = testRegex('(?<year>\\d{4})-(?<month>\\d{2})', '2024-01', 'g');
      expect(result.matches[0].groups.year).toBe('2024');
      expect(result.matches[0].groups.month).toBe('01');
    });

    it('captures match index', () => {
      const result = testRegex('world', 'hello world', 'g');
      expect(result.matches[0].index).toBe(6);
    });

    it('handles case insensitive flag', () => {
      const result = testRegex('hello', 'HELLO world', 'gi');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].match).toBe('HELLO');
    });
  });

  describe('parseFlags', () => {
    it('keeps valid flags', () => {
      expect(parseFlags('gim')).toBe('gim');
    });

    it('removes invalid flags', () => {
      expect(parseFlags('gxwz')).toBe('g');
    });

    it('handles empty string', () => {
      expect(parseFlags('')).toBe('');
    });

    it('preserves all valid flags', () => {
      expect(parseFlags('gimsuy')).toBe('gimsuy');
    });
  });

  describe('PATTERN_LIBRARY', () => {
    it('has email pattern', () => {
      expect(PATTERN_LIBRARY.email).toBeDefined();
      const regex = new RegExp(PATTERN_LIBRARY.email.pattern);
      expect(regex.test('test@example.com')).toBe(true);
      expect(regex.test('invalid')).toBe(false);
    });

    it('has url pattern', () => {
      expect(PATTERN_LIBRARY.url).toBeDefined();
      const regex = new RegExp(PATTERN_LIBRARY.url.pattern);
      expect(regex.test('https://example.com')).toBe(true);
    });

    it('has ipv4 pattern', () => {
      expect(PATTERN_LIBRARY.ipv4).toBeDefined();
      const regex = new RegExp(PATTERN_LIBRARY.ipv4.pattern);
      expect(regex.test('192.168.1.1')).toBe(true);
      expect(regex.test('999.999.999.999')).toBe(false);
    });

    it('has date pattern', () => {
      expect(PATTERN_LIBRARY.date).toBeDefined();
      const regex = new RegExp(PATTERN_LIBRARY.date.pattern);
      expect(regex.test('2024-01-15')).toBe(true);
    });

    it('has uuid pattern', () => {
      expect(PATTERN_LIBRARY.uuid).toBeDefined();
      const regex = new RegExp(PATTERN_LIBRARY.uuid.pattern);
      expect(regex.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
  });

  describe('getPattern', () => {
    it('returns pattern by name', () => {
      const pattern = getPattern('email');
      expect(pattern).not.toBeNull();
      expect(pattern!.pattern).toBeDefined();
      expect(pattern!.description).toBeDefined();
    });

    it('returns null for unknown pattern', () => {
      expect(getPattern('unknown')).toBeNull();
    });

    it('is case insensitive', () => {
      expect(getPattern('EMAIL')).not.toBeNull();
    });
  });

  describe('getPatternNames', () => {
    it('returns array of pattern names', () => {
      const names = getPatternNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names).toContain('email');
      expect(names).toContain('url');
    });
  });

  describe('highlightMatches', () => {
    it('highlights matches in input', () => {
      const matches = [{ match: 'world', index: 6, groups: {} }];
      const result = highlightMatches('hello world', matches);
      expect(result).toContain('\x1b[43m');
      expect(result).toContain('world');
    });

    it('returns input unchanged if no matches', () => {
      const result = highlightMatches('hello world', []);
      expect(result).toBe('hello world');
    });

    it('handles multiple matches', () => {
      const matches = [
        { match: 'a', index: 0, groups: {} },
        { match: 'a', index: 2, groups: {} },
      ];
      const result = highlightMatches('aba', matches);
      expect(result.match(/\x1b\[43m/g)).toHaveLength(2);
    });
  });
});
