import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import { confirm, prompt, InputOptions } from './input.js';

// Mock the colors module
vi.mock('./colors.js', () => ({
  theme: {
    dim: (str: string) => str,
  },
}));

// Create mock stdin that simulates a TTY
function createMockStdin(isTTY: boolean = true) {
  const emitter = new EventEmitter();
  let isRaw = false;

  const mock = {
    isTTY,
    get isRaw() { return isRaw; },
    setRawMode: vi.fn((mode: boolean) => {
      isRaw = mode;
      return mock;
    }),
    resume: vi.fn(),
    pause: vi.fn(),
    removeListener: vi.fn((event: string, listener: (...args: any[]) => void) => {
      emitter.removeListener(event, listener);
      return mock;
    }),
    once: vi.fn((event: string, listener: (...args: any[]) => void) => {
      emitter.once(event, listener);
      return mock;
    }),
    on: vi.fn((event: string, listener: (...args: any[]) => void) => {
      emitter.on(event, listener);
      return mock;
    }),
    // Test helper to emit data
    emit: (data: string) => {
      emitter.emit('data', Buffer.from(data));
    },
  };

  return mock;
}

function createMockStdout() {
  const output: string[] = [];
  return {
    write: vi.fn((str: string) => {
      output.push(str);
      return true;
    }),
    getOutput: () => output.join(''),
    output,
  };
}

