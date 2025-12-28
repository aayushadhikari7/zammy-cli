import { registerCommand } from '../registry.js';
import { theme, symbols, bubble } from '../../ui/colors.js';

const fallbackJokes = [
  { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!" },
  { setup: "Why do Java developers wear glasses?", punchline: "Because they can't C#!" },
  { setup: "A SQL query walks into a bar, walks up to two tables and asks...", punchline: "Can I join you?" },
  { setup: "Why did the developer go broke?", punchline: "Because he used up all his cache!" },
  { setup: "How many programmers does it take to change a light bulb?", punchline: "None, that's a hardware problem!" },
];

registerCommand({
  name: 'joke',
  description: 'Get a random joke',
  usage: '/joke',
  async execute(_args: string[]) {
    console.log('');
    console.log(`  ${symbols.dice} ${theme.sunset('Getting a joke...')}`);

    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke', {
        signal: AbortSignal.timeout(3000),
      });

      let joke: { setup: string; punchline: string };

      if (!response.ok) {
        joke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
      } else {
        joke = await response.json() as { setup: string; punchline: string };
      }

      // Clear the loading message
      process.stdout.write('\x1B[1A\x1B[2K');

      console.log('');
      console.log(bubble.say(joke.setup, 55));
      console.log(`       ${symbols.sparkle}`);

      // Small delay for comedic effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('');
      console.log(`  ${theme.gold('  ✦')} ${theme.b.success(joke.punchline)} ${theme.gold('✦')}`);
      console.log('');
      console.log(`  ${theme.dim('───────────────────────────────────')}`);
      console.log(`  ${symbols.dice} ${theme.dim('Run /joke again for another!')}`);
      console.log('');
    } catch (error) {
      // Use fallback on error
      process.stdout.write('\x1B[1A\x1B[2K');

      const joke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];

      console.log('');
      console.log(bubble.say(joke.setup, 55));
      console.log(`       ${symbols.sparkle}`);

      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('');
      console.log(`  ${theme.gold('  ✦')} ${theme.b.success(joke.punchline)} ${theme.gold('✦')}`);
      console.log('');
    }
  },
});
