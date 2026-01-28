import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { testRegex, parseFlags, highlightMatches, getPattern, getPatternNames, PATTERN_LIBRARY } from '../../handlers/dev/regex.js';

function showPatterns(): void {
  console.log('');
  console.log(`  ${symbols.info} ${theme.primary('Pattern Library')}`);
  console.log('');
  for (const [name, info] of Object.entries(PATTERN_LIBRARY)) {
    console.log(`  ${theme.accent(name.padEnd(12))} ${theme.dim(info.description)}`);
  }
  console.log('');
  console.log(theme.dim('  Usage: /regex patterns <name> <input>'));
  console.log('');
}

registerCommand({
  name: 'regex',
  description: 'Test regex patterns with highlighting',
  usage: '/regex <pattern> <input> [flags] or /regex patterns',
  async execute(args: string[]) {
    if (args.length === 0) {
      console.log('');
      console.log(theme.error('Usage: /regex <pattern> <input> [flags]'));
      console.log(theme.dim('  Flags: g (global), i (insensitive), m (multiline)'));
      console.log('');
      console.log(theme.dim('  Examples:'));
      console.log(theme.dim('    /regex "\\d+" "abc 123 def 456"'));
      console.log(theme.dim('    /regex "hello" "Hello World" i'));
      console.log('');
      console.log(theme.dim('  Pattern library:'));
      console.log(theme.dim('    /regex patterns           - list all patterns'));
      console.log(theme.dim('    /regex patterns email "test@example.com"'));
      console.log('');
      return;
    }

    // Pattern library commands
    if (args[0] === 'patterns' || args[0] === 'library') {
      if (args.length === 1) {
        showPatterns();
        return;
      }

      const patternName = args[1];
      const patternInfo = getPattern(patternName);

      if (!patternInfo) {
        console.log(theme.error(`Unknown pattern: ${patternName}`));
        console.log(theme.dim(`Available: ${getPatternNames().join(', ')}`));
        return;
      }

      if (args.length === 2) {
        console.log('');
        console.log(`  ${theme.primary(patternName)}: ${patternInfo.description}`);
        console.log(`  ${theme.dim('Pattern:')} ${theme.accent(patternInfo.pattern)}`);
        console.log('');
        return;
      }

      const input = args.slice(2).join(' ');
      const result = testRegex(patternInfo.pattern, input, 'g');

      console.log('');
      console.log(`  ${symbols.info} ${theme.primary(patternInfo.description)}`);
      console.log('');

      if (result.matches.length > 0) {
        console.log(`  ${theme.success('Match!')} ${theme.dim(`(${result.matches.length} found)`)}`);
        console.log(`  ${highlightMatches(input, result.matches)}`);
      } else {
        console.log(`  ${theme.error('No match')}`);
        console.log(`  ${theme.dim(input)}`);
      }
      console.log('');
      return;
    }

    // Parse arguments: pattern, input, optional flags
    let pattern = args[0];
    let input: string;
    let flags = 'g';

    // Check if last arg looks like flags
    const lastArg = args[args.length - 1];
    if (args.length >= 3 && /^[gimsuy]+$/.test(lastArg)) {
      flags = parseFlags(lastArg);
      input = args.slice(1, -1).join(' ');
    } else {
      input = args.slice(1).join(' ');
    }

    // Remove quotes if present
    pattern = pattern.replace(/^["']|["']$/g, '');
    input = input.replace(/^["']|["']$/g, '');

    if (!input) {
      console.log(theme.error('Please provide input to test against'));
      return;
    }

    const result = testRegex(pattern, input, flags);

    console.log('');

    if (!result.isValid) {
      console.log(`  ${symbols.cross} ${theme.error('Invalid regex')}`);
      console.log(`  ${theme.dim(result.error)}`);
      console.log('');
      return;
    }

    console.log(`  ${symbols.info} ${theme.primary('Regex Test')}`);
    console.log('');
    console.log(`  ${theme.dim('Pattern:')} ${theme.accent(pattern)}`);
    console.log(`  ${theme.dim('Flags:')}   ${theme.accent(flags || '(none)')}`);
    console.log('');
    console.log(`  ${theme.dim('Input:')}`);
    console.log(`  ${highlightMatches(input, result.matches)}`);
    console.log('');

    if (result.matches.length === 0) {
      console.log(`  ${theme.warning('No matches found')}`);
    } else {
      console.log(`  ${theme.success(`${result.matches.length} match${result.matches.length > 1 ? 'es' : ''} found`)}`);
      console.log('');

      for (let i = 0; i < Math.min(result.matches.length, 10); i++) {
        const match = result.matches[i];
        console.log(`  ${theme.dim(`[${i}]`)} "${theme.success(match.match)}" ${theme.dim(`at index ${match.index}`)}`);

        if (Object.keys(match.groups).length > 0) {
          for (const [name, value] of Object.entries(match.groups)) {
            console.log(`      ${theme.dim(name + ':')} ${theme.accent(value)}`);
          }
        }
      }

      if (result.matches.length > 10) {
        console.log(theme.dim(`  ... and ${result.matches.length - 10} more`));
      }
    }

    console.log('');
  },
});
