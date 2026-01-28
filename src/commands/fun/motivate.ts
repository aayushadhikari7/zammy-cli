import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { getRandomMotivation, getAllMotivations } from '../../handlers/fun/motivate.js';
import boxen from 'boxen';

function wrapText(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length + word.length + 1 <= width) {
      current += (current ? ' ' : '') + word;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  return lines;
}

registerCommand({
  name: 'motivate',
  description: 'Get a motivational quote, tip, or affirmation',
  usage: '/motivate [quotes|tips|affirmations]',
  async execute(args: string[]) {
    const category = args[0]?.toLowerCase();
    let motivation;

    if (category === 'quote' || category === 'quotes') {
      motivation = getRandomMotivation('quote');
    } else if (category === 'tip' || category === 'tips') {
      motivation = getRandomMotivation('tip');
    } else if (category === 'affirmation' || category === 'affirmations') {
      motivation = getRandomMotivation('affirmation');
    } else if (category === 'list' || category === 'all') {
      const all = getAllMotivations();
      console.log('');
      console.log(`  ${theme.primary('Categories:')}`);
      console.log(`    ${theme.accent('quotes')}       ${theme.dim(`(${all.quotes.length})`)}`);
      console.log(`    ${theme.accent('tips')}         ${theme.dim(`(${all.tips.length})`)}`);
      console.log(`    ${theme.accent('affirmations')} ${theme.dim(`(${all.affirmations.length})`)}`);
      console.log('');
      return;
    } else if (category === 'help' || category === '--help') {
      console.log('');
      console.log(theme.primary('Usage:'));
      console.log(`  ${theme.accent('/motivate')}              ${theme.dim('Random motivation')}`);
      console.log(`  ${theme.accent('/motivate quotes')}       ${theme.dim('Programming quotes')}`);
      console.log(`  ${theme.accent('/motivate tips')}         ${theme.dim('Helpful tips')}`);
      console.log(`  ${theme.accent('/motivate affirmations')} ${theme.dim('Positive affirmations')}`);
      console.log('');
      return;
    } else {
      motivation = getRandomMotivation();
    }

    const width = Math.min(60, process.stdout.columns - 10 || 60);
    const lines = wrapText(motivation.text, width - 4);

    let content = lines.map(line => `  ${line}`).join('\n');

    if (motivation.author) {
      content += `\n\n  ${theme.dim('—')} ${theme.accent(motivation.author)}`;
    }

    const categoryIcon = motivation.category === 'quote' ? '"' :
                         motivation.category === 'tip' ? symbols.info :
                         symbols.sparkle;

    const categoryLabel = motivation.category === 'quote' ? 'Quote' :
                          motivation.category === 'tip' ? 'Tip' : 'Affirmation';

    const borderColor = motivation.category === 'quote' ? 'cyan' :
                        motivation.category === 'tip' ? 'yellow' : 'magenta';

    console.log('');
    console.log(boxen(content, {
      padding: 1,
      margin: { left: 2, right: 0, top: 0, bottom: 0 },
      borderStyle: 'round',
      borderColor,
      title: `${categoryIcon} ${categoryLabel}`,
      titleAlignment: 'center',
    }));
    console.log('');
  },
});
