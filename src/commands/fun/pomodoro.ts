import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';

interface PomodoroState {
  running: boolean;
  mode: 'work' | 'break' | 'longbreak';
  endTime: number;
  sessions: number;
  interval: NodeJS.Timeout | null;
}

const state: PomodoroState = {
  running: false,
  mode: 'work',
  endTime: 0,
  sessions: 0,
  interval: null,
};

const DURATIONS = {
  work: 25 * 60 * 1000,
  break: 5 * 60 * 1000,
  longbreak: 15 * 60 * 1000,
};

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getModeEmoji(mode: string): string {
  switch (mode) {
    case 'work': return symbols.fire;
    case 'break': return symbols.coffee;
    case 'longbreak': return symbols.sparkle;
    default: return symbols.clock;
  }
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case 'work': return 'FOCUS TIME';
    case 'break': return 'SHORT BREAK';
    case 'longbreak': return 'LONG BREAK';
    default: return mode;
  }
}

registerCommand({
  name: 'pomodoro',
  description: 'Pomodoro timer (25/5 technique)',
  usage: '/pomodoro [start|stop|status|skip]',
  async execute(args: string[]) {
    const action = args[0]?.toLowerCase() || 'status';

    if (action === 'start') {
      if (state.running) {
        console.log(theme.dim('  Pomodoro is already running'));
        console.log(theme.dim('  Use /pomodoro status to see remaining time'));
        return;
      }

      state.running = true;
      state.mode = 'work';
      state.endTime = Date.now() + DURATIONS.work;

      console.log('');
      console.log(`  ${symbols.tomato} ${theme.gradient('POMODORO STARTED')} ${symbols.tomato}`);
      console.log('');
      console.log(`  ${theme.primary('Focus time!')} 25 minutes of deep work.`);
      console.log(theme.dim('  Use /pomodoro status to check progress'));
      console.log(theme.dim('  Use /pomodoro skip to skip to break'));
      console.log('');

      // Set up notification
      if (state.interval) {
        clearTimeout(state.interval);
        state.interval = null;
      }
      state.interval = setTimeout(() => {
        if (state.running) {
          console.log('\n');
          console.log(`  ${symbols.bell} ${theme.success('POMODORO COMPLETE!')} ${symbols.bell}`);
          console.log('  Time for a break! Use /pomodoro start for next session');
          console.log('\n');
          state.sessions++;
          state.running = false;
          state.interval = null;
        }
      }, DURATIONS.work);

      return;
    }

    if (action === 'stop') {
      if (!state.running) {
        console.log(theme.dim('  Pomodoro is not running'));
        return;
      }

      if (state.interval) {
        clearTimeout(state.interval);
        state.interval = null;
      }
      state.running = false;

      console.log('');
      console.log(`  ${symbols.cross} ${theme.secondary('Pomodoro stopped')}`);
      console.log(`  ${theme.dim('Sessions completed today:')} ${theme.primary(state.sessions.toString())}`);
      console.log('');
      return;
    }

    if (action === 'skip') {
      if (!state.running) {
        console.log(theme.dim('  Pomodoro is not running'));
        return;
      }

      if (state.interval) {
        clearTimeout(state.interval);
        state.interval = null;
      }

      if (state.mode === 'work') {
        state.sessions++;
        state.mode = state.sessions % 4 === 0 ? 'longbreak' : 'break';
        state.endTime = Date.now() + DURATIONS[state.mode];

        console.log('');
        console.log(`  ${getModeEmoji(state.mode)} ${theme.secondary(getModeLabel(state.mode))}`);
        console.log(`  ${theme.dim('Time:')} ${formatRemaining(DURATIONS[state.mode])}`);
        console.log('');
      } else {
        state.mode = 'work';
        state.endTime = Date.now() + DURATIONS.work;

        console.log('');
        console.log(`  ${symbols.fire} ${theme.primary('Back to work!')}`);
        console.log(`  ${theme.dim('Focus time:')} 25:00`);
        console.log('');
      }

      state.interval = setTimeout(() => {
        if (state.running) {
          console.log(`\n  ${symbols.bell} ${state.mode === 'work' ? 'Focus session' : 'Break'} complete!\n`);
          state.running = false;
          state.interval = null;
        }
      }, state.endTime - Date.now());

      return;
    }

    if (action === 'status' || !action) {
      console.log('');
      console.log(`  ${symbols.tomato} ${theme.gradient('POMODORO TIMER')} ${symbols.tomato}`);
      console.log('');

      if (!state.running) {
        console.log(theme.dim('  Not running. Use /pomodoro start'));
        console.log(`  ${theme.dim('Sessions today:')} ${theme.primary(state.sessions.toString())}`);
      } else {
        const remaining = state.endTime - Date.now();
        const progress = 1 - (remaining / DURATIONS[state.mode]);
        const barWidth = 30;
        const filled = Math.round(progress * barWidth);
        const bar = theme.primary('█'.repeat(filled)) + theme.dim('░'.repeat(barWidth - filled));

        console.log(`  ${getModeEmoji(state.mode)} ${theme.secondary(getModeLabel(state.mode))}`);
        console.log('');
        console.log(`  ${bar} ${formatRemaining(remaining)}`);
        console.log('');
        console.log(`  ${theme.dim('Sessions:')} ${theme.primary(state.sessions.toString())} ${theme.dim('| Next:')} ${state.mode === 'work' ? 'break' : 'focus'}`);
      }

      console.log('');
      return;
    }

    console.log(theme.error('Unknown action. Use: start, stop, status, skip'));
  },
});
