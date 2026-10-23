(async () => {
const { coach } = await chrome('schedule.html');
const data = await store.loadAll();
const playerName = Object.fromEntries(data.players.map((p) => [p.id, p.name]));
const app = document.getElementById('app');

app.innerHTML = `
  <div class="page-head">
    <div><h1>Schedule &amp; Results</h1><p class="muted">Tap a finished match to see individual scores.</p></div>
    <div id="level-tabs"></div>
  </div>
  <div class="stack" id="list"></div>`;

function detail(m) {
  const scores = sortedScores(m);
  const ours = teamScore(m);
  const opps = (m.oppScores || []).filter((o) => Number(o.score) > 0);
  const toPar = (s) => {
    if (!Number(m.par)) return '';
    const d = s - Number(m.par);
    return d === 0 ? 'E' : d > 0 ? `+${d}` : `${d}`;
  };
  return `
    <div class="match-detail">
      ${scores.length ? `
        <table>
          <thead><tr><th>Player</th><th class="num">Score</th>${m.par ? '<th class="num">To par</th>' : ''}</tr></thead>
          <tbody>
            ${scores.map((s) => `
              <tr class="${s.counted ? '' : 'not-counted'}">
                <td>${esc(playerName[s.playerId] ?? 'Unknown player')}${s.counted ? '' : ' <span class="small">(not counted)</span>'}</td>
                <td class="num">${s.score}</td>
                ${m.par ? `<td class="num">${toPar(s.score)}</td>` : ''}
              </tr>`).join('')}
            ${ours ? `<tr><td><strong>Team total</strong> <span class="small muted">(top ${esc(m.counting || 4)})</span></td><td class="num"><strong>${ours}</strong></td>${m.par ? '<td></td>' : ''}</tr>` : ''}
          </tbody>
        </table>` : '<p class="muted small">Individual scores not posted.</p>'}
      ${opps.length ? `<p class="small"><strong>Opponents:</strong> ${opps.map((o) => `${esc(o.team)} ${esc(o.score)}`).join(' · ')}</p>` : ''}
      ${m.notes ? `<p class="recap">${esc(m.notes)}</p>` : ''}
    </div>`;
}

function render(level) {
  const ms = data.matches.filter((m) => level === 'all' || m.level === level).sort(byDate);
  document.getElementById('list').innerHTML = ms.length
    ? ms.map((m) => (m.status === 'final' && m.format !== 'event')
        ? `<details class="match"><summary>${matchCard(m, { coach })}</summary>${detail(m)}</details>`
        : matchCard(m, { coach })).join('')
    : empty('No matches scheduled for this team yet.');
}

render(levelTabs(document.getElementById('level-tabs'), render));
})();
