export interface EnvInfo {
  name: string;
  value: string;
}

export function getAllEnvVars(): EnvInfo[] {
  return Object.entries(process.env)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => ({ name, value: value as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getEnvVar(name: string): string | undefined {
  // Case-insensitive search on Windows
  const exactMatch = process.env[name];
  if (exactMatch !== undefined) return exactMatch;

  // Try case-insensitive
  const upperName = name.toUpperCase();
  for (const [key, value] of Object.entries(process.env)) {
    if (key.toUpperCase() === upperName) {
      return value;
    }
  }

  return undefined;
}

export function searchEnvVars(query: string): EnvInfo[] {
  const lowerQuery = query.toLowerCase();
  return getAllEnvVars().filter(
    env => env.name.toLowerCase().includes(lowerQuery) ||
           env.value.toLowerCase().includes(lowerQuery)
  );
}

export function getPathEntries(): string[] {
  const pathVar = process.env.PATH || process.env.Path || '';
  const separator = process.platform === 'win32' ? ';' : ':';
  return pathVar.split(separator).filter(Boolean);
}
