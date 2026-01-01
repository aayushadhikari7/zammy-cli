import https from 'https';
import http from 'http';
import { URL } from 'url';

export interface RequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface RequestResult {
  success: boolean;
  statusCode?: number;
  statusMessage?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: string;
  time?: number;
  error?: string;
}

export async function makeRequest(urlStr: string, options: RequestOptions = { method: 'GET' }): Promise<RequestResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'Request timed out' });
    }, options.timeout || 30000);

    try {
      const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      const client = url.protocol === 'https:' ? https : http;

      const reqOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method.toUpperCase(),
        headers: {
          'User-Agent': 'Zammy-CLI/1.0',
          ...options.headers,
        },
      };

      const req = client.request(reqOptions, (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        res.on('end', () => {
          clearTimeout(timeout);
          resolve({
            success: true,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            body,
            time: Date.now() - startTime,
          });
        });
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    } catch (error) {
      clearTimeout(timeout);
      resolve({ success: false, error: error instanceof Error ? error.message : 'Request failed' });
    }
  });
}

export function formatHeaders(headers: Record<string, string | string[] | undefined>): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      lines.push(`${key}: ${displayValue}`);
    }
  }
  return lines;
}

export function tryParseJson(body: string): { isJson: boolean; formatted?: string } {
  try {
    const parsed = JSON.parse(body);
    return { isJson: true, formatted: JSON.stringify(parsed, null, 2) };
  } catch {
    return { isJson: false };
  }
}
