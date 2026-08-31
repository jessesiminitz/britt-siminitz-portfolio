async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();

  const data = await (await fetch('data/articles.json')).json();
  renderPublications(data.outlets);
  wireFilters(data.outlets);

  // The full JCK archive is a much larger file; load it after the curated
  // content is already on screen so the page paints fast.
  let archive = [];
  try {
    archive = await (await fetch('data/jck_archive.json')).json();
  } catch (err) {
    document.getElementById('archive').style.display = 'none';
  }

  renderBio(data.bio, archive);
  if (archive.length) initArchive(archive);
}

function renderBio(bio, archive) {
  document.getElementById('bio-summary').textContent = bio.summary;

  if (archive && archive.length) {
    const years = archive.map(a => a.date).filter(Boolean).sort();
    const firstYear = years.length ? years[0].slice(0, 4) : null;
    const stats = [
      ['Articles at JCK', archive.length.toLocaleString()],
      ['Writing since', firstYear],
      ['Outlets', String(document.querySelectorAll('.outlet-block').length)]
    ].filter(([, v]) => v);

    document.getElementById('hero-stats').innerHTML = stats.map(([label, value]) =>
      `<div class="stat"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
    ).join('');
  }

  const linkRow = document.getElementById('bio-links');
  linkRow.innerHTML = bio.links.map(l =>
    `<a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
  ).join('');

  const contactRow = document.getElementById('contact-links');
  contactRow.innerHTML = bio.links.map(l =>
    `<a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
  ).join('');
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

/* ---------- Complete JCK archive browser ---------- */

const PAGE_SIZE = 60;

function initArchive(archive) {
  const searchEl = document.getElementById('archive-search');
  const catEl = document.getElementById('archive-category');
  const yearEl = document.getElementById('archive-year');
  const listEl = document.getElementById('archive-list');
  const countEl = document.getElementById('archive-count');
  const moreBtn = document.getElementById('archive-more');

  const years = [...new Set(archive.map(a => a.date && a.date.slice(0, 4)).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a));
  const cats = [...new Set(archive.map(a => a.category).filter(Boolean))].sort();

  const firstYear = years[years.length - 1];
  document.getElementById('archive-intro').textContent =
    `Every piece published under her byline at JCK — ${archive.length.toLocaleString()} articles from ${firstYear} to today. Search or filter to explore.`;

  catEl.innerHTML = '<option value="">All categories</option>' +
    cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  yearEl.innerHTML = '<option value="">All years</option>' +
    years.map(y => `<option value="${y}">${y}</option>`).join('');

  let shown = PAGE_SIZE;
  let filtered = archive;

  function applyFilters() {
    const q = searchEl.value.trim().toLowerCase();
    const cat = catEl.value;
    const yr = yearEl.value;

    filtered = archive.filter(a => {
      if (cat && a.category !== cat) return false;
      if (yr && (!a.date || !a.date.startsWith(yr))) return false;
      if (q && !a.title.toLowerCase().includes(q)) return false;
      return true;
    });

    shown = PAGE_SIZE;
    render();
  }

  function render() {
    const slice = filtered.slice(0, shown);

    countEl.textContent = filtered.length === archive.length
      ? `Showing ${slice.length.toLocaleString()} of ${archive.length.toLocaleString()} articles`
      : `${filtered.length.toLocaleString()} match${filtered.length === 1 ? '' : 'es'} — showing ${slice.length.toLocaleString()}`;

    listEl.innerHTML = slice.map(a => `
      <li class="archive-item">
        <span class="archive-date">${a.date ? formatDate(a.date) : ''}</span>
        <a class="archive-title" href="${a.url}" target="_blank" rel="noopener">${escapeHtml(a.title)}</a>
        ${a.category ? `<span class="archive-cat">${escapeHtml(a.category)}</span>` : ''}
      </li>
    `).join('');

    if (!filtered.length) {
      listEl.innerHTML = '<li class="archive-empty">No articles match those filters.</li>';
    }

    moreBtn.style.display = shown < filtered.length ? '' : 'none';
    const remaining = filtered.length - shown;
    moreBtn.textContent = `Show ${Math.min(PAGE_SIZE, remaining).toLocaleString()} more`;
  }

  let debounce;
  searchEl.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(applyFilters, 150);
  });
  catEl.addEventListener('change', applyFilters);
  yearEl.addEventListener('change', applyFilters);
  moreBtn.addEventListener('click', () => { shown += PAGE_SIZE; render(); });

  render();
}

init();
