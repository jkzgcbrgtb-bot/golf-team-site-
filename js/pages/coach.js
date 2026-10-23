(async () => {
const app = document.getElementById('app');
const { coach } = await chrome('coach.html');

let data;
let tab = 'matches';
let matchFilter = 'all';

// ---------- login ----------
function showLogin() {
  app.innerHTML = `
    <div class="card login">
      <img src="assets/logo.svg" alt="">
      <h1>Coach login</h1>
      <p class="muted">Enter the coach passcode to post scores, update the schedule, and edit the roster.</p>
      <form id="login">
        <input type="password" name="passcode" placeholder="Passcode" autocomplete="current-password" required aria-label="Passcode">
        <button class="btn" type="submit">Enter coach mode</button>
        <p class="error" id="login-error" role="alert"></p>
      </form>
      ${store.mode === 'demo' ? `<p class="muted small">Demo passcode: <code>${esc(DEMO_PASSCODE)}</code></p>` : ''}
    </div>`;
  document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    const ok = await store.login(new FormData(e.target).get('passcode'));
    if (ok) location.reload();
    else {
      document.getElementById('login-error').textContent = 'Incorrect passcode.';
      btn.disabled = false;
    }
  });
}

// ---------- dashboard ----------
const TABS = [['matches', 'Schedule & scores'], ['roster', 'Roster'], ['announcements', 'Announcements']];

async function dashboard() {
  data = await store.loadAll();
  app.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Coach dashboard</h1>
        <p class="muted">Changes show up on the public site as soon as you save.</p>
      </div>
      <div class="tabs" role="tablist" id="tabs"></div>
    </div>
    <div id="panel"></div>
    ${store.mode === 'demo' ? '<p class="small muted" style="margin-top:32px">Demo mode: edits are saved in this browser only. <button type="button" class="btn btn-ghost" id="reset">Reset sample data</button></p>' : ''}`;

  document.getElementById('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    history.replaceState(null, '', location.pathname);
    draw();
  });
  document.getElementById('reset')?.addEventListener('click', () => {
    if (!confirm('Reset all demo data back to the samples?')) return;
    store.resetDemo();
    location.reload();
  });
  window.addEventListener('hashchange', route);
  route();
}

function route() {
  const m = location.hash.match(/^#match=(.*)$/);
  if (m) {
    tab = 'matches';
    drawTabs();
    editMatch(decodeURIComponent(m[1]));
  } else draw();
}

async function refresh() {
  data = await store.loadAll();
}

function drawTabs() {
  document.getElementById('tabs').innerHTML = TABS.map(([id, label]) =>
    `<button type="button" role="tab" data-tab="${id}" aria-selected="${id === tab}">${label}</button>`).join('');
}

function draw() {
  drawTabs();
  ({ matches: drawMatches, roster: drawRoster, announcements: drawAnnouncements })[tab]();
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

async function guarded(fn, okMsg) {
  try {
    await fn();
    await refresh();
    toast(okMsg);
    return true;
  } catch (err) {
    console.error(err);
    alert(`Could not save: ${err.message || err}`);
    return false;
  }
}

const levelOptions = (sel, { all = false } = {}) =>
  (all ? [{ id: '', label: 'All teams' }] : []).concat(TEAM.levels)
    .map((l) => `<option value="${l.id}"${l.id === sel ? ' selected' : ''}>${esc(l.label)}</option>`).join('');

const options = (map, sel) =>
  Object.entries(map).map(([k, v]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(v)}</option>`).join('');

