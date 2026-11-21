/* =====================================================
   PRODUCT.JS  -  one page for every product.
   The address decides which product: product.html?id=5 shows the
   product with id 5 from products.json.
   ===================================================== */
let product = null;
let chosenSize = null;
let qty = 1;

function init() {
  const id = Number(new URLSearchParams(location.search).get('id'));
  product = byId(id);
  if (!product) return notFound();

  document.title = product.name + ' – VANTA/9';
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = product.name + ' – ' + descOf(product);

  const sizes = sizesFor(product);
  if (sizes.length === 1) chosenSize = sizes[0];           // "One size" is picked for you

  render();
  renderRelated();
}

function notFound() {
  $('#product').innerHTML =
    '<div class="notice" style="margin-top:28px"><h1 style="font-size:48px">Product not found</h1>' +
    '<p class="mu">This product does not exist (any more).</p><a class="btn btn-light" href="index.html#shop">Back to the shop</a></div>';
}

function render() {
  const p = product;
  const imgs = p.imgs && p.imgs.length ? p.imgs : (p.img ? [p.img] : []);
  const bg = 'linear-gradient(145deg,hsl(' + p.hue + ' 35% 22%),hsl(' + p.hue + ' 45% 8%))';

  const gallery =
    '<div class="gal">' +
      '<div class="pic big" style="background:' + bg + '"><span class="emoji">' + p.icon + '</span>' +
        (imgs.length ? '<img id="mainImg" src="' + imgSrc(imgs[0]) + '" alt="' + esc(p.name) + '" onerror="this.remove()">' : '') +
        (p.sale ? '<span class="tag">Sale −30%</span>' : '') +
      '</div>' +
      (imgs.length > 1
        ? '<div class="thumbs" id="thumbs">' + imgs.map((s, i) =>
            '<button class="th' + (i ? '' : ' on') + '" data-src="' + imgSrc(s) + '" aria-label="Photo ' + (i + 1) + '"><img src="' + imgSrc(s) + '" alt=""></button>').join('') + '</div>'
        : '') +
    '</div>';

  const details =
    '<div class="det">' +
      '<small class="mu">' + esc(p.gender) + ' · ' + esc(p.type) + '</small>' +
      '<h1>' + esc(p.name) + '</h1>' +
      '<div class="price">' + kr(priceOf(p)) + (p.sale ? '<span class="was">' + kr(p.price) + '</span>' : '') + '</div>' +
      '<p class="desc">' + esc(descOf(p)) + '</p>' +
      '<div class="label"><span>Size</span></div>' +
      '<div class="sizes" id="sizes">' + sizesFor(p).map(s =>
        '<button data-s="' + esc(s) + '" class="' + (s === chosenSize ? 'on' : '') + '">' + esc(s) + '</button>').join('') + '</div>' +
      '<div class="buy">' +
        '<div class="qty"><button id="minus" aria-label="One less">−</button><span id="qty">1</span><button id="plus" aria-label="One more">+</button></div>' +
        '<button class="btn btn-primary" id="add">Add to cart</button>' +
        '<button class="btn btn-ghost" id="buyNow">Buy now</button>' +
      '</div>' +
      '<div class="acc">' +
        '<details open><summary>Details</summary><p>' + esc(descOf(p)) + ' Item no. ' + p.id + '.</p></details>' +
        '<details><summary>Shipping</summary><p>Ships in 2 to 4 working days. Free shipping on every order.</p></details>' +
        '<details><summary>Returns</summary><p>Free returns within 30 days. See <a href="returns.html">shipping &amp; returns</a>.</p></details>' +
      '</div>' +
    '</div>';

  $('#product').innerHTML =
    '<div class="crumbs"><a href="index.html">Home</a> / <a href="index.html?g=' + (p.gender === 'Unisex' ? 'All' : p.gender) + '#shop">' + esc(p.gender === 'Unisex' ? 'Shop' : p.gender) + '</a> / ' + esc(p.name) + '</div>' +
    '<div class="pg">' + gallery + details + '</div>';

  wire();
}

function wire() {
  const thumbs = $('#thumbs');
  if (thumbs) thumbs.addEventListener('click', e => {
    const b = e.target.closest('.th'); if (!b) return;
    const main = $('#mainImg'); if (main) main.src = b.dataset.src;
    $$('.th').forEach(x => x.classList.toggle('on', x === b));
  });

  $('#sizes').addEventListener('click', e => {
    const s = e.target.dataset.s; if (!s) return;
    chosenSize = s;
    $$('#sizes button').forEach(b => b.classList.toggle('on', b.dataset.s === s));
  });

  $('#minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); $('#qty').textContent = qty; });
  $('#plus').addEventListener('click', () => { qty = Math.min(10, qty + 1); $('#qty').textContent = qty; });

  $('#add').addEventListener('click', () => {
    if (!hasSize()) return;
    addToCart(product.id, chosenSize, qty);
    toast(product.name + ' added to cart.', 'cart.html', 'View cart');
  });
  $('#buyNow').addEventListener('click', () => {
    if (!hasSize()) return;
    addToCart(product.id, chosenSize, qty);
    location.href = 'cart.html';
  });
}

function hasSize() {
  if (chosenSize) return true;
  const box = $('#sizes');
  box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  toast('Pick a size first.');
  return false;
}

function renderRelated() {
  const others = PRODUCTS.filter(x => x.id !== product.id);
  const same = others.filter(x => x.type === product.type);
  const rest = others.filter(x => x.type !== product.type);
  const list = same.concat(rest).slice(0, 4);
  if (!list.length) return;
  $('#related').innerHTML = '<h2>You may also like</h2><div class="grid">' + list.map(cardHTML).join('') + '</div>';
}

productsReady
  .then(init)
  .catch(err => { $('#product').innerHTML = errorBox(err.message); });
