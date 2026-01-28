import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseEnvFile, compareEnvFiles } from './envfile.js';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('envfile handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseEnvFile', () => {
    it('parses simple key=value pairs', () => {
      const content = 'FOO=bar\nBAZ=qux';
      const entries = parseEnvFile(content);

      expect(entries).toHaveLength(2);
      expect(entries[0].key).toBe('FOO');
      expect(entries[0].value).toBe('bar');
      expect(entries[1].key).toBe('BAZ');
      expect(entries[1].value).toBe('qux');
    });

    it('handles quoted values', () => {
      const content = 'FOO="hello world"\nBAR=\'single quotes\'';
      const entries = parseEnvFile(content);

      expect(entries[0].value).toBe('hello world');
      expect(entries[1].value).toBe('single quotes');
    });

    it('skips comments', () => {
      const content = '# This is a comment\nFOO=bar\n# Another comment';
      const entries = parseEnvFile(content);

      expect(entries).toHaveLength(1);
      expect(entries[0].key).toBe('FOO');
    });

    it('skips empty lines', () => {
      const content = 'FOO=bar\n\n\nBAZ=qux';
      const entries = parseEnvFile(content);

      expect(entries).toHaveLength(2);
    });

    it('handles values with equals signs', () => {
      const content = 'URL=https://example.com?foo=bar&baz=qux';
      const entries = parseEnvFile(content);

      expect(entries[0].value).toBe('https://example.com?foo=bar&baz=qux');
    });

    it('trims whitespace', () => {
      const content = '  FOO  =  bar  ';
      const entries = parseEnvFile(content);

      expect(entries[0].key).toBe('FOO');
      expect(entries[0].value).toBe('bar');
    });

    it('records line numbers', () => {
      const content = '# Comment\nFOO=bar\n\nBAZ=qux';
      const entries = parseEnvFile(content);

      expect(entries[0].line).toBe(2);
      expect(entries[1].line).toBe(4);
    });

    it('handles empty values', () => {
      const content = 'FOO=\nBAR=""';
      const entries = parseEnvFile(content);

      expect(entries[0].value).toBe('');
      expect(entries[1].value).toBe('');
    });

    it('handles complex values', () => {
      const content = 'DATABASE_URL="postgres://user:pass@localhost:5432/db"';
      const entries = parseEnvFile(content);

      expect(entries[0].value).toBe('postgres://user:pass@localhost:5432/db');
    });
  });

  describe('compareEnvFiles', () => {
    it('identifies missing keys', async () => {
      const { existsSync, readFileSync } = await import('fs');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation((path: any) => {
        if (path.toString().includes('.env.example')) {
          return 'FOO=\nBAR=\nBAZ=';
        }
        return 'FOO=value\nBAR=value';
      });

      const diffs = compareEnvFiles('/test');

      const missing = diffs.filter(d => !d.inEnv && d.inExample);
      expect(missing).toHaveLength(1);
      expect(missing[0].key).toBe('BAZ');
    });

    it('identifies extra keys', async () => {
      const { existsSync, readFileSync } = await import('fs');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation((path: any) => {
        if (path.toString().includes('.env.example')) {
          return 'FOO=';
        }
        return 'FOO=value\nEXTRA=value';
      });

      const diffs = compareEnvFiles('/test');

      const extra = diffs.filter(d => d.inEnv && !d.inExample);
      expect(extra).toHaveLength(1);
      expect(extra[0].key).toBe('EXTRA');
    });

    it('shows all keys as synced when files match', async () => {
      const { existsSync, readFileSync } = await import('fs');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation(() => 'FOO=bar\nBAZ=qux');

      const diffs = compareEnvFiles('/test');

      expect(diffs.every(d => d.inEnv && d.inExample)).toBe(true);
    });
  });
});
