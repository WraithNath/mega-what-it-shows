// What #4471 holds, one ticket per problem. Counts come from the desk's own view (causes.ts), so they
// match CauseTable: a report is counted under the cause it is filed by, and the desk's one-day moves
// (desk-notes.json) are footnoted under it.
import { groupByCause, readAs, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day';

export type ProblemInfo = { title: string; issue: number; state: string };

// One ticket per problem, in the repo that tracks the split.
export const ISSUE_REPO = 'https://github.com/WraithNath/mega-what-it-shows/issues';

// State after the engineering update on #4471 (closed 5 Oct).
export const PROBLEMS: Record<Problem, ProblemInfo> = {
  parser: { title: 'Shared parser reads day-first dates month first', issue: 1, state: 'fixed' },
  hint: { title: 'booking-v3 prints MM/DD/YYYY under the date for day-first tenants', issue: 2, state: "won't fix: booking-v3 retired" },
  'one-day': { title: 'Invites land one day off', issue: 3, state: 'open' },
};

export type ProblemRow = {
  problem: Problem | 'unplaced';
  reports: number;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // For one-day: the cause these reports are counted under.
  countedUnder?: string;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { total: number; rows: ProblemRow[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const groups = groupByCause(merged, tenantOf);
  const rows: ProblemRow[] = groups.map((g) => ({
    problem: g.cause,
    reports: g.reports.length,
    tenants: g.tenants,
    firstSeen: g.firstSeen,
    lastSeen: g.lastSeen,
  }));
  for (const g of groups) {
    const n = readAs(g, oneDayMove);
    if (!n) continue;
    const rs = g.reports.filter((r) => oneDayMove.includes(r.id));
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    rows.push({
      problem: 'one-day',
      reports: n,
      tenants: new Set(rs.map((r) => r.tenant)).size,
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
      countedUnder: g.cause,
    });
  }
  return { total: merged.length, rows };
}
