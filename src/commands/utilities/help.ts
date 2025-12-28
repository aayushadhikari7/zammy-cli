import { registerCommand, getAllCommands } from '../registry.js';
import { theme, symbols, box, categoryIcons, divider } from '../../ui/colors.js';

// Command categories
const categories: Record<string, string[]> = {
  'Utilities': ['help', 'exit', 'calc', 'password', 'stats', 'time', 'countdown', 'timer', 'todo', 'history'],
  'Fun': ['joke', 'quote', 'fortune', 'dice', 'flip', 'pomodoro'],
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
    console.log(`  ${symbols.terminal} ${theme.dim('Shell:')} ${theme.primary('!')}${theme.dim('command (e.g.,')} ${theme.primary('!ls')}${theme.dim(',')} ${theme.primary('!cd')}${theme.dim(')')}`);
    console.log(`  ${symbols.info} ${theme.dim('Details:')} ${theme.primary('/help')} ${theme.dim('<command>')}`);
    console.log('');
  },
});
