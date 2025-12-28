import { theme, symbols } from './colors.js';
import chalk from 'chalk';

export function getPrompt(): string {
  const z = chalk.bold.hex('#FF6B6B')('z');
  const a = chalk.bold.hex('#FF8E72')('a');
  const m1 = chalk.bold.hex('#FFEAA7')('m');
  const m2 = chalk.bold.hex('#96CEB4')('m');
  const y = chalk.bold.hex('#4ECDC4')('y');

  return `${z}${a}${m1}${m2}${y}${theme.dim(symbols.arrow)} `;
}
