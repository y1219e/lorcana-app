#!/usr/bin/env python3
"""
index_v2.html のbase64アイコンをR2 URLに置き換えるスクリプト
"""
import re

with open('/home/user/lorcana-app/index_v2.html', 'r', encoding='utf-8') as f:
    content = f.read()

R2 = 'https://pub-1ffff5ba3a074d538aa9f3027d3c97dc.r2.dev/icons/'

# 全セット合計バナーのbase64を先に抽出（そのまま残す）
m = re.search(r'"全セット合計":\s*"(data:image/[^"]+)"', content)
banner_all_b64 = m.group(1) if m else ''

# ── INK_IMG ──────────────────────────────────────────────
new_ink_img = f"""const INK_IMG = {{
  'アンバー':   "{R2}ico_single_amber.svg",
  'アメジスト': "{R2}ico_single_amethyst.svg",
  'エメラルド': "{R2}ico_single_emerald.svg",
  'ルビー':     "{R2}ico_single_ruby.svg",
  'サファイア': "{R2}ico_single_sapphire.svg",
  'スティール': "{R2}ico_single_steel.svg",
}};"""

# ── DUAL_INK_IMG（3つ追加）────────────────────────────────
new_dual_ink_img = f"""const DUAL_INK_IMG = {{
  'アメジスト_アンバー':   "{R2}ico_dual_amber_amethyst.svg",
  'アンバー_エメラルド':   "{R2}ico_dual_amber_emerald.svg",
  'アンバー_ルビー':       "{R2}ico_dual_amber_ruby.svg",
  'アンバー_スティール':   "{R2}ico_dual_amber_steel.svg",
  'アメジスト_エメラルド': "{R2}ico_dual_amethyst_emerald.svg",
  'アメジスト_ルビー':     "{R2}ico_dual_amethyst_ruby.svg",
  'アメジスト_サファイア': "{R2}ico_dual_amethyst_sapphire.svg",
  'エメラルド_ルビー':     "{R2}ico_dual_emerald_ruby.svg",
  'エメラルド_サファイア': "{R2}ico_dual_emerald_sapphire.svg",
  'エメラルド_スティール': "{R2}ico_dual_emerald_steel.svg",
  'スティール_ルビー':     "{R2}ico_dual_ruby_steel.svg",
  'サファイア_スティール': "{R2}ico_dual_sapphire_steel.svg",
  'アンバー_サファイア':   "{R2}ico_dual_amber_sapphire.svg",
  'アメジスト_スティール': "{R2}ico_dual_amethyst_steel.svg",
  'サファイア_ルビー':     "{R2}ico_dual_ruby_sapphire.svg",
}};"""

# ── RARITY_IMG ───────────────────────────────────────────
new_rarity_img = f"""const RARITY_IMG = {{
  'コモン':           "{R2}ico_rarity_common.svg",
  'アンコモン':       "{R2}ico_rarity_uncommon.svg",
  'レア':             "{R2}ico_rarity_rare.svg",
  'スーパーレア':     "{R2}ico_rarity_super_rare.svg",
  'レジェンダリー':   "{R2}ico_rarity_legendary.svg",
  'エンチャンテッド': "{R2}ico_rarity_enchanted.svg",
  'エピック':         "{R2}ico_rarity_epic.svg",
  'アイコニック':     "{R2}ico_rarity_iconic.svg",
}};"""

# ── BANNER_IMG（第10〜12弾追加）──────────────────────────
new_banner_img = f"""const BANNER_IMG = {{
  "第1弾":      "{R2}bnr_01st_the-first-chapter.webp",
  "第2弾":      "{R2}bnr_02nd_rise-of-the-floodborn.webp",
  "第3弾":      "{R2}bnr_03rd_into-the-inklands.webp",
  "第4弾":      "{R2}bnr_04th_ursula's-return.webp",
  "第5弾":      "{R2}bnr_05th_shimmering-skies.webp",
  "第6弾":      "{R2}bnr_06th_azurite-sea.webp",
  "第7弾":      "{R2}bnr_07th_archazias-island.webp",
  "第8弾":      "{R2}bnr_08th_reign-of-jafar.webp",
  "第9弾":      "{R2}bnr_09th_fabled.webp",
  "第10弾":     "{R2}bnr_10th_whispers-in-the-well.webp",
  "第11弾":     "{R2}bnr_11th_winterspell.webp",
  "第12弾":     "{R2}bnr_12th_wilds-unknown.webp",
  "全セット合計": "{banner_all_b64}",
}};"""

# ── 置換 ─────────────────────────────────────────────────
replacements = [
    (r'const INK_IMG = \{.*?\};',      new_ink_img),
    (r'const DUAL_INK_IMG = \{.*?\};', new_dual_ink_img),
    (r'const RARITY_IMG = \{.*?\};',   new_rarity_img),
    (r'const BANNER_IMG = \{.*?\};',   new_banner_img),
]

for pattern, replacement in replacements:
    before = len(content)
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    after = len(content)
    name = pattern.split('=')[0].strip().replace('const ', '').replace(' \\', '')
    print(f'{name}: {before - after:+,} bytes')

with open('/home/user/lorcana-app/index_v2.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\n完了。ファイルサイズ: {len(content):,} bytes ({len(content)//1024} KB)')
