/* Leonida Legend — GTA VI trophy tracker. Plain JS, no network, localStorage only. */
const SAVE_KEY = 'leonida-legend-v2';
const DEMO_CHECKED = [2, 3, 4, 5, 8, 15, 16, 19, 20, 21, 35, 42, 44, 51]; // demo progress for screenshots
const TOTAL = 55;

const query = new URLSearchParams(location.search);
const demo = query.get('demo') === '1';

let list = [];
let checked = new Set();
let hideSpoilers = false;

function readSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.checked)) checked = new Set(saved.checked.filter(n => Number.isInteger(n)));
    if (typeof saved.hideSpoilers === 'boolean') hideSpoilers = saved.hideSpoilers;
  } catch (err) { /* corrupted state: start fresh */ }
}
function persist() {
  if (demo) return; // demo progress must never be persisted
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ checked: [...checked].sort((a, b) => a - b), hideSpoilers }));
  } catch (err) { /* storage unavailable (e.g. file:// in some browsers): progress lives in memory */ }
}
readSaved();
if (demo) DEMO_CHECKED.forEach(id => checked.add(id));

const byId = id => document.getElementById(id);
const ui = {
  cards: byId('trophyCards'), noMatch: byId('noMatch'), count: byId('meterCount'),
  fill: byId('meterFill'), label: byId('meterLabel'), grades: byId('meterGrades'),
  search: byId('searchBox'), grade: byId('gradeSel'), cat: byId('catSel'),
  state: byId('stateSel'), spoiler: byId('spoilerBox'),
  warn: byId('warnBar'), missables: byId('missableCards')
};

function capFirst(s) { return s[0].toUpperCase() + s.slice(1); }
function catName(c) {
  return { story: 'Story', quest: 'Character quest', explore: 'Exploring & collecting',
    activity: 'Activities & challenges', robbery: 'Robberies', combat: 'Combat',
    completion: '100% completion', misc: 'Misc', platinum: 'Platinum' }[c] || c;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildCard(t) {
  const got = checked.has(t.id);
  const hidden = hideSpoilers && t.story && !got;
  const li = document.createElement('li');
  li.className = 'card' + (got ? ' done' : '') + (t.missable ? ' flagged' : '');
  li.id = 'card-' + t.id;
  const head = hidden
    ? '<span class="card-name">Hidden story trophy</span><span class="flag-spoiler">spoiler hidden</span>'
    : '<span class="card-name">' + esc(t.name) + '</span>';
  const body = hidden
    ? '<p class="card-hidden">A story trophy. Turn off "Hide story spoilers" or mark it earned to reveal it.</p>'
    : '<p class="card-desc">' + esc(t.description) + '</p>'
      + '<div class="card-guide"><p>' + esc(t.guide) + '</p></div>'
      + (t.goal ? '<p class="card-meta"><b>Goal:</b> ' + esc(t.goal) + '</p>' : '')
      + '<p class="card-meta"><b>When:</b> ' + esc(t.when || 'Any time')
      + (t.missable_note ? ' &middot; <b>Missable:</b> ' + esc(t.missable_note) : '') + '</p>'
      + '<p class="card-src">Sources: ' + (t.sources || []).map(esc).join(' &middot; ') + '</p>';
  li.innerHTML = '<input type="checkbox"' + (got ? ' checked' : '')
    + ' aria-label="Mark ' + esc(hidden ? 'story trophy' : t.name) + ' as earned">'
    + '<div><div class="card-head">' + head
    + ' <span class="chip ' + esc(t.grade) + '">' + esc(capFirst(t.grade)) + '</span>'
    + ' <span class="tag">' + esc(catName(t.category)) + '</span>'
    + (t.missable ? ' <span class="flag">Missable</span>' : '')
    + '</div>' + body + '</div>';
  li.querySelector('input').addEventListener('change', ev => {
    if (ev.target.checked) checked.add(t.id); else checked.delete(t.id);
    persist(); draw();
  });
  return li;
}

function activeFilters() {
  return {
    q: ui.search.value.trim().toLowerCase(),
    grade: ui.grade.value, cat: ui.cat.value, state: ui.state.value
  };
}
function passes(t, f) {
  if (f.grade && t.grade !== f.grade) return false;
  if (f.cat && t.category !== f.cat) return false;
  if (f.state === 'earned' && !checked.has(t.id)) return false;
  if (f.state === 'unearned' && checked.has(t.id)) return false;
  if (f.state === 'missable' && !t.missable) return false;
  if (f.q) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + (t.goal || '') + ' ' + (t.when || '')).toLowerCase();
    if (!hay.includes(f.q)) return false;
  }
  return true;
}

