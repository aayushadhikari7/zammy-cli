import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { rollDice, DICE_ART } from '../../handlers/fun/dice.js';

registerCommand({
  name: 'dice',
  description: 'Roll some dice',
  usage: '/dice [count] [sides]',
  async execute(args: string[]) {
    const count = parseInt(args[0]) || 1;
    const sides = parseInt(args[1]) || 6;

    const result = rollDice(count, sides);

    console.log('');
    console.log(`  ${symbols.dice} ${theme.secondary('Rolling')} ${theme.primary(result.count.toString())}d${theme.primary(result.sides.toString())}...`);
    console.log('');

    // Show ASCII art for standard d6
    if (result.isStandardD6) {
      // Display dice side by side
      for (let line = 0; line < 5; line++) {
        const row = result.rolls.map(r => theme.primary(DICE_ART[r][line])).join('  ');
        console.log('  ' + row);
      }
    } else {
      // Just show numbers for other dice
      const diceDisplay = result.rolls.map(r => theme.gold(`[${r}]`)).join(' ');
      console.log(`  ${diceDisplay}`);
    }

    console.log('');
    console.log(`  ${theme.dim('Total:')} ${theme.success(result.total.toString())}`);
    console.log('');
  },
});
