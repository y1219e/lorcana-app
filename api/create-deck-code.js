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

  const { ink_color, cards } = req.body ?? {};
  if (!ink_color || !cards) {
    return res.status(400).json({ error: 'ink_color and cards are required' });
  }

  try {
    const { csrf, sessionCookie } = await getTokenAndCookie();

    const params = new URLSearchParams();
    const inkColorStr = Array.isArray(ink_color) ? ink_color.join(',') : ink_color;
    params.append('ink_color', inkColorStr);
    params.append('cards', typeof cards === 'string' ? cards : JSON.stringify(cards));
    params.append('action', 'create');

    const codeRes = await fetch(`${TT_BASE}/get-deck-code`, {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrf,
        'Cookie': sessionCookie,
        'Referer': 'https://www.takaratomy.co.jp/products/disneylorcana/deckbuilder/',
      },
      body: params.toString(),
    });

    if (!codeRes.ok) throw new Error(`deck code API returned ${codeRes.status}`);
    const codeData = await codeRes.json();

    if (codeData.status === 429) {
      return res.status(429).json({ error: 'デッキコードの発行は1日30回までです。' });
    }
    if (codeData.status !== 200 || !codeData.deck_code) {
      return res.status(502).json({ error: 'デッキコードの取得に失敗しました', detail: codeData });
    }

    return res.status(200).json({ status: 200, deck_code: codeData.deck_code });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
