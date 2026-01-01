// Zammy Plugin: Port Manager
// Manage ports and processes

import { platform } from 'os';

interface PluginAPI {
  registerCommand(command: Command): void;
  ui: {
    theme: {
      primary: (text: string) => string;
      secondary: (text: string) => string;
      success: (text: string) => string;
      warning: (text: string) => string;
      error: (text: string) => string;
      dim: (text: string) => string;
      gradient: (text: string) => string;
    };
    symbols: {
      check: string;
      cross: string;
      warning: string;
      info: string;
      sparkles: string;
      arrow: string;
    };
  };
  log: {
    info: (message: string) => void;
    error: (message: string) => void;
  };
  shell?: {
    exec: (command: string, options?: { timeout?: number }) => string;
    spawn: (command: string, args?: string[]) => Promise<{ stdout: string; stderr: string; code: number }>;
  };
}

interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[]) => Promise<void>;
}

interface PortInfo {
  port: number;
  pid: number;
  process: string;
  protocol: string;
  state: string;
}

const isWindows = platform() === 'win32';
const isMac = platform() === 'darwin';

// ============ CROSS-PLATFORM HELPERS ============

async function getListeningPorts(shell: NonNullable<PluginAPI['shell']>): Promise<PortInfo[]> {
  const ports: PortInfo[] = [];

  try {
    if (isWindows) {
      // Windows: Use netstat
      const result = await shell.spawn('netstat', ['-ano']);
      if (result.code !== 0) return ports;

      const lines = result.stdout.split('\n');
      for (const line of lines) {
        if (!line.includes('LISTENING')) continue;

        // TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const localAddr = parts[1];
          const portMatch = localAddr.match(/:(\d+)$/);
          if (portMatch) {
            const pid = parseInt(parts[parts.length - 1]);
            ports.push({
              port: parseInt(portMatch[1]),
              pid,
              process: await getProcessName(shell, pid),
              protocol: parts[0],
              state: 'LISTENING'
            });
          }
        }
      }
    } else {
      // Unix (macOS/Linux): Use lsof
      const result = await shell.spawn('lsof', ['-i', '-P', '-n']);
      if (result.code !== 0) {
        // Try netstat as fallback (Linux only, macOS netstat has different format)
        if (!isMac) {
          const netstatResult = await shell.spawn('netstat', ['-tlnp']);
          if (netstatResult.code === 0) {
            const lines = netstatResult.stdout.split('\n');
            for (const line of lines) {
              if (!line.includes('LISTEN')) continue;
              // tcp   0   0 0.0.0.0:3000   0.0.0.0:*   LISTEN   12345/node
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 7) {
                const localAddr = parts[3];
                const portMatch = localAddr.match(/:(\d+)$/);
                const pidProcess = parts[6];
                const [pidStr, procName] = pidProcess.split('/');
                if (portMatch) {
                  ports.push({
                    port: parseInt(portMatch[1]),
                    pid: parseInt(pidStr) || 0,
                    process: procName || 'unknown',
                    protocol: parts[0].toUpperCase(),
                    state: 'LISTEN'
                  });
                }
              }
            }
          }
        } else {
          // macOS: Try netstat -an (no PID available without lsof)
          const netstatResult = await shell.spawn('netstat', ['-an']);
          if (netstatResult.code === 0) {
            const lines = netstatResult.stdout.split('\n');
            for (const line of lines) {
              if (!line.includes('LISTEN')) continue;
              // tcp4   0   0  *.3000   *.*   LISTEN
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 4) {
                const localAddr = parts[3];
                const portMatch = localAddr.match(/[.*:](\d+)$/);
                if (portMatch) {
                  ports.push({
                    port: parseInt(portMatch[1]),
                    pid: 0, // Not available without lsof on macOS
                    process: 'unknown',
                    protocol: parts[0].toUpperCase().replace(/[46]/, ''),
                    state: 'LISTEN'
                  });
                }
              }
            }
          }
        }
        return ports;
      }

      const lines = result.stdout.split('\n');
      for (const line of lines) {
        if (!line.includes('LISTEN') && !line.includes('(LISTEN)')) continue;

        // node    12345    user   3u  IPv4  ...  TCP *:3000 (LISTEN)
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 9) {
          const process = parts[0];
          const pid = parseInt(parts[1]);
          const addrPart = parts.find(p => p.includes(':'));
          if (addrPart) {
            const portMatch = addrPart.match(/:(\d+)/);
            if (portMatch) {
              ports.push({
                port: parseInt(portMatch[1]),
                pid,
                process,
                protocol: 'TCP',
                state: 'LISTEN'
              });
            }
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }

  // Remove duplicates and sort by port
  const unique = new Map<number, PortInfo>();
  for (const p of ports) {
    if (!unique.has(p.port)) {
      unique.set(p.port, p);
    }
  }

  return Array.from(unique.values()).sort((a, b) => a.port - b.port);
}

