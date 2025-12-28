import { getCommand } from './commands/index.js';
import { theme } from './ui/colors.js';
import { displayBanner } from './ui/banner.js';
import { exec } from 'child_process';
import { existsSync, statSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { homedir, platform } from 'os';

const isWindows = platform() === 'win32';

// Translate Linux commands to Windows equivalents
function translateCommand(cmd: string): string {
  if (!isWindows) return cmd; // No translation needed on Linux/Mac

  const parts = cmd.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case 'ls': {
      // Handle ls flags
      const hasAll = args.some(a => a === '-a' || a === '-la' || a === '-al' || a === '-all');
      const hasLong = args.some(a => a === '-l' || a === '-la' || a === '-al');
      const pathArgs = args.filter(a => !a.startsWith('-'));

      let winCmd = 'dir';
      if (hasAll) winCmd += ' /a';
      if (pathArgs.length > 0) winCmd += ' ' + pathArgs.join(' ');
      return winCmd;
    }

    case 'cat':
      // cat file.txt → type file.txt
      return 'type ' + args.join(' ');

    case 'clear':
      return 'cls';

    case 'rm': {
      // rm file → del file, rm -r dir → rmdir /s /q dir
      const hasRecursive = args.some(a => a === '-r' || a === '-rf' || a === '-fr');
      const hasForce = args.some(a => a === '-f' || a === '-rf' || a === '-fr');
      const pathArgs = args.filter(a => !a.startsWith('-'));

      if (hasRecursive) {
        return 'rmdir /s' + (hasForce ? ' /q' : '') + ' ' + pathArgs.join(' ');
      }
      return 'del' + (hasForce ? ' /f' : '') + ' ' + pathArgs.join(' ');
    }

    case 'cp': {
      // cp src dest → copy src dest
      const hasRecursive = args.some(a => a === '-r' || a === '-R');
      const pathArgs = args.filter(a => !a.startsWith('-'));
      if (hasRecursive) {
        return 'xcopy /e /i ' + pathArgs.join(' ');
      }
      return 'copy ' + pathArgs.join(' ');
    }

    case 'mv':
      // mv src dest → move src dest
      return 'move ' + args.join(' ');

    case 'touch':
      // touch file → create empty file
      return 'type nul > ' + args.join(' ');

    case 'grep':
      // grep pattern file → findstr pattern file
      return 'findstr ' + args.join(' ');

    case 'which':
      // which cmd → where cmd
      return 'where ' + args.join(' ');

    case 'echo':
      return 'echo ' + args.join(' ');

    default:
      return cmd;
  }
}

// Handle cd specially since it needs to change the parent process directory
function handleCd(args: string): void {
  let targetPath = args.trim();

  // Handle empty cd or ~ for home directory
  if (!targetPath || targetPath === '~') {
    targetPath = homedir();
  } else if (targetPath.startsWith('~/')) {
    targetPath = resolve(homedir(), targetPath.slice(2));
  } else if (targetPath === '-') {
    // cd - could go to previous dir, but we'll just show current
    console.log(theme.dim(process.cwd()));
    return;
  } else {
    targetPath = resolve(process.cwd(), targetPath);
  }

  if (!existsSync(targetPath)) {
    console.log(theme.error(`Directory not found: ${targetPath}`));
    return;
  }

  try {
    const stats = statSync(targetPath);
    if (!stats.isDirectory()) {
      console.log(theme.error(`Not a directory: ${targetPath}`));
      return;
    }
    process.chdir(targetPath);
    console.log(theme.dim(process.cwd()));
  } catch (error) {
    console.log(theme.error(`Cannot access: ${targetPath}`));
  }
}

// Handle pwd - just show current directory
function handlePwd(): void {
  console.log(theme.primary(process.cwd()));
}

// Handle cat/type with nice output
function handleCat(args: string): void {
  const filePath = resolve(process.cwd(), args.trim());

  if (!existsSync(filePath)) {
    console.log(theme.error(`File not found: ${args}`));
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    console.log(content);
  } catch (error) {
    console.log(theme.error(`Cannot read file: ${args}`));
  }
}

async function executeShellCommand(command: string): Promise<void> {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  // Handle special commands that need Node.js
  if (cmd === 'cd') {
    handleCd(args);
    return;
  }

  if (cmd === 'pwd') {
    handlePwd();
    return;
  }

  if (cmd === 'cat') {
    handleCat(args);
    return;
  }

  if (cmd === 'clear' || cmd === 'cls') {
    console.clear();
    await displayBanner();
    return;
  }

  // Translate Linux → Windows if needed
  const translatedCmd = translateCommand(command);

  return new Promise((resolvePromise) => {
    exec(translatedCmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.log(theme.error(stderr));
      if (error && !stderr) {
        console.log(theme.error(`Error: ${error.message}`));
      }
      resolvePromise();
    });
  });
}

export async function parseAndExecute(input: string): Promise<void> {
  const trimmed = input.trim();

  if (!trimmed) {
    return;
  }

  // Shell command (starts with !)
  if (trimmed.startsWith('!')) {
    const shellCmd = trimmed.slice(1).trim();
    if (!shellCmd) {
      console.log(theme.dim('Usage: !<command> (e.g., !ls, !cd folder, !cat file.txt)'));
      return;
    }
    await executeShellCommand(shellCmd);
    return;
  }

  // Check if it's a command (starts with /)
  if (!trimmed.startsWith('/')) {
    console.log(theme.dim('Commands start with /. Shell commands start with !'));
    console.log(theme.dim('Type /help for available commands.'));
    return;
  }

  // Parse command and arguments
  const parts = trimmed.slice(1).split(/\s+/);
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);

  const command = getCommand(commandName);

  if (!command) {
    console.log(theme.error(`Unknown command: /${commandName}`));
    console.log(theme.dim('Type /help to see available commands.'));
    return;
  }

  try {
    await command.execute(args);
  } catch (error) {
    console.log(theme.error(`Error executing command: ${error}`));
  }
}
