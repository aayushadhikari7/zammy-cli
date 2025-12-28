export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorResult {
  rgb: RGB;
  hex: string;
  hsl: HSL;
  luminance: number;
  textColor: string;
}

export interface ColorParseError {
  error: string;
}

export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function randomColor(): RGB {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
}

export function parseColor(input: string): ColorResult | ColorParseError {
  let r: number, g: number, b: number;

  // Random color
  if (!input || input === 'random') {
    const rgb = randomColor();
    r = rgb.r; g = rgb.g; b = rgb.b;
  } else {
    // Try to parse as hex
    const hexMatch = input.match(/^#?([a-f\d]{6}|[a-f\d]{3})$/i);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      const rgb = hexToRgb(hex);
      if (rgb) {
        r = rgb.r; g = rgb.g; b = rgb.b;
      } else {
        return { error: 'Invalid hex color' };
      }
    } else {
      // Try to parse as rgb
      const rgbMatch = input.match(/^rgb?\s*\(?\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)?$/i);
      if (rgbMatch) {
        r = Math.min(255, parseInt(rgbMatch[1]));
        g = Math.min(255, parseInt(rgbMatch[2]));
        b = Math.min(255, parseInt(rgbMatch[3]));
      } else {
        // Try just numbers separated by spaces/commas
        const nums = input.split(/[\s,]+/).map(n => parseInt(n)).filter(n => !isNaN(n));
        if (nums.length === 3) {
          r = Math.min(255, nums[0]);
          g = Math.min(255, nums[1]);
          b = Math.min(255, nums[2]);
        } else {
          return { error: 'Could not parse color' };
        }
      }
    }
  }

  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const luminance = getLuminance(r, g, b);

  return {
    rgb: { r, g, b },
    hex,
    hsl,
    luminance,
    textColor: luminance > 0.5 ? '#000000' : '#FFFFFF',
  };
}

export function isColorError(result: ColorResult | ColorParseError): result is ColorParseError {
  return 'error' in result;
}

export function generateShades(rgb: RGB, steps: number = 10): RGB[] {
  const shades: RGB[] = [];
  for (let i = 0; i < steps; i++) {
    const factor = 1 - (i * (1 / steps));
    shades.push({
      r: Math.round(rgb.r * factor),
      g: Math.round(rgb.g * factor),
      b: Math.round(rgb.b * factor),
    });
  }
  return shades;
}

export function generateTints(rgb: RGB, steps: number = 10): RGB[] {
  const tints: RGB[] = [];
  for (let i = 0; i < steps; i++) {
    const factor = i * (1 / steps);
    tints.push({
      r: Math.round(rgb.r + (255 - rgb.r) * factor),
      g: Math.round(rgb.g + (255 - rgb.g) * factor),
      b: Math.round(rgb.b + (255 - rgb.b) * factor),
    });
  }
  return tints;
}
