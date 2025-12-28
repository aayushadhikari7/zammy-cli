import { registerCommand } from '../registry.js';
import { theme, symbols, box } from '../../ui/colors.js';

registerCommand({
  name: 'encode',
  description: 'Encode/decode text (base64, url, hex)',
  usage: '/encode <method> <encode|decode> <text>',
  async execute(args: string[]) {
    if (args.length < 2) {
      console.log('');
      console.log(theme.error('Usage: /encode <method> <encode|decode> <text>'));
      console.log(theme.dim('  Methods: base64, url, hex'));
      console.log(theme.dim('  Example: /encode base64 encode hello'));
      console.log(theme.dim('  Example: /encode url decode hello%20world'));
      console.log('');
      return;
    }

    const method = args[0].toLowerCase();
    const action = args[1].toLowerCase();
    const text = args.slice(2).join(' ');

    if (!['base64', 'url', 'hex'].includes(method)) {
      console.log(theme.error(`Unknown method: ${method}. Use base64, url, or hex`));
      return;
    }

    if (!['encode', 'decode'].includes(action)) {
      console.log(theme.error(`Unknown action: ${action}. Use encode or decode`));
      return;
    }

    if (!text) {
      console.log(theme.error('Please provide text to encode/decode'));
      return;
    }

    let result: string;

    try {
      if (method === 'base64') {
        if (action === 'encode') {
          result = Buffer.from(text).toString('base64');
        } else {
          result = Buffer.from(text, 'base64').toString('utf8');
        }
      } else if (method === 'url') {
        if (action === 'encode') {
          result = encodeURIComponent(text);
        } else {
          result = decodeURIComponent(text);
        }
      } else {
        if (action === 'encode') {
          result = Buffer.from(text).toString('hex');
        } else {
          result = Buffer.from(text, 'hex').toString('utf8');
        }
      }

      console.log('');
      console.log(box.draw([
        '',
        `  ${symbols.sparkle} ${theme.gradient(method.toUpperCase() + ' ' + action.toUpperCase())}`,
        '',
        `  ${theme.dim('Input:')}`,
        `  ${theme.secondary(text.length > 50 ? text.slice(0, 50) + '...' : text)}`,
        '',
        `  ${theme.dim('Output:')}`,
        `  ${theme.success(result.length > 50 ? result.slice(0, 50) + '...' : result)}`,
        '',
        ...(result.length > 50 ? [`  ${theme.dim('(Full output: ' + result.length + ' chars)')}`] : []),
        '',
      ], 60));
      console.log('');

      if (result.length > 50) {
        console.log(theme.dim('  Full result:'));
        console.log(`  ${result}`);
        console.log('');
      }
    } catch (e) {
      console.log(theme.error(`Failed to ${action}: Invalid input for ${method}`));
    }
  },
});
