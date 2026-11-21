/* =====================================================
   CART.JS  -  the cart page: change amounts, remove items, see the total.
   The cart itself lives in the browser (see site.js).
   ===================================================== */
function readCart() {
  // keep only items whose product still exists in products.json
  const cart = getCart().filter(i => byId(i.id));
  if (cart.length !== getCart().length) saveCart(cart);
  return cart;
}

function render() {
  const cart = readCart();

  if (!cart.length) {
    $('#cart').innerHTML =
      '<div class="notice"><b>Your cart is empty.</b><p class="mu">Pick something from the shop.</p>' +
      '<a class="btn btn-light" href="index.html#shop">Go to the shop</a></div>';
    return;
  }

  const total = cart.reduce((n, i) => n + priceOf(byId(i.id)) * i.qty, 0);
  const items = cart.reduce((n, i) => n + i.qty, 0);

  const lines = cart.map((i, k) => {
    const p = byId(i.id);
    return '<div class="cl">' +
      '<a href="product.html?id=' + p.id + '">' + picHTML(p) + '</a>' +
      '<div><a href="product.html?id=' + p.id + '">' + esc(p.name) + '</a>' +
        '<small>Size ' + esc(i.size) + ' · ' + kr(priceOf(p)) + '</small>' +
        '<button class="rm" data-rm="' + k + '">Remove</button></div>' +
      '<div class="right"><b>' + kr(priceOf(p) * i.qty) + '</b>' +
        '<div class="qty"><button data-k="' + k + '" data-d="-1" aria-label="One less">−</button><span>' + i.qty +
        '</span><button data-k="' + k + '" data-d="1" aria-label="One more">+</button></div></div>' +
    '</div>';
  }).join('');

  $('#cart').innerHTML =
    '<div class="two">' +
      '<div class="lines">' + lines + '</div>' +
      '<aside class="sum"><h3>Order summary</h3>' +
        '<div class="row"><span>Items (' + items + ')</span><span>' + kr(total) + '</span></div>' +
        '<div class="row"><span>Shipping</span><span>Free</span></div>' +
        '<div class="row total"><span>Total</span><span>' + kr(total) + '</span></div>' +
        '<a class="btn btn-primary btn-block" href="checkout.html">Go to checkout</a>' +
        '<a class="btn btn-ghost btn-block" style="margin-top:8px" href="index.html#shop">Keep shopping</a>' +
      '</aside>' +
    '</div>';
}

document.addEventListener('click', e => {
  const q = e.target.closest('[data-k]');
  const r = e.target.closest('[data-rm]');
  if (!q && !r) return;
  const cart = readCart();
  if (q) {
    const k = Number(q.dataset.k);
    cart[k].qty = Math.min(10, cart[k].qty + Number(q.dataset.d));
    if (cart[k].qty <= 0) cart.splice(k, 1);
  } else {
    cart.splice(Number(r.dataset.rm), 1);
  }
  saveCart(cart);
  render();
});

productsReady
  .then(render)
  .catch(err => { $('#cart').innerHTML = errorBox(err.message); });
