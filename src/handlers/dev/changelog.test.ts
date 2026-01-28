import { describe, it, expect } from 'vitest';
import { parseConventionalCommit, formatChangelogMarkdown } from './changelog.js';

describe('changelog handler', () => {
  describe('parseConventionalCommit', () => {
    it('parses type and subject', () => {
      const result = parseConventionalCommit('feat: add new feature');
      expect(result.type).toBe('feat');
      expect(result.scope).toBeUndefined();
      expect(result.subject).toBe('add new feature');
    });

    it('parses type, scope, and subject', () => {
      const result = parseConventionalCommit('fix(auth): resolve login issue');
      expect(result.type).toBe('fix');
      expect(result.scope).toBe('auth');
      expect(result.subject).toBe('resolve login issue');
    });

    it('handles non-conventional commits', () => {
      const result = parseConventionalCommit('Random commit message');
      expect(result.type).toBeUndefined();
      expect(result.scope).toBeUndefined();
      expect(result.subject).toBe('Random commit message');
    });

    it('handles various commit types', () => {
      expect(parseConventionalCommit('docs: update README').type).toBe('docs');
      expect(parseConventionalCommit('chore: update deps').type).toBe('chore');
      expect(parseConventionalCommit('refactor: clean up code').type).toBe('refactor');
      expect(parseConventionalCommit('test: add unit tests').type).toBe('test');
    });

    it('is case insensitive for type', () => {
      const result = parseConventionalCommit('FEAT: uppercase type');
      expect(result.type).toBe('feat');
    });
  });

  describe('formatChangelogMarkdown', () => {
    it('formats empty changelog', () => {
      const changelog = {
        from: 'v1.0.0',
        to: 'HEAD',
        sections: [],
        totalCommits: 0,
      };

      const md = formatChangelogMarkdown(changelog);
      expect(md).toContain('# Changelog');
      expect(md).toContain('v1.0.0');
      expect(md).toContain('HEAD');
      expect(md).toContain('0 commits');
    });

    it('formats sections correctly', () => {
      const changelog = {
        from: 'v1.0.0',
        to: 'v1.1.0',
        sections: [
          {
            type: 'feat',
            title: 'Features',
            commits: [
              {
                hash: 'abc123',
                shortHash: 'abc',
                author: 'Dev',
                date: '2024-01-01',
                message: 'feat: add feature',
                type: 'feat',
                subject: 'add feature',
              },
            ],
          },
        ],
        totalCommits: 1,
      };

      const md = formatChangelogMarkdown(changelog);
      expect(md).toContain('## Features');
      expect(md).toContain('add feature');
      expect(md).toContain('abc');
    });

    it('includes scope in output', () => {
      const changelog = {
        from: 'v1.0.0',
        to: 'v1.1.0',
        sections: [
          {
            type: 'fix',
            title: 'Bug Fixes',
            commits: [
              {
                hash: 'def456',
                shortHash: 'def',
                author: 'Dev',
                date: '2024-01-01',
                message: 'fix(api): fix endpoint',
                type: 'fix',
                scope: 'api',
                subject: 'fix endpoint',
              },
            ],
          },
        ],
        totalCommits: 1,
      };

      const md = formatChangelogMarkdown(changelog);
      expect(md).toContain('**api:**');
    });
  });
});
