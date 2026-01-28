import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import {
  sortLines,
  uniqueLines,
  transformCase,
  trimText,
  replaceText,
  numberLines,
  countStats,
  reverseText,
  filterLines,
  wrapText,
} from '../../handlers/utilities/textpipe.js';

function showHelp(): void {
  console.log('');
  console.log(theme.primary('Text Processing Commands:'));
  console.log('');
  console.log(`  ${theme.accent('/text sort')} ${theme.dim('[--reverse] [--numeric] [--unique]')}`);
  console.log(`  ${theme.accent('/text uniq')} ${theme.dim('[--count]')}`);
  console.log(`  ${theme.accent('/text upper')} ${theme.dim('| lower | title')}`);
  console.log(`  ${theme.accent('/text trim')} ${theme.dim('[--lines]')}`);
  console.log(`  ${theme.accent('/text replace')} ${theme.dim('<pattern> <replacement> [--regex]')}`);
  console.log(`  ${theme.accent('/text lines')} ${theme.dim('[--number]')}`);
  console.log(`  ${theme.accent('/text reverse')} ${theme.dim('[--chars | --words]')}`);
  console.log(`  ${theme.accent('/text filter')} ${theme.dim('<pattern> [--invert] [--regex]')}`);
  console.log(`  ${theme.accent('/text wrap')} ${theme.dim('[width]')}`);
  console.log(`  ${theme.accent('/text stats')}`);
  console.log('');
  console.log(theme.dim('  Input is read from remaining arguments or piped input'));
  console.log(theme.dim('  Example: /text upper "hello world"'));
  console.log('');
}

