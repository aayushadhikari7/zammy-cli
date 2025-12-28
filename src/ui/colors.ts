import chalk from 'chalk';

export const theme = {
  primary: chalk.cyan,
  secondary: chalk.magenta,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  dim: chalk.gray,
  highlight: chalk.bold.white,
  command: chalk.bold.cyan,
  prompt: chalk.bold.magenta,
  accent: chalk.hex('#FF6B6B'),
  info: chalk.blueBright,
  muted: chalk.dim.gray,
  gold: chalk.hex('#FFD700'),
  gradient: (text: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    return text.split('').map((char, i) =>
      chalk.hex(colors[i % colors.length])(char)
    ).join('');
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

// Box drawing helpers
export const box = {
  topLeft: '\u256D',     // ╭
  topRight: '\u256E',    // ╮
  bottomLeft: '\u2570',  // ╰
  bottomRight: '\u256F', // ╯
  horizontal: '\u2500',  // ─
  vertical: '\u2502',    // │

  draw: (content: string[], width: number = 50): string => {
    const lines: string[] = [];
    const innerWidth = width - 2;

    lines.push(theme.dim(`${box.topLeft}${box.horizontal.repeat(innerWidth)}${box.topRight}`));

    content.forEach(line => {
      const stripped = line.replace(/\x1B\[[0-9;]*m/g, '');
      const padding = innerWidth - stripped.length;
      lines.push(theme.dim(box.vertical) + line + ' '.repeat(Math.max(0, padding)) + theme.dim(box.vertical));
    });

    lines.push(theme.dim(`${box.bottomLeft}${box.horizontal.repeat(innerWidth)}${box.bottomRight}`));

    return lines.join('\n');
  },
};

// Spinner frames for loading animations
export const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
