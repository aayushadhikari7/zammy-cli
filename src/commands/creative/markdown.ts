import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { renderMarkdown, getMarkdownStats } from '../../handlers/creative/markdown.js';
import { existsSync, readFileSync } from 'fs';
import boxen from 'boxen';

registerCommand({
  name: 'md',
  description: 'Render markdown in the terminal',
  usage: '/md <file> | /md --inline "# Hello"',
  async execute(args: string[]) {
    if (args.length === 0) {
      showHelp();
      return;
    }

    const firstArg = args[0];

    // Inline mode
    if (firstArg === '--inline' || firstArg === '-i') {
      const content = args.slice(1).join(' ');
      if (!content) {
        console.log(theme.error('No markdown content provided'));
        return;
      }
      renderContent(content);
      return;
    }

    // Stats mode
    if (firstArg === '--stats' || firstArg === '-s') {
      const file = args[1];
      if (!file) {
        console.log(theme.error('No file specified'));
        return;
      }
      showStats(file);
      return;
    }

    // Help
    if (firstArg === '--help' || firstArg === '-h' || firstArg === 'help') {
      showHelp();
      return;
    }

    // File mode (default)
    renderFile(firstArg);
  },
});

function renderContent(content: string): void {
  console.log('');
  console.log(renderMarkdown(content));
  console.log('');
}

function renderFile(filePath: string): void {
  if (!existsSync(filePath)) {
    console.log(theme.error(`File not found: ${filePath}`));
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    console.log('');
    console.log(boxen(theme.dim(` ${filePath} `), {
      padding: 0,
      borderStyle: 'round',
      borderColor: 'cyan',
    }));
    console.log('');
    console.log(renderMarkdown(content));
    console.log('');
  } catch (err) {
    console.log(theme.error(`Failed to read file: ${filePath}`));
  }
}

function showStats(filePath: string): void {
  if (!existsSync(filePath)) {
    console.log(theme.error(`File not found: ${filePath}`));
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const stats = getMarkdownStats(content);

    console.log('');
    console.log(boxen(theme.accent(` Markdown Stats: ${filePath} `), {
      padding: 0,
      borderStyle: 'round',
      borderColor: 'cyan',
    }));
    console.log('');
    console.log(`  ${theme.primary('Lines:')}       ${stats.lines}`);
    console.log(`  ${theme.primary('Words:')}       ${stats.words}`);
    console.log(`  ${theme.primary('Headers:')}     ${stats.headers}`);
    console.log(`  ${theme.primary('Code Blocks:')} ${stats.codeBlocks}`);
    console.log(`  ${theme.primary('Links:')}       ${stats.links}`);
    console.log(`  ${theme.primary('List Items:')}  ${stats.lists}`);
    console.log('');
  } catch (err) {
    console.log(theme.error(`Failed to read file: ${filePath}`));
  }
}

function showHelp(): void {
  console.log('');
  console.log(theme.secondary('Usage:'));
  console.log(`  ${theme.primary('/md <file>')}              ${theme.dim('Render markdown file')}`);
  console.log(`  ${theme.primary('/md --inline "# Hi"')}     ${theme.dim('Render inline markdown')}`);
  console.log(`  ${theme.primary('/md --stats <file>')}      ${theme.dim('Show document statistics')}`);
  console.log('');
  console.log(theme.secondary('Supported Elements:'));
  console.log(`  ${theme.dim('# H1, ## H2, ### H3')}      ${theme.dim('Headers')}`);
  console.log(`  ${theme.dim('**bold**, *italic*')}       ${theme.dim('Text formatting')}`);
  console.log(`  ${theme.dim('\`code\`, \`\`\`blocks\`\`\`')}      ${theme.dim('Code')}`);
  console.log(`  ${theme.dim('- list, 1. numbered')}      ${theme.dim('Lists')}`);
  console.log(`  ${theme.dim('[text](url)')}              ${theme.dim('Links')}`);
  console.log(`  ${theme.dim('> blockquote')}             ${theme.dim('Quotes')}`);
  console.log(`  ${theme.dim('---')}                      ${theme.dim('Horizontal rule')}`);
  console.log('');
  console.log(theme.secondary('Examples:'));
  console.log(`  ${theme.dim('/md README.md')}`);
  console.log(`  ${theme.dim('/md --inline "# Hello **World**"')}`);
  console.log(`  ${theme.dim('/md --stats docs/guide.md')}`);
  console.log('');
}
