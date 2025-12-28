import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { getFortune, wrapText } from '../../handlers/fun/fortune.js';

registerCommand({
  name: 'fortune',
  description: 'Get your fortune told',
  usage: '/fortune',
  async execute(_args: string[]) {
    const result = getFortune();

    console.log('');
    console.log(`  ${theme.sunset('╔════════════════════════════════════════════════════════════╗')}`);
    console.log(`  ${theme.sunset('║')}     ${symbols.sparkle} ${theme.gold('F O R T U N E   C O O K I E')} ${symbols.sparkle}                    ${theme.sunset('║')}`);
    console.log(`  ${theme.sunset('╚════════════════════════════════════════════════════════════╝')}`);
    console.log('');
    console.log(`  ${theme.gold('           .-"""-.        ')}`);
    console.log(`  ${theme.gold('          /        \\       ')}`);
    console.log(`  ${theme.gold('         |  O    O  |      ')}`);
    console.log(`  ${theme.gold('         |  .-----.  |     ')}`);
    console.log(`  ${theme.gold('          \\   \`-´   /      ')}`);
    console.log(`  ${theme.gold('           \`-.___.-´       ')}`);
    console.log('');
    console.log(`  ${theme.dim('┌─────────────────────────────────────────────────────────┐')}`);
    console.log(`  ${theme.dim('│')}                                                           ${theme.dim('│')}`);

    // Word wrap fortune
    const lines = wrapText(result.fortune, 55);

    for (const line of lines) {
      const padding = 55 - line.length;
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      console.log(`  ${theme.dim('│')}  ${' '.repeat(leftPad)}${theme.highlight(line)}${' '.repeat(rightPad)}  ${theme.dim('│')}`);
    }

    console.log(`  ${theme.dim('│')}                                                           ${theme.dim('│')}`);
    console.log(`  ${theme.dim('└─────────────────────────────────────────────────────────┘')}`);
    console.log('');
    console.log(`  ${theme.dim('┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄')}`);
    console.log(`  ${symbols.star} ${theme.dim('Lucky number:')} ${theme.gold(result.luckyNumber.toString().padStart(2, '0'))}     ${symbols.sparkle} ${theme.dim('Lucky item:')} ${theme.primary(result.luckyItem)}`);
    console.log(`  ${theme.dim('┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄')}`);
    console.log('');
  },
});
