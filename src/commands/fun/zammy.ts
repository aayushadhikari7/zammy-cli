import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { slimeFrames, getGreeting, miniSlime, validMoods } from '../../ui/slime-animated.js';

// Terminal width thresholds
const MIN_WIDTH_FOR_MASCOT = 50;
const MIN_WIDTH_FOR_ASCII = 70;

// ASCII art version of Zammy
const asciiMascot = `
                       **/***********,
                  ******   **//////////****
                ***/**///////////////////////**
              ****///////////**////////////////(**
             ***////& &////////////% &////* ,////(**
            *//////&&&/////////////&&&//(/////((((((*
           **/////////&&&&&&&&&&&&////(//((/(((((((((/*
           **/////////&&&&&&/****&&//((* /(((((((((((((*
           ,*////* *///&&&*******&*/(((((((((((((((((((**
            **////////////*//(**(/(/((((((((((((((((/(((*
             **//////////////(((/(((((((((/ .*((((((((((**
               **////////(/((((/((((((((((((((((((((((((/*
                  **(((///(((((//((((((((((((((((((((((#**
                      **/((((((((((((((((/*(((((((((((((*
                           ***((((((((((((((((((#(((((**    */*///
                                    *****************       *((((    .*/
`;

registerCommand({
  name: 'zammy',
  description: 'Say hi to Zammy the slime!',
  usage: '/zammy [mood|ascii|moods]',
  async execute(args: string[]) {
    const mood = args[0] || 'happy';
    const termWidth = process.stdout.columns || 80;

    // Show ASCII art version
    if (mood === 'ascii' || mood === 'mascot') {
      console.log('');
      if (termWidth < MIN_WIDTH_FOR_ASCII) {
        // Fallback to mini slime for narrow terminals
        console.log(`  ${miniSlime.happy} Hi! I'm Zammy!`);
        console.log(`  ${theme.dim('(widen your terminal to see my full form!)')}`);
      } else {
        console.log(theme.primary(asciiMascot));
      }
      console.log(`  ${theme.secondary(`"${getGreeting()}"`)}`);
      console.log('');
      return;
    }

    if (mood === 'moods' || mood === 'all') {
      console.log('');
      console.log(`  ${symbols.sparkle} ${theme.primary("Zammy's moods:")} ${symbols.sparkle}`);
      console.log('');

      // Check if terminal is wide enough for full mascot display
      if (termWidth < MIN_WIDTH_FOR_MASCOT) {
        // Show mini slimes instead
        for (const m of validMoods) {
          const mini = miniSlime[m as keyof typeof miniSlime];
          if (mini) {
            console.log(`  ${mini}  ${theme.dim(m)}`);
          }
        }
        console.log('');
        console.log(`  ${theme.dim('(widen your terminal to see full mood sprites!)')}`);
      } else {
        for (const m of validMoods) {
          const frameFunc = slimeFrames[m as keyof typeof slimeFrames];
          if (frameFunc) {
            console.log(theme.secondary(`  ─── ${m.toUpperCase()} ───`));
            const art = frameFunc();
            art.forEach(line => console.log('  ' + line));
            console.log('');
          }
        }
      }
      return;
    }

    if (!validMoods.includes(mood)) {
      console.log('');
      console.log(`  ${miniSlime.surprised} ${theme.warning("I don't know that mood!")}`);
      console.log(`  ${theme.dim(`Try: ${validMoods.join(', ')}, ascii`)}`);
      console.log(`  ${theme.dim(`Or: /zammy moods`)}`);
      console.log('');
      return;
    }

    const frameFunc = slimeFrames[mood as keyof typeof slimeFrames];
    const greeting = getGreeting();

    console.log('');
    // Show full mascot or mini slime based on terminal width
    if (termWidth < MIN_WIDTH_FOR_MASCOT) {
      const mini = miniSlime[mood as keyof typeof miniSlime] || miniSlime.happy;
      console.log(`  ${mini}`);
    } else if (frameFunc) {
      const art = frameFunc();
      art.forEach(line => console.log('  ' + line));
    }
    console.log('');
    console.log(`  ${theme.secondary(`"${greeting}"`)}`);
    console.log('');
    console.log(`  ${theme.dim("I'm Zammy, your CLI buddy! Type /help to see what I can do~")}`);
    console.log('');
  },
});
