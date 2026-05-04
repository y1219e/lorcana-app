// ───────────────────────────────────────────
// ハンバーガーメニュー
// ───────────────────────────────────────────
function openMenu()  { document.getElementById('menuDrawer').classList.add('open'); document.getElementById('menuOverlay').classList.add('open'); }
function closeMenu() { document.getElementById('menuDrawer').classList.remove('open'); document.getElementById('menuOverlay').classList.remove('open'); }
function openSubpage(id)  { closeMenu(); document.getElementById(id).classList.add('open'); }
function closeSubpage(id) { document.getElementById(id).classList.remove('open'); }
document.getElementById('menuBtn').addEventListener('click', openMenu);
document.getElementById('menuCloseBtn').addEventListener('click', closeMenu);
document.getElementById('menuOverlay').addEventListener('click', closeMenu);
document.getElementById('menuSettings').addEventListener('click', () => openSubpage('settingsPage'));
document.getElementById('menuDisclaimer').addEventListener('click', () => openSubpage('disclaimerPage'));
document.getElementById('settingsBack').addEventListener('click', () => closeSubpage('settingsPage'));
document.getElementById('disclaimerBack').addEventListener('click', () => closeSubpage('disclaimerPage'));

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('settingsPage').classList.contains('open'))  { closeSubpage('settingsPage'); return; }
  if (document.getElementById('disclaimerPage').classList.contains('open')){ closeSubpage('disclaimerPage'); return; }
  if (document.getElementById('menuDrawer').classList.contains('open'))    { closeMenu(); return; }
  if (document.getElementById('dialogModal').classList.contains('open'))   { const c=document.getElementById('dialogCancel'); (c.style.display!=='none'?c:document.getElementById('dialogOk')).click(); return; }
  if (document.getElementById('advSearchModal').classList.contains('open')){ document.getElementById('advSearchModal').classList.remove('open'); return; }
  if (document.getElementById('newDeckModal').classList.contains('open'))  { closeNewDeckModal(); return; }
  if (document.getElementById('importModal').classList.contains('open'))   { document.getElementById('importModal').classList.remove('open'); return; }
  if (document.getElementById('cardModal').classList.contains('open'))     { document.getElementById('cardModal').classList.remove('open'); currentCard=null; return; }
});

// ───────────────────────────────────────────
// 共通ダイアログ
// ───────────────────────────────────────────
function showAlert(msg) {
  return new Promise(resolve => {
    document.getElementById('dialogMsg').textContent = msg;
    document.getElementById('dialogCancel').style.display = 'none';
    const modal = document.getElementById('dialogModal');
    const ok = document.getElementById('dialogOk');
    modal.classList.add('open');
    const handler = () => { modal.classList.remove('open'); ok.removeEventListener('click', handler); resolve(); };
    ok.addEventListener('click', handler);
  });
}
function showConfirm(msg) {
  return new Promise(resolve => {
    document.getElementById('dialogMsg').textContent = msg;
    const cancel = document.getElementById('dialogCancel');
    cancel.style.display = '';
    const modal = document.getElementById('dialogModal');
    const ok = document.getElementById('dialogOk');
    modal.classList.add('open');
    function cleanup(val) { modal.classList.remove('open'); ok.removeEventListener('click', handleOk); cancel.removeEventListener('click', handleCancel); resolve(val); }
    function handleOk() { cleanup(true); }
    function handleCancel() { cleanup(false); }
    ok.addEventListener('click', handleOk);
    cancel.addEventListener('click', handleCancel);
  });
}

// ═══════════════════════════════════════════
// Service Worker 登録（PWA オフライン対応）
// ═══════════════════════════════════════════
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .catch(e => console.warn('[SW] registration failed:', e));
}

// ═══════════════════════════════════════════
// 画像プリフェッチ＆キャッシュ（Cache API）
// ═══════════════════════════════════════════
const IMG_CACHE_NAME = 'loreca-img-v6';
const PREFETCH_CONCURRENCY = 8;

async function prefetchAllImages(cards, onProgress) {
  if (!('caches' in window)) return; // 非対応ブラウザはスキップ
  const cache = await caches.open(IMG_CACHE_NAME);

  // 全カードのURLリスト
  const items = cards
    .filter(c => c.card_file)
    .map(c => IMG_HOST + c.card_file + '.png');

  // キャッシュ済みをスキップ
  const todo = [];
  let done = 0;
  for (const url of items) {
    const hit = await cache.match(url);
    if (hit) done++;
    else todo.push(url);
  }
  onProgress(done, items.length);
  if (todo.length === 0) return;

  // 並列ワーカー
  let idx = 0;
  async function worker() {
    while (idx < todo.length) {
      const url = todo[idx++];
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) await cache.put(url, res);
      } catch(e) { console.warn('[prefetch] image cache failed:', url, e); }
      done++;
      onProgress(done, items.length);
    }
  }
  await Promise.all(Array.from({ length: PREFETCH_CONCURRENCY }, worker));
}

// ═══════════════════════════════════════════
// 定数・マスターデータ
// ═══════════════════════════════════════════

const IMG_HOST = 'https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/';

const DECK_PROXY_URL = 'https://loreca.vercel.app/api';





const SET_NAMES_JA = {
  '1':'物語のはじまり','2':'フラッドボーンの渾沌','3':'インクランド探訪',
  '4':'逆襲のアースラ','5':'星々の輝き','6':'大いなるアズライト',
  '7':'アーケイジアと魔法の島','8':'ジャファーの王権','9':'物語のおもいで',
};

const INK_IMG = {
  'アンバー':   "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_single/ico_single_amber.svg",
  'アメジスト': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_single/ico_single_amethyst.svg",
  'エメラルド': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_single/ico_single_emerald.svg",
  'ルビー':     "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_single/ico_single_ruby.svg",
  'サファイア': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_single/ico_single_sapphire.svg",
  'スティール': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_single/ico_single_steel.svg",
};
const DUAL_INK_IMG = {
  'アメジスト_アンバー':   "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_amber_amethyst.svg",
  'アンバー_エメラルド':   "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_amber_emerald.svg",
  'アンバー_ルビー':       "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_amber_ruby.svg",
  'アンバー_スティール':   "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_amber_steel.svg",
  'アメジスト_エメラルド': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_amethyst_emerald.svg",
  'アメジスト_ルビー':     "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_amethyst_ruby.svg",
  'アメジスト_サファイア': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_amethyst_sapphire.svg",
  'エメラルド_ルビー':     "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_emerald_ruby.svg",
  'エメラルド_サファイア': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_emerald_sapphire.svg",
  'エメラルド_スティール': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_emerald_steel.svg",
  'スティール_ルビー':     "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_ruby_steel.svg",
  'サファイア_スティール': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_sapphire_steel.svg",
  'アンバー_サファイア':   "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_amber_sapphire.svg",
  'アメジスト_スティール': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_amethyst_steel.svg",
  'サファイア_ルビー':     "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_inktype/ico_dual/ico_dual_ruby_sapphire.svg",};




function makeInkDot(ink) {
  const span = document.createElement('span');
  span.className = 'ink-dot';
  const src = INK_IMG[ink] ?? '';
  if(src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = ink ?? '';
    span.appendChild(img);
  }
  return span;
}

function makeDualInkDot(inks) {
  // inks配列をソートしてキーを作成
  const sorted = [...inks].sort();
  const key = sorted.join('_');
  const src = DUAL_INK_IMG[key] ?? '';
  const span = document.createElement('span');
  span.className = 'ink-dot';
  if(src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = key;
    span.appendChild(img);
  }
  return span;
}
const RARITY_IMG = {
  'コモン':           "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_rarity/ico_rarity_common.svg",
  'アンコモン':       "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_rarity/ico_rarity_uncommon.svg",
  'レア':             "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_rarity/ico_rarity_rare.svg",
  'スーパーレア':     "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_rarity/ico_rarity_super-rare.svg",
  'レジェンダリー':   "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_rarity/ico_rarity_legendary.svg",
  'エンチャンテッド': "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_rarity/ico_rarity_enchanted.svg",
  'エピック':         "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_rarity/ico_rarity_epic.svg",
  'アイコニック':     "https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/ico_rarity/ico_rarity_iconic.svg",};

let DECK_SLEEVES = [];  // loreca_config.json から起動時に読み込む


function makeRarityIcon(rarity) {
  const span = document.createElement('span');
  span.className = 'rarity-icon';
  const src = RARITY_IMG[rarity] ?? '';
  if(src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = rarity ?? '';
    span.appendChild(img);
  }
  return span;
}


// ═══════════════════════════════════════════
// カードデータキャッシュ（IndexedDB, 2ヶ月TTL）
// ═══════════════════════════════════════════
const CARD_CACHE_TTL = 60 * 24 * 60 * 60 * 1000; // 2ヶ月 (ms)
const CARD_CACHE_KEY = 'card_cache_v6';

async function loadCardCache() {
  return new Promise(r => {
    const tx = db.transaction('meta', 'readonly');
    tx.objectStore('meta').get(CARD_CACHE_KEY).onsuccess = e => r(e.target.result ?? null);
  });
}
async function saveCardCache(sets, cards, etag) {
  return new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ id: CARD_CACHE_KEY, sets, cards, etag: etag ?? null, savedAt: Date.now() });
    tx.oncomplete = () => res();
    tx.onerror   = () => rej(tx.error);
  });
}

// ═══════════════════════════════════════════
// 画像URL生成ユーティリティ
// ═══════════════════════════════════════════


async function resolveImgSrc(url) {
  if ('caches' in window) {
    const cache = await caches.open(IMG_CACHE_NAME);
    const hit = await cache.match(url);
    if (hit) {
      const blob = await hit.blob();
      return URL.createObjectURL(blob);
    }
  }
  return url;
}

