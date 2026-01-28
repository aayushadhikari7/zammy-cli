import { describe, it, expect } from 'vitest';
import {
  getSSHDir,
  sshDirExists,
  listSSHKeys,
  getPublicKeyContent,
  keyExists,
} from './ssh.js';
import { homedir } from 'os';
import { join } from 'path';

describe('ssh handler', () => {
  describe('getSSHDir', () => {
    it('returns the .ssh directory path', () => {
      const dir = getSSHDir();
      expect(dir).toBe(join(homedir(), '.ssh'));
    });
  });

  describe('sshDirExists', () => {
    it('returns a boolean', () => {
      const exists = sshDirExists();
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('listSSHKeys', () => {
    it('returns an array', () => {
      const keys = listSSHKeys();
      expect(Array.isArray(keys)).toBe(true);
    });

    it('returns keys with required properties', () => {
      const keys = listSSHKeys();
      for (const key of keys) {
        expect(key).toHaveProperty('name');
        expect(key).toHaveProperty('type');
        expect(key).toHaveProperty('hasPrivate');
        expect(key).toHaveProperty('hasPublic');
      }
    });

    it('keys have valid type values', () => {
      const keys = listSSHKeys();
      const validTypes = ['rsa', 'ed25519', 'ecdsa', 'dsa', 'unknown'];
      for (const key of keys) {
        expect(validTypes).toContain(key.type);
      }
    });
  });

  describe('getPublicKeyContent', () => {
    it('returns null for non-existent key', () => {
      const content = getPublicKeyContent('nonexistent_key_12345');
      expect(content).toBeNull();
    });

    it('returns string or null', () => {
      const keys = listSSHKeys();
      if (keys.length > 0 && keys[0].hasPublic) {
        const content = getPublicKeyContent(keys[0].name);
        expect(typeof content === 'string' || content === null).toBe(true);
      }
    });
  });

  describe('keyExists', () => {
    it('returns false for non-existent key', () => {
      expect(keyExists('nonexistent_key_12345')).toBe(false);
    });

    it('returns boolean', () => {
      expect(typeof keyExists('id_rsa')).toBe('boolean');
    });
  });
});
