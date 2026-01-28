import { registerCommand } from '../registry.js';
import { theme } from '../../ui/colors.js';
import {
  getConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  getConfigPath,
  configExists,
  saveConfig,
  getConfigDiff,
} from '../../config/loader.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';
import { spawn } from 'child_process';
import boxen from 'boxen';

function formatValue(value: any): string {
  if (typeof value === 'boolean') {
    return value ? theme.success('true') : theme.error('false');
  }
  if (typeof value === 'string') {
    return theme.accent(`"${value}"`);
  }
  if (typeof value === 'number') {
    return theme.primary(String(value));
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return theme.dim('[]');
    return theme.accent(`[${value.map(v => `"${v}"`).join(', ')}]`);
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
      .map(([k, v]) => `${theme.dim(k)}: ${formatValue(v)}`)
      .join(', ');
    return `{ ${entries} }`;
  }
  return String(value);
}

function showConfig(): void {
  const config = getConfig();
  const globalPath = getConfigPath(true);
  const projectPath = getConfigPath(false);
  const globalExists = configExists(true);
  const projectExists = configExists(false);

  console.log(boxen(theme.accent(' Zammy Configuration '), { padding: 0, borderStyle: 'round', borderColor: 'magenta' }));
  console.log();

  // Show config file status
  console.log(theme.secondary('Config Files:'));
  console.log(`  Global:  ${globalExists ? theme.success(globalPath) : theme.dim(globalPath + ' (not created)')}`);
  console.log(`  Project: ${projectExists ? theme.success(projectPath) : theme.dim(projectPath + ' (not created)')}`);
  console.log();

  // Show all config values
  console.log(theme.secondary('Current Settings:'));

  const showSection = (obj: any, prefix: string = '', indent: number = 0) => {
    const pad = '  '.repeat(indent + 1);
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        console.log(`${pad}${theme.primary(key)}:`);
        showSection(value, fullKey, indent + 1);
      } else {
        console.log(`${pad}${theme.dim(key)}: ${formatValue(value)}`);
      }
    }
  };

  showSection(config);
  console.log();

  // Show diff from defaults
  const diff = getConfigDiff();
  if (diff.length > 0) {
    console.log(theme.secondary('Modified from defaults:'));
    for (const { key, default: def, current } of diff) {
      console.log(`  ${theme.warning(key)}: ${formatValue(def)} ${theme.dim('->')} ${formatValue(current)}`);
    }
  } else {
    console.log(theme.dim('All settings are at default values.'));
  }
}

function showValue(key: string): void {
  const value = getConfigValue(key as any);
  if (value === undefined) {
    console.log(theme.error(`Unknown config key: ${key}`));
    console.log(theme.dim('Use /config show to see all available keys.'));
    return;
  }
  console.log(`${theme.primary(key)}: ${formatValue(value)}`);
}

function setValue(key: string, valueStr: string, global: boolean): void {
  // Parse value
  let value: any;
  if (valueStr === 'true') value = true;
  else if (valueStr === 'false') value = false;
  else if (/^\d+$/.test(valueStr)) value = parseInt(valueStr, 10);
  else if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
    try {
      value = JSON.parse(valueStr);
    } catch {
      value = valueStr;
    }
  } else {
    value = valueStr;
  }

  // Validate key exists
  const currentValue = getConfigValue(key as any);
  if (currentValue === undefined) {
    console.log(theme.error(`Unknown config key: ${key}`));
    console.log(theme.dim('Use /config show to see all available keys.'));
    return;
  }

  setConfigValue(key as any, value, global);
  console.log(theme.success(`Set ${key} = ${formatValue(value)}`));
  console.log(theme.dim(`Saved to ${global ? 'global' : 'project'} config.`));
}

function resetConfigCmd(): void {
  resetConfig();
  console.log(theme.success('Configuration reset to defaults.'));
  console.log(theme.dim('Note: Config files on disk are not deleted. Use /config save to write defaults.'));
}

function editConfig(global: boolean): void {
  const configPath = getConfigPath(global);
  const config = getConfig();

  // Ensure config file exists
  if (!configExists(global)) {
    saveConfig(global);
    console.log(theme.dim(`Created config file: ${configPath}`));
  }

  const editor = config.editor || 'code';
  console.log(theme.dim(`Opening ${configPath} in ${editor}...`));

  const child = spawn(editor, [configPath], {
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
  console.log(theme.success('Editor opened. Restart zammy to apply changes.'));
}

function showHelp(): void {
  console.log(theme.secondary('Usage:'));
  console.log(`  ${theme.primary('/config')}              ${theme.dim('Show current configuration')}`);
  console.log(`  ${theme.primary('/config show')}         ${theme.dim('Show current configuration')}`);
  console.log(`  ${theme.primary('/config get <key>')}    ${theme.dim('Get a specific config value')}`);
  console.log(`  ${theme.primary('/config set <key> <value>')} ${theme.dim('Set a config value (global)')}`);
  console.log(`  ${theme.primary('/config set --local <key> <value>')} ${theme.dim('Set a config value (project)')}`);
  console.log(`  ${theme.primary('/config reset')}        ${theme.dim('Reset config to defaults')}`);
  console.log(`  ${theme.primary('/config edit')}         ${theme.dim('Open config in editor')}`);
  console.log(`  ${theme.primary('/config edit --local')} ${theme.dim('Open project config in editor')}`);
  console.log();
  console.log(theme.secondary('Examples:'));
  console.log(`  ${theme.dim('/config set theme minimal')}`);
  console.log(`  ${theme.dim('/config set prompt.symbol $')}`);
  console.log(`  ${theme.dim('/config set showBanner false')}`);
  console.log(`  ${theme.dim('/config get theme')}`);
}

registerCommand({
  name: 'config',
  description: 'Manage zammy configuration',
  usage: '/config [show|get|set|reset|edit] [options]',
  execute: async (args) => {
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand || subcommand === 'show') {
      showConfig();
      return;
    }

    if (subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
      showHelp();
      return;
    }

    if (subcommand === 'get') {
      const key = args[1];
      if (!key) {
        console.log(theme.error('Usage: /config get <key>'));
        return;
      }
      showValue(key);
      return;
    }

    if (subcommand === 'set') {
      const isLocal = args[1] === '--local';
      const keyIndex = isLocal ? 2 : 1;
      const key = args[keyIndex];
      const value = args.slice(keyIndex + 1).join(' ');

      if (!key || !value) {
        console.log(theme.error('Usage: /config set [--local] <key> <value>'));
        return;
      }

      setValue(key, value, !isLocal);
      return;
    }

    if (subcommand === 'reset') {
      resetConfigCmd();
      return;
    }

    if (subcommand === 'edit') {
      const isLocal = args[1] === '--local';
      editConfig(!isLocal);
      return;
    }

    console.log(theme.error(`Unknown subcommand: ${subcommand}`));
    showHelp();
  },
});
