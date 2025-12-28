import chalk from 'chalk';

// Color palette (matching banner mascot)
const C = {
  P1: '#4A235A', // Darkest edge
  P2: '#7D3C98', // Dark purple
  P3: '#9B59B6', // Main purple
  P4: '#BB8FCE', // Light purple
  P5: '#D7BDE2', // Lightest highlight
  WH: '#FFFFFF', // White (sparkles, eye shine)
  BK: '#1A1A2E', // Black (eyes, mouth)
  PK: '#E91E63', // Pink (tongue)
  YL: '#F1C40F', // Yellow (stars)
  BL: '#3498DB', // Blue (tears)
  CY: '#00CED1', // Cyan (zzz)
  RD: '#E74C3C', // Red (angry)
};

// Block helper - 2 spaces with bg color
const b = (hex: string) => chalk.bgHex(hex)('  ');

// Sparkle decorations
const dot = chalk.hex(C.WH)('·');
const star = chalk.hex(C.WH)('✦');
const heart = chalk.hex(C.PK)('♥');
const z = chalk.hex(C.CY)('z');
const Z = chalk.hex(C.CY)('Z');

// Standard eye
const eye = chalk.bgHex(C.BK).hex(C.WH)(' ·');
// Sparkle on body
const shine = chalk.bgHex(C.P3).hex(C.WH)(' ·');
const shine2 = chalk.bgHex(C.P4).hex(C.WH)('· ');

// ═══════════════════════════════════════════════════════════════════════════
// MOOD FRAMES - Matching banner mascot style (wider, no half-blocks)
// ═══════════════════════════════════════════════════════════════════════════

