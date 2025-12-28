export interface DiceResult {
  count: number;
  sides: number;
  rolls: number[];
  total: number;
  isStandardD6: boolean;
}

export const DICE_ART: Record<number, string[]> = {
  1: [
    '┌─────────┐',
    '│         │',
    '│    ●    │',
    '│         │',
    '└─────────┘',
  ],
  2: [
    '┌─────────┐',
    '│  ●      │',
    '│         │',
    '│      ●  │',
    '└─────────┘',
  ],
  3: [
    '┌─────────┐',
    '│  ●      │',
    '│    ●    │',
    '│      ●  │',
    '└─────────┘',
  ],
  4: [
    '┌─────────┐',
    '│  ●   ●  │',
    '│         │',
    '│  ●   ●  │',
    '└─────────┘',
  ],
  5: [
    '┌─────────┐',
    '│  ●   ●  │',
    '│    ●    │',
    '│  ●   ●  │',
    '└─────────┘',
  ],
  6: [
    '┌─────────┐',
    '│  ●   ●  │',
    '│  ●   ●  │',
    '│  ●   ●  │',
    '└─────────┘',
  ],
};

export function rollDice(count: number = 1, sides: number = 6): DiceResult {
  const safeCount = Math.min(Math.max(1, count), 6);
  const safeSides = Math.max(2, sides);

  const rolls: number[] = [];
  for (let i = 0; i < safeCount; i++) {
    rolls.push(Math.floor(Math.random() * safeSides) + 1);
  }

  return {
    count: safeCount,
    sides: safeSides,
    rolls,
    total: rolls.reduce((a, b) => a + b, 0),
    isStandardD6: safeSides === 6 && safeCount <= 3,
  };
}
