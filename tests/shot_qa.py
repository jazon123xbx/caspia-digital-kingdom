from pathlib import Path
from playwright.sync_api import sync_playwright
import json
src=Path('/mnt/data/Caspia_V13_1_Playable.html').read_text().replace("new URLSearchParams(location.search).get('test')==='1'","true")
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1500,'height':900})
 page.set_content(src,wait_until='domcontentloaded')
 for side in ('left','right'):
  page.evaluate('window.__CASPIA_TEST__.startLevel(3)')
  x=page.evaluate('(side)=>{const c=document.getElementById("gameCanvas"),r=c.getBoundingClientRect();const x=side==="left"?r.left+4:r.right-4;const y=r.bottom-80;c.dispatchEvent(new PointerEvent("pointermove",{pointerType:"mouse",clientX:x,clientY:y,bubbles:true}));return {x,y};}',side)
  predicted=page.evaluate('window.__CASPIA_TEST__.aimPath(40,20)')
  print('AIM',side,'first/last',predicted[0]['x'],predicted[-1]['x'],'bounces',sum(pt.get('bounceCount',0) for pt in predicted))
  before=page.evaluate('window.__CASPIA_TEST__.snapshot()')
  page.evaluate('window.__CASPIA_TEST__.launch()')
  samples=[]
  for i in range(65):
   page.wait_for_timeout(50)
   s=page.evaluate('window.__CASPIA_TEST__.snapshot()')
   if s['shot'] is not None: samples.append(s['shot']['x'])
   elif s['attachmentDiagnostics']['last']:break
  after=page.evaluate('window.__CASPIA_TEST__.snapshot()')
  distinct=any((samples[i+1]-samples[i])*(samples[i]-samples[i-1])<0 for i in range(1,len(samples)-1))
  print('SHOT',side,'samples',len(samples),'reversed',distinct,'attachment',after['attachmentDiagnostics'],'gridDelta',after['gridCount']-before['gridCount'],'defeat',after['defeatDiagnostics'])
  assert distinct, f'{side} shot did not reflect off wall'
  assert after['attachmentDiagnostics']['last'] and after['attachmentDiagnostics']['last']['kind']=='attach',f'{side} shot failed to attach at a local grid cell'
  assert after['defeatDiagnostics']['reason'] is None
 print('PASS: both reflected shots attached locally without teleportation')
 b.close()
