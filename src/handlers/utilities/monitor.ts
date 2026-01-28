import { cpus, totalmem, freemem, loadavg } from 'os';
import { formatBytes } from './stats.js';

export interface MonitorSnapshot {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  load: number[];
}

// Track previous CPU times for accurate usage calculation
let previousCpuTimes: { idle: number; total: number }[] = [];

function getCpuTimes(): { idle: number; total: number }[] {
  return cpus().map(cpu => {
    const times = cpu.times;
    const idle = times.idle;
    const total = times.user + times.nice + times.sys + times.idle + times.irq;
    return { idle, total };
  });
}

export function getCpuUsage(): number {
  const currentTimes = getCpuTimes();

  if (previousCpuTimes.length === 0) {
    previousCpuTimes = currentTimes;
    return 0;
  }

  let totalUsage = 0;
  for (let i = 0; i < currentTimes.length; i++) {
    const prev = previousCpuTimes[i];
    const curr = currentTimes[i];

    const idleDiff = curr.idle - prev.idle;
    const totalDiff = curr.total - prev.total;

    if (totalDiff > 0) {
      totalUsage += (1 - idleDiff / totalDiff) * 100;
    }
  }

  previousCpuTimes = currentTimes;
  return totalUsage / currentTimes.length;
}

export function getMonitorSnapshot(): MonitorSnapshot {
  const cpu = cpus()[0];
  const totalMem = totalmem();
  const freeMem = freemem();
  const usedMem = totalMem - freeMem;

  return {
    timestamp: Date.now(),
    cpu: {
      usage: getCpuUsage(),
      cores: cpus().length,
      model: cpu.model,
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percent: (usedMem / totalMem) * 100,
    },
    load: loadavg(),
  };
}

export function createProgressBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return bar;
}

export function getColorForPercent(percent: number): 'green' | 'yellow' | 'red' {
  if (percent < 60) return 'green';
  if (percent < 85) return 'yellow';
  return 'red';
}

export function formatMemory(snapshot: MonitorSnapshot): {
  used: string;
  total: string;
  percent: string;
} {
  return {
    used: formatBytes(snapshot.memory.used),
    total: formatBytes(snapshot.memory.total),
    percent: snapshot.memory.percent.toFixed(1) + '%',
  };
}

export function formatLoadAvg(load: number[]): string {
  return load.map(l => l.toFixed(2)).join(' ');
}

// Reset CPU tracking (useful for tests)
export function resetCpuTracking(): void {
  previousCpuTimes = [];
}
