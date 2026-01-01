// Plugin system exports
export type {
  PluginManifest,
  PluginAPI,
  PluginUI,
  PluginStorage,
  PluginLogger,
  PluginContext,
  PluginShell,
  PluginPermissions,
  ZammyPlugin,
  LoadedPlugin,
  PluginState,
  PluginError,
} from './types.js';

export {
  initPluginLoader,
  discoverPlugins,
  loadPlugin,
  unloadPlugin,
  getDiscoveredPlugins,
  getLoadedPlugins,
  isPluginLoaded,
  getPluginPath,
  getPluginsDir,
  ensurePluginsDir,
} from './loader.js';

export { createPluginAPI } from './api.js';
export { createPluginStorage } from './storage.js';

export {
  installFromLocal,
  installFromNpm,
  installFromGithub,
  installFromGit,
  removePlugin,
  validateManifest,
  checkConflicts,
  formatPermissions,
  detectSourceType,
} from './installer.js';
