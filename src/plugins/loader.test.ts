import { describe, it, expect } from 'vitest';
import { compareVersions } from './loader.js';

describe('plugin loader', () => {
  describe('compareVersions()', () => {
    describe('equal versions', () => {
      it('should return 0 for identical versions', () => {
        expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
        expect(compareVersions('0.0.0', '0.0.0')).toBe(0);
        expect(compareVersions('10.20.30', '10.20.30')).toBe(0);
      });

      it('should return 0 for semantically equal versions with different formats', () => {
        expect(compareVersions('1.0', '1.0.0')).toBe(0);
        expect(compareVersions('1', '1.0.0')).toBe(0);
        expect(compareVersions('1.0.0', '1')).toBe(0);
      });
    });

    describe('major version differences', () => {
      it('should return -1 when first version is lower', () => {
        expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
        expect(compareVersions('0.0.0', '1.0.0')).toBe(-1);
        expect(compareVersions('9.0.0', '10.0.0')).toBe(-1);
      });

      it('should return 1 when first version is higher', () => {
        expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
        expect(compareVersions('10.0.0', '9.0.0')).toBe(1);
        expect(compareVersions('1.0.0', '0.0.0')).toBe(1);
      });
    });

    describe('minor version differences', () => {
      it('should return -1 when first minor is lower', () => {
        expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
        expect(compareVersions('1.5.0', '1.10.0')).toBe(-1);
      });

      it('should return 1 when first minor is higher', () => {
        expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
        expect(compareVersions('1.10.0', '1.5.0')).toBe(1);
      });
    });

    describe('patch version differences', () => {
      it('should return -1 when first patch is lower', () => {
        expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
        expect(compareVersions('1.0.5', '1.0.10')).toBe(-1);
      });

      it('should return 1 when first patch is higher', () => {
        expect(compareVersions('1.0.2', '1.0.1')).toBe(1);
        expect(compareVersions('1.0.10', '1.0.5')).toBe(1);
      });
    });

    describe('complex comparisons', () => {
      it('should compare correctly when multiple parts differ', () => {
        expect(compareVersions('1.2.3', '1.2.4')).toBe(-1);
        expect(compareVersions('1.2.3', '1.3.0')).toBe(-1);
        expect(compareVersions('1.2.3', '2.0.0')).toBe(-1);
        expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
      });

      it('should handle version chains correctly', () => {
        const versions = ['0.9.0', '1.0.0', '1.0.1', '1.1.0', '2.0.0'];
        for (let i = 0; i < versions.length - 1; i++) {
          expect(compareVersions(versions[i], versions[i + 1])).toBe(-1);
          expect(compareVersions(versions[i + 1], versions[i])).toBe(1);
        }
      });
    });

    describe('edge cases', () => {
      it('should handle versions with missing parts', () => {
        expect(compareVersions('1', '1.0.0')).toBe(0);
        expect(compareVersions('1.0', '1.0.0')).toBe(0);
        expect(compareVersions('1', '1.1')).toBe(-1);
        expect(compareVersions('1.1', '1')).toBe(1);
      });

      it('should handle versions with extra parts (ignores 4th+)', () => {
        // Function only compares first 3 parts
        expect(compareVersions('1.0.0.1', '1.0.0.2')).toBe(0);
        expect(compareVersions('1.0.0.999', '1.0.0')).toBe(0);
      });

      it('should handle non-numeric parts as 0', () => {
        expect(compareVersions('1.0.beta', '1.0.0')).toBe(0);
        expect(compareVersions('1.0.0', '1.0.alpha')).toBe(0);
      });

      it('should handle empty strings', () => {
        expect(compareVersions('', '')).toBe(0);
        expect(compareVersions('1.0.0', '')).toBe(1);
        expect(compareVersions('', '1.0.0')).toBe(-1);
      });

      it('should handle large version numbers', () => {
        expect(compareVersions('100.200.300', '100.200.300')).toBe(0);
        expect(compareVersions('100.200.300', '100.200.301')).toBe(-1);
        expect(compareVersions('999.999.999', '1000.0.0')).toBe(-1);
      });

      it('should handle leading zeros', () => {
        // parseInt handles leading zeros correctly
        expect(compareVersions('1.01.001', '1.1.1')).toBe(0);
        expect(compareVersions('01.02.03', '1.2.3')).toBe(0);
      });
    });

    describe('real-world version scenarios', () => {
      it('should handle typical Zammy version comparisons', () => {
        expect(compareVersions('1.3.0', '1.3.1')).toBe(-1);
        expect(compareVersions('1.3.1', '1.3.0')).toBe(1);
        expect(compareVersions('1.2.0', '1.3.0')).toBe(-1);
        expect(compareVersions('1.3.0', '2.0.0')).toBe(-1);
      });

      it('should check minVersion requirements correctly', () => {
        const currentVersion = '1.3.1';
        const minVersion = '1.3.0';

        // Current >= min means compatible
        expect(compareVersions(currentVersion, minVersion)).toBeGreaterThanOrEqual(0);
      });

      it('should check maxVersion requirements correctly', () => {
        const currentVersion = '1.3.1';
        const maxVersion = '2.0.0';

        // Current <= max means compatible
        expect(compareVersions(currentVersion, maxVersion)).toBeLessThanOrEqual(0);
      });

      it('should detect incompatible versions', () => {
        const currentVersion = '1.2.0';
        const minVersion = '1.3.0';

        // Current < min means incompatible
        expect(compareVersions(currentVersion, minVersion)).toBe(-1);
      });
    });
  });
});
