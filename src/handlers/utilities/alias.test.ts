import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'fs';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('os', () => ({
  homedir: vi.fn(() => '/mock/home'),
}));

describe('Alias Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadAliasStore', () => {
    it('returns empty store when file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const { loadAliasStore } = await import('./alias.js');
      const store = loadAliasStore();

      expect(store.version).toBe(2);
      expect(Object.keys(store.aliases)).toHaveLength(0);
    });

    it('loads existing store', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
        version: 2,
        aliases: {
          gs: { name: 'gs', command: 'git status', type: 'shell', createdAt: 123 },
        },
      }));

      const { loadAliasStore } = await import('./alias.js');
      const store = loadAliasStore();

      expect(store.aliases.gs).toBeDefined();
      expect(store.aliases.gs.command).toBe('git status');
    });

    it('migrates old format without version', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
        gs: 'git status',
        gp: 'git push',
      }));
      vi.mocked(writeFileSync).mockImplementation(() => {});

      const { loadAliasStore } = await import('./alias.js');
      const store = loadAliasStore();

      expect(store.version).toBe(2);
      expect(store.aliases.gs.command).toBe('git status');
      expect(store.aliases.gs.type).toBe('shell');
    });
  });

  describe('addAlias', () => {
    it('adds a valid alias', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(writeFileSync).mockImplementation(() => {});

      const { addAlias } = await import('./alias.js');
      const result = addAlias('myalias', 'ls -la', 'shell');

      expect(result.success).toBe(true);
      expect(writeFileSync).toHaveBeenCalled();
    });

    it('rejects invalid alias names', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const { addAlias } = await import('./alias.js');

      expect(addAlias('123invalid', 'command').success).toBe(false);
      expect(addAlias('invalid name', 'command').success).toBe(false);
      expect(addAlias('', 'command').success).toBe(false);
    });

    it('rejects reserved names', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const { addAlias } = await import('./alias.js');

      expect(addAlias('add', 'command').success).toBe(false);
      expect(addAlias('remove', 'command').success).toBe(false);
      expect(addAlias('list', 'command').success).toBe(false);
    });
  });

  describe('removeAlias', () => {
    it('removes existing alias', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
        version: 2,
        aliases: { gs: { name: 'gs', command: 'git status', type: 'shell', createdAt: 123 } },
      }));
      vi.mocked(writeFileSync).mockImplementation(() => {});

      const { removeAlias } = await import('./alias.js');
      const result = removeAlias('gs');

      expect(result.success).toBe(true);
    });

    it('returns error for non-existent alias', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: 2, aliases: {} }));

      const { removeAlias } = await import('./alias.js');
      const result = removeAlias('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('expandAlias', () => {
    it('expands known alias', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
        version: 2,
        aliases: { gs: { name: 'gs', command: 'git status', type: 'shell', createdAt: 123 } },
      }));

      const { expandAlias } = await import('./alias.js');
      const result = expandAlias('gs');

      expect(result.wasExpanded).toBe(true);
      expect(result.expanded).toBe('git status');
    });

    it('preserves arguments when expanding', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
        version: 2,
        aliases: { g: { name: 'g', command: 'git', type: 'shell', createdAt: 123 } },
      }));

      const { expandAlias } = await import('./alias.js');
      const result = expandAlias('g status --short');

      expect(result.wasExpanded).toBe(true);
      expect(result.expanded).toBe('git status --short');
    });

    it('returns input unchanged for unknown alias', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const { expandAlias } = await import('./alias.js');
      const result = expandAlias('unknown command');

      expect(result.wasExpanded).toBe(false);
      expect(result.expanded).toBe('unknown command');
    });
  });

  describe('searchAliases', () => {
    it('searches by name', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
        version: 2,
        aliases: {
          gs: { name: 'gs', command: 'git status', type: 'shell', createdAt: 123 },
          gp: { name: 'gp', command: 'git push', type: 'shell', createdAt: 123 },
        },
      }));

      const { searchAliases } = await import('./alias.js');
      const results = searchAliases('gs');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('gs');
    });

    it('searches by command', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
        version: 2,
        aliases: {
          gs: { name: 'gs', command: 'git status', type: 'shell', createdAt: 123 },
          gp: { name: 'gp', command: 'git push', type: 'shell', createdAt: 123 },
        },
      }));

      const { searchAliases } = await import('./alias.js');
      const results = searchAliases('push');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('gp');
    });
  });
});
