import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import chalk from 'chalk';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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

function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

registerCommand({
  name: 'color',
  description: 'Convert and preview colors',
  usage: '/color <hex|rgb|random>',
  async execute(args: string[]) {
    if (args.length === 0 || args[0] === 'random') {
      // Generate random color
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      displayColor(r, g, b);
      return;
    }

    const input = args.join(' ');

    // Try to parse as hex
    const hexMatch = input.match(/^#?([a-f\d]{6}|[a-f\d]{3})$/i);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      const rgb = hexToRgb(hex);
      if (rgb) {
        displayColor(rgb.r, rgb.g, rgb.b);
        return;
      }
    }

    // Try to parse as rgb
    const rgbMatch = input.match(/^rgb?\s*\(?\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)?$/i);
    if (rgbMatch) {
      const r = Math.min(255, parseInt(rgbMatch[1]));
      const g = Math.min(255, parseInt(rgbMatch[2]));
      const b = Math.min(255, parseInt(rgbMatch[3]));
      displayColor(r, g, b);
      return;
    }

    // Try just numbers separated by spaces/commas
    const nums = input.split(/[\s,]+/).map(n => parseInt(n)).filter(n => !isNaN(n));
    if (nums.length === 3) {
      displayColor(Math.min(255, nums[0]), Math.min(255, nums[1]), Math.min(255, nums[2]));
      return;
    }

    console.log('');
    console.log(theme.error('Could not parse color. Examples:'));
    console.log(theme.dim('  /color #FF5733'));
    console.log(theme.dim('  /color rgb(255, 87, 51)'));
    console.log(theme.dim('  /color 255 87 51'));
    console.log(theme.dim('  /color random'));
    console.log('');
  },
});

function displayColor(r: number, g: number, b: number) {
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const lum = getLuminance(r, g, b);
  const textColor = lum > 0.5 ? '#000000' : '#FFFFFF';

  console.log('');
  console.log(`  ${symbols.palette} ${theme.gradient('COLOR CONVERTER')} ${symbols.palette}`);
  console.log('');

  // Color preview blocks
  const colorBlock = chalk.bgHex(hex).hex(textColor);
  console.log(`  ${colorBlock('                                        ')}`);
  console.log(`  ${colorBlock('                                        ')}`);
  console.log(`  ${colorBlock(`      ${hex.toUpperCase()}                            `.slice(0, 40))}`);
  console.log(`  ${colorBlock('                                        ')}`);
  console.log(`  ${colorBlock('                                        ')}`);
  console.log('');

  console.log(`  ${theme.dim('HEX:')}  ${theme.primary(hex.toUpperCase())}`);
  console.log(`  ${theme.dim('RGB:')}  ${theme.primary(`rgb(${r}, ${g}, ${b})`)}`);
  console.log(`  ${theme.dim('HSL:')}  ${theme.primary(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}`);
  console.log('');

  // Color palette variations
  console.log(`  ${theme.dim('Shades:')}`);
  let shades = '  ';
  for (let i = 0; i < 10; i++) {
    const factor = 1 - (i * 0.1);
    const sr = Math.round(r * factor);
    const sg = Math.round(g * factor);
    const sb = Math.round(b * factor);
    shades += chalk.bgRgb(sr, sg, sb)('  ');
  }
  console.log(shades);

  console.log(`  ${theme.dim('Tints:')}`);
  let tints = '  ';
  for (let i = 0; i < 10; i++) {
    const factor = i * 0.1;
    const tr = Math.round(r + (255 - r) * factor);
    const tg = Math.round(g + (255 - g) * factor);
    const tb = Math.round(b + (255 - b) * factor);
    tints += chalk.bgRgb(tr, tg, tb)('  ');
  }
  console.log(tints);

  console.log('');
}
