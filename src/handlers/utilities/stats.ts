import { cpus, totalmem, freemem, uptime, platform, arch, hostname, userInfo } from 'os';

export interface SystemStats {
  user: {
    username: string;
    hostname: string;
  };
  platform: {
    os: string;
    arch: string;
  };
  cpu: {
    model: string;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percent: number;
    totalFormatted: string;
    usedFormatted: string;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
  node: {
    version: string;
  };
  cwd: string;
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '< 1m';
}

export function getSystemStats(): SystemStats {
  const cpu = cpus()[0];
  const totalMem = totalmem();
  const freeMem = freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = (usedMem / totalMem) * 100;
  const uptimeSecs = uptime();
  const user = userInfo();

  return {
    user: {
      username: user.username,
      hostname: hostname(),
    },
    platform: {
      os: platform(),
      arch: arch(),
    },
    cpu: {
      model: cpu.model,
      cores: cpus().length,
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percent: memPercent,
      totalFormatted: formatBytes(totalMem),
      usedFormatted: formatBytes(usedMem),
    },
    uptime: {
      seconds: uptimeSecs,
      formatted: formatUptime(uptimeSecs),
    },
    node: {
      version: process.version,
    },
    cwd: process.cwd(),
  };
}