function makeImg(card, deckStyle){
  const img = document.createElement('img');
  img.alt = card.name;
  img.loading = 'lazy';
  if(deckStyle) img.style.cssText = deckStyle + 'object-fit:cover;display:block;';
  img.onerror = () => { const ph=document.createElement('div'); ph.className='img-placeholder'; ph.textContent=card.name; img.replaceWith(ph); };
  if(card.card_file) {
    const url = IMG_HOST + card.card_file + '.png';
    resolveImgSrc(url).then(src => {
      img.src = src;
      if(src.startsWith('blob:')) {
        img.onload  = () => URL.revokeObjectURL(src);
        img.onerror = () => URL.revokeObjectURL(src);
      }
    });
  }
  return img;
}

// ═══════════════════════════════════════════
// IndexedDB（collection / decks / meta）
// ═══════════════════════════════════════════
let db;
function openDB(){
  return new Promise((res,rej)=>{
    const req = indexedDB.open('loreca', 1);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if(!d.objectStoreNames.contains('collection')) d.createObjectStore('collection',{keyPath:'id'});
      if(!d.objectStoreNames.contains('decks'))      d.createObjectStore('decks',{keyPath:'id'});
      if(!d.objectStoreNames.contains('meta'))       d.createObjectStore('meta',{keyPath:'id'});
      if(!d.objectStoreNames.contains('wishlist'))   d.createObjectStore('wishlist',{keyPath:'id'});

    };
    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror   = () => rej(req.error);
  });
}
function dbPut(store, val) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.objectStore(store).put(val);
    tx.oncomplete = () => resolve();
  });
}
function dbDelete(store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
  });
}
function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(store).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
function dbReplaceAll(store, records){
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    os.clear();
    for (const r of records) os.put(r);
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}

// ═══════════════════════════════════════════
// アプリ状態
// ═══════════════════════════════════════════
let allCards = [];
let sets = [];
let setsData = [];
let collection = {};
let wishlist = new Set();
let cardView = 'all';
let advFilter = {
  rarities: new Set(), types: new Set(), classifications: new Set(),
  keywords: new Set(), inks: new Set(), sets: new Set(),
  costMin: null, costMax: null, strMin: null, strMax: null,
  wpMin: null, wpMax: null, loreMin: null, loreMax: null,
  mcMin: null, mcMax: null, inkwell: null, inkType: null,
  collectionStatus: null, textQ: '', sortOrder: 'id_asc',
};
let decks = [];
let searchQ = '';
let currentCard = null;
let currentDeck = null;

function normalizeQ(s) { return s.normalize('NFKC').toLowerCase(); }
function cardMatchesQuery(c, q) {
  return (c.name    && normalizeQ(c.name).includes(q))    ||
         (c.version && normalizeQ(c.version).includes(q)) ||
         (c.text    && normalizeQ(c.text).includes(q));
}

function filteredCards(){
  return allCards.filter(c=>{
    if(cardView==='collection' && ownedTotal(c.id)===0) return false;
    if(cardView==='wishlist' && !wishlist.has(c.id)) return false;
    if(advFilter.collectionStatus==='owned' && ownedTotal(c.id)===0) return false;
    if(advFilter.collectionStatus==='notowned' && ownedTotal(c.id)>0) return false;
    if(searchQ && !cardMatchesQuery(c, normalizeQ(searchQ))) return false;
    if(advFilter.rarities.size>0 && !advFilter.rarities.has(c.rarity)) return false;
    // タイプフィルター
    // action_song = card_type が アクション かつ classifications に「歌」を含む
    if(advFilter.types.size>0){
      const isAction = (c.type??[]).includes('アクション');
      const isSong   = isAction && (c.classifications??[]).includes('歌');
      let matched = false;
      for(const t of advFilter.types){
        if(t==='action_song'  && isSong)                              { matched=true; break; }
        if(t==='アクション'   && isAction && !isSong)                 { matched=true; break; }
        if(t!=='action_song'  && t!=='アクション' && (c.type??[]).includes(t)){ matched=true; break; }
      }
      if(!matched) return false;
    }
    if(advFilter.classifications.size>0 && !(c.classifications??[]).some(t=>advFilter.classifications.has(t))) return false;
    if(advFilter.keywords.size>0 && !(c.keywords??[]).some(k=>advFilter.keywords.has(k))) return false;
    if(advFilter.inkType==='single' && (c.inks??[c.ink]).filter(Boolean).length!==1) return false;
    if(advFilter.inkType==='dual' && (c.inks??[c.ink]).filter(Boolean).length<2) return false;
    if(advFilter.inks.size>0){ const ci=c.inks??(c.ink?[c.ink]:[]); if(!ci.some(i=>advFilter.inks.has(i))) return false; }
    if(advFilter.sets.size>0 && !advFilter.sets.has(c.set?.code)) return false;
    if(advFilter.costMin!==null && (c.cost??0)<advFilter.costMin) return false;
    if(advFilter.costMax!==null && (c.cost??0)>advFilter.costMax) return false;
    if(advFilter.strMin!==null && (c.strength==null || c.strength<advFilter.strMin)) return false;
    if(advFilter.strMax!==null && (c.strength==null || c.strength>advFilter.strMax)) return false;
    if(advFilter.wpMin!==null && (c.willpower==null || c.willpower<advFilter.wpMin)) return false;
    if(advFilter.wpMax!==null && (c.willpower==null || c.willpower>advFilter.wpMax)) return false;
    if(advFilter.loreMin!==null && (c.lore==null || c.lore<advFilter.loreMin)) return false;
    if(advFilter.loreMax!==null && (c.lore==null || c.lore>advFilter.loreMax)) return false;
    if(advFilter.mcMin!==null || advFilter.mcMax!==null){
      if(c.move_cost==null) return false;
      if(advFilter.mcMin!==null && c.move_cost<advFilter.mcMin) return false;
      if(advFilter.mcMax!==null && c.move_cost>advFilter.mcMax) return false;
    }
    if(advFilter.inkwell===true && !c.inkwell) return false;
    if(advFilter.inkwell===false && c.inkwell) return false;
    if(advFilter.textQ && !cardMatchesQuery(c, normalizeQ(advFilter.textQ))) return false;
    return true;
  });
}

// collection[id] は {normal, foil} 形式。旧形式(数値)はnormalとして扱う
function getOwned(id){ const c=collection[id]; if(!c) return {normal:0,foil:0}; if(typeof c==='number') return {normal:c,foil:0}; return {normal:c.normal??0,foil:c.foil??0}; }
function ownedTotal(id){ const o=getOwned(id); return o.normal+o.foil; }

// ═══════════════════════════════════════════
// カードグリッド仮想スクロール（IntersectionObserver）
// ═══════════════════════════════════════════
const PAGE_SIZE = 60;
let _gridCards = [];    // ソート済みフィルタ結果（全件）
let _gridRendered = 0;  // DOMに追加済みのカード数
let _gridObserver = null;

function _makeCardItem(card) {
  const total = ownedTotal(card.id);
  const item = document.createElement('div');
  item.className = 'card-item';
  item.appendChild(makeImg(card));
  const info = document.createElement('div'); info.className = 'card-info';
  const nameDiv = document.createElement('div'); nameDiv.className = 'card-name';
  const cardInksDot = card.inks && card.inks.length > 1
    ? makeDualInkDot(card.inks) : makeInkDot(card.ink ?? (card.inks?.[0] ?? ''));
  nameDiv.appendChild(cardInksDot); nameDiv.appendChild(document.createTextNode(card.name));
  const subDiv = document.createElement('div'); subDiv.className = 'card-sub';
  subDiv.appendChild(document.createTextNode(`${card.set?.code ?? ''}-${card.collector_number}`));
  subDiv.appendChild(document.createTextNode('  '));
  subDiv.appendChild(makeRarityIcon(card.rarity));
  subDiv.appendChild(document.createTextNode(' ' + card.rarity));
  info.appendChild(nameDiv); info.appendChild(subDiv);
  item.appendChild(info);
  if (total > 0) {
    const o = getOwned(card.id);
    const b = document.createElement('div'); b.className = 'own-badge';
    b.textContent = o.normal + o.foil;
    if (o.foil > 0) b.classList.add('foil');
    item.appendChild(b);
  }
  item._cardId = card.id;
  item.addEventListener('click', () => openCardModal(card));
  return item;
}

function _renderNextBatch(grid) {
  const end = Math.min(_gridRendered + PAGE_SIZE, _gridCards.length);
  if (_gridRendered >= end) return;
  const frag = document.createDocumentFragment();
  for (let i = _gridRendered; i < end; i++) frag.appendChild(_makeCardItem(_gridCards[i]));
  _gridRendered = end;
  const sentinel = document.getElementById('gridSentinel');
  if (sentinel) grid.insertBefore(frag, sentinel); else grid.appendChild(frag);
}

function _setupSentinel(grid) {
  if (_gridObserver) { _gridObserver.disconnect(); _gridObserver = null; }
  const old = document.getElementById('gridSentinel');
  if (old) old.remove();
  if (_gridRendered >= _gridCards.length) return;
  const sentinel = document.createElement('div');
  sentinel.id = 'gridSentinel';
  grid.appendChild(sentinel);
  _gridObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    _renderNextBatch(grid);
    if (_gridRendered >= _gridCards.length) {
      _gridObserver.disconnect(); _gridObserver = null; sentinel.remove();
    }
  }, { rootMargin: '200px' });
  _gridObserver.observe(sentinel);
}

