/* Leonida Legend — GTA VI trophy tracker. Plain JS, no network, localStorage only. */
const STORE_KEY = 'leonida-legend-progress-v1';
const DEMO_EARNED = [2, 3, 4, 8, 16, 20, 21, 35, 42, 44, 47, 51, 53]; // demo progress for screenshots
const SOURCE_URLS = {
  'PowerPyx — GTA 6 Trophy Guide & Roadmap': 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/',
  'Exophase — Grand Theft Auto VI trophies': 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  'PSNProfiles — Grand Theft Auto VI trophies': 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi'
};

const params = new URLSearchParams(location.search);
const demoMode = params.get('demo') === '1';

let trophies = [];
let earned = new Set();
let spoilerOn = false;

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (Array.isArray(s.earned)) earned = new Set(s.earned.filter(n => Number.isInteger(n)));
    if (typeof s.spoilerOn === 'boolean') spoilerOn = s.spoilerOn;
  } catch (e) { /* corrupted state: start fresh */ }
}
function saveState() {
  if (demoMode) return; // demo progress must never be persisted
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...earned].sort((a, b) => a - b), spoilerOn }));
  } catch (e) { /* storage unavailable (e.g. file:// in some browsers): progress lives in memory */ }
}
loadState();
if (demoMode) DEMO_EARNED.forEach(id => earned.add(id));

const $ = id => document.getElementById(id);
const els = {
  list: $('trophyList'), empty: $('emptyMsg'), count: $('earnedCount'),
  fill: $('progressFill'), label: $('progressLabel'), grades: $('gradeCounts'),
  search: $('search'), grade: $('gradeFilter'), kind: $('kindFilter'),
  status: $('statusFilter'), spoiler: $('spoilerToggle'),
  strip: $('missableStrip'), missableList: $('missableList')
};

