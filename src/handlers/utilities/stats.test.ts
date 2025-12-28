import { describe, it, expect } from 'vitest';
import { getSystemStats, formatBytes, formatUptime } from './stats.js';

describe('stats handler', () => {
  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500.0 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(2048)).toBe('2.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
      expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
    });

    it('should format terabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB');
    });

    it('should handle zero', () => {
      expect(formatBytes(0)).toBe('0.0 B');
    });
  });

  describe('formatUptime', () => {
    it('should format seconds under a minute', () => {
      expect(formatUptime(30)).toBe('< 1m');
    });

    it('should format minutes', () => {
      expect(formatUptime(60)).toBe('1m');
      expect(formatUptime(120)).toBe('2m');
    });

    it('should format hours and minutes', () => {
      expect(formatUptime(3600)).toBe('1h');
      expect(formatUptime(3660)).toBe('1h 1m');
      expect(formatUptime(7320)).toBe('2h 2m');
    });

    it('should format days, hours, and minutes', () => {
      expect(formatUptime(86400)).toBe('1d');
      expect(formatUptime(90000)).toBe('1d 1h');
      expect(formatUptime(90060)).toBe('1d 1h 1m');
    });

    it('should handle zero', () => {
      expect(formatUptime(0)).toBe('< 1m');
    });
  });

  describe('getSystemStats', () => {
    it('should return user info', () => {
      const stats = getSystemStats();
      expect(stats.user.username).toBeDefined();
      expect(stats.user.hostname).toBeDefined();
    });

    it('should return platform info', () => {
      const stats = getSystemStats();
      expect(stats.platform.os).toBeDefined();
      expect(stats.platform.arch).toBeDefined();
    });

    it('should return CPU info', () => {
      const stats = getSystemStats();
      expect(stats.cpu.model).toBeDefined();
      expect(stats.cpu.cores).toBeGreaterThan(0);
    });

    it('should return memory info', () => {
      const stats = getSystemStats();
      expect(stats.memory.total).toBeGreaterThan(0);
      expect(stats.memory.used).toBeGreaterThan(0);
      expect(stats.memory.free).toBeGreaterThanOrEqual(0);
      expect(stats.memory.percent).toBeGreaterThan(0);
      expect(stats.memory.percent).toBeLessThanOrEqual(100);
      expect(stats.memory.totalFormatted).toMatch(/\d+(\.\d+)? (B|KB|MB|GB|TB)/);
      expect(stats.memory.usedFormatted).toMatch(/\d+(\.\d+)? (B|KB|MB|GB|TB)/);
    });

    it('should return uptime info', () => {
      const stats = getSystemStats();
      expect(stats.uptime.seconds).toBeGreaterThan(0);
      expect(stats.uptime.formatted).toBeDefined();
    });

    it('should return node version', () => {
      const stats = getSystemStats();
      expect(stats.node.version).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should return current working directory', () => {
      const stats = getSystemStats();
      expect(stats.cwd).toBeDefined();
      expect(stats.cwd.length).toBeGreaterThan(0);
    });
  });
});