function renderCardGrid() {
  const grid = document.getElementById('cardGrid');
  const badge = document.getElementById('cardCountBadge');
  const INK_ORDER = ['アンバー','アメジスト','エメラルド','ルビー','サファイア','スティール'];
  _gridCards = [...filteredCards()].sort((a, b) => {
    if (advFilter.sortOrder === 'id_asc' || advFilter.sortOrder === 'id_desc') {
      const sc = (a.set?.code ?? '').localeCompare(b.set?.code ?? '', undefined, {numeric: true});
      const nc = String(a.collector_number ?? '').localeCompare(String(b.collector_number ?? ''), undefined, {numeric: true});
      const r = sc !== 0 ? sc : nc;
      return advFilter.sortOrder === 'id_desc' ? -r : r;
    }
    if (advFilter.sortOrder === 'cost_asc' || advFilter.sortOrder === 'cost_desc') {
      const ca = a.cost ?? 0, cb = b.cost ?? 0;
      if (ca !== cb) return advFilter.sortOrder === 'cost_asc' ? ca - cb : cb - ca;
      const sc = (a.set?.code ?? '').localeCompare(b.set?.code ?? '', undefined, {numeric: true});
      if (sc !== 0) return sc;
      const ia = INK_ORDER.indexOf(a.ink ?? a.inks?.[0] ?? ''), ib = INK_ORDER.indexOf(b.ink ?? b.inks?.[0] ?? '');
      if (ia !== ib) return ia - ib;
      return String(a.collector_number ?? '').localeCompare(String(b.collector_number ?? ''), undefined, {numeric: true});
    }
    return 0;
  });
  badge.textContent = _gridCards.length;
  if (_gridObserver) { _gridObserver.disconnect(); _gridObserver = null; }
  grid.innerHTML = '';
  _gridRendered = 0;
  _renderNextBatch(grid);
  _setupSentinel(grid);
}


function openCardModal(card){
  currentCard=card;
  const o=getOwned(card.id);
  const mi=document.getElementById('modalImg');
  mi.alt = card.name || '';
  mi.style.visibility='hidden';
  mi.onload=()=>{ mi.style.visibility=''; };
  mi.onerror=()=>{ mi.style.visibility=''; };
  if(card.card_file) {
    resolveImgSrc(IMG_HOST + card.card_file + '.png').then(src => { mi.src = src; });
  } else {
    mi.src = '';
  }
  document.getElementById('countValN').textContent=o.normal;
  document.getElementById('countValF').textContent=o.foil;
  document.getElementById('countDecN').disabled=o.normal<=0;
  document.getElementById('countDecF').disabled=o.foil<=0;
  const wb=document.getElementById('modalWishBtn');
  wb.textContent=wishlist.has(card.id)?'❤️':'🤍';
  document.getElementById('cardModal').classList.add('open');
}

function navigateModal(delta){
  const cards = filteredCards();
  const idx = cards.findIndex(c=>c.id===currentCard.id);
  if(idx === -1) return;
  openCardModal(cards[(idx + delta + cards.length) % cards.length]);
}

document.getElementById('modalPrev').addEventListener('click', e=>{ e.stopPropagation(); navigateModal(-1); });
document.getElementById('modalNext').addEventListener('click', e=>{ e.stopPropagation(); navigateModal(1); });
(function(){
  let sx=0;
  const m=document.getElementById('cardModal');
  m.addEventListener('touchstart', e=>{ sx=e.touches[0].clientX; }, {passive:true});
  m.addEventListener('touchend', e=>{ const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50) navigateModal(dx<0?1:-1); }, {passive:true});
})();




function closeCardModal(){ document.getElementById('cardModal').classList.remove('open'); currentCard=null; }
document.getElementById('modalClose').addEventListener('click',closeCardModal);
document.getElementById('cardModal').addEventListener('click',e=>{ if(e.target===document.getElementById('cardModal')) closeCardModal(); });

async function setOwned(cardId, normal, foil){
  if(normal<=0 && foil<=0){ await dbDelete('collection',cardId); delete collection[cardId]; }
  else { const val={id:cardId,normal,foil}; await dbPut('collection',val); collection[cardId]=val; }
}

async function updateCount(type, delta){
  if(!currentCard) return;
  const o=getOwned(currentCard.id);
  const normal = type==='normal' ? Math.max(0, o.normal+delta) : o.normal;
  const foil   = type==='foil'   ? Math.max(0, o.foil+delta)   : o.foil;
  await setOwned(currentCard.id, normal, foil);
  document.getElementById('countValN').textContent=normal;
  document.getElementById('countValF').textContent=foil;
  document.getElementById('countDecN').disabled=normal<=0;
  document.getElementById('countDecF').disabled=foil<=0;
  // グリッド全体を再描画せず、対象カードのバッジのみ更新
  const total = normal + foil;
  const grid = document.getElementById('cardGrid');
  const items = grid.querySelectorAll('.card-item');
  items.forEach(item => {
    const clickHandler = item._cardId;
    if(item._cardId === currentCard.id) {
      let badge = item.querySelector('.own-badge');
      if(total > 0) {
        if(!badge){ badge = document.createElement('div'); badge.className='own-badge'; item.appendChild(badge); }
        badge.textContent = total; if(foil>0) badge.classList.add('foil'); else badge.classList.remove('foil');
      } else {
        if(badge) badge.remove();
      }
    }
  });
  renderProgress();
}
document.getElementById('countDecN').addEventListener('click',()=>updateCount('normal',-1));
document.getElementById('countIncN').addEventListener('click',()=>updateCount('normal',+1));
document.getElementById('countDecF').addEventListener('click',()=>updateCount('foil',-1));
document.getElementById('countIncF').addEventListener('click',()=>updateCount('foil',+1));


// ═══════════════════════════════════════════
// タカラトミー デッキビルダー URL インポート
// ═══════════════════════════════════════════

// dsコードデコード: 'AECUBI' → {setNum, collectorNum, count}
function decodeDsCode(ds) {
  function b36(c) {
    if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 65;
    return 26 + parseInt(c);
  }
  if (!ds || ds.length !== 6) return null;
  const setNum = b36(ds[1]);
  const colNum = b36(ds[2]) * 36 + b36(ds[3]);
  const cntEnc = b36(ds[4]) * 36 + b36(ds[5]);
  const cntMap = {10:1, 20:2, 32:3, 44:4, 54:4};
  const count = cntMap[cntEnc] ?? 1;
  return { setNum, colNum, count };
}

// URLからデッキをインポート
async function importDeckFromUrl(url) {
  // URLまたはdsパラメータ文字列（コピー時に%2C区切りになる場合も対応）
  let dsCodes;
  const trimmed = url.trim();
  // dsパラメータを含むURLの場合
  const dsMatch = trimmed.match(/[?&]ds=([^&]+)/);
  if (dsMatch) {
    dsCodes = decodeURIComponent(dsMatch[1]).split(',').map(s => s.trim()).filter(Boolean);
  } else if (/^[A-Z0-9,%]+$/i.test(trimmed)) {
    // dsコードのみ（カンマ区切りまたは%2C区切り）
    dsCodes = decodeURIComponent(trimmed).split(',').map(s => s.trim()).filter(Boolean);
  } else {
    throw new Error('URLまたはdsコードの形式が正しくありません。');
  }
  if (dsCodes.length === 0) throw new Error('カード情報が空です');
  if (allCards.length === 0) throw new Error('カードデータがまだ読み込まれていません。しばらく待ってから再度お試しください。');
  const cards = {};
  const notFound = [];
  for (const ds of dsCodes) {
    const decoded = decodeDsCode(ds);
    if (!decoded) { notFound.push(ds); continue; }
    const { setNum, colNum, count } = decoded;
    // set.codeとcollector_numberで検索（card.idのフォーマットに依存しない）
    const card = allCards.find(c => Number(c.set?.code) === Number(setNum) && Number(c.collector_number) === Number(colNum));
    if (!card) { notFound.push(setNum + '弾#' + colNum); continue; }
    const cardId = card.id;
    cards[cardId] = (cards[cardId] ?? 0) + count;
  }
  if (Object.keys(cards).length === 0) {
    throw new Error('カードが1枚も見つかりませんでした。見つからなかったコード: ' + notFound.join(', '));
  }
  const csMatch = trimmed.match(/[?&]cs=([^&]+)/);
  const deckName = csMatch ? decodeURIComponent(csMatch[1]).replace(/%2C|,/g, '/') + ' デッキ' : 'インポートデッキ';
  const newDeck = { id: crypto.randomUUID(), name: deckName, cards };
  await dbPut('decks', newDeck);
  decks.push(newDeck);
  renderDeckList();
  const total = Object.values(cards).reduce((a,b)=>a+b,0);
  const warn = notFound.length > 0 ? ' (スキップ: ' + notFound.join(', ') + ')' : '';
  return Object.keys(cards).length + '種 ' + total + '枚のカードを読み込みました' + warn;
}