function gradeLabel(g) { return g[0].toUpperCase() + g.slice(1); }
function kindLabel(k) {
  return { story: 'Story', questline: 'Character questline', exploration: 'Exploration & collectibles',
    activity: 'Activities & challenges', robbery: 'Robberies', combat: 'Combat',
    misc: 'Misc', platinum: 'Platinum' }[k] || k;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function sourceLinks(t) {
  return (t.sources || []).map(name => {
    const url = SOURCE_URLS[name];
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>` : esc(name);
  }).join(' · ');
}

function trophyCard(t, opts) {
  const isEarned = earned.has(t.id);
  const hidden = spoilerOn && t.story && !isEarned;
  const li = document.createElement('li');
  li.className = 'trophy' + (isEarned ? ' earned' : '') + (t.missable ? ' missable-flag' : '');
  li.id = 'trophy-' + t.id;
  const head = hidden
    ? `<span class="trophy-name">Hidden story trophy</span><span class="flag-spoiler">spoiler hidden</span>`
    : `<span class="trophy-name">${esc(t.name)}</span>`;
  const desc = hidden
    ? `<p class="trophy-spoiler">A story trophy. Turn off “Hide story spoilers” or mark it earned to reveal it.</p>`
    : `<p class="trophy-desc">${esc(t.description)}</p>
       <div class="trophy-guide"><p>${esc(t.guide)}</p></div>
       ${t.target ? `<p class="trophy-meta"><b>Target:</b> ${esc(t.target)}</p>` : ''}
       <p class="trophy-meta"><b>When:</b> ${esc(t.when || 'Any time')}${t.missable_note ? ` · <b>Missable:</b> ${esc(t.missable_note)}` : ''}</p>
       <p class="trophy-sources">Sources: ${sourceLinks(t)}</p>`;
  li.innerHTML = `
    <input type="checkbox" ${isEarned ? 'checked' : ''} aria-label="Mark ${esc(hidden ? 'story trophy' : t.name)} as earned">
    <div>
      <div class="trophy-head">${head}
        <span class="grade ${esc(t.grade)}">${esc(gradeLabel(t.grade))}</span>
        <span class="kind">${esc(kindLabel(t.kind))}</span>
        ${t.missable ? '<span class="flag-missable">Missable</span>' : ''}
      </div>
      ${desc}
    </div>`;
  li.querySelector('input').addEventListener('change', ev => {
    if (ev.target.checked) earned.add(t.id); else earned.delete(t.id);
    saveState(); render();
  });
  return li;
}

function currentFilters() {
  return {
    q: els.search.value.trim().toLowerCase(),
    grade: els.grade.value, kind: els.kind.value, status: els.status.value
  };
}
function matches(t, f) {
  if (f.grade && t.grade !== f.grade) return false;
  if (f.kind && t.kind !== f.kind) return false;
  if (f.status === 'earned' && !earned.has(t.id)) return false;
  if (f.status === 'unearned' && earned.has(t.id)) return false;
  if (f.status === 'missable' && !t.missable) return false;
  if (f.q) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + (t.target || '') + ' ' + (t.when || '')).toLowerCase();
    if (!hay.includes(f.q)) return false;
  }
  return true;
}

function render() {
  const f = currentFilters();
  els.list.innerHTML = '';
  let shown = 0;
  for (const t of trophies) {
    if (!matches(t, f)) continue;
    els.list.appendChild(trophyCard(t));
    shown++;
  }
  els.empty.hidden = shown !== 0;
  const n = earned.size;
  els.count.textContent = n;
  els.fill.style.width = Math.round(n / 55 * 100) + '%';
  const pct = Math.round(n / 55 * 100);
  els.label.textContent = pct === 100 ? 'Platinum! Vice got a price — Leonida Legend.'
    : pct === 0 ? '0% — the road to the platinum starts here.'
    : pct + '% — ' + (55 - n) + ' to go. Keep going.';
  const byGrade = {};
  for (const t of trophies) if (earned.has(t.id)) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  els.grades.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map(g => `${byGrade[g] || 0} ${g}`).join(' · ');
  const miss = trophies.find(t => t.missable);
  els.strip.innerHTML = miss ? `<strong>Watch out — 1 missable:</strong> <a href="#trophy-${miss.id}" data-goto="${miss.id}">${esc(miss.name)}</a> — ${esc(miss.missable_note)} <a href="#" data-view-link="missables">See all missables →</a>` : '';
  els.strip.querySelectorAll('[data-goto]').forEach(a => a.addEventListener('click', ev => {
    ev.preventDefault();
    const el = document.getElementById('trophy-' + a.dataset.goto);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  els.strip.querySelectorAll('[data-view-link]').forEach(a => a.addEventListener('click', ev => {
    ev.preventDefault(); showView(a.dataset.viewLink);
  }));
  // missables view
  els.missableList.innerHTML = '';
  for (const t of trophies.filter(t => t.missable)) els.missableList.appendChild(trophyCard(t));
}

function showView(name) {
  document.querySelectorAll('.view-btn').forEach(b => {
    const on = b.dataset.view === name;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  if (name === 'checklist') render();
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.view-btn').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
[els.search, els.grade, els.kind, els.status].forEach(el => el.addEventListener('input', render));
els.spoiler.addEventListener('change', () => { spoilerOn = els.spoiler.checked; saveState(); render(); });
els.spoiler.checked = spoilerOn;

// export / import / reset
$('exportBtn').addEventListener('click', () => {
  const data = { app: 'leonida-legend', game: 'Grand Theft Auto VI', platform: 'PlayStation 5',
    exported: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b), spoilerOn };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophies-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', ev => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const ids = Array.isArray(data.earned) ? data.earned : (Array.isArray(data) ? data : null);
      if (!ids) throw new Error('bad file');
      const valid = new Set(trophies.map(t => t.id));
      earned = new Set(ids.filter(n => Number.isInteger(n) && valid.has(n)));
      if (typeof data.spoilerOn === 'boolean') { spoilerOn = data.spoilerOn; els.spoiler.checked = spoilerOn; }
      saveState(); render();
      $('saveNote').textContent = `Imported ${earned.size} earned trophies.`;
    } catch (e) {
      $('saveNote').textContent = 'Import failed: not a Leonida Legend progress file.';
    }
    ev.target.value = '';
  };
  reader.readAsText(file);
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset all progress? This clears every earned trophy in this browser.')) return;
  earned = new Set(); saveState(); render();
  $('saveNote').textContent = 'Progress reset.';
});

// load data, then honour URL params (?view=roadmap|missables|sources, ?view=guide&id=28)
fetch('data/trophies.json')
  .then(r => { if (!r.ok) throw new Error('trophies.json failed to load'); return r.json(); })
  .then(d => {
    trophies = d.trophies || [];
    render();
    const view = params.get('view');
    const gid = parseInt(params.get('id') || '', 10);
    if (view === 'roadmap' || view === 'missables' || view === 'sources') {
      showView(view);
    } else if (view === 'guide' && trophies.some(t => t.id === gid)) {
      showView('checklist');
      requestAnimationFrame(() => {
        const el = document.getElementById('trophy-' + gid);
        if (el) { el.scrollIntoView({ block: 'center' }); el.style.outline = '2px solid var(--pink)'; }
      });
    }
  })
  .catch(e => {
    els.list.innerHTML = '<li class="trophy"><div><p>Could not load the trophy list. Open this app from its own folder (or run <code>node serve.ts</code>) — the data file is app/data/trophies.json.</p></div></li>';
  });