function draw() {
  const f = activeFilters();
  ui.cards.innerHTML = '';
  let shown = 0;
  for (const t of list) {
    if (!passes(t, f)) continue;
    ui.cards.appendChild(buildCard(t));
    shown++;
  }
  ui.noMatch.hidden = shown !== 0;
  const n = checked.size;
  ui.count.textContent = n;
  ui.fill.style.width = Math.round(n / TOTAL * 100) + '%';
  const pct = Math.round(n / TOTAL * 100);
  ui.label.textContent = pct === 100 ? 'Platinum! Vice got a price - Leonida Legend.'
    : pct === 0 ? '0% - the road to the platinum starts here.'
    : pct + '% - ' + (TOTAL - n) + ' to go. Keep going.';
  const perGrade = {};
  for (const t of list) if (checked.has(t.id)) perGrade[t.grade] = (perGrade[t.grade] || 0) + 1;
  ui.grades.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map(g => (perGrade[g] || 0) + ' ' + g).join(' · ');
  const miss = list.find(t => t.missable);
  ui.warn.innerHTML = miss
    ? '<strong>Watch out - 1 missable:</strong> <a href="#card-' + miss.id + '" data-jump="' + miss.id + '">' + esc(miss.name) + '</a> - ' + esc(miss.missable_note) + ' <a href="#" data-panel="missables">See all missables &rarr;</a>'
    : '';
  ui.warn.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', ev => {
    ev.preventDefault();
    const el = document.getElementById('card-' + a.dataset.jump);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  ui.warn.querySelectorAll('[data-panel]').forEach(a => a.addEventListener('click', ev => {
    ev.preventDefault(); switchPanel(a.dataset.panel);
  }));
  ui.missables.innerHTML = '';
  for (const t of list.filter(t => t.missable)) ui.missables.appendChild(buildCard(t));
}

function switchPanel(name) {
  document.querySelectorAll('.tab').forEach(b => {
    const on = b.dataset.tab === name;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === 'panel-' + name));
  if (name === 'checklist') draw();
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => switchPanel(b.dataset.tab)));
[ui.search, ui.grade, ui.cat, ui.state].forEach(el => el.addEventListener('input', draw));
ui.spoiler.addEventListener('change', () => { hideSpoilers = ui.spoiler.checked; persist(); draw(); });
ui.spoiler.checked = hideSpoilers;

// export / import / reset
byId('exportBtn').addEventListener('click', () => {
  const data = { app: 'leonida-legend', game: 'Grand Theft Auto VI', platform: 'PlayStation 5',
    exported: new Date().toISOString(), checked: [...checked].sort((a, b) => a - b), hideSpoilers };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophies-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
byId('importBtn').addEventListener('click', () => byId('importFile').click());
byId('importFile').addEventListener('change', ev => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const ids = Array.isArray(data.checked) ? data.checked : (Array.isArray(data.earned) ? data.earned : (Array.isArray(data) ? data : null));
      if (!ids) throw new Error('bad file');
      const valid = new Set(list.map(t => t.id));
      checked = new Set(ids.filter(n => Number.isInteger(n) && valid.has(n)));
      if (typeof data.hideSpoilers === 'boolean') { hideSpoilers = data.hideSpoilers; ui.spoiler.checked = hideSpoilers; }
      persist(); draw();
      byId('saveMsg').textContent = 'Imported ' + checked.size + ' earned trophies.';
    } catch (e) {
      byId('saveMsg').textContent = 'Import failed: not a Leonida Legend progress file.';
    }
    ev.target.value = '';
  };
  reader.readAsText(file);
});
byId('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset all progress? This clears every earned trophy in this browser.')) return;
  checked = new Set(); persist(); draw();
  byId('saveMsg').textContent = 'Progress reset.';
});

// load data, then honour URL params (?view=roadmap|missables|sources, ?view=guide&id=28)
fetch('data/trophies.json')
  .then(r => { if (!r.ok) throw new Error('trophies.json failed to load'); return r.json(); })
  .then(d => {
    list = d.trophies || [];
    draw();
    const view = query.get('view');
    const gid = parseInt(query.get('id') || '', 10);
    if (view === 'roadmap' || view === 'missables' || view === 'sources') {
      switchPanel(view);
    } else if (view === 'guide' && list.some(t => t.id === gid)) {
      switchPanel('checklist');
      requestAnimationFrame(() => {
        const el = document.getElementById('card-' + gid);
        if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('spotlit'); }
      });
    }
  })
  .catch(e => {
    ui.cards.innerHTML = '<li class="card"><div><p>Could not load the trophy list. Open this app from its own folder (or run <code>node serve.ts</code>) - the data file is app/data/trophies.json.</p></div></li>';
  });
