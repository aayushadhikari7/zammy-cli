import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import figlet from 'figlet';

const FONTS = [
  'Standard', 'Big', 'Slant', 'Small', 'Banner', 'Block', 'Bubble',
  'Digital', 'Ivrit', 'Lean', 'Mini', 'Script', 'Shadow', 'Speed', 'Star Wars'
];

registerCommand({
  name: 'figlet',
  description: 'Generate ASCII art text',
  usage: '/figlet <text> [--font <name>]',
  async execute(args: string[]) {
    if (args.length === 0) {
      console.log('');
      console.log(theme.error('Usage: /figlet <text> [--font <name>]'));
      console.log('');
      console.log(theme.dim('  Available fonts:'));
      console.log(`  ${theme.secondary(FONTS.join(', '))}`);
      console.log('');
      console.log(theme.dim('  Example: /figlet Hello --font Slant'));
      console.log('');
      return;
    }

    // Parse font from args
    let font = 'Standard';
    let text = args.join(' ');

    const fontIndex = args.findIndex(a => a.toLowerCase() === '--font');
    if (fontIndex !== -1 && args[fontIndex + 1]) {
      font = args[fontIndex + 1];
      text = [...args.slice(0, fontIndex), ...args.slice(fontIndex + 2)].join(' ');
    }

    if (!text) {
      console.log(theme.error('Please provide text to render'));
      return;
    }

    try {
      const result = figlet.textSync(text, {
        font: font as any,
        horizontalLayout: 'default',
        verticalLayout: 'default',
      });

      console.log('');

      // Apply gradient to each line
      const lines = result.split('\n');
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

      lines.forEach((line, idx) => {
        if (line.trim()) {
          const color = colors[idx % colors.length];
          console.log('  ' + theme.primary(line));
        } else {
          console.log('');
        }
      });

      console.log('');
      console.log(theme.dim(`  Font: ${font}`));
      console.log('');
    } catch (e) {
      console.log(theme.error(`Font "${font}" not available. Try: Standard, Big, Slant, Small`));
    }
  },
});
