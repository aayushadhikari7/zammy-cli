import { registerCommand } from './registry.js';
import { theme } from '../ui/colors.js';
import Jimp from 'jimp';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Character ramps with different levels of detail
const CHAR_RAMPS = {
  // Standard - 10 levels, balanced
  standard: ' .:-=+*#%@',
  // Detailed - 16 levels, more gradation
  detailed: ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  // Block characters - uses Unicode block elements for smoother look
  blocks: ' ░▒▓█',
  // Simple - 5 levels for cleaner output
  simple: ' .:░█',
  // Extended - Maximum depth with 70 characters
  extended: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
};

type CharStyle = keyof typeof CHAR_RAMPS;

// Sobel edge detection kernels
const SOBEL_X = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];

const SOBEL_Y = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
];

function getAsciiChar(brightness: number, ramp: string, inverted: boolean): string {
  // Clamp brightness
  const b = Math.max(0, Math.min(255, brightness));
  const index = Math.floor((b / 255) * (ramp.length - 1));
  // Inverted means dark chars for bright pixels (normal photo look)
  return inverted ? ramp[ramp.length - 1 - index] : ramp[index];
}

// Apply edge detection and blend with original
async function applyEdgeEnhancement(image: typeof Jimp.prototype, strength: number): Promise<void> {
  const width = image.getWidth();
  const height = image.getHeight();
  const edges = new Uint8Array(width * height);

  // Calculate edge magnitudes using Sobel operator
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = Jimp.intToRGBA(image.getPixelColor(x + kx, y + ky));
          const gray = (pixel.r + pixel.g + pixel.b) / 3;
          gx += gray * SOBEL_X[ky + 1][kx + 1];
          gy += gray * SOBEL_Y[ky + 1][kx + 1];
        }
      }

      edges[y * width + x] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
    }
  }

  // Blend edges with original image
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
      const edge = edges[y * width + x] || 0;
      const blended = Math.min(255, pixel.r + edge * strength);
      const color = Jimp.rgbaToInt(blended, blended, blended, 255);
      image.setPixelColor(color, x, y);
    }
  }
}

registerCommand({
  name: 'asciiart',
  description: 'Convert an image to ASCII art',
  usage: '/asciiart <@image.png> [--width N] [--style standard|detailed|blocks|simple|extended] [--edges] [--invert] [--contrast N]',
  async execute(args: string[]) {
    if (args.length === 0) {
      console.log(theme.error('Usage: /asciiart <image-path> [options]'));
      console.log('');
      console.log(theme.secondary('Options:'));
      console.log(theme.dim('  --width N      Output width in characters (default: 80)'));
      console.log(theme.dim('  --style S      Character style: standard, detailed, blocks, simple, extended'));
      console.log(theme.dim('  --edges        Enable edge enhancement for more detail'));
      console.log(theme.dim('  --invert       Invert brightness (light bg terminals)'));
      console.log(theme.dim('  --contrast N   Adjust contrast (-1 to 1, default: 0.3)'));
      console.log('');
      console.log(theme.dim('Example: /asciiart @photo.png --width 100 --style detailed --edges'));
      return;
    }

    // Parse arguments
    let imagePath = args[0];
    let width = 80;
    let style: CharStyle = 'detailed';
    let edgeEnhance = false;
    let inverted = false;
    let contrastVal = 0.3;

    // Remove @ prefix if present
    if (imagePath.startsWith('@')) {
      imagePath = imagePath.slice(1);
    }

    // Parse options
    for (let i = 1; i < args.length; i++) {
      const arg = args[i].toLowerCase();
      if (arg === '--width' && args[i + 1]) {
        width = parseInt(args[i + 1], 10) || 80;
        i++;
      } else if (arg === '--style' && args[i + 1]) {
        const s = args[i + 1].toLowerCase() as CharStyle;
        if (s in CHAR_RAMPS) {
          style = s;
        }
        i++;
      } else if (arg === '--edges') {
        edgeEnhance = true;
      } else if (arg === '--invert') {
        inverted = true;
      } else if (arg === '--contrast' && args[i + 1]) {
        contrastVal = parseFloat(args[i + 1]) || 0.3;
        contrastVal = Math.max(-1, Math.min(1, contrastVal));
        i++;
      }
    }

    // Resolve to absolute path
    const fullPath = resolve(process.cwd(), imagePath);

    if (!existsSync(fullPath)) {
      console.log(theme.error(`File not found: ${imagePath}`));
      return;
    }

    console.log(theme.dim(`Converting ${imagePath} to ASCII art...`));
    console.log(theme.dim(`Style: ${style}, Width: ${width}${edgeEnhance ? ', Edge enhancement: ON' : ''}`));
    console.log('');

    try {
      const image = await Jimp.read(fullPath);

      // Calculate height maintaining aspect ratio
      // Terminal chars are ~2x taller than wide, so we use 0.5 factor
      const aspectRatio = image.getHeight() / image.getWidth();
      const height = Math.floor(width * aspectRatio * 0.5);

      // Resize image first
      image.resize(width, height);

      // Convert to greyscale
      image.greyscale();

      // Normalize to use full brightness range
      image.normalize();

      // Enhance contrast for better depth
      image.contrast(contrastVal);

      // Optional edge enhancement
      if (edgeEnhance) {
        await applyEdgeEnhancement(image, 0.4);
      }

      // Get character ramp
      const ramp = CHAR_RAMPS[style];

      // Convert to ASCII
      let ascii = '';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
          // Use luminance formula for better perceptual brightness
          const brightness = 0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b;
          ascii += getAsciiChar(brightness, ramp, !inverted);
        }
        ascii += '\n';
      }

      console.log(ascii);
    } catch (error) {
      console.log(theme.error(`Error converting image: ${error}`));
    }
  },
});