export const slimeFrames = {
  happy: (): string[] => {
    const { P1, P2, P3, P4, P5, BK, PK } = C;
    return [
      `        ${dot}                 ${dot}`,
      `          ${b(P5)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P5)}`,
      `        ${b(P5)}${b(P4)}${b(P3)}${shine2}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}${b(P5)}`,
      `        ${b(P4)}${b(P3)}${eye}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${eye}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(BK)}${b(PK)}${b(BK)}${b(P3)}${b(P3)}${b(P4)}`,
      `          ${b(P2)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P2)}`,
      `            ${b(P1)}${b(P2)}${b(P2)}${b(P2)}${b(P2)}${b(P1)}`,
    ];
  },

  excited: (): string[] => {
    const { P1, P2, P3, P4, P5, BK, PK, YL } = C;
    const starEye = chalk.bgHex(YL).hex(C.WH)('★ ');
    return [
      `      ${star} ${dot}     ${star}   ${dot} ${star}`,
      `          ${b(P5)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P5)}`,
      `        ${b(P5)}${b(P4)}${b(P3)}${shine2}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}${b(P5)}`,
      `        ${b(P4)}${b(P3)}${starEye}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${starEye}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(BK)}${b(PK)}${b(BK)}${b(P3)}${b(P3)}${b(P4)}`,
      `          ${b(P2)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P2)}`,
      `            ${b(P1)}${b(P2)}${b(P2)}${b(P2)}${b(P2)}${b(P1)}`,
    ];
  },

  love: (): string[] => {
    const { P1, P2, P3, P4, P5, BK, PK } = C;
    const heartEye = chalk.bgHex(PK).hex(C.WH)('♥ ');
    return [
      `        ${heart}               ${heart}`,
      `          ${b(P5)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P5)}`,
      `        ${b(P5)}${b(P4)}${b(P3)}${shine2}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}${b(P5)}`,
      `        ${b(P4)}${b(P3)}${heartEye}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${heartEye}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(BK)}${b(PK)}${b(BK)}${b(P3)}${b(P3)}${b(P4)}`,
      `          ${b(P2)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P2)}`,
      `            ${b(P1)}${b(P2)}${b(P2)}${b(P2)}${b(P2)}${b(P1)}`,
    ];
  },

  sleepy: (): string[] => {
    const { P1, P2, P3, P4, P5, BK } = C;
    const closedEye = chalk.bgHex(P3).hex(BK)('──');
    return [
      `                        ${z} ${z} ${Z}`,
      `          ${b(P5)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P5)}`,
      `        ${b(P5)}${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}${b(P5)}`,
      `        ${b(P4)}${b(P3)}${closedEye}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${closedEye}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(BK)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `          ${b(P2)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P2)}`,
      `            ${b(P1)}${b(P2)}${b(P2)}${b(P2)}${b(P2)}${b(P1)}`,
    ];
  },

  thinking: (): string[] => {
    const { P1, P2, P3, P4, P5, BK, YL } = C;
    const thinkEye = chalk.bgHex(C.BK).hex(C.WH)(' ·');
    const lookUpEye = chalk.bgHex(C.BK).hex(C.WH)('· ');
    return [
      `                          ${chalk.hex(YL)('?')}`,
      `          ${b(P5)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P5)}`,
      `        ${b(P5)}${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}${b(P5)}`,
      `        ${b(P4)}${b(P3)}${thinkEye}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${lookUpEye}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(BK)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `          ${b(P2)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P2)}`,
      `            ${b(P1)}${b(P2)}${b(P2)}${b(P2)}${b(P2)}${b(P1)}`,
    ];
  },

  surprised: (): string[] => {
    const { P1, P2, P3, P4, P5, BK, YL } = C;
    const bigEye = chalk.bgHex(BK).hex(C.WH)('◉ ');
    return [
      `          ${chalk.hex(YL)('!!')}`,
      `          ${b(P5)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P5)}`,
      `        ${b(P5)}${b(P4)}${b(P3)}${shine2}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}${b(P5)}`,
      `        ${b(P4)}${b(P3)}${bigEye}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${bigEye}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(BK)}${b(BK)}${b(BK)}${b(P3)}${b(P3)}${b(P4)}`,
      `          ${b(P2)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P2)}`,
      `            ${b(P1)}${b(P2)}${b(P2)}${b(P2)}${b(P2)}${b(P1)}`,
    ];
  },

  sad: (): string[] => {
    const { P1, P2, P3, P4, P5, BK, BL } = C;
    const sadEye = chalk.bgHex(BK).hex(C.WH)(' ·');
    const tear = chalk.bgHex(BL)('  ');
    return [
      `        ${dot}       ${dot}       ${dot}`,
      `          ${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${sadEye}${tear}${b(P3)}${b(P3)}${tear}${sadEye}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(BK)}${b(BK)}${b(BK)}${b(P3)}${b(P3)}${b(P4)}`,
      `          ${b(P2)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P2)}`,
      `            ${b(P1)}${b(P2)}${b(P2)}${b(P2)}${b(P2)}${b(P1)}`,
    ];
  },

  wink: (): string[] => {
    const { P1, P2, P3, P4, P5, BK, PK } = C;
    const winkEye = chalk.bgHex(P3).hex(BK)('> ');
    return [
      `        ${star}               ${dot}`,
      `          ${b(P5)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P5)}`,
      `        ${b(P5)}${b(P4)}${b(P3)}${shine2}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}${b(P5)}`,
      `        ${b(P4)}${b(P3)}${eye}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${winkEye}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(BK)}${b(PK)}${b(BK)}${b(P3)}${b(P3)}${b(P4)}`,
      `          ${b(P2)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P2)}`,
      `            ${b(P1)}${b(P2)}${b(P2)}${b(P2)}${b(P2)}${b(P1)}`,
    ];
  },

  angry: (): string[] => {
    const { P1, P2, P3, P4, BK, RD } = C;
    const angryEye = chalk.bgHex(BK).hex(RD)('> ');
    const angryEye2 = chalk.bgHex(BK).hex(RD)(' <');
    return [
      `          ${chalk.hex(RD)('# @!')}`,
      `          ${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${angryEye}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${angryEye2}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
      `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(BK)}${b(BK)}${b(BK)}${b(P3)}${b(P3)}${b(P4)}`,
      `          ${b(P2)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P2)}`,
      `            ${b(P1)}${b(P2)}${b(P2)}${b(P2)}${b(P2)}${b(P1)}`,
    ];
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// GREETINGS & REACTIONS
// ═══════════════════════════════════════════════════════════════════════════

const greetings = [
  "Hiii~! I'm Zammy!",
  "Ready to get stuff done?",
  "*bounces* What's the plan?",
  "Type / to see commands!",
  "*jiggles excitedly* Let's go!",
  "*sparkles* Hi friend!",
];

const lateNightGreetings = [
  "*yawns* Burning the midnight oil?",
  "zzZ... oh! You're still up?",
  "*sleepy bounce* Late night coding?",
  "The best code happens at 3am~",
];

const morningGreetings = [
  "*stretches* Good morning~!",
  "Rise and shine!",
  "*bounces awake* New day!",
  "Morning! Coffee first?",
];

export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 5) {
    return lateNightGreetings[Math.floor(Math.random() * lateNightGreetings.length)];
  } else if (hour >= 5 && hour < 12) {
    return morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
  }
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export function getStartupMood(): keyof typeof slimeFrames {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) return 'sleepy';
  return 'happy';
}

// ═══════════════════════════════════════════════════════════════════════════
// MINI SLIMES (inline text versions)
// ═══════════════════════════════════════════════════════════════════════════

export const miniSlime = {
  happy: chalk.hex(C.P3)('(') + chalk.hex(C.BK)('◕') + chalk.hex(C.P3)('ᴗ') + chalk.hex(C.BK)('◕') + chalk.hex(C.P3)(')'),
  excited: chalk.hex(C.P3)('(') + chalk.hex(C.YL)('★') + chalk.hex(C.P3)('ᴗ') + chalk.hex(C.YL)('★') + chalk.hex(C.P3)(')'),
  love: chalk.hex(C.P3)('(') + chalk.hex(C.PK)('♥') + chalk.hex(C.P3)('ᴗ') + chalk.hex(C.PK)('♥') + chalk.hex(C.P3)(')'),
  sleepy: chalk.hex(C.P3)('(') + chalk.hex(C.BK)('–') + chalk.hex(C.P3)('ω') + chalk.hex(C.BK)('–') + chalk.hex(C.P3)(') zZ'),
  sad: chalk.hex(C.P3)('(') + chalk.hex(C.BK)('◕') + chalk.hex(C.P3)('︵') + chalk.hex(C.BK)('◕') + chalk.hex(C.P3)(')'),
  surprised: chalk.hex(C.P3)('(') + chalk.hex(C.BK)('◎') + chalk.hex(C.P3)('○') + chalk.hex(C.BK)('◎') + chalk.hex(C.P3)(')!'),
  wink: chalk.hex(C.P3)('(') + chalk.hex(C.BK)('◕') + chalk.hex(C.P3)('ᴗ') + chalk.hex(C.BK)('>') + chalk.hex(C.P3)(')'),
  thinking: chalk.hex(C.P3)('(') + chalk.hex(C.BK)('◕') + chalk.hex(C.P3)('～') + chalk.hex(C.BK)('◔') + chalk.hex(C.P3)(')'),
  angry: chalk.hex(C.P3)('(') + chalk.hex(C.RD)('>') + chalk.hex(C.P3)('_') + chalk.hex(C.RD)('<') + chalk.hex(C.P3)(')'),
};

export const validMoods = Object.keys(slimeFrames);

// ═══════════════════════════════════════════════════════════════════════════
// REACTION SYSTEM - Show mini slime with mood
// ═══════════════════════════════════════════════════════════════════════════

export type Mood = keyof typeof slimeFrames;

// React with a mini slime inline
export function react(mood: Mood, message?: string): void {
  const slime = miniSlime[mood as keyof typeof miniSlime] || miniSlime.happy;
  if (message) {
    console.log(`  ${slime} ${message}`);
  } else {
    console.log(`  ${slime}`);
  }
}

// Minimum terminal width for full mascot display
const MIN_WIDTH_FOR_MASCOT = 50;

// Show full mascot with mood (only if terminal is wide enough)
export function showMascot(mood: Mood): void {
  const termWidth = process.stdout.columns || 80;

  // If terminal too narrow, fall back to mini slime
  if (termWidth < MIN_WIDTH_FOR_MASCOT) {
    react(mood);
    return;
  }

  const frameFunc = slimeFrames[mood];
  if (frameFunc) {
    const art = frameFunc();
    console.log('');
    art.forEach(line => console.log('  ' + line));
    console.log('');
  }
}

// Get a random mood for fun displays
export function getRandomMood(): Mood {
  const moods: Mood[] = ['happy', 'excited', 'love', 'wink', 'surprised'];
  return moods[Math.floor(Math.random() * moods.length)];
}

// Get mood based on keywords in text
export function getMoodFromText(text: string): Mood | null {
  const lower = text.toLowerCase();

  // Love/thanks keywords
  if (/\b(thanks|thank you|love|love you|thx|ty|<3|heart)\b/.test(lower)) {
    return 'love';
  }

  // Excited keywords
  if (/\b(awesome|amazing|wow|cool|nice|great|perfect|yay|woohoo|!\s*$)\b/.test(lower)) {
    return 'excited';
  }

  // Sleepy keywords
  if (/\b(tired|sleepy|zzz|night|late|exhausted)\b/.test(lower)) {
    return 'sleepy';
  }

  // Angry/frustrated keywords (triggers Zammy's "angry" reaction)
  // NOTE: These words are only used for mood detection to show a sympathetic
  // reaction when users express frustration. Zammy's here to help, not judge!
  if (/\b(angry|mad|hate|stupid|wtf|damn|crap|sucks|ugh|argh|grr)\b|:\(/.test(lower)) {
    return 'angry';
  }

  // Sad keywords
  if (/\b(sad|sorry|fail|broke|wrong)\b/.test(lower)) {
    return 'sad';
  }

  // Confused/thinking keywords
  if (/\b(hmm|think|wonder|maybe|idk|not sure|confused|\?$)\b/.test(lower)) {
    return 'thinking';
  }

  return null;
}
