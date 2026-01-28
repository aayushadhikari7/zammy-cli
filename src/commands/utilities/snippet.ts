import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import {
  saveSnippet,
  getSnippet,
  deleteSnippet,
  listSnippets,
  searchSnippets,
  Snippet,
} from '../../handlers/utilities/snippet.js';
import boxen from 'boxen';
import { execSync } from 'child_process';
import { platform } from 'os';

function copyToClipboard(text: string): boolean {
  try {
    const os = platform();
    if (os === 'darwin') {
      execSync('pbcopy', { input: text });
    } else if (os === 'win32') {
      execSync('clip', { input: text });
    } else {
      // Try xclip first, then xsel
      try {
        execSync('xclip -selection clipboard', { input: text });
      } catch {
        execSync('xsel --clipboard --input', { input: text });
      }
    }
    return true;
  } catch {
    return false;
  }
}

function formatSnippet(snippet: Snippet, showContent = false): string {
  const lang = snippet.language ? theme.accent(`[${snippet.language}]`) : '';
  const tags = snippet.tags?.length ? theme.dim(` #${snippet.tags.join(' #')}`) : '';
  const date = new Date(snippet.updatedAt).toLocaleDateString();

  let output = `  ${theme.primary(snippet.name.padEnd(20))} ${lang}${tags} ${theme.dim(date)}`;

  if (showContent) {
    const preview = snippet.content.split('\n')[0].slice(0, 50);
    output += `\n    ${theme.dim(preview)}${snippet.content.length > 50 ? '...' : ''}`;
  }

  return output;
}

function showList(): void {
  const snippets = listSnippets();

  console.log(boxen(theme.accent(' Code Snippets '), { padding: 0, borderStyle: 'round', borderColor: 'cyan' }));
  console.log();

  if (snippets.length === 0) {
    console.log(theme.dim('  No snippets saved yet.'));
    console.log();
    console.log(theme.dim('  Save one with:'));
    console.log(`    ${theme.primary('/snippet save')} ${theme.accent('<name>')} ${theme.dim('[--lang ts] <content>')}`);
    console.log();
    return;
  }

  for (const snippet of snippets) {
    console.log(formatSnippet(snippet));
  }

  console.log();
  console.log(theme.dim(`  Total: ${snippets.length} snippet${snippets.length !== 1 ? 's' : ''}`));
  console.log();
}

