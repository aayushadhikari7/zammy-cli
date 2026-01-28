export interface BaseConversion {
  input: string;
  decimal: string;
  binary: string;
  octal: string;
  hex: string;
  detected: 'decimal' | 'binary' | 'octal' | 'hex' | 'unknown';
}

export function detectBase(input: string): 'decimal' | 'binary' | 'octal' | 'hex' | 'unknown' {
  const trimmed = input.trim().toLowerCase();

  if (trimmed.startsWith('0x') || trimmed.startsWith('#')) {
    return 'hex';
  }
  if (trimmed.startsWith('0b')) {
    return 'binary';
  }
  if (trimmed.startsWith('0o')) {
    return 'octal';
  }
  if (/^[01]+$/.test(trimmed) && trimmed.length >= 4) {
    return 'binary';
  }
  if (/^[0-9]+$/.test(trimmed)) {
    return 'decimal';
  }
  if (/^[0-9a-f]+$/.test(trimmed)) {
    return 'hex';
  }

  return 'unknown';
}

export function parseNumber(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  try {
    if (trimmed.startsWith('0x') || trimmed.startsWith('#')) {
      return parseInt(trimmed.replace('#', ''), 16);
    }
    if (trimmed.startsWith('0b')) {
      return parseInt(trimmed.slice(2), 2);
    }
    if (trimmed.startsWith('0o')) {
      return parseInt(trimmed.slice(2), 8);
    }

    const detected = detectBase(trimmed);
    if (detected === 'binary') {
      return parseInt(trimmed, 2);
    }
    if (detected === 'hex') {
      return parseInt(trimmed, 16);
    }
    if (detected === 'decimal') {
      return parseInt(trimmed, 10);
    }

    return null;
  } catch {
    return null;
  }
}

export function convertBase(input: string): BaseConversion | null {
  const decimal = parseNumber(input);
  if (decimal === null || isNaN(decimal)) {
    return null;
  }

  return {
    input: input.trim(),
    decimal: decimal.toString(10),
    binary: '0b' + decimal.toString(2),
    octal: '0o' + decimal.toString(8),
    hex: '0x' + decimal.toString(16).toUpperCase(),
    detected: detectBase(input),
  };
}

export function formatBinary(binary: string, groupSize: number = 4): string {
  const digits = binary.replace('0b', '');
  const padded = digits.padStart(Math.ceil(digits.length / groupSize) * groupSize, '0');
  return '0b' + padded.match(new RegExp(`.{1,${groupSize}}`, 'g'))!.join(' ');
}
