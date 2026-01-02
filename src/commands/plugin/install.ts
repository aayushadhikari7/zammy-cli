import { theme, symbols } from '../../ui/colors.js';
import {
  installFromLocal,
  installFromNpm,
  installFromGithub,
  installFromGit,
  detectSourceType,
  checkConflicts,
  formatPermissions,
} from '../../plugins/installer.js';
import { discoverPlugins, loadPlugin } from '../../plugins/loader.js';
import { registerPluginCommand, getCommand } from '../registry.js';
import { confirm } from '../../ui/input.js';

export async function installPlugin(args: string[]): Promise<void> {
  const source = args[0];

  if (!source) {
    console.log(theme.error(`  ${symbols.cross} No source specified`));
    console.log('');
    console.log(`  ${theme.primary('Usage:')} /plugin install <source>`);
    console.log('');
    console.log(`  ${theme.dim('Examples:')}`);
    console.log(`    ${theme.dim('/plugin install ./my-plugin')}`);
    console.log(`    ${theme.dim('/plugin install zammy-plugin-git')}`);
    console.log(`    ${theme.dim('/plugin install github:user/repo')}`);
    console.log('');
    return;
  }

  console.log('');
  console.log(`  ${symbols.rocket} ${theme.primary('Installing plugin...')}`);

  // Detect source type
  const sourceType = detectSourceType(source);

  if (sourceType === 'unknown') {
    console.log(theme.error(`  ${symbols.cross} Could not determine source type for: ${source}`));
    return;
  }

  console.log(theme.dim(`  Source type: ${sourceType}`));

  // Install based on type
  let result: { success: boolean; error?: string; manifest?: import('../../plugins/types.js').PluginManifest };

  switch (sourceType) {
    case 'local':
      result = await installFromLocal(source);
      break;
    case 'npm':
      result = await installFromNpm(source);
      break;
    case 'github':
      result = await installFromGithub(source);
      break;
    case 'git':
      result = await installFromGit(source);
      break;
    default:
      result = { success: false, error: 'Unknown source type' };
  }

  if (!result.success) {
    console.log(theme.error(`  ${symbols.cross} Installation failed: ${result.error}`));
    return;
  }

  const manifest = result.manifest!;

  // Check for conflicts
  const conflicts = checkConflicts(manifest);
  if (conflicts.hasConflicts) {
    console.log('');
    console.log(theme.warning(`  ${symbols.warning} Command conflicts detected:`));
    for (const conflict of conflicts.conflicts) {
      console.log(`    ${theme.dim('-')} ${conflict}`);
    }
    console.log('');

    const proceed = await confirm(`  ${theme.warning('Continue anyway?')}`);
    if (!proceed) {
      console.log(theme.dim('  Installation cancelled'));
      return;
    }
  }

  // Show permissions warning
  const permissions = formatPermissions(manifest);
  if (permissions.length > 0) {
    console.log('');
    console.log(theme.warning(`  ${symbols.warning} Plugin requests permissions:`));
    for (const perm of permissions) {
      console.log(`    ${perm}`);
    }
    console.log('');
  }

  // Re-discover plugins to pick up the new one
  await discoverPlugins();

  // Register the new plugin's commands for immediate use and autocomplete
  for (const cmdName of manifest.commands) {
    // Skip if command already registered (e.g., conflict)
    if (getCommand(cmdName)) continue;

    // Create lazy-load wrapper
    const lazyExecute = async (args: string[]) => {
      const loaded = await loadPlugin(manifest.name);
      if (!loaded) {
        console.log(theme.error(`  ${symbols.cross} Failed to load plugin '${manifest.name}'`));
        return;
      }
      const realCommand = getCommand(cmdName);
      if (realCommand && realCommand.execute !== lazyExecute) {
        await realCommand.execute(args);
      } else {
        console.log(theme.error(`  ${symbols.cross} Plugin '${manifest.name}' did not register command '${cmdName}'`));
      }
    };

    registerPluginCommand(
      {
        name: cmdName,
        description: `[${manifest.displayName || manifest.name}] ${manifest.description || 'Plugin command'}`,
        usage: `/${cmdName}`,
        execute: lazyExecute,
      },
      manifest.name
    );
  }

  console.log('');
  console.log(`  ${symbols.check} ${theme.success('Plugin installed successfully!')}`);
  console.log('');
  console.log(`  ${theme.primary(manifest.displayName || manifest.name)} ${theme.dim(`v${manifest.version}`)}`);
  if (manifest.description) {
    console.log(`  ${theme.dim(manifest.description)}`);
  }
  console.log('');
  console.log(`  ${theme.dim('Commands added:')} ${manifest.commands.map(c => theme.accent('/' + c)).join(', ')}`);
  console.log('');
}
