import figlet from 'figlet';
import chalk from 'chalk';
import { theme, symbols } from './colors.js';
import { getGreeting, getStartupMood } from './slime-animated.js';

// Color palette for slime (matching reference image)
const C = {
  // Purple gradient (light to dark)
  P1: '#4A235A',  // Darkest edge
  P2: '#7D3C98',  // Dark purple
  P3: '#9B59B6',  // Main purple
  P4: '#BB8FCE',  // Light purple
  P5: '#D7BDE2',  // Lightest
  // Accents
  WH: '#FFFFFF',  // White (sparkles, eye highlight)
  BK: '#1A1A2E',  // Black (eyes, mouth)
  PK: '#E91E63',  // Pink (tongue)
};

// Block helpers
const b = (hex: string) => chalk.bgHex(hex)('  ');
const dot = chalk.hex(C.WH)('·');

// Generate slime - rounder blob with residue like reference
function getSlimeLines(isBlinking: boolean, _mood: string): string[] {
  const { P1, P2, P3, P4, P5, WH, BK, PK } = C;

  // Eyes: open or closed (blinking)
  const openEye = chalk.bgHex(BK).hex(WH)(' ·');  // Black with white shine
  const closedEye = chalk.bgHex(P3).hex(BK)('──');  // Closed line
  const eyeL = isBlinking ? closedEye : openEye;
  const eyeR = isBlinking ? closedEye : openEye;

  // Sparkle on body
  const shine = chalk.bgHex(P3).hex(WH)(' ·');
  const shine2 = chalk.bgHex(P4).hex(WH)('· ');

  // Small residue blob
  const miniBlob = `${b(P3)}`;

  return [
    `        ${dot}                 ${dot}`,
    `          ${b(P5)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P4)}${b(P5)}`,
    `        ${b(P5)}${b(P4)}${b(P3)}${shine2}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}${b(P5)}`,
    `        ${b(P4)}${b(P3)}${eyeL}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${eyeR}${b(P3)}${b(P4)}`,
    `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P3)}${b(P3)}${b(P4)}`,
    `        ${b(P4)}${b(P3)}${b(P3)}${b(P3)}${b(BK)}${b(PK)}${b(BK)}${b(P3)}${b(P3)}${b(P4)}`,
    `          ${b(P2)}${b(P3)}${b(P3)}${b(P3)}${shine}${b(P3)}${b(P3)}${b(P2)}`,
    `            ${b(P1)}${b(P2)}${b(P2)}${b(P2)}${b(P2)}${b(P1)}    ${miniBlob}`,
  ];
}

// Terminal width thresholds
const MIN_WIDTH_FOR_MASCOT = 90;   // Need this width for logo + slime side by side
const MIN_WIDTH_FOR_FULL_LOGO = 55; // Need this for full figlet logo
const MIN_WIDTH_FOR_COMPACT = 30;   // Minimum for any display

export async function displayBanner(simple: boolean = false): Promise<void> {
  return new Promise((resolve) => {
    const termWidth = process.stdout.columns || 80;

    figlet('ZAMMY', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
    }, async (err, data) => {
      console.log('');

      const greeting = getGreeting();
      const mood = getStartupMood();

      // Very narrow terminal - minimal display
      if (termWidth < MIN_WIDTH_FOR_COMPACT) {
        console.log(theme.gradient('  ZAMMY'));
        console.log(theme.secondary(`  "${greeting}"`));
        console.log(theme.dim('  Type /help for commands'));
        console.log('');
        resolve();
        return;
      }

      // Get figlet lines
      let figletLines: string[] = [];
      if (err || !data || termWidth < MIN_WIDTH_FOR_FULL_LOGO) {
        // Compact fallback for narrow terminals
        if (termWidth < MIN_WIDTH_FOR_FULL_LOGO) {
          figletLines = [
            '╔═══════════════════════╗',
            '║    Z A M M Y          ║',
            '╚═══════════════════════╝',
          ];
        } else {
          // Fallback logo with box drawing
          figletLines = [
            '███████╗ █████╗ ███╗   ███╗███╗   ███╗██╗   ██╗',
            '╚══███╔╝██╔══██╗████╗ ████║████╗ ████║╚██╗ ██╔╝',
            '  ███╔╝ ███████║██╔████╔██║██╔████╔██║ ╚████╔╝ ',
            ' ███╔╝  ██╔══██║██║╚██╔╝██║██║╚██╔╝██║  ╚██╔╝  ',
            '███████╗██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║   ██║   ',
            '╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝   ╚═╝   ',
          ];
        }
      } else {
        figletLines = data.split('\n').filter(line => line.trim());
      }

      // Simple mode OR narrow terminal: just show logo without mascot or animation
      const showMascot = !simple && termWidth >= MIN_WIDTH_FOR_MASCOT;

      if (!showMascot) {
        figletLines.forEach(line => console.log('  ' + theme.gradient(line)));
        console.log('');
        console.log(theme.secondary(`  "${greeting}"`));
        console.log('');
        console.log(theme.dim(`  ${symbols.arrow} Type ${theme.primary('/')} to browse commands or ${theme.primary('/help')} for full list`));
        console.log(theme.dim(`  ${symbols.arrow} Shell commands start with ${theme.primary('!')} (e.g., ${theme.primary('!ls')}, ${theme.primary('!git')})`));
        console.log('');
        resolve();
        return;
      }

      // Wide terminal: show logo with animated mascot
      // Pad figlet lines to consistent width
      const figletWidth = 50;
      const paddedFiglet = figletLines.map(line => line.padEnd(figletWidth));

      // Blink animation sequence: open, open, open, blink, open, open
      const blinkSequence = [false, false, false, true, false, false];
      const frameTime = 180;

      process.stdout.write('\x1b[?25l'); // Hide cursor

      for (let frame = 0; frame < blinkSequence.length; frame++) {
        const isBlinking = blinkSequence[frame];
        const slimeLines = getSlimeLines(isBlinking, mood);

        // Clear previous frame (except first)
        if (frame > 0) {
          const totalLines = Math.max(paddedFiglet.length, slimeLines.length) + 1;
          process.stdout.write(`\x1b[${totalLines}A`);
        }

        // Print combined banner - logo with slime beside it
        const maxLines = Math.max(paddedFiglet.length, slimeLines.length);
        for (let i = 0; i < maxLines; i++) {
          const figLine = paddedFiglet[i] || ''.padEnd(figletWidth);
          const slimeLine = slimeLines[i] || '';
          console.log('  ' + theme.gradient(figLine) + ' ' + slimeLine);
        }
        console.log('');

        await new Promise(r => setTimeout(r, frameTime));
      }

      process.stdout.write('\x1b[?25h'); // Show cursor

      console.log(theme.secondary(`  "${greeting}"`));
      console.log('');
      console.log(theme.dim(`  ${symbols.arrow} Type ${theme.primary('/')} to browse commands or ${theme.primary('/help')} for full list`));
      console.log(theme.dim(`  ${symbols.arrow} Shell commands start with ${theme.primary('!')} (e.g., ${theme.primary('!ls')}, ${theme.primary('!git')})`));
      console.log('');

      resolve();
    });
  });
}
