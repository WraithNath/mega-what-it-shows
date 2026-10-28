<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { ISSUE_REPO, PROBLEMS, splitTicket } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
</script>

<p class="sum">
  <strong>{split.total}</strong> reports in #{ticket} · <strong>{split.rows.length}</strong>
  {split.rows.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th><th>state</th></tr>
  </thead>
  <tbody>
    {#each split.rows as row (row.problem)}
      {@const info = row.problem === 'unplaced' ? null : PROBLEMS[row.problem]}
      <tr>
        <td><code>{row.problem}</code>{#if info}<br /><span class="what">{info.title}</span>{/if}</td>
        <td>{row.reports}{#if row.countedUnder}*{/if}</td>
        <td>{row.tenants}</td>
        <td class="muted">{row.firstSeen} → {row.lastSeen}</td>
        <td>{#if info}<a href="{ISSUE_REPO}/{info.issue}">#{info.issue}</a>{:else}none{/if}</td>
        <td class="muted">{info?.state ?? ''}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each split.rows.filter((r) => r.countedUnder) as row (row.problem)}
  <p class="muted">* {row.reports} reports read as a one-day move; counted under <code>{row.countedUnder}</code>, where the desk files them.</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .what { font-size: 0.85em; }
  .muted { color: var(--muted); font-size: 0.85em; }
</style>
