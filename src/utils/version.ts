import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Cache the version to avoid repeated file reads
let cachedVersion: string | null = null;

/**
 * Get the current Zammy version from package.json
 */
export function getZammyVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Try multiple possible locations (bundled vs source)
    const possiblePaths = [
      join(__dirname, 'package.json'),           // Same dir
      join(__dirname, '..', 'package.json'),     // One up (dist/)
      join(__dirname, '..', '..', 'package.json'), // Two up (src/utils/)
    ];

    for (const pkgPath of possiblePaths) {
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.name === 'zammy' && pkg.version) {
          cachedVersion = pkg.version;
          return pkg.version;
        }
      }
    }
    return '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Compare semver versions
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(n => parseInt(n, 10) || 0);
  const partsB = b.split('.').map(n => parseInt(n, 10) || 0);

  for (let i = 0; i < 3; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

/**
 * Check if a version satisfies a minimum version requirement
 */
export function satisfiesMinVersion(current: string, min: string): boolean {
  return compareVersions(current, min) >= 0;
}

/**
 * Check if a version satisfies a maximum version requirement
 */
export function satisfiesMaxVersion(current: string, max: string): boolean {
  return compareVersions(current, max) <= 0;
}
