import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { makeRequest, formatHeaders, tryParseJson } from '../../handlers/dev/request.js';

registerCommand({
  name: 'request',
  description: 'Make HTTP requests',
  usage: '/request <method> <url> [options]',
  async execute(args: string[]) {
    if (args.length < 1) {
      console.log('');
      console.log(`  ${symbols.sparkle} ${theme.gradient('HTTP REQUEST')}`);
      console.log('');
      console.log(`  ${theme.dim('Usage:')} /request <method> <url> [options]`);
      console.log('');
      console.log(`  ${theme.dim('Methods:')} GET, POST, PUT, DELETE, PATCH, HEAD`);
      console.log('');
      console.log(`  ${theme.dim('Examples:')}`);
      console.log(`    /request GET https://api.github.com`);
      console.log(`    /request POST https://httpbin.org/post --body '{"name":"test"}'`);
      console.log(`    /request GET api.example.com/users`);
      console.log('');
      return;
    }

    let method = 'GET';
    let url = args[0];

    // Check if first arg is a method
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (methods.includes(args[0].toUpperCase())) {
      method = args[0].toUpperCase();
      url = args[1];
    }

    if (!url) {
      console.log('');
      console.log(`  ${symbols.cross} ${theme.error('URL is required')}`);
      console.log('');
      return;
    }

    // Parse options
    const headers: Record<string, string> = {};
    let body: string | undefined;

    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--header' || args[i] === '-H') {
        const header = args[++i];
        if (header) {
          const [key, ...valueParts] = header.split(':');
          headers[key.trim()] = valueParts.join(':').trim();
        }
      } else if (args[i] === '--body' || args[i] === '-d') {
        body = args[++i];
      }
    }

    console.log('');
    console.log(`  ${theme.dim(`${method} ${url}...`)}`);

    const result = await makeRequest(url, { method, headers, body });

    // Clear the loading message
    process.stdout.write('\x1b[1A\x1b[2K');

    if (!result.success) {
      console.log(`  ${symbols.cross} ${theme.error(result.error || 'Request failed')}`);
      console.log('');
      return;
    }

    // Status
    const statusColor = result.statusCode && result.statusCode >= 200 && result.statusCode < 300
      ? theme.success
      : result.statusCode && result.statusCode >= 400
        ? theme.error
        : theme.warning;

    console.log(`  ${statusColor(`${result.statusCode} ${result.statusMessage}`)} ${theme.dim(`(${result.time}ms)`)}`);
    console.log('');

    // Show important headers
    if (result.headers) {
      const importantHeaders = ['content-type', 'content-length', 'server', 'date'];
      console.log(`  ${theme.dim('Headers:')}`);
      for (const key of importantHeaders) {
        if (result.headers[key]) {
          console.log(`    ${theme.secondary(key)}: ${result.headers[key]}`);
        }
      }
      console.log('');
    }

    // Body
    if (result.body && method !== 'HEAD') {
      console.log(`  ${theme.dim('Body:')}`);

      // Try to format as JSON
      const jsonResult = tryParseJson(result.body);
      if (jsonResult.isJson && jsonResult.formatted) {
        const lines = jsonResult.formatted.split('\n');
        const displayLines = lines.slice(0, 30);
        for (const line of displayLines) {
          console.log(`  ${theme.primary(line)}`);
        }
        if (lines.length > 30) {
          console.log(`  ${theme.dim(`... and ${lines.length - 30} more lines`)}`);
        }
      } else {
        // Plain text
        const lines = result.body.split('\n').slice(0, 20);
        for (const line of lines) {
          console.log(`  ${line.slice(0, 100)}`);
        }
        if (result.body.split('\n').length > 20) {
          console.log(`  ${theme.dim('... (truncated)')}`);
        }
      }
    }

    console.log('');
  },
});
