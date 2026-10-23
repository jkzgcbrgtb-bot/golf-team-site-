(async () => {
const { coach } = await chrome('index.html');
const data = await store.loadAll();
const app = document.getElementById('app');

app.innerHTML = `
  <section class="hero">
    <img src="assets/logo.svg" alt="Lake Forest Golf logo">
    <div>
      <h1>Lake Forest Scouts Boys Golf</h1>
      <p>${esc(TEAM.season)} season · Frosh, JV &amp; Varsity · ${esc(TEAM.conference)}</p>
    </div>
    <div class="records">
      ${TEAM.levels.map((l) => `
        <div class="record-chip">
          <strong>${fmtRecord(record(data.matches.filter((m) => m.level === l.id)))}</strong>
          <span>${esc(l.label)} duals</span>
        </div>`).join('')}
    </div>
  </section>
  <div class="page-head" style="margin-top:24px"><div id="level-tabs"></div></div>
  <div class="grid-2">
    <section><h2 style="margin-top:0">Next up</h2><div class="stack" id="upcoming"></div></section>
    <section><h2 style="margin-top:0">Latest results</h2><div class="stack" id="recent"></div></section>
  </div>
  <section><h2>Announcements</h2><div class="stack" id="announcements"></div></section>`;

function render(level) {
  const t = today();
  const mine = data.matches.filter((m) => level === 'all' || m.level === level).sort(byDate);
  const upcoming = mine.filter((m) => m.status !== 'final' && m.date >= t).slice(0, 4);
  const recent = mine.filter((m) => m.status === 'final').reverse().slice(0, 4);
  const notes = data.announcements
    .filter((a) => level === 'all' || !a.level || a.level === level)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  document.getElementById('upcoming').innerHTML = upcoming.length
    ? upcoming.map((m) => matchCard(m, { coach })).join('')
    : empty('Nothing on the schedule yet. Check back soon.');
  document.getElementById('recent').innerHTML = recent.length
    ? recent.map((m) => matchCard(m, { coach })).join('') + '<a href="schedule.html">Full schedule &amp; results →</a>'
    : empty('No results yet.');
  document.getElementById('announcements').innerHTML = notes.length
    ? notes.map((a) => `
        <article class="announcement">
          <div class="muted small">${esc(fmtDate(a.date, { month: 'long', day: 'numeric' }))}${a.level ? ` · ${esc(levelLabel(a.level))}` : ''}</div>
          <h3>${esc(a.title)}</h3>
          <p>${esc(a.body)}</p>
        </article>`).join('')
    : empty('No announcements.');
}

render(levelTabs(document.getElementById('level-tabs'), render));
})();
