
async function loadEpisodes() {
  const res = await fetch('data/episodes.json');
  const episodes = await res.json();

  const yearFilter = document.getElementById('yearFilter');
  const search = document.getElementById('search');
  const mount = document.getElementById('episodes');

  function getEpisodeDateValue(episode) {
    const match = (episode.url || '').match(/(\d{4}-\d{2}-\d{2})/);
    if (!match) {
      return 0;
    }
    return new Date(match[1]).getTime() || 0;
  }

  // populate filter
  const years = [...new Set(episodes.map(e => e.year))].sort((a,b)=>b-a);
  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    yearFilter.appendChild(opt);
  });

  function render() {
    const q = (search.value||'').toLowerCase();
    const yf = yearFilter.value;

    // group by year
    const groups = episodes
      .filter(e => (!yf || String(e.year)===yf) && (!q || (e.title||'').toLowerCase().includes(q)))
      .reduce((acc, e) => { (acc[e.year]??=[]).push(e); return acc; }, {});

    // clear
    mount.innerHTML = '';

    Object.keys(groups).sort((a,b)=>b-a).forEach(year => {
      const list = groups[year].slice().sort((a, b) => getEpisodeDateValue(b) - getEpisodeDateValue(a));
      const details = document.createElement('details');
      details.className = 'year';
      details.open = !yf && !q; // open all by default unless filtering

      const summary = document.createElement('summary');
      summary.innerHTML = `<span class="year-title">${year}</span><span class="count">${list.length} émission(s)</span>`;
      details.appendChild(summary);

      const ul = document.createElement('ul');
      ul.className = 'list';
      list.forEach(it => {
        const li = document.createElement('li');
        li.className = 'item';
        const notes = it.notes ? `<div><small>${it.notes}</small></div>` : '';
        li.innerHTML = `<div><a href="${it.url}" target="_blank" rel="noopener">${it.title||'Sans titre'}</a>${notes}</div>`;
        ul.appendChild(li);
      });

      details.appendChild(ul);
      mount.appendChild(details);
    });
  }

  yearFilter.addEventListener('change', render);
  search.addEventListener('input', render);
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  loadEpisodes().catch(() => {
    const mount = document.getElementById('episodes');
    mount.innerHTML = '<p>Impossible de charger les épisodes.</p>';
  });
});
