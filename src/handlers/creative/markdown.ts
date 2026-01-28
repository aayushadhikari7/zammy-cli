import chalk from 'chalk';

export interface RenderOptions {
  width?: number;
}

// Simple terminal markdown renderer
export function renderMarkdown(text: string, options: RenderOptions = {}): string {
  const width = options.width || process.stdout.columns || 80;
  const lines = text.split('\n');
  const output: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        output.push(chalk.dim('  ┌' + '─'.repeat(Math.min(60, width - 6)) + '┐'));
        for (const codeLine of codeLines) {
          output.push(chalk.dim('  │ ') + chalk.cyan(codeLine));
        }
        output.push(chalk.dim('  └' + '─'.repeat(Math.min(60, width - 6)) + '┘'));
        if (codeBlockLang) {
          output.push(chalk.dim(`    (${codeBlockLang})`));
        }
        inCodeBlock = false;
        codeLines = [];
        codeBlockLang = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('######')) {
      output.push(chalk.dim('      ' + line.slice(6).trim()));
      continue;
    }
    if (line.startsWith('#####')) {
      output.push(chalk.dim('     ' + line.slice(5).trim()));
      continue;
    }
    if (line.startsWith('####')) {
      output.push(chalk.italic('    ' + line.slice(4).trim()));
      continue;
    }
    if (line.startsWith('###')) {
      output.push(chalk.cyan('   ' + line.slice(3).trim()));
      continue;
    }
    if (line.startsWith('##')) {
      output.push(chalk.cyan.bold('  ' + line.slice(2).trim()));
      continue;
    }
    if (line.startsWith('#')) {
      output.push('');
      output.push(chalk.magenta.bold('  ' + line.slice(1).trim()));
      output.push(chalk.magenta('  ' + '═'.repeat(line.slice(1).trim().length)));
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      output.push(chalk.dim('  ' + '─'.repeat(Math.min(40, width - 4))));
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s/.test(line)) {
      const indent = line.match(/^\s*/)?.[0].length || 0;
      const content = line.replace(/^\s*[-*+]\s/, '');
      output.push(' '.repeat(indent + 2) + chalk.cyan('•') + ' ' + renderInline(content));
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s/.test(line)) {
      const match = line.match(/^(\s*)(\d+)\.\s(.*)$/);
      if (match) {
        const [, indent, num, content] = match;
        output.push((indent || '') + '  ' + chalk.cyan(num + '.') + ' ' + renderInline(content));
      }
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const content = line.replace(/^>\s?/, '');
      output.push(chalk.dim('  │') + chalk.italic(' ' + renderInline(content)));
      continue;
    }

    // Empty line
    if (!line.trim()) {
      output.push('');
      continue;
    }

    // Image on its own line
    if (/^!\[([^\]]*)\]\([^)]+\)$/.test(line.trim())) {
      const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        output.push('  ' + chalk.dim(`[Image: ${match[1] || 'image'}]`));
        continue;
      }
    }

    // Regular paragraph
    output.push('  ' + renderInline(line));
  }

  return output.join('\n');
}

function renderInline(text: string): string {
  // Bold + Italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, (_, m) => chalk.bold.italic(m));
  text = text.replace(/___(.+?)___/g, (_, m) => chalk.bold.italic(m));

  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, (_, m) => chalk.bold(m));
  text = text.replace(/__(.+?)__/g, (_, m) => chalk.bold(m));

  // Italic
  text = text.replace(/\*(.+?)\*/g, (_, m) => chalk.italic(m));
  text = text.replace(/_(.+?)_/g, (_, m) => chalk.italic(m));

  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, (_, m) => chalk.strikethrough(m));

  // Inline code
  text = text.replace(/`([^`]+)`/g, (_, m) => chalk.bgGray.white(` ${m} `));

  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
    return chalk.cyan.underline(linkText) + chalk.dim(` (${url})`);
  });

  // Images ![alt](url) - just show alt text
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => {
    return chalk.dim(`[Image: ${alt || 'image'}]`);
  });

  return text;
}

export function getMarkdownStats(text: string): {
  lines: number;
  words: number;
  headers: number;
  codeBlocks: number;
  links: number;
  lists: number;
} {
  const lines = text.split('\n');
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const headers = lines.filter(l => /^#{1,6}\s/.test(l)).length;
  const codeBlocks = (text.match(/```/g) || []).length / 2;
  const links = (text.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length;
  const lists = lines.filter(l => /^\s*[-*+]\s/.test(l) || /^\s*\d+\.\s/.test(l)).length;

  return { lines: lines.length, words, headers, codeBlocks, links, lists };
}