// デッキコードをエクスポート（タカラトミーAPIでコード発行）
async function exportDeckCode() {
  if (!currentDeck) throw new Error('デッキが開かれていません');
  const total = deckTotal();
  if (total < 60) throw new Error(`デッキは60枚必要です（現在${total}枚）`);

  const inkColors = deckInks();
  const cardsArr = Object.entries(currentDeck.cards ?? {})
    .filter(([, n]) => n > 0)
    .map(([id, n]) => {
      const c = allCards.find(x => x.id === id);
      return c ? { card_file: c.card_file, card_num: n } : null;
    })
    .filter(Boolean);

  const res = await fetch(`${DECK_PROXY_URL}/create-deck-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ink_color: inkColors, cards: cardsArr }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `エラー (${res.status})`);
  return data.deck_code;
}

// デッキコードからデッキをインポート
async function importDeckFromCode(code) {
  if (!/^\d{17}$/.test(code)) throw new Error('デッキコードは17桁の数字です');
  if (allCards.length === 0) throw new Error('カードデータがまだ読み込まれていません。しばらく待ってから再度お試しください。');
  if (!DECK_PROXY_URL || DECK_PROXY_URL.includes('YOUR_SUBDOMAIN')) {
    throw new Error('デッキコード機能はまだセットアップ中です。URLインポートをご利用ください。');
  }

  const res = await fetch(`${DECK_PROXY_URL}/deck-cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deck_code: code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `サーバーエラー (${res.status})`);
  }
  const data = await res.json();
  if (data.status !== 200 || !Array.isArray(data.cards)) {
    throw new Error('デッキが見つかりませんでした');
  }

  const cards = {};
  const notFound = [];
  for (const entry of data.cards) {
    const cardFile = entry.card_file ?? '';
    const count = Number(entry.card_num ?? 1);
    const card = allCards.find(c => c.card_file === cardFile);
    if (!card) { notFound.push(cardFile); continue; }
    cards[card.id] = (cards[card.id] ?? 0) + count;
  }

  if (Object.keys(cards).length === 0) {
    throw new Error('カードが1枚も見つかりませんでした。見つからなかったコード: ' + notFound.join(', '));
  }

  const newDeck = { id: crypto.randomUUID(), name: `デッキコード ${code}`, cards };
  await dbPut('decks', newDeck);
  decks.push(newDeck);
  renderDeckList();
  const total = Object.values(cards).reduce((a,b)=>a+b,0);
  const warn = notFound.length > 0 ? ` (スキップ: ${notFound.join(', ')})` : '';
  return `${Object.keys(cards).length}種 ${total}枚のカードを読み込みました${warn}`;
}

// 新規デッキ作成方法選択モーダル
function openNewDeckModal() {
  document.getElementById('newDeckModal').classList.add('open');
}
function closeNewDeckModal() {
  document.getElementById('newDeckModal').classList.remove('open');
}
document.getElementById('newDeckCancelBtn').addEventListener('click', closeNewDeckModal);
document.getElementById('newDeckModal').addEventListener('click', e => {
  if (e.target === document.getElementById('newDeckModal')) closeNewDeckModal();
});
document.getElementById('newDeckByCardBtn').addEventListener('click', () => {
  closeNewDeckModal();
  openDeckEditor(null);
});
document.getElementById('newDeckByCodeBtn').addEventListener('click', () => {
  closeNewDeckModal();
  document.getElementById('importCodeInput').value = '';
  document.getElementById('importError').style.display = 'none';
  document.getElementById('importModal').classList.add('open');
});

// デッキコードインポートモーダル
document.getElementById('importClose').addEventListener('click', () => {
  document.getElementById('importModal').classList.remove('open');
});
document.getElementById('importModal').addEventListener('click', e => {
  if (e.target === document.getElementById('importModal')) document.getElementById('importModal').classList.remove('open');
});
document.getElementById('importExecBtn').addEventListener('click', async () => {
  const errEl = document.getElementById('importError');
  const btn = document.getElementById('importExecBtn');
  errEl.style.display = 'none';
  btn.textContent = '読み込み中...'; btn.disabled = true;
  try {
    const code = document.getElementById('importCodeInput').value.trim();
    if (!code) { errEl.textContent = 'デッキコードを入力してください'; errEl.style.display = ''; return; }
    const msg = await importDeckFromCode(code);
    document.getElementById('importModal').classList.remove('open');
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelector('[data-page="pageDecks"]').classList.add('active');
    document.getElementById('pageDecks').classList.add('active');
    await showAlert(msg);
  } catch(e) {
    errEl.textContent = e.message; errEl.style.display = '';
  } finally {
    btn.textContent = '読み込む'; btn.disabled = false;
  }
});

function renderProgress(){
  const section=document.getElementById('progressSection'); section.innerHTML='';
  const total=allCards.length; const owned=allCards.filter(c=>ownedTotal(c.id)>0).length;
  addProg(section,'全セット合計',owned,total,null,IMG_HOST+'banners/bnr_all.webp');
  sets.forEach(s=>{
    const sc=allCards.filter(c=>c.set?.code===s.code);
    const so=sc.filter(c=>ownedTotal(c.id)>0).length;
    const sd=setsData.find(d=>d.code===s.code);
    const label=sd?`第${s.code}弾 ${sd.name}`:`第${s.code}弾 ${s.name}`;
    const bannerUrl=sd?.banner?IMG_HOST+'banners/'+sd.banner:null;
    addProg(section,label,so,sc.length,s.code,bannerUrl);
  });}
function addProg(parent,label,owned,total,setCode,bannerUrl){
  const pct=total>0?Math.round(owned/total*100):0;
  const div=document.createElement('div'); div.className='progress-card';
  if(setCode) div.style.cursor='pointer';
  if(bannerUrl){
    const img=document.createElement('img');
    img.src=bannerUrl; img.alt=label; img.loading='lazy';
    img.style.cssText='width:100%;border-radius:6px;margin-bottom:6px;display:block;';
    div.appendChild(img);
  }
  const h3=document.createElement('h3'); h3.textContent=label; div.appendChild(h3);
  const wrap=document.createElement('div'); wrap.className='progress-bar-wrap';
  const bar=document.createElement('div'); bar.className='progress-bar'; bar.style.width=pct+'%';
  wrap.appendChild(bar); div.appendChild(wrap);
  const nums=document.createElement('div'); nums.className='progress-nums';
  nums.textContent=owned+' / '+total+' ('+pct+'%)'; div.appendChild(nums);
  if(setCode){
    div.addEventListener('click',()=>{
      // 詳細検索のセットフィルターにこの弾だけを設定
      advFilter.sets.clear();
      advFilter.sets.add(setCode);
      // カードタブに切り替え
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      document.querySelector('[data-page="pageCards"]').classList.add('active');
      document.getElementById('pageCards').classList.add('active');
      document.getElementById('advSearchBtn').style.display='flex';
      renderCardGrid();
      window.scrollTo(0,0);
    });
  }
  parent.appendChild(div);
}

function renderDeckList(){
  const list=document.getElementById('deckList'); list.innerHTML='';
  decks.forEach(deck=>{
    const total=Object.values(deck.cards??{}).reduce((a,b)=>a+b,0);
    const inks=[...new Set(Object.keys(deck.cards??{}).filter(id=>(deck.cards[id]??0)>0).flatMap(id=>{ const c=allCards.find(x=>x.id===id); return c?.inks ?? (c?.ink?[c.ink]:[]); }).filter(Boolean))];
    const div=document.createElement('div'); div.className='deck-card';
    // スリーブ画像
    const sleeve = DECK_SLEEVES.find(s=>s.id===deck.sleeveId);
    if(sleeve){ const si=document.createElement('img'); si.className='deck-sleeve'; si.src=sleeve.src; si.alt='スリーブ'; si.loading='lazy'; div.appendChild(si); }
    else { const sp=document.createElement('div'); sp.className='deck-sleeve-placeholder'; sp.textContent='🃏'; div.appendChild(sp); }
    const left=document.createElement('div'); left.style.flex='1'; left.style.minWidth='0';
    const h3=document.createElement('h3'); h3.textContent=deck.name||'名称未設定';
    const meta=document.createElement('div'); meta.className='deck-meta';
    if(inks.length > 1) { meta.appendChild(makeDualInkDot(inks)); } else { inks.forEach(i=>meta.appendChild(makeInkDot(i))); }

    left.appendChild(h3); left.appendChild(meta);
    const cnt=document.createElement('div'); cnt.className='deck-count'; cnt.textContent=`${total}/60`;
    div.appendChild(left); div.appendChild(cnt);
    div.addEventListener('click',()=>openDeckEditor(deck));
    list.appendChild(div);
  });
}

function deckTotal(){ return Object.values(currentDeck.cards??{}).reduce((a,b)=>a+b,0); }
function deckInks(){
  return [...new Set(Object.keys(currentDeck.cards??{}).filter(id=>(currentDeck.cards[id]??0)>0).flatMap(id=>{ const c=allCards.find(x=>x.id===id); return c?.inks ?? (c?.ink?[c.ink]:[]); }).filter(Boolean))];
}

function openDeckEditor(deck){
  currentDeck=deck?{...deck,cards:{...(deck.cards??{})}}:{id:crypto.randomUUID(),name:'',cards:{}};
  document.getElementById('deckNameInput').value=currentDeck.name??'';
  document.getElementById('editorDel').style.display=deck?'':'none';
  document.getElementById('deckEditor').classList.add('open');
  document.body.classList.add('deck-editing');
  document.getElementById('editorSearch').value='';
  document.getElementById('sleevePicker').classList.remove('open');
  renderSleeveGrid();
  renderDeckEditor();
}
function renderSleeveGrid(){
  const grid=document.getElementById('sleeveGrid');
  grid.innerHTML='';
  // なしオプション
  const none=document.createElement('div'); none.className='sleeve-option-none'+(currentDeck.sleeveId==null?' selected':''); none.textContent='✕';
  none.addEventListener('click',()=>{ currentDeck.sleeveId=null; renderSleeveGrid(); });
  grid.appendChild(none);
  // 各スリーブ
  DECK_SLEEVES.forEach(s=>{
    const img=document.createElement('img'); img.className='sleeve-option'+(currentDeck.sleeveId===s.id?' selected':'');
    img.src=s.src; img.alt=s.id; img.loading='lazy';
    img.addEventListener('click',()=>{ currentDeck.sleeveId=s.id; renderSleeveGrid(); });
    grid.appendChild(img);
  });
}
function closeDeckEditor(){ document.getElementById('deckEditor').classList.remove('open'); document.body.classList.remove('deck-editing'); currentDeck=null; }