function showSnippet(name: string): void {
  const snippet = getSnippet(name);

  if (!snippet) {
    console.log(theme.error(`Snippet "${name}" not found.`));
    return;
  }

  const lang = snippet.language || 'text';
  const borderColor = snippet.language === 'typescript' || snippet.language === 'ts' ? 'blue' :
                      snippet.language === 'javascript' || snippet.language === 'js' ? 'yellow' :
                      snippet.language === 'python' || snippet.language === 'py' ? 'green' :
                      'cyan';

  console.log();
  console.log(boxen(snippet.content, {
    padding: 1,
    borderStyle: 'round',
    borderColor,
    title: `${snippet.name} (${lang})`,
    titleAlignment: 'left',
  }));

  if (snippet.description) {
    console.log(`  ${theme.dim(snippet.description)}`);
  }
  if (snippet.tags?.length) {
    console.log(`  ${theme.dim('Tags:')} ${snippet.tags.map(t => theme.accent(`#${t}`)).join(' ')}`);
  }
  console.log();
}

function doSave(args: string[]): void {
  let language: string | undefined;
  let tags: string[] | undefined;
  let description: string | undefined;
  let i = 0;

  // Parse flags
  while (i < args.length) {
    if ((args[i] === '--lang' || args[i] === '-l') && args[i + 1]) {
      language = args[i + 1];
      args.splice(i, 2);
    } else if ((args[i] === '--tags' || args[i] === '-t') && args[i + 1]) {
      tags = args[i + 1].split(',').map(t => t.trim());
      args.splice(i, 2);
    } else if ((args[i] === '--desc' || args[i] === '-d') && args[i + 1]) {
      description = args[i + 1];
      args.splice(i, 2);
    } else {
      i++;
    }
  }

  const name = args[0];
  const content = args.slice(1).join(' ');

  if (!name) {
    console.log(theme.error('Usage: /snippet save <name> [--lang ts] [--tags a,b] <content>'));
    return;
  }

  if (!content) {
    console.log(theme.error('No content provided. Usage: /snippet save <name> <content>'));
    return;
  }

  const result = saveSnippet(name, content, { language, tags, description });

  if (result.success) {
    console.log(`${symbols.check} ${theme.success('Snippet saved:')} ${theme.accent(name)}`);
    if (language) console.log(theme.dim(`  Language: ${language}`));
    if (tags?.length) console.log(theme.dim(`  Tags: ${tags.join(', ')}`));
  } else {
    console.log(theme.error(`Failed to save snippet: ${result.error}`));
  }
}

function doDelete(name: string): void {
  if (!name) {
    console.log(theme.error('Usage: /snippet delete <name>'));
    return;
  }

  const result = deleteSnippet(name);

  if (result.success) {
    console.log(`${symbols.check} ${theme.success('Snippet deleted:')} ${theme.accent(name)}`);
  } else {
    console.log(theme.error(result.error || 'Failed to delete snippet'));
  }
}

function doSearch(query: string): void {
  if (!query) {
    console.log(theme.error('Usage: /snippet search <query>'));
    return;
  }

  const results = searchSnippets(query);

  if (results.length === 0) {
    console.log(theme.dim(`No snippets found matching "${query}"`));
    return;
  }

  console.log();
  console.log(theme.secondary(`  Found ${results.length} snippet${results.length !== 1 ? 's' : ''}:`));
  console.log();
  for (const snippet of results) {
    console.log(formatSnippet(snippet, true));
  }
  console.log();
}

function doCopy(name: string): void {
  if (!name) {
    console.log(theme.error('Usage: /snippet copy <name>'));
    return;
  }

  const snippet = getSnippet(name);

  if (!snippet) {
    console.log(theme.error(`Snippet "${name}" not found.`));
    return;
  }

  if (copyToClipboard(snippet.content)) {
    console.log(`${symbols.check} ${theme.success('Copied to clipboard:')} ${theme.accent(name)}`);
  } else {
    console.log(theme.error('Failed to copy to clipboard'));
  }
}

function showHelp(): void {
  console.log(theme.secondary('Usage:'));
  console.log(`  ${theme.primary('/snippet')}                      ${theme.dim('List all snippets')}`);
  console.log(`  ${theme.primary('/snippet list')}                 ${theme.dim('List all snippets')}`);
  console.log(`  ${theme.primary('/snippet save <name> <content>')} ${theme.dim('Save a snippet')}`);
  console.log(`  ${theme.primary('/snippet get <name>')}           ${theme.dim('Show snippet content')}`);
  console.log(`  ${theme.primary('/snippet copy <name>')}          ${theme.dim('Copy snippet to clipboard')}`);
  console.log(`  ${theme.primary('/snippet delete <name>')}        ${theme.dim('Delete a snippet')}`);
  console.log(`  ${theme.primary('/snippet search <query>')}       ${theme.dim('Search snippets')}`);
  console.log();
  console.log(theme.secondary('Options for save:'));
  console.log(`  ${theme.dim('--lang, -l <lang>')}   Set language (ts, js, py, etc.)`);
  console.log(`  ${theme.dim('--tags, -t <a,b>')}    Add comma-separated tags`);
  console.log(`  ${theme.dim('--desc, -d <text>')}   Add description`);
  console.log();
  console.log(theme.secondary('Examples:'));
  console.log(`  ${theme.dim('/snippet save hello console.log("Hello, World!")')}`);
  console.log(`  ${theme.dim('/snippet save --lang ts --tags util,helper myFunc const x: number = 1')}`);
  console.log(`  ${theme.dim('/snippet get hello')}`);
  console.log(`  ${theme.dim('/snippet copy hello')}`);
}

registerCommand({
  name: 'snippet',
  description: 'Save and manage code snippets',
  usage: '/snippet [list|save|get|copy|delete|search] [args]',
  execute: async (args) => {
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand || subcommand === 'list') {
      showList();
      return;
    }

    if (subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
      showHelp();
      return;
    }

    if (subcommand === 'save' || subcommand === 'add') {
      doSave(args.slice(1));
      return;
    }

    if (subcommand === 'get' || subcommand === 'show') {
      showSnippet(args[1]);
      return;
    }

    if (subcommand === 'copy' || subcommand === 'cp') {
      doCopy(args[1]);
      return;
    }

    if (subcommand === 'delete' || subcommand === 'del' || subcommand === 'rm' || subcommand === 'remove') {
      doDelete(args[1]);
      return;
    }

    if (subcommand === 'search' || subcommand === 'find') {
      doSearch(args.slice(1).join(' '));
      return;
    }

    // Unknown subcommand - maybe it's a snippet name?
    const snippet = getSnippet(subcommand);
    if (snippet) {
      showSnippet(subcommand);
      return;
    }

    console.log(theme.error(`Unknown subcommand: ${subcommand}`));
    showHelp();
  },
});
