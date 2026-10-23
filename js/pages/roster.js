(async () => {
await chrome('roster.html');
const data = await store.loadAll();
const stats = Object.fromEntries(playerStats(data.players, data.matches).map((s) => [s.player.id, s]));
const app = document.getElementById('app');

app.innerHTML = `
  <div class="page-head">
    <div><h1>Roster</h1><p class="muted">${esc(TEAM.season)} Lake Forest boys golf</p></div>
    <div id="level-tabs"></div>
  </div>
  <div id="list"></div>`;

const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function person(p) {
  const s = stats[p.id];
  const avg = s.avg18 != null ? `${fmtAvg(s.avg18)} avg (18)` : s.avg9 != null ? `${fmtAvg(s.avg9)} avg (9)` : '';
  return `
    <article class="person">
      ${p.photo ? `<img class="avatar" src="${esc(p.photo)}" alt="">` : `<div class="avatar" aria-hidden="true">${esc(initials(p.name))}</div>`}
      <h3>${esc(p.name)}</h3>
      <p class="muted small">${p.grade ? `Grade ${esc(p.grade)}` : ''}</p>
      ${avg ? `<p class="small"><strong>${avg}</strong></p>` : ''}
    </article>`;
}

function render(level) {
  const groups = TEAM.levels.filter((l) => level === 'all' || l.id === level);
  document.getElementById('list').innerHTML = groups.map((l) => {
    const ps = data.players.filter((p) => p.level === l.id)
      .sort((a, b) => (b.grade - a.grade) || a.name.localeCompare(b.name));
    return `<h2>${esc(l.label)}</h2>${ps.length ? `<div class="people">${ps.map(person).join('')}</div>` : empty('Roster coming soon.')}`;
  }).join('');
}

render(levelTabs(document.getElementById('level-tabs'), render));
})();
