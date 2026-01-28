import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface Snippet {
  name: string;
  content: string;
  language?: string;
  description?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

const SNIPPETS_DIR = join(homedir(), '.zammy', 'snippets');

function ensureDir(): void {
  if (!existsSync(SNIPPETS_DIR)) {
    mkdirSync(SNIPPETS_DIR, { recursive: true });
  }
}

function getSnippetPath(name: string): string {
  return join(SNIPPETS_DIR, `${name}.json`);
}

export function saveSnippet(
  name: string,
  content: string,
  options: { language?: string; description?: string; tags?: string[] } = {}
): { success: boolean; error?: string } {
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    return {
      success: false,
      error: 'Snippet name must start with a letter and contain only letters, numbers, underscores, and hyphens'
    };
  }

  ensureDir();

  const existing = getSnippet(name);
  const now = Date.now();

  const snippet: Snippet = {
    name,
    content,
    language: options.language,
    description: options.description,
    tags: options.tags,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  writeFileSync(getSnippetPath(name), JSON.stringify(snippet, null, 2));
  return { success: true };
}

export function getSnippet(name: string): Snippet | null {
  const path = getSnippetPath(name);
  if (!existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

export function deleteSnippet(name: string): { success: boolean; error?: string } {
  const path = getSnippetPath(name);
  if (!existsSync(path)) {
    return { success: false, error: `Snippet "${name}" not found` };
  }

  unlinkSync(path);
  return { success: true };
}

export function listSnippets(): Snippet[] {
  ensureDir();

  const files = readdirSync(SNIPPETS_DIR).filter(f => f.endsWith('.json'));
  const snippets: Snippet[] = [];

  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(join(SNIPPETS_DIR, file), 'utf-8'));
      snippets.push(data);
    } catch {
      // Skip invalid files
    }
  }

  return snippets.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function searchSnippets(query: string): Snippet[] {
  const snippets = listSnippets();
  const lowerQuery = query.toLowerCase();

  return snippets.filter(s =>
    s.name.toLowerCase().includes(lowerQuery) ||
    s.content.toLowerCase().includes(lowerQuery) ||
    s.description?.toLowerCase().includes(lowerQuery) ||
    s.language?.toLowerCase().includes(lowerQuery) ||
    s.tags?.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

export function getSnippetsByLanguage(language: string): Snippet[] {
  const snippets = listSnippets();
  return snippets.filter(s => s.language?.toLowerCase() === language.toLowerCase());
}

export function getSnippetsByTag(tag: string): Snippet[] {
  const snippets = listSnippets();
  const lowerTag = tag.toLowerCase();
  return snippets.filter(s => s.tags?.some(t => t.toLowerCase() === lowerTag));
}
