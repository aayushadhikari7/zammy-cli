import { describe, it, expect } from 'vitest';
import {
  parseColor,
  isColorError,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  getLuminance,
  randomColor,
  generateShades,
  generateTints,
} from './color.js';

describe('color handler', () => {
  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle hex without #', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#gg0000')).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
    });

    it('should handle black and white', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });
  });

  describe('rgbToHsl', () => {
    it('should convert red to HSL', () => {
      const hsl = rgbToHsl(255, 0, 0);
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it('should convert green to HSL', () => {
      const hsl = rgbToHsl(0, 255, 0);
      expect(hsl.h).toBe(120);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it('should convert blue to HSL', () => {
      const hsl = rgbToHsl(0, 0, 255);
      expect(hsl.h).toBe(240);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it('should handle grayscale', () => {
      const gray = rgbToHsl(128, 128, 128);
      expect(gray.s).toBe(0);
    });
  });

  describe('getLuminance', () => {
    it('should return 0 for black', () => {
      expect(getLuminance(0, 0, 0)).toBe(0);
    });

    it('should return 1 for white', () => {
      expect(getLuminance(255, 255, 255)).toBe(1);
    });

    it('should return value between 0 and 1', () => {
      const lum = getLuminance(128, 128, 128);
      expect(lum).toBeGreaterThan(0);
      expect(lum).toBeLessThan(1);
    });
  });

  describe('randomColor', () => {
    it('should return RGB values in valid range', () => {
      for (let i = 0; i < 100; i++) {
        const color = randomColor();
        expect(color.r).toBeGreaterThanOrEqual(0);
        expect(color.r).toBeLessThanOrEqual(255);
        expect(color.g).toBeGreaterThanOrEqual(0);
        expect(color.g).toBeLessThanOrEqual(255);
        expect(color.b).toBeGreaterThanOrEqual(0);
        expect(color.b).toBeLessThanOrEqual(255);
      }
    });

    it('should produce different colors', () => {
      const colors = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const c = randomColor();
        colors.add(`${c.r},${c.g},${c.b}`);
      }
      expect(colors.size).toBeGreaterThan(50);
    });
  });

  describe('parseColor', () => {
    it('should parse hex colors', () => {
      const result = parseColor('#ff5733');
      expect(isColorError(result)).toBe(false);
      if (!isColorError(result)) {
        expect(result.rgb).toEqual({ r: 255, g: 87, b: 51 });
      }
    });

    it('should parse 3-digit hex colors', () => {
      const result = parseColor('#f00');
      expect(isColorError(result)).toBe(false);
      if (!isColorError(result)) {
        expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 });
      }
    });

    it('should parse rgb() format', () => {
      const result = parseColor('rgb(100, 150, 200)');
      expect(isColorError(result)).toBe(false);
      if (!isColorError(result)) {
        expect(result.rgb).toEqual({ r: 100, g: 150, b: 200 });
      }
    });

    it('should parse space-separated numbers', () => {
      const result = parseColor('100 150 200');
      expect(isColorError(result)).toBe(false);
      if (!isColorError(result)) {
        expect(result.rgb).toEqual({ r: 100, g: 150, b: 200 });
      }
    });

    it('should generate random color for "random"', () => {
      const result = parseColor('random');
      expect(isColorError(result)).toBe(false);
    });

    it('should generate random color for empty input', () => {
      const result = parseColor('');
      expect(isColorError(result)).toBe(false);
    });

    it('should return error for invalid input', () => {
      const result = parseColor('not a color');
      expect(isColorError(result)).toBe(true);
    });

    it('should include all color formats in result', () => {
      const result = parseColor('#ff0000');
      if (!isColorError(result)) {
        expect(result.hex).toBe('#ff0000');
        expect(result.hsl).toEqual({ h: 0, s: 100, l: 50 });
        expect(result.luminance).toBeCloseTo(0.299, 2);
        expect(result.textColor).toBe('#FFFFFF');
      }
    });
  });

  describe('generateShades', () => {
    it('should generate 10 shades by default', () => {
      const shades = generateShades({ r: 255, g: 0, b: 0 });
      expect(shades).toHaveLength(10);
    });

    it('should start with original color', () => {
      const shades = generateShades({ r: 200, g: 100, b: 50 });
      expect(shades[0].r).toBeCloseTo(200, 0);
      expect(shades[0].g).toBeCloseTo(100, 0);
      expect(shades[0].b).toBeCloseTo(50, 0);
    });

    it('should end with darker colors', () => {
      const shades = generateShades({ r: 200, g: 100, b: 50 });
      const last = shades[shades.length - 1];
      expect(last.r).toBeLessThan(50);
      expect(last.g).toBeLessThan(25);
    });
  });

  describe('generateTints', () => {
    it('should generate 10 tints by default', () => {
      const tints = generateTints({ r: 255, g: 0, b: 0 });
      expect(tints).toHaveLength(10);
    });

    it('should start with original color', () => {
      const tints = generateTints({ r: 100, g: 50, b: 25 });
      expect(tints[0].r).toBeCloseTo(100, 0);
      expect(tints[0].g).toBeCloseTo(50, 0);
      expect(tints[0].b).toBeCloseTo(25, 0);
    });

    it('should progress towards white', () => {
      const tints = generateTints({ r: 100, g: 50, b: 25 });
      const last = tints[tints.length - 1];
      expect(last.r).toBeGreaterThan(200);
      expect(last.g).toBeGreaterThan(200);
      expect(last.b).toBeGreaterThan(200);
    });
  });
});
