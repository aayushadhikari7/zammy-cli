import { registerCommand } from '../registry.js';
import { theme, symbols, box } from '../../ui/colors.js';
import { getSystemStats } from '../../handlers/utilities/stats.js';

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
    const stats = getSystemStats();

    console.log('');
    console.log(box.draw([
      '',
      `  ${symbols.chart} ${theme.secondary('System Statistics')}`,
      '',
      `  ${theme.dim('User:')}      ${theme.primary(stats.user.username)}@${theme.primary(stats.user.hostname)}`,
      `  ${theme.dim('Platform:')}  ${theme.primary(stats.platform.os)} ${stats.platform.arch}`,
      `  ${theme.dim('CPU:')}       ${theme.primary(stats.cpu.model)}`,
      `  ${theme.dim('Cores:')}     ${theme.primary(stats.cpu.cores.toString())}`,
      '',
      `  ${theme.dim('Memory:')}    ${createBar(stats.memory.percent)} ${stats.memory.percent.toFixed(1)}%`,
      `              ${theme.dim(`${stats.memory.usedFormatted} / ${stats.memory.totalFormatted}`)}`,
      '',
      `  ${theme.dim('Uptime:')}    ${theme.primary(stats.uptime.formatted)}`,
      `  ${theme.dim('Node.js:')}   ${theme.primary(stats.node.version)}`,
      `  ${theme.dim('CWD:')}       ${theme.dim(stats.cwd)}`,
      '',
    ], 65));
    console.log('');
  },
});
