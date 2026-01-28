import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { ZammyConfig, PartialConfig, ConfigKey } from './types.js';
import { DEFAULT_CONFIG } from './defaults.js';

const CONFIG_FILENAME = '.zammyrc';
const CONFIG_DIR = join(homedir(), '.zammy');
const GLOBAL_CONFIG_PATH = join(homedir(), CONFIG_FILENAME);
const GLOBAL_CONFIG_ALT_PATH = join(CONFIG_DIR, 'config.json');

let currentConfig: ZammyConfig = { ...DEFAULT_CONFIG };
let configLoaded = false;

function deepMerge<T extends Record<string, any>>(base: T, override: Partial<T>): T {
  const result = { ...base };

  for (const key of Object.keys(override) as (keyof T)[]) {
    const overrideValue = override[key];
    const baseValue = base[key];

    if (
      overrideValue !== undefined &&
      typeof overrideValue === 'object' &&
      overrideValue !== null &&
      !Array.isArray(overrideValue) &&
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(baseValue, overrideValue as any);
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue as T[keyof T];
    }
  }

  return result;
}

function parseConfigFile(filePath: string): PartialConfig | null {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as PartialConfig;
  } catch {
    return null;
  }
}

export function loadConfig(projectDir?: string): ZammyConfig {
  // Start with defaults (deep copy to avoid mutations)
  let config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as ZammyConfig;

  // Load global config (home directory)
  const globalConfig = parseConfigFile(GLOBAL_CONFIG_PATH) || parseConfigFile(GLOBAL_CONFIG_ALT_PATH);
  if (globalConfig) {
    config = deepMerge(config, globalConfig);
  }

  // Load project-level config (cwd)
  const cwd = projectDir || process.cwd();
  const projectConfig = parseConfigFile(join(cwd, CONFIG_FILENAME));
  if (projectConfig) {
    config = deepMerge(config, projectConfig);
  }

  currentConfig = config;
  configLoaded = true;
  return config;
}

export function getConfig(): ZammyConfig {
  if (!configLoaded) {
    loadConfig();
  }
  return currentConfig;
}

export function getConfigValue<K extends keyof ZammyConfig>(key: K): ZammyConfig[K];
export function getConfigValue(key: ConfigKey): any {
  if (!configLoaded) {
    loadConfig();
  }

  if (key.includes('.')) {
    const [parent, child] = key.split('.') as [keyof ZammyConfig, string];
    const parentValue = currentConfig[parent];
    if (typeof parentValue === 'object' && parentValue !== null) {
      return (parentValue as Record<string, any>)[child];
    }
    return undefined;
  }

  return currentConfig[key as keyof ZammyConfig];
}

export function setConfigValue(key: ConfigKey, value: any, global: boolean = true): void {
  // Update in-memory config
  if (key.includes('.')) {
    const [parent, child] = key.split('.') as [keyof ZammyConfig, string];
    const parentValue = currentConfig[parent];
    if (typeof parentValue === 'object' && parentValue !== null) {
      (parentValue as Record<string, any>)[child] = value;
    }
  } else {
    (currentConfig as any)[key] = value;
  }

  // Save to file
  const configPath = global ? GLOBAL_CONFIG_PATH : join(process.cwd(), CONFIG_FILENAME);
  saveConfigToFile(configPath);
}

function saveConfigToFile(filePath: string): void {
  // Read existing config or start fresh
  let existingConfig: PartialConfig = {};
  try {
    if (existsSync(filePath)) {
      existingConfig = JSON.parse(readFileSync(filePath, 'utf-8'));
    }
  } catch {
    // Ignore parse errors, start fresh
  }

  // Merge current config (only non-default values ideally, but for simplicity save all)
  const configToSave = { ...currentConfig };

  // Ensure directory exists for alt path
  const dir = filePath.includes(CONFIG_DIR) ? CONFIG_DIR : null;
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(filePath, JSON.stringify(configToSave, null, 2));
}

export function resetConfig(): void {
  // Deep copy to avoid mutating DEFAULT_CONFIG
  currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  configLoaded = true;
}

export function getConfigPath(global: boolean = true): string {
  return global ? GLOBAL_CONFIG_PATH : join(process.cwd(), CONFIG_FILENAME);
}

export function configExists(global: boolean = true): boolean {
  const path = global ? GLOBAL_CONFIG_PATH : join(process.cwd(), CONFIG_FILENAME);
  return existsSync(path);
}

export function saveConfig(global: boolean = true): void {
  const configPath = getConfigPath(global);
  saveConfigToFile(configPath);
}

export function getConfigDiff(): { key: string; default: any; current: any }[] {
  const diff: { key: string; default: any; current: any }[] = [];

  function compare(defaults: any, current: any, prefix: string = '') {
    for (const key of Object.keys(defaults)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const defaultVal = defaults[key];
      const currentVal = current[key];

      if (typeof defaultVal === 'object' && defaultVal !== null && !Array.isArray(defaultVal)) {
        compare(defaultVal, currentVal || {}, fullKey);
      } else if (JSON.stringify(defaultVal) !== JSON.stringify(currentVal)) {
        diff.push({ key: fullKey, default: defaultVal, current: currentVal });
      }
    }
  }

  compare(DEFAULT_CONFIG, currentConfig);
  return diff;
}

// Export for testing
export { DEFAULT_CONFIG } from './defaults.js';
