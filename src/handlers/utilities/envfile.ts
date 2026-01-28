import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface EnvEntry {
  key: string;
  value: string;
  comment?: string;
  line: number;
}

export interface EnvFile {
  path: string;
  entries: EnvEntry[];
  exists: boolean;
}

export interface EnvDiff {
  key: string;
  inEnv: boolean;
  inExample: boolean;
  envValue?: string;
  exampleValue?: string;
}

export function parseEnvFile(content: string): EnvEntry[] {
  const entries: EnvEntry[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Parse key=value
    const eqIndex = line.indexOf('=');
    if (eqIndex > 0) {
      const key = line.substring(0, eqIndex).trim();
      let value = line.substring(eqIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      entries.push({
        key,
        value,
        line: i + 1,
      });
    }
  }

  return entries;
}

export function loadEnvFile(dir: string, filename: string = '.env'): EnvFile {
  const path = join(dir, filename);
  const exists = existsSync(path);

  if (!exists) {
    return { path, entries: [], exists: false };
  }

  const content = readFileSync(path, 'utf-8');
  const entries = parseEnvFile(content);

  return { path, entries, exists: true };
}

export function getEnvValue(dir: string, key: string, filename: string = '.env'): string | null {
  const env = loadEnvFile(dir, filename);
  const entry = env.entries.find(e => e.key === key);
  return entry?.value ?? null;
}

export function setEnvValue(dir: string, key: string, value: string, filename: string = '.env'): void {
  const path = join(dir, filename);
  let content = '';

  if (existsSync(path)) {
    content = readFileSync(path, 'utf-8');
  }

  const lines = content.split('\n');
  let found = false;
  const needsQuotes = value.includes(' ') || value.includes('#');
  const formattedValue = needsQuotes ? `"${value}"` : value;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith(`${key}=`)) {
      lines[i] = `${key}=${formattedValue}`;
      found = true;
      break;
    }
  }

  if (!found) {
    // Add new entry
    if (content && !content.endsWith('\n')) {
      lines.push('');
    }
    lines.push(`${key}=${formattedValue}`);
  }

  writeFileSync(path, lines.join('\n'));
}

export function deleteEnvValue(dir: string, key: string, filename: string = '.env'): boolean {
  const path = join(dir, filename);

  if (!existsSync(path)) {
    return false;
  }

  const content = readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith(`${key}=`);
  });

  if (filtered.length === lines.length) {
    return false; // Key not found
  }

  writeFileSync(path, filtered.join('\n'));
  return true;
}

export function compareEnvFiles(dir: string, envFile: string = '.env', exampleFile: string = '.env.example'): EnvDiff[] {
  const env = loadEnvFile(dir, envFile);
  const example = loadEnvFile(dir, exampleFile);

  const allKeys = new Set<string>();
  env.entries.forEach(e => allKeys.add(e.key));
  example.entries.forEach(e => allKeys.add(e.key));

  const diffs: EnvDiff[] = [];

  for (const key of allKeys) {
    const envEntry = env.entries.find(e => e.key === key);
    const exampleEntry = example.entries.find(e => e.key === key);

    diffs.push({
      key,
      inEnv: !!envEntry,
      inExample: !!exampleEntry,
      envValue: envEntry?.value,
      exampleValue: exampleEntry?.value,
    });
  }

  return diffs.sort((a, b) => a.key.localeCompare(b.key));
}

export function generateTemplate(dir: string, envFile: string = '.env'): string {
  const env = loadEnvFile(dir, envFile);

  const lines: string[] = [
    '# Environment variables template',
    '# Copy this file to .env and fill in your values',
    '',
  ];

  for (const entry of env.entries) {
    // Mask sensitive values
    const sensitive = /password|secret|key|token|api/i.test(entry.key);
    const value = sensitive ? '' : entry.value;
    lines.push(`${entry.key}=${value}`);
  }

  return lines.join('\n');
}

export function listEnvKeys(dir: string, filename: string = '.env'): string[] {
  const env = loadEnvFile(dir, filename);
  return env.entries.map(e => e.key);
}
