import { readFileSync, existsSync } from 'fs';

export interface DiffLine {
  type: 'same' | 'add' | 'remove' | 'info';
  content: string;
  lineNum1?: number;
  lineNum2?: number;
}

export interface DiffResult {
  success: boolean;
  lines: DiffLine[];
  stats: {
    additions: number;
    deletions: number;
    unchanged: number;
  };
  error?: string;
}

export function diffFiles(file1: string, file2: string): DiffResult {
  if (!existsSync(file1)) {
    return { success: false, lines: [], stats: { additions: 0, deletions: 0, unchanged: 0 }, error: `File not found: ${file1}` };
  }
  if (!existsSync(file2)) {
    return { success: false, lines: [], stats: { additions: 0, deletions: 0, unchanged: 0 }, error: `File not found: ${file2}` };
  }

  try {
    const content1 = readFileSync(file1, 'utf-8');
    const content2 = readFileSync(file2, 'utf-8');

    return diffStrings(content1, content2);
  } catch (error) {
    return {
      success: false,
      lines: [],
      stats: { additions: 0, deletions: 0, unchanged: 0 },
      error: error instanceof Error ? error.message : 'Failed to read files'
    };
  }
}

export function diffStrings(str1: string, str2: string): DiffResult {
  const lines1 = str1.split('\n');
  const lines2 = str2.split('\n');

  // Simple LCS-based diff
  const lcs = computeLCS(lines1, lines2);
  const diff = buildDiff(lines1, lines2, lcs);

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const line of diff) {
    if (line.type === 'add') additions++;
    else if (line.type === 'remove') deletions++;
    else if (line.type === 'same') unchanged++;
  }

  return {
    success: true,
    lines: diff,
    stats: { additions, deletions, unchanged }
  };
}

function computeLCS(lines1: string[], lines2: string[]): number[][] {
  const m = lines1.length;
  const n = lines2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

function buildDiff(lines1: string[], lines2: string[], lcs: number[][]): DiffLine[] {
  const result: DiffLine[] = [];
  let i = lines1.length;
  let j = lines2.length;

  const temp: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      temp.push({ type: 'same', content: lines1[i - 1], lineNum1: i, lineNum2: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      temp.push({ type: 'add', content: lines2[j - 1], lineNum2: j });
      j--;
    } else if (i > 0) {
      temp.push({ type: 'remove', content: lines1[i - 1], lineNum1: i });
      i--;
    }
  }

  // Reverse to get correct order
  return temp.reverse();
}

export function formatDiffStats(stats: DiffResult['stats']): string {
  const parts: string[] = [];
  if (stats.additions > 0) parts.push(`+${stats.additions}`);
  if (stats.deletions > 0) parts.push(`-${stats.deletions}`);
  if (stats.unchanged > 0) parts.push(`=${stats.unchanged}`);
  return parts.join(', ');
}
