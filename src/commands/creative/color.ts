import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import chalk from 'chalk';
import { parseColor, isColorError, generateShades, generateTints } from '../../handlers/creative/color.js';

registerCommand({
  name: 'color',
  description: 'Convert and preview colors',
  usage: '/color <hex|rgb|random>',
  async execute(args: string[]) {
    const input = args.join(' ');
    const result = parseColor(input);

    if (isColorError(result)) {
      console.log('');
      console.log(theme.error('Could not parse color. Examples:'));
      console.log(theme.dim('  /color #FF5733'));
      console.log(theme.dim('  /color rgb(255, 87, 51)'));
      console.log(theme.dim('  /color 255 87 51'));
      console.log(theme.dim('  /color random'));
      console.log('');
      return;
    }

    const { rgb, hex, hsl, textColor } = result;

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
    console.log(`  ${theme.dim('RGB:')}  ${theme.primary(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}`);
    console.log(`  ${theme.dim('HSL:')}  ${theme.primary(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}`);
    console.log('');

    // Color palette variations
    console.log(`  ${theme.dim('Shades:')}`);
    let shadesLine = '  ';
    const shades = generateShades(rgb);
    for (const shade of shades) {
      shadesLine += chalk.bgRgb(shade.r, shade.g, shade.b)('  ');
    }
    console.log(shadesLine);

    console.log(`  ${theme.dim('Tints:')}`);
    let tintsLine = '  ';
    const tints = generateTints(rgb);
    for (const tint of tints) {
      tintsLine += chalk.bgRgb(tint.r, tint.g, tint.b)('  ');
    }
    console.log(tintsLine);

    console.log('');
  },
});
