// Shared helpers and page chrome (header, nav, footer, coach/demo banners).

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const levelLabel = (id) => TEAM.levels.find((l) => l.id === id)?.label ?? 'All teams';

function fmtDate(iso, opts = { weekday: 'short', month: 'short', day: 'numeric' }) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts);
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ordinal(n) {
  n = Number(n);
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const byDate = (a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));

// ---- golf scoring ----
function validScores(m) {
  return (m.scores || []).filter((s) => Number(s.score) > 0).map((s) => ({ ...s, score: Number(s.score) }));
}

// Scores low to high, flagging the ones that count toward the team total.
function sortedScores(m) {
  const k = Number(m.counting) || 4;
  return validScores(m).sort((a, b) => a.score - b.score).map((s, i) => ({ ...s, counted: i < k }));
}

function teamScore(m) {
  if (Number(m.teamScoreOverride) > 0) return Number(m.teamScoreOverride);
  const k = Number(m.counting) || 4;
  const s = sortedScores(m);
  return s.length >= k ? s.slice(0, k).reduce((a, b) => a + b.score, 0) : null;
}

// Head-to-head W/L/T against each opponent in a dual/triangular.
function headToHead(m) {
  const ours = teamScore(m);
  const out = { w: 0, l: 0, t: 0 };
  if (m.status !== 'final' || m.format !== 'dual' || !ours) return out;
  for (const o of m.oppScores || []) {
    const theirs = Number(o.score);
    if (!(theirs > 0)) continue;
    if (ours < theirs) out.w++; else if (ours > theirs) out.l++; else out.t++;
  }
  return out;
}

function result(m) {
  if (m.status !== 'final' || m.format === 'event') return null;
  const ours = teamScore(m);
  if (m.format === 'dual') {
    const { w, l, t } = headToHead(m);
    const opps = (m.oppScores || []).filter((o) => Number(o.score) > 0);
    if (opps.length === 1) {
      const label = w ? 'W' : l ? 'L' : 'T';
      return { label, kind: w ? 'win' : l ? 'loss' : 'tie', ours, detail: `${ours}–${opps[0].score}` };
    }
    if (opps.length > 1) return { label: `${w}–${l}${t ? `–${t}` : ''}`, kind: w > l ? 'win' : w < l ? 'loss' : 'tie', ours, detail: ours ? `${ours}` : '' };
    return { label: 'Final', kind: 'tie', ours, detail: ours ? `${ours}` : '' };
  }
  const place = Number(m.place);
  if (place) {
    return {
      label: `${ordinal(place)}${m.fieldSize ? ` of ${m.fieldSize}` : ''}`,
      kind: place === 1 ? 'win' : 'tie',
      ours,
      detail: ours ? `${ours}` : '',
    };
  }
  return { label: 'Final', kind: 'tie', ours, detail: ours ? `${ours}` : '' };
}

function record(matches) {
  return matches.reduce((acc, m) => {
    const r = headToHead(m);
    acc.w += r.w; acc.l += r.l; acc.t += r.t;
    return acc;
  }, { w: 0, l: 0, t: 0 });
}

const fmtRecord = (r) => `${r.w}–${r.l}${r.t ? `–${r.t}` : ''}`;

// Per-player scoring from final matches, split by 9- and 18-hole rounds.
function playerStats(players, matches) {
  const finals = matches.filter((m) => m.status === 'final');
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const low = (a) => (a.length ? Math.min(...a) : null);
  return players.map((p) => {
    const r9 = [], r18 = [];
    for (const m of finals) {
      for (const s of validScores(m)) {
        if (s.playerId === p.id) (Number(m.holes) === 18 ? r18 : r9).push(s.score);
      }
    }
    return { player: p, rounds: r9.length + r18.length, avg9: avg(r9), avg18: avg(r18), low9: low(r9), low18: low(r18) };
  });
}

const fmtAvg = (n) => (n == null ? '–' : n.toFixed(1));

const STATUS_LABEL = { upcoming: 'Upcoming', final: 'Final', postponed: 'Postponed', cancelled: 'Cancelled' };
const FORMAT_LABEL = { dual: 'Dual', invite: 'Invitational', postseason: 'Postseason', event: 'Team event' };

