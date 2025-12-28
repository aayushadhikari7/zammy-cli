import { registerCommand, getAllCommands } from '../registry.js';
import { theme, symbols, box, categoryIcons, divider } from '../../ui/colors.js';

// Command categories
const categories: Record<string, string[]> = {
  'Utilities': ['help', 'exit', 'calc', 'password', 'stats', 'time', 'countdown', 'timer', 'todo', 'history'],
  'Fun': ['joke', 'quote', 'fortune', 'dice', 'flip', 'pomodoro', 'zammy'],
  'Creative': ['asciiart', 'figlet', 'lorem', 'color'],
  'Dev': ['hash', 'uuid', 'encode'],
  'Info': ['weather'],
};

registerCommand({
  name: 'help',
  description: 'Show all available commands',
  usage: '/help [command]',
  async execute(args: string[]) {
    const commands = getAllCommands();

    // If a specific command is requested
    if (args.length > 0) {
      const cmdName = args[0].replace(/^\//, '');
      const cmd = commands.find(c => c.name === cmdName);

      if (cmd) {
        console.log('');
        console.log(box.draw([
          '',
          `  ${symbols.info} ${theme.b.primary('/' + cmd.name)}`,
          '',
          `  ${theme.dim('Description')}`,
          `  ${cmd.description}`,
          '',
          `  ${theme.dim('Usage')}`,
          `  ${theme.primary(cmd.usage)}`,
          '',
        ], 55, 'rounded'));
        console.log('');
      } else {
        console.log('');
        console.log(`  ${symbols.cross} ${theme.error('Unknown command:')} ${theme.dim(cmdName)}`);
        console.log(theme.dim(`  Try /help to see all commands`));
        console.log('');
      }
      return;
    }

    console.log('');
    console.log(`  ${theme.rainbow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}`);
    console.log(`  ${symbols.rocket} ${theme.gradient('ZAMMY COMMANDS')} ${symbols.rocket}`);
    console.log(`  ${theme.rainbow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}`);
    console.log('');

    const maxNameLength = Math.max(...commands.map(c => c.name.length));

    // Display by category
    for (const [category, cmdNames] of Object.entries(categories)) {
      const categoryCommands = commands.filter(c => cmdNames.includes(c.name));
      if (categoryCommands.length === 0) continue;

      const icon = categoryIcons[category] || symbols.folder;
      console.log(`  ${icon} ${theme.b.secondary(category)}`);
      console.log(theme.dim('  ' + '─'.repeat(46)));

      for (const cmd of categoryCommands) {
        const paddedName = cmd.name.padEnd(maxNameLength + 2);
        console.log(
          `    ${theme.command('/' + paddedName)} ${theme.dim('│')} ${theme.dim(cmd.description)}`
        );
      }
      console.log('');
    }

    // Show uncategorized commands
    const categorizedNames = Object.values(categories).flat();
    const uncategorized = commands.filter(c => !categorizedNames.includes(c.name));

    if (uncategorized.length > 0) {
      console.log(`  ${symbols.folder} ${theme.b.secondary('Other')}`);
      console.log(theme.dim('  ' + '─'.repeat(46)));
      for (const cmd of uncategorized) {
        const paddedName = cmd.name.padEnd(maxNameLength + 2);
        console.log(
          `    ${theme.command('/' + paddedName)} ${theme.dim('│')} ${theme.dim(cmd.description)}`
        );
      }
      console.log('');
    }

    console.log(theme.dim('  ─────────────────────────────────────────────'));
    console.log(`  ${symbols.terminal} ${theme.b.secondary('Enhanced Shell Commands')} ${theme.dim('(prefix with !')}`);
    console.log(theme.dim('  ─────────────────────────────────────────────'));
    console.log('');
    console.log(`  ${theme.dim('File Operations')}`);
    console.log(`    ${theme.primary('!ls')}${theme.dim(' [-la]')}        ${theme.dim('│')} ${theme.dim('Colorized file listing with icons')}`);
    console.log(`    ${theme.primary('!tree')}             ${theme.dim('│')} ${theme.dim('Directory tree visualization')}`);
    console.log(`    ${theme.primary('!cat')} ${theme.dim('<file>')}      ${theme.dim('│')} ${theme.dim('View file with syntax highlighting')}`);
    console.log(`    ${theme.primary('!find')} ${theme.dim('<pattern>')} ${theme.dim('│')} ${theme.dim('Find files matching pattern')}`);
    console.log(`    ${theme.primary('!grep')} ${theme.dim('<pattern>')} ${theme.dim('│')} ${theme.dim('Search in file contents')}`);
    console.log(`    ${theme.primary('!du')}               ${theme.dim('│')} ${theme.dim('Disk usage with visual bars')}`);
    console.log(`    ${theme.primary('!diff')} ${theme.dim('<f1> <f2>')} ${theme.dim('│')} ${theme.dim('Compare two files')}`);
    console.log(`    ${theme.primary('!wc')} ${theme.dim('<file>')}       ${theme.dim('│')} ${theme.dim('Word/line/char count')}`);
    console.log(`    ${theme.primary('!head')} ${theme.dim('<file>')}     ${theme.dim('│')} ${theme.dim('Show first N lines')}`);
    console.log('');
    console.log(`  ${theme.dim('Navigation')}`);
    console.log(`    ${theme.primary('!cd')} ${theme.dim('<path>')}       ${theme.dim('│')} ${theme.dim('Change directory')}`);
    console.log(`    ${theme.primary('!pwd')}              ${theme.dim('│')} ${theme.dim('Show current directory')}`);
    console.log(`    ${theme.primary('!bookmark')} ${theme.dim('[cmd]')} ${theme.dim('│')} ${theme.dim('Save/jump to directory bookmarks')}`);
    console.log('');
    console.log(`  ${theme.dim('Developer Tools')}`);
    console.log(`    ${theme.primary('!git')} ${theme.dim('[cmd]')}       ${theme.dim('│')} ${theme.dim('Enhanced git status/log/branch')}`);
    console.log(`    ${theme.primary('!json')} ${theme.dim('<file>')}     ${theme.dim('│')} ${theme.dim('Pretty print JSON with colors')}`);
    console.log(`    ${theme.primary('!http')} ${theme.dim('<url>')}      ${theme.dim('│')} ${theme.dim('Quick HTTP requests')}`);
    console.log(`    ${theme.primary('!epoch')} ${theme.dim('[time]')}    ${theme.dim('│')} ${theme.dim('Timestamp converter')}`);
    console.log(`    ${theme.primary('!serve')} ${theme.dim('[port]')}    ${theme.dim('│')} ${theme.dim('Quick HTTP server')}`);
    console.log('');
    console.log(`  ${theme.dim('System')}`);
    console.log(`    ${theme.primary('!ip')}               ${theme.dim('│')} ${theme.dim('Show IP addresses')}`);
    console.log(`    ${theme.primary('!ps')}               ${theme.dim('│')} ${theme.dim('Process list')}`);
    console.log(`    ${theme.primary('!env')} ${theme.dim('[filter]')}   ${theme.dim('│')} ${theme.dim('Environment variables')}`);
    console.log(`    ${theme.primary('!clipboard')} ${theme.dim('[cmd]')}${theme.dim('│')} ${theme.dim('Clipboard operations')}`);
    console.log(`    ${theme.primary('!notify')} ${theme.dim('<msg>')}    ${theme.dim('│')} ${theme.dim('Desktop notification')}`);
    console.log('');
    console.log(`  ${theme.dim('Utilities')}`);
    console.log(`    ${theme.primary('!alias')} ${theme.dim('[cmd]')}     ${theme.dim('│')} ${theme.dim('Command aliases')}`);
    console.log(`    ${theme.primary('!watch')} ${theme.dim('<file>')}    ${theme.dim('│')} ${theme.dim('Watch file for changes')}`);
    console.log(`    ${theme.primary('!clear')}            ${theme.dim('│')} ${theme.dim('Clear screen')}`);
    console.log('');
    console.log(theme.dim('  ─────────────────────────────────────────────'));
    console.log(`  ${symbols.info} ${theme.dim('Details:')} ${theme.primary('/help')} ${theme.dim('<command>')}`);
    console.log('');
  },
});