async function getProcessName(shell: NonNullable<PluginAPI['shell']>, pid: number): Promise<string> {
  try {
    if (isWindows) {
      const result = await shell.spawn('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']);
      if (result.code === 0 && result.stdout.trim()) {
        // "name.exe","12345","Console","1","12,345 K"
        const match = result.stdout.match(/"([^"]+)"/);
        if (match) return match[1].replace('.exe', '');
      }
    } else {
      const result = await shell.spawn('ps', ['-p', pid.toString(), '-o', 'comm=']);
      if (result.code === 0 && result.stdout.trim()) {
        return result.stdout.trim().split('/').pop() || 'unknown';
      }
    }
  } catch {
    // Ignore
  }
  return 'unknown';
}

async function checkPort(shell: NonNullable<PluginAPI['shell']>, port: number): Promise<PortInfo | null> {
  const ports = await getListeningPorts(shell);
  return ports.find(p => p.port === port) || null;
}

async function killPort(
  shell: NonNullable<PluginAPI['shell']>,
  port: number
): Promise<{ success: boolean; pid?: number; error?: string; requiresAdmin?: boolean }> {
  const portInfo = await checkPort(shell, port);

  if (!portInfo) {
    return { success: false, error: `No process found on port ${port}` };
  }

  try {
    let result;
    if (isWindows) {
      result = await shell.spawn('taskkill', ['/F', '/PID', portInfo.pid.toString()]);
    } else {
      result = await shell.spawn('kill', ['-9', portInfo.pid.toString()]);
    }

    if (result.code !== 0) {
      const stderr = result.stderr.toLowerCase();
      if (stderr.includes('access') || stderr.includes('denied') || stderr.includes('permission') || stderr.includes('operation not permitted')) {
        return {
          success: false,
          pid: portInfo.pid,
          error: 'Permission denied',
          requiresAdmin: true
        };
      }
      return { success: false, pid: portInfo.pid, error: result.stderr || 'Failed to kill process' };
    }

    return { success: true, pid: portInfo.pid };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function findPortsByProcess(shell: NonNullable<PluginAPI['shell']>, name: string): Promise<PortInfo[]> {
  const ports = await getListeningPorts(shell);
  const lowerName = name.toLowerCase();
  return ports.filter(p => p.process.toLowerCase().includes(lowerName));
}

// ============ PLUGIN ============

const plugin = {
  activate(api: PluginAPI) {
    const { theme, symbols } = api.ui;

    if (!api.shell) {
      api.log.error('Port plugin requires shell permission');
      return;
    }

    const shell = api.shell;

    api.registerCommand({
      name: 'port',
      description: 'Manage ports and processes',
      usage: '/port <action> [args]\n\n  Actions: list, check, kill, find',
      async execute(args: string[]) {
        const action = args[0]?.toLowerCase();

        if (!action) {
          console.log('');
          console.log(`  ${symbols.sparkles} ${theme.gradient('PORT MANAGER')}`);
          console.log('');
          console.log(`  ${theme.dim('Usage:')} /port <action> [args]`);
          console.log('');
          console.log(`  ${theme.dim('Actions:')}`);
          console.log(`    ${theme.primary('list')}          ${theme.dim('Show all listening ports')}`);
          console.log(`    ${theme.primary('check <port>')}  ${theme.dim('Check if port is in use')}`);
          console.log(`    ${theme.primary('kill <port>')}   ${theme.dim('Kill process on port')}`);
          console.log(`    ${theme.primary('find <name>')}   ${theme.dim('Find ports by process name')}`);
          console.log('');
          return;
        }

        console.log('');

        switch (action) {
          case 'list': {
            console.log(`  ${symbols.sparkles} ${theme.gradient('LISTENING PORTS')}`);
            console.log('');

            const ports = await getListeningPorts(shell);

            if (ports.length === 0) {
              console.log(`  ${theme.dim('No listening ports found')}`);
            } else {
              console.log(`  ${theme.dim('PORT'.padEnd(8))}${theme.dim('PID'.padEnd(10))}${theme.dim('PROCESS')}`);
              console.log(`  ${theme.dim('─'.repeat(40))}`);

              for (const p of ports) {
                console.log(
                  `  ${theme.primary(p.port.toString().padEnd(8))}` +
                  `${theme.secondary(p.pid.toString().padEnd(10))}` +
                  `${p.process}`
                );
              }

              console.log('');
              console.log(`  ${theme.dim(`Total: ${ports.length} ports`)}`);
            }
            break;
          }

          case 'check': {
            const port = parseInt(args[1]);
            if (isNaN(port)) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /port check <port>`);
              break;
            }

            const portInfo = await checkPort(shell, port);

            if (portInfo) {
              console.log(`  ${symbols.cross} ${theme.error(`Port ${port} is in use`)}`);
              console.log('');
              console.log(`  ${theme.dim('PID:')}     ${theme.primary(portInfo.pid.toString())}`);
              console.log(`  ${theme.dim('Process:')} ${theme.secondary(portInfo.process)}`);
              console.log('');
              console.log(`  ${theme.dim('Kill with:')} /port kill ${port}`);
            } else {
              console.log(`  ${symbols.check} ${theme.success(`Port ${port} is available`)}`);
            }
            break;
          }

          case 'kill': {
            const port = parseInt(args[1]);
            if (isNaN(port)) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /port kill <port>`);
              break;
            }

            console.log(`  ${theme.dim('Killing process on port')} ${theme.primary(port.toString())}...`);

            const result = await killPort(shell, port);

            if (result.success) {
              console.log(`  ${symbols.check} ${theme.success('Process killed')} ${theme.dim(`(PID: ${result.pid})`)}`);
            } else if (result.requiresAdmin) {
              console.log(`  ${symbols.cross} ${theme.error('Permission denied')}`);
              console.log('');
              if (isWindows) {
                console.log(`  ${theme.dim('Run terminal as Administrator and try again')}`);
              } else {
                console.log(`  ${theme.dim('Try:')} sudo zammy, then /port kill ${port}`);
              }
            } else {
              console.log(`  ${symbols.cross} ${theme.error(result.error || 'Failed to kill process')}`);
            }
            break;
          }

          case 'find': {
            const name = args.slice(1).join(' ');
            if (!name) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /port find <process-name>`);
              break;
            }

            const ports = await findPortsByProcess(shell, name);

            if (ports.length === 0) {
              console.log(`  ${theme.dim(`No ports found for "${name}"`)}`);
            } else {
              console.log(`  ${symbols.sparkles} ${theme.gradient(`PORTS FOR "${name.toUpperCase()}"`)}`);
              console.log('');
              console.log(`  ${theme.dim('PORT'.padEnd(8))}${theme.dim('PID'.padEnd(10))}${theme.dim('PROCESS')}`);
              console.log(`  ${theme.dim('─'.repeat(40))}`);

              for (const p of ports) {
                console.log(
                  `  ${theme.primary(p.port.toString().padEnd(8))}` +
                  `${theme.secondary(p.pid.toString().padEnd(10))}` +
                  `${p.process}`
                );
              }

              console.log('');
              console.log(`  ${theme.dim(`Found: ${ports.length} ports`)}`);
            }
            break;
          }

          default:
            console.log(`  ${symbols.cross} ${theme.error(`Unknown action: ${action}`)}`);
            console.log(`  ${theme.dim('Run /port to see available actions')}`);
        }

        console.log('');
      }
    });

    api.log.info('Port Manager plugin activated');
  }
};

export default plugin;
