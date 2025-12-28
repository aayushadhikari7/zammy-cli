import { registerCommand } from '../registry.js';
import { theme, symbols, box } from '../../ui/colors.js';
import { cpus, totalmem, freemem, uptime, platform, arch, hostname, userInfo } from 'os';

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '< 1m';
}

function createBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  let color = theme.success;
  if (percent > 70) color = theme.warning;
  if (percent > 90) color = theme.error;

  return color('█'.repeat(filled)) + theme.dim('░'.repeat(width - filled));
}

registerCommand({
  name: 'stats',
  description: 'Show system statistics',
  usage: '/stats',
  async execute(_args: string[]) {
    const cpu = cpus()[0];
    const totalMem = totalmem();
    const usedMem = totalMem - freemem();
    const memPercent = (usedMem / totalMem) * 100;
    const uptimeSecs = uptime();
    const user = userInfo();

    console.log('');
    console.log(box.draw([
      '',
      `  ${symbols.chart} ${theme.secondary('System Statistics')}`,
      '',
      `  ${theme.dim('User:')}      ${theme.primary(user.username)}@${theme.primary(hostname())}`,
      `  ${theme.dim('Platform:')}  ${theme.primary(platform())} ${arch()}`,
      `  ${theme.dim('CPU:')}       ${theme.primary(cpu.model)}`,
      `  ${theme.dim('Cores:')}     ${theme.primary(cpus().length.toString())}`,
      '',
      `  ${theme.dim('Memory:')}    ${createBar(memPercent)} ${memPercent.toFixed(1)}%`,
      `              ${theme.dim(`${formatBytes(usedMem)} / ${formatBytes(totalMem)}`)}`,
      '',
      `  ${theme.dim('Uptime:')}    ${theme.primary(formatUptime(uptimeSecs))}`,
      `  ${theme.dim('Node.js:')}   ${theme.primary(process.version)}`,
      `  ${theme.dim('CWD:')}       ${theme.dim(process.cwd())}`,
      '',
    ], 65));
    console.log('');
  },
});
