/* =====================================================
   worker.js  -  the small server part of the store.
   It answers requests to /api/checkout (Stripe payments).
   Every other address is passed on to your website files.

   Needs ONE secret in Cloudflare:  STRIPE_SECRET_KEY  (sk_test_...)
   ===================================================== */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status: status, headers: { 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/checkout') {
      if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
      return createCheckout(request, env, url.origin);
    }

    return env.ASSETS.fetch(request);      // your normal website files
  }
};

async function createCheckout(request, env, origin) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'not_configured' }, 503);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'Bad request' }, 400); }

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length || items.length > 30) return json({ error: 'Your cart is empty.' }, 400);

  // Real prices come from products.json on the server, never from the browser
  const res = await env.ASSETS.fetch(new Request(origin + '/products.json'));
  if (!res.ok) return json({ error: 'Could not load products.' }, 500);
  const products = await res.json();

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', origin + '/success?paid=1');
  form.set('cancel_url', origin + '/cart');

  let n = 0;
  for (const item of items) {
    const p = products.find(x => x.id === Number(item.id));
    if (!p) return json({ error: 'Unknown product in cart.' }, 400);

    const qty = Math.min(10, Math.max(1, parseInt(item.qty, 10) || 1));
    const price = p.sale ? Math.round(p.price * 0.7) : p.price;
    const size = String(item.size || '').slice(0, 20);

    form.set('line_items[' + n + '][quantity]', String(qty));
    form.set('line_items[' + n + '][price_data][currency]', 'sek');
    form.set('line_items[' + n + '][price_data][unit_amount]', String(price * 100));
    form.set('line_items[' + n + '][price_data][product_data][name]', p.name + (size ? ' (' + size + ')' : ''));
    n++;
  }

  const stripe = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form
  });
  const data = await stripe.json();

  if (!stripe.ok) {
    const msg = data && data.error && data.error.message ? data.error.message : 'Stripe error';
    return json({ error: msg }, 502);
  }
  return json({ url: data.url });
}
