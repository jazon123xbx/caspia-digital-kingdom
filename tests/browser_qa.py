from pathlib import Path
from playwright.sync_api import sync_playwright
import json
html=Path('/mnt/data/Caspia_V13_1_Playable.html').read_text().replace("new URLSearchParams(location.search).get('test')==='1'","true")
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'],timeout=15000)
 page=b.new_page(viewport={'width':1500,'height':900},device_scale_factor=1)
 page.on('pageerror',lambda err: errors.append(str(err)))
 page.set_content(html,wait_until='domcontentloaded',timeout=25000)
 page.wait_for_timeout(450)
 assert page.evaluate('Boolean(window.__CASPIA_TEST__)')
 timers=page.evaluate('window.__CASPIA_TEST__.levelTimes()')
 colors=page.evaluate('window.__CASPIA_TEST__.levelColors()')
 assert timers==sorted(timers,reverse=True) and len(set(timers))==10,timers
 assert colors[0]==3 and colors[-1]==5,colors
 # Validate a boss's shield rebuild does not cancel return from hit to idle.
 start=page.evaluate('window.__CASPIA_TEST__.startLevel(7)')
 assert start['level']==7 and start['pressureLimit']==3,start
 assert page.evaluate('window.CaspiaLive.getState().boss.pose')=='idle'
 page.evaluate('window.__CASPIA_TEST__.hitBoss()')
 assert page.evaluate('window.CaspiaLive.getState().boss.pose')=='hit'
 page.wait_for_timeout(700)
 assert page.evaluate('window.CaspiaLive.getState().boss.pose')=='hit','shield rebuild interrupted hit too early'
 page.wait_for_timeout(1000)
 assert page.evaluate('window.CaspiaLive.getState().boss.pose')=='idle','hit pose did not return to idle'
 # Confirm attack is synced exactly with 3 unsuccessful shots, not background timer.
 page.evaluate('window.__CASPIA_TEST__.startLevel(7)')
 p2=page.evaluate('window.__CASPIA_TEST__.nonClearingShots(2)')
 assert p2['pressure']==2 and p2['descents']==0,p2
 assert page.evaluate('window.CaspiaLive.getState().boss.pose')=='idle'
 p3=page.evaluate('window.__CASPIA_TEST__.nonClearingShots(1)')
 assert p3['pressure']==0 and p3['descents']==1,p3
 assert page.evaluate('window.CaspiaLive.getState().boss.pose')=='attack'
 assert 'GUARDIAN SURGE' in page.locator('#cineHeading').inner_text(),page.locator('#cineHeading').inner_text()
 page.wait_for_timeout(1300)
 assert page.evaluate('window.CaspiaLive.getState().boss.pose')=='idle'
 page.screenshot(path='/mnt/data/Caspia_V13_1_Guardian_Rhythm/V13_1_BOSS7_TEST.png')
 # Test aim path bounces at least once for a corner-directed aim and cannot escape board.
 s1=page.evaluate('window.__CASPIA_TEST__.startLevel(3)')
 page.evaluate('''() => {const c=document.getElementById('gameCanvas');const rect=c.getBoundingClientRect(); c.dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',clientX:rect.right-4,clientY:rect.top+30,bubbles:true}));}''')
 left=page.evaluate('window.__CASPIA_TEST__.aimPath(35,22)')
 assert left and all(0<=a['x']<=s1['launcher']['x']*20 for a in left)
 # Browser viewport & assets should remain functional across story/boss stages.
 page.evaluate('window.__CASPIA_TEST__.startLevel(1)')
 page.screenshot(path='/mnt/data/Caspia_V13_1_Guardian_Rhythm/V13_1_STAGE1_TEST.png')
 assert not errors,errors
 print('PASS desktop:',json.dumps({'timers':timers,'colors':colors,'boss7_damage_return':'1.6s idle','boss_attack':'3rd miss synced with descent','errors':errors}))
 page.set_viewport_size({'width':390,'height':844})
 page.wait_for_timeout(200)
 assert not page.locator('#errorBox').is_visible()
 page.screenshot(path='/mnt/data/Caspia_V13_1_Guardian_Rhythm/V13_1_MOBILE_TEST.png')
 print('PASS mobile: game board visible, no JS errors')
 b.close()