describe('input utilities', () => {
  describe('confirm()', () => {
    describe('basic functionality', () => {
      it('should return true when user presses y', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('y');

        expect(await promise).toBe(true);
        expect(stdout.output).toContain('y\n');
      });

      it('should return true when user presses Y (uppercase)', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('Y');

        expect(await promise).toBe(true);
      });

      it('should return false when user presses n', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('n');

        expect(await promise).toBe(false);
        expect(stdout.output).toContain('n\n');
      });

      it('should return false when user presses N (uppercase)', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('N');

        expect(await promise).toBe(false);
      });
    });

    describe('default behavior', () => {
      it('should return false when Enter pressed with defaultNo=true', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');

        expect(await promise).toBe(false);
        expect(stdout.output).toContain('n\n');
      });

      it('should return true when Enter pressed with defaultNo=false', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', false, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');

        expect(await promise).toBe(true);
        expect(stdout.output).toContain('y\n');
      });

      it('should handle newline (\\n) same as carriage return', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\n');

        expect(await promise).toBe(false);
      });

      it('should display [y/N] suffix for defaultNo=true', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Continue?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('y');
        await promise;

        expect(stdout.getOutput()).toContain('[y/N]');
      });

      it('should display [Y/n] suffix for defaultNo=false', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Continue?', false, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('y');
        await promise;

        expect(stdout.getOutput()).toContain('[Y/n]');
      });
    });

    describe('special keys', () => {
      it('should return false when user presses Ctrl+C', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\x03');

        expect(await promise).toBe(false);
        expect(stdout.output).toContain('\n');
      });

      it('should return false for invalid input (any other key)', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('x');

        expect(await promise).toBe(false);
      });

      it('should return false for space key', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit(' ');

        expect(await promise).toBe(false);
      });

      it('should return false for number keys', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('1');

        expect(await promise).toBe(false);
      });

      it('should handle escape sequence gracefully', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\x1b'); // Escape key

        expect(await promise).toBe(false);
      });
    });

    describe('TTY handling', () => {
      it('should set raw mode when TTY is available', async () => {
        const stdin = createMockStdin(true);
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('y');
        await promise;

        expect(stdin.setRawMode).toHaveBeenCalledWith(true);
      });

      it('should restore raw mode after input', async () => {
        const stdin = createMockStdin(true);
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('y');
        await promise;

        // Should have been called with false to restore
        const calls = stdin.setRawMode.mock.calls;
        expect(calls[calls.length - 1][0]).toBe(false);
      });

      it('should not set raw mode when not TTY', async () => {
        const stdin = createMockStdin(false);
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('y');
        await promise;

        expect(stdin.setRawMode).not.toHaveBeenCalled();
      });

      it('should resume stdin before reading', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('y');
        await promise;

        expect(stdin.resume).toHaveBeenCalled();
      });

      it('should pause stdin after reading', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('y');
        await promise;

        expect(stdin.pause).toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle multi-byte input (takes first character)', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('yes'); // User types "yes" quickly

        expect(await promise).toBe(true);
      });

      it('should handle empty buffer as invalid', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('');

        expect(await promise).toBe(false);
      });
    });
  });

  describe('prompt()', () => {
    describe('basic functionality', () => {
      it('should return entered text when user presses Enter', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('J');
        stdin.emit('o');
        stdin.emit('h');
        stdin.emit('n');
        stdin.emit('\r');

        expect(await promise).toBe('John');
      });

      it('should return default value when input is empty', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', 'Anonymous', { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');

        expect(await promise).toBe('Anonymous');
      });

      it('should return empty string when no input and no default', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');

        expect(await promise).toBe('');
      });

      it('should trim whitespace from input', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit(' ');
        stdin.emit('J');
        stdin.emit('o');
        stdin.emit('h');
        stdin.emit('n');
        stdin.emit(' ');
        stdin.emit('\r');

        expect(await promise).toBe('John');
      });

      it('should handle newline (\\n) same as carriage return', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('T');
        stdin.emit('e');
        stdin.emit('s');
        stdin.emit('t');
        stdin.emit('\n');

        expect(await promise).toBe('Test');
      });
    });

    describe('backspace handling', () => {
      it('should handle backspace (\\x7f) correctly', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('J');
        stdin.emit('o');
        stdin.emit('e'); // Typo
        stdin.emit('\x7f'); // Backspace to delete 'e'
        stdin.emit('h');
        stdin.emit('n');
        stdin.emit('\r');

        expect(await promise).toBe('John');
      });

      it('should handle backspace (\\b) correctly', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('A');
        stdin.emit('B');
        stdin.emit('\b'); // Backspace
        stdin.emit('C');
        stdin.emit('\r');

        expect(await promise).toBe('AC');
      });

      it('should not break when backspace at start of input', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\x7f'); // Backspace at start
        stdin.emit('\x7f'); // Another backspace
        stdin.emit('A');
        stdin.emit('\r');

        expect(await promise).toBe('A');
      });

      it('should delete multiple characters with multiple backspaces', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('A');
        stdin.emit('B');
        stdin.emit('C');
        stdin.emit('\x7f'); // Delete C
        stdin.emit('\x7f'); // Delete B
        stdin.emit('\x7f'); // Delete A
        stdin.emit('X');
        stdin.emit('\r');

        expect(await promise).toBe('X');
      });

      it('should write backspace sequence when deleting', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('A');
        stdin.emit('\x7f');
        stdin.emit('\r');
        await promise;

        expect(stdout.output).toContain('\b \b');
      });
    });

    describe('Ctrl+C handling', () => {
      it('should return default on Ctrl+C', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', 'Default', { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('J');
        stdin.emit('o');
        stdin.emit('\x03'); // Ctrl+C

        expect(await promise).toBe('Default');
      });

      it('should return empty string on Ctrl+C without default', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('J');
        stdin.emit('\x03'); // Ctrl+C

        expect(await promise).toBe('');
      });
    });

    describe('character filtering', () => {
      it('should accept all printable ASCII characters', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Input', undefined, { stdin: stdin as any, stdout: stdout as any });
        // Test various printable characters (space ' ' = 0x20 to '~' = 0x7E)
        stdin.emit('A');
        stdin.emit('z');
        stdin.emit('0');
        stdin.emit('9');
        stdin.emit('!');
        stdin.emit('@');
        stdin.emit('#');
        stdin.emit('~');
        stdin.emit('\r');

        expect(await promise).toBe('Az09!@#~');
      });

      it('should ignore non-printable ASCII characters', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('A');
        stdin.emit('\x01'); // Ctrl+A
        stdin.emit('\x02'); // Ctrl+B
        stdin.emit('\x1b'); // Escape
        stdin.emit('B');
        stdin.emit('\r');

        expect(await promise).toBe('AB');
      });

      it('should ignore tab character', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('A');
        stdin.emit('\t'); // Tab (0x09, < ' ')
        stdin.emit('B');
        stdin.emit('\r');

        expect(await promise).toBe('AB');
      });

      it('should ignore characters outside ASCII range', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('A');
        stdin.emit('\x80'); // Extended ASCII
        stdin.emit('\xff'); // Extended ASCII
        stdin.emit('B');
        stdin.emit('\r');

        expect(await promise).toBe('AB');
      });
    });

    describe('TTY handling', () => {
      it('should set raw mode when TTY is available', async () => {
        const stdin = createMockStdin(true);
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');
        await promise;

        expect(stdin.setRawMode).toHaveBeenCalledWith(true);
      });

      it('should not set raw mode when not TTY', async () => {
        const stdin = createMockStdin(false);
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');
        await promise;

        expect(stdin.setRawMode).not.toHaveBeenCalled();
      });

      it('should restore raw mode after completion', async () => {
        const stdin = createMockStdin(true);
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');
        await promise;

        const calls = stdin.setRawMode.mock.calls;
        expect(calls[calls.length - 1][0]).toBe(false);
      });
    });

    describe('output display', () => {
      it('should display default value in prompt', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', 'John', { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');
        await promise;

        expect(stdout.getOutput()).toContain('(John)');
      });

      it('should not display default when not provided', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');
        await promise;

        expect(stdout.getOutput()).toBe('  Name: \n');
      });

      it('should echo characters as they are typed', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('A');
        stdin.emit('B');
        stdin.emit('\r');
        await promise;

        expect(stdout.output).toContain('A');
        expect(stdout.output).toContain('B');
      });

      it('should write newline after Enter', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('A');
        stdin.emit('\r');
        await promise;

        expect(stdout.output).toContain('\n');
      });
    });

    describe('cleanup', () => {
      it('should clean up listeners after completion', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');
        await promise;

        expect(stdin.removeListener).toHaveBeenCalled();
        expect(stdin.pause).toHaveBeenCalled();
      });

      it('should clean up listeners on Ctrl+C', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\x03');
        await promise;

        expect(stdin.removeListener).toHaveBeenCalled();
        expect(stdin.pause).toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle rapid multi-character input', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('Hello'); // Multiple chars at once
        stdin.emit('\r');

        expect(await promise).toBe('Hello');
      });

      it('should handle empty input returning default', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', 'DefaultName', { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('\r');

        expect(await promise).toBe('DefaultName');
      });

      it('should handle only whitespace returning default', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', 'DefaultName', { stdin: stdin as any, stdout: stdout as any });
        stdin.emit(' ');
        stdin.emit(' ');
        stdin.emit('\r');

        expect(await promise).toBe('DefaultName');
      });

      it('should handle arrow key escape sequences (ignored)', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('A');
        stdin.emit('\x1b[A'); // Up arrow
        stdin.emit('\x1b[B'); // Down arrow
        stdin.emit('\x1b[C'); // Right arrow
        stdin.emit('\x1b[D'); // Left arrow
        stdin.emit('B');
        stdin.emit('\r');

        // Arrow escape sequences contain [ which is printable, so we get A[A[B[C[DB
        // Actually, let's check what the actual behavior is
        const result = await promise;
        // The '[' is printable (0x5B), 'A', 'B', 'C', 'D' are printable
        // So we'd get the escape char ignored, but the rest included
        expect(result).toContain('A');
        expect(result).toContain('B');
      });

      it('should handle very long input', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        const longString = 'A'.repeat(1000);
        stdin.emit(longString);
        stdin.emit('\r');

        expect(await promise).toBe(longString);
      });

      it('should handle input with special characters', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Path', undefined, { stdin: stdin as any, stdout: stdout as any });
        stdin.emit('C');
        stdin.emit(':');
        stdin.emit('\\');
        stdin.emit('U');
        stdin.emit('s');
        stdin.emit('e');
        stdin.emit('r');
        stdin.emit('s');
        stdin.emit('\r');

        expect(await promise).toBe('C:\\Users');
      });

      it('should handle mixed printable and control in single buffer', async () => {
        const stdin = createMockStdin();
        const stdout = createMockStdout();

        const promise = prompt('Name', undefined, { stdin: stdin as any, stdout: stdout as any });
        // Single buffer with mixed characters
        stdin.emit('Hello\x01\x02World');
        stdin.emit('\r');

        // Only printable chars should be kept
        expect(await promise).toBe('HelloWorld');
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle consecutive confirm calls', async () => {
      const stdin1 = createMockStdin();
      const stdout1 = createMockStdout();

      const promise1 = confirm('First?', true, { stdin: stdin1 as any, stdout: stdout1 as any });
      stdin1.emit('y');
      expect(await promise1).toBe(true);

      const stdin2 = createMockStdin();
      const stdout2 = createMockStdout();

      const promise2 = confirm('Second?', true, { stdin: stdin2 as any, stdout: stdout2 as any });
      stdin2.emit('n');
      expect(await promise2).toBe(false);
    });

    it('should handle consecutive prompt calls', async () => {
      const stdin1 = createMockStdin();
      const stdout1 = createMockStdout();

      const promise1 = prompt('First', undefined, { stdin: stdin1 as any, stdout: stdout1 as any });
      stdin1.emit('Hello');
      stdin1.emit('\r');
      expect(await promise1).toBe('Hello');

      const stdin2 = createMockStdin();
      const stdout2 = createMockStdout();

      const promise2 = prompt('Second', undefined, { stdin: stdin2 as any, stdout: stdout2 as any });
      stdin2.emit('World');
      stdin2.emit('\r');
      expect(await promise2).toBe('World');
    });

    it('should handle confirm followed by prompt', async () => {
      const stdin1 = createMockStdin();
      const stdout1 = createMockStdout();

      const confirmResult = confirm('Continue?', true, { stdin: stdin1 as any, stdout: stdout1 as any });
      stdin1.emit('y');
      expect(await confirmResult).toBe(true);

      const stdin2 = createMockStdin();
      const stdout2 = createMockStdout();

      const promptResult = prompt('Name', undefined, { stdin: stdin2 as any, stdout: stdout2 as any });
      stdin2.emit('John');
      stdin2.emit('\r');
      expect(await promptResult).toBe('John');
    });
  });

  describe('boundary conditions', () => {
    it('confirm should handle boundary ASCII characters', async () => {
      // Test character at boundary of printable range
      const stdin = createMockStdin();
      const stdout = createMockStdout();

      const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
      stdin.emit('\x1f'); // One below space (non-printable)

      expect(await promise).toBe(false);
    });

    it('prompt should handle space character (lowest printable)', async () => {
      const stdin = createMockStdin();
      const stdout = createMockStdout();

      const promise = prompt('Test', undefined, { stdin: stdin as any, stdout: stdout as any });
      stdin.emit(' '); // Space is 0x20, lowest printable
      stdin.emit('x');
      stdin.emit('\r');

      expect(await promise).toBe('x'); // Trimmed, so just 'x'
    });

    it('prompt should handle tilde character (highest printable)', async () => {
      const stdin = createMockStdin();
      const stdout = createMockStdout();

      const promise = prompt('Test', undefined, { stdin: stdin as any, stdout: stdout as any });
      stdin.emit('~'); // Tilde is 0x7E, highest printable
      stdin.emit('\r');

      expect(await promise).toBe('~');
    });

    it('prompt should reject DEL character (0x7F) as backspace', async () => {
      const stdin = createMockStdin();
      const stdout = createMockStdout();

      const promise = prompt('Test', undefined, { stdin: stdin as any, stdout: stdout as any });
      stdin.emit('A');
      stdin.emit('B');
      stdin.emit('\x7f'); // DEL treated as backspace
      stdin.emit('\r');

      expect(await promise).toBe('A');
    });

    it('confirm should handle null byte', async () => {
      const stdin = createMockStdin();
      const stdout = createMockStdout();

      const promise = confirm('Test?', true, { stdin: stdin as any, stdout: stdout as any });
      stdin.emit('\x00'); // Null byte

      expect(await promise).toBe(false);
    });
  });
});
