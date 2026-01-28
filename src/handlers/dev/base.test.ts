import { describe, it, expect } from 'vitest';
import { detectBase, parseNumber, convertBase, formatBinary } from './base.js';

describe('base handler', () => {
  describe('detectBase', () => {
    it('detects hex with 0x prefix', () => {
      expect(detectBase('0xFF')).toBe('hex');
      expect(detectBase('0x1A2B')).toBe('hex');
    });

    it('detects hex with # prefix', () => {
      expect(detectBase('#FF0000')).toBe('hex');
    });

    it('detects binary with 0b prefix', () => {
      expect(detectBase('0b1010')).toBe('binary');
      expect(detectBase('0b11110000')).toBe('binary');
    });

    it('detects octal with 0o prefix', () => {
      expect(detectBase('0o777')).toBe('octal');
      expect(detectBase('0o123')).toBe('octal');
    });

    it('detects binary patterns without prefix', () => {
      expect(detectBase('1010')).toBe('binary');
      expect(detectBase('11110000')).toBe('binary');
    });

    it('detects decimal numbers', () => {
      expect(detectBase('255')).toBe('decimal');
      expect(detectBase('12345')).toBe('decimal');
    });

    it('detects hex without prefix', () => {
      expect(detectBase('ff')).toBe('hex');
      expect(detectBase('deadbeef')).toBe('hex');
    });

    it('returns unknown for invalid input', () => {
      expect(detectBase('xyz')).toBe('unknown');
      expect(detectBase('hello')).toBe('unknown');
    });
  });

  describe('parseNumber', () => {
    it('parses hex with 0x prefix', () => {
      expect(parseNumber('0xFF')).toBe(255);
      expect(parseNumber('0x10')).toBe(16);
    });

    it('parses hex with # prefix', () => {
      expect(parseNumber('#FF')).toBe(255);
    });

    it('parses binary with 0b prefix', () => {
      expect(parseNumber('0b1010')).toBe(10);
      expect(parseNumber('0b11111111')).toBe(255);
    });

    it('parses octal with 0o prefix', () => {
      expect(parseNumber('0o777')).toBe(511);
      expect(parseNumber('0o10')).toBe(8);
    });

    it('parses decimal numbers', () => {
      expect(parseNumber('255')).toBe(255);
      expect(parseNumber('100')).toBe(100);
    });

    it('returns null for invalid input', () => {
      expect(parseNumber('xyz')).toBeNull();
      expect(parseNumber('')).toBeNull();
    });
  });

  describe('convertBase', () => {
    it('converts decimal to all bases', () => {
      const result = convertBase('255');
      expect(result).not.toBeNull();
      expect(result!.decimal).toBe('255');
      expect(result!.binary).toBe('0b11111111');
      expect(result!.octal).toBe('0o377');
      expect(result!.hex).toBe('0xFF');
    });

    it('converts hex to all bases', () => {
      const result = convertBase('0x10');
      expect(result).not.toBeNull();
      expect(result!.decimal).toBe('16');
      expect(result!.binary).toBe('0b10000');
      expect(result!.octal).toBe('0o20');
      expect(result!.hex).toBe('0x10');
    });

    it('converts binary to all bases', () => {
      const result = convertBase('0b1010');
      expect(result).not.toBeNull();
      expect(result!.decimal).toBe('10');
      expect(result!.binary).toBe('0b1010');
      expect(result!.octal).toBe('0o12');
      expect(result!.hex).toBe('0xA');
    });

    it('returns null for invalid input', () => {
      expect(convertBase('xyz')).toBeNull();
    });

    it('includes detected base', () => {
      expect(convertBase('0xFF')!.detected).toBe('hex');
      expect(convertBase('0b1010')!.detected).toBe('binary');
      expect(convertBase('255')!.detected).toBe('decimal');
    });
  });

  describe('formatBinary', () => {
    it('groups binary digits', () => {
      expect(formatBinary('0b11111111')).toBe('0b1111 1111');
      expect(formatBinary('0b1010')).toBe('0b1010');
    });

    it('pads to group size', () => {
      expect(formatBinary('0b101')).toBe('0b0101');
    });

    it('handles custom group size', () => {
      expect(formatBinary('0b11111111', 8)).toBe('0b11111111');
    });
  });
});
