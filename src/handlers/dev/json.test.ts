import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import {
  validateJson,
  formatJson,
  minifyJson,
  queryJson,
  readJsonFile,
  getJsonStats,
} from './json.js';

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

describe('json handler', () => {
  describe('validateJson()', () => {
    it('should validate valid JSON object', () => {
      const result = validateJson('{"name": "test"}');
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'test' });
      expect(result.error).toBeUndefined();
    });

    it('should validate valid JSON array', () => {
      const result = validateJson('[1, 2, 3]');
      expect(result.valid).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it('should validate JSON primitives', () => {
      expect(validateJson('"hello"').valid).toBe(true);
      expect(validateJson('123').valid).toBe(true);
      expect(validateJson('true').valid).toBe(true);
      expect(validateJson('false').valid).toBe(true);
      expect(validateJson('null').valid).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const result = validateJson('not json');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject malformed JSON', () => {
      expect(validateJson('{name: "test"}').valid).toBe(false); // Missing quotes on key
      expect(validateJson('{"name": test}').valid).toBe(false); // Missing quotes on value
      expect(validateJson('{').valid).toBe(false); // Incomplete
      expect(validateJson('[1, 2,]').valid).toBe(false); // Trailing comma
    });

    it('should reject empty string', () => {
      const result = validateJson('');
      expect(result.valid).toBe(false);
    });

    it('should handle nested objects', () => {
      const result = validateJson('{"a": {"b": {"c": 1}}}');
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ a: { b: { c: 1 } } });
    });

    it('should handle special characters in strings', () => {
      const result = validateJson('{"msg": "Hello\\nWorld"}');
      expect(result.valid).toBe(true);
      expect((result.data as any).msg).toBe('Hello\nWorld');
    });

    it('should handle unicode in strings', () => {
      const result = validateJson('{"emoji": "\\u0048\\u0065\\u006c\\u006c\\u006f"}');
      expect(result.valid).toBe(true);
      expect((result.data as any).emoji).toBe('Hello');
    });
  });

  describe('formatJson()', () => {
    it('should format JSON with default indent', () => {
      const result = formatJson('{"a":1,"b":2}');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('{\n  "a": 1,\n  "b": 2\n}');
    });

    it('should format JSON with custom indent', () => {
      const result = formatJson('{"a":1}', 4);
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('{\n    "a": 1\n}');
    });

    it('should format arrays', () => {
      const result = formatJson('[1,2,3]');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('should return error for invalid JSON', () => {
      const result = formatJson('invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle deeply nested structures', () => {
      const result = formatJson('{"a":{"b":{"c":{"d":1}}}}');
      expect(result.valid).toBe(true);
      expect(result.formatted).toContain('    "d": 1');
    });
  });

  describe('minifyJson()', () => {
    it('should minify formatted JSON', () => {
      const formatted = '{\n  "a": 1,\n  "b": 2\n}';
      const result = minifyJson(formatted);
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('{"a":1,"b":2}');
    });

    it('should handle already minified JSON', () => {
      const result = minifyJson('{"a":1}');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('{"a":1}');
    });

    it('should minify arrays', () => {
      const result = minifyJson('[ 1, 2, 3 ]');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('[1,2,3]');
    });

    it('should return error for invalid JSON', () => {
      const result = minifyJson('invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('queryJson()', () => {
    const testData = '{"user": {"name": "John", "age": 30}, "items": [1, 2, 3]}';

    it('should query top-level property', () => {
      const result = queryJson(testData, 'user');
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 30 });
    });

    it('should query nested property', () => {
      const result = queryJson(testData, 'user.name');
      expect(result.valid).toBe(true);
      expect(result.data).toBe('John');
    });

    it('should query array by index', () => {
      const result = queryJson(testData, 'items[0]');
      expect(result.valid).toBe(true);
      expect(result.data).toBe(1);
    });

    it('should query array item property', () => {
      const data = '{"users": [{"name": "Alice"}, {"name": "Bob"}]}';
      const result = queryJson(data, 'users[1].name');
      expect(result.valid).toBe(true);
      expect(result.data).toBe('Bob');
    });

    it('should handle $ prefix in path', () => {
      const result = queryJson(testData, '$.user.name');
      expect(result.valid).toBe(true);
      expect(result.data).toBe('John');
    });

    it('should return error for non-existent path', () => {
      const result = queryJson(testData, 'nonexistent');
      expect(result.valid).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should return error when accessing non-object', () => {
      const result = queryJson(testData, 'user.name.invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when accessing non-array with index', () => {
      const result = queryJson(testData, 'user[0]');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Not an array');
    });

    it('should return error for invalid JSON', () => {
      const result = queryJson('invalid', 'path');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty path', () => {
      const result = queryJson(testData, '');
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(JSON.parse(testData));
    });

    it('should handle root path $', () => {
      const result = queryJson(testData, '$');
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(JSON.parse(testData));
    });
  });

  describe('readJsonFile()', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should read and format valid JSON file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{"key": "value"}');

      const result = readJsonFile('/path/to/file.json');
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ key: 'value' });
    });

    it('should return error for non-existent file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = readJsonFile('/nonexistent.json');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File not found');
    });

    it('should return error for invalid JSON in file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('not json');

      const result = readJsonFile('/path/to/invalid.json');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle read errors', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = readJsonFile('/path/to/protected.json');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('getJsonStats()', () => {
    it('should return stats for simple object', () => {
      const result = getJsonStats('{"a": 1, "b": 2}');
      expect(result).not.toBeNull();
      expect(result!.keys).toBe(2);
      expect(result!.depth).toBe(1);
    });

    it('should return stats for nested object', () => {
      const result = getJsonStats('{"a": {"b": {"c": 1}}}');
      expect(result).not.toBeNull();
      expect(result!.depth).toBe(3);
    });

    it('should count keys in nested objects', () => {
      const result = getJsonStats('{"a": 1, "b": {"c": 2, "d": 3}}');
      expect(result).not.toBeNull();
      expect(result!.keys).toBe(4); // a, b, c, d
    });

    it('should return stats for array', () => {
      const result = getJsonStats('[1, 2, 3]');
      expect(result).not.toBeNull();
      expect(result!.keys).toBe(0);
      expect(result!.depth).toBe(1);
    });

    it('should handle array of objects', () => {
      const result = getJsonStats('[{"a": 1}, {"b": 2}]');
      expect(result).not.toBeNull();
      expect(result!.keys).toBe(2); // a, b
      expect(result!.depth).toBe(2);
    });

    it('should return size in bytes', () => {
      const result = getJsonStats('{"a": 1}');
      expect(result).not.toBeNull();
      expect(result!.size).toMatch(/^\d+B$/);
    });

    it('should return size in KB for larger JSON', () => {
      const largeJson = '{"data": "' + 'x'.repeat(2000) + '"}';
      const result = getJsonStats(largeJson);
      expect(result).not.toBeNull();
      expect(result!.size).toMatch(/KB$/);
    });

    it('should return null for invalid JSON', () => {
      const result = getJsonStats('invalid');
      expect(result).toBeNull();
    });

    it('should handle primitives', () => {
      const stringResult = getJsonStats('"hello"');
      expect(stringResult).not.toBeNull();
      expect(stringResult!.keys).toBe(0);
      expect(stringResult!.depth).toBe(0);

      const numberResult = getJsonStats('123');
      expect(numberResult).not.toBeNull();
      expect(numberResult!.keys).toBe(0);
    });

    it('should handle null value', () => {
      const result = getJsonStats('null');
      expect(result).not.toBeNull();
      expect(result!.keys).toBe(0);
      expect(result!.depth).toBe(0);
    });

    it('should handle empty object', () => {
      const result = getJsonStats('{}');
      expect(result).not.toBeNull();
      expect(result!.keys).toBe(0);
      expect(result!.depth).toBe(0);
    });

    it('should handle empty array', () => {
      const result = getJsonStats('[]');
      expect(result).not.toBeNull();
      expect(result!.keys).toBe(0);
      expect(result!.depth).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      const result = validateJson('{"big": 9007199254740991}');
      expect(result.valid).toBe(true);
    });

    it('should handle scientific notation', () => {
      const result = validateJson('{"sci": 1.23e10}');
      expect(result.valid).toBe(true);
      expect((result.data as any).sci).toBe(1.23e10);
    });

    it('should handle negative numbers', () => {
      const result = validateJson('{"neg": -123.456}');
      expect(result.valid).toBe(true);
      expect((result.data as any).neg).toBe(-123.456);
    });

    it('should handle boolean values', () => {
      const result = validateJson('{"t": true, "f": false}');
      expect(result.valid).toBe(true);
      expect((result.data as any).t).toBe(true);
      expect((result.data as any).f).toBe(false);
    });

    it('should handle escaped characters', () => {
      const result = validateJson('{"escaped": "line1\\nline2\\ttab"}');
      expect(result.valid).toBe(true);
      expect((result.data as any).escaped).toBe('line1\nline2\ttab');
    });

    it('should handle forward slashes (no escaping needed)', () => {
      const result = validateJson('{"url": "https://example.com/path"}');
      expect(result.valid).toBe(true);
      expect((result.data as any).url).toBe('https://example.com/path');
    });

    it('should handle backslash escaping', () => {
      const result = validateJson('{"path": "C:\\\\Users\\\\test"}');
      expect(result.valid).toBe(true);
      expect((result.data as any).path).toBe('C:\\Users\\test');
    });
  });
});
