import { registerCommand } from './registry.js';
import { theme, symbols, box } from '../ui/colors.js';
import { randomBytes } from 'crypto';

function generatePassword(length: number, options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }): string {
  const charsets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  let chars = '';
  if (options.uppercase) chars += charsets.uppercase;
  if (options.lowercase) chars += charsets.lowercase;
  if (options.numbers) chars += charsets.numbers;
  if (options.symbols) chars += charsets.symbols;

  if (!chars) chars = charsets.lowercase + charsets.numbers;

  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }

  return password;
}

function calculateStrength(password: string): { score: number; label: string; color: (s: string) => string } {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: 'Weak', color: theme.error };
  if (score <= 4) return { score, label: 'Fair', color: theme.warning };
  if (score <= 5) return { score, label: 'Good', color: theme.primary };
  return { score, label: 'Strong', color: theme.success };
}

registerCommand({
  name: 'password',
  description: 'Generate a secure password',
  usage: '/password [length] [--no-symbols] [--no-numbers] [--no-upper] [--no-lower]',
  async execute(args: string[]) {
    let length = 16;
    const options = {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    };

    // Parse arguments
    for (const arg of args) {
      if (/^\d+$/.test(arg)) {
        length = Math.min(Math.max(parseInt(arg), 4), 128);
      } else if (arg === '--no-symbols') {
        options.symbols = false;
      } else if (arg === '--no-numbers') {
        options.numbers = false;
      } else if (arg === '--no-upper') {
        options.uppercase = false;
      } else if (arg === '--no-lower') {
        options.lowercase = false;
      }
    }

    const password = generatePassword(length, options);
    const strength = calculateStrength(password);

    // Create strength bar
    const barLength = 20;
    const filledLength = Math.round((strength.score / 7) * barLength);
    const bar = strength.color('█'.repeat(filledLength)) + theme.dim('░'.repeat(barLength - filledLength));

    console.log('');
    console.log(box.draw([
      '',
      `  ${symbols.lock} ${theme.secondary('Generated Password')}`,
      '',
      `  ${theme.highlight(password)}`,
      '',
      `  ${theme.dim('Strength:')} ${bar} ${strength.color(strength.label)}`,
      `  ${theme.dim('Length:')} ${length} characters`,
      '',
    ], 60));
    console.log('');
  },
});
