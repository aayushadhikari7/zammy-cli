import { registerCommand } from './registry.js';
import { theme, symbols, spinnerFrames } from '../ui/colors.js';

function parseTime(input: string): number | null {
  // Parse formats like: 30, 30s, 5m, 1h, 1m30s
  const match = input.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
  if (!match) {
    // Try just a number (seconds)
    const num = parseInt(input);
    return isNaN(num) ? null : num;
  }

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

registerCommand({
  name: 'countdown',
  description: 'Start a countdown timer',
  usage: '/countdown <time> (e.g., 30s, 5m, 1h30m)',
  async execute(args: string[]) {
    if (args.length === 0) {
      console.log(theme.error('Usage: /countdown <time>'));
      console.log(theme.dim('Examples: /countdown 30, /countdown 5m, /countdown 1h30m'));
      return;
    }

    const totalSeconds = parseTime(args.join(''));
    if (totalSeconds === null || totalSeconds <= 0) {
      console.log(theme.error('Invalid time format'));
      return;
    }

    console.log('');
    console.log(`  ${symbols.clock} ${theme.secondary('Countdown started!')} ${theme.dim('(Press Ctrl+C to cancel)')}`);
    console.log('');

    let remaining = totalSeconds;
    let spinnerIndex = 0;

    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        // Clear the line and update
        process.stdout.write('\r\x1B[K');

        if (remaining <= 0) {
          clearInterval(interval);
          console.log(`  ${symbols.sparkle} ${theme.success('TIME\'S UP!')} ${symbols.sparkle}`);
          console.log('');
          // Beep!
          process.stdout.write('\x07');
          resolve();
          return;
        }

        const spinner = spinnerFrames[spinnerIndex % spinnerFrames.length];
        const timeDisplay = formatTime(remaining);

        // Color changes as time runs low
        let color = theme.primary;
        if (remaining <= 10) color = theme.error;
        else if (remaining <= 30) color = theme.warning;

        process.stdout.write(`  ${theme.secondary(spinner)} ${color(timeDisplay)} remaining...`);

        remaining--;
        spinnerIndex++;
      }, 1000);

      // Initial display
      process.stdout.write(`  ${theme.secondary(spinnerFrames[0])} ${theme.primary(formatTime(remaining))} remaining...`);
    });
  },
});
