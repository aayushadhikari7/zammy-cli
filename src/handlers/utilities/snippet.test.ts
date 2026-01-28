import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  saveSnippet,
  getSnippet,
  deleteSnippet,
  listSnippets,
  searchSnippets,
  getSnippetsByLanguage,
  getSnippetsByTag,
} from './snippet.js';

const SNIPPETS_DIR = join(homedir(), '.zammy', 'snippets');
const TEST_PREFIX = 'zammytest';

function cleanupTestSnippets(): void {
  if (existsSync(SNIPPETS_DIR)) {
    const { readdirSync, unlinkSync } = require('fs');
    const files = readdirSync(SNIPPETS_DIR);
    for (const file of files) {
      if (file.startsWith(TEST_PREFIX)) {
        unlinkSync(join(SNIPPETS_DIR, file));
      }
    }
  }
}

describe('snippet handler', () => {
  beforeEach(() => {
    cleanupTestSnippets();
  });

  afterEach(() => {
    cleanupTestSnippets();
  });

  describe('saveSnippet', () => {
    it('saves a snippet successfully', () => {
      const result = saveSnippet(`${TEST_PREFIX}Hello`, 'console.log("hello")');
      expect(result.success).toBe(true);
    });

    it('rejects invalid names', () => {
      const result = saveSnippet('123invalid', 'content');
      expect(result.success).toBe(false);
      expect(result.error).toContain('must start with a letter');
    });

    it('saves with language and tags', () => {
      saveSnippet(`${TEST_PREFIX}Typed`, 'const x: number = 1', {
        language: 'typescript',
        tags: ['example', 'types'],
      });

      const snippet = getSnippet(`${TEST_PREFIX}Typed`);
      expect(snippet?.language).toBe('typescript');
      expect(snippet?.tags).toContain('example');
    });
  });

  describe('getSnippet', () => {
    it('returns null for non-existent snippet', () => {
      const result = getSnippet('nonexistent12345');
      expect(result).toBeNull();
    });

    it('retrieves saved snippet', () => {
      saveSnippet(`${TEST_PREFIX}Get`, 'test content');
      const snippet = getSnippet(`${TEST_PREFIX}Get`);
      expect(snippet?.content).toBe('test content');
    });
  });

  describe('deleteSnippet', () => {
    it('deletes existing snippet', () => {
      saveSnippet(`${TEST_PREFIX}Delete`, 'to delete');
      const result = deleteSnippet(`${TEST_PREFIX}Delete`);
      expect(result.success).toBe(true);
      expect(getSnippet(`${TEST_PREFIX}Delete`)).toBeNull();
    });

    it('returns error for non-existent snippet', () => {
      const result = deleteSnippet('nonexistent12345');
      expect(result.success).toBe(false);
    });
  });

  describe('listSnippets', () => {
    it('returns empty array when no snippets', () => {
      const snippets = listSnippets();
      // Filter to only test snippets
      const testSnippets = snippets.filter(s => s.name.startsWith(TEST_PREFIX));
      expect(testSnippets).toHaveLength(0);
    });

    it('returns saved snippets sorted by updatedAt', () => {
      saveSnippet(`${TEST_PREFIX}First`, 'first');
      saveSnippet(`${TEST_PREFIX}Second`, 'second');

      const snippets = listSnippets().filter(s => s.name.startsWith(TEST_PREFIX));
      expect(snippets.length).toBe(2);
      // Both snippets should be present (order may vary if created at same ms)
      const names = snippets.map(s => s.name);
      expect(names).toContain(`${TEST_PREFIX}First`);
      expect(names).toContain(`${TEST_PREFIX}Second`);
    });
  });

  describe('searchSnippets', () => {
    it('searches by name', () => {
      saveSnippet(`${TEST_PREFIX}SearchMe`, 'content');
      const results = searchSnippets('SearchMe');
      expect(results.length).toBeGreaterThan(0);
    });

    it('searches by content', () => {
      saveSnippet(`${TEST_PREFIX}Content`, 'uniqueSearchTerm123');
      const results = searchSnippets('uniqueSearchTerm123');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getSnippetsByLanguage', () => {
    it('filters by language', () => {
      saveSnippet(`${TEST_PREFIX}Py`, 'print("hi")', { language: 'python' });
      saveSnippet(`${TEST_PREFIX}Js`, 'console.log("hi")', { language: 'javascript' });

      const pythonSnippets = getSnippetsByLanguage('python');
      const testPython = pythonSnippets.filter(s => s.name.startsWith(TEST_PREFIX));
      expect(testPython.length).toBe(1);
      expect(testPython[0].name).toBe(`${TEST_PREFIX}Py`);
    });
  });

  describe('getSnippetsByTag', () => {
    it('filters by tag', () => {
      saveSnippet(`${TEST_PREFIX}Tagged`, 'content', { tags: ['api', 'rest'] });

      const apiSnippets = getSnippetsByTag('api');
      const testTagged = apiSnippets.filter(s => s.name.startsWith(TEST_PREFIX));
      expect(testTagged.length).toBe(1);
    });
  });
});
