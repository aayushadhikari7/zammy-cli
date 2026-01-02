import { theme, symbols } from '../../ui/colors.js';
import { removePlugin } from '../../plugins/installer.js';
import { getDiscoveredPlugins, unloadPlugin, discoverPlugins } from '../../plugins/loader.js';
import { confirm } from '../../ui/input.js';

export async function removePluginCommand(args: string[]): Promise<void> {
  // Check for -y or --yes flag (skip confirmation)
  const forceIndex = args.findIndex(a => a === '-y' || a === '--yes');
  const skipConfirm = forceIndex !== -1;
  if (skipConfirm) {
    args.splice(forceIndex, 1);
  }

  const name = args[0];

  if (!name) {
    console.log(theme.error(`  ${symbols.cross} No plugin name specified`));
    console.log('');
    console.log(`  ${theme.primary('Usage:')} /plugin remove <name>`);
    console.log('');

    // Show installed plugins
    await discoverPlugins();
    const plugins = getDiscoveredPlugins();
    if (plugins.length > 0) {
      console.log(`  ${theme.dim('Installed plugins:')}`);
      for (const p of plugins) {
        console.log(`    ${theme.accent(p.name)}`);
      }
      console.log('');
    }
    return;
  }

  // Find the plugin
  await discoverPlugins();
  const plugins = getDiscoveredPlugins();
  const plugin = plugins.find(p => p.name === name || p.displayName?.toLowerCase() === name.toLowerCase());

  if (!plugin) {
    console.log(theme.error(`  ${symbols.cross} Plugin '${name}' not found`));
    console.log('');

    // Suggest similar names
    const similar = plugins.filter(p =>
      p.name.includes(name) || name.includes(p.name) ||
      p.displayName?.toLowerCase().includes(name.toLowerCase())
    );
    if (similar.length > 0) {
      console.log(`  ${theme.dim('Did you mean:')}`);
      for (const p of similar) {
        console.log(`    ${theme.accent(p.name)}`);
      }
      console.log('');
    }
    return;
  }

  // Confirm removal (unless -y flag)
  console.log('');
  console.log(`  ${theme.warning('About to remove:')}`);
  console.log(`    ${theme.primary(plugin.displayName || plugin.name)} ${theme.dim(`v${plugin.version}`)}`);
  console.log(`    ${theme.dim('Commands:')} ${plugin.commands.map(c => '/' + c).join(', ')}`);
  console.log('');

  if (!skipConfirm) {
    const proceed = await confirm(`  ${theme.warning('Remove this plugin?')}`);
    if (!proceed) {
      console.log(theme.dim('  Removal cancelled'));
      return;
    }
  }

  // Unload if loaded
  await unloadPlugin(plugin.name);

  // Remove from disk
  const result = removePlugin(plugin.name);

  if (!result.success) {
    console.log(theme.error(`  ${symbols.cross} Failed to remove: ${result.error}`));
    return;
  }

  // Re-discover to update registry
  await discoverPlugins();

  console.log('');
  console.log(`  ${symbols.check} ${theme.success('Plugin removed successfully')}`);
  console.log('');
}