// ---- components ----
function matchCard(m, { coach = false } = {}) {
  const r = result(m);
  const where = [m.home ? 'Home' : m.format === 'event' ? '' : 'Away', m.course].filter(Boolean).join(' · ');
  const status = m.status !== 'final' && m.status !== 'upcoming'
    ? `<span class="pill pill-warn">${esc(STATUS_LABEL[m.status])}</span>` : '';
  return `
    <article class="match-card">
      <div class="match-date">
        <span class="mon">${esc(fmtDate(m.date, { month: 'short' }))}</span>
        <span class="day">${esc(fmtDate(m.date, { day: 'numeric' }))}</span>
      </div>
      <div class="match-body">
        <div class="match-top">
          <span class="pill pill-${esc(m.level)}">${esc(levelLabel(m.level))}</span>
          <span class="muted small">${esc(FORMAT_LABEL[m.format] ?? '')}${m.holes && m.format !== 'event' ? ` · ${m.holes} holes` : ''}</span>
          ${status}
        </div>
        <h3>${esc(m.name)}</h3>
        <p class="muted small">${esc(fmtDate(m.date, { weekday: 'long' }))}${m.time ? ` · ${esc(m.time)}` : ''}${where ? ` · ${esc(where)}` : ''}</p>
        ${coach ? `<a class="coach-link" href="coach.html#match=${encodeURIComponent(m.id)}">${m.status === 'final' ? 'Edit scores' : 'Enter scores'} →</a>` : ''}
      </div>
      ${r ? `<div class="match-result result-${r.kind}"><strong>${esc(r.label)}</strong>${r.detail ? `<span>${esc(r.detail)}</span>` : ''}</div>` : ''}
    </article>`;
}

// Level filter tabs. Remembers the choice per browser.
const LEVEL_KEY = 'lfgolf-level';
function getLevel() {
  try { return localStorage.getItem(LEVEL_KEY) || 'all'; } catch { return 'all'; }
}
function levelTabs(el, onChange) {
  let current = getLevel();
  const opts = [{ id: 'all', label: 'All' }, ...TEAM.levels];
  const draw = () => {
    el.innerHTML = opts.map((o) =>
      `<button type="button" role="tab" aria-selected="${o.id === current}" data-level="${o.id}">${esc(o.label)}</button>`).join('');
  };
  el.classList.add('tabs');
  el.setAttribute('role', 'tablist');
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-level]');
    if (!b) return;
    current = b.dataset.level;
    try { localStorage.setItem(LEVEL_KEY, current); } catch {}
    draw();
    onChange(current);
  });
  draw();
  return current;
}

// ---- chrome ----
const NAV = [
  ['index.html', 'Home'],
  ['schedule.html', 'Schedule & Results'],
  ['roster.html', 'Roster'],
  ['stats.html', 'Stats'],
  ['coaches.html', 'Coaches'],
];

async function chrome(active) {
  const coach = await store.isCoach();
  document.body.classList.toggle('coach-mode', coach);

  const header = document.getElementById('site-header');
  header.innerHTML = `
    ${store.mode === 'demo' ? `<div class="banner banner-demo">Demo mode: showing sample data. See README to connect real data.</div>` : ''}
    ${coach ? `<div class="banner banner-coach"><span>⛳ Coach mode</span><a href="coach.html">Dashboard</a><button type="button" id="logout">Sign out</button></div>` : ''}
    <div class="header-inner">
      <a class="brand" href="index.html">
        <img src="assets/logo.svg" alt="" width="44" height="44">
        <span><strong>Lake Forest Scouts</strong><small>Boys Golf</small></span>
      </a>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav">
        ${NAV.map(([href, label]) => `<a href="${href}"${href === active ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
      </nav>
    </div>`;

  header.querySelector('.nav-toggle').addEventListener('click', (e) => {
    const open = header.classList.toggle('nav-open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });
  header.querySelector('#logout')?.addEventListener('click', async () => {
    await store.logout();
    location.href = 'index.html';
  });

  document.getElementById('site-footer').innerHTML = `
    <div class="footer-inner">
      <div>
        <strong>${esc(TEAM.school)}</strong><br>
        <span class="muted">Boys Golf · ${esc(TEAM.conference)}</span>
      </div>
      <div class="footer-links">
        ${TEAM.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
        ${coach ? '' : '<a href="coach.html">Coach login</a>'}
      </div>
    </div>`;

  return { coach };
}

function empty(msg) {
  return `<p class="empty">${esc(msg)}</p>`;
}
