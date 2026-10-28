<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { ISSUE_REPO, PROBLEMS, splitTicket } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  const groups = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const total = $derived(groups.reduce((n, g) => n + g.reports.length, 0));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{total}</strong> reports in #{ticket} · <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      {@const info = g.problem === 'unplaced' ? null : PROBLEMS[g.problem]}
      <tr>
        <td><code>{g.problem}</code>{#if info}<br /><span class="what">{info.title}</span>{/if}</td>
        <td>{g.reports.length}</td>
        <td>{g.tenants.length}</td>
        <td class="muted">{channels(g.channels)}</td>
        <td class="muted">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if info}<a href="{ISSUE_REPO}/{info.issue}">#{info.issue}</a>{:else}none{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .what { font-size: 0.85em; }
  .muted { color: var(--muted); font-size: 0.85em; }
</style>
