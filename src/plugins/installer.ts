import { existsSync, mkdirSync, cpSync, rmSync, readFileSync, writeFileSync, readdirSync, createReadStream, createWriteStream, lstatSync } from 'fs';
import { join, basename, resolve, dirname, relative, isAbsolute, normalize } from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { homedir, tmpdir, platform } from 'os';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import type { PluginManifest } from './types.js';
import { getPluginsDir, ensurePluginsDir } from './loader.js';
import { checkCommandConflict } from '../commands/registry.js';
import { theme, symbols } from '../ui/colors.js';
import { getZammyVersion, compareVersions } from '../utils/version.js';
import {
  isValidPluginName,
  isValidNpmPackageName,
  isValidGitHubRepo,
  isValidBranchName,
  isValidGitUrl,
  isPathSafe,
} from '../utils/security.js';

const isWindows = platform() === 'win32';

/**
 * Validate that a path doesn't escape the plugin directory
 */
function validatePluginPath(basePath: string, targetPath: string): boolean {
  const normalizedTarget = normalize(targetPath);

  // Reject absolute paths
  if (isAbsolute(normalizedTarget)) {
    return false;
  }

  // Reject path traversal
  if (normalizedTarget.includes('..')) {
    return false;
  }

  // Reject backslashes on any platform (normalize should handle this)
  if (targetPath.includes('\\') && !isWindows) {
    return false;
  }

  return true;
}

/**
 * Check for symlinks in a directory (security check)
 */
