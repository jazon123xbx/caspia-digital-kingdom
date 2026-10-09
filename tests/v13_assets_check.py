from pathlib import Path
import re
from PIL import Image
base=Path(__file__).resolve().parents[1]
html=(base/'game.html').read_text()
expected=['js/physics.js','js/caspia-character-fx.js','js/caspia-bosses.js','js/v13-live.js','js/game.js']
assert all(html.count('src="'+p+'"')==1 for p in expected), 'missing JS dependencies'
assert [html.index('src="'+p+'"') for p in expected]==sorted(html.index('src="'+p+'"') for p in expected), 'JS ordering'
for p in expected+['css/game.css','css/caspia-character-fx.css','css/caspia-bosses.css','css/v13-live.css','assets/caspia.webp']:
 assert (base/p).is_file(),p
assert (base/'index.html').exists() and (base/'kingdom.html').exists()
for k in ['jelly','crab','core']:
 for state in ['idle','attack','hit','defeat']:
  p=base/f'assets/bosses/{k}-{state}.webp';assert p.is_file(),p
for name in ['caspia-idle','caspia-hopeful','caspia-worried','caspia-scared','caspia-trapped','caspia-victory','snap-idle','snap-aim','snap-charge','snap-fire','snap-recoil','snap-win']:
 assert (base/f'assets/characters/{name}.webp').is_file(),name
assert (base/'assets/bosses/caspia-rescue.webp').exists()
assert (base/'assets/bosses/caspia-prison.webp').exists()
for p in list((base/'assets/bosses').glob('*.webp'))+list((base/'assets/characters').glob('*.webp')):
 with Image.open(p) as img:
  assert img.width>0 and img.height>0,p
  img.verify()
js=(base/'js/game.js').read_text()
for text in ['CaspiaLive','bossTargetDraw','live.bossHit','live.bossShield','live.shieldBreak','live.matched','live.win','advanceReflectedX','simulateReflectedPath']:
 assert text in js,text
assert 'window.__CASPIA_TEST__=' in js
for id in ['v13CaspiaPortrait','v13Prison','v13Snap','v13BossAnchor','v13Effects','v13MobileDialogue']:
 assert f'id="{id}"' in html,id
stand=(base/'game-standalone.html').read_text()
assert 'CASPIA_CHARACTER_EMBEDDED_ASSETS' in stand
assert 'CASPIA_BOSS_EMBEDDED_ASSETS' in stand
assert 'src="js/' not in stand
assert 'href="css/' not in stand
print('V13 asset and dependency audit: PASS — 3 boss types, 12 boss expressions, character art and all UI mounts')
