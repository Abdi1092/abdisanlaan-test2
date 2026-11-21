/* =====================================================
   SHOP.JS  -  the home page: categories, filters, search, sort.
   The filters are saved in the address (?g=Men&t=Shoes), so a
   filtered shop can be linked to and the Back button works.
   ===================================================== */
const GENDERS = ['All', 'Men', 'Women', 'Kids', 'Sale'];
const TYPES = ['All', 'Shoes', 'Clothing', 'Accessories'];
const SORTS = ['new', 'low', 'high'];

const params = new URLSearchParams(location.search);
const pick = (value, list, fallback) => list.includes(value) ? value : fallback;

const state = {
  g: pick(params.get('g'), GENDERS, 'All'),
  t: pick(params.get('t'), TYPES, 'All'),
  q: params.get('q') || '',
  s: pick(params.get('s'), SORTS, 'new')
};

/* ----- which products match the filters ----- */
function visible() {
  const list = PRODUCTS.filter(p => {
    if (state.g === 'Sale' && !p.sale) return false;
    if (['Men', 'Women', 'Kids'].includes(state.g) && p.gender !== state.g && p.gender !== 'Unisex') return false;
    if (state.t !== 'All' && p.type !== state.t) return false;
    if (state.q && !p.name.toLowerCase().includes(state.q.toLowerCase())) return false;
    return true;
  });
  if (state.s === 'low')  list.sort((a, b) => priceOf(a) - priceOf(b));
  if (state.s === 'high') list.sort((a, b) => priceOf(b) - priceOf(a));
  if (state.s === 'new')  list.sort((a, b) => b.id - a.id);
  return list;
}

/* ----- draw everything ----- */
function renderTiles() {
  const tiles = [
    { g: 'Men',   emoji: '🧥', note: 'Jackets, tees, shoes' },
    { g: 'Women', emoji: '👖', note: 'Puffers, leggings, slides' },
    { g: 'Kids',  emoji: '👟', note: 'Small sizes, big attitude' },
    { g: 'Sale',  emoji: '🔥', note: '30% off selected items', sale: true }
  ];
  $('#tiles').innerHTML = tiles.map(t =>
    '<button class="tile' + (t.sale ? ' sale' : '') + '" data-g="' + t.g + '">' +
    '<span class="big-emoji">' + t.emoji + '</span><b>' + t.g + '</b><small>' + t.note + '</small></button>').join('');
}

function render() {
  $('#tabs').innerHTML = GENDERS.map(g =>
    '<button class="' + (g === 'Sale' ? 'sale ' : '') + (state.g === g ? 'on' : '') + '" data-g="' + g + '">' +
    (g === 'All' ? 'Shop all' : g) + '</button>').join('');
  $('#chips').innerHTML = TYPES.map(t =>
    '<button class="' + (state.t === t ? 'on' : '') + '" data-t="' + t + '">' + t + '</button>').join('');

  const list = visible();
  $('#grid').innerHTML = list.length
    ? list.map(cardHTML).join('')
    : '<div class="empty">No products match. Clear the search or pick another category.</div>';
  const titles = { All: 'All products', Men: "Men's", Women: "Women's", Kids: 'Kids', Sale: 'Sale' };
  $('#shopTitle').textContent = titles[state.g];
  $('#resultCount').textContent = list.length + (list.length === 1 ? ' product' : ' products');
  $('#sort').value = state.s;
  saveToAddress();
}

function saveToAddress() {
  const p = new URLSearchParams();
  if (state.g !== 'All') p.set('g', state.g);
  if (state.t !== 'All') p.set('t', state.t);
  if (state.q) p.set('q', state.q);
  if (state.s !== 'new') p.set('s', state.s);
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
}

/* ----- clicks and typing ----- */
function wire() {
  $('#tabs').addEventListener('click', e => {
    const g = e.target.dataset.g; if (g) { state.g = g; render(); }
  });
  $('#chips').addEventListener('click', e => {
    const t = e.target.dataset.t; if (t) { state.t = t; render(); }
  });
  $('#tiles').addEventListener('click', e => {
    const tile = e.target.closest('.tile'); if (!tile) return;
    state.g = tile.dataset.g; render();
    $('#shop').scrollIntoView({ behavior: 'smooth' });
  });
  $('#q').addEventListener('input', e => { state.q = e.target.value.trim(); render(); });
  $('#sort').addEventListener('change', e => { state.s = e.target.value; render(); });
}

/* ----- start ----- */
productsReady
  .then(() => { $('#q').value = state.q; renderTiles(); wire(); render(); })
  .catch(err => { $('#grid').innerHTML = errorBox(err.message); });
