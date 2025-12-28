import figlet from 'figlet';
import { theme, symbols, box } from './colors.js';

export async function displayBanner(): Promise<void> {
  return new Promise((resolve) => {
    figlet('ZAMMY', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
    }, (err, data) => {
      console.log('');

      if (err || !data) {
        // Fallback ASCII art
        console.log(theme.gradient('  ███████╗ █████╗ ███╗   ███╗███╗   ███╗██╗   ██╗'));
        console.log(theme.gradient('  ╚══███╔╝██╔══██╗████╗ ████║████╗ ████║╚██╗ ██╔╝'));
        console.log(theme.gradient('    ███╔╝ ███████║██╔████╔██║██╔████╔██║ ╚████╔╝ '));
        console.log(theme.gradient('   ███╔╝  ██╔══██║██║╚██╔╝██║██║╚██╔╝██║  ╚██╔╝  '));
        console.log(theme.gradient('  ███████╗██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║   ██║   '));
        console.log(theme.gradient('  ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝   ╚═╝   '));
      } else {
        // Apply gradient to figlet output
        data.split('\n').forEach(line => {
          console.log(theme.gradient(line));
        });
      }

      console.log('');
      console.log(`  ${symbols.sparkle} ${theme.secondary('Your slice-of-life terminal companion')} ${symbols.sparkle}`);
      console.log('');
      console.log(theme.dim(`  ${symbols.arrow} Type ${theme.primary('/')} to browse commands (use ${theme.primary('\u2191\u2193')} to navigate, ${theme.primary('Tab')} to select)`));
      console.log(theme.dim(`  ${symbols.arrow} Type ${theme.primary('/help')} for full command list`));
      console.log(theme.dim(`  ${symbols.arrow} Shell commands start with ${theme.primary('!')} (e.g., ${theme.primary('!ls')}, ${theme.primary('!cd')})`));
      console.log('');

      resolve();
    });
  });
}
