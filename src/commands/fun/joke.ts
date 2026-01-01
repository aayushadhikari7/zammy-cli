import { registerCommand } from '../registry.js';
import { theme, symbols, bubble } from '../../ui/colors.js';

// Fallback jokes for offline use
const fallbackJokes = [
  { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!" },
  { setup: "Why do Java developers wear glasses?", punchline: "Because they can't C#!" },
  { setup: "A SQL query walks into a bar, walks up to two tables and asks...", punchline: "Can I join you?" },
  { setup: "Why did the developer go broke?", punchline: "Because he used up all his cache!" },
  { setup: "How many programmers does it take to change a light bulb?", punchline: "None, that's a hardware problem!" },
  { setup: "Why do programmers hate nature?", punchline: "It has too many bugs!" },
  { setup: "What's a programmer's favorite hangout place?", punchline: "Foo Bar!" },
  { setup: "Why was the JavaScript developer sad?", punchline: "Because he didn't Node how to Express himself!" },
  { setup: "What do you call a computer that sings?", punchline: "A-Dell!" },
  { setup: "Why did the developer quit his job?", punchline: "Because he didn't get arrays (a raise)!" },
];

// Fetch joke from multiple APIs with fallback
async function fetchJoke(): Promise<{ setup: string; punchline: string }> {
  // Try JokeAPI first (programming category)
  try {
    const response = await fetch('https://v2.jokeapi.dev/joke/Programming?type=twopart&safe-mode', {
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json() as { error: boolean; setup?: string; delivery?: string };
      if (!data.error && data.setup && data.delivery) {
        return { setup: data.setup, punchline: data.delivery };
      }
    }
  } catch {
    // Fall through to next API
  }

  // Try official-joke-api as backup
  try {
    const response = await fetch('https://official-joke-api.appspot.com/jokes/programming/random', {
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json() as Array<{ setup: string; punchline: string }>;
      if (data && data[0]) {
        return { setup: data[0].setup, punchline: data[0].punchline };
      }
    }
  } catch {
    // Fall through to fallback
  }

  // Use fallback
  return fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
}

registerCommand({
  name: 'joke',
  description: 'Get a random programming joke',
  usage: '/joke',
  async execute(_args: string[]) {
    console.log('');
    console.log(`  ${symbols.dice} ${theme.sunset('Getting a joke...')}`);

    const joke = await fetchJoke();

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
  },
});
