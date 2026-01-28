import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import {
  getAllAliases,
  addAlias,
  removeAlias,
  getAlias,
  searchAliases,
  Alias,
} from '../../handlers/utilities/alias.js';
import boxen from 'boxen';

function formatAlias(alias: Alias): string {
  const typeIcon = alias.type === 'shell' ? '!' : '/';
  const typeColor = alias.type === 'shell' ? theme.warning : theme.primary;
  const desc = alias.description ? theme.dim(` # ${alias.description}`) : '';
  return `  ${typeColor(typeIcon)}${theme.accent(alias.name.padEnd(15))} ${theme.dim('→')} ${alias.command}${desc}`;
}

function showList(): void {
  const aliases = getAllAliases();

  console.log(boxen(theme.accent(' Command Aliases '), { padding: 0, borderStyle: 'round', borderColor: 'cyan' }));
  console.log();

  if (aliases.length === 0) {
    console.log(theme.dim('  No aliases defined yet.'));
    console.log();
    console.log(theme.dim('  Create one with:'));
    console.log(`    ${theme.primary('/alias add')} ${theme.accent('<name>')} ${theme.dim('<command>')}`);
    console.log();
    console.log(theme.dim('  Examples:'));
    console.log(`    ${theme.dim('/alias add gs git status')}`);
    console.log(`    ${theme.dim('/alias add --zammy h /help')}`);
    console.log();
    return;
  }

  const shellAliases = aliases.filter(a => a.type === 'shell');
  const zammyAliases = aliases.filter(a => a.type === 'zammy');

  if (shellAliases.length > 0) {
    console.log(theme.secondary('  Shell Commands (!):'));
    for (const alias of shellAliases) {
      console.log(formatAlias(alias));
    }
    console.log();
  }

  if (zammyAliases.length > 0) {
    console.log(theme.secondary('  Zammy Commands (/):'));
    for (const alias of zammyAliases) {
      console.log(formatAlias(alias));
    }
    console.log();
  }

  console.log(theme.dim(`  Total: ${aliases.length} alias${aliases.length !== 1 ? 'es' : ''}`));
  console.log();
}

function showAlias(name: string): void {
  const alias = getAlias(name);

  if (!alias) {
    console.log(theme.error(`Alias "${name}" not found.`));
    return;
  }

  console.log();
  console.log(`  ${theme.primary('Name:')}    ${alias.name}`);
  console.log(`  ${theme.primary('Command:')} ${alias.command}`);
  console.log(`  ${theme.primary('Type:')}    ${alias.type === 'shell' ? 'Shell (!)' : 'Zammy (/)'}`);
  if (alias.description) {
    console.log(`  ${theme.primary('Note:')}    ${alias.description}`);
  }
  console.log(`  ${theme.primary('Created:')} ${new Date(alias.createdAt).toLocaleString()}`);
  console.log();
}

function doAdd(args: string[]): void {
  let type: 'shell' | 'zammy' = 'shell';
  let description: string | undefined;
  let startIdx = 0;

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--zammy' || args[i] === '-z') {
      type = 'zammy';
      startIdx = i + 1;
    } else if (args[i] === '--shell' || args[i] === '-s') {
      type = 'shell';
      startIdx = i + 1;
    } else if ((args[i] === '--desc' || args[i] === '-d') && args[i + 1]) {
      description = args[i + 1];
      // Remove desc from args
      args.splice(i, 2);
      i--;
    } else {
      break;
    }
  }

  const name = args[startIdx];
  const command = args.slice(startIdx + 1).join(' ');

  if (!name || !command) {
    console.log(theme.error('Usage: /alias add [--zammy|-z] [--desc "note"] <name> <command>'));
    console.log();
    console.log(theme.dim('Examples:'));
    console.log(`  ${theme.dim('/alias add gs git status')}`);
    console.log(`  ${theme.dim('/alias add --zammy h /help')}`);
    console.log(`  ${theme.dim('/alias add --desc "quick status" gs git status')}`);
    return;
  }

  const result = addAlias(name, command, type, description);

  if (result.success) {
    console.log(`${symbols.check} ${theme.success('Alias created:')} ${theme.accent(name)} ${theme.dim('→')} ${command}`);
    console.log(theme.dim(`  Type: ${type === 'shell' ? '!command' : '/command'}`));
  } else {
    console.log(theme.error(`Failed to create alias: ${result.error}`));
  }
}

