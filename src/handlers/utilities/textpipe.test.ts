import { describe, it, expect } from 'vitest';
import {
  sortLines,
  uniqueLines,
  transformCase,
  trimText,
  replaceText,
  numberLines,
  countStats,
  reverseText,
  filterLines,
  wrapText,
} from './textpipe.js';

describe('textpipe handler', () => {
  describe('sortLines', () => {
    it('sorts lines alphabetically', () => {
      const result = sortLines('c\na\nb');
      expect(result.output).toBe('a\nb\nc');
    });

    it('sorts in reverse', () => {
      const result = sortLines('a\nb\nc', { reverse: true });
      expect(result.output).toBe('c\nb\na');
    });

    it('sorts numerically', () => {
      const result = sortLines('10\n2\n1', { numeric: true });
      expect(result.output).toBe('1\n2\n10');
    });

    it('removes duplicates with unique', () => {
      const result = sortLines('a\nb\na', { unique: true });
      expect(result.output).toBe('a\nb');
    });
  });

  describe('uniqueLines', () => {
    it('removes duplicate lines', () => {
      const result = uniqueLines('a\nb\na\nc\nb');
      expect(result.output).toBe('a\nb\nc');
    });

    it('shows counts when requested', () => {
      const result = uniqueLines('a\na\nb', { count: true });
      expect(result.output).toContain('2');
      expect(result.output).toContain('1');
    });
  });

  describe('transformCase', () => {
    it('converts to uppercase', () => {
      const result = transformCase('hello world', 'upper');
      expect(result.output).toBe('HELLO WORLD');
    });

    it('converts to lowercase', () => {
      const result = transformCase('HELLO WORLD', 'lower');
      expect(result.output).toBe('hello world');
    });

    it('converts to title case', () => {
      const result = transformCase('hello world', 'title');
      expect(result.output).toBe('Hello World');
    });
  });

  describe('trimText', () => {
    it('trims whitespace from both ends', () => {
      const result = trimText('  hello  ');
      expect(result.output).toBe('hello');
    });

    it('trims each line when mode is lines', () => {
      const result = trimText('  a  \n  b  ', 'lines');
      expect(result.output).toBe('a\nb');
    });

    it('trims only start', () => {
      const result = trimText('  hello  ', 'start');
      expect(result.output).toBe('hello  ');
    });

    it('trims only end', () => {
      const result = trimText('  hello  ', 'end');
      expect(result.output).toBe('  hello');
    });
  });

  describe('replaceText', () => {
    it('replaces all occurrences by default', () => {
      const result = replaceText('hello hello', 'hello', 'hi');
      expect(result.output).toBe('hi hi');
    });

    it('replaces first occurrence only when global is false', () => {
      const result = replaceText('hello hello', 'hello', 'hi', { global: false });
      expect(result.output).toBe('hi hello');
    });

    it('supports regex patterns', () => {
      const result = replaceText('hello123world', '\\d+', '-', { regex: true });
      expect(result.output).toBe('hello-world');
    });

    it('supports case insensitive replacement', () => {
      const result = replaceText('Hello HELLO', 'hello', 'hi', { regex: true, ignoreCase: true });
      expect(result.output).toBe('hi hi');
    });
  });

  describe('numberLines', () => {
    it('adds line numbers', () => {
      const result = numberLines('a\nb\nc');
      expect(result.output).toMatch(/^\s*1\s+a/);
      expect(result.output).toContain('2');
      expect(result.output).toContain('3');
    });

    it('respects startFrom option', () => {
      const result = numberLines('a\nb', { startFrom: 10 });
      expect(result.output).toContain('10');
      expect(result.output).toContain('11');
    });
  });

  describe('countStats', () => {
    it('counts lines', () => {
      const result = countStats('a\nb\nc');
      expect(result.lines).toBe(3);
    });

    it('counts words', () => {
      const result = countStats('hello world foo');
      expect(result.words).toBe(3);
    });

    it('counts characters', () => {
      const result = countStats('hello');
      expect(result.chars).toBe(5);
    });

    it('handles empty string', () => {
      const result = countStats('');
      expect(result.lines).toBe(1);
      expect(result.words).toBe(0);
    });
  });

  describe('reverseText', () => {
    it('reverses lines', () => {
      const result = reverseText('a\nb\nc', 'lines');
      expect(result.output).toBe('c\nb\na');
    });

    it('reverses characters', () => {
      const result = reverseText('abc', 'chars');
      expect(result.output).toBe('cba');
    });

    it('reverses words', () => {
      const result = reverseText('hello world foo', 'words');
      expect(result.output).toBe('foo world hello');
    });
  });

  describe('filterLines', () => {
    it('filters lines containing pattern', () => {
      const result = filterLines('hello\nworld\nhello world', 'hello');
      expect(result.output).toBe('hello\nhello world');
    });

    it('inverts filter when requested', () => {
      const result = filterLines('hello\nworld\nfoo', 'hello', { invert: true });
      expect(result.output).toBe('world\nfoo');
    });

    it('supports regex patterns', () => {
      const result = filterLines('test1\ntest2\nfoo', '^test', { regex: true });
      expect(result.output).toBe('test1\ntest2');
    });
  });

  describe('wrapText', () => {
    it('wraps long lines', () => {
      const result = wrapText('hello world foo bar baz', 10);
      expect(result.output.split('\n').every(line => line.length <= 15)).toBe(true);
    });

    it('preserves short lines', () => {
      const result = wrapText('short', 80);
      expect(result.output).toBe('short');
    });
  });
});