// ---------- matches ----------
function drawMatches() {
  const panel = document.getElementById('panel');
  const ms = data.matches.filter((m) => matchFilter === 'all' || m.level === matchFilter).sort(byDate);
  panel.innerHTML = `
    <div class="btn-row" style="margin:0 0 12px;align-items:center">
      <button class="btn btn-gold" type="button" id="add-match">+ Add match or event</button>
      <label style="flex-direction:row;align-items:center;gap:8px">Show
        <select id="match-filter"><option value="all">All teams</option>${levelOptions(matchFilter)}</select>
      </label>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Team</th><th>Event</th><th>Status</th><th>Result</th><th></th></tr></thead>
      <tbody>
        ${ms.map((m) => {
          const r = result(m);
          return `<tr>
            <td>${esc(fmtDate(m.date))}</td>
            <td><span class="pill pill-${esc(m.level)}">${esc(levelLabel(m.level))}</span></td>
            <td>${esc(m.name)}</td>
            <td>${esc(STATUS_LABEL[m.status] ?? m.status)}</td>
            <td>${r ? esc(`${r.label}${r.detail ? ` (${r.detail})` : ''}`) : '–'}</td>
            <td><a class="btn btn-ghost" href="#match=${encodeURIComponent(m.id)}">${m.status === 'final' || m.format === 'event' ? 'Edit' : 'Enter scores'}</a></td>
          </tr>`;
        }).join('') || '<tr><td colspan="6" class="muted">No matches yet. Add the first one.</td></tr>'}
      </tbody>
    </table></div>`;
  panel.querySelector('#match-filter').value = matchFilter;
  panel.querySelector('#match-filter').addEventListener('change', (e) => { matchFilter = e.target.value; drawMatches(); });
  panel.querySelector('#add-match').addEventListener('click', () => { location.hash = 'match=new'; });
}

function parseOpponents(text) {
  return String(text || '').split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const m = line.match(/^(.*?)[\s,:–-]+(\d{2,3})$/);
    return m ? { team: m[1].trim(), score: Number(m[2]) } : { team: line, score: '' };
  });
}

