import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { getAllEnvVars, getEnvVar, searchEnvVars, getPathEntries } from '../../handlers/utilities/env.js';

registerCommand({
  name: 'env',
  description: 'View environment variables',
  usage: '/env [name|search|path]',
  async execute(args: string[]) {
    const action = args[0];

    console.log('');

    if (!action) {
      // Show all env vars
      const vars = getAllEnvVars();
      console.log(`  ${symbols.sparkle} ${theme.gradient('ENVIRONMENT VARIABLES')} ${theme.dim(`(${vars.length})`)}`);
      console.log('');

      for (const env of vars.slice(0, 30)) {
        const displayValue = env.value.length > 50
          ? env.value.slice(0, 47) + '...'
          : env.value;
        console.log(`  ${theme.primary(env.name.padEnd(20))} ${theme.dim('=')} ${displayValue}`);
      }

      if (vars.length > 30) {
        console.log('');
        console.log(`  ${theme.dim(`... and ${vars.length - 30} more. Use /env search <query> to filter.`)}`);
      }
      console.log('');
      return;
    }

    if (action.toLowerCase() === 'path') {
      // Show PATH entries
      const paths = getPathEntries();
      console.log(`  ${symbols.sparkle} ${theme.gradient('PATH ENTRIES')} ${theme.dim(`(${paths.length})`)}`);
      console.log('');

      paths.forEach((p, i) => {
        console.log(`  ${theme.dim(`${(i + 1).toString().padStart(2)}.`)} ${theme.primary(p)}`);
      });

      console.log('');
      return;
    }

    if (action.toLowerCase() === 'search' && args[1]) {
      // Search env vars
      const query = args.slice(1).join(' ');
      const results = searchEnvVars(query);

      console.log(`  ${symbols.sparkle} ${theme.gradient(`SEARCH: "${query}"`)} ${theme.dim(`(${results.length} matches)`)}`);
      console.log('');

      if (results.length === 0) {
        console.log(`  ${theme.dim('No matches found')}`);
      } else {
        for (const env of results) {
          const displayValue = env.value.length > 50
            ? env.value.slice(0, 47) + '...'
            : env.value;
          console.log(`  ${theme.primary(env.name.padEnd(20))} ${theme.dim('=')} ${displayValue}`);
        }
      }

      console.log('');
      return;
    }

    // Get specific env var
    const value = getEnvVar(action);
    if (value !== undefined) {
      console.log(`  ${theme.primary(action)} ${theme.dim('=')}`);
      console.log('');

      // Handle PATH-like variables with multiple entries
      if (value.includes(process.platform === 'win32' ? ';' : ':') && value.length > 100) {
        const separator = process.platform === 'win32' ? ';' : ':';
        const parts = value.split(separator);
        parts.forEach((p, i) => {
          console.log(`  ${theme.dim(`${(i + 1).toString().padStart(2)}.`)} ${p}`);
        });
      } else {
        console.log(`  ${theme.success(value)}`);
      }
    } else {
      console.log(`  ${symbols.cross} ${theme.error(`Environment variable not found: ${action}`)}`);
    }

    console.log('');
  },
});
