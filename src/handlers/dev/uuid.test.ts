import { describe, it, expect } from 'vitest';
import { generateUuids } from './uuid.js';

describe('uuid handler', () => {
  describe('generateUuids', () => {
    it('should generate 1 UUID by default', () => {
      const result = generateUuids();
      expect(result.count).toBe(1);
      expect(result.uuids).toHaveLength(1);
    });

    it('should generate specified number of UUIDs', () => {
      const result = generateUuids(5);
      expect(result.count).toBe(5);
      expect(result.uuids).toHaveLength(5);
    });

    it('should cap at 10 UUIDs maximum', () => {
      const result = generateUuids(100);
      expect(result.count).toBe(10);
      expect(result.uuids).toHaveLength(10);
    });

    it('should generate at least 1 UUID for zero or negative input', () => {
      expect(generateUuids(0).count).toBe(1);
      expect(generateUuids(-5).count).toBe(1);
    });

    it('should generate valid UUID format', () => {
      const result = generateUuids(1);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result.uuids[0]).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const result = generateUuids(10);
      const uniqueUuids = new Set(result.uuids);
      expect(uniqueUuids.size).toBe(10);
    });
  });
});
