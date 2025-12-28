import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';

const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
  { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Any fool can write code that a computer can understand.", author: "Martin Fowler" },
  { text: "Programming is the art of telling another human what one wants the computer to do.", author: "Donald Knuth" },
  { text: "The most dangerous phrase is: We've always done it this way.", author: "Grace Hopper" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupery" },
  { text: "It's not a bug, it's a feature.", author: "Every Developer Ever" },
  { text: "There are only two hard things in Computer Science: cache invalidation and naming things.", author: "Phil Karlton" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
];

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxWidth) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

registerCommand({
  name: 'quote',
  description: 'Get an inspirational quote',
  usage: '/quote',
  async execute(_args: string[]) {
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    const wrapped = wrapText(quote.text, 55);

    console.log('');
    console.log(`  ${theme.dim('╭──────────────────────────────────────────────────────────────╮')}`);
    console.log(`  ${theme.dim('│')}                                                                ${theme.dim('│')}`);
    console.log(`  ${theme.dim('│')}   ${theme.ocean('❝')}                                                           ${theme.dim('│')}`);

    for (const line of wrapped) {
      const padding = 58 - line.length;
      console.log(`  ${theme.dim('│')}     ${theme.highlight(line)}${' '.repeat(Math.max(0, padding))}${theme.dim('│')}`);
    }

    console.log(`  ${theme.dim('│')}                                                        ${theme.ocean('❞')}   ${theme.dim('│')}`);
    console.log(`  ${theme.dim('│')}                                                                ${theme.dim('│')}`);
    console.log(`  ${theme.dim('│')}                              ${theme.dim('—')} ${theme.secondary(quote.author)}${' '.repeat(Math.max(0, 32 - quote.author.length))}${theme.dim('│')}`);
    console.log(`  ${theme.dim('│')}                                                                ${theme.dim('│')}`);
    console.log(`  ${theme.dim('╰──────────────────────────────────────────────────────────────╯')}`);
    console.log('');
  },
});
