import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';

const headsArt = [
  '    ╭──────────╮',
  '   ╱            ╲',
  '  │   ┌─────┐    │',
  '  │   │ ◉ ◉ │    │',
  '  │   │  ▽  │    │',
  '  │   │ ╰─╯ │    │',
  '  │   └─────┘    │',
  '   ╲            ╱',
  '    ╰──────────╯',
];

const tailsArt = [
  '    ╭──────────╮',
  '   ╱            ╲',
  '  │   ┌─────┐    │',
  '  │   │  ★  │    │',
  '  │   │ ═══ │    │',
  '  │   │  ★  │    │',
  '  │   └─────┘    │',
  '   ╲            ╱',
  '    ╰──────────╯',
];

registerCommand({
  name: 'flip',
  description: 'Flip a coin',
  usage: '/flip [count]',
  async execute(args: string[]) {
    const count = Math.min(parseInt(args[0]) || 1, 10);

    console.log('');
    console.log(`  ${symbols.coin} ${theme.secondary('Flipping')} ${count > 1 ? theme.primary(count.toString()) + ' coins' : 'a coin'}...`);
    console.log('');

    if (count === 1) {
      const isHeads = Math.random() < 0.5;
      const art = isHeads ? headsArt : tailsArt;
      const result = isHeads ? 'HEADS' : 'TAILS';
      const color = isHeads ? theme.gold : theme.primary;

      art.forEach(line => console.log('  ' + color(line)));
      console.log('');
      console.log(`  ${theme.highlight('Result:')} ${color(result)}`);
    } else {
      const results = { heads: 0, tails: 0 };
      const flips: string[] = [];

      for (let i = 0; i < count; i++) {
        if (Math.random() < 0.5) {
          results.heads++;
          flips.push(theme.gold('H'));
        } else {
          results.tails++;
          flips.push(theme.primary('T'));
        }
      }

      console.log(`  ${flips.join(' ')}`);
      console.log('');
      console.log(`  ${theme.gold('Heads:')} ${results.heads}  ${theme.primary('Tails:')} ${results.tails}`);
    }
    console.log('');
  },
});