function renderDeckEditor(){
  const total=deckTotal(); const inks=deckInks();
  document.getElementById('deckTotal').innerHTML=`<span>${total}</span> / 60枚`;
  document.getElementById('inkWarning').style.display=inks.length>2?'':'none';
  const dl=document.getElementById('deckCardList'); dl.innerHTML='';
  const entries=Object.entries(currentDeck.cards??{}).filter(([,v])=>v>0);
  if(!entries.length){ dl.innerHTML='<div style="padding:12px;font-size:0.75rem;color:var(--text2);">右から追加してください</div>'; }
  entries.forEach(([cardId,count])=>{
    const card=allCards.find(c=>c.id===cardId); if(!card) return;
    const row=document.createElement('div'); row.className='deck-card-row';
    const rowImg=makeImg(card,'width:36px;height:50px;border-radius:4px;flex-shrink:0;'); row.appendChild(rowImg);
    const di=document.createElement('div'); di.className='dc-info';
    const dn=document.createElement('div'); dn.className='dc-name'; dn.textContent=card.name;
    const ds=document.createElement('div'); ds.className='dc-sub'; if(card.version) ds.textContent=card.version;
    di.appendChild(dn); di.appendChild(ds);
    row.appendChild(di);
    const db2=document.createElement('div'); db2.className='dc-btns';
    const remBtn=document.createElement('button'); remBtn.className='dc-btn rem'; remBtn.textContent='－';
    const cntSpan=document.createElement('span'); cntSpan.className='dc-count'; cntSpan.textContent=count;
    const addBtn=document.createElement('button'); addBtn.className='dc-btn add'; addBtn.textContent='＋';
    remBtn.addEventListener('click',()=>{ currentDeck.cards[cardId]=Math.max(0,count-1); renderDeckEditor(); });
    db2.appendChild(remBtn); db2.appendChild(cntSpan); db2.appendChild(addBtn);
    addBtn.addEventListener('click',()=>{
      if(total>=60||count>=4) return;
      const cardInks=card.inks??(card.ink?[card.ink]:[]);
      const curInks=deckInks();
      const newInks=[...new Set([...curInks,...cardInks])];
      if(newInks.length>2) return;
      currentDeck.cards[cardId]=count+1; renderDeckEditor();
    });
    row.appendChild(db2);
    dl.appendChild(row);
  });
  renderEditorCardList();
}

function renderEditorCardList(){
  const q=document.getElementById('editorSearch').value.toLowerCase();
  const list=document.getElementById('editorCardList'); list.innerHTML='';
  const total=deckTotal(); const inks=deckInks();
  allCards.filter(c=>!q||(c.name?.toLowerCase().includes(q)||c.version?.toLowerCase().includes(q))).slice(0,60).forEach(card=>{
    const count=currentDeck.cards[card.id]??0;
    const cardInks=card.inks??(card.ink?[card.ink]:[]);
    const newInks=[...new Set([...inks,...cardInks])];
    const canAdd=total<60&&count<4&&newInks.length<=2;
    const row=document.createElement('div'); row.className='deck-card-row';
    const rowImg=makeImg(card,'width:36px;height:50px;border-radius:4px;flex-shrink:0;'); row.appendChild(rowImg);
    const di=document.createElement('div'); di.className='dc-info';
    const dn=document.createElement('div'); dn.className='dc-name';
    dn.textContent=card.name;
    const ds=document.createElement('div'); ds.className='dc-sub';
    if(card.version) ds.textContent=card.version;
    di.appendChild(dn); di.appendChild(ds);
    row.appendChild(di);
    const db2=document.createElement('div'); db2.className='dc-btns';
    const ab=document.createElement('button'); ab.className='dc-btn add'; ab.textContent='＋'; ab.disabled=!canAdd; ab.style.opacity=canAdd?'1':'0.3';
    ab.addEventListener('click',()=>{ if(!canAdd) return; currentDeck.cards[card.id]=(currentDeck.cards[card.id]??0)+1; renderDeckEditor(); });
    const cs=document.createElement('span'); cs.className='dc-count'; cs.textContent=count||'';
    db2.appendChild(ab); db2.appendChild(cs); row.appendChild(db2);
    list.appendChild(row);
  });
}

document.getElementById('editorSearch').addEventListener('input',renderEditorCardList);
document.getElementById('sleevePickerBtn').addEventListener('click',()=>document.getElementById('sleevePicker').classList.toggle('open'));
document.getElementById('editorBack').addEventListener('click',closeDeckEditor);
document.getElementById('exportDeckCodeBtn').addEventListener('click', async () => {
  const btn = document.getElementById('exportDeckCodeBtn');
  btn.textContent = '発行中...'; btn.disabled = true;
  try {
    const code = await exportDeckCode();
    await showAlert(`デッキコード\n${code}\n\n（タカラトミー公式サイトで使用できます）`);
  } catch(e) {
    await showAlert(`エラー: ${e.message}`);
  } finally {
    btn.textContent = '🔢 コード発行'; btn.disabled = false;
  }
});
document.getElementById('editorSave').addEventListener('click',async()=>{
  currentDeck.name=document.getElementById('deckNameInput').value||'名称未設定';
  // sleeveIdはcurrentDeckに既に格納済み
  await dbPut('decks',currentDeck);
  const idx=decks.findIndex(d=>d.id===currentDeck.id); if(idx>=0) decks[idx]=currentDeck; else decks.push(currentDeck);
  renderDeckList(); closeDeckEditor();
});
document.getElementById('editorDel').addEventListener('click',async()=>{
  if(!await showConfirm(`「${currentDeck.name}」を削除しますか？`)) return;
  await dbDelete('decks',currentDeck.id); decks=decks.filter(d=>d.id!==currentDeck.id);
  renderDeckList(); closeDeckEditor();
});
document.getElementById('addDeckBtn').addEventListener('click', openNewDeckModal);

document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const alreadyActive = btn.classList.contains('active');
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.page).classList.add('active');
    // 🔍ボタンはカードタブのみ表示
    const advBtn = document.getElementById('advSearchBtn');
    if(advBtn) advBtn.style.display = btn.dataset.page === 'pageCards' ? 'flex' : 'none';
    if(alreadyActive){ window.scrollTo(0,0); return; }
    if(btn.dataset.page==='pageCollection') renderProgress();
    if(btn.dataset.page==='pageDecks') renderDeckList();
    if(btn.dataset.page==='pageLore') initLoreCounter();
  });
});

// キャッシュクリア（メニュー）
document.getElementById('menuCacheRefresh').addEventListener('click', async()=>{
  closeMenu();
  if(!await showConfirm('カードデータのキャッシュを削除して再取得しますか？\n（move_costなど新しいデータが反映されます）')) return;
  await dbDelete('meta', CARD_CACHE_KEY);
  location.reload();
});
let _searchTimer;
const _cardSearchEl = document.getElementById('cardSearch');
_cardSearchEl.addEventListener('input', e => {
  searchQ = e.target.value;
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => renderCardGrid(), 200);
});
_cardSearchEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') { clearTimeout(_searchTimer); renderCardGrid(); }
});


// ═══════════════════════════════════════════
// データ取得（並列fetch + IndexedDBキャッシュ）
// ═══════════════════════════════════════════
async function loadData(){
  const overlay = document.getElementById('loadingOverlay');
  const prog    = document.getElementById('loadProgress');
  const cInfo   = document.getElementById('cacheInfo');
  overlay.classList.add('show');

  // loreca_config.json を取得（セット情報・スリーブ一覧）
  try {
    const r = await fetch('./loreca_config.json');
    const config = await r.json();
    setsData    = config.sets    ?? [];
    DECK_SLEEVES = (config.sleeves ?? []).map(s => ({
      id:  s.id,
      src: IMG_HOST + 'sleeves/slv_' + s.id + '.webp'
    }));
  } catch(e) {
    console.warn('[loadData] loreca_config.json fetch failed:', e);
  }

  // キャッシュチェック（ETag で更新検知）
  const cached = await loadCardCache();
  const now = Date.now();
  const CARDS_URL = IMG_HOST + 'loreca_cards.json';
  let res, etag;

  try {
    prog.textContent = cached ? 'データ更新を確認中…' : 'カードデータを取得中…';
    const headers = cached?.etag ? { 'If-None-Match': cached.etag } : {};
    res = await fetch(CARDS_URL, { headers });

    // 304: 変更なし → キャッシュ使用
    if(res.status === 304 && cached) {
      const age = Math.floor((now - cached.savedAt) / (24*60*60*1000));
      cInfo.textContent = age > 0 ? `最終更新: ${age}日前` : '最新';
      sets    = cached.sets;
      allCards = cached.cards;
      overlay.classList.remove('show');
      return;
    }

    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    etag = res.headers.get('ETag');
    const data = await res.json();
    const rawCards = Array.isArray(data) ? data : (data.cards ?? []);

    // sets を sets_order から生成
    const setMap = {};
    rawCards.forEach(c => {
      const order = c.sets_order ?? 0;
      const code  = String(Math.round(order / 100));
      if(!setMap[code]) setMap[code] = { code, name: c.sets ?? `第${code}弾` };
    });
    sets = Object.values(setMap).sort((a,b) =>
      a.code.localeCompare(b.code, undefined, {numeric:true})
    );

    function extractKeywords(rulesText) {
      if(!rulesText) return [];
      const matches = rulesText.match(/<([^>]+)>/g) ?? [];
      return [...new Set(matches.map(m => {
        const kw = m.slice(1,-1).trim();
        // 「変身：〜」「だれでも変身」「〇〇変身」等を全て「変身」に統一
        if(kw.includes('変身')) return '変身';
        return kw;
      }))];
    }
    allCards = rawCards.map(c => {
      const order  = c.sets_order ?? 0;
      const code   = String(Math.round(order / 100));
      const inks = [c.ink_color, c.ink_color2].filter(Boolean);
      return {
        id:               `tt_${code}_${c.collector_number}`,
        name:             c.card_name   ?? '',
        version:          c.version     ?? '',
        type:             c.card_type ? [c.card_type] : [],
        rarity:           c.rarity ?? '',
        ink:              inks[0] ?? '',
        inks:             inks.length > 0 ? inks : [],
        cost:             c.ink_cost    != null ? Number(c.ink_cost)   : null,
        strength:         c.strength    != null ? Number(c.strength)   : null,
        willpower:        c.willpower   != null ? Number(c.willpower)  : null,
        lore:             c.lore_value  != null ? Number(c.lore_value) : null,
        move_cost:        (c.card_type==='ロケーション' && c.move_cost!=null) ? Number(c.move_cost) : null,
        inkwell:          c.inkwell === 'y',
        text:             [c.rules_text, c.flavor_text].filter(Boolean).join('\n'),
        classifications:  c.classifications ?? [],
        keywords:         extractKeywords(c.rules_text),
        artist:           c.artist_credit1 ?? '',
        card_file:        c.card_file   ?? '',
        collector_number: String(c.collector_number ?? ''),
        set: { code, name: c.sets ?? `第${code}弾` },
      };
    });

    allCards.sort((a,b)=>{
      const sc = (a.set?.code??'').localeCompare(b.set?.code??'',undefined,{numeric:true});
      return sc!==0 ? sc : String(a.collector_number).localeCompare(String(b.collector_number),undefined,{numeric:true});
    });

    // キャッシュ保存
    await saveCardCache(sets, allCards, etag);

  } catch(e) {
    console.error('[loadData] API fetch failed:', e);
    if(cached) {
      // 古いキャッシュで続行
      sets = cached.sets; allCards = cached.cards;
      prog.textContent = `オフライン: キャッシュを使用中`;
      cInfo.textContent = e.message;
      overlay.classList.remove('show');
    } else {
      // キャッシュなし → エラー画面を表示したまま再試行ボタンを出す
      prog.textContent = 'データの取得に失敗しました';
      cInfo.textContent = e.message;
      const retryBtn = document.createElement('button');
      retryBtn.textContent = '再試行';
      retryBtn.style.cssText = 'margin-top:16px;padding:10px 28px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:0.9rem;cursor:pointer;';
      retryBtn.addEventListener('click', async () => {
        retryBtn.remove();
        await loadData();
        renderCardGrid();
      });
      overlay.appendChild(retryBtn);
      return;
    }
  }

  overlay.classList.remove('show');
}

