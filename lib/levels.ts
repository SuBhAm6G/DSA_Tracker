export interface Rank {
  level: number;
  name: string;
  threshold: number; // Total completed topics required
}

export const KNIGHT_RANKS: Rank[] = [
  { level: 1, name: 'Peasant Recruit', threshold: 0 },
  { level: 2, name: 'Squire in Training', threshold: 5 },
  { level: 3, name: 'Apprentice Squire', threshold: 12 },
  { level: 4, name: 'Senior Squire', threshold: 20 },
  { level: 5, name: 'Foot Soldier', threshold: 35 },
  { level: 6, name: 'Frontline Warrior', threshold: 50 },
  { level: 7, name: 'Veteran Warrior', threshold: 70 },
  { level: 8, name: 'Knight Errant', threshold: 95 },
  { level: 9, name: 'Honored Knight', threshold: 120 },
  { level: 10, name: 'Elite Knight', threshold: 150 },
  { level: 11, name: 'Knight Commander', threshold: 180 },
  { level: 12, name: 'Paladin', threshold: 215 },
  { level: 13, name: 'Grand Paladin', threshold: 250 },
  { level: 14, name: 'Lord Commander', threshold: 280 },
  { level: 15, name: 'Kingslayer', threshold: 300 },
];

export function getRank(totalCompleted: number): Rank {
  let currentRank = KNIGHT_RANKS[0];
  for (const rank of KNIGHT_RANKS) {
    if (totalCompleted >= rank.threshold) {
      currentRank = rank;
    } else {
      break;
    }
  }
  return currentRank;
}

export function getNextRank(totalCompleted: number): Rank | null {
  const currentRank = getRank(totalCompleted);
  if (currentRank.level === 15) return null;
  return KNIGHT_RANKS[currentRank.level]; // index is level since level is 1-indexed
}
