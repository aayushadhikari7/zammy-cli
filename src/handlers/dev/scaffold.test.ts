import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getTemplates,
  getTemplate,
  getTemplateNames,
  isValidTemplateName,
  scaffold,
} from './scaffold.js';

const TEST_DIR = join(tmpdir(), 'zammy-scaffold-test');

function cleanup() {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

describe('scaffold handler', () => {
  afterEach(() => {
    cleanup();
  });

  describe('getTemplates', () => {
    it('returns all templates', () => {
      const templates = getTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('templates have required properties', () => {
      const templates = getTemplates();
      for (const template of templates) {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('files');
        expect(Array.isArray(template.files)).toBe(true);
      }
    });
  });

  describe('getTemplate', () => {
    it('returns node-cli template', () => {
      const template = getTemplate('node-cli');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Node.js CLI');
    });

    it('returns ts-lib template', () => {
      const template = getTemplate('ts-lib');
      expect(template).toBeDefined();
      expect(template?.name).toBe('TypeScript Library');
    });

    it('returns express-api template', () => {
      const template = getTemplate('express-api');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Express API');
    });

    it('returns react-component template', () => {
      const template = getTemplate('react-component');
      expect(template).toBeDefined();
      expect(template?.name).toBe('React Component');
    });
  });

  describe('getTemplateNames', () => {
    it('returns array of template names', () => {
      const names = getTemplateNames();
      expect(names).toContain('node-cli');
      expect(names).toContain('ts-lib');
      expect(names).toContain('express-api');
      expect(names).toContain('react-component');
    });
  });

  describe('isValidTemplateName', () => {
    it('returns true for valid names', () => {
      expect(isValidTemplateName('node-cli')).toBe(true);
      expect(isValidTemplateName('ts-lib')).toBe(true);
    });

    it('returns false for invalid names', () => {
      expect(isValidTemplateName('invalid')).toBe(false);
      expect(isValidTemplateName('foo')).toBe(false);
    });
  });

  describe('scaffold', () => {
    it('creates a project from template', () => {
      const result = scaffold('node-cli', 'test-project', TEST_DIR);

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.files?.length).toBeGreaterThan(0);

      // Check files were created
      expect(existsSync(join(TEST_DIR, 'test-project', 'package.json'))).toBe(true);
      expect(existsSync(join(TEST_DIR, 'test-project', 'src', 'index.ts'))).toBe(true);
    });

    it('replaces placeholders in files', () => {
      scaffold('node-cli', 'my-app', TEST_DIR);

      const { readFileSync } = require('fs');
      const pkg = readFileSync(join(TEST_DIR, 'my-app', 'package.json'), 'utf-8');

      expect(pkg).toContain('"name": "my-app"');
      expect(pkg).not.toContain('{{name}}');
    });

    it('rejects invalid project names', () => {
      const result = scaffold('node-cli', 'Invalid Name', TEST_DIR);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must start with a letter');
    });

    it('rejects if directory exists', () => {
      const { mkdirSync } = require('fs');
      mkdirSync(join(TEST_DIR, 'existing'), { recursive: true });

      const result = scaffold('node-cli', 'existing', TEST_DIR);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });
});
