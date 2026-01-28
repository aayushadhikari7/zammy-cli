import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { convertBase, formatBinary } from '../../handlers/dev/base.js';

registerCommand({
  name: 'base',
  description: 'Convert numbers between bases (bin/oct/dec/hex)',
  usage: '/base <number>',
  async execute(args: string[]) {
    if (args.length === 0) {
      console.log('');
      console.log(theme.error('Usage: /base <number>'));
      console.log(theme.dim('  Supports: decimal, hex (0x/0X/#), binary (0b), octal (0o)'));
      console.log(theme.dim('  Examples:'));
      console.log(theme.dim('    /base 255'));
      console.log(theme.dim('    /base 0xFF'));
      console.log(theme.dim('    /base 0b11111111'));
      console.log(theme.dim('    /base #FF0000'));
      console.log('');
      return;
    }

    const input = args.join('');
    const result = convertBase(input);

    if (!result) {
      console.log(theme.error(`Cannot parse "${input}" as a number`));
      return;
    }

    console.log('');
    console.log(`  ${symbols.info} ${theme.primary('Base Conversion')}`);
    console.log('');
    console.log(`  ${theme.dim('Input:')}    ${theme.accent(result.input)} ${theme.dim(`(detected: ${result.detected})`)}`);
    console.log('');
    console.log(`  ${theme.dim('Decimal:')} ${theme.success(result.decimal)}`);
    console.log(`  ${theme.dim('Hex:')}     ${theme.success(result.hex)}`);
    console.log(`  ${theme.dim('Octal:')}   ${theme.success(result.octal)}`);
    console.log(`  ${theme.dim('Binary:')}  ${theme.success(formatBinary(result.binary))}`);
    console.log('');
  },
});
