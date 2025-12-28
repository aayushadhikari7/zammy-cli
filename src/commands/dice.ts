import { registerCommand } from './registry.js';
import { theme, symbols } from '../ui/colors.js';

const diceArt: Record<number, string[]> = {
  1: [
    '┌─────────┐',
    '│         │',
    '│    ●    │',
    '│         │',
    '└─────────┘',
  ],
  2: [
    '┌─────────┐',
    '│  ●      │',
    '│         │',
    '│      ●  │',
    '└─────────┘',
  ],
  3: [
    '┌─────────┐',
    '│  ●      │',
    '│    ●    │',
    '│      ●  │',
    '└─────────┘',
  ],
  4: [
    '┌─────────┐',
    '│  ●   ●  │',
    '│         │',
    '│  ●   ●  │',
    '└─────────┘',
  ],
  5: [
    '┌─────────┐',
    '│  ●   ●  │',
    '│    ●    │',
    '│  ●   ●  │',
    '└─────────┘',
  ],
  6: [
    '┌─────────┐',
    '│  ●   ●  │',
    '│  ●   ●  │',
    '│  ●   ●  │',
    '└─────────┘',
  ],
};

registerCommand({
  name: 'dice',
  description: 'Roll some dice',
  usage: '/dice [count] [sides]',
  async execute(args: string[]) {
    const count = Math.min(parseInt(args[0]) || 1, 6);
    const sides = parseInt(args[1]) || 6;

    console.log('');
    console.log(`  ${symbols.dice} ${theme.secondary('Rolling')} ${theme.primary(count.toString())}d${theme.primary(sides.toString())}...`);
    console.log('');

    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    // Show ASCII art for standard d6
    if (sides === 6 && count <= 3) {
      // Display dice side by side
      for (let line = 0; line < 5; line++) {
        const row = rolls.map(r => theme.primary(diceArt[r][line])).join('  ');
        console.log('  ' + row);
      }
    } else {
      // Just show numbers for other dice
      const diceDisplay = rolls.map(r => theme.gold(`[${r}]`)).join(' ');
      console.log(`  ${diceDisplay}`);
    }

    console.log('');
    const total = rolls.reduce((a, b) => a + b, 0);
    console.log(`  ${theme.dim('Total:')} ${theme.success(total.toString())}`);
    console.log('');
  },
});
