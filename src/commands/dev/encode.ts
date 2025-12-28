import { registerCommand } from '../registry.js';
import { theme, symbols, box } from '../../ui/colors.js';
import { encodeText, isValidMethod, SUPPORTED_METHODS, EncodeDirection } from '../../handlers/dev/encode.js';

registerCommand({
  name: 'encode',
  description: 'Encode/decode text (base64, url, hex)',
  usage: '/encode <method> <encode|decode> <text>',
  async execute(args: string[]) {
    if (args.length < 2) {
      console.log('');
      console.log(theme.error('Usage: /encode <method> <encode|decode> <text>'));
      console.log(theme.dim(`  Methods: ${SUPPORTED_METHODS.join(', ')}`));
      console.log(theme.dim('  Example: /encode base64 encode hello'));
      console.log(theme.dim('  Example: /encode url decode hello%20world'));
      console.log('');
      return;
    }

    const method = args[0].toLowerCase();
    const action = args[1].toLowerCase() as EncodeDirection;
    const text = args.slice(2).join(' ');

    if (!isValidMethod(method)) {
      console.log(theme.error(`Unknown method: ${method}. Use ${SUPPORTED_METHODS.join(', ')}`));
      return;
    }

    if (action !== 'encode' && action !== 'decode') {
      console.log(theme.error(`Unknown action: ${action}. Use encode or decode`));
      return;
    }

    if (!text) {
      console.log(theme.error('Please provide text to encode/decode'));
      return;
    }

    try {
      const result = encodeText(text, method, action);

      console.log('');
      console.log(box.draw([
        '',
        `  ${symbols.sparkle} ${theme.gradient(result.method + ' ' + result.direction.toUpperCase())}`,
        '',
        `  ${theme.dim('Input:')}`,
        `  ${theme.secondary(result.input.length > 50 ? result.input.slice(0, 50) + '...' : result.input)}`,
        '',
        `  ${theme.dim('Output:')}`,
        `  ${theme.success(result.output.length > 50 ? result.output.slice(0, 50) + '...' : result.output)}`,
        '',
        ...(result.output.length > 50 ? [`  ${theme.dim('(Full output: ' + result.output.length + ' chars)')}`] : []),
        '',
      ], 60));
      console.log('');

      if (result.output.length > 50) {
        console.log(theme.dim('  Full result:'));
        console.log(`  ${result.output}`);
        console.log('');
      }
    } catch (e) {
      console.log(theme.error(`Failed to ${action}: Invalid input for ${method}`));
    }
  },
});
