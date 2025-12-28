import { theme, symbols } from './colors.js';

export function getPrompt(): string {
  return theme.prompt(`zammy${symbols.arrow} `);
}
