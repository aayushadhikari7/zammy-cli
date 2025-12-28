import { describe, it, expect } from 'vitest';
import { encodeText, isValidMethod, SUPPORTED_METHODS } from './encode.js';

describe('encode handler', () => {
  describe('SUPPORTED_METHODS', () => {
    it('should include base64, url, hex', () => {
      expect(SUPPORTED_METHODS).toContain('base64');
      expect(SUPPORTED_METHODS).toContain('url');
      expect(SUPPORTED_METHODS).toContain('hex');
    });
  });

  describe('isValidMethod', () => {
    it('should return true for valid methods', () => {
      expect(isValidMethod('base64')).toBe(true);
      expect(isValidMethod('url')).toBe(true);
      expect(isValidMethod('hex')).toBe(true);
    });

    it('should return false for invalid methods', () => {
      expect(isValidMethod('invalid')).toBe(false);
      expect(isValidMethod('rot13')).toBe(false);
    });
  });

  describe('encodeText - base64', () => {
    it('should encode to base64', () => {
      const result = encodeText('hello', 'base64', 'encode');
      expect(result.output).toBe('aGVsbG8=');
      expect(result.method).toBe('BASE64');
      expect(result.direction).toBe('encode');
    });

    it('should decode from base64', () => {
      const result = encodeText('aGVsbG8=', 'base64', 'decode');
      expect(result.output).toBe('hello');
      expect(result.direction).toBe('decode');
    });

    it('should handle empty string', () => {
      const result = encodeText('', 'base64', 'encode');
      expect(result.output).toBe('');
    });
  });

  describe('encodeText - url', () => {
    it('should encode URL special characters', () => {
      const result = encodeText('hello world!', 'url', 'encode');
      expect(result.output).toBe('hello%20world!');
    });

    it('should decode URL encoded string', () => {
      const result = encodeText('hello%20world%21', 'url', 'decode');
      expect(result.output).toBe('hello world!');
    });

    it('should handle query string characters', () => {
      const result = encodeText('key=value&foo=bar', 'url', 'encode');
      expect(result.output).toBe('key%3Dvalue%26foo%3Dbar');
    });
  });

  describe('encodeText - hex', () => {
    it('should encode to hex', () => {
      const result = encodeText('hello', 'hex', 'encode');
      expect(result.output).toBe('68656c6c6f');
    });

    it('should decode from hex', () => {
      const result = encodeText('68656c6c6f', 'hex', 'decode');
      expect(result.output).toBe('hello');
    });

    it('should handle unicode', () => {
      const encoded = encodeText('日本', 'hex', 'encode');
      const decoded = encodeText(encoded.output, 'hex', 'decode');
      expect(decoded.output).toBe('日本');
    });
  });
});
