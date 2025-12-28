import * as readline from 'readline';
import { displayBanner } from './ui/banner.js';
import { getPrompt } from './ui/prompt.js';
import { parseAndExecute } from './cli.js';
import { theme } from './ui/colors.js';
import { getAllCommands } from './commands/registry.js';
import { readdirSync } from 'fs';

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
  items: MenuItem[];
  selectedIndex: number;
  prefix: string;
  renderedLines: number;
}

const menu: MenuState = {
  visible: false,
  items: [],
  selectedIndex: 0,
  prefix: '/',
  renderedLines: 0,
};

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

function eraseMenuLines(): void {
  if (menu.renderedLines === 0) return;

  const out = process.stdout;

  // Move down and erase each menu line
  for (let i = 0; i < menu.renderedLines; i++) {
    out.write('\x1B[1B'); // Move down
    out.write('\x1B[2K'); // Erase line
  }

  // Move back up to prompt line
  out.write(`\x1B[${menu.renderedLines}A`);

  menu.renderedLines = 0;
}

function renderMenu(currentLine: string): void {
  if (!menu.visible || menu.items.length === 0) return;

  const out = process.stdout;
  const promptLen = getPromptLength();
  const cursorCol = promptLen + currentLine.length + 1;

  // Erase old menu first
  eraseMenuLines();

  // Move to next line and draw menu
  out.write('\n');

  menu.items.forEach((cmd, idx) => {
    const isSelected = idx === menu.selectedIndex;
    const pointer = isSelected ? theme.primary('❯ ') : '  ';
    const name = isSelected
      ? theme.primary(`${menu.prefix}${cmd.name}`)
      : theme.dim(`${menu.prefix}${cmd.name}`);
    const desc = theme.dim(` - ${cmd.description}`);
    out.write(`${pointer}${name}${desc}`);
    if (idx < menu.items.length - 1) out.write('\n');
  });

  menu.renderedLines = menu.items.length;

  // Move back up to prompt line
  out.write(`\x1B[${menu.renderedLines}A`);

  // Position cursor at correct column
  out.write(`\x1B[${cursorCol}G`);
}

function hideMenu(currentLine: string = ''): void {
  if (!menu.visible) return;

  eraseMenuLines();

  // Restore cursor position
  const promptLen = getPromptLength();
  process.stdout.write(`\x1B[${promptLen + currentLine.length + 1}G`);

  menu.visible = false;
  menu.items = [];
  menu.selectedIndex = 0;
  menu.renderedLines = 0;
}

function showMenu(filter: string, prefix: '/' | '!', currentLine: string): void {
  const items = prefix === '/' ? getFilteredCommands(filter) : getFilteredShellCommands(filter);

  if (items.length === 0) {
    if (menu.visible) hideMenu(currentLine);
    return;
  }

  // Erase previous menu if visible
  if (menu.visible) {
    eraseMenuLines();
  }

  menu.visible = true;
  menu.items = items;
  menu.prefix = prefix;

  // Keep selection in bounds
  if (menu.selectedIndex >= items.length) {
    menu.selectedIndex = 0;
  }

  renderMenu(currentLine);
}

function selectMenuItem(rl: readline.Interface): string | null {
  if (!menu.visible || menu.items.length === 0) return null;

  const selected = menu.items[menu.selectedIndex];
  const newLine = menu.prefix + selected.name + ' ';

  // Erase menu
  eraseMenuLines();

  // Clear current line and write new content
  const prompt = getPrompt();
  process.stdout.write(`\r\x1B[2K${prompt}${newLine}`);

  // Update readline internal state
  (rl as any).line = newLine;
  (rl as any).cursor = newLine.length;

  // Reset menu state
  menu.visible = false;
  menu.items = [];
  menu.selectedIndex = 0;
  menu.renderedLines = 0;

  return newLine;
}

function navigateMenu(direction: 'up' | 'down', currentLine: string): void {
  if (!menu.visible || menu.items.length === 0) return;

  if (direction === 'up') {
    menu.selectedIndex = menu.selectedIndex > 0 ? menu.selectedIndex - 1 : menu.items.length - 1;
  } else {
    menu.selectedIndex = menu.selectedIndex < menu.items.length - 1 ? menu.selectedIndex + 1 : 0;
  }

  // Re-render menu with new selection
  eraseMenuLines();
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
  await displayBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    completer: completer,
  });

  // Track previous line to detect changes
  let prevLine = '';

  // Handle keypress for menu navigation
  process.stdin.on('keypress', (_char, key) => {
    if (!key) return;

    const currentLine = (rl as any).line || '';

    // Handle menu navigation when menu is visible
    if (menu.visible) {
      if (key.name === 'up') {
        navigateMenu('up', currentLine);
        return;
      }
      if (key.name === 'down') {
        navigateMenu('down', currentLine);
        return;
      }
      if (key.name === 'tab') {
        selectMenuItem(rl);
        return;
      }
      if (key.name === 'escape') {
        hideMenu(currentLine);
        return;
      }
    }

    // Update menu after keystroke is processed
    setImmediate(() => {
      const line = (rl as any).line || '';

      // Only update if line changed
      if (line === prevLine) return;
      prevLine = line;

      // Show menu for / or ! commands
      if (line.startsWith('/') && !line.includes(' ')) {
        showMenu(line.slice(1), '/', line);
      } else if (line.startsWith('!') && !line.includes(' ')) {
        showMenu(line.slice(1), '!', line);
      } else if (menu.visible) {
        hideMenu(line);
      }
    });
  });

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
    hideMenu('');
    prevLine = '';
    await parseAndExecute(input);
    rl.prompt();
  });

  rl.prompt();
}

main().catch(console.error);
