import { registerCommand } from './registry.js';
import { theme, symbols } from '../ui/colors.js';

const fortunes = [
  "A beautiful, smart, and loving person will be coming into your life.",
  "A dubious friend may be an enemy in camouflage.",
  "A faithful friend is a strong defense.",
  "A fresh start will put you on your way.",
  "A golden egg of opportunity falls into your lap this month.",
  "A good time to finish up old tasks.",
  "A hunch is creativity trying to tell you something.",
  "A lifetime of happiness lies ahead of you.",
  "A light heart carries you through all the hard times.",
  "A new perspective will come with the new year.",
  "Accept something that you cannot change, and you will feel better.",
  "Adventure can be real happiness.",
  "Believe in yourself and others will too.",
  "Better ask twice than lose yourself once.",
  "Carve your name on your heart and not on marble.",
  "Change is happening in your life, so go with the flow!",
  "Curiosity kills boredom. Nothing can kill curiosity.",
  "Dedicate yourself with a calm mind to the task at hand.",
  "Discontent is the first step in the progress of a man or a nation.",
  "Distance yourself from the vain.",
  "Don't be discouraged, because every wrong attempt discarded is another step forward.",
  "Don't let your limitations overshadow your talents.",
  "Don't worry; prosperity will knock on your door soon.",
  "Every flower blooms in its own sweet time.",
  "Failure is the tuition you pay for success.",
  "Fortune not found. Abort, Retry, Ignore?",
  "Good news will come to you by mail.",
  "Hard work pays off in the future, laziness pays off now.",
  "He who laughs at himself never runs out of things to laugh at.",
  "If you refuse to accept anything but the best, you very often get it.",
  "It is never too late to become what you might have been.",
  "It's okay to look at the past and future. Just don't stare.",
  "Keep your face to the sunshine and you will never see shadows.",
  "Love is like wildflowers; it's often found in the most unlikely places.",
  "Nothing is impossible to a willing heart.",
  "Now is the time to try something new.",
  "Perhaps you've been too busy putting out fires.",
  "Smile when picking out the fruit but not when you pick out the gems.",
  "Someone is thinking of you.",
  "Soon you will be surrounded by good friends and laughter.",
  "Stop procrastinating. Starting tomorrow.",
  "The early bird gets the worm, but the second mouse gets the cheese.",
  "The greatest risk is not taking one.",
  "The harder you work, the luckier you get.",
  "The only way to have a friend is to be one.",
  "The person who will not stand for something will fall for anything.",
  "The secret to getting ahead is getting started.",
  "Today is a good day for new beginnings.",
  "You will be successful in your work.",
  "Your life will be happy and peaceful.",
  "Your road to glory will be rocky, but fulfilling.",
];

const luckyItems = [
  "rubber duck debugging",
  "coffee",
  "mechanical keyboard",
  "dark mode",
  "git push --force",
  "Stack Overflow",
  "semicolons",
  "tabs",
  "spaces",
  "vim",
  "emacs",
  "VSCode",
  "console.log",
  "sudo",
];

registerCommand({
  name: 'fortune',
  description: 'Get your fortune told',
  usage: '/fortune',
  async execute(_args: string[]) {
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    const luckyItem = luckyItems[Math.floor(Math.random() * luckyItems.length)];
    const luckyNumber = Math.floor(Math.random() * 100);

    const cookieArt = [
      '        ╭─────────────────────────────────────────╮',
      '       ╱                                           ╲',
      '      ╱                                             ╲',
      '     ╱                                               ╲',
      '    │                                                 │',
      '    │                                                 │',
      '     ╲                                               ╱',
      '      ╲                                             ╱',
      '       ╲___________________________________________╱',
    ];

    console.log('');
    console.log(`  ${symbols.sparkle} ${theme.gold('FORTUNE COOKIE')} ${symbols.sparkle}`);
    console.log('');

    cookieArt.forEach(line => console.log('  ' + theme.gold(line)));

    console.log('');
    console.log(`  ${theme.highlight('"' + fortune + '"')}`);
    console.log('');
    console.log(`  ${theme.dim('Lucky number:')} ${theme.primary(luckyNumber.toString())}`);
    console.log(`  ${theme.dim('Lucky item:')} ${theme.primary(luckyItem)}`);
    console.log('');
  },
});
