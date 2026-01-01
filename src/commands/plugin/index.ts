import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { listPlugins } from './list.js';
import { installPlugin } from './install.js';
import { removePluginCommand } from './remove.js';
import { createPlugin } from './create.js';

registerCommand({
  name: 'plugin',
  description: 'Manage zammy plugins',
  usage: '/plugin <list|install|remove|create> [args]',
  async execute(args: string[]) {
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand || subcommand === 'help') {
      console.log('');
      console.log(`  ${symbols.gear} ${theme.gradient('PLUGIN MANAGER')}`);
      console.log('');
      console.log(`  ${theme.primary('Usage:')} /plugin <command> [args]`);
      console.log('');
      console.log(`  ${theme.primary('Commands:')}`);
      console.log(`    ${theme.accent('list')}              ${theme.dim('Show installed plugins')}`);
      console.log(`    ${theme.accent('install')} <source>  ${theme.dim('Install a plugin')}`);
      console.log(`    ${theme.accent('remove')} <name>     ${theme.dim('Remove a plugin')}`);
      console.log(`    ${theme.accent('create')} [name]     ${theme.dim('Create a new plugin')}`);
      console.log('');
      console.log(`  ${theme.primary('Install sources:')}`);
      console.log(`    ${theme.dim('./path/to/plugin')}    ${theme.dim('Local directory')}`);
      console.log(`    ${theme.dim('package-name')}        ${theme.dim('npm package')}`);
      console.log(`    ${theme.dim('github:user/repo')}    ${theme.dim('GitHub repository')}`);
      console.log(`    ${theme.dim('https://...git')}      ${theme.dim('Git URL')}`);
      console.log('');
      return;
    }

    switch (subcommand) {
      case 'list':
      case 'ls':
        await listPlugins();
        break;

      case 'install':
      case 'i':
      case 'add':
        await installPlugin(args.slice(1));
        break;

      case 'remove':
      case 'rm':
      case 'uninstall':
        await removePluginCommand(args.slice(1));
        break;

      case 'create':
      case 'new':
      case 'init':
        await createPlugin(args.slice(1));
        break;

      default:
        console.log(theme.error(`  ${symbols.cross} Unknown subcommand: ${subcommand}`));
        console.log(theme.dim(`  Use '/plugin help' to see available commands`));
    }
  },
});
