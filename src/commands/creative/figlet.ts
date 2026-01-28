import { registerCommand } from '../registry.js';
import { theme } from '../../ui/colors.js';
import figlet from 'figlet';
import chalk from 'chalk';

const FONTS = [
  'Standard', 'Big', 'Slant', 'Small', 'Banner', 'Banner3', 'Block', 'Bubble',
  'Digital', 'Doom', 'Epic', 'Ivrit', 'Lean', 'Mini', 'Script', 'Shadow',
  'Slant', 'Small', 'Speed', 'Star Wars', 'Thick', 'Thin'
];

const GRADIENTS: Record<string, string[]> = {
  rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
  sunset: ['#FF6B6B', '#FFA07A', '#FFD700', '#FF8C00', '#FF4500'],
  ocean: ['#00CED1', '#20B2AA', '#48D1CC', '#40E0D0', '#00FFFF'],
  forest: ['#228B22', '#32CD32', '#00FA9A', '#98FB98', '#90EE90'],
  fire: ['#FF4500', '#FF6347', '#FF7F50', '#FFA500', '#FFD700'],
  purple: ['#9400D3', '#8A2BE2', '#9932CC', '#BA55D3', '#DA70D6'],
  cyan: ['#00FFFF', '#00CED1', '#20B2AA', '#5F9EA0', '#4682B4'],
  pink: ['#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB', '#FF82AB'],
  neon: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00FF', '#00FF00'],
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 255, g: 255, b: 255 };
}

function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function applyGradient(text: string, colors: string[]): string {
  const chars = text.split('');
  const segments = colors.length - 1;

  return chars.map((char, i) => {
    if (char === ' ' || char === '\n') return char;

    const position = i / (chars.length - 1 || 1);
    const segmentIndex = Math.min(Math.floor(position * segments), segments - 1);
    const segmentPosition = (position * segments) - segmentIndex;

    const color = interpolateColor(colors[segmentIndex], colors[segmentIndex + 1], segmentPosition);
    return chalk.hex(color)(char);
  }).join('');
}

async function animateText(lines: string[], gradient: string[], delay: number): Promise<void> {
  // Clear area first
  const totalLines = lines.length;
  console.log('\n'.repeat(totalLines));

  // Move cursor up
  process.stdout.write(`\x1b[${totalLines}A`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim()) {
      // Type out each character
      for (let j = 0; j < line.length; j++) {
        process.stdout.write(applyGradient(line[j], gradient));
        await new Promise(r => setTimeout(r, delay));
      }
    }
    process.stdout.write('\n');
  }
}

function showHelp(): void {
  console.log('');
  console.log(theme.secondary('Usage:'));
  console.log(`  ${theme.primary('/figlet <text>')}                  ${theme.dim('Generate ASCII art')}`);
  console.log(`  ${theme.primary('/figlet <text> --font <name>')}    ${theme.dim('Use specific font')}`);
  console.log(`  ${theme.primary('/figlet <text> --gradient <name>')} ${theme.dim('Apply gradient')}`);
  console.log(`  ${theme.primary('/figlet <text> --animate')}        ${theme.dim('Animated typing effect')}`);
  console.log('');
  console.log(theme.secondary('Fonts:'));
  const fontChunks = [];
  for (let i = 0; i < FONTS.length; i += 6) {
    fontChunks.push(FONTS.slice(i, i + 6).join(', '));
  }
  for (const chunk of fontChunks) {
    console.log(`  ${theme.dim(chunk)}`);
  }
  console.log('');
  console.log(theme.secondary('Gradients:'));
  console.log(`  ${theme.dim(Object.keys(GRADIENTS).join(', '))}`);
  console.log('');
  console.log(theme.secondary('Examples:'));
  console.log(`  ${theme.dim('/figlet Hello')}`);
  console.log(`  ${theme.dim('/figlet Hello --font Slant')}`);
  console.log(`  ${theme.dim('/figlet Hello --gradient rainbow')}`);
  console.log(`  ${theme.dim('/figlet Hello --font Big --gradient fire')}`);
  console.log(`  ${theme.dim('/figlet Hi --animate')}`);
  console.log('');
}

registerCommand({
  name: 'figlet',
  description: 'Generate ASCII art text with gradients and animation',
  usage: '/figlet <text> [--font <name>] [--gradient <name>] [--animate]',
  async execute(args: string[]) {
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
      showHelp();
      return;
    }

    // Parse options
    let font = 'Standard';
    let gradient = 'rainbow';
    let animate = false;
    let textParts: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i].toLowerCase();

      if (arg === '--font' || arg === '-f') {
        if (args[i + 1]) {
          font = args[i + 1];
          i++;
        }
      } else if (arg === '--gradient' || arg === '-g') {
        if (args[i + 1]) {
          gradient = args[i + 1].toLowerCase();
          i++;
        }
      } else if (arg === '--animate' || arg === '-a') {
        animate = true;
      } else if (arg === '--no-gradient' || arg === '-n') {
        gradient = '';
      } else if (!args[i].startsWith('-')) {
        textParts.push(args[i]);
      }
    }

    const text = textParts.join(' ');

    if (!text) {
      console.log(theme.error('Please provide text to render'));
      return;
    }

    // Get gradient colors
    const gradientColors = gradient && GRADIENTS[gradient] ? GRADIENTS[gradient] : GRADIENTS.rainbow;

    try {
      const result = figlet.textSync(text, {
        font: font as any,
        horizontalLayout: 'default',
        verticalLayout: 'default',
      });

      console.log('');

      const lines = result.split('\n');

      if (animate) {
        await animateText(lines.map(l => '  ' + l), gradientColors, 5);
      } else {
        for (const line of lines) {
          if (line.trim()) {
            if (gradient) {
              console.log('  ' + applyGradient(line, gradientColors));
            } else {
              console.log('  ' + theme.primary(line));
            }
          } else {
            console.log('');
          }
        }
      }

      console.log('');
      const options = [];
      if (font !== 'Standard') options.push(`Font: ${font}`);
      if (gradient) options.push(`Gradient: ${gradient}`);
      if (options.length) {
        console.log(theme.dim(`  ${options.join(' | ')}`));
        console.log('');
      }
    } catch (e) {
      console.log(theme.error(`Font "${font}" not available.`));
      console.log(theme.dim('  Try: Standard, Big, Slant, Small, Banner, Doom'));
    }
  },
});
