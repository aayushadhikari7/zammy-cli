import * as readline from 'readline';
import { displayBanner } from './ui/banner.js';
import { getPrompt } from './ui/prompt.js';
import { parseAndExecute } from './cli.js';
import { theme } from './ui/colors.js';
import { getAllCommands } from './commands/registry.js';
import { readdirSync } from 'fs';

// Detect if we're in a proper TTY environment
const isTTY = process.stdin.isTTY && process.stdout.isTTY;
const isSimpleMode = process.argv.includes('--simple') || !isTTY;

// Import commands to register them
import './commands/index.js';

// Image extensions for asciiart autocomplete
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];

// Menu item type
interface MenuItem {
  name: string;
  description: string;
}

// Menu state
interface MenuState {
  visible: boolean;
  items: MenuItem[];       // ALL items (not limited)
  selectedIndex: number;   // Index in full items array
  scrollOffset: number;    // First visible item index
  prefix: string;
  renderedLines: number;
}

const menu: MenuState = {
  visible: false,
  items: [],
  selectedIndex: 0,
  scrollOffset: 0,
  prefix: '/',
  renderedLines: 0,
};

const MAX_VISIBLE_ITEMS = 6;

// Shell commands with descriptions
const SHELL_COMMANDS: MenuItem[] = [
  { name: 'ls', description: 'List directory contents' },
  { name: 'cd', description: 'Change directory' },
  { name: 'pwd', description: 'Print working directory' },
  { name: 'cat', description: 'Display file contents' },
  { name: 'clear', description: 'Clear screen (keeps banner)' },
  { name: 'mkdir', description: 'Create directory' },
  { name: 'rm', description: 'Remove files' },
  { name: 'cp', description: 'Copy files' },
  { name: 'mv', description: 'Move files' },
];

function getFilteredCommands(filter: string): MenuItem[] {
  const commands = getAllCommands().map(c => ({ name: c.name, description: c.description }));
  if (!filter) return commands;
  return commands.filter(c => c.name.toLowerCase().startsWith(filter.toLowerCase()));
}

function getFilteredShellCommands(filter: string): MenuItem[] {
  if (!filter) return SHELL_COMMANDS;
  return SHELL_COMMANDS.filter(c => c.name.toLowerCase().startsWith(filter.toLowerCase()));
}

