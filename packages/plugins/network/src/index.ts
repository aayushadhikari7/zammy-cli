// Zammy Plugin: Network Tools
// Network utilities and diagnostics

import { platform } from 'os';
import { networkInterfaces } from 'os';
import { promises as dns } from 'dns';
import https from 'https';
import http from 'http';

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
    progressBar: (current: number, total: number, width?: number) => string;
  };
  log: {
    info: (message: string) => void;
    error: (message: string) => void;
  };
  shell?: {
    spawn: (command: string, args?: string[]) => Promise<{ stdout: string; stderr: string; code: number }>;
  };
}

interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[]) => Promise<void>;
}

const isWindows = platform() === 'win32';

// ============ COMMON PORTS ============

const COMMON_PORTS = [
  { port: 20, service: 'FTP Data', protocol: 'TCP' },
  { port: 21, service: 'FTP Control', protocol: 'TCP' },
  { port: 22, service: 'SSH', protocol: 'TCP' },
  { port: 23, service: 'Telnet', protocol: 'TCP' },
  { port: 25, service: 'SMTP', protocol: 'TCP' },
  { port: 53, service: 'DNS', protocol: 'TCP/UDP' },
  { port: 67, service: 'DHCP Server', protocol: 'UDP' },
  { port: 68, service: 'DHCP Client', protocol: 'UDP' },
  { port: 80, service: 'HTTP', protocol: 'TCP' },
  { port: 110, service: 'POP3', protocol: 'TCP' },
  { port: 143, service: 'IMAP', protocol: 'TCP' },
  { port: 443, service: 'HTTPS', protocol: 'TCP' },
  { port: 465, service: 'SMTPS', protocol: 'TCP' },
  { port: 587, service: 'SMTP Submission', protocol: 'TCP' },
  { port: 993, service: 'IMAPS', protocol: 'TCP' },
  { port: 995, service: 'POP3S', protocol: 'TCP' },
  { port: 3000, service: 'Dev Server', protocol: 'TCP' },
  { port: 3306, service: 'MySQL', protocol: 'TCP' },
  { port: 3389, service: 'RDP', protocol: 'TCP' },
  { port: 5432, service: 'PostgreSQL', protocol: 'TCP' },
  { port: 5672, service: 'RabbitMQ', protocol: 'TCP' },
  { port: 6379, service: 'Redis', protocol: 'TCP' },
  { port: 8080, service: 'HTTP Alt', protocol: 'TCP' },
  { port: 8443, service: 'HTTPS Alt', protocol: 'TCP' },
  { port: 27017, service: 'MongoDB', protocol: 'TCP' },
];

// ============ HELPERS ============

function getLocalIPs(): string[] {
  const interfaces = networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }

  return ips;
}

