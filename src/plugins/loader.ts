import { existsSync, readdirSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname, normalize, isAbsolute } from 'path';
import { homedir } from 'os';
import { pathToFileURL, fileURLToPath } from 'url';
import type { PluginManifest, LoadedPlugin, ZammyPlugin, PluginState } from './types.js';
import { createPluginAPI } from './api.js';
import { registerPluginCommand, unregisterPluginCommands, getCommand } from '../commands/registry.js';
import { theme, symbols } from '../ui/colors.js';
import { getZammyVersion, compareVersions } from '../utils/version.js';

// Re-export for backwards compatibility and testing
export { compareVersions } from '../utils/version.js';

// Plugin directories
const PLUGINS_DIR = join(homedir(), '.zammy', 'plugins');

/**
 * Validate that a plugin entry point path is safe
 */
function isValidEntryPoint(basePath: string, entryPoint: string): boolean {
  const normalized = normalize(entryPoint);

  // Reject absolute paths
  if (isAbsolute(normalized)) {
    return false;
  }

  // Reject path traversal
  if (normalized.includes('..')) {
    return false;
  }

  return true;
}

// Check if plugin is compatible with current Zammy version
function checkVersionCompatibility(manifest: PluginManifest, zammyVersion: string): { compatible: boolean; reason?: string } {
  const minVersion = manifest.zammy?.minVersion;
  const maxVersion = manifest.zammy?.maxVersion;

  if (minVersion && compareVersions(zammyVersion, minVersion) < 0) {
    return {
      compatible: false,
      reason: `Requires Zammy v${minVersion}+, but you have v${zammyVersion}`
    };
  }

  if (maxVersion && compareVersions(zammyVersion, maxVersion) > 0) {
    return {
      compatible: false,
      reason: `Incompatible with Zammy v${zammyVersion} (max: v${maxVersion})`
    };
  }

  return { compatible: true };
}

// Plugin registry
const discoveredPlugins = new Map<string, { manifest: PluginManifest; path: string }>();
const loadedPlugins = new Map<string, LoadedPlugin>();

// Ensure plugins directory exists
export function ensurePluginsDir(): void {
  if (!existsSync(PLUGINS_DIR)) {
    mkdirSync(PLUGINS_DIR, { recursive: true });
  }
}

// Get plugins directory path
export function getPluginsDir(): string {
  return PLUGINS_DIR;
}

// Discover all installed plugins (reads manifests only, doesn't load)
export async function discoverPlugins(): Promise<PluginManifest[]> {
  ensurePluginsDir();
  discoveredPlugins.clear();

  if (!existsSync(PLUGINS_DIR)) {
    return [];
  }

  const zammyVersion = getZammyVersion();
  const entries = readdirSync(PLUGINS_DIR, { withFileTypes: true });
  const manifests: PluginManifest[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pluginPath = join(PLUGINS_DIR, entry.name);
    const manifestPath = join(pluginPath, 'zammy-plugin.json');

    if (!existsSync(manifestPath)) continue;

    try {
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent) as PluginManifest;

      // Validate required fields
      if (!manifest.name || !manifest.version || !manifest.main || !manifest.commands) {
        console.log(theme.warning(`  ${symbols.warning} Invalid manifest for plugin in ${entry.name}`));
        continue;
      }

      // Check version compatibility
      const compatibility = checkVersionCompatibility(manifest, zammyVersion);
      if (!compatibility.compatible) {
        console.log(theme.warning(`  ${symbols.warning} Plugin '${manifest.name}' skipped: ${compatibility.reason}`));
        continue;
      }

      discoveredPlugins.set(manifest.name, { manifest, path: pluginPath });
      manifests.push(manifest);
    } catch (error) {
      console.log(theme.warning(`  ${symbols.warning} Failed to read manifest for ${entry.name}`));
    }
  }

  return manifests;
}

