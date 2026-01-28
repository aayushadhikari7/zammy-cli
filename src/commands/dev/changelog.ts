import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import {
  generateChangelog,
  formatChangelogMarkdown,
  formatChangelogJson,
  getLatestTag,
  getTags,
} from '../../handlers/dev/changelog.js';
import { writeFileSync } from 'fs';

registerCommand({
  name: 'changelog',
  description: 'Generate changelog from git commits',
  usage: '/changelog [--from <tag>] [--to <ref>] [--format md|json]',
  async execute(args: string[]) {
    // Parse arguments
    let from: string | undefined;
    let to = 'HEAD';
    let format = 'md';
    let output: string | undefined;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--from' && args[i + 1]) {
        from = args[++i];
      } else if (args[i] === '--to' && args[i + 1]) {
        to = args[++i];
      } else if (args[i] === '--format' && args[i + 1]) {
        format = args[++i].toLowerCase();
      } else if (args[i] === '--output' && args[i + 1]) {
        output = args[++i];
      } else if (args[i] === '--help' || args[i] === 'help') {
        console.log('');
        console.log(theme.primary('Changelog Generator:'));
        console.log('');
        console.log(`  ${theme.accent('/changelog')}                     ${theme.dim('Generate from latest tag to HEAD')}`);
        console.log(`  ${theme.accent('/changelog --from')} ${theme.dim('<tag>')}       ${theme.dim('Start from specific tag/ref')}`);
        console.log(`  ${theme.accent('/changelog --to')} ${theme.dim('<ref>')}         ${theme.dim('End at specific ref (default: HEAD)')}`);
        console.log(`  ${theme.accent('/changelog --format')} ${theme.dim('md|json')}   ${theme.dim('Output format')}`);
        console.log(`  ${theme.accent('/changelog --output')} ${theme.dim('<file>')}    ${theme.dim('Write to file')}`);
        console.log(`  ${theme.accent('/changelog tags')}                ${theme.dim('List available tags')}`);
        console.log('');
        console.log(theme.dim('  Uses conventional commit format (feat:, fix:, etc.)'));
        console.log('');
        return;
      } else if (args[i] === 'tags') {
        const tags = getTags();
        console.log('');
        if (tags.length === 0) {
          console.log(theme.dim('No tags found'));
        } else {
          console.log(`  ${symbols.info} ${theme.primary('Git Tags')}`);
          console.log('');
          for (const tag of tags.slice(0, 20)) {
            console.log(`  ${theme.accent(tag)}`);
          }
          if (tags.length > 20) {
            console.log(theme.dim(`  ... and ${tags.length - 20} more`));
          }
        }
        console.log('');
        return;
      }
    }

    // Default to latest tag if no --from specified
    if (!from) {
      from = getLatestTag() || undefined;
    }

    console.log('');
    console.log(`  ${symbols.info} ${theme.primary('Generating Changelog')}`);
    console.log(`  ${theme.dim('From:')} ${from || 'beginning'} ${theme.dim('To:')} ${to}`);
    console.log('');

    const changelog = generateChangelog(from, to);

    if (changelog.totalCommits === 0) {
      console.log(theme.warning('No commits found in the specified range'));
      console.log('');
      return;
    }

    let content: string;
    if (format === 'json') {
      content = formatChangelogJson(changelog);
    } else {
      content = formatChangelogMarkdown(changelog);
    }

    if (output) {
      writeFileSync(output, content);
      console.log(`  ${symbols.check} ${theme.success(`Written to ${output}`)}`);
      console.log(`  ${theme.dim(`${changelog.totalCommits} commits`)}`);
    } else {
      console.log(content);
    }

    console.log('');
  },
});
