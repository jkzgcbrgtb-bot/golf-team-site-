(async () => {
await chrome('coaches.html');
const c = TEAM.homeCourse;
const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

document.getElementById('app').innerHTML = `
  <h1>Coaches</h1>
  <div class="stack">
    ${COACHES.map((k) => `
      <article class="person coach-card">
        ${k.photo ? `<img class="avatar" src="${esc(k.photo)}" alt="">` : `<div class="avatar" aria-hidden="true">${esc(initials(k.name))}</div>`}
        <div>
          <h3>${esc(k.name)}</h3>
          <p class="muted small">${esc(k.role)}</p>
          <p>${esc(k.bio)}</p>
          ${k.email ? `<p class="small"><a href="mailto:${esc(k.email)}">${esc(k.email)}</a></p>` : ''}
        </div>
      </article>`).join('')}
  </div>
  <h2>Home course</h2>
  <article class="card">
    <h3>${esc(c.name)}</h3>
    ${c.address ? `<p class="muted">${esc(c.address)}</p>` : ''}
    ${c.description ? `<p>${esc(c.description)}</p>` : ''}
    ${c.mapUrl ? `<p><a href="${esc(c.mapUrl)}" target="_blank" rel="noopener">Directions →</a></p>` : ''}
  </article>`;
})();