async function getPublicIP(): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 5000);

    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        clearTimeout(timeout);
        resolve(data.trim());
      });
    }).on('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

interface DnsRecord {
  type: string;
  value: string;
}

async function lookupDns(domain: string): Promise<{ records: DnsRecord[]; error?: string }> {
  const records: DnsRecord[] = [];

  try {
    const addresses = await dns.resolve4(domain);
    for (const addr of addresses) {
      records.push({ type: 'A', value: addr });
    }
  } catch { /* ignore */ }

  try {
    const addresses = await dns.resolve6(domain);
    for (const addr of addresses) {
      records.push({ type: 'AAAA', value: addr });
    }
  } catch { /* ignore */ }

  try {
    const mx = await dns.resolveMx(domain);
    for (const record of mx) {
      records.push({ type: 'MX', value: `${record.priority} ${record.exchange}` });
    }
  } catch { /* ignore */ }

  try {
    const ns = await dns.resolveNs(domain);
    for (const record of ns) {
      records.push({ type: 'NS', value: record });
    }
  } catch { /* ignore */ }

  try {
    const txt = await dns.resolveTxt(domain);
    for (const record of txt) {
      records.push({ type: 'TXT', value: record.join('') });
    }
  } catch { /* ignore */ }

  if (records.length === 0) {
    return { records: [], error: 'No DNS records found' };
  }

  return { records };
}

interface PingResult {
  success: boolean;
  time?: number;
  ttl?: number;
}

async function ping(
  shell: NonNullable<PluginAPI['shell']>,
  host: string,
  count: number = 4
): Promise<{ results: PingResult[]; error?: string }> {
  try {
    const args = isWindows
      ? ['-n', count.toString(), host]
      : ['-c', count.toString(), host];

    const result = await shell.spawn('ping', args);

    if (result.code !== 0 && !result.stdout.includes('time')) {
      return { results: [], error: result.stderr || 'Host unreachable' };
    }

    const results: PingResult[] = [];
    const lines = result.stdout.split('\n');

    for (const line of lines) {
      // Windows: Reply from 8.8.8.8: bytes=32 time=15ms TTL=117
      // Unix: 64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=15.2 ms
      const timeMatch = line.match(/time[=<](\d+\.?\d*)\s*ms/i);
      const ttlMatch = line.match(/ttl[=:](\d+)/i);

      if (timeMatch) {
        results.push({
          success: true,
          time: parseFloat(timeMatch[1]),
          ttl: ttlMatch ? parseInt(ttlMatch[1]) : undefined,
        });
      }
    }

    return { results };
  } catch (error) {
    return { results: [], error: String(error) };
  }
}

interface SpeedResult {
  downloadSpeed: number;
  latency: number;
  testSize: number;
  duration: number;
}

async function runSpeedTest(
  onProgress?: (percent: number) => void
): Promise<SpeedResult | { error: string }> {
  const testUrl = 'https://speed.cloudflare.com/__down?bytes=5000000'; // 5MB
  const testSize = 5_000_000;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ error: 'Speed test timed out' });
    }, 30000);

    const startTime = Date.now();
    let latency = 0;

    https.get(testUrl, (res) => {
      latency = Date.now() - startTime;
      let downloaded = 0;

      res.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        if (onProgress) {
          onProgress(Math.min(100, (downloaded / testSize) * 100));
        }
      });

      res.on('end', () => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        const speedBps = (downloaded * 8) / (duration / 1000);
        const speedMbps = speedBps / 1_000_000;

        resolve({
          downloadSpeed: Math.round(speedMbps * 100) / 100,
          latency,
          testSize: downloaded,
          duration,
        });
      });
    }).on('error', (error) => {
      clearTimeout(timeout);
      resolve({ error: error.message });
    });
  });
}

interface HeadersResult {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string | string[] | undefined>;
  error?: string;
}

async function getHeaders(url: string): Promise<HeadersResult> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ statusCode: 0, statusMessage: '', headers: {}, error: 'Request timed out' });
    }, 10000);

    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.request(parsedUrl, { method: 'HEAD' }, (res) => {
        clearTimeout(timeout);
        resolve({
          statusCode: res.statusCode || 0,
          statusMessage: res.statusMessage || '',
          headers: res.headers,
        });
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ statusCode: 0, statusMessage: '', headers: {}, error: error.message });
      });

      req.end();
    } catch (error) {
      clearTimeout(timeout);
      resolve({ statusCode: 0, statusMessage: '', headers: {}, error: String(error) });
    }
  });
}

// ============ PLUGIN ============

