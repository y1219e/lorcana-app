#!/usr/bin/env python3
"""
index_v2.html からbase64画像を全部抽出してファイルに保存するスクリプト
"""
import re, base64, os

OUTPUT_DIR = '/home/user/lorcana-app/icons_export'
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open('/home/user/lorcana-app/index_v2.html', 'r', encoding='utf-8') as f:
    content = f.read()

INK_MAP = {
    'アンバー':   'ink_amber',
    'アメジスト': 'ink_amethyst',
    'エメラルド': 'ink_emerald',
    'ルビー':     'ink_ruby',
    'サファイア': 'ink_sapphire',
    'スティール': 'ink_steel',
}

DUAL_INK_MAP = {
    'アメジスト_アンバー':   'ink_dual_amethyst_amber',
    'アンバー_エメラルド':   'ink_dual_amber_emerald',
    'アンバー_ルビー':       'ink_dual_amber_ruby',
    'アンバー_スティール':   'ink_dual_amber_steel',
    'アメジスト_エメラルド': 'ink_dual_amethyst_emerald',
    'アメジスト_ルビー':     'ink_dual_amethyst_ruby',
    'アメジスト_サファイア': 'ink_dual_amethyst_sapphire',
    'エメラルド_ルビー':     'ink_dual_emerald_ruby',
    'エメラルド_サファイア': 'ink_dual_emerald_sapphire',
    'エメラルド_スティール': 'ink_dual_emerald_steel',
    'スティール_ルビー':     'ink_dual_steel_ruby',
    'サファイア_スティール': 'ink_dual_sapphire_steel',
}

RARITY_MAP = {
    'コモン':       'rarity_common',
    'アンコモン':   'rarity_uncommon',
    'レア':         'rarity_rare',
    'スーパーレア': 'rarity_super_rare',
    'レジェンダリー': 'rarity_legendary',
    'エンチャンテッド': 'rarity_enchanted',
    'エピック':     'rarity_epic',
    'アイコニック': 'rarity_iconic',
}

BANNER_MAP = {
    '第1弾': 'banner_1',
    '第2弾': 'banner_2',
    '第3弾': 'banner_3',
    '第4弾': 'banner_4',
    '第5弾': 'banner_5',
    '第6弾': 'banner_6',
    '第7弾': 'banner_7',
    '第8弾': 'banner_8',
    '第9弾': 'banner_9',
    '全セット合計': 'banner_all',
}

ALL_KEY_MAP = {**INK_MAP, **DUAL_INK_MAP, **RARITY_MAP, **BANNER_MAP}

MIME_TO_EXT = {'svg+xml': 'svg', 'jpeg': 'jpg'}

def save_image(filename, data_uri):
    m = re.match(r'data:image/([^;]+);base64,(.+)', data_uri, re.DOTALL)
    if not m:
        return None
    mime, b64 = m.group(1), m.group(2).strip()
    ext = MIME_TO_EXT.get(mime, mime)
    path = os.path.join(OUTPUT_DIR, filename + '.' + ext)
    with open(path, 'wb') as f:
        f.write(base64.b64decode(b64))
    return filename + '.' + ext

saved = []

# JS オブジェクト形式: 'キー': "data:image/..." または "キー": "data:image/..."
for line in content.split('\n'):
    m = re.match(r"""\s*['"]([^'"]+)['"]\s*:\s*["'](data:image/[^"']+)["']""", line)
    if not m:
        continue
    key, data_uri = m.group(1), m.group(2)
    if key not in ALL_KEY_MAP:
        continue
    filename = ALL_KEY_MAP[key]
    result = save_image(filename, data_uri)
    if result:
        saved.append(result)
        print(f'  {key:20s} → {result}')

# DECK_SLEEVES: { id: N, src: "data:image/..." }
for m in re.finditer(r'\{\s*id:\s*(\d+),\s*src:\s*"(data:image/[^"]+)"', content):
    sid, data_uri = m.group(1), m.group(2)
    result = save_image(f'sleeve_{sid}', data_uri)
    if result:
        saved.append(result)
        print(f'  sleeve_{sid:16s} → {result}')

# ページヘッダーロゴ: <img class="page-header-logo" src="data:image/...">
LOGO_NAMES = ['logo_cards', 'logo_collection', 'logo_deck']
logo_idx = 0
for m in re.finditer(r'page-header-logo[^>]+src="(data:image/[^"]+)"', content):
    name = LOGO_NAMES[logo_idx] if logo_idx < len(LOGO_NAMES) else f'logo_{logo_idx+1}'
    result = save_image(name, m.group(1))
    if result:
        saved.append(result)
        print(f'  {name:20s} → {result}')
    logo_idx += 1

print(f'\n合計 {len(saved)} 枚を {OUTPUT_DIR}/ に保存しました')
