/* =====================================================
   SITE.JS  -  shared code that every page loads first.
   Helpers, product loading, the cart, header and footer.
   ===================================================== */

/* ---------- small helpers ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const kr = n => Number(n).toLocaleString('sv-SE') + ' kr';
const priceOf = p => p.sale ? Math.round(p.price * 0.7) : p.price;      // sale = 30% off
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const imgSrc = s => encodeURI(s);                                        // lets file names with spaces work

/* ---------- products (loaded from products.json) ---------- */
let PRODUCTS = [];
const productsReady = fetch('products.json')
  .then(r => { if (!r.ok) throw new Error('products.json: ' + r.status); return r.json(); })
  .then(list => { PRODUCTS = list; return list; });

const byId = id => PRODUCTS.find(p => p.id === Number(id));

function sizesFor(p) {
  if (p.type === 'Accessories') return ['One size'];
  if (p.type === 'Shoes') return p.gender === 'Kids' ? ['28', '30', '32', '34'] : ['38', '39', '40', '41', '42', '43', '44'];
  return p.gender === 'Kids' ? ['110', '128', '140'] : ['XS', 'S', 'M', 'L', 'XL'];
}

const DESCRIPTIONS = {
  Shoes: 'Lightweight, cushioned and built for city nights. Breathable upper and a grippy sole.',
  Clothing: 'Heavyweight fabric with a relaxed fit. Made to look better the more you wear it.',
  Accessories: 'A small piece with big attitude. Made to match everything in the VANTA/9 range.'
};
const descOf = p => p.desc || DESCRIPTIONS[p.type] || '';

/* ---------- product picture + product card (used on several pages) ---------- */
function picHTML(p, big) {
  const photo = p.img
    ? '<img src="' + imgSrc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.remove()">'
    : '';
  return '<div class="pic' + (big ? ' big' : '') + '" style="background:linear-gradient(145deg,hsl(' + p.hue + ' 35% 22%),hsl(' + p.hue + ' 45% 8%))">' +
    '<span class="emoji">' + p.icon + '</span>' + photo +
    (p.sale ? '<span class="tag">Sale −30%</span>' : '') + '</div>';
}

function cardHTML(p) {
  return '<a class="card" href="product.html?id=' + p.id + '">' + picHTML(p) +
    '<div class="info"><b>' + esc(p.name) + '</b><small>' + esc(p.gender) + ' · ' + esc(p.type) + '</small>' +
    '<div class="pr">' + kr(priceOf(p)) + (p.sale ? '<span class="was">' + kr(p.price) + '</span>' : '') + '</div></div></a>';
}

function errorBox(msg) {
  return '<div class="notice"><b>Something went wrong.</b><p>' + esc(msg || 'The products could not be loaded.') +
    '</p><p class="mu">If you opened this file straight from your computer, open the live website instead.</p></div>';
}

/* ---------- the cart (saved in this browser) ---------- */
const CART_KEY = 'vanta9-cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  updateCartCount();
}
function cartCount() {
  return getCart().reduce((n, i) => n + i.qty, 0);
}
function addToCart(id, size, qty) {
  const cart = getCart();
  const hit = cart.find(i => i.id === id && i.size === size);
  if (hit) hit.qty = Math.min(10, hit.qty + qty); else cart.push({ id: id, size: size, qty: qty });
  saveCart(cart);
}
function updateCartCount() {
  const el = $('#cartCount');
  if (el) el.textContent = cartCount();
}

/* ---------- little pop-up message ---------- */
function toast(msg, linkHref, linkText) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.innerHTML = esc(msg) + (linkHref ? ' <a href="' + linkHref + '">' + esc(linkText) + '</a>' : '');
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------- header and footer (the same on every page) ---------- */
function renderChrome() {
  const header = $('#site-header');
  if (header) {
    header.innerHTML =
      '<header class="site"><div class="wrap bar">' +
        '<a class="logo" href="index.html">VANTA<span>/9</span></a>' +
        '<nav class="main" aria-label="Main">' +
          '<a href="index.html?g=All#shop">Shop all</a>' +
          '<a href="index.html?g=Men#shop">Men</a>' +
          '<a href="index.html?g=Women#shop">Women</a>' +
          '<a href="index.html?g=Kids#shop">Kids</a>' +
          '<a class="sale" href="index.html?g=Sale#shop">Sale</a>' +
          '<a href="about.html">About</a>' +
        '</nav>' +
        '<a class="cartlink" href="cart.html" aria-label="Open cart">Cart<span id="cartCount">0</span></a>' +
      '</div></header>';
  }
  const footer = $('#site-footer');
  if (footer) {
    footer.innerHTML =
      '<footer class="site"><div class="wrap foot">' +
        '<div><div class="logo small">VANTA<span>/9</span></div>' +
          '<p class="mu">Streetwear for the night shift. A fictional brand made for learning web development.</p></div>' +
        '<div><b>Shop</b><a href="index.html?g=Men#shop">Men</a><a href="index.html?g=Women#shop">Women</a><a href="index.html?g=Kids#shop">Kids</a><a href="index.html?g=Sale#shop">Sale</a></div>' +
        '<div><b>Help</b><a href="returns.html">Shipping &amp; returns</a><a href="contact.html">Contact</a><a href="about.html">About</a></div>' +
        '<div><b>Legal</b><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a></div>' +
      '</div><div class="wrap copy">© VANTA/9. Fictional brand. No real products are sold.</div></footer>';
  }
  updateCartCount();
}

document.addEventListener('DOMContentLoaded', renderChrome);
window.addEventListener('pageshow', updateCartCount);   // keeps the cart number right when you press Back
