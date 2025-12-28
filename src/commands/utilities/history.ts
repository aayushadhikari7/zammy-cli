import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const HISTORY_FILE = join(homedir(), '.zammy-history');
const MAX_HISTORY = 100;

export function addToHistory(command: string): void {
  if (!command.trim() || command.startsWith('/history')) return;

  try {
    const timestamp = new Date().toISOString();
    appendFileSync(HISTORY_FILE, `${timestamp}|${command}\n`);

    // Trim to max size
    const lines = readFileSync(HISTORY_FILE, 'utf8').split('\n').filter(l => l);
    if (lines.length > MAX_HISTORY) {
      writeFileSync(HISTORY_FILE, lines.slice(-MAX_HISTORY).join('\n') + '\n');
    }
  } catch {}
}

registerCommand({
  name: 'history',
  description: 'Show command history',
  usage: '/history [count|clear|search <term>]',
  async execute(args: string[]) {
    const action = args[0]?.toLowerCase();

    if (action === 'clear') {
      try {
        writeFileSync(HISTORY_FILE, '');
        console.log('');
        console.log(theme.success(`  ${symbols.check} History cleared`));
        console.log('');
      } catch {
        console.log(theme.error('Failed to clear history'));
      }
      return;
    }

    let history: { time: string; cmd: string }[] = [];
    try {
      if (existsSync(HISTORY_FILE)) {
        const lines = readFileSync(HISTORY_FILE, 'utf8').split('\n').filter(l => l);
        history = lines.map(line => {
          const [time, ...rest] = line.split('|');
          return { time, cmd: rest.join('|') };
        });
      }
    } catch {}

    if (history.length === 0) {
      console.log('');
      console.log(theme.dim('  No command history yet'));
      console.log('');
      return;
    }

    if (action === 'search') {
      const term = args.slice(1).join(' ').toLowerCase();
      if (!term) {
        console.log(theme.error('Usage: /history search <term>'));
        return;
      }

      history = history.filter(h => h.cmd.toLowerCase().includes(term));
      if (history.length === 0) {
        console.log('');
        console.log(theme.dim(`  No history matching "${term}"`));
        console.log('');
        return;
      }
    }

    const count = parseInt(action) || 20;
    const toShow = history.slice(-count);

    console.log('');
    console.log(`  ${symbols.scroll} ${theme.gradient('COMMAND HISTORY')} ${symbols.scroll}`);
    console.log('');

    toShow.forEach((h, idx) => {
      const date = new Date(h.time);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

      console.log(`  ${theme.dim(`${dateStr} ${timeStr}`)} ${theme.primary(h.cmd)}`);
    });

    console.log('');
    console.log(theme.dim(`  Showing ${toShow.length} of ${history.length} commands`));
    console.log('');
  },
});
