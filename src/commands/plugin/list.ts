import { theme, symbols, box } from '../../ui/colors.js';
import { getDiscoveredPlugins, isPluginLoaded, discoverPlugins } from '../../plugins/loader.js';

export async function listPlugins(): Promise<void> {
  // Re-discover to get latest
  await discoverPlugins();
  const plugins = getDiscoveredPlugins();

  console.log('');

  if (plugins.length === 0) {
    console.log(`  ${symbols.info} ${theme.dim('No plugins installed')}`);
    console.log('');
    console.log(`  ${theme.dim('Install a plugin with:')} ${theme.primary('/plugin install <source>')}`);
    console.log(`  ${theme.dim('Create a new plugin with:')} ${theme.primary('/plugin create')}`);
    console.log('');
    return;
  }

  console.log(`  ${symbols.folder} ${theme.gradient('INSTALLED PLUGINS')} ${theme.dim(`(${plugins.length})`)}`);
  console.log('');

  for (const plugin of plugins) {
    const loaded = isPluginLoaded(plugin.name);
    const status = loaded ? theme.success('active') : theme.dim('idle');
    const statusIcon = loaded ? symbols.check : symbols.bullet;

    console.log(`  ${statusIcon} ${theme.primary(plugin.displayName || plugin.name)} ${theme.dim(`v${plugin.version}`)}`);

    if (plugin.description) {
      console.log(`    ${theme.dim(plugin.description)}`);
    }

    console.log(`    ${theme.dim('Commands:')} ${plugin.commands.map(c => theme.accent('/' + c)).join(', ')}`);

    if (plugin.permissions) {
      const perms: string[] = [];
      if (plugin.permissions.shell) perms.push('shell');
      if (plugin.permissions.filesystem) perms.push('fs');
      if (plugin.permissions.network) perms.push('net');
      if (perms.length > 0) {
        console.log(`    ${theme.dim('Permissions:')} ${theme.warning(perms.join(', '))}`);
      }
    }

    console.log('');
  }
}