function editMatch(id) {
  const isNew = id === 'new';
  const m = isNew
    ? { level: matchFilter === 'all' ? 'varsity' : matchFilter, format: 'dual', name: '', date: '', time: '', course: '', home: true, holes: 9, par: 36, counting: 4, status: 'upcoming', scores: [], oppScores: [], place: '', fieldSize: '', teamScoreOverride: '', notes: '' }
    : data.matches.find((x) => x.id === id);
  const panel = document.getElementById('panel');
  if (!m) {
    panel.innerHTML = '<p class="empty">That match no longer exists.</p><a href="coach.html">Back to dashboard</a>';
    return;
  }
  const scoreOf = Object.fromEntries((m.scores || []).map((s) => [s.playerId, s.score]));
  const scoreGroup = (l) => {
    const ps = data.players.filter((p) => p.level === l.id).sort((a, b) => a.name.localeCompare(b.name));
    if (!ps.length) return '';
    const inputs = ps.map((p) => `
      <label>${esc(p.name)}
        <input type="number" inputmode="numeric" min="20" max="200" name="score-${esc(p.id)}" value="${esc(scoreOf[p.id] ?? '')}" aria-label="${esc(p.name)} score">
      </label>`).join('');
    const has = ps.some((p) => scoreOf[p.id]);
    return `<details ${l.id === m.level || has ? 'open' : ''}><summary><strong>${esc(l.label)} players</strong></summary><div class="score-grid" style="margin-top:8px">${inputs}</div></details>`;
  };

  panel.innerHTML = `
    <p><a href="coach.html" id="back">← All matches</a></p>
    <form class="card" id="match-form">
      <h2 style="margin-top:0">${isNew ? 'Add match or event' : `Edit: ${esc(m.name)}`}</h2>
      <div class="form-grid">
        <label>Team<select name="level">${levelOptions(m.level)}</select></label>
        <label>Type<select name="format">${options(FORMAT_LABEL, m.format)}</select></label>
        <label class="span-all">Name<input name="name" required value="${esc(m.name)}" placeholder="vs. Libertyville, Scouts Invitational…"></label>
        <label>Date<input type="date" name="date" required value="${esc(m.date)}"></label>
        <label>Time<input name="time" value="${esc(m.time)}" placeholder="3:30 PM"></label>
        <label>Home / away<select name="home"><option value="home"${m.home ? ' selected' : ''}>Home</option><option value="away"${m.home ? '' : ' selected'}>Away</option></select></label>
        <label>Course / location<input name="course" value="${esc(m.course)}"></label>
        <label>Holes<select name="holes"><option${Number(m.holes) === 9 ? ' selected' : ''}>9</option><option${Number(m.holes) === 18 ? ' selected' : ''}>18</option></select></label>
        <label>Par<input type="number" name="par" value="${esc(m.par)}"></label>
        <label>Scores counted<input type="number" name="counting" min="1" max="6" value="${esc(m.counting || 4)}"></label>
        <label>Status<select name="status">${options(STATUS_LABEL, m.status)}</select></label>
      </div>

      <fieldset>
        <legend>Player scores</legend>
        <p class="muted small" style="margin-top:0">Leave blank for players who didn't play. The lowest ${esc(m.counting || 4)} count toward the team score automatically.</p>
        <div class="stack">${TEAM.levels.map(scoreGroup).join('')}</div>
        <p class="small" id="team-total"></p>
      </fieldset>

      <fieldset>
        <legend>Results</legend>
        <div class="form-grid">
          <label class="span-all">Opponent scores <span class="small" style="font-weight:400">One per line, e.g. "Libertyville, 162". Used for dual W/L.</span>
            <textarea name="opp">${esc((m.oppScores || []).map((o) => `${o.team}${o.score ? `, ${o.score}` : ''}`).join('\n'))}</textarea>
          </label>
          <label>Place (invites/postseason)<input type="number" name="place" min="1" value="${esc(m.place)}"></label>
          <label>Teams in field<input type="number" name="fieldSize" min="1" value="${esc(m.fieldSize)}"></label>
          <label>Team score override<input type="number" name="teamScoreOverride" value="${esc(m.teamScoreOverride)}" placeholder="auto"></label>
          <label class="span-all">Recap / notes (shown publicly)<textarea name="notes">${esc(m.notes)}</textarea></label>
        </div>
      </fieldset>

      <div class="btn-row">
        <button class="btn" type="submit">Save</button>
        <button class="btn btn-gold" type="submit" data-final>Save as final</button>
        <a class="btn btn-ghost" href="coach.html">Cancel</a>
        ${isNew ? '' : '<button class="btn btn-danger" type="button" id="delete" style="margin-left:auto">Delete</button>'}
      </div>
    </form>`;

  const form = panel.querySelector('#match-form');
  const read = (finalize) => {
    const f = new FormData(form);
    const num = (k) => (f.get(k) === '' ? '' : Number(f.get(k)));
    return {
      ...(isNew ? {} : { id: m.id }),
      level: f.get('level'),
      format: f.get('format'),
      name: f.get('name').trim(),
      date: f.get('date'),
      time: f.get('time').trim(),
      course: f.get('course').trim(),
      home: f.get('home') === 'home',
      holes: Number(f.get('holes')),
      par: num('par'),
      counting: Number(f.get('counting')) || 4,
      status: finalize ? 'final' : f.get('status'),
      scores: data.players
        .map((p) => ({ playerId: p.id, score: Number(f.get(`score-${p.id}`)) }))
        .filter((s) => s.score > 0),
      oppScores: parseOpponents(f.get('opp')),
      place: num('place'),
      fieldSize: num('fieldSize'),
      teamScoreOverride: num('teamScoreOverride'),
      notes: f.get('notes').trim(),
    };
  };
  const showTotal = () => {
    const t = teamScore(read(false));
    panel.querySelector('#team-total').innerHTML = t ? `<strong>Team score: ${t}</strong>` : '';
  };
  form.addEventListener('input', showTotal);
  showTotal();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rec = read(e.submitter?.hasAttribute('data-final'));
    if (await guarded(() => store.save('matches', rec), 'Match saved')) location.hash = '';
  });
  panel.querySelector('#delete')?.addEventListener('click', async () => {
    if (!confirm(`Delete "${m.name}"? This can't be undone.`)) return;
    if (await guarded(() => store.remove('matches', m.id), 'Match deleted')) location.hash = '';
  });
}

