async function init() {
  const res = await fetch('data/articles.json');
  const data = await res.json();

  document.getElementById('year').textContent = new Date().getFullYear();

  renderBio(data.bio);
  renderPublications(data.outlets);
  wireFilters(data.outlets);
}

function renderBio(bio) {
  document.getElementById('bio-summary').textContent = bio.summary;
  document.getElementById('about-text').textContent = bio.summary;

  const linkRow = document.getElementById('bio-links');
  linkRow.innerHTML = bio.links.map(l =>
    `<a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
  ).join('');

  const contactRow = document.getElementById('contact-links');
  contactRow.innerHTML = bio.links.map(l =>
    `<a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
  ).join('');

  const credEl = document.getElementById('about-credentials');
  if (bio.credentials && bio.credentials.length) {
    credEl.textContent = 'Also: ' + bio.credentials.join(' · ');
  }
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderPublications(outlets) {
  const container = document.getElementById('outlet-sections');
  container.innerHTML = outlets.map(outlet => {
    const cards = outlet.articles.map(a => `
      <article class="article-card">
        <span class="article-outlet-chip">${escapeHtml(outlet.name)}</span>
        ${a.date ? `<span class="article-date">${formatDate(a.date)}</span>` : ''}
        <h4><a href="${a.url}" target="_blank" rel="noopener">${escapeHtml(a.title)}</a></h4>
        ${a.excerpt ? `<p class="article-excerpt">${escapeHtml(a.excerpt)}</p>` : ''}
        <a class="article-readmore" href="${a.url}" target="_blank" rel="noopener">Read the piece</a>
      </article>
    `).join('');

    return `
      <div class="outlet-block" data-outlet="${outlet.id}">
        <div class="outlet-header">
          <h3><a href="${outlet.url}" target="_blank" rel="noopener">${escapeHtml(outlet.name)}</a></h3>
          <span class="outlet-count">${outlet.articles.length} piece${outlet.articles.length === 1 ? '' : 's'} shown</span>
        </div>
        <p class="outlet-desc">${escapeHtml(outlet.description)}</p>
        ${outlet.note ? `<p class="outlet-note">${escapeHtml(outlet.note)}</p>` : ''}
        <div class="card-grid">${cards}</div>
      </div>
    `;
  }).join('');
}

function wireFilters(outlets) {
  const filterBar = document.getElementById('filters');
  outlets.forEach(outlet => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.filter = outlet.id;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.textContent = outlet.name;
    filterBar.appendChild(btn);
  });

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    filterBar.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    const filter = btn.dataset.filter;
    document.querySelectorAll('.outlet-block').forEach(block => {
      block.style.display = (filter === 'all' || block.dataset.outlet === filter) ? '' : 'none';
    });
  });
}

init();
