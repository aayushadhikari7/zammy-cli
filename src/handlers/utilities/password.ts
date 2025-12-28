import { randomBytes } from 'crypto';

export interface PasswordOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
}

export interface PasswordResult {
  password: string;
  length: number;
  strength: PasswordStrength;
  options: PasswordOptions;
}

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

export function generatePassword(
  length: number = 16,
  options: Partial<PasswordOptions> = {}
): PasswordResult {
  const opts: PasswordOptions = {
    uppercase: options.uppercase ?? true,
    lowercase: options.lowercase ?? true,
    numbers: options.numbers ?? true,
    symbols: options.symbols ?? true,
  };

  const safeLength = Math.min(Math.max(length, 4), 128);

  let chars = '';
  if (opts.uppercase) chars += CHARSETS.uppercase;
  if (opts.lowercase) chars += CHARSETS.lowercase;
  if (opts.numbers) chars += CHARSETS.numbers;
  if (opts.symbols) chars += CHARSETS.symbols;

  if (!chars) chars = CHARSETS.lowercase + CHARSETS.numbers;

  const bytes = randomBytes(safeLength);
  let password = '';
  for (let i = 0; i < safeLength; i++) {
    password += chars[bytes[i] % chars.length];
  }

  return {
    password,
    length: safeLength,
    strength: calculateStrength(password),
    options: opts,
  };
}

export function calculateStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: 'Weak' };
  if (score <= 4) return { score, label: 'Fair' };
  if (score <= 5) return { score, label: 'Good' };
  return { score, label: 'Strong' };
}
