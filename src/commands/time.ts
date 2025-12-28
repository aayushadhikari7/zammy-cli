import { registerCommand } from './registry.js';
import { theme, symbols } from '../ui/colors.js';

const clockDigits: Record<string, string[]> = {
  '0': ['╭───╮', '│   │', '│   │', '│   │', '╰───╯'],
  '1': ['  ╷  ', '  │  ', '  │  ', '  │  ', '  ╵  '],
  '2': ['╭───╮', '    │', '╭───╯', '│    ', '╰───╯'],
  '3': ['╭───╮', '    │', ' ───┤', '    │', '╰───╯'],
  '4': ['╷   ╷', '│   │', '╰───┤', '    │', '    ╵'],
  '5': ['╭───╮', '│    ', '╰───╮', '    │', '╰───╯'],
  '6': ['╭───╮', '│    ', '├───╮', '│   │', '╰───╯'],
  '7': ['╭───╮', '    │', '    │', '    │', '    ╵'],
  '8': ['╭───╮', '│   │', '├───┤', '│   │', '╰───╯'],
  '9': ['╭───╮', '│   │', '╰───┤', '    │', '╰───╯'],
  ':': ['     ', '  ●  ', '     ', '  ●  ', '     '],
};

function renderTime(time: string): string[] {
  const chars = time.split('');
  const lines: string[] = ['', '', '', '', ''];

  chars.forEach(char => {
    const digit = clockDigits[char] || clockDigits['0'];
    for (let i = 0; i < 5; i++) {
      lines[i] += digit[i] + ' ';
    }
  });

  return lines;
}

registerCommand({
  name: 'time',
  description: 'Show current time',
  usage: '/time [--digital]',
  async execute(args: string[]) {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const timeStr = `${hours}:${minutes}`;
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    console.log('');

    if (args.includes('--digital')) {
      console.log(`  ${symbols.clock} ${theme.primary(`${hours}:${minutes}:${seconds}`)}`);
    } else {
      const clockLines = renderTime(timeStr);
      clockLines.forEach(line => console.log('  ' + theme.primary(line)));
    }

    console.log('');
    console.log(`  ${theme.dim(dateStr)}`);
    console.log(`  ${theme.dim('Timezone:')} ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log('');
  },
});
