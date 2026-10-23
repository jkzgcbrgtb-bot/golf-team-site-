(async () => {
await chrome('stats.html');
const data = await store.loadAll();
const all = playerStats(data.players, data.matches).filter((s) => s.rounds > 0);
const app = document.getElementById('app');

app.innerHTML = `
  <div class="page-head">
    <div><h1>Stats</h1><p class="muted">${esc(TEAM.season)} season leaderboard. Click a column to sort.</p></div>
    <div id="level-tabs"></div>
  </div>
  <div id="team"></div>
  <h2>Individual leaderboard</h2>
  <div id="board"></div>`;

const COLS = [
  ['name', 'Player'], ['level', 'Team'], ['rounds', 'Rounds'],
  ['avg9', 'Avg (9)'], ['low9', 'Low (9)'], ['avg18', 'Avg (18)'], ['low18', 'Low (18)'],
];
let sortKey = 'avg9';
let level;

function sortValue(s, key) {
  if (key === 'name') return s.player.name;
  if (key === 'level') return s.player.level;
  return s[key];
}

function teamSummary() {
  const levels = TEAM.levels.filter((l) => level === 'all' || l.id === level);
  return `<div class="people">${levels.map((l) => {
    const ms = data.matches.filter((m) => m.level === l.id && m.status === 'final' && m.format !== 'event');
    const best = (holes) => {
      const t = ms.filter((m) => Number(m.holes) === holes).map(teamScore).filter(Boolean);
      return t.length ? Math.min(...t) : '–';
    };
    return `
      <article class="person">
        <h3>${esc(l.label)}</h3>
        <p><strong style="font-size:1.4rem;color:var(--blue)">${fmtRecord(record(ms))}</strong></p>
        <p class="muted small">Dual record · ${ms.length} events played</p>
        <p class="small">Best team score: ${best(9)} (9) · ${best(18)} (18)</p>
      </article>`;
  }).join('')}</div>`;
}

function render() {
  document.getElementById('team').innerHTML = teamSummary();
  const rows = all.filter((s) => level === 'all' || s.player.level === level);
  const asc = !['rounds'].includes(sortKey);
  rows.sort((a, b) => {
    const x = sortValue(a, sortKey), y = sortValue(b, sortKey);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    const c = typeof x === 'string' ? x.localeCompare(y) : x - y;
    return asc ? c : -c;
  });
  document.getElementById('board').innerHTML = rows.length ? `
    <div class="table-wrap"><table>
      <thead><tr>${COLS.map(([k, label]) =>
        `<th class="${k === 'name' || k === 'level' ? '' : 'num'}"${k === sortKey ? ` aria-sort="${asc ? 'ascending' : 'descending'}"` : ''}><button type="button" data-sort="${k}">${label}</button></th>`).join('')}</tr></thead>
      <tbody>${rows.map((s) => `
        <tr>
          <td>${esc(s.player.name)}</td>
          <td><span class="pill pill-${esc(s.player.level)}">${esc(levelLabel(s.player.level))}</span></td>
          <td class="num">${s.rounds}</td>
          <td class="num">${fmtAvg(s.avg9)}</td>
          <td class="num">${s.low9 ?? '–'}</td>
          <td class="num">${fmtAvg(s.avg18)}</td>
          <td class="num">${s.low18 ?? '–'}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>` : empty('No scores posted yet.');
}

document.getElementById('board').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-sort]');
  if (!b) return;
  sortKey = b.dataset.sort;
  render();
});

level = levelTabs(document.getElementById('level-tabs'), (l) => { level = l; render(); });
render();
})();