// ═══════════════════════════════════════════
// 設定
// ═══════════════════════════════════════════
const SETTINGS_KEY = 'loreca_settings';
const SETTINGS_DEFAULT = { gridCols: 3, defaultView: 'all' };

function loadSettings() {
  try { return Object.assign({}, SETTINGS_DEFAULT, JSON.parse(localStorage.getItem(SETTINGS_KEY))); }
  catch(e) { return { ...SETTINGS_DEFAULT }; }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function applyGridCols(n) {
  document.getElementById('cardGrid').style.gridTemplateColumns = `repeat(${n}, 1fr)`;
}

function initSettings() {
  const s = loadSettings();

  applyGridCols(s.gridCols);

  if (s.defaultView !== 'all') {
    cardView = s.defaultView;
    document.querySelectorAll('.view-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.view === s.defaultView);
    });
  }

  document.querySelectorAll('#settingGridCols .settings-pill').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.value) === s.gridCols);
    b.addEventListener('click', () => {
      const cur = loadSettings();
      cur.gridCols = parseInt(b.dataset.value);
      saveSettings(cur);
      applyGridCols(cur.gridCols);
      document.querySelectorAll('#settingGridCols .settings-pill').forEach(x => x.classList.toggle('active', x === b));
    });
  });

  document.querySelectorAll('#settingDefaultView .settings-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.value === s.defaultView);
    b.addEventListener('click', () => {
      const cur = loadSettings();
      cur.defaultView = b.dataset.value;
      saveSettings(cur);
      document.querySelectorAll('#settingDefaultView .settings-pill').forEach(x => x.classList.toggle('active', x === b));
    });
  });

  document.getElementById('exportBackupBtn').addEventListener('click', exportBackup);
  document.getElementById('importBackupBtn').addEventListener('click', () => document.getElementById('importBackupFile').click());
  document.getElementById('importBackupFile').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { await importBackup(file); }
    catch (err) { await showAlert('インポートに失敗しました: ' + err.message); }
  });
}

