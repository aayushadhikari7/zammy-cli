import { registerCommand, getAllCommands } from './registry.js';
import { theme, symbols, box } from '../ui/colors.js';

// Command categories
const categories: Record<string, string[]> = {
  'Utilities': ['help', 'exit', 'calc', 'password', 'stats', 'time', 'countdown'],
  'Fun': ['joke', 'quote', 'fortune', 'dice', 'flip'],
  'Creative': ['asciiart'],
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
          `  ${theme.command('/' + cmd.name)}`,
          '',
          `  ${cmd.description}`,
          '',
          `  ${theme.dim('Usage:')} ${cmd.usage}`,
          '',
        ], 50));
        console.log('');
      } else {
        console.log(theme.error(`Unknown command: ${cmdName}`));
      }
      return;
    }

    console.log('');
    console.log(`  ${symbols.rocket} ${theme.gradient('ZAMMY COMMANDS')} ${symbols.rocket}`);
    console.log('');

    const maxNameLength = Math.max(...commands.map(c => c.name.length));

    // Display by category
    for (const [category, cmdNames] of Object.entries(categories)) {
      const categoryCommands = commands.filter(c => cmdNames.includes(c.name));
      if (categoryCommands.length === 0) continue;

      console.log(`  ${theme.secondary(category)}`);

      for (const cmd of categoryCommands) {
        const paddedName = cmd.name.padEnd(maxNameLength + 2);
        console.log(
          `    ${theme.command('/' + paddedName)} ${theme.dim(symbols.bullet)} ${cmd.description}`
        );
      }
      console.log('');
    }

    // Show uncategorized commands
    const categorizedNames = Object.values(categories).flat();
    const uncategorized = commands.filter(c => !categorizedNames.includes(c.name));

    if (uncategorized.length > 0) {
      console.log(`  ${theme.secondary('Other')}`);
      for (const cmd of uncategorized) {
        const paddedName = cmd.name.padEnd(maxNameLength + 2);
        console.log(
          `    ${theme.command('/' + paddedName)} ${theme.dim(symbols.bullet)} ${cmd.description}`
        );
      }
      console.log('');
    }

    console.log(theme.dim('  Shell commands start with ! (e.g., !ls, !cd, !clear)'));
    console.log(theme.dim('  Type /help <command> for detailed usage'));
    console.log('');
  },
});