function getPromptLength(): number {
  return getPrompt().replace(/\x1B\[[0-9;]*m/g, '').length;
}

function clearBelowCursor(): void {
  // Clear from cursor position to end of screen
  process.stdout.write('\x1B[J');
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

function renderMenu(currentLine: string): void {
  if (!menu.visible || menu.items.length === 0) return;

  const out = process.stdout;

  // Get terminal width for truncation (default to 80)
  const termWidth = process.stdout.columns || 80;
  const maxDescLen = Math.max(20, termWidth - 35);

  // Calculate visible window
  const totalItems = menu.items.length;
  const visibleCount = Math.min(MAX_VISIBLE_ITEMS, totalItems);
  const hasScrollUp = menu.scrollOffset > 0;
  const hasScrollDown = menu.scrollOffset + visibleCount < totalItems;

  // Build menu content
  let lines: string[] = [];

  if (hasScrollUp) {
    lines.push(theme.dim('  ↑ more'));
  }

  for (let i = 0; i < visibleCount; i++) {
    const itemIndex = menu.scrollOffset + i;
    const cmd = menu.items[itemIndex];
    const isSelected = itemIndex === menu.selectedIndex;
    const pointer = isSelected ? theme.primary('> ') : '  ';
    const name = isSelected
      ? theme.primary(`${menu.prefix}${cmd.name}`)
      : theme.dim(`${menu.prefix}${cmd.name}`);
    const truncDesc = truncateText(cmd.description, maxDescLen);
    const desc = theme.dim(` - ${truncDesc}`);
    lines.push(`${pointer}${name}${desc}`);
  }

  if (hasScrollDown) {
    lines.push(theme.dim(`  ↓ ${totalItems - menu.scrollOffset - visibleCount} more`));
  }

  const numLines = lines.length;
  const cursorCol = getPromptLength() + currentLine.length + 1;

  // 1. Move to column after prompt+input, clear to end of line (in case input shortened)
  out.write(`\x1B[${cursorCol}G\x1B[K`);

  // 2. Move down, clear everything below, draw menu
  out.write('\n');
  clearBelowCursor();
  out.write(lines.join('\n'));

  // 3. Move back up to prompt line and position cursor
  out.write(`\x1B[${numLines}A`);
  out.write(`\x1B[${cursorCol}G`);

  menu.renderedLines = numLines;
}

function hideMenu(currentLine: string = ''): void {
  if (!menu.visible) return;

  // Clear menu area - move down, clear, move back up, restore cursor column
  if (menu.renderedLines > 0) {
    process.stdout.write('\n');
    clearBelowCursor();
    process.stdout.write('\x1B[1A');
    // Restore cursor to correct column
    const cursorCol = getPromptLength() + currentLine.length + 1;
    process.stdout.write(`\x1B[${cursorCol}G`);
  }

  menu.visible = false;
  menu.items = [];
  menu.selectedIndex = 0;
  menu.scrollOffset = 0;
  menu.renderedLines = 0;
}

function showMenu(filter: string, prefix: '/' | '!', currentLine: string): void {
  const allItems = prefix === '/' ? getFilteredCommands(filter) : getFilteredShellCommands(filter);

  if (allItems.length === 0) {
    if (menu.visible) hideMenu(currentLine);
    return;
  }

  // Update menu state (renderMenu handles erasing)
  menu.visible = true;
  menu.items = allItems;
  menu.prefix = prefix;
  menu.selectedIndex = 0;
  menu.scrollOffset = 0;

  renderMenu(currentLine);
}

function selectMenuItem(rl: readline.Interface): string | null {
  if (!menu.visible || menu.items.length === 0) return null;

  const selected = menu.items[menu.selectedIndex];
  const newLine = menu.prefix + selected.name + ' ';

  // Clear menu area
  if (menu.renderedLines > 0) {
    process.stdout.write('\n');
    clearBelowCursor();
    process.stdout.write('\x1B[1A');
  }

  // Update readline internal state
  (rl as any).line = newLine;
  (rl as any).cursor = newLine.length;

  // Redraw prompt with new line
  process.stdout.write(`\r${getPrompt()}${newLine}`);

  // Reset menu state
  menu.visible = false;
  menu.items = [];
  menu.selectedIndex = 0;
  menu.scrollOffset = 0;
  menu.renderedLines = 0;

  return newLine;
}

function navigateMenu(direction: 'up' | 'down', currentLine: string): void {
  if (!menu.visible || menu.items.length === 0) return;

  const totalItems = menu.items.length;

  if (direction === 'up') {
    if (menu.selectedIndex > 0) {
      menu.selectedIndex--;
    } else {
      // Wrap to bottom
      menu.selectedIndex = totalItems - 1;
      menu.scrollOffset = Math.max(0, totalItems - MAX_VISIBLE_ITEMS);
    }
  } else {
    if (menu.selectedIndex < totalItems - 1) {
      menu.selectedIndex++;
    } else {
      // Wrap to top
      menu.selectedIndex = 0;
      menu.scrollOffset = 0;
    }
  }

  // Adjust scroll offset to keep selection visible
  const visibleCount = Math.min(MAX_VISIBLE_ITEMS, totalItems);
  if (menu.selectedIndex < menu.scrollOffset) {
    menu.scrollOffset = menu.selectedIndex;
  } else if (menu.selectedIndex >= menu.scrollOffset + visibleCount) {
    menu.scrollOffset = menu.selectedIndex - visibleCount + 1;
  }

  // Re-render menu with new selection (renderMenu handles erasing)
  renderMenu(currentLine);
}

function completer(line: string): [string[], string] {
  const commands = getAllCommands().map(c => '/' + c.name);

  if (line.startsWith('/')) {
    const input = line.toLowerCase();

    if (input.startsWith('/asciiart ')) {
      const afterCommand = line.slice('/asciiart '.length);
      const searchTerm = afterCommand.startsWith('@') ? afterCommand.slice(1) : afterCommand;

      try {
        const files = readdirSync(process.cwd());
        const imageFiles = files.filter(f => {
          const ext = f.toLowerCase().slice(f.lastIndexOf('.'));
          return IMAGE_EXTENSIONS.includes(ext);
        });

        const matches = imageFiles.filter(f =>
          f.toLowerCase().startsWith(searchTerm.toLowerCase())
        );

        const completions = matches.map(f => '/asciiart @' + f);
        return [completions.length ? completions : [], line];
      } catch {
        return [[], line];
      }
    }

    const matches = commands.filter(c => c.toLowerCase().startsWith(input));
    return [matches.length ? matches : [], line];
  }

  if (line.startsWith('!')) {
    const shellCmds = SHELL_COMMANDS.map(c => '!' + c.name);
    const matches = shellCmds.filter(c => c.toLowerCase().startsWith(line.toLowerCase()));
    return [matches.length ? matches : [], line];
  }

  return [[], line];
}

async function main() {
  // Show simple mode notice if not TTY
  if (isSimpleMode && !process.argv.includes('--simple')) {
    console.log(theme.dim('Note: Running in simple mode (no TTY detected). Use Tab for autocomplete.'));
    console.log(theme.dim('For full features, run in a proper terminal or use: zammy --simple\n'));
  }

  await displayBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: isTTY,
    completer: completer,
  });

  // Track previous line to detect changes
  let prevLine = '';

  // Enable interactive menu in TTY mode
  if (isTTY && !isSimpleMode) {
    process.stdin.on('keypress', (_char, key) => {
      if (!key) return;

      const currentLine = (rl as any).line || '';

      if (menu.visible) {
        if (key.name === 'up' || key.name === 'down') {
          navigateMenu(key.name, currentLine);
          return;
        }
        if (key.name === 'tab' || key.name === 'return') {
          if (key.name === 'tab') {
            selectMenuItem(rl);
          }
          return;
        }
        if (key.name === 'escape') {
          hideMenu(currentLine);
          return;
        }
      }

      // Update menu after keystroke
      setImmediate(() => {
        const line = (rl as any).line || '';
        if (line === prevLine) return;
        prevLine = line;

        if (line.startsWith('/') && !line.includes(' ')) {
          showMenu(line.slice(1), '/', line);
        } else if (line.startsWith('!') && !line.includes(' ')) {
          showMenu(line.slice(1), '!', line);
        } else if (menu.visible) {
          hideMenu(line);
        }
      });
    });
  }

  // Double Ctrl+C to exit
  let lastCtrlC = 0;

  rl.on('SIGINT', () => {
    const now = Date.now();
    const line = (rl as any).line || '';

    if (now - lastCtrlC < 500) {
      hideMenu(line);
      console.log('\n' + theme.secondary('Goodbye! See you next time.') + '\n');
      process.exit(0);
    } else {
      lastCtrlC = now;
      hideMenu(line);
      console.log('\n' + theme.dim('Press Ctrl+C again to exit'));
      rl.prompt();
    }
  });

  rl.setPrompt(getPrompt());

  rl.on('line', async (input) => {
    hideMenu(input);
    prevLine = '';
    await parseAndExecute(input);
    rl.prompt();
  });

  rl.prompt();
}

main().catch(console.error);
