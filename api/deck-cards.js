const TT_BASE = 'https://www.takaratomy.co.jp/products/disneylorcana/api1.0/card-search';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ALLOWED_ORIGIN = 'https://lorecajp.github.io';

function setCors(req, res) {
  const origin = req.headers.origin ?? '';
  const allowed = (origin === ALLOWED_ORIGIN || /^http:\/\/localhost(:\d+)?$/.test(origin))
    ? origin : ALLOWED_ORIGIN;
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getTokenAndCookie() {
  const res = await fetch(`${TT_BASE}/token.json`, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(`token fetch failed: ${res.status}`);
  const data = await res.json();
  const csrf = data?.data?.csrf ?? data?.csrf ?? data?.token ?? data?.data?.token;
  if (!csrf) throw new Error('CSRF token not found in response');
  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookieMatch = setCookie.match(/CAKEPHP=([^;]+)/);
  const sessionCookie = cookieMatch ? `CAKEPHP=${cookieMatch[1]}` : '';
  return { csrf, sessionCookie };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(404).json({ error: 'Not found' });

  const deckCode = String(req.body?.deck_code ?? '').trim();
  if (!/^\d{17}$/.test(deckCode)) {
    return res.status(400).json({ error: 'deck_code must be 17 digits' });
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
      return res.status(404).json({ error: 'Deck not found', detail: deckData });
    }

    let cards;
    try {
      cards = typeof deckData.deck.cards === 'string'
        ? JSON.parse(deckData.deck.cards)
        : deckData.deck.cards;
    } catch {
      throw new Error('Failed to parse cards JSON from Takara Tomy response');
    }

    return res.status(200).json({ status: 200, cards });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
