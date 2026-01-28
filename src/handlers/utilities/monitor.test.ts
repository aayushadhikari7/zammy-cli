import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMonitorSnapshot,
  createProgressBar,
  getColorForPercent,
  formatMemory,
  formatLoadAvg,
  getCpuUsage,
  resetCpuTracking,
} from './monitor.js';

describe('monitor handler', () => {
  beforeEach(() => {
    resetCpuTracking();
  });

  describe('getMonitorSnapshot', () => {
    it('returns a valid snapshot', () => {
      const snapshot = getMonitorSnapshot();

      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('cpu');
      expect(snapshot).toHaveProperty('memory');
      expect(snapshot).toHaveProperty('load');

      expect(typeof snapshot.timestamp).toBe('number');
      expect(snapshot.cpu.cores).toBeGreaterThan(0);
      expect(snapshot.memory.total).toBeGreaterThan(0);
    });

    it('returns valid memory values', () => {
      const snapshot = getMonitorSnapshot();

      expect(snapshot.memory.used).toBeGreaterThan(0);
      expect(snapshot.memory.free).toBeGreaterThanOrEqual(0);
      expect(snapshot.memory.total).toBe(snapshot.memory.used + snapshot.memory.free);
      expect(snapshot.memory.percent).toBeGreaterThanOrEqual(0);
      expect(snapshot.memory.percent).toBeLessThanOrEqual(100);
    });

    it('returns load average array', () => {
      const snapshot = getMonitorSnapshot();
      expect(Array.isArray(snapshot.load)).toBe(true);
      expect(snapshot.load.length).toBe(3);
    });
  });

  describe('getCpuUsage', () => {
    it('returns 0 on first call', () => {
      const usage = getCpuUsage();
      expect(usage).toBe(0);
    });

    it('returns a number between 0 and 100 on subsequent calls', () => {
      getCpuUsage(); // First call
      const usage = getCpuUsage();
      expect(usage).toBeGreaterThanOrEqual(0);
      expect(usage).toBeLessThanOrEqual(100);
    });
  });

  describe('createProgressBar', () => {
    it('creates a bar of specified width', () => {
      const bar = createProgressBar(50, 10);
      expect(bar.length).toBe(10);
    });

    it('shows 0% as all empty', () => {
      const bar = createProgressBar(0, 10);
      expect(bar).toBe('░░░░░░░░░░');
    });

    it('shows 100% as all filled', () => {
      const bar = createProgressBar(100, 10);
      expect(bar).toBe('██████████');
    });

    it('shows 50% as half filled', () => {
      const bar = createProgressBar(50, 10);
      expect(bar).toBe('█████░░░░░');
    });
  });

  describe('getColorForPercent', () => {
    it('returns green for low values', () => {
      expect(getColorForPercent(30)).toBe('green');
      expect(getColorForPercent(59)).toBe('green');
    });

    it('returns yellow for medium values', () => {
      expect(getColorForPercent(60)).toBe('yellow');
      expect(getColorForPercent(84)).toBe('yellow');
    });

    it('returns red for high values', () => {
      expect(getColorForPercent(85)).toBe('red');
      expect(getColorForPercent(100)).toBe('red');
    });
  });

  describe('formatMemory', () => {
    it('formats memory values', () => {
      const snapshot = getMonitorSnapshot();
      const formatted = formatMemory(snapshot);

      expect(formatted.used).toMatch(/^\d+\.\d+ (B|KB|MB|GB|TB)$/);
      expect(formatted.total).toMatch(/^\d+\.\d+ (B|KB|MB|GB|TB)$/);
      expect(formatted.percent).toMatch(/^\d+\.\d+%$/);
    });
  });

  describe('formatLoadAvg', () => {
    it('formats load average', () => {
      const formatted = formatLoadAvg([1.5, 1.2, 0.8]);
      expect(formatted).toBe('1.50 1.20 0.80');
    });
  });
});
