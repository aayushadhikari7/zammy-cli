import chalk from 'chalk';

// Beautiful color palette
const palette = {
  rose: '#FF6B6B',
  coral: '#FF8E72',
  peach: '#FFEAA7',
  mint: '#96CEB4',
  teal: '#4ECDC4',
  sky: '#45B7D1',
  lavender: '#DDA0DD',
  purple: '#9B59B6',
  gold: '#FFD700',
  silver: '#C0C0C0',
};

export const theme = {
  primary: chalk.hex(palette.teal),
  secondary: chalk.hex(palette.lavender),
  success: chalk.hex('#2ECC71'),
  warning: chalk.hex('#F39C12'),
  error: chalk.hex('#E74C3C'),
  dim: chalk.hex('#6C7A89'),
  highlight: chalk.bold.white,
  command: chalk.bold.hex(palette.teal),
  prompt: chalk.bold.hex(palette.lavender),
  accent: chalk.hex(palette.rose),
  info: chalk.hex(palette.sky),
  muted: chalk.dim.hex('#95A5A6'),
  gold: chalk.hex(palette.gold),
  rose: chalk.hex(palette.rose),
  mint: chalk.hex(palette.mint),
  peach: chalk.hex(palette.peach),

  // Gradient text effects
  gradient: (text: string) => {
    const colors = [palette.rose, palette.coral, palette.peach, palette.mint, palette.teal];
    return text.split('').map((char, i) =>
      chalk.hex(colors[i % colors.length])(char)
    ).join('');
  },

  rainbow: (text: string) => {
    const colors = ['#FF6B6B', '#FF8E72', '#FFEAA7', '#96CEB4', '#4ECDC4', '#45B7D1', '#DDA0DD'];
    return text.split('').map((char, i) =>
      chalk.hex(colors[i % colors.length])(char)
    ).join('');
  },

  ocean: (text: string) => {
    const colors = ['#0077B6', '#00B4D8', '#48CAE4', '#90E0EF', '#CAF0F8'];
    return text.split('').map((char, i) =>
      chalk.hex(colors[i % colors.length])(char)
    ).join('');
  },

  sunset: (text: string) => {
    const colors = ['#FF6B6B', '#FF8E53', '#FFA07A', '#FFB347', '#FFD700'];
    return text.split('').map((char, i) =>
      chalk.hex(colors[i % colors.length])(char)
    ).join('');
  },

  // Bold variants
  b: {
    primary: chalk.bold.hex(palette.teal),
    secondary: chalk.bold.hex(palette.lavender),
    success: chalk.bold.hex('#2ECC71'),
    warning: chalk.bold.hex('#F39C12'),
    error: chalk.bold.hex('#E74C3C'),
  },
};

export const symbols = {
  // Basic UI
  arrow: '\u276F',      // ❯
  check: '\u2714',      // ✔
  cross: '\u2718',      // ✘
  info: '\u2139',       // ℹ
  warning: '\u26A0',    // ⚠
  bullet: '\u2022',     // •

  // Decorative
  star: '\u2605',       // ★
  heart: '\u2665',      // ♥
  diamond: '\u2666',    // ♦
  sparkle: '\u2728',    // ✨
  lightning: '\u26A1',  // ⚡

  // Emoji icons
  fire: '\u{1F525}',    // 🔥
  rocket: '\u{1F680}',  // 🚀
  dice: '\u{1F3B2}',    // 🎲
  coin: '\u{1FA99}',    // 🪙
  lock: '\u{1F512}',    // 🔒
  clock: '\u{1F552}',   // 🕒
  chart: '\u{1F4CA}',   // 📊
  note: '\u{1F4DD}',    // 📝
  scroll: '\u{1F4DC}',  // 📜
  clipboard: '\u{1F4CB}', // 📋
  palette: '\u{1F3A8}', // 🎨
  tomato: '\u{1F345}',  // 🍅
  coffee: '\u2615',     // ☕
  bell: '\u{1F514}',    // 🔔
  gear: '\u2699',       // ⚙
  folder: '\u{1F4C1}',  // 📁
  terminal: '\u{1F4BB}', // 💻
  key: '\u{1F511}',     // 🔑
  link: '\u{1F517}',    // 🔗
  hourglass: '\u23F3',  // ⏳
};

// Box drawing characters
const boxChars = {
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  sharp: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  heavy: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
};

