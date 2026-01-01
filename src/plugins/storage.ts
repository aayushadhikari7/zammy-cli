import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { PluginStorage } from './types.js';

// Create a namespaced storage instance for a plugin
export function createPluginStorage(pluginName: string, dataDir: string): PluginStorage {
  const storagePath = join(dataDir, 'data.json');

  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // Load existing data
  function loadData(): Record<string, unknown> {
    try {
      if (existsSync(storagePath)) {
        const content = readFileSync(storagePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch {
      // Ignore errors, return empty object
    }
    return {};
  }

  // Save data to file
  function saveData(data: Record<string, unknown>): void {
    try {
      writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to save plugin storage for ${pluginName}:`, error);
    }
  }

  return {
    get<T>(key: string): T | undefined {
      const data = loadData();
      return data[key] as T | undefined;
    },

    set<T>(key: string, value: T): void {
      const data = loadData();
      data[key] = value;
      saveData(data);
    },

    delete(key: string): void {
      const data = loadData();
      delete data[key];
      saveData(data);
    },

    clear(): void {
      saveData({});
    },

    getAll(): Record<string, unknown> {
      return loadData();
    },
  };
}