// ---------- roster ----------
function drawRoster() {
  const panel = document.getElementById('panel');
  const ps = [...data.players].sort((a, b) =>
    TEAM.levels.findIndex((l) => l.id === a.level) - TEAM.levels.findIndex((l) => l.id === b.level) || a.name.localeCompare(b.name));
  const row = (p) => `
    <tr data-id="${esc(p.id ?? '')}">
      <td><input name="name" value="${esc(p.name ?? '')}" placeholder="Player name" aria-label="Name"></td>
      <td><input name="grade" type="number" min="9" max="12" value="${esc(p.grade ?? '')}" style="width:70px" aria-label="Grade"></td>
      <td><select name="level" aria-label="Team">${levelOptions(p.level ?? 'varsity')}</select></td>
      <td><input name="photo" value="${esc(p.photo ?? '')}" placeholder="assets/players/name.jpg" aria-label="Photo"></td>
      <td>
        <button class="btn btn-ghost" type="button" data-save>${p.id ? 'Save' : 'Add'}</button>
        ${p.id ? '<button class="btn btn-danger" type="button" data-remove>Remove</button>' : ''}
      </td>
    </tr>`;
  panel.innerHTML = `
    <p class="muted">Edit a row and press Save. Removing a player also hides their past scores from stats.</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Grade</th><th>Team</th><th>Photo (optional)</th><th></th></tr></thead>
      <tbody>${ps.map(row).join('')}${row({})}</tbody>
    </table></div>`;

  panel.querySelector('tbody').addEventListener('click', async (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const id = tr.dataset.id;
    const val = (n) => tr.querySelector(`[name="${n}"]`).value.trim();
    if (e.target.matches('[data-save]')) {
      if (!val('name')) return alert('Enter a name first.');
      const rec = { ...(id ? { id } : {}), name: val('name'), grade: Number(val('grade')) || '', level: val('level'), photo: val('photo') };
      if (await guarded(() => store.save('players', rec), id ? 'Player saved' : 'Player added')) drawRoster();
    }
    if (e.target.matches('[data-remove]')) {
      if (!confirm(`Remove ${val('name')} from the roster?`)) return;
      if (await guarded(() => store.remove('players', id), 'Player removed')) drawRoster();
    }
  });
}

// ---------- announcements ----------
function drawAnnouncements() {
  const panel = document.getElementById('panel');
  const list = [...data.announcements].sort((a, b) => b.date.localeCompare(a.date));
  panel.innerHTML = `
    <form class="card" id="ann-form">
      <h2 style="margin-top:0">Post an announcement</h2>
      <div class="form-grid">
        <label class="span-all">Title<input name="title" required placeholder="Practice canceled: weather"></label>
        <label>For<select name="level">${levelOptions('', { all: true })}</select></label>
        <label class="span-all">Message<textarea name="body" required></textarea></label>
      </div>
      <div class="btn-row"><button class="btn" type="submit">Post</button></div>
    </form>
    <h2>Posted</h2>
    <div class="stack">
      ${list.map((a) => `
        <article class="announcement" data-id="${esc(a.id)}">
          <div class="muted small">${esc(fmtDate(a.date, { month: 'long', day: 'numeric' }))} · ${esc(a.level ? levelLabel(a.level) : 'All teams')}</div>
          <h3>${esc(a.title)}</h3>
          <p>${esc(a.body)}</p>
          <div class="btn-row" style="margin-top:8px"><button class="btn btn-danger" type="button" data-remove>Delete</button></div>
        </article>`).join('') || '<p class="empty">Nothing posted yet.</p>'}
    </div>`;

  panel.querySelector('#ann-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const rec = { date: today(), title: f.get('title').trim(), body: f.get('body').trim(), level: f.get('level') };
    if (await guarded(() => store.save('announcements', rec), 'Announcement posted')) drawAnnouncements();
  });
  panel.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
    const id = b.closest('[data-id]').dataset.id;
    if (!confirm('Delete this announcement?')) return;
    if (await guarded(() => store.remove('announcements', id), 'Announcement deleted')) drawAnnouncements();
  }));
}

if (coach) await dashboard(); else showLogin();
})();