// Box drawing helpers
export const box = {
  topLeft: '\u256D',     // ╭
  topRight: '\u256E',    // ╮
  bottomLeft: '\u2570',  // ╰
  bottomRight: '\u256F', // ╯
  horizontal: '\u2500',  // ─
  vertical: '\u2502',    // │

  draw: (content: string[], width: number = 50, style: 'rounded' | 'sharp' | 'double' | 'heavy' = 'rounded'): string => {
    const chars = boxChars[style];
    const lines: string[] = [];
    const innerWidth = width - 2;

    lines.push(theme.dim(`${chars.tl}${chars.h.repeat(innerWidth)}${chars.tr}`));

    content.forEach(line => {
      const stripped = line.replace(/\x1B\[[0-9;]*m/g, '');
      const padding = innerWidth - stripped.length;
      lines.push(theme.dim(chars.v) + line + ' '.repeat(Math.max(0, padding)) + theme.dim(chars.v));
    });

    lines.push(theme.dim(`${chars.bl}${chars.h.repeat(innerWidth)}${chars.br}`));

    return lines.join('\n');
  },

  // Simple title box
  title: (title: string, width: number = 50): string => {
    const chars = boxChars.rounded;
    const innerWidth = width - 2;
    const titleLen = title.replace(/\x1B\[[0-9;]*m/g, '').length;
    const leftPad = Math.floor((innerWidth - titleLen - 2) / 2);
    const rightPad = innerWidth - titleLen - 2 - leftPad;

    return theme.dim(`${chars.tl}${chars.h.repeat(leftPad)} `) +
      title +
      theme.dim(` ${chars.h.repeat(rightPad)}${chars.tr}`);
  },
};

// Divider lines
export const divider = {
  line: (width: number = 50) => theme.dim('─'.repeat(width)),
  dashed: (width: number = 50) => theme.dim('╌'.repeat(width)),
  dotted: (width: number = 50) => theme.dim('┄'.repeat(width)),
  double: (width: number = 50) => theme.dim('═'.repeat(width)),
  wave: (width: number = 50) => theme.dim('~'.repeat(width)),
  fancy: (width: number = 50) => theme.dim('•'.repeat(Math.floor(width / 2)).split('').join(' ')),
};

// Progress bar helper
export const progressBar = (percent: number, width: number = 30, showPercent: boolean = true): string => {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  let color = theme.success;
  if (percent > 70) color = theme.warning;
  if (percent > 90) color = theme.error;

  const bar = color('█'.repeat(filled)) + theme.dim('░'.repeat(empty));
  return showPercent ? `${bar} ${percent.toFixed(0)}%` : bar;
};

// Speech bubble for messages
export const bubble = {
  say: (text: string, width: number = 50): string => {
    const lines: string[] = [];
    const innerWidth = width - 4;

    // Word wrap
    const words = text.split(' ');
    let currentLine = '';
    const wrappedLines: string[] = [];

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= innerWidth) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) wrappedLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);

    // Draw bubble
    lines.push(theme.dim('  ╭' + '─'.repeat(innerWidth + 2) + '╮'));
    for (const line of wrappedLines) {
      const padding = innerWidth - line.length;
      lines.push(theme.dim('  │ ') + line + ' '.repeat(padding) + theme.dim(' │'));
    }
    lines.push(theme.dim('  ╰' + '─'.repeat(innerWidth + 2) + '╯'));
    lines.push(theme.dim('    ╲'));
    lines.push(theme.dim('     ╲'));

    return lines.join('\n');
  },

  think: (text: string, width: number = 50): string => {
    const lines: string[] = [];
    const innerWidth = width - 4;

    lines.push(theme.dim('  ╭' + '─'.repeat(innerWidth + 2) + '╮'));
    const padding = innerWidth - text.length;
    lines.push(theme.dim('  │ ') + text + ' '.repeat(Math.max(0, padding)) + theme.dim(' │'));
    lines.push(theme.dim('  ╰' + '─'.repeat(innerWidth + 2) + '╯'));
    lines.push(theme.dim('    ○'));
    lines.push(theme.dim('   ○'));

    return lines.join('\n');
  },
};

// Category icons for help
export const categoryIcons: Record<string, string> = {
  'Utilities': '🔧',
  'Fun': '🎮',
  'Creative': '🎨',
  'Dev': '💻',
  'Info': '📡',
};

// Spinner frames for loading animations
export const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Fancy loading dots
export const loadingDots = ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'];
