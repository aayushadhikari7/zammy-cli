export interface TextPipeResult {
  input: string;
  output: string;
  operation: string;
  lineCount?: number;
}

export function sortLines(text: string, options: { reverse?: boolean; numeric?: boolean; unique?: boolean } = {}): TextPipeResult {
  let lines = text.split('\n');

  if (options.unique) {
    lines = [...new Set(lines)];
  }

  if (options.numeric) {
    lines.sort((a, b) => {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numA - numB;
    });
  } else {
    lines.sort((a, b) => a.localeCompare(b));
  }

  if (options.reverse) {
    lines.reverse();
  }

  return {
    input: text,
    output: lines.join('\n'),
    operation: 'sort',
    lineCount: lines.length,
  };
}

export function uniqueLines(text: string, options: { count?: boolean } = {}): TextPipeResult {
  const lines = text.split('\n');
  const counts = new Map<string, number>();

  for (const line of lines) {
    counts.set(line, (counts.get(line) || 0) + 1);
  }

  let output: string;
  if (options.count) {
    output = Array.from(counts.entries())
      .map(([line, count]) => `${count.toString().padStart(4)} ${line}`)
      .join('\n');
  } else {
    output = Array.from(counts.keys()).join('\n');
  }

  return {
    input: text,
    output,
    operation: 'unique',
    lineCount: counts.size,
  };
}

export function transformCase(text: string, caseType: 'upper' | 'lower' | 'title' | 'sentence' | 'capitalize'): TextPipeResult {
  let output: string;

  switch (caseType) {
    case 'upper':
      output = text.toUpperCase();
      break;
    case 'lower':
      output = text.toLowerCase();
      break;
    case 'title':
      output = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      break;
    case 'sentence':
      output = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      break;
    case 'capitalize':
      output = text.split('\n').map(line =>
        line.charAt(0).toUpperCase() + line.slice(1)
      ).join('\n');
      break;
    default:
      output = text;
  }

  return {
    input: text,
    output,
    operation: caseType,
  };
}

export function trimText(text: string, mode: 'both' | 'start' | 'end' | 'lines' = 'both'): TextPipeResult {
  let output: string;

  switch (mode) {
    case 'start':
      output = text.trimStart();
      break;
    case 'end':
      output = text.trimEnd();
      break;
    case 'lines':
      output = text.split('\n').map(line => line.trim()).join('\n');
      break;
    default:
      output = text.trim();
  }

  return {
    input: text,
    output,
    operation: 'trim',
  };
}

export function replaceText(text: string, pattern: string, replacement: string, options: { regex?: boolean; global?: boolean; ignoreCase?: boolean } = {}): TextPipeResult {
  let output: string;

  if (options.regex) {
    const flags = (options.global !== false ? 'g' : '') + (options.ignoreCase ? 'i' : '');
    const regex = new RegExp(pattern, flags);
    output = text.replace(regex, replacement);
  } else {
    if (options.global !== false) {
      output = text.split(pattern).join(replacement);
    } else {
      output = text.replace(pattern, replacement);
    }
  }

  return {
    input: text,
    output,
    operation: 'replace',
  };
}

export function numberLines(text: string, options: { startFrom?: number; padding?: number } = {}): TextPipeResult {
  const lines = text.split('\n');
  const start = options.startFrom || 1;
  const maxNum = start + lines.length - 1;
  const padding = options.padding || maxNum.toString().length;

  const numbered = lines.map((line, i) => {
    const num = (start + i).toString().padStart(padding);
    return `${num}  ${line}`;
  });

  return {
    input: text,
    output: numbered.join('\n'),
    operation: 'number',
    lineCount: lines.length,
  };
}

export function countStats(text: string): { lines: number; words: number; chars: number; bytes: number } {
  const lines = text.split('\n').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const bytes = Buffer.byteLength(text, 'utf8');

  return { lines, words, chars, bytes };
}

export function reverseText(text: string, mode: 'chars' | 'words' | 'lines' = 'lines'): TextPipeResult {
  let output: string;

  switch (mode) {
    case 'chars':
      output = text.split('').reverse().join('');
      break;
    case 'words':
      output = text.split(/\s+/).reverse().join(' ');
      break;
    case 'lines':
      output = text.split('\n').reverse().join('\n');
      break;
    default:
      output = text;
  }

  return {
    input: text,
    output,
    operation: 'reverse',
  };
}

export function filterLines(text: string, pattern: string, options: { invert?: boolean; regex?: boolean } = {}): TextPipeResult {
  const lines = text.split('\n');
  let filtered: string[];

  if (options.regex) {
    const regex = new RegExp(pattern);
    filtered = lines.filter(line => {
      const matches = regex.test(line);
      return options.invert ? !matches : matches;
    });
  } else {
    filtered = lines.filter(line => {
      const matches = line.includes(pattern);
      return options.invert ? !matches : matches;
    });
  }

  return {
    input: text,
    output: filtered.join('\n'),
    operation: 'filter',
    lineCount: filtered.length,
  };
}

export function wrapText(text: string, width: number = 80): TextPipeResult {
  const lines = text.split('\n');
  const wrapped: string[] = [];

  for (const line of lines) {
    if (line.length <= width) {
      wrapped.push(line);
      continue;
    }

    const words = line.split(' ');
    let current = '';

    for (const word of words) {
      if (current.length + word.length + 1 <= width) {
        current += (current ? ' ' : '') + word;
      } else {
        if (current) wrapped.push(current);
        current = word;
      }
    }
    if (current) wrapped.push(current);
  }

  return {
    input: text,
    output: wrapped.join('\n'),
    operation: 'wrap',
    lineCount: wrapped.length,
  };
}
