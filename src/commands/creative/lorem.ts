import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { generateLorem, wrapText } from '../../handlers/creative/lorem.js';

registerCommand({
  name: 'lorem',
  description: 'Generate Lorem Ipsum text',
  usage: '/lorem [paragraphs] [sentences]',
  async execute(args: string[]) {
    const paragraphCount = parseInt(args[0]) || 1;
    const sentenceCount = parseInt(args[1]) || 5;

    const result = generateLorem(paragraphCount, sentenceCount);

    console.log('');
    console.log(`  ${symbols.scroll} ${theme.gradient('LOREM IPSUM GENERATOR')} ${symbols.scroll}`);
    console.log('');

    for (let i = 0; i < result.paragraphs.length; i++) {
      const wrapped = wrapText(result.paragraphs[i], 70);
      wrapped.forEach(line => console.log(`  ${theme.secondary(line)}`));
      if (i < result.paragraphs.length - 1) console.log('');
    }

    console.log('');
    console.log(theme.dim(`  Generated ${result.paragraphCount} paragraph(s) with ${result.sentenceCount} sentence(s) each`));
    console.log('');
  },
});