function containsSymlinks(dirPath: string): boolean {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const stat = lstatSync(fullPath);
      if (stat.isSymbolicLink()) {
        return true;
      }
      if (stat.isDirectory()) {
        if (containsSymlinks(fullPath)) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
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
  // Use execFileSync with array args to prevent command injection
  try {
    execFileSync('tar', ['-xzf', tarGzPath, '-C', destDir], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return;
  } catch {
    // tar command failed, use fallback
  }

  // Fallback: Use Node.js zlib to decompress
  const tarPath = tarGzPath.replace(/\.tgz$|\.tar\.gz$/, '.tar');

  await pipeline(
    createReadStream(tarGzPath),
    createGunzip(),
    createWriteStream(tarPath)
  );

  try {
    execFileSync('tar', ['-xf', tarPath, '-C', destDir], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    rmSync(tarPath, { force: true });
    return;
  } catch {
    rmSync(tarPath, { force: true });
  }

  // PowerShell fallback for Windows
  if (isWindows) {
    try {
      execFileSync('powershell', ['-Command', `tar -xf '${tarPath}' -C '${destDir}'`], {
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

  // Validate name
  if (!m.name || typeof m.name !== 'string') {
    errors.push('Missing or invalid "name" field');
  } else if (!isValidPluginName(m.name)) {
    errors.push('Invalid plugin name: must contain only alphanumeric, dash, underscore');
  }

  // Validate version
  if (!m.version || typeof m.version !== 'string') {
    errors.push('Missing or invalid "version" field');
  }

  // Validate main entry point (security critical)
  if (!m.main || typeof m.main !== 'string') {
    errors.push('Missing or invalid "main" field');
  } else {
    const mainPath = m.main as string;
    // Check for path traversal in main
    if (!validatePluginPath('.', mainPath)) {
      errors.push('Invalid "main" field: path traversal not allowed');
    }
  }

  // Validate commands
  if (!m.commands || !Array.isArray(m.commands) || m.commands.length === 0) {
    errors.push('Missing or invalid "commands" field (must be non-empty array)');
  }

  // Validate zammy compatibility
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

    // Check version compatibility
    const versionCheck = checkVersionCompatibility(manifest);
    if (!versionCheck.compatible) {
      return { success: false, error: versionCheck.reason };
    }

    // Validate entry point path (security)
    if (!validatePluginPath(absPath, manifest.main)) {
      return { success: false, error: 'Invalid entry point path: path traversal not allowed' };
    }

    // Check for entry point
    const mainPath = join(absPath, manifest.main);
    if (!existsSync(mainPath)) {
      return { success: false, error: `Entry point not found: ${manifest.main}` };
    }

    // Check for symlinks (security)
    if (containsSymlinks(absPath)) {
      return { success: false, error: 'Plugin contains symbolic links, which are not allowed for security reasons' };
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
  // Validate package name to prevent command injection
  if (!isValidNpmPackageName(packageName)) {
    return { success: false, error: 'Invalid npm package name' };
  }

  const tempDir = join(tmpdir(), `zammy-plugin-${Date.now()}`);

  try {
    mkdirSync(tempDir, { recursive: true });

    // Use execFileSync with array args to prevent command injection
    console.log(theme.dim(`  Downloading ${packageName}...`));
    execFileSync('npm', ['pack', packageName, `--pack-destination=${tempDir}`], {
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

    // Extract tarball
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
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Install from GitHub
export async function installFromGithub(repo: string): Promise<{ success: boolean; error?: string; manifest?: PluginManifest }> {
  // Parse and validate repo string
  let repoPath = repo.replace(/^github:/, '');
  let branch = 'main';

  if (repoPath.includes('#')) {
    const parts = repoPath.split('#');
    repoPath = parts[0];
    branch = parts[1] || 'main';
  }

  // Validate repo path format
  if (!isValidGitHubRepo(repoPath)) {
    return { success: false, error: 'Invalid GitHub repository format. Use: user/repo or user/repo#branch' };
  }

  // Validate branch name
  if (!isValidBranchName(branch)) {
    return { success: false, error: 'Invalid branch name' };
  }

  const tempDir = join(tmpdir(), `zammy-plugin-${Date.now()}`);

  try {
    mkdirSync(tempDir, { recursive: true });

    // Use execFileSync with array args to prevent command injection
    console.log(theme.dim(`  Cloning ${repoPath}...`));
    execFileSync('git', ['clone', '--depth', '1', '--branch', branch, `https://github.com/${repoPath}.git`, tempDir], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000,
    });

    // Check if build is needed - WARN USER about code execution
    const pkgJsonPath = join(tempDir, 'package.json');
    if (existsSync(pkgJsonPath)) {
      try {
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
        if (pkgJson.scripts?.build) {
          console.log(theme.warning(`  ${symbols.warning} This plugin requires building.`));
          console.log(theme.warning(`  ${symbols.warning} npm install and npm run build will execute scripts from the repository.`));
          console.log(theme.dim(`  Installing dependencies...`));

          // Use execFileSync with array args
          execFileSync('npm', ['install', '--ignore-scripts'], {
            cwd: tempDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 120000,
          });

          console.log(theme.dim(`  Building...`));
          execFileSync('npm', ['run', 'build'], {
            cwd: tempDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 120000,
          });
        }
      } catch (buildError) {
        const msg = buildError instanceof Error ? buildError.message : String(buildError);
        return { success: false, error: `Build failed: ${msg}` };
      }
    }

    // Install from cloned directory
    return await installFromLocal(tempDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `GitHub install failed: ${message}` };
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Install from git URL
export async function installFromGit(url: string): Promise<{ success: boolean; error?: string; manifest?: PluginManifest }> {
  // Validate git URL
  if (!isValidGitUrl(url)) {
    return { success: false, error: 'Invalid git URL. Must be https://*.git, git@*:*.git, or git://*.git' };
  }

  const tempDir = join(tmpdir(), `zammy-plugin-${Date.now()}`);

  try {
    mkdirSync(tempDir, { recursive: true });

    console.log(theme.dim(`  Cloning from ${url}...`));
    // Use execFileSync with array args
    execFileSync('git', ['clone', '--depth', '1', url, tempDir], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000,
    });

    // Check if build is needed
    const pkgJsonPath = join(tempDir, 'package.json');
    if (existsSync(pkgJsonPath)) {
      try {
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
        if (pkgJson.scripts?.build) {
          console.log(theme.warning(`  ${symbols.warning} This plugin requires building.`));
          console.log(theme.dim(`  Installing dependencies...`));

          execFileSync('npm', ['install', '--ignore-scripts'], {
            cwd: tempDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 120000,
          });

          console.log(theme.dim(`  Building...`));
          execFileSync('npm', ['run', 'build'], {
            cwd: tempDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 120000,
          });
        }
      } catch (buildError) {
        const msg = buildError instanceof Error ? buildError.message : String(buildError);
        return { success: false, error: `Build failed: ${msg}` };
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
  // Validate plugin name
  if (!isValidPluginName(name)) {
    return { success: false, error: 'Invalid plugin name' };
  }

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

  // Assume npm package name (validated later)
  if (isValidNpmPackageName(source)) {
    return 'npm';
  }

  return 'unknown';
}
