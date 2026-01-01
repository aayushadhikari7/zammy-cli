import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';

// Fallback quotes for offline use
const fallbackQuotes = [
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

// Fetch quote from API
async function fetchQuote(): Promise<{ text: string; author: string }> {
  try {
    // Try ZenQuotes API first
    const response = await fetch('https://zenquotes.io/api/random', {
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json() as Array<{ q: string; a: string }>;
      if (data && data[0]) {
        return { text: data[0].q, author: data[0].a };
      }
    }
  } catch {
    // Fall through to fallback
  }

  try {
    // Try Quotable API as backup
    const response = await fetch('https://api.quotable.io/random', {
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json() as { content: string; author: string };
      if (data && data.content) {
        return { text: data.content, author: data.author };
      }
    }
  } catch {
    // Fall through to fallback
  }

  // Use fallback
  return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
}

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
    console.log('');
    console.log(`  ${symbols.sparkle} ${theme.dim('Fetching wisdom...')}`);

    const quote = await fetchQuote();

    // Clear the loading message
    process.stdout.write('\x1B[1A\x1B[2K\x1B[1A\x1B[2K');

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
