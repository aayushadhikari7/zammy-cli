// Shared input utilities that don't conflict with the main readline
// Uses raw stdin instead of creating new readline interfaces

import { theme } from './colors.js';

// Types for testability
export interface InputOptions {
  stdin?: NodeJS.ReadStream & { setRawMode?: (mode: boolean) => void };
  stdout?: NodeJS.WriteStream;
}

/**
 * Simple yes/no confirmation prompt
 * Uses raw stdin to avoid conflicts with main readline
 */
export async function confirm(
  message: string,
  defaultNo: boolean = true,
  options: InputOptions = {}
): Promise<boolean> {
  const stdin = options.stdin || process.stdin;
  const stdout = options.stdout || process.stdout;

  const suffix = defaultNo ? '[y/N]' : '[Y/n]';
  stdout.write(`${message} ${theme.dim(suffix)} `);

  return new Promise((resolve) => {
    // Set raw mode to get single keypress
    const isTTY = 'isTTY' in stdin && stdin.isTTY;
    const wasRaw = 'isRaw' in stdin ? (stdin as any).isRaw : false;

    if (isTTY && stdin.setRawMode) {
      stdin.setRawMode(true);
    }
    stdin.resume();

    const onData = (data: Buffer) => {
      // Only look at first character (handles piped input where multiple chars arrive at once)
      const char = data.toString()[0]?.toLowerCase() || '';

      // Restore stdin state
      if (isTTY && stdin.setRawMode) {
        stdin.setRawMode(wasRaw || false);
      }
      stdin.removeListener('data', onData);
      stdin.pause();

      // Echo the response
      if (char === 'y') {
        stdout.write('y\n');
        resolve(true);
      } else if (char === 'n') {
        stdout.write('n\n');
        resolve(false);
      } else if (char === '\r' || char === '\n') {
        // Enter key - use default
        stdout.write(defaultNo ? 'n\n' : 'y\n');
        resolve(!defaultNo);
      } else if (char === '\x03') {
        // Ctrl+C
        stdout.write('\n');
        resolve(false);
      } else {
        // Invalid input, restore and retry
        stdout.write('\n');
        resolve(false);
      }
    };

    stdin.once('data', onData);
  });
}

/**
 * Simple text input prompt
 * Collects input until Enter is pressed
 */
export async function prompt(
  message: string,
  defaultValue?: string,
  options: InputOptions = {}
): Promise<string> {
  const stdin = options.stdin || process.stdin;
  const stdout = options.stdout || process.stdout;

  const suffix = defaultValue ? ` ${theme.dim(`(${defaultValue})`)}` : '';
  stdout.write(`  ${message}${suffix}: `);

  return new Promise((resolve) => {
    let input = '';

    // Set raw mode for character-by-character input
    const isTTY = 'isTTY' in stdin && stdin.isTTY;
    const wasRaw = 'isRaw' in stdin ? (stdin as any).isRaw : false;

    if (isTTY && stdin.setRawMode) {
      stdin.setRawMode(true);
    }
    stdin.resume();

    const onData = (data: Buffer) => {
      const chars = data.toString();

      // Process each character individually (handles piped input with multiple chars)
      for (const char of chars) {
        if (char === '\r' || char === '\n') {
          // Enter - finish input
          if (isTTY && stdin.setRawMode) {
            stdin.setRawMode(wasRaw || false);
          }
          stdin.removeListener('data', onData);
          stdin.pause();
          stdout.write('\n');
          resolve(input.trim() || defaultValue || '');
          return;
        } else if (char === '\x03') {
          // Ctrl+C - cancel
          if (isTTY && stdin.setRawMode) {
            stdin.setRawMode(wasRaw || false);
          }
          stdin.removeListener('data', onData);
          stdin.pause();
          stdout.write('\n');
          resolve(defaultValue || '');
          return;
        } else if (char === '\x7f' || char === '\b') {
          // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            stdout.write('\b \b');
          }
        } else if (char >= ' ' && char <= '~') {
          // Printable ASCII
          input += char;
          stdout.write(char);
        }
        // Ignore non-printable and extended ASCII characters
      }
    };

    stdin.on('data', onData);
  });
}