function doRemove(name: string): void {
  if (!name) {
    console.log(theme.error('Usage: /alias remove <name>'));
    return;
  }

  const result = removeAlias(name);

  if (result.success) {
    console.log(`${symbols.check} ${theme.success('Alias removed:')} ${theme.accent(name)}`);
  } else {
    console.log(theme.error(result.error || 'Failed to remove alias'));
  }
}

function doSearch(query: string): void {
  if (!query) {
    console.log(theme.error('Usage: /alias search <query>'));
    return;
  }

  const results = searchAliases(query);

  if (results.length === 0) {
    console.log(theme.dim(`No aliases found matching "${query}"`));
    return;
  }

  console.log();
  console.log(theme.secondary(`  Found ${results.length} alias${results.length !== 1 ? 'es' : ''}:`));
  console.log();
  for (const alias of results) {
    console.log(formatAlias(alias));
  }
  console.log();
}

function showHelp(): void {
  console.log(theme.secondary('Usage:'));
  console.log(`  ${theme.primary('/alias')}                     ${theme.dim('List all aliases')}`);
  console.log(`  ${theme.primary('/alias list')}                ${theme.dim('List all aliases')}`);
  console.log(`  ${theme.primary('/alias add <name> <cmd>')}    ${theme.dim('Add shell alias')}`);
  console.log(`  ${theme.primary('/alias add --zammy <n> <c>')} ${theme.dim('Add zammy command alias')}`);
  console.log(`  ${theme.primary('/alias remove <name>')}       ${theme.dim('Remove an alias')}`);
  console.log(`  ${theme.primary('/alias show <name>')}         ${theme.dim('Show alias details')}`);
  console.log(`  ${theme.primary('/alias search <query>')}      ${theme.dim('Search aliases')}`);
  console.log();
  console.log(theme.secondary('Options:'));
  console.log(`  ${theme.dim('--zammy, -z')}    Create zammy command alias (use with /)`);
  console.log(`  ${theme.dim('--shell, -s')}    Create shell command alias (use with !) [default]`);
  console.log(`  ${theme.dim('--desc, -d')}     Add description to alias`);
  console.log();
  console.log(theme.secondary('Examples:'));
  console.log(`  ${theme.dim('/alias add gs git status')}           ${theme.dim('# Creates !gs')}`);
  console.log(`  ${theme.dim('/alias add --zammy h /help')}         ${theme.dim('# Creates /h')}`);
  console.log(`  ${theme.dim('/alias add -d "status" gs git status')}`);
}

registerCommand({
  name: 'alias',
  description: 'Manage command aliases',
  usage: '/alias [list|add|remove|show|search] [args]',
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

    if (subcommand === 'add' || subcommand === 'set') {
      doAdd(args.slice(1));
      return;
    }

    if (subcommand === 'remove' || subcommand === 'rm' || subcommand === 'del' || subcommand === 'delete') {
      doRemove(args[1]);
      return;
    }

    if (subcommand === 'show' || subcommand === 'get') {
      showAlias(args[1]);
      return;
    }

    if (subcommand === 'search' || subcommand === 'find') {
      doSearch(args.slice(1).join(' '));
      return;
    }

    // Unknown subcommand - maybe it's an alias name?
    const alias = getAlias(subcommand);
    if (alias) {
      showAlias(subcommand);
      return;
    }

    console.log(theme.error(`Unknown subcommand: ${subcommand}`));
    showHelp();
  },
});
