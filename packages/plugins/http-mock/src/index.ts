// Zammy Plugin: HTTP Mock
// Mock HTTP responses for API testing

import type { PluginAPI, ZammyPlugin } from 'zammy/plugins';
import { createServer, IncomingMessage, ServerResponse, Server } from 'http';

interface MockRoute {
  method: string;
  path: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  delay?: number;
}

interface MockState {
  routes: MockRoute[];
  requests: Array<{
    method: string;
    path: string;
    headers: Record<string, string>;
    body: string;
    timestamp: number;
  }>;
}

let server: Server | null = null;
let mockState: MockState = { routes: [], requests: [] };

const plugin: ZammyPlugin = {
  activate(api: PluginAPI) {
    const { theme, symbols } = api.ui;

    function startServer(port: number): Promise<void> {
      return new Promise((resolve, reject) => {
        if (server) {
          console.log(`  ${symbols.warning} ${theme.warning('Server already running')}`);
          resolve();
          return;
        }

        server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
          const method = req.method || 'GET';
          const path = req.url || '/';

          // Collect request body
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            // Record request
            mockState.requests.push({
              method,
              path,
              headers: req.headers as Record<string, string>,
              body,
              timestamp: Date.now(),
            });

            // Find matching route
            const route = mockState.routes.find(r =>
              r.method === method && r.path === path
            );

            if (route) {
              // Add delay if specified
              if (route.delay) {
                await new Promise(r => setTimeout(r, route.delay));
              }

              res.writeHead(route.status, {
                'Content-Type': 'application/json',
                ...route.headers,
              });
              res.end(route.body);
            } else {
              // Default 404
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Not Found', path }));
            }
          });
        });

        server.listen(port, () => {
          resolve();
        });

        server.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            reject(new Error(`Port ${port} is already in use`));
          } else {
            reject(err);
          }
        });
      });
    }

    function stopServer(): void {
      if (server) {
        server.close();
        server = null;
      }
    }

    function addRoute(method: string, path: string, status: number, body: string, delay?: number): void {
      // Remove existing route with same method/path
      mockState.routes = mockState.routes.filter(r =>
        !(r.method === method && r.path === path)
      );

      mockState.routes.push({
        method: method.toUpperCase(),
        path,
        status,
        headers: {},
        body,
        delay,
      });
    }

    function showHelp(): void {
      console.log('');
      console.log(`  ${symbols.sparkles} ${theme.gradient('HTTP Mock Server')}`);
      console.log('');
      console.log(`  ${theme.secondary('Commands:')}`);
      console.log(`    ${theme.primary('/mock start <port>')}       ${theme.dim('Start mock server')}`);
      console.log(`    ${theme.primary('/mock stop')}               ${theme.dim('Stop mock server')}`);
      console.log(`    ${theme.primary('/mock add <method> <path>')} ${theme.dim('Add mock route')}`);
      console.log(`    ${theme.primary('/mock list')}               ${theme.dim('List mock routes')}`);
      console.log(`    ${theme.primary('/mock requests')}           ${theme.dim('Show recorded requests')}`);
      console.log(`    ${theme.primary('/mock clear')}              ${theme.dim('Clear routes and requests')}`);
      console.log('');
      console.log(`  ${theme.secondary('Examples:')}`);
      console.log(`    ${theme.dim('/mock start 3001')}`);
      console.log(`    ${theme.dim('/mock add GET /api/users {"users":[]}')}`);
      console.log(`    ${theme.dim('/mock add POST /api/login --status 200 {"token":"abc"}')}`);
      console.log('');
    }

    function showRoutes(): void {
      console.log('');
      console.log(`  ${theme.secondary('Mock Routes:')}`);

      if (mockState.routes.length === 0) {
        console.log(`  ${theme.dim('No routes defined')}`);
      } else {
        for (const route of mockState.routes) {
          const delay = route.delay ? theme.dim(` (+${route.delay}ms)`) : '';
          console.log(`    ${theme.accent(route.method.padEnd(6))} ${theme.primary(route.path)} ${theme.dim(`[${route.status}]`)}${delay}`);
        }
      }
      console.log('');
    }

    function showRequests(): void {
      console.log('');
      console.log(`  ${theme.secondary('Recorded Requests:')} ${theme.dim(`(${mockState.requests.length})`)}`);

      if (mockState.requests.length === 0) {
        console.log(`  ${theme.dim('No requests recorded')}`);
      } else {
        const recent = mockState.requests.slice(-10);
        for (const req of recent) {
          const time = new Date(req.timestamp).toLocaleTimeString();
          console.log(`    ${theme.dim(time)} ${theme.accent(req.method.padEnd(6))} ${req.path}`);
        }
        if (mockState.requests.length > 10) {
          console.log(`    ${theme.dim(`... and ${mockState.requests.length - 10} more`)}`);
        }
      }
      console.log('');
    }

    api.registerCommand({
      name: 'mock',
      description: 'HTTP mock server for API testing',
      usage: '/mock [start|stop|add|list|requests|clear]',
      async execute(args: string[]) {
        const subcommand = args[0]?.toLowerCase();

        if (!subcommand || subcommand === 'help') {
          showHelp();
          return;
        }

        switch (subcommand) {
          case 'start': {
            const port = parseInt(args[1]) || 3001;
            try {
              await startServer(port);
              console.log(`  ${symbols.check} ${theme.success(`Mock server running on port ${port}`)}`);
              console.log(`  ${theme.dim(`http://localhost:${port}`)}`);
            } catch (err) {
              console.log(`  ${symbols.cross} ${theme.error((err as Error).message)}`);
            }
            break;
          }

          case 'stop':
            if (server) {
              stopServer();
              console.log(`  ${symbols.check} ${theme.success('Mock server stopped')}`);
            } else {
              console.log(`  ${theme.dim('Server not running')}`);
            }
            break;

          case 'add': {
            const method = args[1]?.toUpperCase();
            const path = args[2];

            if (!method || !path) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage: /mock add <method> <path> [body] [--status <code>] [--delay <ms>]')}`);
              break;
            }

            // Parse remaining args
            let status = 200;
            let delay: number | undefined;
            let bodyParts: string[] = [];

            for (let i = 3; i < args.length; i++) {
              if (args[i] === '--status' && args[i + 1]) {
                status = parseInt(args[i + 1]) || 200;
                i++;
              } else if (args[i] === '--delay' && args[i + 1]) {
                delay = parseInt(args[i + 1]);
                i++;
              } else {
                bodyParts.push(args[i]);
              }
            }

            const body = bodyParts.join(' ') || '{}';
            addRoute(method, path, status, body, delay);

            console.log(`  ${symbols.check} ${theme.success('Route added:')}`);
            console.log(`    ${theme.accent(method)} ${path} ${theme.dim(`[${status}]`)}`);
            break;
          }

          case 'list':
          case 'routes':
            showRoutes();
            break;

          case 'requests':
          case 'log':
            showRequests();
            break;

          case 'clear':
            mockState = { routes: [], requests: [] };
            console.log(`  ${symbols.check} ${theme.success('Routes and requests cleared')}`);
            break;

          case 'status':
            if (server) {
              console.log(`  ${symbols.check} ${theme.success('Server running')}`);
              console.log(`    ${theme.dim('Routes:')} ${mockState.routes.length}`);
              console.log(`    ${theme.dim('Requests:')} ${mockState.requests.length}`);
            } else {
              console.log(`  ${theme.dim('Server not running')}`);
            }
            break;

          default:
            showHelp();
        }
      },
    });

    // Cleanup on deactivate
    api.log.info('HTTP Mock plugin activated');
  },
};

export default plugin;
