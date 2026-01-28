import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import {
  loadEnvFile,
  getEnvValue,
  setEnvValue,
  deleteEnvValue,
  compareEnvFiles,
  generateTemplate,
} from '../../handlers/utilities/envfile.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

function showHelp(): void {
  console.log('');
  console.log(theme.primary('Environment File Manager:'));
  console.log('');
  console.log(`  ${theme.accent('/envfile list')}               ${theme.dim('List all env variables')}`);
  console.log(`  ${theme.accent('/envfile get')} ${theme.dim('<key>')}           ${theme.dim('Get a specific value')}`);
  console.log(`  ${theme.accent('/envfile set')} ${theme.dim('<key> <value>')}   ${theme.dim('Set a value')}`);
  console.log(`  ${theme.accent('/envfile delete')} ${theme.dim('<key>')}        ${theme.dim('Delete a key')}`);
  console.log(`  ${theme.accent('/envfile diff')}               ${theme.dim('Compare .env vs .env.example')}`);
  console.log(`  ${theme.accent('/envfile template')}           ${theme.dim('Generate .env.example from .env')}`);
  console.log('');
  console.log(theme.dim('  Works with .env file in current directory'));
  console.log('');
}

registerCommand({
  name: 'envfile',
  description: 'Manage .env files',
  usage: '/envfile <command> [args]',
  async execute(args: string[]) {
    const cwd = process.cwd();

    if (args.length === 0) {
      showHelp();
      return;
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === 'help' || subcommand === '--help') {
      showHelp();
      return;
    }

    if (subcommand === 'list' || subcommand === 'ls') {
      const env = loadEnvFile(cwd);

      console.log('');
      if (!env.exists) {
        console.log(theme.warning('No .env file found in current directory'));
        console.log('');
        return;
      }

      if (env.entries.length === 0) {
        console.log(theme.dim('No variables defined in .env'));
        console.log('');
        return;
      }

      console.log(`  ${symbols.info} ${theme.primary('.env Variables')}`);
      console.log('');

      for (const entry of env.entries) {
        const sensitive = /password|secret|key|token|api/i.test(entry.key);
        const displayValue = sensitive ? theme.dim('********') : theme.accent(entry.value || '(empty)');
        console.log(`  ${theme.success(entry.key.padEnd(25))} ${displayValue}`);
      }

      console.log('');
      console.log(theme.dim(`  ${env.entries.length} variables`));
      console.log('');
      return;
    }

    if (subcommand === 'get') {
      const key = args[1];
      if (!key) {
        console.log(theme.error('Usage: /envfile get <key>'));
        return;
      }

      const value = getEnvValue(cwd, key);

      console.log('');
      if (value === null) {
        console.log(theme.warning(`Key "${key}" not found in .env`));
      } else {
        console.log(`  ${theme.success(key)}=${theme.accent(value || '(empty)')}`);
      }
      console.log('');
      return;
    }

    if (subcommand === 'set') {
      const key = args[1];
      const value = args.slice(2).join(' ');

      if (!key) {
        console.log(theme.error('Usage: /envfile set <key> <value>'));
        return;
      }

      setEnvValue(cwd, key, value);
      console.log('');
      console.log(`  ${symbols.check} ${theme.success('Set')} ${key}=${theme.accent(value || '(empty)')}`);
      console.log('');
      return;
    }

    if (subcommand === 'delete' || subcommand === 'del' || subcommand === 'rm') {
      const key = args[1];
      if (!key) {
        console.log(theme.error('Usage: /envfile delete <key>'));
        return;
      }

      const deleted = deleteEnvValue(cwd, key);

      console.log('');
      if (deleted) {
        console.log(`  ${symbols.check} ${theme.success('Deleted')} ${key}`);
      } else {
        console.log(theme.warning(`Key "${key}" not found`));
      }
      console.log('');
      return;
    }

    if (subcommand === 'diff' || subcommand === 'compare') {
      const diffs = compareEnvFiles(cwd);
      const envFile = loadEnvFile(cwd, '.env');
      const exampleFile = loadEnvFile(cwd, '.env.example');

      console.log('');
      console.log(`  ${symbols.info} ${theme.primary('.env vs .env.example')}`);
      console.log('');

      if (!envFile.exists && !exampleFile.exists) {
        console.log(theme.warning('Neither .env nor .env.example found'));
        console.log('');
        return;
      }

      if (!envFile.exists) {
        console.log(theme.warning('.env file not found'));
      }
      if (!exampleFile.exists) {
        console.log(theme.warning('.env.example file not found'));
      }

      if (diffs.length === 0) {
        console.log(theme.dim('No variables to compare'));
        console.log('');
        return;
      }

      const missing = diffs.filter(d => !d.inEnv && d.inExample);
      const extra = diffs.filter(d => d.inEnv && !d.inExample);
      const synced = diffs.filter(d => d.inEnv && d.inExample);

      if (missing.length > 0) {
        console.log(theme.error(`  Missing in .env (${missing.length}):`));
        for (const d of missing) {
          console.log(`    ${symbols.cross} ${d.key}`);
        }
        console.log('');
      }

      if (extra.length > 0) {
        console.log(theme.warning(`  Extra in .env (${extra.length}):`));
        for (const d of extra) {
          console.log(`    ${symbols.warning} ${d.key}`);
        }
        console.log('');
      }

      if (synced.length > 0 && missing.length === 0 && extra.length === 0) {
        console.log(theme.success(`  ${symbols.check} All ${synced.length} keys are in sync`));
        console.log('');
      } else if (synced.length > 0) {
        console.log(theme.dim(`  ${synced.length} keys in sync`));
        console.log('');
      }

      return;
    }

    if (subcommand === 'template' || subcommand === 'example') {
      const env = loadEnvFile(cwd);

      if (!env.exists) {
        console.log(theme.error('No .env file found to generate template from'));
        return;
      }

      const template = generateTemplate(cwd);
      const outputPath = join(cwd, '.env.example');

      const writeIt = args.includes('--write') || args.includes('-w');

      console.log('');
      if (writeIt) {
        writeFileSync(outputPath, template);
        console.log(`  ${symbols.check} ${theme.success('Created .env.example')}`);
      } else {
        console.log(theme.dim('Preview of .env.example:'));
        console.log('');
        console.log(template);
        console.log('');
        console.log(theme.dim('Use --write to save to file'));
      }
      console.log('');
      return;
    }

    console.log(theme.error(`Unknown subcommand: ${subcommand}`));
    showHelp();
  },
});