const plugin = {
  activate(api: PluginAPI) {
    const { theme, symbols, progressBar } = api.ui;

    if (!api.shell) {
      api.log.error('Network plugin requires shell permission');
      return;
    }

    const shell = api.shell;

    api.registerCommand({
      name: 'net',
      description: 'Network utilities and diagnostics',
      usage: '/net <action> [args]\n\n  Actions: ip, ping, dns, speed, headers, ports',
      async execute(args: string[]) {
        const action = args[0]?.toLowerCase();

        if (!action) {
          console.log('');
          console.log(`  ${symbols.sparkles} ${theme.gradient('NETWORK TOOLS')}`);
          console.log('');
          console.log(`  ${theme.dim('Usage:')} /net <action> [args]`);
          console.log('');
          console.log(`  ${theme.dim('Actions:')}`);
          console.log(`    ${theme.primary('ip')}              ${theme.dim('Show local + public IP')}`);
          console.log(`    ${theme.primary('ping <host>')}     ${theme.dim('Ping a host')}`);
          console.log(`    ${theme.primary('dns <domain>')}    ${theme.dim('DNS lookup')}`);
          console.log(`    ${theme.primary('speed')}           ${theme.dim('Speed test')}`);
          console.log(`    ${theme.primary('headers <url>')}   ${theme.dim('Show HTTP headers')}`);
          console.log(`    ${theme.primary('ports')}           ${theme.dim('Common ports reference')}`);
          console.log('');
          return;
        }

        console.log('');

        switch (action) {
          case 'ip': {
            console.log(`  ${symbols.sparkles} ${theme.gradient('IP ADDRESSES')}`);
            console.log('');

            const localIPs = getLocalIPs();
            if (localIPs.length > 0) {
              console.log(`  ${theme.dim('Local:')}`);
              for (const ip of localIPs) {
                console.log(`    ${symbols.arrow} ${theme.primary(ip)}`);
              }
            } else {
              console.log(`  ${theme.dim('Local:')} ${theme.warning('No network interfaces found')}`);
            }

            console.log('');
            console.log(`  ${theme.dim('Fetching public IP...')}`);

            const publicIP = await getPublicIP();
            // Move cursor up and clear line
            process.stdout.write('\x1b[1A\x1b[2K');

            if (publicIP) {
              console.log(`  ${theme.dim('Public:')} ${theme.success(publicIP)}`);
            } else {
              console.log(`  ${theme.dim('Public:')} ${theme.warning('Could not determine (offline?)')}`);
            }
            break;
          }

          case 'ping': {
            const host = args[1];
            if (!host) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /net ping <host>`);
              break;
            }

            console.log(`  ${theme.dim('Pinging')} ${theme.primary(host)}...`);
            console.log('');

            const { results, error } = await ping(shell, host);

            if (error) {
              console.log(`  ${symbols.cross} ${theme.error(error)}`);
              break;
            }

            if (results.length === 0) {
              console.log(`  ${symbols.cross} ${theme.error('No response from host')}`);
              break;
            }

            for (let i = 0; i < results.length; i++) {
              const r = results[i];
              if (r.success) {
                console.log(
                  `  ${symbols.check} ${theme.dim(`Reply ${i + 1}:`)} ` +
                  `${theme.success(`${r.time}ms`)} ` +
                  `${r.ttl ? theme.dim(`TTL=${r.ttl}`) : ''}`
                );
              }
            }

            const times = results.filter(r => r.time).map(r => r.time!);
            if (times.length > 0) {
              const avg = times.reduce((a, b) => a + b, 0) / times.length;
              const min = Math.min(...times);
              const max = Math.max(...times);

              console.log('');
              console.log(`  ${theme.dim('Min:')} ${min}ms  ${theme.dim('Max:')} ${max}ms  ${theme.dim('Avg:')} ${avg.toFixed(1)}ms`);
            }
            break;
          }

          case 'dns': {
            const domain = args[1];
            if (!domain) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /net dns <domain>`);
              break;
            }

            console.log(`  ${symbols.sparkles} ${theme.gradient(`DNS: ${domain.toUpperCase()}`)}`);
            console.log('');

            const { records, error } = await lookupDns(domain);

            if (error) {
              console.log(`  ${symbols.cross} ${theme.error(error)}`);
              break;
            }

            console.log(`  ${theme.dim('TYPE'.padEnd(8))}${theme.dim('VALUE')}`);
            console.log(`  ${theme.dim('─'.repeat(50))}`);

            for (const record of records) {
              const typeColor = record.type === 'A' ? theme.success :
                               record.type === 'AAAA' ? theme.primary :
                               record.type === 'MX' ? theme.warning :
                               theme.secondary;
              console.log(`  ${typeColor(record.type.padEnd(8))}${record.value}`);
            }

            console.log('');
            console.log(`  ${theme.dim(`Found: ${records.length} records`)}`);
            break;
          }

          case 'speed': {
            console.log(`  ${symbols.sparkles} ${theme.gradient('SPEED TEST')}`);
            console.log('');
            console.log(`  ${theme.dim('Testing download speed...')}`);
            console.log(`  ${progressBar(0, 100, 30)}`);

            const result = await runSpeedTest((percent) => {
              // Move cursor up and update progress
              process.stdout.write('\x1b[1A\x1b[2K');
              console.log(`  ${progressBar(percent, 100, 30)}`);
            });

            // Clear progress line
            process.stdout.write('\x1b[1A\x1b[2K');
            process.stdout.write('\x1b[1A\x1b[2K');

            if ('error' in result) {
              console.log(`  ${symbols.cross} ${theme.error(result.error)}`);
              break;
            }

            console.log(`  ${symbols.check} ${theme.success('Test complete')}`);
            console.log('');
            console.log(`  ${theme.dim('Download:')} ${theme.primary(`${result.downloadSpeed} Mbps`)}`);
            console.log(`  ${theme.dim('Latency:')}  ${theme.secondary(`${result.latency}ms`)}`);
            console.log(`  ${theme.dim('Data:')}     ${(result.testSize / 1_000_000).toFixed(1)} MB in ${(result.duration / 1000).toFixed(1)}s`);
            break;
          }

          case 'headers': {
            let url = args[1];
            if (!url) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /net headers <url>`);
              break;
            }

            if (!url.startsWith('http')) {
              url = `https://${url}`;
            }

            console.log(`  ${theme.dim('Fetching headers from')} ${theme.primary(url)}...`);
            console.log('');

            const result = await getHeaders(url);

            if (result.error) {
              console.log(`  ${symbols.cross} ${theme.error(result.error)}`);
              break;
            }

            const statusColor = result.statusCode >= 200 && result.statusCode < 300 ? theme.success :
                               result.statusCode >= 300 && result.statusCode < 400 ? theme.warning :
                               theme.error;

            console.log(`  ${theme.dim('Status:')} ${statusColor(`${result.statusCode} ${result.statusMessage}`)}`);
            console.log('');
            console.log(`  ${theme.dim('Headers:')}`);
            console.log(`  ${theme.dim('─'.repeat(50))}`);

            const importantHeaders = [
              'content-type', 'content-length', 'server', 'cache-control',
              'x-powered-by', 'x-frame-options', 'strict-transport-security'
            ];

            for (const header of importantHeaders) {
              if (result.headers[header]) {
                const value = Array.isArray(result.headers[header])
                  ? result.headers[header]!.join(', ')
                  : result.headers[header];
                console.log(`  ${theme.primary(header)}: ${theme.dim(String(value))}`);
              }
            }
            break;
          }

          case 'ports': {
            console.log(`  ${symbols.sparkles} ${theme.gradient('COMMON PORTS')}`);
            console.log('');
            console.log(`  ${theme.dim('PORT'.padEnd(8))}${theme.dim('SERVICE'.padEnd(18))}${theme.dim('PROTOCOL')}`);
            console.log(`  ${theme.dim('─'.repeat(40))}`);

            for (const p of COMMON_PORTS) {
              console.log(
                `  ${theme.primary(p.port.toString().padEnd(8))}` +
                `${theme.secondary(p.service.padEnd(18))}` +
                `${theme.dim(p.protocol)}`
              );
            }
            break;
          }

          default:
            console.log(`  ${symbols.cross} ${theme.error(`Unknown action: ${action}`)}`);
            console.log(`  ${theme.dim('Run /net to see available actions')}`);
        }

        console.log('');
      }
    });

    api.log.info('Network Tools plugin activated');
  }
};

export default plugin;