// Load a specific plugin (activate it)
export async function loadPlugin(name: string): Promise<LoadedPlugin | null> {
  // Already loaded?
  if (loadedPlugins.has(name)) {
    const existing = loadedPlugins.get(name)!;
    // If previously failed, return null (don't retry)
    if (existing.state === 'error') {
      return null;
    }
    return existing;
  }

  // Find in discovered
  const discovered = discoveredPlugins.get(name);
  if (!discovered) {
    return null;
  }

  const { manifest, path: pluginPath } = discovered;

  try {
    // Validate entry point path (security check)
    if (!isValidEntryPoint(pluginPath, manifest.main)) {
      throw new Error('Invalid plugin entry point: path traversal not allowed');
    }

    // Resolve the main entry point
    const mainPath = join(pluginPath, manifest.main);
    if (!existsSync(mainPath)) {
      throw new Error(`Plugin entry point not found: ${mainPath}`);
    }

    // Dynamic import (ESM)
    const moduleUrl = pathToFileURL(mainPath).href;
    const module = await import(moduleUrl);
    const plugin: ZammyPlugin = module.default;

    if (!plugin || typeof plugin.activate !== 'function') {
      throw new Error('Plugin must export a default object with an activate function');
    }

    // Create API for this plugin
    const api = createPluginAPI(manifest, pluginPath);

    // Activate the plugin (wrapped in try-catch for better error handling)
    try {
      await plugin.activate(api);
    } catch (activationError) {
      const msg = activationError instanceof Error ? activationError.message : String(activationError);
      throw new Error(`Plugin activation failed: ${msg}`);
    }

    const loaded: LoadedPlugin = {
      manifest,
      instance: plugin,
      path: pluginPath,
      state: 'active',
    };

    loadedPlugins.set(name, loaded);
    return loaded;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(theme.error(`  ${symbols.cross} Failed to load plugin '${name}': ${errorMessage}`));

    // Mark as failed in discovered but don't add to loaded
    // This prevents retrying on every command invocation
    const failedPlugin: LoadedPlugin = {
      manifest,
      instance: { activate: async () => {} },
      path: pluginPath,
      state: 'error',
    };
    loadedPlugins.set(name, failedPlugin);

    return null;
  }
}

// Unload a plugin
export async function unloadPlugin(name: string): Promise<boolean> {
  const loaded = loadedPlugins.get(name);
  if (!loaded) {
    return false;
  }

  try {
    // Call deactivate if available
    if (loaded.instance.deactivate) {
      await loaded.instance.deactivate();
    }

    // Unregister commands
    unregisterPluginCommands(name);

    loadedPlugins.delete(name);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(theme.error(`  ${symbols.cross} Failed to unload plugin '${name}': ${errorMessage}`));
    return false;
  }
}

// Get all discovered plugins
export function getDiscoveredPlugins(): PluginManifest[] {
  return Array.from(discoveredPlugins.values()).map(p => p.manifest);
}

// Get all loaded plugins
export function getLoadedPlugins(): LoadedPlugin[] {
  return Array.from(loadedPlugins.values());
}

// Check if a plugin is loaded
export function isPluginLoaded(name: string): boolean {
  return loadedPlugins.has(name);
}

// Get plugin path
export function getPluginPath(name: string): string | undefined {
  return discoveredPlugins.get(name)?.path;
}

// Initialize plugin system - discover all plugins and register their commands
export async function initPluginLoader(): Promise<void> {
  const manifests = await discoverPlugins();

  // Register commands from all discovered plugins (lazy - just metadata)
  for (const manifest of manifests) {
    for (const cmdName of manifest.commands) {
      // Register as pending (will load plugin on first use)
      const lazyExecute = async (args: string[]) => {
        // Lazy load the plugin
        const loaded = await loadPlugin(manifest.name);
        if (!loaded) {
          console.log(theme.error(`  ${symbols.cross} Failed to load plugin '${manifest.name}'`));
          console.log(theme.dim(`  Try reinstalling: /plugin remove ${manifest.name} && /plugin install ${manifest.name}`));
          return;
        }

        // The command should now be properly registered, re-execute
        const realCommand = getCommand(cmdName);
        if (realCommand && realCommand.execute !== lazyExecute) {
          await realCommand.execute(args);
        } else {
          // Plugin loaded but didn't register the expected command
          console.log(theme.error(`  ${symbols.cross} Plugin '${manifest.name}' did not register command '${cmdName}'`));
          console.log(theme.dim(`  The plugin may be misconfigured or corrupted.`));
        }
      };

      registerPluginCommand(
        {
          name: cmdName,
          description: `[${manifest.displayName || manifest.name}] Plugin command`,
          usage: `/${cmdName}`,
          execute: lazyExecute,
        },
        manifest.name
      );
    }
  }
}
