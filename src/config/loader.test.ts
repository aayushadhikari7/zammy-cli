import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock functions - these need to be set up BEFORE any import
const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();
const mockWriteFileSync = vi.fn();
const mockMkdirSync = vi.fn();

// Mock modules with factory that uses our mock functions
vi.mock('fs', () => ({
  existsSync: (...args: any[]) => mockExistsSync(...args),
  readFileSync: (...args: any[]) => mockReadFileSync(...args),
  writeFileSync: (...args: any[]) => mockWriteFileSync(...args),
  mkdirSync: (...args: any[]) => mockMkdirSync(...args),
}));

vi.mock('os', () => ({
  homedir: () => '/mock/home',
}));

describe('Config Loader', () => {
  beforeEach(async () => {
    // Reset mock implementations and clear call history
    mockExistsSync.mockReset();
    mockReadFileSync.mockReset();
    mockWriteFileSync.mockReset();
    mockMkdirSync.mockReset();
    // Reset modules to clear cached config state
    vi.resetModules();
  });

  describe('loadConfig', () => {
    it('returns default config when no config files exist', async () => {
      // Set up mock BEFORE import
      mockExistsSync.mockReturnValue(false);

      const { loadConfig } = await import('./loader.js');
      const config = loadConfig();

      expect(config.theme).toBe('default');
      expect(config.showBanner).toBe(true);
      expect(config.prompt.symbol).toBe('>');
    });

    it('merges global config with defaults', async () => {
      // Set up mock BEFORE import
      mockExistsSync.mockImplementation((path: string) => {
        // Cross-platform: normalize path for comparison
        const normalizedPath = path.replace(/\\/g, '/');
        return normalizedPath.includes('mock') && normalizedPath.includes('home') && normalizedPath.endsWith('.zammyrc');
      });
      mockReadFileSync.mockReturnValue(JSON.stringify({
        theme: 'minimal',
        showBanner: false,
      }));

      const { loadConfig } = await import('./loader.js');
      const config = loadConfig();

      expect(config.theme).toBe('minimal');
      expect(config.showBanner).toBe(false);
      // Non-overridden values should be defaults
      expect(config.showIdleAnimation).toBe(true);
    });

    it('merges nested config correctly', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        // Cross-platform: normalize path for comparison
        const normalizedPath = path.replace(/\\/g, '/');
        return normalizedPath.includes('mock') && normalizedPath.includes('home') && normalizedPath.endsWith('.zammyrc');
      });
      mockReadFileSync.mockReturnValue(JSON.stringify({
        prompt: {
          symbol: '$',
        },
      }));

      const { loadConfig } = await import('./loader.js');
      const config = loadConfig();

      expect(config.prompt.symbol).toBe('$');
      // Other prompt values should be defaults
      expect(config.prompt.showTime).toBe(false);
      expect(config.prompt.showDirectory).toBe(true);
    });

    it('project config overrides global config', async () => {
      const cwd = process.cwd();
      const globalPath = '/mock/home/.zammyrc';
      const projectPath = `${cwd}\\.zammyrc`; // Windows path
      const projectPathUnix = `${cwd}/.zammyrc`; // Unix path

      mockExistsSync.mockImplementation((path: string) => {
        const normalizedPath = path.replace(/\\/g, '/');
        return normalizedPath === globalPath.replace(/\\/g, '/') ||
               normalizedPath === projectPathUnix.replace(/\\/g, '/');
      });

      mockReadFileSync.mockImplementation((path: string) => {
        const normalizedPath = (path as string).replace(/\\/g, '/');
        if (normalizedPath === globalPath.replace(/\\/g, '/')) {
          return JSON.stringify({ theme: 'minimal', showBanner: false });
        }
        if (normalizedPath === projectPathUnix.replace(/\\/g, '/')) {
          return JSON.stringify({ theme: 'vibrant' });
        }
        return '{}';
      });

      const { loadConfig } = await import('./loader.js');
      const config = loadConfig();

      expect(config.theme).toBe('vibrant'); // Project override
      expect(config.showBanner).toBe(false); // From global
    });

    it('handles invalid JSON gracefully', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        const normalizedPath = path.replace(/\\/g, '/');
        return normalizedPath.includes('mock') && normalizedPath.includes('home') && normalizedPath.endsWith('.zammyrc');
      });
      mockReadFileSync.mockReturnValue('not valid json {{{');

      const { loadConfig } = await import('./loader.js');
      const config = loadConfig();

      // Should fall back to defaults
      expect(config.theme).toBe('default');
    });

    it('handles empty config file', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        const normalizedPath = path.replace(/\\/g, '/');
        return normalizedPath.includes('mock') && normalizedPath.includes('home') && normalizedPath.endsWith('.zammyrc');
      });
      mockReadFileSync.mockReturnValue('{}');

      const { loadConfig } = await import('./loader.js');
      const config = loadConfig();

      // Should use defaults for all values
      expect(config.theme).toBe('default');
      expect(config.showBanner).toBe(true);
    });
  });

  describe('getConfigValue', () => {
    it('returns default values for unset config', async () => {
      mockExistsSync.mockReturnValue(false);

      const { getConfigValue, resetConfig } = await import('./loader.js');
      resetConfig();

      expect(getConfigValue('theme')).toBe('default');
      expect(getConfigValue('showBanner')).toBe(true);
      expect(getConfigValue('showIdleAnimation')).toBe(true);
      expect(getConfigValue('historySize')).toBe(100);
    });

    it('returns nested values', async () => {
      mockExistsSync.mockReturnValue(false);

      const { getConfigValue, resetConfig } = await import('./loader.js');
      resetConfig();

      expect(getConfigValue('prompt.symbol' as any)).toBe('>');
      expect(getConfigValue('prompt.showDirectory' as any)).toBe(true);
      expect(getConfigValue('prompt.showTime' as any)).toBe(false);
    });

    it('returns undefined for invalid nested key', async () => {
      mockExistsSync.mockReturnValue(false);

      const { getConfigValue, resetConfig } = await import('./loader.js');
      resetConfig();

      expect(getConfigValue('invalid.key' as any)).toBeUndefined();
    });
  });

  describe('setConfigValue', () => {
    it('updates simple config values', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { setConfigValue, getConfigValue, resetConfig } = await import('./loader.js');
      resetConfig();

      setConfigValue('theme', 'vibrant');
      expect(getConfigValue('theme')).toBe('vibrant');

      setConfigValue('showBanner', false);
      expect(getConfigValue('showBanner')).toBe(false);

      setConfigValue('historySize', 200);
      expect(getConfigValue('historySize')).toBe(200);
    });

    it('updates nested config values', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { setConfigValue, getConfigValue, resetConfig } = await import('./loader.js');
      resetConfig();

      setConfigValue('prompt.symbol' as any, '$');
      expect(getConfigValue('prompt.symbol' as any)).toBe('$');

      setConfigValue('prompt.showTime' as any, true);
      expect(getConfigValue('prompt.showTime' as any)).toBe(true);
    });

    it('persists to file when setting value', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { setConfigValue, resetConfig } = await import('./loader.js');
      resetConfig();

      setConfigValue('theme', 'minimal');

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenContent = JSON.parse(mockWriteFileSync.mock.calls[0][1]);
      expect(writtenContent.theme).toBe('minimal');
    });

    it('updates array values', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { setConfigValue, getConfigValue, resetConfig } = await import('./loader.js');
      resetConfig();

      setConfigValue('autoLoadPlugins', ['plugin1', 'plugin2']);
      expect(getConfigValue('autoLoadPlugins')).toEqual(['plugin1', 'plugin2']);
    });
  });

  describe('resetConfig', () => {
    it('resets all values to defaults', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { setConfigValue, resetConfig, getConfigValue } = await import('./loader.js');
      resetConfig();

      // Modify multiple values
      setConfigValue('theme', 'vibrant');
      setConfigValue('showBanner', false);
      setConfigValue('prompt.symbol' as any, '$');

      // Verify changes
      expect(getConfigValue('theme')).toBe('vibrant');
      expect(getConfigValue('showBanner')).toBe(false);
      expect(getConfigValue('prompt.symbol' as any)).toBe('$');

      // Reset
      resetConfig();

      // Verify defaults
      expect(getConfigValue('theme')).toBe('default');
      expect(getConfigValue('showBanner')).toBe(true);
      expect(getConfigValue('prompt.symbol' as any)).toBe('>');
    });
  });

  describe('getConfigDiff', () => {
    it('returns empty when config matches defaults', async () => {
      mockExistsSync.mockReturnValue(false);

      const { getConfigDiff, resetConfig } = await import('./loader.js');
      resetConfig();

      const diff = getConfigDiff();
      expect(diff).toEqual([]);
    });

    it('returns changed values', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { setConfigValue, getConfigDiff, resetConfig } = await import('./loader.js');
      resetConfig();

      setConfigValue('theme', 'vibrant');

      const diff = getConfigDiff();
      expect(diff).toContainEqual({
        key: 'theme',
        default: 'default',
        current: 'vibrant',
      });
    });

    it('returns nested changed values', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { setConfigValue, getConfigDiff, resetConfig } = await import('./loader.js');
      resetConfig();

      setConfigValue('prompt.symbol' as any, '>>');

      const diff = getConfigDiff();
      expect(diff).toContainEqual({
        key: 'prompt.symbol',
        default: '>',
        current: '>>',
      });
    });

    it('returns multiple changed values', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { setConfigValue, getConfigDiff, resetConfig } = await import('./loader.js');
      resetConfig();

      setConfigValue('theme', 'vibrant');
      setConfigValue('showBanner', false);

      const diff = getConfigDiff();
      expect(diff.length).toBe(2);
    });
  });

  describe('getConfig', () => {
    it('returns full config object', async () => {
      mockExistsSync.mockReturnValue(false);

      const { getConfig, resetConfig } = await import('./loader.js');
      resetConfig();

      const config = getConfig();

      expect(config).toHaveProperty('theme');
      expect(config).toHaveProperty('showBanner');
      expect(config).toHaveProperty('prompt');
      expect(config).toHaveProperty('historySize');
      expect(config.prompt).toHaveProperty('symbol');
    });

    it('returns modified config after changes', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { getConfig, setConfigValue, resetConfig } = await import('./loader.js');
      resetConfig();

      setConfigValue('theme', 'minimal');

      const config = getConfig();
      expect(config.theme).toBe('minimal');
    });
  });

  describe('configExists', () => {
    it('returns true when global config exists', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        // Cross-platform: normalize path for comparison
        const normalizedPath = path.replace(/\\/g, '/');
        return normalizedPath.includes('mock') && normalizedPath.includes('home') && normalizedPath.endsWith('.zammyrc');
      });

      const { configExists } = await import('./loader.js');

      expect(configExists(true)).toBe(true);
    });

    it('returns false when config does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      const { configExists } = await import('./loader.js');

      expect(configExists(true)).toBe(false);
    });

    it('checks local config path', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        const normalizedPath = path.replace(/\\/g, '/');
        return normalizedPath.endsWith('.zammyrc') && !normalizedPath.includes('mock');
      });

      const { configExists } = await import('./loader.js');

      expect(configExists(false)).toBe(true);
    });
  });

  describe('getConfigPath', () => {
    it('returns global config path', async () => {
      const { getConfigPath } = await import('./loader.js');
      const result = getConfigPath(true);

      // Cross-platform: contains mock/home and .zammyrc
      expect(result).toContain('mock');
      expect(result).toContain('home');
      expect(result).toContain('.zammyrc');
    });

    it('returns local config path', async () => {
      const { getConfigPath } = await import('./loader.js');

      // Should contain .zammyrc and not be in mock home
      const result = getConfigPath(false);
      expect(result).toContain('.zammyrc');
      expect(result).not.toContain('mock');
    });
  });

  describe('saveConfig', () => {
    it('saves config to global path', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { saveConfig, resetConfig } = await import('./loader.js');
      resetConfig();

      saveConfig(true);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const path = mockWriteFileSync.mock.calls[0][0] as string;
      // Cross-platform: contains mock/home and .zammyrc
      expect(path).toContain('mock');
      expect(path).toContain('.zammyrc');
    });

    it('saves config to local path', async () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const { saveConfig, resetConfig } = await import('./loader.js');
      resetConfig();

      saveConfig(false);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const path = mockWriteFileSync.mock.calls[0][0] as string;
      expect(path).toContain('.zammyrc');
      expect(path).not.toContain('mock');
    });
  });
});
