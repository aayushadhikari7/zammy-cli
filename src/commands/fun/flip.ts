import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { flipCoins, COIN_ART } from '../../handlers/fun/flip.js';

registerCommand({
  name: 'flip',
  description: 'Flip a coin',
  usage: '/flip [count]',
  async execute(args: string[]) {
    const count = parseInt(args[0]) || 1;
    const result = flipCoins(count);

    console.log('');
    console.log(`  ${symbols.coin} ${theme.secondary('Flipping')} ${result.count > 1 ? theme.primary(result.count.toString()) + ' coins' : 'a coin'}...`);
    console.log('');

    if (result.count === 1) {
      const side = result.flips[0];
      const art = COIN_ART[side];
      const color = side === 'heads' ? theme.gold : theme.primary;

      art.forEach(line => console.log('  ' + color(line)));
      console.log('');
      console.log(`  ${theme.highlight('Result:')} ${color(side.toUpperCase())}`);
    } else {
      const display = result.flips.map(f =>
        f === 'heads' ? theme.gold('H') : theme.primary('T')
      ).join(' ');

      console.log(`  ${display}`);
      console.log('');
      console.log(`  ${theme.gold('Heads:')} ${result.headsCount}  ${theme.primary('Tails:')} ${result.tailsCount}`);
    }
    console.log('');
  },
});
