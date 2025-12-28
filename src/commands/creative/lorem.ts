import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde',
  'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque',
  'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
  'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
  'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit',
  'fugit', 'consequuntur', 'magni', 'dolores', 'eos', 'ratione', 'sequi',
];

function generateSentence(minWords = 5, maxWords = 15): string {
  const length = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const words = [];
  for (let i = 0; i < length; i++) {
    words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  }
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

function generateParagraph(sentences = 5): string {
  const result = [];
  for (let i = 0; i < sentences; i++) {
    result.push(generateSentence());
  }
  return result.join(' ');
}

registerCommand({
  name: 'lorem',
  description: 'Generate Lorem Ipsum text',
  usage: '/lorem [paragraphs] [sentences]',
  async execute(args: string[]) {
    const paragraphs = Math.min(Math.max(parseInt(args[0]) || 1, 1), 10);
    const sentences = Math.min(Math.max(parseInt(args[1]) || 5, 1), 20);

    console.log('');
    console.log(`  ${symbols.scroll} ${theme.gradient('LOREM IPSUM GENERATOR')} ${symbols.scroll}`);
    console.log('');

    for (let i = 0; i < paragraphs; i++) {
      const para = generateParagraph(sentences);
      const wrapped = wrapText(para, 70);
      wrapped.forEach(line => console.log(`  ${theme.secondary(line)}`));
      if (i < paragraphs - 1) console.log('');
    }

    console.log('');
    console.log(theme.dim(`  Generated ${paragraphs} paragraph(s) with ${sentences} sentence(s) each`));
    console.log('');
  },
});

function wrapText(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}
