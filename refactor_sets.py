#!/usr/bin/env python3
"""
index_v2.html から SET_NAMES_JA / BANNER_IMG を削除し、
sets.json を使うよう書き換えるスクリプト
"""
import re

with open('/home/user/lorcana-app/index_v2.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. SET_NAMES_JA を削除 ───────────────────────────────
content = re.sub(
    r'const SET_NAMES_JA = \{.*?\};\n',
    '',
    content,
    flags=re.DOTALL
)

# ── 2. BANNER_IMG を削除 ─────────────────────────────────
content = re.sub(
    r'const BANNER_IMG = \{.*?\};\n',
    '',
    content,
    flags=re.DOTALL
)

# ── 3. グローバル変数に setsData を追加 ──────────────────
content = content.replace(
    'let allCards=[],sets=[]',
    'let allCards=[],sets=[],setsData=[]'
)

# ── 4. loadData の先頭に sets.json フェッチを追加 ─────────
SETS_FETCH = """  // sets.json の読み込み
  if (setsData.length === 0) {
    try {
      const sr = await fetch('https://y1219e.github.io/lorcana-app/sets.json');
      setsData = await sr.json();
    } catch(e) {}
  }

  // キャッシュチェック"""

content = content.replace(
    '  // キャッシュチェック',
    SETS_FETCH
)

# ── 5. renderCollection の addProg 呼び出しを更新 ─────────
OLD_RENDER = "sets.forEach(s=>{ const sc=allCards.filter(c=>c.set?.code===s.code); const so=sc.filter(c=>ownedTotal(c.id)>0).length; addProg(section,`第${s.code}弾 ${SET_NAMES_JA[s.code]??s.name}`,so,sc.length,s.code); });"
NEW_RENDER = """sets.forEach(s=>{
    const sc=allCards.filter(c=>c.set?.code===s.code);
    const so=sc.filter(c=>ownedTotal(c.id)>0).length;
    const sd=setsData.find(d=>d.code===s.code);
    const label=sd?`第${s.code}弾 ${sd.name}`:`第${s.code}弾 ${s.name}`;
    const bannerUrl=sd?.banner?IMG_HOST+'icons/'+sd.banner:null;
    addProg(section,label,so,sc.length,s.code,bannerUrl);
  });"""

content = content.replace(OLD_RENDER, NEW_RENDER)

# ── 6. addProg 関数を更新 ────────────────────────────────
OLD_ADDPROG = """function addProg(parent,label,owned,total,setCode){
  const pct=total>0?Math.round(owned/total*100):0;
  const div=document.createElement('div'); div.className='progress-card';
  if(setCode) div.style.cursor='pointer';
  const bannerKey = Object.keys(BANNER_IMG).find(function(k){ return label.includes(k); });
  let bannerHtml = '';
  if(bannerKey) {
    bannerHtml = '<img src="' + BANNER_IMG[bannerKey] + '" style="width:100%;border-radius:6px;margin-bottom:6px;display:block;" alt="' + bannerKey + '">';
  }
  div.innerHTML = bannerHtml + '<h3>' + label + '</h3><div class="progress-bar-wrap"><div class="progress-bar" style="width:' + pct + '%"></div></div><div class="progress-nums">' + owned + ' / ' + total + ' (' + pct + '%)</div>';"""

NEW_ADDPROG = """function addProg(parent,label,owned,total,setCode,bannerUrl){
  const pct=total>0?Math.round(owned/total*100):0;
  const div=document.createElement('div'); div.className='progress-card';
  if(setCode) div.style.cursor='pointer';
  const bannerHtml=bannerUrl?'<img src="'+bannerUrl+'" style="width:100%;border-radius:6px;margin-bottom:6px;display:block;" alt="">':'';
  div.innerHTML = bannerHtml + '<h3>' + label + '</h3><div class="progress-bar-wrap"><div class="progress-bar" style="width:' + pct + '%"></div></div><div class="progress-nums">' + owned + ' / ' + total + ' (' + pct + '%)</div>';"""

content = content.replace(OLD_ADDPROG, NEW_ADDPROG)

with open('/home/user/lorcana-app/index_v2.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'完了。ファイルサイズ: {len(content):,} bytes ({len(content)//1024} KB)')

# 検証
checks = [
    ('SET_NAMES_JA 削除', 'SET_NAMES_JA' not in content),
    ('BANNER_IMG 削除', 'BANNER_IMG' not in content),
    ('setsData グローバル追加', 'setsData=[]' in content),
    ('sets.json フェッチ追加', 'sets.json' in content),
    ('addProg 更新', 'bannerUrl' in content),
]
for name, ok in checks:
    print(f'  {"✅" if ok else "❌"} {name}')
