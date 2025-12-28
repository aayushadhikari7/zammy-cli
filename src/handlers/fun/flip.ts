export type CoinSide = 'heads' | 'tails';

export interface FlipResult {
  count: number;
  flips: CoinSide[];
  headsCount: number;
  tailsCount: number;
}

export const COIN_ART = {
  heads: [
    '    ╭──────────╮',
    '   ╱            ╲',
    '  │   ┌─────┐    │',
    '  │   │ ◉ ◉ │    │',
    '  │   │  ▽  │    │',
    '  │   │ ╰─╯ │    │',
    '  │   └─────┘    │',
    '   ╲            ╱',
    '    ╰──────────╯',
  ],
  tails: [
    '    ╭──────────╮',
    '   ╱            ╲',
    '  │   ┌─────┐    │',
    '  │   │  ★  │    │',
    '  │   │ ═══ │    │',
    '  │   │  ★  │    │',
    '  │   └─────┘    │',
    '   ╲            ╱',
    '    ╰──────────╯',
  ],
} as const;

export function flipCoins(count: number = 1): FlipResult {
  const safeCount = Math.min(Math.max(1, count), 10);
  const flips: CoinSide[] = [];

  for (let i = 0; i < safeCount; i++) {
    flips.push(Math.random() < 0.5 ? 'heads' : 'tails');
  }

  return {
    count: safeCount,
    flips,
    headsCount: flips.filter(f => f === 'heads').length,
    tailsCount: flips.filter(f => f === 'tails').length,
  };
}