// ═══════════════════════════════════════════
// バックアップ（エクスポート / インポート）
// ═══════════════════════════════════════════
async function exportBackup() {
  const [collectionRows, deckRows, wishlistRows] = await Promise.all([
    dbGetAll('collection'), dbGetAll('decks'), dbGetAll('wishlist'),
  ]);
  const backup = {
    appName: 'loreca',
    version: 1,
    exportedAt: new Date().toISOString(),
    collection: collectionRows,
    decks: deckRows,
    wishlist: wishlistRows,
    settings: loadSettings(),
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `loreca-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

async function importBackup(file) {
  const text = await file.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('JSONの形式が正しくありません'); }
  if (data.appName !== 'loreca' || !Array.isArray(data.collection)) {
    throw new Error('Lorecaのバックアップファイルではありません');
  }
  const colN = data.collection.length;
  const deckN = (data.decks ?? []).length;
  const wishN = (data.wishlist ?? []).length;
  const ok = await showConfirm(
    `バックアップを復元します。\n現在のデータは上書きされます。\n\n` +
    `コレクション: ${colN}件\n` +
    `デッキ: ${deckN}件\n` +
    `ウィッシュリスト: ${wishN}件\n\n` +
    `続行しますか？`
  );
  if (!ok) return;
  await dbReplaceAll('collection', data.collection);
  await dbReplaceAll('decks',      data.decks    ?? []);
  await dbReplaceAll('wishlist',   data.wishlist ?? []);
  if (data.settings && typeof data.settings === 'object') {
    saveSettings({ ...SETTINGS_DEFAULT, ...data.settings });
  }
  await showAlert('復元が完了しました。アプリをリロードします。');
  location.reload();
}

// ═══════════════════════════════════════════
// 起動
// ═══════════════════════════════════════════
(async()=>{
  await openDB();
  const rows = await dbGetAll('collection');
  collection = {}; rows.forEach(r => { collection[r.id] = r; });
  try { const wRows = await dbGetAll('wishlist'); wishlist = new Set(wRows.map(r=>r.id)); } catch(e) { console.warn('[startup] wishlist load failed:', e); wishlist = new Set(); }
  decks = await dbGetAll('decks');
  await loadData();
  renderCardGrid();
  initSettings();

  // 古い画像キャッシュを削除
  if('caches' in window){
    caches.keys().then(keys=>keys.forEach(k=>{ if(k.startsWith('loreca-img-') && k!==IMG_CACHE_NAME) caches.delete(k); }));
  }

  // バックグラウンドで全画像プリフェッチ
  if('caches' in window){
    const bar   = document.getElementById('prefetchBar');
    const label = document.getElementById('prefetchLabel');
    const inner = document.getElementById('prefetchBarInner');
    if(bar){
      bar.style.display='block';
      prefetchAllImages(allCards,(done,total)=>{
        const pct=total>0?Math.round(done/total*100):100;
        label.textContent=pct<100?`画像キャッシュ中… ${done} / ${total}`:'画像キャッシュ完了 ✓';
        inner.style.width=pct+'%';
        if(pct>=100) setTimeout(()=>{ bar.style.display='none'; },2000);
      }).catch(()=>{ bar.style.display='none'; });
    }
  }

  // ======= 詳細検索 =======

    function makeToggleBtn(label, activeSet, key, container){
    const btn=document.createElement('button');
    btn.className='adv-chip' + (activeSet.has(key) ? ' active' : '');
    btn.textContent=label;
    btn.dataset.key=key;
    btn.addEventListener('click',()=>{ if(activeSet.has(key)) activeSet.delete(key); else activeSet.add(key); buildAdvUI(); });
    container.appendChild(btn);
  }

  function buildAdvUI(){
    // 並び替え（ドロップダウン）
    const sortSel=document.getElementById('advSortSelect');
    if(sortSel){ sortSel.value=advFilter.sortOrder??'id_asc';
      if(!sortSel._init){ sortSel._init=true;
        sortSel.addEventListener('change',()=>{ advFilter.sortOrder=sortSel.value; document.getElementById('advApply').textContent='結果を表示（'+filteredCards().length+'件）'; });
      }
    }

    // インクタイプ（アイコンのみ・文字なし）
    const inkGrid=document.getElementById('advInkGrid');
    inkGrid.innerHTML='';
    ['アンバー','アメジスト','エメラルド','ルビー','サファイア','スティール'].forEach(ink=>{
      const iconWrap=document.createElement('div');
      iconWrap.className='adv-icon-wrap' + (advFilter.inks.has(ink) ? ' active' : '');
      const dot=makeInkDot(ink); dot.className='adv-icon-dot';
      const dotImg=dot.querySelector('img'); if(dotImg) dotImg.style.cssText='width:100%;height:100%;object-fit:contain;display:block;';
      iconWrap.appendChild(dot);
      iconWrap.addEventListener('click',()=>{ if(advFilter.inks.has(ink)) advFilter.inks.delete(ink); else advFilter.inks.add(ink); buildAdvUI(); });
      inkGrid.appendChild(iconWrap);
    });

    // レアリティ（アイコンのみ・文字なし・エピックをレジェの後に）
    const rGrid=document.getElementById('advRarityGrid');
    rGrid.innerHTML='';
    ['コモン','アンコモン','レア','スーパーレア','レジェンダリー','エピック','エンチャンテッド','アイコニック'].forEach(r=>{
      const iconWrap=document.createElement('div');
      iconWrap.className='adv-icon-wrap' + (advFilter.rarities.has(r) ? ' active' : '');
      const span=document.createElement('span'); span.className='adv-icon-span';
      const src=RARITY_IMG[r]??'';
      if(src){const img=document.createElement('img');img.src=src;img.alt=r;span.appendChild(img);}
      iconWrap.appendChild(span);
      iconWrap.addEventListener('click',()=>{ if(advFilter.rarities.has(r)) advFilter.rarities.delete(r); else advFilter.rarities.add(r); buildAdvUI(); });
      rGrid.appendChild(iconWrap);
    });

    // セット
    const sGrid=document.getElementById('advSetGrid');
    sGrid.innerHTML='';
    sets.forEach(s=>{ makeToggleBtn('第'+s.code+'弾', advFilter.sets, s.code, sGrid); });

    // タイプ
    const tGrid=document.getElementById('advTypeGrid');
    tGrid.innerHTML='';
    {
      const TYPE_BTNS=[
        {key:'キャラクター', label:'キャラクター'},
        {key:'アクション',   label:'アクション・歌以外'},
        {key:'action_song',  label:'アクション・歌'},
        {key:'アイテム',     label:'アイテム'},
        {key:'ロケーション', label:'ロケーション'},
      ];
      TYPE_BTNS.forEach(({key,label})=>{
        const btn=document.createElement('button');
        btn.className='adv-chip' + (advFilter.types.has(key) ? ' active' : '');
        btn.textContent=label;
        btn.dataset.key=key;
        btn.addEventListener('click',()=>{ if(advFilter.types.has(key)) advFilter.types.delete(key); else advFilter.types.add(key); buildAdvUI(); });
        tGrid.appendChild(btn);
      });
    }

    // 能力（keywords）- rules_textの<XXX>から抽出した日本語キーで管理
    const KEYWORD_ORDER = ['護衛','果敢','回避','暴勇','耐久','突進','変身','歌声','支援','霧消','魔除','抵抗','強行','突撃','加速'];
    const kwGrid=document.getElementById('advKeywordGrid');
    if(kwGrid){
      kwGrid.innerHTML='';
      // 実際にカード内に存在するキーワードのみ表示
      const existingKw = new Set();
      allCards.forEach(c=>(c.keywords??[]).forEach(k=>existingKw.add(k)));
      // 指定順で存在するものを先に、残りは追加
      const orderedKw = KEYWORD_ORDER.filter(k=>existingKw.has(k));
      const restKw    = [...existingKw].filter(k=>!KEYWORD_ORDER.includes(k)).sort((a,b)=>a.localeCompare(b,'ja'));
      [...orderedKw,...restKw].forEach(kw=>{ makeToggleBtn(kw, advFilter.keywords, kw, kwGrid); });
    }
    // コストスライダー
    const minSlider=document.getElementById('advCostMin');
    const maxSlider=document.getElementById('advCostMax');
    if(!minSlider._init){
      minSlider._init=true;
      function updateSlider(){
        let lo=parseInt(minSlider.value), hi=parseInt(maxSlider.value);
        if(lo>hi){ hi=lo; maxSlider.value=hi; }
        advFilter.costMin=(lo===0)?null:lo;
        advFilter.costMax=(hi===10)?null:hi;
        const pLo=lo/10*100, pHi=hi/10*100;
        document.getElementById('advCostFill').style.left=pLo+'%';
        document.getElementById('advCostFill').style.width=(pHi-pLo)+'%';
        const lbl=document.getElementById('advCostLabel');
        lbl.textContent=(lo===0&&hi===10)?'全て':(lo===hi?lo+'コスト':lo+'〜'+hi+'コスト');
        document.getElementById('advApply').textContent='結果を表示（'+filteredCards().length+'件）';
      }
      minSlider.addEventListener('input',()=>{ if(parseInt(minSlider.value)>parseInt(maxSlider.value)) maxSlider.value=minSlider.value; updateSlider(); });
      maxSlider.addEventListener('input',()=>{ if(parseInt(maxSlider.value)<parseInt(minSlider.value)) minSlider.value=maxSlider.value; updateSlider(); });
    }
    // スライダーの初期値を反映
    minSlider.value=advFilter.costMin??0;
    maxSlider.value=advFilter.costMax??10;
    const lo=parseInt(minSlider.value), hi=parseInt(maxSlider.value);
    document.getElementById('advCostFill').style.left=(lo/10*100)+'%';
    document.getElementById('advCostFill').style.width=((hi-lo)/10*100)+'%';
    const lbl=document.getElementById('advCostLabel');
    lbl.textContent=(lo===0&&hi===10)?'全て':(lo===hi?lo+'コスト':lo+'〜'+hi+'コスト');

    // 攻撃力・意志力・ロアのスライダー共通ヘルパー
    function initRangeSlider(idMin, idMax, idFill, idLabel, max, minKey, maxKey, suffix){
      const sMin=document.getElementById(idMin), sMax=document.getElementById(idMax);
      sMin.value=advFilter[minKey]??0;
      sMax.value=advFilter[maxKey]??max;
      function upd(){
        let lo2=parseInt(sMin.value), hi2=parseInt(sMax.value);
        if(lo2>hi2){ lo2=hi2; sMin.value=lo2; }
        advFilter[minKey]=(lo2===0)?null:lo2;
        advFilter[maxKey]=(hi2===max)?null:hi2;
        document.getElementById(idFill).style.left=(lo2/max*100)+'%';
        document.getElementById(idFill).style.width=((hi2-lo2)/max*100)+'%';
        document.getElementById(idLabel).textContent=(lo2===0&&hi2===max)?'全て':(lo2===hi2?lo2+suffix:lo2+'〜'+hi2+suffix);
        document.getElementById('advApply').textContent='結果を表示（'+filteredCards().length+'件）';
      }
      if(!sMin._init){ sMin._init=true; sMin.addEventListener('input',()=>{ if(parseInt(sMin.value)>parseInt(sMax.value)) sMax.value=sMin.value; upd(); }); sMax.addEventListener('input',()=>{ if(parseInt(sMax.value)<parseInt(sMin.value)) sMin.value=sMax.value; upd(); }); }
      upd();
    }
    initRangeSlider('advStrMin','advStrMax','advStrFill','advStrLabel',12,'strMin','strMax','');
    initRangeSlider('advWpMin','advWpMax','advWpFill','advWpLabel',12,'wpMin','wpMax','');
    initRangeSlider('advLoreMin','advLoreMax','advLoreFill','advLoreLabel',5,'loreMin','loreMax','');
    initRangeSlider('advMcMin','advMcMax','advMcFill','advMcLabel',10,'mcMin','mcMax','');

    // インクウェル・シンボル
    document.getElementById('advInkwellBtns').querySelectorAll('button').forEach(btn=>{
      const val=btn.dataset.val;
      const active=(val==='yes'&&advFilter.inkwell===true)||(val==='no'&&advFilter.inkwell===false);
      btn.classList.toggle('active', active);
      btn.onclick=()=>{ const nv=val==='yes'; advFilter.inkwell=(advFilter.inkwell===nv)?null:nv; buildAdvUI(); };
    });

    // テキスト
    const ti=document.getElementById('advTextInput');
    ti.value=advFilter.textQ??'';
    let _advTextTimer;
    ti.oninput=()=>{
      advFilter.textQ=ti.value;
      clearTimeout(_advTextTimer);
      _advTextTimer=setTimeout(()=>{ document.getElementById('advApply').textContent='結果を表示（'+filteredCards().length+'件）'; }, 200);
    };

    // コレクション状況
    document.getElementById('advCollectionBtns').querySelectorAll('button').forEach(btn=>{
      const val=btn.dataset.val;
      btn.classList.toggle('active', advFilter.collectionStatus===val);
      btn.onclick=()=>{ advFilter.collectionStatus=(advFilter.collectionStatus===val)?null:val; buildAdvUI(); };
    });

    // シングル/デュアルインク
    document.getElementById('advInkTypeBtns').querySelectorAll('button').forEach(btn=>{
      const val=btn.dataset.val;
      btn.classList.toggle('active', advFilter.inkType===val);
      btn.onclick=()=>{ advFilter.inkType=(advFilter.inkType===val)?null:val; buildAdvUI(); };
    });

    // クラス（APIが日本語で返すのでキーも日本語）
    const CLASS_ORDER_JA = [
      'ストーリーボーン','ドリームボーン','フラッドボーン',
      '仲間','ほうき','キャプテン','神格','探偵','恐竜','ドラゴン',
      '妖精','導き手','ヒーロー','ハイエナ','イリュージョン','発明家','王様','騎士',
      'マドリガル家','モンスター','銃士','海賊','プリンス','プリンセス',
      '子犬','女王','レーサー','ロボット','7人のこびと','歌','魔法使い',
      'スーパー','ティガー','タイタン','トイ','ヴィランズ',
    ];
    const classGrid=document.getElementById('advClassGrid');
    if(classGrid){
      classGrid.innerHTML='';
      const existingClass=new Set();
      allCards.forEach(c=>(c.classifications??[]).forEach(cl=>existingClass.add(cl)));
      const ordered = CLASS_ORDER_JA.filter(cl=>existingClass.has(cl));
      const rest    = [...existingClass].filter(cl=>!CLASS_ORDER_JA.includes(cl)).sort((a,b)=>a.localeCompare(b,'ja'));
      [...ordered,...rest].forEach(cl=>{ makeToggleBtn(cl, advFilter.classifications, cl, classGrid); });
    }
    // 結果件数
    document.getElementById('advApply').textContent='結果を表示（'+filteredCards().length+'件）';
  }
  document.getElementById('advSearchBtn').addEventListener('click',()=>{
    buildAdvUI();
    document.getElementById('advSearchModal').classList.add('open');
  });
  document.getElementById('advClose').addEventListener('click',()=>{
    document.getElementById('advSearchModal').classList.remove('open');
    renderCardGrid();
  });
  document.getElementById('advReset2').addEventListener('click',()=>{
    advFilter={rarities:new Set(),types:new Set(),classifications:new Set(),keywords:new Set(),inks:new Set(),sets:new Set(),costMin:null,costMax:null,strMin:null,strMax:null,wpMin:null,wpMax:null,loreMin:null,loreMax:null,mcMin:null,mcMax:null,inkwell:null,inkType:null,collectionStatus:null,textQ:'',sortOrder:'id_asc'};
    buildAdvUI();
  });
  document.getElementById('advApply').addEventListener('click',()=>{
    document.getElementById('advSearchModal').classList.remove('open');
    renderCardGrid();
  });
  document.getElementById('advSearchModal').addEventListener('click', e => {
    if (e.target === document.getElementById('advSearchModal')) {
      document.getElementById('advSearchModal').classList.remove('open');
      renderCardGrid();
    }
  });

  // ======= /詳細検索 =======

  // ビュータブ切り替え
  document.querySelectorAll('.view-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.view-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      cardView=btn.dataset.view;
      renderCardGrid();
    });
  });

  // ウィッシュリストトグル
  document.getElementById('modalWishBtn').addEventListener('click', async()=>{
    if(!currentCard) return;
    const id=currentCard.id;
    if(wishlist.has(id)){
      wishlist.delete(id);
      try { await dbDelete('wishlist',id); } catch(e) { console.warn('[wishlist] dbDelete failed:', id, e); }
      document.getElementById('modalWishBtn').textContent='🤍';
      // ウィッシュリストビューの場合のみ該当カードをグリッドから取り除く
      if(cardView==='wishlist'){
        const grid=document.getElementById('cardGrid');
        grid.querySelectorAll('.card-item').forEach(item=>{ if(item._cardId===id) item.remove(); });
        _gridCards=_gridCards.filter(c=>c.id!==id);
        _gridRendered=Math.max(0,_gridRendered-1);
        const badge=document.getElementById('cardCountBadge');
        if(badge) badge.textContent=String(_gridCards.length);
      }
    } else {
      wishlist.add(id);
      try { await dbPut('wishlist',{id}); } catch(e) { console.warn('[wishlist] dbPut failed:', id, e); }
      document.getElementById('modalWishBtn').textContent='❤️';
    }
  });
})();

// ───────────────────────────────────────────
// ロアカウンター（対面レイアウト）
// ───────────────────────────────────────────
const LORE_PLAYER_COLORS = ['#7c6dfa','#f5a623','#27ae60','#e74c3c'];
const loreState = {
  playerCount: 2,
  donaldOwner: null, // 25ロア効果を持つプレイヤーのindex
  lores: [0, 0, 0, 0],
  diceRolls: null,
  diceWinner: null,
  diceTie: null,
};
let loreInited = false;

function getWinLore(i) {
  if (loreState.donaldOwner === null) return 20;
  return loreState.donaldOwner === i ? 20 : 25;
}

function createPlayerPanel(i, rotated) {
  const color = LORE_PLAYER_COLORS[i];
  const lore = loreState.lores[i];
  const winLore = getWinLore(i);
  const won = lore >= winLore;
  const roll = loreState.diceRolls ? loreState.diceRolls[i] : null;
  const isWinner = loreState.diceWinner === i;
  const isTied = loreState.diceTie && loreState.diceTie.includes(i);

  let diceBadge = '';
  if (roll !== null) {
    const cls = isWinner ? ' lore-first' : (isTied ? ' lore-tied' : '');
    const label = isWinner ? ' 先攻' : (isTied ? ' 同点' : '');
    diceBadge = `<span class="lore-dice-badge${cls}">🎲${roll}${label}</span>`;
  }

  const panel = document.createElement('div');
  panel.className = 'lore-player-face' + (rotated ? ' lore-rotated' : '') + (won ? ' lore-won' : '');
  panel.style.setProperty('--player-color', color);
  panel.innerHTML = `
    <div class="lore-face-header">
      <span class="lore-face-name">プレイヤー${i + 1}</span>
      ${won ? '<span class="lore-face-won">🏆 勝利！</span>' : ''}
      ${diceBadge}
    </div>
    <div class="lore-face-counter">
      <button class="lore-face-btn lore-face-dec" data-i="${i}">－</button>
      <div class="lore-face-val-wrap">
        <span class="lore-face-val">${lore}</span>
        <span class="lore-face-target">/ ${winLore}</span>
      </div>
      <button class="lore-face-btn lore-face-inc" data-i="${i}">＋</button>
    </div>`;
  return panel;
}

function renderLoreCounter() {
  const n = loreState.playerCount;

  // 2人: 上P2 / 下P1、3人: 上P3 / 下P1+P2、4人: 上P3+P4 / 下P1+P2
  let topIdxs, botIdxs;
  if (n === 2)      { botIdxs = [0];    topIdxs = [1]; }
  else if (n === 3) { botIdxs = [0, 1]; topIdxs = [2]; }
  else              { botIdxs = [0, 1]; topIdxs = [2, 3]; }

  const topArea = document.getElementById('loreTopArea');
  const botArea = document.getElementById('loreBottomArea');
  topArea.className = 'lore-top' + (topIdxs.length > 1 ? ' lore-multi' : '');
  botArea.className = 'lore-bottom' + (botIdxs.length > 1 ? ' lore-multi' : '');
  topArea.innerHTML = '';
  botArea.innerHTML = '';
  topIdxs.forEach(i => topArea.appendChild(createPlayerPanel(i, true)));
  botIdxs.forEach(i => botArea.appendChild(createPlayerPanel(i, false)));

  // カウンターボタン
  document.querySelectorAll('.lore-face-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i);
      if (loreState.lores[i] > 0) { loreState.lores[i]--; renderLoreCounter(); }
    });
  });
  document.querySelectorAll('.lore-face-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i);
      loreState.lores[i]++;
      renderLoreCounter();
    });
  });

  // ダイス結果
  const resultEl = document.getElementById('loreDiceResult');
  if (loreState.diceRolls) {
    resultEl.style.display = 'block';
    if (loreState.diceWinner !== null) {
      resultEl.textContent = `プレイヤー${loreState.diceWinner + 1} が先攻！`;
    } else {
      const names = loreState.diceTie.map(j => `プレイヤー${j + 1}`).join('・');
      resultEl.textContent = `${names} が同点 — もう一度振ってください`;
    }
  } else {
    resultEl.style.display = 'none';
  }
}

function renderDonaldModal() {
  const n = loreState.playerCount;
  const el = document.getElementById('loreDonaldModalBtns');
  el.innerHTML = '';
  const noneBtn = document.createElement('button');
  noneBtn.className = 'lore-modal-choice' + (loreState.donaldOwner === null ? ' active' : '');
  noneBtn.textContent = 'なし';
  noneBtn.addEventListener('click', () => {
    loreState.donaldOwner = null;
    document.getElementById('loreDonaldModal').style.display = 'none';
    renderLoreCounter();
  });
  el.appendChild(noneBtn);
  for (let i = 0; i < n; i++) {
    const btn = document.createElement('button');
    btn.className = 'lore-modal-choice' + (loreState.donaldOwner === i ? ' active' : '');
    btn.textContent = `P${i + 1}`;
    btn.addEventListener('click', () => {
      loreState.donaldOwner = loreState.donaldOwner === i ? null : i;
      document.getElementById('loreDonaldModal').style.display = 'none';
      renderLoreCounter();
    });
    el.appendChild(btn);
  }
}

function initLoreCounter() {
  if (loreInited) { renderLoreCounter(); return; }
  loreInited = true;

  // 人数ボタン → モーダル
  document.getElementById('lorePlayerCountBtn').addEventListener('click', () => {
    document.querySelectorAll('#loreCountModal .lore-modal-choice').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.count) === loreState.playerCount);
    });
    document.getElementById('loreCountModal').style.display = 'flex';
  });
  document.querySelectorAll('#loreCountModal .lore-modal-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      loreState.playerCount = parseInt(btn.dataset.count);
      if (loreState.donaldOwner !== null && loreState.donaldOwner >= loreState.playerCount) loreState.donaldOwner = null;
      loreState.diceRolls = null; loreState.diceWinner = null; loreState.diceTie = null;
      document.getElementById('loreCountModal').style.display = 'none';
      renderLoreCounter();
    });
  });
  document.getElementById('loreCountCancel').addEventListener('click', () => {
    document.getElementById('loreCountModal').style.display = 'none';
  });

  // ロアボタン → モーダル
  document.getElementById('loreDonaldBtn').addEventListener('click', () => {
    renderDonaldModal();
    document.getElementById('loreDonaldModal').style.display = 'flex';
  });
  document.getElementById('loreDonaldCancel').addEventListener('click', () => {
    document.getElementById('loreDonaldModal').style.display = 'none';
  });

  // ダイスボタン
  document.getElementById('loreDiceBtn').addEventListener('click', () => {
    const n = loreState.playerCount;
    const rolls = Array.from({ length: n }, () => Math.floor(Math.random() * 6) + 1);
    loreState.diceRolls = rolls;
    const max = Math.max(...rolls);
    const winners = rolls.reduce((acc, r, i) => { if (r === max) acc.push(i); return acc; }, []);
    loreState.diceWinner = winners.length === 1 ? winners[0] : null;
    loreState.diceTie = winners.length > 1 ? winners : null;
    renderLoreCounter();
  });

  // ポーズボタン → モーダル
  document.getElementById('lorePauseBtn').addEventListener('click', () => {
    document.getElementById('lorePauseModal').style.display = 'flex';
  });
  document.getElementById('loreContinueBtn').addEventListener('click', () => {
    document.getElementById('lorePauseModal').style.display = 'none';
  });
  document.getElementById('loreRestartBtn').addEventListener('click', () => {
    loreState.lores = [0, 0, 0, 0];
    loreState.diceRolls = null; loreState.diceWinner = null; loreState.diceTie = null;
    document.getElementById('lorePauseModal').style.display = 'none';
    renderLoreCounter();
  });

  renderLoreCounter();
}
