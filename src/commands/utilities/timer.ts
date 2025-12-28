import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';

let timerInterval: NodeJS.Timeout | null = null;
let startTime: number = 0;
let pausedAt: number = 0;
let isRunning = false;

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((ms % 1000) / 10);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}

registerCommand({
  name: 'timer',
  description: 'Stopwatch timer',
  usage: '/timer [start|stop|pause|reset|lap]',
  async execute(args: string[]) {
    const action = args[0]?.toLowerCase() || 'status';

    if (action === 'start') {
      if (isRunning) {
        console.log(theme.dim('  Timer is already running'));
        return;
      }

      if (pausedAt > 0) {
        // Resume from pause
        startTime = Date.now() - pausedAt;
        pausedAt = 0;
      } else {
        startTime = Date.now();
      }
      isRunning = true;

      console.log('');
      console.log(`  ${symbols.sparkle} ${theme.gradient('TIMER STARTED')} ${symbols.sparkle}`);
      console.log('');
      console.log(theme.dim('  Use /timer lap to see current time'));
      console.log(theme.dim('  Use /timer pause to pause'));
      console.log(theme.dim('  Use /timer stop to stop'));
      console.log('');
      return;
    }

    if (action === 'stop') {
      if (!isRunning && pausedAt === 0) {
        console.log(theme.dim('  Timer is not running'));
        return;
      }

      const elapsed = isRunning ? Date.now() - startTime : pausedAt;
      isRunning = false;
      pausedAt = 0;

      console.log('');
      console.log(`  ${symbols.clock} ${theme.gradient('TIMER STOPPED')} ${symbols.clock}`);
      console.log('');
      console.log(`  ${theme.dim('Final time:')} ${theme.primary(formatTime(elapsed))}`);
      console.log('');
      return;
    }

    if (action === 'pause') {
      if (!isRunning) {
        console.log(theme.dim('  Timer is not running'));
        return;
      }

      pausedAt = Date.now() - startTime;
      isRunning = false;

      console.log('');
      console.log(`  ${symbols.clock} ${theme.secondary('TIMER PAUSED')}`);
      console.log(`  ${theme.dim('Time:')} ${theme.primary(formatTime(pausedAt))}`);
      console.log(theme.dim('  Use /timer start to resume'));
      console.log('');
      return;
    }

    if (action === 'reset') {
      isRunning = false;
      startTime = 0;
      pausedAt = 0;

      console.log('');
      console.log(`  ${symbols.check} ${theme.success('Timer reset')}`);
      console.log('');
      return;
    }

    if (action === 'lap' || action === 'status') {
      if (!isRunning && pausedAt === 0) {
        console.log('');
        console.log(`  ${symbols.clock} ${theme.gradient('STOPWATCH')} ${symbols.clock}`);
        console.log('');
        console.log(theme.dim('  Timer is not running'));
        console.log(theme.dim('  Use /timer start to begin'));
        console.log('');
        return;
      }

      const elapsed = isRunning ? Date.now() - startTime : pausedAt;

      console.log('');
      console.log(`  ${symbols.clock} ${theme.gradient('STOPWATCH')} ${symbols.clock}`);
      console.log('');
      console.log(`  ${theme.primary(formatTime(elapsed))} ${isRunning ? theme.success('●') : theme.secondary('❚❚')}`);
      console.log('');
      return;
    }

    console.log('');
    console.log(theme.error('Unknown action. Use: start, stop, pause, reset, lap'));
    console.log('');
  },
});
