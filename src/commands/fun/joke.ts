import { registerCommand } from '../registry.js';
import { theme } from '../../ui/colors.js';

registerCommand({
  name: 'joke',
  description: 'Get a random joke',
  usage: '/joke',
  async execute(_args: string[]) {
    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');

      if (!response.ok) {
        console.log(theme.error('Could not fetch a joke. Try again!'));
        return;
      }

      const joke = await response.json() as { setup: string; punchline: string };

      console.log('');
      console.log(theme.primary(joke.setup));
      console.log('');

      // Small delay for comedic effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log(theme.success(joke.punchline));
      console.log('');
    } catch (error) {
      console.log(theme.error(`Error: ${error}`));
    }
  },
});