function getInput(args: string[], startIdx: number): string {
  return args.slice(startIdx).join(' ').replace(/^["']|["']$/g, '');
}

registerCommand({
  name: 'text',
  description: 'Text processing utilities',
  usage: '/text <command> [options] <input>',
  async execute(args: string[]) {
    if (args.length === 0) {
      showHelp();
      return;
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === 'help' || subcommand === '--help') {
      showHelp();
      return;
    }

    if (subcommand === 'sort') {
      const reverse = args.includes('--reverse') || args.includes('-r');
      const numeric = args.includes('--numeric') || args.includes('-n');
      const unique = args.includes('--unique') || args.includes('-u');
      const inputIdx = args.findIndex((a, i) => i > 0 && !a.startsWith('-'));
      const input = inputIdx > 0 ? getInput(args, inputIdx) : '';

      if (!input) {
        console.log(theme.error('Please provide text to sort'));
        return;
      }

      const result = sortLines(input, { reverse, numeric, unique });
      console.log('');
      console.log(result.output);
      console.log('');
      console.log(theme.dim(`${result.lineCount} lines`));
      return;
    }

    if (subcommand === 'uniq' || subcommand === 'unique') {
      const count = args.includes('--count') || args.includes('-c');
      const inputIdx = args.findIndex((a, i) => i > 0 && !a.startsWith('-'));
      const input = inputIdx > 0 ? getInput(args, inputIdx) : '';

      if (!input) {
        console.log(theme.error('Please provide text'));
        return;
      }

      const result = uniqueLines(input, { count });
      console.log('');
      console.log(result.output);
      console.log('');
      console.log(theme.dim(`${result.lineCount} unique lines`));
      return;
    }

    if (subcommand === 'upper' || subcommand === 'uppercase') {
      const input = getInput(args, 1);
      if (!input) {
        console.log(theme.error('Please provide text'));
        return;
      }
      console.log('');
      console.log(transformCase(input, 'upper').output);
      console.log('');
      return;
    }

    if (subcommand === 'lower' || subcommand === 'lowercase') {
      const input = getInput(args, 1);
      if (!input) {
        console.log(theme.error('Please provide text'));
        return;
      }
      console.log('');
      console.log(transformCase(input, 'lower').output);
      console.log('');
      return;
    }

    if (subcommand === 'title') {
      const input = getInput(args, 1);
      if (!input) {
        console.log(theme.error('Please provide text'));
        return;
      }
      console.log('');
      console.log(transformCase(input, 'title').output);
      console.log('');
      return;
    }

    if (subcommand === 'trim') {
      const lines = args.includes('--lines') || args.includes('-l');
      const inputIdx = args.findIndex((a, i) => i > 0 && !a.startsWith('-'));
      const input = inputIdx > 0 ? getInput(args, inputIdx) : '';

      if (!input) {
        console.log(theme.error('Please provide text'));
        return;
      }

      console.log('');
      console.log(trimText(input, lines ? 'lines' : 'both').output);
      console.log('');
      return;
    }

    if (subcommand === 'replace') {
      const useRegex = args.includes('--regex') || args.includes('-r');
      const filteredArgs = args.filter(a => !a.startsWith('-'));

      if (filteredArgs.length < 4) {
        console.log(theme.error('Usage: /text replace <pattern> <replacement> <input>'));
        return;
      }

      const pattern = filteredArgs[1];
      const replacement = filteredArgs[2];
      const input = filteredArgs.slice(3).join(' ');

      const result = replaceText(input, pattern, replacement, { regex: useRegex });
      console.log('');
      console.log(result.output);
      console.log('');
      return;
    }

    if (subcommand === 'lines' || subcommand === 'number') {
      const showNumber = args.includes('--number') || args.includes('-n') || subcommand === 'number';
      const inputIdx = args.findIndex((a, i) => i > 0 && !a.startsWith('-'));
      const input = inputIdx > 0 ? getInput(args, inputIdx) : '';

      if (!input) {
        console.log(theme.error('Please provide text'));
        return;
      }

      if (showNumber) {
        console.log('');
        console.log(numberLines(input).output);
        console.log('');
      } else {
        const stats = countStats(input);
        console.log('');
        console.log(`  ${theme.dim('Lines:')} ${stats.lines}`);
        console.log(`  ${theme.dim('Words:')} ${stats.words}`);
        console.log(`  ${theme.dim('Chars:')} ${stats.chars}`);
        console.log('');
      }
      return;
    }

    if (subcommand === 'reverse' || subcommand === 'rev') {
      const chars = args.includes('--chars') || args.includes('-c');
      const words = args.includes('--words') || args.includes('-w');
      const inputIdx = args.findIndex((a, i) => i > 0 && !a.startsWith('-'));
      const input = inputIdx > 0 ? getInput(args, inputIdx) : '';

      if (!input) {
        console.log(theme.error('Please provide text'));
        return;
      }

      const mode = chars ? 'chars' : words ? 'words' : 'lines';
      console.log('');
      console.log(reverseText(input, mode).output);
      console.log('');
      return;
    }

    if (subcommand === 'filter' || subcommand === 'grep') {
      const invert = args.includes('--invert') || args.includes('-v');
      const useRegex = args.includes('--regex') || args.includes('-r');
      const filteredArgs = args.filter(a => !a.startsWith('-'));

      if (filteredArgs.length < 3) {
        console.log(theme.error('Usage: /text filter <pattern> <input>'));
        return;
      }

      const pattern = filteredArgs[1];
      const input = filteredArgs.slice(2).join(' ');

      const result = filterLines(input, pattern, { invert, regex: useRegex });
      console.log('');
      console.log(result.output || theme.dim('(no matches)'));
      console.log('');
      console.log(theme.dim(`${result.lineCount} lines`));
      return;
    }

    if (subcommand === 'wrap') {
      const widthArg = args.find((a, i) => i > 0 && /^\d+$/.test(a));
      const width = widthArg ? parseInt(widthArg, 10) : 80;
      const inputIdx = args.findIndex((a, i) => i > 0 && !a.startsWith('-') && !/^\d+$/.test(a));
      const input = inputIdx > 0 ? getInput(args, inputIdx) : '';

      if (!input) {
        console.log(theme.error('Please provide text'));
        return;
      }

      console.log('');
      console.log(wrapText(input, width).output);
      console.log('');
      return;
    }

    if (subcommand === 'stats' || subcommand === 'count') {
      const input = getInput(args, 1);
      if (!input) {
        console.log(theme.error('Please provide text'));
        return;
      }

      const stats = countStats(input);
      console.log('');
      console.log(`  ${symbols.info} ${theme.primary('Text Statistics')}`);
      console.log('');
      console.log(`  ${theme.dim('Lines:')}      ${theme.success(stats.lines.toString())}`);
      console.log(`  ${theme.dim('Words:')}      ${theme.success(stats.words.toString())}`);
      console.log(`  ${theme.dim('Characters:')} ${theme.success(stats.chars.toString())}`);
      console.log(`  ${theme.dim('Bytes:')}      ${theme.success(stats.bytes.toString())}`);
      console.log('');
      return;
    }

    console.log(theme.error(`Unknown subcommand: ${subcommand}`));
    showHelp();
  },
});
