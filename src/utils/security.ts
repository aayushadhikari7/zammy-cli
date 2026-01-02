import { relative, isAbsolute, normalize } from 'path';

/**
 * Validate that a path doesn't escape its parent directory (path traversal prevention)
 */
export function isPathSafe(basePath: string, targetPath: string): boolean {
  const normalizedTarget = normalize(targetPath);

  // Check for absolute paths
  if (isAbsolute(normalizedTarget)) {
    return false;
  }

  // Check for path traversal sequences
  if (normalizedTarget.includes('..')) {
    return false;
  }

  // Double-check using relative path calculation
  const relativePath = relative(basePath, normalizedTarget);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    return false;
  }

  return true;
}

/**
 * Validate a plugin name for safety
 * - No path separators
 * - No path traversal
 * - Only alphanumeric, dash, underscore, @, /
 */
export function isValidPluginName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // Check for path traversal
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    // Allow scoped packages like @scope/name
    if (name.startsWith('@') && name.split('/').length === 2) {
      const [scope, pkg] = name.split('/');
      return isValidScopedName(scope, pkg);
    }
    return false;
  }

  // Validate characters: alphanumeric, dash, underscore
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

function isValidScopedName(scope: string, pkg: string): boolean {
  // @scope/package format
  return /^@[a-z0-9-~][a-z0-9-._~]*$/.test(scope) &&
         /^[a-z0-9-~][a-z0-9-._~]*$/.test(pkg);
}

/**
 * Validate npm package name format
 */
export function isValidNpmPackageName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // Scoped package: @scope/name
  if (name.startsWith('@')) {
    return /^@[a-z0-9-~][a-z0-9-._~]*\/[a-z0-9-~][a-z0-9-._~]*$/.test(name);
  }

  // Regular package
  return /^[a-z0-9-~][a-z0-9-._~]*$/.test(name);
}

/**
 * Validate GitHub repo path format (user/repo or user/repo#branch)
 */
export function isValidGitHubRepo(repo: string): boolean {
  if (!repo || typeof repo !== 'string') {
    return false;
  }

  // Remove github: prefix if present
  const path = repo.replace(/^github:/, '');

  // Split branch if present
  const [repoPath] = path.split('#');

  // Validate format: user/repo
  return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(repoPath);
}

/**
 * Validate a git branch name
 */
export function isValidBranchName(branch: string): boolean {
  if (!branch || typeof branch !== 'string') {
    return false;
  }

  // Branch names can contain alphanumeric, dash, underscore, dot, slash
  // But not: space, ~, ^, :, ?, *, [, \, consecutive dots
  if (/[\s~^:?*\[\]\\]/.test(branch) || branch.includes('..')) {
    return false;
  }

  return /^[a-zA-Z0-9/_.-]+$/.test(branch);
}

/**
 * Validate a git URL
 */
export function isValidGitUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // HTTPS URL
  if (url.startsWith('https://') && url.endsWith('.git')) {
    return true;
  }

  // SSH URL
  if (url.startsWith('git@') && url.includes(':') && url.endsWith('.git')) {
    return true;
  }

  // Git protocol
  if (url.startsWith('git://') && url.endsWith('.git')) {
    return true;
  }

  return false;
}

/**
 * Escape a string for safe use in shell commands (when shell execution is unavoidable)
 */
export function shellEscape(str: string): string {
  if (!str) return "''";

  // If the string contains no special characters, return as-is
  if (/^[a-zA-Z0-9_.\/-]+$/.test(str)) {
    return str;
  }

  // Wrap in single quotes and escape any existing single quotes
  return "'" + str.replace(/'/g, "'\\''") + "'";
}
