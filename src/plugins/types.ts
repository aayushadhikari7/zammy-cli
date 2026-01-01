import type { Command } from '../commands/registry.js';

// Plugin manifest format (zammy-plugin.json)
export interface PluginManifest {
  // Required fields
  name: string;
  version: string;
  main: string;
  commands: string[];
  zammy: {
    minVersion: string;
    maxVersion?: string;
  };

  // Optional metadata
  displayName?: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;

  // Permissions
  permissions?: PluginPermissions;
}

export interface PluginPermissions {
  shell?: boolean;
  filesystem?: boolean | string[];
  network?: boolean | string[];
  env?: boolean | string[];
}

// What plugins receive to interact with zammy
export interface PluginAPI {
  // Command registration
  registerCommand(command: Command): void;
  registerCommands(commands: Command[]): void;

  // UI utilities (read-only access to zammy's theming)
  ui: PluginUI;

  // Namespaced storage for plugin data
  storage: PluginStorage;

  // Logging (prefixed with plugin name)
  log: PluginLogger;

  // Context information
  context: PluginContext;

  // Shell access (only if permitted)
  shell?: PluginShell;
}

export interface PluginUI {
  theme: {
    primary: (text: string) => string;
    secondary: (text: string) => string;
    accent: (text: string) => string;
    success: (text: string) => string;
    warning: (text: string) => string;
    error: (text: string) => string;
    info: (text: string) => string;
    dim: (text: string) => string;
    gradient: (text: string) => string;
  };
  symbols: {
    check: string;
    cross: string;
    star: string;
    arrow: string;
    bullet: string;
    folder: string;
    file: string;
    warning: string;
    info: string;
    rocket: string;
    sparkles: string;
  };
  box: (content: string, options?: { title?: string; padding?: number }) => string;
  progressBar: (current: number, total: number, width?: number) => string;
}

export interface PluginStorage {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
  clear(): void;
  getAll(): Record<string, unknown>;
}

export interface PluginLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

export interface PluginContext {
  pluginName: string;
  pluginVersion: string;
  zammyVersion: string;
  dataDir: string;
  cwd: string;
}

export interface PluginShell {
  exec(command: string, options?: { timeout?: number }): string;
  spawn(command: string, args?: string[]): Promise<{ stdout: string; stderr: string; code: number }>;
}

// Plugin entry point interface
export interface ZammyPlugin {
  activate(api: PluginAPI): Promise<void> | void;
  deactivate?(): Promise<void> | void;
}

// Internal types for plugin management
export interface LoadedPlugin {
  manifest: PluginManifest;
  instance: ZammyPlugin;
  path: string;
  state: PluginState;
}

export type PluginState = 'discovered' | 'loaded' | 'active' | 'error';

export interface PluginError {
  pluginName: string;
  error: Error;
  phase: 'discovery' | 'load' | 'activate' | 'execute';
}
