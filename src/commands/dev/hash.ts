import { registerCommand } from '../registry.js';
import { theme, symbols, box } from '../../ui/colors.js';
import { computeHash, isValidAlgorithm, SUPPORTED_ALGORITHMS } from '../../handlers/dev/hash.js';

registerCommand({
  name: 'hash',
  description: 'Hash text with various algorithms',
  usage: '/hash <algorithm> <text> or /hash <text>',
  async execute(args: string[]) {
    if (args.length === 0) {
      console.log('');
      console.log(theme.error('Usage: /hash <algorithm> <text>'));
      console.log(theme.dim(`  Algorithms: ${SUPPORTED_ALGORITHMS.join(', ')}`));
      console.log(theme.dim('  Example: /hash sha256 hello world'));
      console.log(theme.dim('  Default: /hash <text> uses sha256'));
      console.log('');
      return;
    }

    let algorithm: typeof SUPPORTED_ALGORITHMS[number] = 'sha256';
    let text: string;

    if (isValidAlgorithm(args[0])) {
      algorithm = args[0].toLowerCase() as typeof algorithm;
      text = args.slice(1).join(' ');
    } else {
      text = args.join(' ');
    }

    if (!text) {
      console.log(theme.error('Please provide text to hash'));
      return;
    }

    const result = computeHash(text, algorithm);

    console.log('');
    console.log(box.draw([
      '',
      `  ${symbols.lock} ${theme.gradient('HASH RESULT')}`,
      '',
      `  ${theme.dim('Algorithm:')} ${theme.primary(result.algorithm)}`,
      `  ${theme.dim('Input:')} ${theme.secondary(result.input.length > 30 ? result.input.slice(0, 30) + '...' : result.input)}`,
      '',
      `  ${theme.dim('Hash:')}`,
      `  ${theme.success(result.hash)}`,
      '',
    ], 70));
    console.log('');
  },
});
