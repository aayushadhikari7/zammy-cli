import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { diffFiles, formatDiffStats } from '../../handlers/dev/diff.js';
import { basename } from 'path';

registerCommand({
  name: 'diff',
  description: 'Compare two files',
  usage: '/diff <file1> <file2>',
  async execute(args: string[]) {
    if (args.length < 2) {
      console.log('');
      console.log(`  ${symbols.sparkle} ${theme.gradient('FILE DIFF')}`);
      console.log('');
      console.log(`  ${theme.dim('Usage:')} /diff <file1> <file2>`);
      console.log('');
      console.log(`  ${theme.dim('Example:')}`);
      console.log(`    /diff old.json new.json`);
      console.log(`    /diff config.ts config.backup.ts`);
      console.log('');
      return;
    }

    const file1 = args[0];
    const file2 = args[1];

    console.log('');

    const result = diffFiles(file1, file2);

    if (!result.success) {
      console.log(`  ${symbols.cross} ${theme.error(result.error || 'Diff failed')}`);
      console.log('');
      return;
    }

    console.log(`  ${symbols.sparkle} ${theme.gradient('DIFF')}: ${theme.primary(basename(file1))} ${theme.dim('→')} ${theme.primary(basename(file2))}`);
    console.log(`  ${theme.dim(formatDiffStats(result.stats))}`);
    console.log('');

    if (result.stats.additions === 0 && result.stats.deletions === 0) {
      console.log(`  ${symbols.check} ${theme.success('Files are identical')}`);
      console.log('');
      return;
    }

    // Show diff with context
    let contextLines = 3;
    let lastShownIndex = -contextLines - 1;
    const linesToShow: number[] = [];

    // Find lines that need to be shown (changes + context)
    result.lines.forEach((line, i) => {
      if (line.type !== 'same') {
        for (let j = Math.max(0, i - contextLines); j <= Math.min(result.lines.length - 1, i + contextLines); j++) {
          if (!linesToShow.includes(j)) {
            linesToShow.push(j);
          }
        }
      }
    });

    linesToShow.sort((a, b) => a - b);

    for (let i = 0; i < linesToShow.length; i++) {
      const lineIndex = linesToShow[i];
      const line = result.lines[lineIndex];

      // Show separator if there's a gap
      if (i > 0 && linesToShow[i] - linesToShow[i - 1] > 1) {
        console.log(`  ${theme.dim('...')}`);
      }

      const lineNum = line.lineNum1 || line.lineNum2 || '';
      const numStr = lineNum.toString().padStart(4);

      if (line.type === 'add') {
        console.log(`  ${theme.success('+')} ${theme.dim(numStr)} ${theme.success(line.content)}`);
      } else if (line.type === 'remove') {
        console.log(`  ${theme.error('-')} ${theme.dim(numStr)} ${theme.error(line.content)}`);
      } else {
        console.log(`  ${theme.dim(' ')} ${theme.dim(numStr)} ${line.content}`);
      }
    }

    console.log('');
  },
});
