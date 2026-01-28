export interface RegexMatch {
  match: string;
  index: number;
  groups: Record<string, string>;
}

export interface RegexResult {
  pattern: string;
  flags: string;
  input: string;
  isValid: boolean;
  matches: RegexMatch[];
  error?: string;
}

export const PATTERN_LIBRARY: Record<string, { pattern: string; description: string }> = {
  email: {
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    description: 'Email address',
  },
  url: {
    pattern: 'https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[\\w\\-.,@?^=%&:/~+#]*',
    description: 'HTTP/HTTPS URL',
  },
  ipv4: {
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    description: 'IPv4 address',
  },
  ipv6: {
    pattern: '([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}',
    description: 'IPv6 address (full)',
  },
  phone: {
    pattern: '\\+?[1-9]\\d{1,14}',
    description: 'Phone number (E.164)',
  },
  date: {
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    description: 'Date (YYYY-MM-DD)',
  },
  time: {
    pattern: '\\d{2}:\\d{2}(:\\d{2})?',
    description: 'Time (HH:MM or HH:MM:SS)',
  },
  hex: {
    pattern: '#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})',
    description: 'Hex color code',
  },
  uuid: {
    pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
    description: 'UUID',
  },
  slug: {
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    description: 'URL slug',
  },
  semver: {
    pattern: '\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.]+)?(\\+[a-zA-Z0-9.]+)?',
    description: 'Semantic version',
  },
  creditcard: {
    pattern: '\\b(?:\\d[ -]*?){13,16}\\b',
    description: 'Credit card number',
  },
};

export function parseFlags(flagStr: string): string {
  const validFlags = ['g', 'i', 'm', 's', 'u', 'y'];
  return flagStr
    .split('')
    .filter((f) => validFlags.includes(f))
    .join('');
}

export function testRegex(pattern: string, input: string, flags: string = 'g'): RegexResult {
  const result: RegexResult = {
    pattern,
    flags,
    input,
    isValid: true,
    matches: [],
  };

  try {
    const regex = new RegExp(pattern, flags);
    let match: RegExpExecArray | null;

    if (flags.includes('g')) {
      while ((match = regex.exec(input)) !== null) {
        result.matches.push({
          match: match[0],
          index: match.index,
          groups: match.groups || {},
        });
        if (!regex.global) break;
      }
    } else {
      match = regex.exec(input);
      if (match) {
        result.matches.push({
          match: match[0],
          index: match.index,
          groups: match.groups || {},
        });
      }
    }
  } catch (e) {
    result.isValid = false;
    result.error = e instanceof Error ? e.message : 'Invalid regex';
  }

  return result;
}

export function highlightMatches(input: string, matches: RegexMatch[]): string {
  if (matches.length === 0) return input;

  let result = '';
  let lastIndex = 0;

  const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

  for (const match of sortedMatches) {
    result += input.slice(lastIndex, match.index);
    result += `\x1b[43m\x1b[30m${match.match}\x1b[0m`;
    lastIndex = match.index + match.match.length;
  }

  result += input.slice(lastIndex);
  return result;
}

export function getPatternNames(): string[] {
  return Object.keys(PATTERN_LIBRARY);
}

export function getPattern(name: string): { pattern: string; description: string } | null {
  return PATTERN_LIBRARY[name.toLowerCase()] || null;
}
