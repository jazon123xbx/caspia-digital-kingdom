/* Caspia V13 — DOM character direction and boss presentation, not a physics engine.
   All shooting, collision, HP, progress and level rules remain in game.js. */
(function(root){'use strict';
 const FX=root.CaspiaCharacterFX;
 const BOS=root.CaspiaBosses;
 const board=document.getElementById('board');
 const anchor=document.getElementById('v13SnapAnchor');
 const bossAnchor=document.getElementById('v13BossAnchor');
 const prisonAnchor=document.getElementById('v13PrisonAnchor');
 let director=null, bossVisual=null, bossType='', facing='right';
 let currentMood='idle', lastBark=0, lastAim=NaN, lastBossPulse=0, moodResetTimer=0, snapScale=null;
 const mobileLine=document.getElementById('v13MobileLine');
 const mobileFace=document.getElementById('v13MobileFace');
 function assetURL(path){return (root.CASPIA_EMBEDDED_ASSETS&&root.CASPIA_EMBEDDED_ASSETS[path])||path;}
 function clearMoodReset(){ if(moodResetTimer){ clearTimeout(moodResetTimer); moodResetTimer=0; } }
 function resetToIdle(line){
   if(!director)return;
   clearMoodReset();
   currentMood='idle';
   director.setCaspia('idle', line||'Keep going, Snap!');
   if(!bossType) director.setPrison('sealed');
   if(mobileLine)mobileLine.textContent=line||'Keep going, Snap!';
   if(mobileFace)mobileFace.src=assetURL('assets/characters/caspia-idle.webp');
 }
 function scheduleMoodReset(delay=1850,line){
   clearMoodReset();
   moodResetTimer=setTimeout(()=>{ moodResetTimer=0; if(currentMood==='victory'||currentMood==='defeat'||currentMood==='danger'||board.classList.contains('reef-critical')) return; resetToIdle(line); }, delay);
 }
 const encouragement={match:['Beautiful shot! The enchanted pearls are clearing!','That was wonderful, Snap!','Another pearl spell is broken!','You are getting closer!'],combo:['Amazing! Keep that momentum!','The kingdom is cheering for you!','What a brilliant combo!','You did it again, Snap!']};let barkSequence=0;const moodText={
   'level-start':'Snap, can you hear me? I believe in you!',
   match:'Beautiful shot! The enchanted pearls are clearing!',
   combo:'You are amazing, Snap! Keep going!',
   danger:'Snap! The reef is coming closer! Please hurry!',
   'boss-attack':'Watch out! The guardian is gathering its magic!',
   'boss-hit':'Yes! Its armor is weakening!',
   'boss-shield':'The guardian is shielded again. You can do this!',
   'shield-break':'The shield is gone! Now, Snap!',
   defeat:'Please do not give up on me…',
   victory:'We did it! The kingdom is safe!',
   miss:'Almost! Try another angle.'
 };
 function make(){
   if(!FX||!BOS||!board||!anchor||!bossAnchor) {console.warn('Caspia V13 visual modules unavailable');return false;}
   try{
     director=new FX.Director({portrait:document.getElementById('v13CaspiaPortrait'),prison:document.getElementById('v13Prison'),snap:document.getElementById('v13Snap'),effects:document.getElementById('v13Effects'),assetBase:'assets/characters/'});
     bossVisual=BOS.create({mount:bossAnchor,type:'jelly',assetBase:'assets/bosses/',showWeakspot:false});
     bossAnchor.hidden=true;
     document.documentElement.classList.add('v13-ready');
     return true;
   }catch(e){console.error('Caspia visual initialization',e);return false;}
 }
 function bark(kind,force=false){
   if(!director)return;
   const now=performance.now();
   if(!force && now-lastBark<2800)return;
   lastBark=now;
   if(encouragement[kind])moodText[kind]=encouragement[kind][(barkSequence++)%encouragement[kind].length];
   clearMoodReset();
   if(kind==='shield-break'){director.setCaspia('hopeful',moodText[kind]);director.setPrison('cracking');scheduleMoodReset(1700,'Aim for the weak point, Snap!');}
   else if(kind==='boss-shield'){director.setCaspia('worried',moodText[kind]);scheduleMoodReset(1800,'The guardian is watching. Stay focused, Snap!');}
   else {
     director.trigger(kind, {line:moodText[kind]||undefined});
     if(kind==='match'||kind==='combo'||kind==='boss-hit'||kind==='miss') scheduleMoodReset(kind==='boss-hit'?1900:1650, 'Keep going, Snap!');
     if(kind==='boss-attack')scheduleMoodReset(2150,'Stay focused, Snap!');
   }
   currentMood=kind;
   if(mobileLine)mobileLine.textContent=moodText[kind]||'Keep going, Snap!';
   if(mobileFace)mobileFace.src=assetURL('assets/characters/'+(kind==='victory'?'caspia-victory.webp':kind==='danger'||kind==='boss-attack'?'caspia-scared.webp':kind==='defeat'?'caspia-worried.webp':kind==='miss'||kind==='boss-shield'?'caspia-worried.webp':'caspia-hopeful.webp'));
 }
 function stage(data){
   if(!director)return;
   const cfg=data||{};
   lastBark=0;
   clearMoodReset();
   director.setAmmo(cfg.loaded||'cyan',cfg.next||'pink');
   director.setPrison('sealed');
   director.setSnap('idle');
   director.setCaspia(cfg.boss?'worried':'idle',cfg.boss?'Snap, the guardian is waiting! Be careful!':moodText['level-start']);
   currentMood='level-start';
   if(mobileLine)mobileLine.textContent=cfg.boss?'A guardian is here, Snap. Please be careful!':moodText['level-start'];
   if(mobileFace)mobileFace.src=assetURL('assets/characters/'+(cfg.boss?'caspia-worried.webp':'caspia-idle.webp'));
   if(cfg.boss&&BOS.BOSSES[cfg.boss]){
     bossType=cfg.boss;
     bossVisual.setBoss(bossType,{hp:cfg.hp||3,maxHp:cfg.maxHp||cfg.hp||3,exposed:false});
     bossAnchor.hidden=false;
     board.dataset.v13boss=bossType;
   }else{bossType='';bossAnchor.hidden=true;delete board.dataset.v13boss;}
   prisonAnchor.classList.remove('is-freed');
   board.classList.remove('v13-rescue-won','v13-under-attack');
   setTimeout(()=>place(),40);
 }
 function place(data){
   if(!director||!board)return;
   const s=data||root.__CASPIA_V13_PLACEMENT__;
   if(!s)return;
   // One engine muzzle. The visible pearl is drawn by game.js, not the hidden CSS pearl.
   // Cache scaling on start/resize; use math rather than DOM reads per pointer move.
   if(snapScale===null){const token=getComputedStyle(anchor).getPropertyValue('--v13-snap-scale').trim();snapScale=Number(token)||.69}
   const left=director.state.facing==='left';
   const localX=left?57.8:162.4; // mirrored left-facing vs right-facing claw center
   const localY=left?99.6:104.8;
   const muzzle=s.muzzle;
   const scale=snapScale;
   anchor.style.transform=`translate3d(${(muzzle.x-localX*scale).toFixed(2)}px,${(muzzle.y-localY*scale).toFixed(2)}px,0) scale(${scale})`;
   if(s.bossBody && !bossAnchor.hidden)motion(s.bossBody);
 }
 function motion(p){
   if(!p||!bossType||bossAnchor.hidden)return;
   // Artwork and collision use exactly the same body coordinates from game.js.
   // CSS compositor transform avoids left/top layout work on every frame.
   const x=Number(p.bodyX),y=Number(p.bodyY);
   if(!Number.isFinite(x)||!Number.isFinite(y))return;
   bossAnchor.style.left='0px';bossAnchor.style.top='0px';
   bossAnchor.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%)`;
 }
 function aim(degrees,data){
   if(!director)return;
   const deg=Math.max(-72,Math.min(72,Number(degrees)||0));
   if(facing==='right'&&deg<-8)facing='left';
   if(facing==='left'&&deg>8)facing='right';
   const shown=facing==='left'?Math.min(-8,deg):Math.max(0,deg);
   if(Math.abs(lastAim-deg)>.75 || lastAim!==lastAim){director.setAim(shown);lastAim=deg}
   if(data){root.__CASPIA_V13_PLACEMENT__=data;place(data)}
 }
 function ammo(current,next){if(director)director.setAmmo(current,next)}
 function shot(){if(!director)return;director.playFire();}
 function matched(streak){if(!director)return;bark(streak>=2?'combo':'match');}
 function danger(){if(!director)return;director.setPrison('danger');bark('danger');}
 function critical(active){
   if(!director)return;
   if(active){
     clearMoodReset();
     director.setPrison('danger');
     director.setSnap('worried');
     director.setCaspia('scared','Snap! Just one descent left. Please clear the reef!');
     currentMood='danger';lastBark=performance.now();
     if(mobileLine)mobileLine.textContent='DANGER! One descent from defeat!';
     if(mobileFace)mobileFace.src=assetURL('assets/characters/caspia-scared.webp');
   }else{
     director.setSnap('aim');
     director.setPrison(bossType&&bossVisual&&bossVisual.getState().exposed?'cracking':'sealed');
     director.setCaspia('hopeful','That was close! Keep going, Snap!');
     currentMood='match';
     if(mobileLine)mobileLine.textContent='That was close! Keep going, Snap!';
     if(mobileFace)mobileFace.src=assetURL('assets/characters/caspia-hopeful.webp');
     scheduleMoodReset(1700,'Keep going, Snap!');
   }
 }

 function shieldBreak(){if(!director)return;bossVisual.trigger('break');bark('shield-break',true);}
 function bossHit(hp,maxHp){if(!bossVisual)return;bossVisual.update({hp,maxHp,exposed:false});bossVisual.trigger(hp<=0?'defeat':'hit');if(hp<=0){if(director)director.setCaspia('hopeful','The guardian is defeated! We are closer to the palace!');}else bark('boss-hit',true);}
 function bossShield(hp,maxHp){if(!bossVisual)return;bossVisual.update({hp,maxHp,exposed:false});bossVisual.trigger('shield');bark('boss-shield');}
 function bossAttack(){if(!bossVisual)return;bossVisual.trigger('attack');board.classList.add('v13-under-attack');setTimeout(()=>board.classList.remove('v13-under-attack'),1000);bark('boss-attack',true);}
 function win(isFinal){if(!director)return;clearMoodReset();if(isFinal){director.trigger('victory');currentMood='victory';board.classList.add('v13-rescue-won');prisonAnchor.classList.add('is-freed');if(mobileLine)mobileLine.textContent=moodText.victory;if(mobileFace)mobileFace.src=assetURL('assets/characters/caspia-victory.webp');}else{director.setCaspia('hopeful','We are getting closer! Thank you, Snap!');currentMood='match';scheduleMoodReset(1800,'Keep going, Snap!');director.setSnap('win');if(mobileLine)mobileLine.textContent='We are getting closer! Thank you, Snap!';}if(bossType){bossVisual.trigger('defeat');}}
 function lose(){if(!director)return;clearMoodReset();currentMood='defeat';director.trigger('defeat');}
 function resize(){snapScale=null;place();}
 function getState(){return {character:director&&director.getState(),boss:bossVisual&&bossVisual.getState(),bossType};}
 const ok=make();
 root.CaspiaLive=Object.freeze({ok,stage,aim,ammo,shot,matched,danger,shieldBreak,bossHit,bossShield,bossAttack,win,lose,resize,motion,bark,critical,getState,place});
})(window);
