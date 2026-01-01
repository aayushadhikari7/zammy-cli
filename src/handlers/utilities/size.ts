import { statSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

export interface SizeInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  children?: SizeInfo[];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function getSize(path: string): SizeInfo | null {
  if (!existsSync(path)) return null;

  try {
    const stats = statSync(path);

    if (stats.isFile()) {
      return {
        path,
        name: basename(path),
        size: stats.size,
        isDirectory: false
      };
    }

    if (stats.isDirectory()) {
      return getDirSize(path);
    }

    return null;
  } catch {
    return null;
  }
}

export function getDirSize(dirPath: string): SizeInfo {
  const children: SizeInfo[] = [];
  let totalSize = 0;

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(dirPath, entry.name);

      try {
        if (entry.isFile()) {
          const stats = statSync(entryPath);
          totalSize += stats.size;
          children.push({
            path: entryPath,
            name: entry.name,
            size: stats.size,
            isDirectory: false
          });
        } else if (entry.isDirectory()) {
          // Skip common large directories unless explicitly requested
          if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
            // Just get the size without recursion details
            const subSize = getQuickDirSize(entryPath);
            totalSize += subSize;
            children.push({
              path: entryPath,
              name: entry.name,
              size: subSize,
              isDirectory: true
            });
          } else {
            const subInfo = getDirSize(entryPath);
            totalSize += subInfo.size;
            children.push(subInfo);
          }
        }
      } catch {
        // Skip inaccessible entries
      }
    }
  } catch {
    // Return empty if can't read directory
  }

  // Sort children by size (largest first)
  children.sort((a, b) => b.size - a.size);

  return {
    path: dirPath,
    name: basename(dirPath),
    size: totalSize,
    isDirectory: true,
    children
  };
}

function getQuickDirSize(dirPath: string): number {
  let totalSize = 0;

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(dirPath, entry.name);

      try {
        if (entry.isFile()) {
          totalSize += statSync(entryPath).size;
        } else if (entry.isDirectory()) {
          totalSize += getQuickDirSize(entryPath);
        }
      } catch {
        // Skip inaccessible
      }
    }
  } catch {
    // Return 0 if can't read
  }

  return totalSize;
}

export function findLargestFiles(dirPath: string, count: number = 10): SizeInfo[] {
  const allFiles: SizeInfo[] = [];

  function collectFiles(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = join(dir, entry.name);

        try {
          if (entry.isFile()) {
            const stats = statSync(entryPath);
            allFiles.push({
              path: entryPath,
              name: entry.name,
              size: stats.size,
              isDirectory: false
            });
          } else if (entry.isDirectory()) {
            // Skip common large directories
            if (!['node_modules', '.git'].includes(entry.name)) {
              collectFiles(entryPath);
            }
          }
        } catch {
          // Skip
        }
      }
    } catch {
      // Skip
    }
  }

  collectFiles(dirPath);
  allFiles.sort((a, b) => b.size - a.size);

  return allFiles.slice(0, count);
}
