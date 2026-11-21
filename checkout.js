/* =====================================================
   CHECKOUT.JS  -  shows the order and sends the customer to Stripe.

   How it works:
   1. The browser sends ONLY the product ids, sizes and amounts to /api/checkout.
   2. The server function (functions/api/checkout.js) looks up the real prices
      in products.json and asks Stripe for a payment page.
   3. The customer pays on Stripe's page and comes back to /success.

   If the Stripe key has not been added yet, a DEMO ORDER is offered
   instead, so the whole flow can still be tested.
   ===================================================== */
let busy = false;

function render() {
  const cart = getCart().filter(i => byId(i.id));

  if (!cart.length) {
    $('#checkout').innerHTML =
      '<div class="notice"><b>Your cart is empty.</b><p class="mu">Add something before checking out.</p>' +
      '<a class="btn btn-light" href="index.html#shop">Go to the shop</a></div>';
    return;
  }

  const total = cart.reduce((n, i) => n + priceOf(byId(i.id)) * i.qty, 0);

  const lines = cart.map(i => {
    const p = byId(i.id);
    return '<div class="cl"><div>' + picHTML(p) + '</div>' +
      '<div><b>' + esc(p.name) + '</b><small>Size ' + esc(i.size) + ' · Qty ' + i.qty + '</small></div>' +
      '<div class="right"><b>' + kr(priceOf(p) * i.qty) + '</b></div></div>';
  }).join('');

  $('#checkout').innerHTML =
    '<div class="two">' +
      '<div><h3 style="font-size:28px;margin-bottom:10px">Your order</h3><div class="lines">' + lines + '</div>' +
        '<p class="mu" style="margin-top:14px">You will enter your name, address and card details on the secure Stripe page in the next step.</p></div>' +
      '<aside class="sum"><h3>Pay</h3>' +
        '<div class="row"><span>Items</span><span>' + kr(total) + '</span></div>' +
        '<div class="row"><span>Shipping</span><span>Free</span></div>' +
        '<div class="row total"><span>Total</span><span>' + kr(total) + '</span></div>' +
        '<label class="check"><input type="checkbox" id="agree"><span>I accept the <a href="terms.html" target="_blank">terms</a> and the <a href="returns.html" target="_blank">return policy</a>.</span></label>' +
        '<button class="btn btn-primary btn-block" id="pay">Pay with card</button>' +
        '<a class="btn btn-ghost btn-block" style="margin-top:8px" href="cart.html">Back to cart</a>' +
        '<div id="msg"></div>' +
        '<p class="mu" style="font-size:13px;margin-top:12px">Test mode: use card 4242 4242 4242 4242, any future date, any 3 digits.</p>' +
      '</aside>' +
    '</div>';

  $('#pay').addEventListener('click', pay);
}

function showMessage(html) {
  $('#msg').innerHTML = '<div class="err">' + html + '</div>';
}

async function pay() {
  if (busy) return;
  if (!$('#agree').checked) { showMessage('Please tick the box to accept the terms.'); return; }

  const cart = getCart().filter(i => byId(i.id));
  const button = $('#pay');
  busy = true;
  button.disabled = true;
  button.textContent = 'Connecting to Stripe…';
  $('#msg').innerHTML = '';

  try {
    const res = await fetch('api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart.map(i => ({ id: i.id, size: i.size, qty: i.qty })) })
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.url) { location.href = data.url; return; }

    const notConnected = data.error === 'not_configured' || res.status === 404 || res.status === 405 || res.status === 503;
    if (notConnected) {
      showMessage('<b>Card payments are not switched on yet.</b><br>This is normal until the Stripe key is added (see the instructions). ' +
        'You can place a demo order to test the whole flow. No payment is taken.<br><br>' +
        '<a class="btn btn-light" href="success.html?demo=1">Place demo order</a>');
    } else {
      showMessage('<b>Payment could not be started.</b><br>' + esc(data.error || 'Please try again.'));
    }
  } catch (err) {
    showMessage('<b>Could not reach the payment service.</b><br>Check your connection and try again.');
  }

  busy = false;
  button.disabled = false;
  button.textContent = 'Pay with card';
}

productsReady
  .then(render)
  .catch(err => { $('#checkout').innerHTML = errorBox(err.message); });
