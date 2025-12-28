import { registerCommand } from '../registry.js';
import { theme, symbols, box } from '../../ui/colors.js';
import { createHash } from 'crypto';

registerCommand({
  name: 'hash',
  description: 'Hash text with various algorithms',
  usage: '/hash <algorithm> <text> or /hash <text>',
  async execute(args: string[]) {
    if (args.length === 0) {
      console.log('');
      console.log(theme.error('Usage: /hash <algorithm> <text>'));
      console.log(theme.dim('  Algorithms: md5, sha1, sha256, sha512'));
      console.log(theme.dim('  Example: /hash sha256 hello world'));
      console.log(theme.dim('  Default: /hash <text> uses sha256'));
      console.log('');
      return;
    }

    const algorithms = ['md5', 'sha1', 'sha256', 'sha512'];
    let algorithm = 'sha256';
    let text: string;

    if (algorithms.includes(args[0].toLowerCase())) {
      algorithm = args[0].toLowerCase();
      text = args.slice(1).join(' ');
    } else {
      text = args.join(' ');
    }

    if (!text) {
      console.log(theme.error('Please provide text to hash'));
      return;
    }

    const hash = createHash(algorithm).update(text).digest('hex');

    console.log('');
    console.log(box.draw([
      '',
      `  ${symbols.lock} ${theme.gradient('HASH RESULT')}`,
      '',
      `  ${theme.dim('Algorithm:')} ${theme.primary(algorithm.toUpperCase())}`,
      `  ${theme.dim('Input:')} ${theme.secondary(text.length > 30 ? text.slice(0, 30) + '...' : text)}`,
      '',
      `  ${theme.dim('Hash:')}`,
      `  ${theme.success(hash)}`,
      '',
    ], 70));
    console.log('');
  },
});
