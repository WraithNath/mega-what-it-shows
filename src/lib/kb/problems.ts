// What #4471 holds once it is read by cause, not by subject. Pages explain it; this file is what runs.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

// `parser` and `hint` swap the day and the month (causes.ts). A one-day move is neither: the date
// keeps its day and month and lands a day early or late. The desk reads those from the body
// (desk-notes.json); causes.ts would file them under their tenant's cause.
export type Problem = 'parser' | 'hint' | 'one-day';

export type ProblemInfo = { title: string; what: string; issue: number };

// One ticket per problem, in the repo that tracks the split.
export const ISSUE_REPO = 'https://github.com/WraithNath/mega-what-it-shows/issues';

export const PROBLEMS: Record<Problem, ProblemInfo> = {
  parser: {
    title: 'Shared parser reads day-first dates month first',
    what: 'A day-first tenant books 7 April; the invite goes out for 4 July.',
    issue: 1,
  },
  hint: {
    title: 'booking-v3 prints MM/DD/YYYY under the date for day-first tenants',
    what: 'People type what the hint says; the form reads it the tenant’s way.',
    issue: 2,
  },
  'one-day': {
    title: 'Invites land one day off',
    what: 'Day and month are right; the day is not. Seen across time zones.',
    issue: 3,
  },
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem | null {
  return oneDayMove.includes(r.id) ? 'one-day' : causeOf(r, t);
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // How many intake tagged as something other than this problem.
  mistagged: number;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const by = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of uniqueById(all).filter((r) => r.mergedInto === ticket)) {
    const p = problemOf(r, tenantOf(r), oneDayMove) ?? 'unplaced';
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
