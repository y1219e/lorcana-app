/**
 * Cloudflare Worker — Takara Tomy Lorcana Deck Code Proxy
 *
 * Deploy steps:
 *   1. wrangler init (or paste into Cloudflare dashboard Workers editor)
 *   2. wrangler deploy
 *   3. Copy the worker URL (e.g. https://loreca-deck.your-subdomain.workers.dev)
 *      and set WORKER_URL in app.js
 *
 * Endpoint:
 *   POST /deck-cards   body: { "deck_code": "12345678901234567" }
 *   → { "status": 200, "cards": [ { "card_file": "007_DLCS1_..._JA", "card_num": 4 }, ... ] }
 */

const ALLOWED_ORIGIN = 'https://lorecajp.github.io';
const TT_BASE = 'https://www.takaratomy.co.jp/products/disneylorcana/api1.0/card-search';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function corsHeaders(origin) {
  const allowed = (origin === ALLOWED_ORIGIN || origin === 'http://localhost' || /^http:\/\/localhost(:\d+)?$/.test(origin))
    ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function getTokenAndCookie() {
  const res = await fetch(`${TT_BASE}/token.json`, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(`token fetch failed: ${res.status}`);
  const data = await res.json();
  const csrf = data?.data?.csrf;
  if (!csrf) throw new Error('CSRF token not found in response');
  // Extract Set-Cookie (CAKEPHP session)
  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookieMatch = setCookie.match(/CAKEPHP=([^;]+)/);
  const sessionCookie = cookieMatch ? `CAKEPHP=${cookieMatch[1]}` : '';
  return { csrf, sessionCookie };
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') ?? '';
    const cors = corsHeaders(origin);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/deck-cards') {
      let deckCode;
      try {
        const body = await request.json();
        deckCode = String(body.deck_code ?? '').trim();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      if (!/^\d{17}$/.test(deckCode)) {
        return new Response(JSON.stringify({ error: 'deck_code must be 17 digits' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      try {
        const { csrf, sessionCookie } = await getTokenAndCookie();

        const deckRes = await fetch(`${TT_BASE}/get-deck-cards`, {
          method: 'POST',
          headers: {
            'User-Agent': UA,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-Token': csrf,
            'Cookie': sessionCookie,
            'Referer': 'https://www.takaratomy.co.jp/products/disneylorcana/deckbuilder/',
          },
          body: `deck_code=${encodeURIComponent(deckCode)}`,
        });

        if (!deckRes.ok) throw new Error(`deck API returned ${deckRes.status}`);
        const deckData = await deckRes.json();

        if (deckData.status !== 200) {
          return new Response(JSON.stringify({ error: 'Deck not found', detail: deckData }), {
            status: 404, headers: { 'Content-Type': 'application/json', ...cors },
          });
        }

        // cards is a JSON string inside the response
        let cards;
        try {
          cards = typeof deckData.deck.cards === 'string'
            ? JSON.parse(deckData.deck.cards)
            : deckData.deck.cards;
        } catch {
          throw new Error('Failed to parse cards JSON from Takara Tomy response');
        }

        return new Response(JSON.stringify({ status: 200, cards }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 502, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
    }

    return new Response('Not found', { status: 404, headers: cors });
  },
};
