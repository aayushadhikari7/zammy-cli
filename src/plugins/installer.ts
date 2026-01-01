import { existsSync, mkdirSync, cpSync, rmSync, readFileSync, writeFileSync, readdirSync, createReadStream, createWriteStream } from 'fs';
import { join, basename, resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { homedir, tmpdir, platform } from 'os';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';
import type { PluginManifest } from './types.js';
import { getPluginsDir, ensurePluginsDir } from './loader.js';
import { checkCommandConflict } from '../commands/registry.js';
import { theme, symbols } from '../ui/colors.js';

const isWindows = platform() === 'win32';

// Get Zammy version for compatibility checking
function getZammyVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const possiblePaths = [
      join(__dirname, 'package.json'),
      join(__dirname, '..', 'package.json'),
      join(__dirname, '..', '..', 'package.json'),
    ];
    for (const pkgPath of possiblePaths) {
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.name === 'zammy' && pkg.version) {
          return pkg.version;
        }
      }
    }
    return '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// Compare semver versions
function compareVersions(a: string, b: string): number {
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

// Check version compatibility
export function checkVersionCompatibility(manifest: PluginManifest): { compatible: boolean; reason?: string } {
  const zammyVersion = getZammyVersion();
  const minVersion = manifest.zammy?.minVersion;
  const maxVersion = manifest.zammy?.maxVersion;

  if (minVersion && compareVersions(zammyVersion, minVersion) < 0) {
    return {
      compatible: false,
      reason: `Requires Zammy v${minVersion}+, but you have v${zammyVersion}`
    };
  }

  if (maxVersion && compareVersions(zammyVersion, maxVersion) > 0) {
    return {
      compatible: false,
      reason: `Incompatible with Zammy v${zammyVersion} (max supported: v${maxVersion})`
    };
  }

  return { compatible: true };
}

// Cross-platform tar.gz extraction using Node.js streams
async function extractTarGz(tarGzPath: string, destDir: string): Promise<void> {
  // First, try native tar command (available on Windows 10+, Linux, macOS)
  try {
    execSync(`tar -xzf "${tarGzPath}" -C "${destDir}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return;
  } catch {
    // tar command failed, use Node.js fallback
  }

  // Fallback: Use Node.js zlib to decompress, then try tar again on the .tar
  const tarPath = tarGzPath.replace(/\.tgz$|\.tar\.gz$/, '.tar');

  // Decompress .tgz to .tar
  await pipeline(
    createReadStream(tarGzPath),
    createGunzip(),
    createWriteStream(tarPath)
  );

  // Try tar command on the decompressed file
  try {
    execSync(`tar -xf "${tarPath}" -C "${destDir}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    // Clean up the intermediate .tar file
    rmSync(tarPath, { force: true });
    return;
  } catch {
    // Clean up
    rmSync(tarPath, { force: true });
  }

  // If we're on Windows and tar still doesn't work, try PowerShell
  if (isWindows) {
    try {
      // PowerShell can handle .tar files with specific commands
      execSync(`powershell -Command "tar -xf '${tarPath}' -C '${destDir}'"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return;
    } catch {
      throw new Error(
        'Unable to extract plugin archive. Please ensure tar is available.\n' +
        'On Windows 10+, tar should be built-in. Try running: tar --version'
      );
    }
  }

  throw new Error('Unable to extract plugin archive. Please ensure tar is installed.');
}

// Validate a plugin manifest
export function validateManifest(manifest: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be an object'] };
  }

  const m = manifest as Record<string, unknown>;

  if (!m.name || typeof m.name !== 'string') {
    errors.push('Missing or invalid "name" field');
  }
  if (!m.version || typeof m.version !== 'string') {
    errors.push('Missing or invalid "version" field');
  }
  if (!m.main || typeof m.main !== 'string') {
    errors.push('Missing or invalid "main" field');
  }
  if (!m.commands || !Array.isArray(m.commands) || m.commands.length === 0) {
    errors.push('Missing or invalid "commands" field (must be non-empty array)');
  }
  if (!m.zammy || typeof m.zammy !== 'object') {
    errors.push('Missing or invalid "zammy" field');
  } else {
    const zammy = m.zammy as Record<string, unknown>;
    if (!zammy.minVersion || typeof zammy.minVersion !== 'string') {
      errors.push('Missing or invalid "zammy.minVersion" field');
    }
  }

  return { valid: errors.length === 0, errors };
}

// Check for command conflicts
export function checkConflicts(manifest: PluginManifest): { hasConflicts: boolean; conflicts: string[] } {
  const conflicts: string[] = [];

  for (const cmd of manifest.commands) {
    const conflict = checkCommandConflict(cmd);
    if (conflict.exists) {
      if (conflict.source === 'core') {
        conflicts.push(`Command '/${cmd}' conflicts with core zammy command`);
      } else {
        conflicts.push(`Command '/${cmd}' conflicts with plugin '${conflict.pluginName}'`);
      }
    }
  }

  return { hasConflicts: conflicts.length > 0, conflicts };
}

// Format permissions for display
export function formatPermissions(manifest: PluginManifest): string[] {
  const perms: string[] = [];
  const p = manifest.permissions;

  if (!p) return perms;

  if (p.shell) {
    perms.push(`${symbols.warning} shell: Can run system commands`);
  }
  if (p.filesystem) {
    if (p.filesystem === true) {
      perms.push(`${symbols.warning} filesystem: Full file system access`);
    } else if (Array.isArray(p.filesystem)) {
      perms.push(`${symbols.info} filesystem: Access to ${p.filesystem.join(', ')}`);
    }
  }
  if (p.network) {
    if (p.network === true) {
      perms.push(`${symbols.warning} network: Full network access`);
    } else if (Array.isArray(p.network)) {
      perms.push(`${symbols.info} network: Access to ${p.network.join(', ')}`);
    }
  }

  return perms;
}

// Install from local path
export async function installFromLocal(sourcePath: string): Promise<{ success: boolean; error?: string; manifest?: PluginManifest }> {
  try {
    const absPath = resolve(sourcePath);

    if (!existsSync(absPath)) {
      return { success: false, error: `Path not found: ${absPath}` };
    }

    // Check for manifest
    const manifestPath = join(absPath, 'zammy-plugin.json');
    if (!existsSync(manifestPath)) {
      return { success: false, error: 'No zammy-plugin.json found in source directory' };
    }

    // Read and validate manifest
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    let manifest: PluginManifest;
    try {
      manifest = JSON.parse(manifestContent);
    } catch {
      return { success: false, error: 'Invalid JSON in zammy-plugin.json' };
    }

    const validation = validateManifest(manifest);
    if (!validation.valid) {
      return { success: false, error: `Invalid manifest: ${validation.errors.join(', ')}` };
    }

    // Check version compatibility BEFORE installing
    const versionCheck = checkVersionCompatibility(manifest);
    if (!versionCheck.compatible) {
      return { success: false, error: versionCheck.reason };
    }

    // Check for entry point
    const mainPath = join(absPath, manifest.main);
    if (!existsSync(mainPath)) {
      return { success: false, error: `Entry point not found: ${manifest.main}` };
    }

    // Install to plugins directory
    ensurePluginsDir();
    const targetDir = join(getPluginsDir(), manifest.name);

    // Remove existing if present
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }

    // Copy plugin files
    cpSync(absPath, targetDir, { recursive: true });

    return { success: true, manifest };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Install from npm package
export async function installFromNpm(packageName: string): Promise<{ success: boolean; error?: string; manifest?: PluginManifest }> {
  const tempDir = join(tmpdir(), `zammy-plugin-${Date.now()}`);

  try {
    mkdirSync(tempDir, { recursive: true });

    // Use npm pack to download the package
    console.log(theme.dim(`  Downloading ${packageName}...`));
    execSync(`npm pack ${packageName} --pack-destination="${tempDir}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 60000,
    });

    // Find the tarball
    const files = readdirSync(tempDir);
    const tarball = files.find(f => f.endsWith('.tgz'));
    if (!tarball) {
      return { success: false, error: 'Failed to download package' };
    }

    // Extract tarball using cross-platform method
    const extractDir = join(tempDir, 'extract');
    mkdirSync(extractDir);
    await extractTarGz(join(tempDir, tarball), extractDir);

    // The extracted content is in a 'package' subdirectory
    const packageDir = join(extractDir, 'package');
    if (!existsSync(packageDir)) {
      return { success: false, error: 'Invalid package structure' };
    }

    // Install from the extracted directory
    return await installFromLocal(packageDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `npm install failed: ${message}` };
  } finally {
    // Cleanup temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Install from GitHub
export async function installFromGithub(repo: string): Promise<{ success: boolean; error?: string; manifest?: PluginManifest }> {
  const tempDir = join(tmpdir(), `zammy-plugin-${Date.now()}`);

  try {
    // Parse repo string (user/repo or github:user/repo)
    let repoPath = repo.replace(/^github:/, '');
    let branch = 'main';

    // Check for branch/tag suffix
    if (repoPath.includes('#')) {
      [repoPath, branch] = repoPath.split('#');
    }

    mkdirSync(tempDir, { recursive: true });

    // Clone the repo
    console.log(theme.dim(`  Cloning ${repoPath}...`));
    execSync(`git clone --depth 1 --branch ${branch} https://github.com/${repoPath}.git "${tempDir}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000,
    });

    // Check if build is needed
    const pkgJsonPath = join(tempDir, 'package.json');
    if (existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
      if (pkgJson.scripts?.build) {
        console.log(theme.dim(`  Installing dependencies...`));
        execSync('npm install', { cwd: tempDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000 });
        console.log(theme.dim(`  Building...`));
        execSync('npm run build', { cwd: tempDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000 });
      }
    }

    // Install from cloned directory
    return await installFromLocal(tempDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `GitHub install failed: ${message}` };
  } finally {
    // Cleanup temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Install from git URL
export async function installFromGit(url: string): Promise<{ success: boolean; error?: string; manifest?: PluginManifest }> {
  const tempDir = join(tmpdir(), `zammy-plugin-${Date.now()}`);

  try {
    mkdirSync(tempDir, { recursive: true });

    console.log(theme.dim(`  Cloning from ${url}...`));
    execSync(`git clone --depth 1 "${url}" "${tempDir}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000,
    });

    // Check if build is needed
    const pkgJsonPath = join(tempDir, 'package.json');
    if (existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
      if (pkgJson.scripts?.build) {
        console.log(theme.dim(`  Installing dependencies...`));
        execSync('npm install', { cwd: tempDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000 });
        console.log(theme.dim(`  Building...`));
        execSync('npm run build', { cwd: tempDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000 });
      }
    }

    return await installFromLocal(tempDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Git install failed: ${message}` };
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Remove a plugin
export function removePlugin(name: string): { success: boolean; error?: string } {
  try {
    const pluginDir = join(getPluginsDir(), name);

    if (!existsSync(pluginDir)) {
      return { success: false, error: `Plugin '${name}' not found` };
    }

    rmSync(pluginDir, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Detect source type from input
export function detectSourceType(source: string): 'local' | 'npm' | 'github' | 'git' | 'unknown' {
  // Local path
  if (source.startsWith('./') || source.startsWith('/') || source.startsWith('..') || /^[A-Za-z]:/.test(source)) {
    return 'local';
  }

  // Explicit GitHub
  if (source.startsWith('github:')) {
    return 'github';
  }

  // GitHub URL
  if (source.includes('github.com')) {
    return 'github';
  }

  // Git URL
  if (source.endsWith('.git') || source.startsWith('git@') || source.startsWith('git://')) {
    return 'git';
  }

  // Assume npm package name
  if (/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(source)) {
    return 'npm';
  }

  return 'unknown';
}
