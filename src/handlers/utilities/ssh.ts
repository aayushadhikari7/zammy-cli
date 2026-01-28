import { existsSync, readdirSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

export interface SSHKey {
  name: string;
  type: 'rsa' | 'ed25519' | 'ecdsa' | 'dsa' | 'unknown';
  hasPrivate: boolean;
  hasPublic: boolean;
  fingerprint?: string;
  comment?: string;
  bits?: number;
}

const SSH_DIR = join(homedir(), '.ssh');

export function getSSHDir(): string {
  return SSH_DIR;
}

export function sshDirExists(): boolean {
  return existsSync(SSH_DIR);
}

export function listSSHKeys(): SSHKey[] {
  if (!sshDirExists()) {
    return [];
  }

  const files = readdirSync(SSH_DIR);
  const keyMap = new Map<string, SSHKey>();

  // Find all key files
  for (const file of files) {
    // Skip known_hosts, config, and other non-key files
    if (['known_hosts', 'config', 'authorized_keys', 'environment'].includes(file)) {
      continue;
    }

    // Check for public keys
    if (file.endsWith('.pub')) {
      const name = file.slice(0, -4);
      const key = keyMap.get(name) || createEmptyKey(name);
      key.hasPublic = true;

      // Parse public key
      const pubKeyInfo = parsePublicKey(join(SSH_DIR, file));
      if (pubKeyInfo) {
        key.type = pubKeyInfo.type;
        key.fingerprint = pubKeyInfo.fingerprint;
        key.comment = pubKeyInfo.comment;
        key.bits = pubKeyInfo.bits;
      }

      keyMap.set(name, key);
    }
    // Check for private keys (files without .pub that aren't config files)
    else if (!file.includes('.')) {
      const name = file;
      const key = keyMap.get(name) || createEmptyKey(name);
      key.hasPrivate = true;

      // Try to determine type from corresponding public key
      if (!key.type || key.type === 'unknown') {
        key.type = guessKeyType(name);
      }

      keyMap.set(name, key);
    }
  }

  return Array.from(keyMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function createEmptyKey(name: string): SSHKey {
  return {
    name,
    type: 'unknown',
    hasPrivate: false,
    hasPublic: false,
  };
}

function guessKeyType(name: string): SSHKey['type'] {
  if (name.includes('ed25519')) return 'ed25519';
  if (name.includes('ecdsa')) return 'ecdsa';
  if (name.includes('rsa')) return 'rsa';
  if (name.includes('dsa')) return 'dsa';
  return 'unknown';
}

function parsePublicKey(path: string): {
  type: SSHKey['type'];
  fingerprint: string;
  comment?: string;
  bits?: number;
} | null {
  try {
    const content = readFileSync(path, 'utf-8').trim();
    const parts = content.split(' ');

    if (parts.length < 2) return null;

    const keyType = parts[0];
    const keyData = parts[1];
    const comment = parts.length > 2 ? parts.slice(2).join(' ') : undefined;

    // Determine type
    let type: SSHKey['type'] = 'unknown';
    if (keyType.includes('ed25519')) type = 'ed25519';
    else if (keyType.includes('ecdsa')) type = 'ecdsa';
    else if (keyType.includes('rsa')) type = 'rsa';
    else if (keyType.includes('dsa')) type = 'dsa';

    // Calculate fingerprint (SHA256)
    const decoded = Buffer.from(keyData, 'base64');
    const hash = createHash('sha256').update(decoded).digest('base64');
    const fingerprint = `SHA256:${hash.replace(/=+$/, '')}`;

    // Estimate bits for RSA keys
    let bits: number | undefined;
    if (type === 'rsa') {
      // RSA key size can be estimated from decoded length
      bits = Math.round(decoded.length * 8 / 1.2); // Rough estimate
      // Normalize to common sizes
      if (bits < 2048) bits = 1024;
      else if (bits < 3072) bits = 2048;
      else if (bits < 4096) bits = 3072;
      else bits = 4096;
    }

    return { type, fingerprint, comment, bits };
  } catch {
    return null;
  }
}

export function getPublicKeyContent(name: string): string | null {
  const pubPath = join(SSH_DIR, `${name}.pub`);
  if (!existsSync(pubPath)) {
    return null;
  }

  try {
    return readFileSync(pubPath, 'utf-8').trim();
  } catch {
    return null;
  }
}

export function generateSSHKey(
  name: string,
  type: 'ed25519' | 'rsa' = 'ed25519',
  comment?: string
): { success: boolean; error?: string; path?: string } {
  const keyPath = join(SSH_DIR, name);

  if (existsSync(keyPath) || existsSync(`${keyPath}.pub`)) {
    return { success: false, error: `Key "${name}" already exists` };
  }

  try {
    const commentArg = comment || `${process.env.USER || 'user'}@${require('os').hostname()}`;
    const bits = type === 'rsa' ? '-b 4096' : '';

    execSync(
      `ssh-keygen -t ${type} ${bits} -C "${commentArg}" -f "${keyPath}" -N ""`,
      { stdio: 'pipe' }
    );

    return { success: true, path: keyPath };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate key',
    };
  }
}

export function keyExists(name: string): boolean {
  const keyPath = join(SSH_DIR, name);
  return existsSync(keyPath) || existsSync(`${keyPath}.pub`);
}
