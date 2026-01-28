import { execSync } from 'child_process';

export interface Commit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  type?: string;
  scope?: string;
  subject?: string;
}

export interface ChangelogSection {
  type: string;
  title: string;
  commits: Commit[];
}

export interface Changelog {
  from: string;
  to: string;
  sections: ChangelogSection[];
  totalCommits: number;
}

const TYPE_MAP: Record<string, string> = {
  feat: 'Features',
  fix: 'Bug Fixes',
  docs: 'Documentation',
  style: 'Styles',
  refactor: 'Code Refactoring',
  perf: 'Performance Improvements',
  test: 'Tests',
  build: 'Build System',
  ci: 'CI/CD',
  chore: 'Chores',
  revert: 'Reverts',
};

export function parseConventionalCommit(message: string): { type?: string; scope?: string; subject: string } {
  // Match: type(scope): subject or type: subject
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);

  if (match) {
    return {
      type: match[1].toLowerCase(),
      scope: match[2],
      subject: match[3],
    };
  }

  return { subject: message };
}

export function getGitLog(from?: string, to: string = 'HEAD'): Commit[] {
  try {
    const range = from ? `${from}..${to}` : to;
    const format = '%H|%h|%an|%ad|%s';
    const cmd = `git log ${range} --pretty=format:"${format}" --date=short`;

    const output = execSync(cmd, { encoding: 'utf-8', timeout: 10000 }).trim();

    if (!output) return [];

    return output.split('\n').map(line => {
      const [hash, shortHash, author, date, message] = line.split('|');
      const parsed = parseConventionalCommit(message);

      return {
        hash,
        shortHash,
        author,
        date,
        message,
        type: parsed.type,
        scope: parsed.scope,
        subject: parsed.subject,
      };
    });
  } catch {
    return [];
  }
}

export function generateChangelog(from?: string, to: string = 'HEAD'): Changelog {
  const commits = getGitLog(from, to);
  const sections: ChangelogSection[] = [];

  // Group commits by type
  const grouped = new Map<string, Commit[]>();
  const other: Commit[] = [];

  for (const commit of commits) {
    if (commit.type && TYPE_MAP[commit.type]) {
      const existing = grouped.get(commit.type) || [];
      existing.push(commit);
      grouped.set(commit.type, existing);
    } else {
      other.push(commit);
    }
  }

  // Create sections in order
  const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'revert'];

  for (const type of typeOrder) {
    const typeCommits = grouped.get(type);
    if (typeCommits && typeCommits.length > 0) {
      sections.push({
        type,
        title: TYPE_MAP[type],
        commits: typeCommits,
      });
    }
  }

  if (other.length > 0) {
    sections.push({
      type: 'other',
      title: 'Other Changes',
      commits: other,
    });
  }

  return {
    from: from || 'beginning',
    to,
    sections,
    totalCommits: commits.length,
  };
}

export function formatChangelogMarkdown(changelog: Changelog): string {
  const lines: string[] = [];

  lines.push(`# Changelog`);
  lines.push('');
  lines.push(`Changes from ${changelog.from} to ${changelog.to}`);
  lines.push('');

  for (const section of changelog.sections) {
    lines.push(`## ${section.title}`);
    lines.push('');

    for (const commit of section.commits) {
      const scope = commit.scope ? `**${commit.scope}:** ` : '';
      lines.push(`- ${scope}${commit.subject} (${commit.shortHash})`);
    }

    lines.push('');
  }

  lines.push(`---`);
  lines.push(`*${changelog.totalCommits} commits*`);

  return lines.join('\n');
}

export function formatChangelogJson(changelog: Changelog): string {
  return JSON.stringify(changelog, null, 2);
}

export function getLatestTag(): string | null {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8', timeout: 5000 }).trim();
  } catch {
    return null;
  }
}

export function getTags(): string[] {
  try {
    const output = execSync('git tag --sort=-creatordate', { encoding: 'utf-8', timeout: 5000 }).trim();
    return output ? output.split('\n') : [];
  } catch {
    return [];
  }
}
