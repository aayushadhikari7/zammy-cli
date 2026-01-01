import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { validateJson, formatJson, minifyJson, queryJson, readJsonFile, getJsonStats } from '../../handlers/dev/json.js';
import { existsSync, readFileSync } from 'fs';

registerCommand({
  name: 'json',
  description: 'JSON tools (validate, format, query)',
  usage: '/json <action> <input>\n\n  Actions: validate, format, minify, query, stats',
  async execute(args: string[]) {
    const action = args[0]?.toLowerCase();
    const input = args.slice(1).join(' ');

    if (!action) {
      console.log('');
      console.log(`  ${symbols.sparkle} ${theme.gradient('JSON TOOLS')}`);
      console.log('');
      console.log(`  ${theme.dim('Usage:')} /json <action> <input>`);
      console.log('');
      console.log(`  ${theme.dim('Actions:')}`);
      console.log(`    ${theme.primary('validate')} <json|@file>  ${theme.dim('Check if JSON is valid')}`);
      console.log(`    ${theme.primary('format')} <json|@file>    ${theme.dim('Pretty-print JSON')}`);
      console.log(`    ${theme.primary('minify')} <json|@file>    ${theme.dim('Minify JSON')}`);
      console.log(`    ${theme.primary('query')} <path> <json>    ${theme.dim('Query with path (e.g., users[0].name)')}`);
      console.log(`    ${theme.primary('stats')} <json|@file>     ${theme.dim('Show JSON statistics')}`);
      console.log('');
      console.log(`  ${theme.dim('Use @filename to read from file')}`);
      console.log('');
      return;
    }

    // Get JSON content (from file or direct input)
    let jsonContent = input;
    if (input.startsWith('@')) {
      const filePath = input.slice(1);
      if (!existsSync(filePath)) {
        console.log('');
        console.log(`  ${symbols.cross} ${theme.error(`File not found: ${filePath}`)}`);
        console.log('');
        return;
      }
      jsonContent = readFileSync(filePath, 'utf-8');
    }

    console.log('');

    switch (action) {
      case 'validate': {
        if (!jsonContent) {
          console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /json validate <json|@file>`);
          break;
        }
        const result = validateJson(jsonContent);
        if (result.valid) {
          console.log(`  ${symbols.check} ${theme.success('Valid JSON')}`);
        } else {
          console.log(`  ${symbols.cross} ${theme.error('Invalid JSON')}`);
          console.log(`  ${theme.dim(result.error || '')}`);
        }
        break;
      }

      case 'format':
      case 'pretty': {
        if (!jsonContent) {
          console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /json format <json|@file>`);
          break;
        }
        const result = formatJson(jsonContent);
        if (result.valid && result.formatted) {
          console.log(`  ${symbols.check} ${theme.success('Formatted JSON:')}`);
          console.log('');
          for (const line of result.formatted.split('\n')) {
            console.log(`  ${theme.primary(line)}`);
          }
        } else {
          console.log(`  ${symbols.cross} ${theme.error('Invalid JSON')}`);
          console.log(`  ${theme.dim(result.error || '')}`);
        }
        break;
      }

      case 'minify':
      case 'min': {
        if (!jsonContent) {
          console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /json minify <json|@file>`);
          break;
        }
        const result = minifyJson(jsonContent);
        if (result.valid && result.formatted) {
          console.log(`  ${symbols.check} ${theme.success('Minified:')}`);
          console.log('');
          console.log(`  ${theme.primary(result.formatted)}`);
        } else {
          console.log(`  ${symbols.cross} ${theme.error('Invalid JSON')}`);
          console.log(`  ${theme.dim(result.error || '')}`);
        }
        break;
      }

      case 'query':
      case 'get': {
        const path = args[1];
        const queryInput = args.slice(2).join(' ');

        if (!path || !queryInput) {
          console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /json query <path> <json|@file>`);
          console.log('');
          console.log(`  ${theme.dim('Examples:')}`);
          console.log(`    /json query name '{"name": "John"}'`);
          console.log(`    /json query users[0].email @data.json`);
          break;
        }

        let queryJsonContent = queryInput;
        if (queryInput.startsWith('@')) {
          const filePath = queryInput.slice(1);
          if (!existsSync(filePath)) {
            console.log(`  ${symbols.cross} ${theme.error(`File not found: ${filePath}`)}`);
            break;
          }
          queryJsonContent = readFileSync(filePath, 'utf-8');
        }

        const result = queryJson(queryJsonContent, path);
        if (result.valid) {
          console.log(`  ${symbols.check} ${theme.success(`Result for "${path}":`)} `);
          console.log('');
          if (result.formatted) {
            for (const line of result.formatted.split('\n')) {
              console.log(`  ${theme.primary(line)}`);
            }
          } else {
            console.log(`  ${theme.dim('undefined')}`);
          }
        } else {
          console.log(`  ${symbols.cross} ${theme.error(result.error || 'Query failed')}`);
        }
        break;
      }

      case 'stats':
      case 'info': {
        if (!jsonContent) {
          console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /json stats <json|@file>`);
          break;
        }
        const stats = getJsonStats(jsonContent);
        if (stats) {
          console.log(`  ${symbols.sparkle} ${theme.gradient('JSON STATS')}`);
          console.log('');
          console.log(`  ${theme.dim('Total keys:')}  ${theme.primary(stats.keys.toString())}`);
          console.log(`  ${theme.dim('Max depth:')}   ${theme.primary(stats.depth.toString())}`);
          console.log(`  ${theme.dim('Size:')}        ${theme.primary(stats.size)}`);
        } else {
          console.log(`  ${symbols.cross} ${theme.error('Invalid JSON')}`);
        }
        break;
      }

      default:
        console.log(`  ${symbols.cross} ${theme.error(`Unknown action: ${action}`)}`);
        console.log(`  ${theme.dim('Run /json to see available actions')}`);
    }

    console.log('');
  },
});
