import { execSync, spawn as nodeSpawn } from 'child_process';
import { join } from 'path';
import type { PluginManifest, PluginAPI, PluginUI, PluginLogger, PluginContext, PluginShell } from './types.js';
import type { Command } from '../commands/registry.js';
import { registerPluginCommand } from '../commands/registry.js';
import { theme, symbols, box, progressBar } from '../ui/colors.js';
import { createPluginStorage } from './storage.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get zammy version from package.json
function getZammyVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pkgPath = join(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// Create the UI subset exposed to plugins
function createPluginUI(): PluginUI {
  return {
    theme: {
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
      success: theme.success,
      warning: theme.warning,
      error: theme.error,
      info: theme.info,
      dim: theme.dim,
      gradient: theme.gradient,
    },
    symbols: {
      check: symbols.check,
      cross: symbols.cross,
      star: symbols.star,
      arrow: symbols.arrow,
      bullet: symbols.bullet,
      folder: symbols.folder,
      file: '\u{1F4C4}', // 📄
      warning: symbols.warning,
      info: symbols.info,
      rocket: symbols.rocket,
      sparkles: symbols.sparkle,
    },
    box: (content: string, options?: { title?: string; padding?: number }) => {
      const lines = content.split('\n');
      const width = Math.max(...lines.map(l => l.replace(/\x1B\[[0-9;]*m/g, '').length)) + 4;
      return box.draw(lines, width);
    },
    progressBar: (current: number, total: number, width?: number) => {
      const percent = Math.round((current / total) * 100);
      return progressBar(percent, width || 30);
    },
  };
}

// Create logger for a plugin
function createPluginLogger(pluginName: string): PluginLogger {
  const prefix = theme.dim(`[${pluginName}]`);
  return {
    info: (message: string) => console.log(`${prefix} ${theme.info(message)}`),
    warn: (message: string) => console.log(`${prefix} ${theme.warning(message)}`),
    error: (message: string) => console.log(`${prefix} ${theme.error(message)}`),
    debug: (message: string) => {
      if (process.env.ZAMMY_DEBUG) {
        console.log(`${prefix} ${theme.dim(message)}`);
      }
    },
  };
}

// Create shell API for plugins with permissions
function createPluginShell(manifest: PluginManifest): PluginShell | undefined {
  if (!manifest.permissions?.shell) {
    return undefined;
  }

  return {
    exec: (command: string, options?: { timeout?: number }): string => {
      try {
        return execSync(command, {
          encoding: 'utf-8',
          timeout: options?.timeout || 30000,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'stdout' in error) {
          return (error as { stdout: string }).stdout || '';
        }
        throw error;
      }
    },
    spawn: (command: string, args?: string[]): Promise<{ stdout: string; stderr: string; code: number }> => {
      return new Promise((resolve) => {
        const proc = nodeSpawn(command, args || [], {
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        proc.stdout?.on('data', (data) => { stdout += data.toString(); });
        proc.stderr?.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
          resolve({ stdout, stderr, code: code || 0 });
        });

        proc.on('error', () => {
          resolve({ stdout, stderr, code: 1 });
        });
      });
    },
  };
}

// Create the full PluginAPI for a plugin
export function createPluginAPI(manifest: PluginManifest, pluginPath: string): PluginAPI {
  const dataDir = pluginPath;

  const context: PluginContext = {
    pluginName: manifest.name,
    pluginVersion: manifest.version,
    zammyVersion: getZammyVersion(),
    dataDir,
    cwd: process.cwd(),
  };

  return {
    registerCommand: (command: Command) => {
      registerPluginCommand(command, manifest.name);
    },
    registerCommands: (commands: Command[]) => {
      for (const command of commands) {
        registerPluginCommand(command, manifest.name);
      }
    },
    ui: createPluginUI(),
    storage: createPluginStorage(manifest.name, dataDir),
    log: createPluginLogger(manifest.name),
    context,
    shell: createPluginShell(manifest),
  };
}
