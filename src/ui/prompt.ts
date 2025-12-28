import { theme, symbols } from './colors.js';

export function getPrompt(): string {
  return `${theme.b.primary('zammy')}${theme.dim(symbols.arrow)} `;
}
