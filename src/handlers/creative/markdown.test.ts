import { describe, it, expect } from 'vitest';
import { renderMarkdown, getMarkdownStats } from './markdown.js';

describe('markdown handler', () => {
  describe('renderMarkdown', () => {
    it('renders headers', () => {
      const result = renderMarkdown('# Hello World');
      expect(result).toContain('Hello World');
    });

    it('renders multiple header levels', () => {
      const input = `# H1
## H2
### H3`;
      const result = renderMarkdown(input);
      expect(result).toContain('H1');
      expect(result).toContain('H2');
      expect(result).toContain('H3');
    });

    it('renders unordered lists', () => {
      const input = `- Item 1
- Item 2
- Item 3`;
      const result = renderMarkdown(input);
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('•');
    });

    it('renders ordered lists', () => {
      const input = `1. First
2. Second
3. Third`;
      const result = renderMarkdown(input);
      expect(result).toContain('First');
      expect(result).toContain('1.');
    });

    it('renders code blocks', () => {
      const input = '```js\nconsole.log("hello");\n```';
      const result = renderMarkdown(input);
      expect(result).toContain('console.log');
      expect(result).toContain('js');
    });

    it('renders blockquotes', () => {
      const input = '> This is a quote';
      const result = renderMarkdown(input);
      expect(result).toContain('This is a quote');
      expect(result).toContain('│');
    });

    it('handles empty lines', () => {
      const input = `Line 1

Line 2`;
      const result = renderMarkdown(input);
      expect(result.split('\n').length).toBeGreaterThan(2);
    });

    it('renders horizontal rules', () => {
      const input = '---';
      const result = renderMarkdown(input);
      expect(result).toContain('─');
    });
  });

  describe('inline formatting', () => {
    it('handles bold text', () => {
      const result = renderMarkdown('This is **bold** text');
      expect(result).toContain('bold');
    });

    it('handles italic text', () => {
      const result = renderMarkdown('This is *italic* text');
      expect(result).toContain('italic');
    });

    it('handles inline code', () => {
      const result = renderMarkdown('Use `code` here');
      expect(result).toContain('code');
    });

    it('handles links', () => {
      const result = renderMarkdown('[Click here](https://example.com)');
      expect(result).toContain('Click here');
      expect(result).toContain('example.com');
    });

    it('handles images', () => {
      const result = renderMarkdown('![Alt text](image.png)');
      expect(result).toContain('Alt text');
      expect(result).toContain('Image');
    });

    it('handles strikethrough', () => {
      const result = renderMarkdown('This is ~~deleted~~ text');
      expect(result).toContain('deleted');
    });
  });

  describe('getMarkdownStats', () => {
    it('counts lines', () => {
      const stats = getMarkdownStats('Line 1\nLine 2\nLine 3');
      expect(stats.lines).toBe(3);
    });

    it('counts words', () => {
      const stats = getMarkdownStats('Hello world this is a test');
      expect(stats.words).toBe(6);
    });

    it('counts headers', () => {
      const stats = getMarkdownStats('# H1\n## H2\n### H3');
      expect(stats.headers).toBe(3);
    });

    it('counts code blocks', () => {
      const stats = getMarkdownStats('```js\ncode\n```\n```py\ncode\n```');
      expect(stats.codeBlocks).toBe(2);
    });

    it('counts links', () => {
      const stats = getMarkdownStats('[a](b) and [c](d)');
      expect(stats.links).toBe(2);
    });

    it('counts list items', () => {
      const stats = getMarkdownStats('- Item 1\n- Item 2\n1. Numbered');
      expect(stats.lists).toBe(3);
    });
  });
});
