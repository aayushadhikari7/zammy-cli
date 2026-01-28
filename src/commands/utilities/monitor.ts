import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import {
  getMonitorSnapshot,
  createProgressBar,
  getColorForPercent,
  formatMemory,
  formatLoadAvg,
  resetCpuTracking,
} from '../../handlers/utilities/monitor.js';
import chalk from 'chalk';

function clearLines(count: number): void {
  for (let i = 0; i < count; i++) {
    process.stdout.write('\x1b[1A\x1b[2K');
  }
}

function colorBar(percent: number, width: number = 20): string {
  const color = getColorForPercent(percent);
  const bar = createProgressBar(percent, width);

  switch (color) {
    case 'green': return chalk.green(bar);
    case 'yellow': return chalk.yellow(bar);
    case 'red': return chalk.red(bar);
  }
}

function renderDashboard(): number {
  const snapshot = getMonitorSnapshot();
  const mem = formatMemory(snapshot);
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.cyan.bold('  ╔══════════════════════════════════════════╗'));
  lines.push(chalk.cyan.bold('  ║') + chalk.white.bold('         System Monitor                  ') + chalk.cyan.bold('║'));
  lines.push(chalk.cyan.bold('  ╠══════════════════════════════════════════╣'));

  // CPU
  const cpuPercent = snapshot.cpu.usage;
  lines.push(chalk.cyan.bold('  ║') + `  ${theme.primary('CPU')}    ${colorBar(cpuPercent)} ${cpuPercent.toFixed(1).padStart(5)}%  ` + chalk.cyan.bold('║'));

  // Memory
  lines.push(chalk.cyan.bold('  ║') + `  ${theme.primary('Memory')} ${colorBar(snapshot.memory.percent)} ${mem.percent.padStart(6)}  ` + chalk.cyan.bold('║'));
  lines.push(chalk.cyan.bold('  ║') + chalk.dim(`         ${mem.used} / ${mem.total}`.padEnd(40)) + chalk.cyan.bold('║'));

  // Load Average (Unix only)
  if (process.platform !== 'win32') {
    lines.push(chalk.cyan.bold('  ║') + `  ${theme.primary('Load')}   ${theme.dim(formatLoadAvg(snapshot.load))}`.padEnd(48) + chalk.cyan.bold('║'));
  }

  // System info
  lines.push(chalk.cyan.bold('  ╠══════════════════════════════════════════╣'));
  lines.push(chalk.cyan.bold('  ║') + chalk.dim(`  CPU: ${snapshot.cpu.model.slice(0, 36)}`.padEnd(42)) + chalk.cyan.bold('║'));
  lines.push(chalk.cyan.bold('  ║') + chalk.dim(`  Cores: ${snapshot.cpu.cores}`.padEnd(42)) + chalk.cyan.bold('║'));
  lines.push(chalk.cyan.bold('  ╚══════════════════════════════════════════╝'));
  lines.push(chalk.dim('  Press Ctrl+C to stop'));
  lines.push('');

  for (const line of lines) {
    console.log(line);
  }

  return lines.length;
}

registerCommand({
  name: 'monitor',
  description: 'Live system resource monitor',
  usage: '/monitor [--interval <ms>] [--once]',
  async execute(args: string[]) {
    // Parse args
    let interval = 1000;
    let once = false;

    for (let i = 0; i < args.length; i++) {
      if ((args[i] === '--interval' || args[i] === '-i') && args[i + 1]) {
        interval = parseInt(args[i + 1], 10);
        if (isNaN(interval) || interval < 100) interval = 1000;
        i++;
      }
      if (args[i] === '--once' || args[i] === '-1') {
        once = true;
      }
      if (args[i] === '--help' || args[i] === '-h') {
        showHelp();
        return;
      }
    }

    // Reset CPU tracking for accurate first reading
    resetCpuTracking();

    if (once) {
      // Wait a moment for CPU measurement
      await new Promise(r => setTimeout(r, 100));
      renderDashboard();
      return;
    }

    // Live mode
    console.log(theme.dim('  Starting monitor...'));
    await new Promise(r => setTimeout(r, 500));

    let lineCount = 0;
    let running = true;

    const handleExit = () => {
      running = false;
    };

    process.on('SIGINT', handleExit);

    try {
      while (running) {
        if (lineCount > 0) {
          clearLines(lineCount);
        }
        lineCount = renderDashboard();
        await new Promise(r => setTimeout(r, interval));
      }
    } finally {
      process.removeListener('SIGINT', handleExit);
    }

    console.log('');
    console.log(theme.dim('  Monitor stopped.'));
  },
});

function showHelp(): void {
  console.log('');
  console.log(theme.secondary('Usage:'));
  console.log(`  ${theme.primary('/monitor')}              ${theme.dim('Live system monitor (1s refresh)')}`);
  console.log(`  ${theme.primary('/monitor --once')}       ${theme.dim('Show stats once and exit')}`);
  console.log(`  ${theme.primary('/monitor -i 2000')}      ${theme.dim('Set refresh interval (ms)')}`);
  console.log('');
  console.log(theme.secondary('Options:'));
  console.log(`  ${theme.dim('--interval, -i')}   Refresh interval in milliseconds (default: 1000)`);
  console.log(`  ${theme.dim('--once, -1')}       Show stats once and exit`);
  console.log('');
  console.log(theme.secondary('Display:'));
  console.log(`  ${chalk.green('█')} ${theme.dim('< 60%')}    ${chalk.yellow('█')} ${theme.dim('60-85%')}    ${chalk.red('█')} ${theme.dim('> 85%')}`);
  console.log('');
}
