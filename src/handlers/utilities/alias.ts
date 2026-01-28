import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface Alias {
  name: string;
  command: string;
  type: 'shell' | 'zammy';
  description?: string;
  createdAt: number;
}

export interface AliasStore {
  version: number;
  aliases: Record<string, Alias>;
}

const ALIASES_FILE = join(homedir(), '.zammy-aliases.json');
const STORE_VERSION = 2;

function migrateOldFormat(old: Record<string, string>): AliasStore {
  const aliases: Record<string, Alias> = {};
  for (const [name, command] of Object.entries(old)) {
    aliases[name] = {
      name,
      command,
      type: 'shell',
      createdAt: Date.now(),
    };
  }
  return { version: STORE_VERSION, aliases };
}

export function loadAliasStore(): AliasStore {
  try {
    if (existsSync(ALIASES_FILE)) {
      const data = JSON.parse(readFileSync(ALIASES_FILE, 'utf-8'));

      // Check if it's old format (no version field)
      if (!data.version) {
        const migrated = migrateOldFormat(data);
        saveAliasStore(migrated);
        return migrated;
      }

      return data as AliasStore;
    }
  } catch {
    // Ignore errors
  }
  return { version: STORE_VERSION, aliases: {} };
}

export function saveAliasStore(store: AliasStore): void {
  writeFileSync(ALIASES_FILE, JSON.stringify(store, null, 2));
}

export function getAlias(name: string): Alias | undefined {
  const store = loadAliasStore();
  return store.aliases[name];
}

export function getAllAliases(): Alias[] {
  const store = loadAliasStore();
  return Object.values(store.aliases).sort((a, b) => a.name.localeCompare(b.name));
}

export function addAlias(
  name: string,
  command: string,
  type: 'shell' | 'zammy' = 'shell',
  description?: string
): { success: boolean; error?: string } {
  // Validate name
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    return {
      success: false,
      error: 'Alias name must start with a letter and contain only letters, numbers, underscores, and hyphens'
    };
  }

  // Check for reserved names
  const reserved = ['add', 'set', 'del', 'rm', 'remove', 'list', 'run', 'help'];
  if (reserved.includes(name.toLowerCase())) {
    return { success: false, error: `"${name}" is a reserved word` };
  }

  const store = loadAliasStore();
  store.aliases[name] = {
    name,
    command,
    type,
    description,
    createdAt: Date.now(),
  };
  saveAliasStore(store);

  return { success: true };
}

export function removeAlias(name: string): { success: boolean; error?: string } {
  const store = loadAliasStore();

  if (!store.aliases[name]) {
    return { success: false, error: `Alias "${name}" not found` };
  }

  delete store.aliases[name];
  saveAliasStore(store);

  return { success: true };
}

export function aliasExists(name: string): boolean {
  const store = loadAliasStore();
  return name in store.aliases;
}

export function expandAlias(input: string): { expanded: string; wasExpanded: boolean; alias?: Alias } {
  const parts = input.trim().split(/\s+/);
  const name = parts[0];
  const args = parts.slice(1).join(' ');

  const alias = getAlias(name);
  if (alias) {
    const expanded = args ? `${alias.command} ${args}` : alias.command;
    return { expanded, wasExpanded: true, alias };
  }

  return { expanded: input, wasExpanded: false };
}

export function searchAliases(query: string): Alias[] {
  const aliases = getAllAliases();
  const lowerQuery = query.toLowerCase();

  return aliases.filter(a =>
    a.name.toLowerCase().includes(lowerQuery) ||
    a.command.toLowerCase().includes(lowerQuery) ||
    a.description?.toLowerCase().includes(lowerQuery)
  );
}
