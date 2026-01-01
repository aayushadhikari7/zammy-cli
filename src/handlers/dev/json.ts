import { readFileSync, existsSync } from 'fs';

export interface JsonResult {
  valid: boolean;
  data?: unknown;
  error?: string;
  formatted?: string;
}

export function validateJson(input: string): JsonResult {
  try {
    const data = JSON.parse(input);
    return { valid: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return { valid: false, error: message };
  }
}

export function formatJson(input: string, indent: number = 2): JsonResult {
  try {
    const data = JSON.parse(input);
    const formatted = JSON.stringify(data, null, indent);
    return { valid: true, data, formatted };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return { valid: false, error: message };
  }
}

export function minifyJson(input: string): JsonResult {
  try {
    const data = JSON.parse(input);
    const formatted = JSON.stringify(data);
    return { valid: true, data, formatted };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return { valid: false, error: message };
  }
}

export function queryJson(input: string, path: string): JsonResult {
  try {
    const data = JSON.parse(input);
    const parts = path.replace(/^\$\.?/, '').split('.').filter(Boolean);

    let current: unknown = data;
    for (const part of parts) {
      // Handle array notation like [0] or items[0]
      const arrayMatch = part.match(/^(\w*)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        if (key) {
          current = (current as Record<string, unknown>)[key];
        }
        if (Array.isArray(current)) {
          current = current[parseInt(index)];
        } else {
          return { valid: false, error: `Not an array at ${part}` };
        }
      } else {
        if (current && typeof current === 'object') {
          current = (current as Record<string, unknown>)[part];
        } else {
          return { valid: false, error: `Cannot access ${part}` };
        }
      }
    }

    return { valid: true, data: current, formatted: JSON.stringify(current, null, 2) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return { valid: false, error: message };
  }
}

export function readJsonFile(filePath: string): JsonResult {
  if (!existsSync(filePath)) {
    return { valid: false, error: `File not found: ${filePath}` };
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return formatJson(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read file';
    return { valid: false, error: message };
  }
}

export function getJsonStats(input: string): { keys: number; depth: number; size: string } | null {
  try {
    const data = JSON.parse(input);

    function countKeys(obj: unknown, depth = 0): { keys: number; maxDepth: number } {
      if (typeof obj !== 'object' || obj === null) {
        return { keys: 0, maxDepth: depth };
      }

      let keys = 0;
      let maxDepth = depth;

      if (Array.isArray(obj)) {
        for (const item of obj) {
          const result = countKeys(item, depth + 1);
          keys += result.keys;
          maxDepth = Math.max(maxDepth, result.maxDepth);
        }
      } else {
        keys = Object.keys(obj).length;
        for (const value of Object.values(obj)) {
          const result = countKeys(value, depth + 1);
          keys += result.keys;
          maxDepth = Math.max(maxDepth, result.maxDepth);
        }
      }

      return { keys, maxDepth };
    }

    const stats = countKeys(data);
    const size = new Blob([input]).size;
    const sizeStr = size < 1024 ? `${size}B` :
                    size < 1024 * 1024 ? `${(size / 1024).toFixed(1)}KB` :
                    `${(size / 1024 / 1024).toFixed(1)}MB`;

    return { keys: stats.keys, depth: stats.maxDepth, size: sizeStr };
  } catch {
    return null;
  }
}
