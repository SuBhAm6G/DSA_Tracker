/**
 * Date & time utilities
 */

import { formatDistanceToNowStrict, format, isToday, isYesterday } from 'date-fns';

export function humanDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d))     return 'Completed today';
  if (isYesterday(d)) return 'Completed yesterday';
  return `Completed ${formatDistanceToNowStrict(d, { addSuffix: true })}`;
}

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (isToday(d))     return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function exactDate(iso: string): string {
  return format(new Date(iso), 'PPpp'); // Aug 15, 2026, 10:30 AM
}

export function toDateKey(iso: string, tz = 'UTC'): string {
  // Returns YYYY-MM-DD in given timezone
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz });
}

export function today(tz = 'UTC'): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

export function startOfWeekISO(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Streak calculation
 */
export function computeStreaks(dates: string[]): {
  current: number;
  longest: number;
  activeDays: number;
} {
  if (!dates.length) return { current: 0, longest: 0, activeDays: 0 };

  const unique = [...new Set(dates)].sort();
  const activeDays = unique.length;

  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak (counting from today backwards)
  const todayStr = today();
  let current = 0;
  const set = new Set(unique);
  let check = new Date(todayStr);
  while (set.has(check.toLocaleDateString('en-CA'))) {
    current++;
    check.setDate(check.getDate() - 1);
  }
  // If today not in set, check if yesterday is (streak might be ongoing from yesterday)
  if (current === 0) {
    const yesterday = new Date(todayStr);
    yesterday.setDate(yesterday.getDate() - 1);
    check = yesterday;
    while (set.has(check.toLocaleDateString('en-CA'))) {
      current++;
      check.setDate(check.getDate() - 1);
    }
  }

  return { current, longest, activeDays };
}

/**
 * Heatmap data
 */
export interface HeatDay {
  date: string;   // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function toHeatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0)      return 0;
  if (count === 1)      return 1;
  if (count <= 3)       return 2;
  if (count <= 6)       return 3;
  return 4;
}

export function buildHeatmapYear(
  dayCounts: Record<string, number>,
  year: number
): HeatDay[] {
  const start = new Date(`${year}-01-01`);
  const end   = new Date(`${year}-12-31`);
  const days: HeatDay[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const key   = cur.toLocaleDateString('en-CA');
    const count = dayCounts[key] ?? 0;
    days.push({ date: key, count, level: toHeatLevel(count) });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/**
 * Progress helpers
 */
export function pct(completed: number, total: number): number {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Milestone definitions
 */
export const MILESTONES: Array<{ key: string; label: string; check: (stats: MilestoneStats) => boolean }> = [
  { key: 'first_topic',    label: 'First Topic Completed',     check: s => s.totalCompleted >= 1  },
  { key: '10_topics',      label: '10 Topics Completed',       check: s => s.totalCompleted >= 10 },
  { key: '25_topics',      label: '25 Topics Completed',       check: s => s.totalCompleted >= 25 },
  { key: '50_topics',      label: '50 Topics Completed',       check: s => s.totalCompleted >= 50 },
  { key: '100_topics',     label: '100 Topics Completed',      check: s => s.totalCompleted >= 100 },
  { key: '7_day_streak',   label: '7-Day Streak',              check: s => s.currentStreak >= 7   },
  { key: '30_day_streak',  label: '30-Day Streak',             check: s => s.currentStreak >= 30  },
  { key: '100_active_days', label: '100 Active Days',          check: s => s.activeDays >= 100    },
  { key: 'list1_complete', label: 'List 1 Complete',           check: s => s.list1Pct >= 100      },
  { key: 'list2_complete', label: 'List 2 Complete',           check: s => s.list2Pct >= 100      },
  { key: 'list3_complete', label: 'List 3 Complete',           check: s => s.list3Pct >= 100      },
  { key: 'list4_complete', label: 'Very High Tier Complete',   check: s => s.list4Pct >= 100      },
];

export interface MilestoneStats {
  totalCompleted: number;
  currentStreak: number;
  activeDays: number;
  list1Pct: number;
  list2Pct: number;
  list3Pct: number;
  list4Pct: number;
}
