(()=>{'use strict';
const $=id=>document.getElementById(id);
 const els={board:$('board'),canvas:$('gameCanvas'),overlay:$('overlay'),title:$('modalTitle'),modalText:$('modalText'),eyebrow:$('modalEyebrow'),actions:$('modalActions'),illustration:$('modalIllustration'),ready:$('readyPreview'),next:$('nextPreview'),score:$('score'),time:$('time'),level:$('levelLabel'),combo:$('comboValue'),progress:$('progressText'),mission:$('missionText'),pressure:$('pressureText'),bar:$('timebar'),boss:$('bossInfo'),bossName:$('bossName'),bossStatus:$('bossStatus'),hp:$('hpFill'),snap:$('snapWrap'),toast:$('comboToast'),comboTitle:$('comboTitle'),comboDesc:$('comboDesc'),tip:$('tutorialTip'),hint:$('hintLine'),error:$('errorBox')};
 const physics=window.CaspiaPhysics;
 const live=window.CaspiaLive;
 if(!physics){const message='Game physics failed to load. Please reload this page with js/physics.js available.';els.error.hidden=false;$('errorMessage').textContent=message;throw new Error(message)}
const ctx=els.canvas.getContext('2d');
const COLORS=['#ff73b6','#52cdf7','#a98aff','#58dfb6','#ffc267'];
const LEVELS=[
{name:"Snap's First Mission",time:180,colors:3,rows:['001122011','001122200'],objective:'Match 3 pearls of the same color'},
{name:'Coral Reef Passage',time:174,colors:3,rows:['001122011','001122200','0.1.22.10'],objective:'Use Swap to plan your shots'},
{name:'The Pearl Maze',time:168,colors:4,rows:['001223301','011223300','..12.30..'],objective:'Bounce a pearl off a wall to reach hidden targets'},
{name:'Jellyfish Guardian',time:162,colors:4,boss:'jelly',hp:3,objective:'Break its shield, then hit the glowing weak point'},
{name:'Whispering Reef',time:156,colors:4,rows:['001233120','002331120','..12.30..','...1.2...'],objective:'Clear supporting pearls to drop the cluster'},
{name:'Sunken Gate',time:150,colors:4,rows:['001233210','002331120','02.31.12.','....33...'],seals:[[1,1],[1,6]],objective:'Release the two enchanted seals'},
{name:'Armored Crab Guardian',time:144,colors:4,boss:'crab',hp:4,objective:'Break its armor, then track the moving weak point'},
{name:'Crystal Passage',time:138,colors:5,rows:['001244330','012344120','4.1.2.3.0','..14.32..'],objective:'Clear the crystal-covered passage'},
{name:'Palace Entrance',time:132,colors:5,rows:['001244330','012344120','..124430.','...1132..'],seals:[[0,2],[0,5],[1,7]],objective:'Destroy the three palace locks'},
{name:'The Final Enchantment',time:126,colors:5,boss:'core',hp:5,objective:'Track the five moving weak points to rescue Caspia'}];
let C=9;const PI=Math.PI,SAVE='caspia-save-princess-v12-1',GUIDE='caspia-save-princess-guide-v12';
const DEFAULT={unlocked:1,stars:{},completed:false};
 const PRAISE_VARIANTS=['GREAT!','AMAZING!','AWESOME!','FANTASTIC!','BRILLIANT!','INCREDIBLE!'];
 let praiseSequence=0,reefCritical=false,guideShownThisPage=false;
 let progress=readSave(),state={mode:'story',level:1,quickStage:0,started:false,playing:false,paused:true,modal:true,grid:[],r:17,sx:34,sy:30,rows:12,w:360,h:480,offset:16,baseOffset:16,descents:0,pressure:0,ready:0,next:1,shot:null,aim:{x:180,y:0},score:0,shots:0,streak:0,seconds:150,total:150,particles:[],floats:[],boss:null,seals:[],tutorial:'',comboUntil:0,shake:0,attachment:null,defeat:null};
let dpr=1,last=0,raf=0,pointerDown=false,soundEnabled=true,currentDialog=null;const audioEngine=window.CaspiaAudio;let lastAmmoSignature='',cachedMuzzle=null,renderCount=0;try{soundEnabled=audioEngine?audioEngine.getSettings().enabled:true}catch{}
function readSave(){try{const s=JSON.parse(localStorage.getItem(SAVE)||'null');return s&&typeof s==='object'?{...DEFAULT,...s,stars:s.stars||{}}:{...DEFAULT}}catch{return {...DEFAULT}}}
function store(){try{localStorage.setItem(SAVE,JSON.stringify(progress))}catch{}}
function setHint(text){els.hint.textContent=text}
let lastQuestState='', gridRevision=0, occupiedRevision=-1, occupiedCache=[];function markGridDirty(){gridRevision++}function occupiedCells(){if(occupiedRevision!==gridRevision){occupiedCache=[];for(let row=0;row<state.rows;row++)for(let col=0;col<C;col++)if(state.grid[row]&&state.grid[row][col]!==null)occupiedCache.push({row,col,...loc(row,col)});occupiedRevision=gridRevision}return occupiedCache}
function syncDesktopQuest(){
 const current=state.mode==='story'?state.level:0,completed=progress.unlocked;
 const tag=current+'|'+completed+'|'+state.mode;
 if(tag===lastQuestState)return;lastQuestState=tag;
 document.querySelectorAll('.quest-step').forEach(el=>{
  const n=Number(el.dataset.stage);
  el.classList.toggle('current',n===current);
  el.classList.toggle('done',n<completed&&n!==current);
 });
}

function setTip(text){els.tip.textContent=text;els.tip.hidden=!text}

const cine={box:$('cineBanner'),kicker:$('cineKicker'),heading:$('cineHeading'),caption:$('cineCaption'),flash:$('hitFlash')};
let cineTimer=0,chapterPending=false;
function sceneCaption(title,caption='',kicker='ROYAL RESCUE'){
 if(!state.started||state.modal||document.hidden)return;
 cine.heading.textContent=title;cine.caption.textContent=caption;cine.kicker.textContent=kicker;cine.box.dataset.kind=kicker;
 cine.box.classList.remove('show');void cine.box.offsetWidth;cine.box.classList.add('show');
 clearTimeout(cineTimer);cineTimer=setTimeout(()=>cine.box.classList.remove('show'),kicker==='BOSS ATTACK'?1450:2080);
 if(soundEnabled&&kicker==='BOSS ENCOUNTER')sfx('stage');
}
function impact(kind='pop'){
 const cls=kind==='boss'?'boss-hit':'pop';cine.flash.classList.remove('pop','boss-hit');void cine.flash.offsetWidth;cine.flash.classList.add(cls);
 if(kind==='boss'){$('bossInfo').classList.remove('hit');void $('bossInfo').offsetWidth;$('bossInfo').classList.add('hit')}
 if(kind==='boss'&&navigator.vibrate)try{navigator.vibrate(35)}catch{}
}
function stampChapter(){const cfg=info();chapterPending=false;sceneCaption(cfg.boss?cfg.name:cfg.name,cfg.boss?'Clear the shields. Strike the glowing weak point!':cfg.objective,cfg.boss?'BOSS ENCOUNTER':'CHAPTER '+(state.mode==='quick'?state.quickStage+1:state.level));}

function sfx(kind){if(!soundEnabled||!audioEngine)return false;return audioEngine.play(kind)}
function goHome(){if(window.CASPIA_STANDALONE){state.playing=false;state.paused=true;welcome();return}window.location.href='index.html'}
function rand(seed){let a=seed>>>0;return()=>{a=(Math.imul(1664525,a)+1013904223)>>>0;return a/4294967296}}
function info(){return state.mode==='quick'?(state.quickStage===0?{name:'Quick Rescue: Clear the Reef',time:85,rows:['000111222','000111222'],colors:3,objective:'Clear the reef to reach Caspia'}:{name:'Quick Rescue: The Final Seal',time:105,boss:'core',hp:2,colors:3,objective:'Defeat the seal and save Caspia!'}):LEVELS[state.level-1]}
 function fit(){markGridDirty();const rect=els.board.getBoundingClientRect();if(rect.width<200||rect.height<200)throw new Error('Game board is not visible yet. Try Retry level.');state.w=Math.max(230,rect.width);state.h=Math.max(260,rect.height);dpr=Math.min(1.75,window.devicePixelRatio||1);els.canvas.width=Math.round(state.w*dpr);els.canvas.height=Math.round(state.h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);state.r=Math.min(18.5,(state.w-18)/(2*C+1));state.sx=state.r*2;state.sy=state.r*1.74;const fittedRows=Math.max(7,Math.min(15,Math.floor((state.h-111-state.r*2)/state.sy)+1));state.rows=state.started&&state.grid.length?state.grid.length:fittedRows;state.offset=state.baseOffset+state.descents*state.sy;state.aim.x=state.w/2;state.aim.y=state.h*.25;cachedMuzzle=null;syncClawAngle()}
function loc(row,col){return{x:state.w/2-(C-1)*state.r+col*state.sx+(row%2)*state.r,y:state.offset+state.r+row*state.sy}}
function key(row,col){return row+','+col}
function inGrid(row,col){return row>=0&&row<state.rows&&col>=0&&col<C}
function adj(row,col){const m=row%2?[[0,-1],[0,1],[-1,0],[-1,1],[1,0],[1,1]]:[[0,-1],[0,1],[-1,-1],[-1,0],[1,-1],[1,0]];return m.map(([a,b])=>[row+a,col+b]).filter(([a,b])=>inGrid(a,b))}
function newGrid(){return Array.from({length:state.rows},()=>Array(C).fill(null))}
function loadPattern(rows){markGridDirty();state.grid=newGrid();rows.slice(0,Math.min(rows.length,state.rows-2)).forEach((line,row)=>{const start=Math.max(0,Math.floor((C-line.length)/2));for(let col=0;col<Math.min(C,line.length);col++){const n=line[col];state.grid[row][start+col]=n==='.'?null:Math.max(0,Math.min(COLORS.length-1,Number(n)||0))}})}
function shieldPattern(){const phase=state.boss?state.boss.max-state.boss.hp:0;const available=info().colors;const palettes=Array.from({length:available},(_,i)=>i);const a=palettes[phase%available],b=palettes[(phase+1)%available],c=palettes[(phase+2)%available];let rows=['.........','.........'];const shift=phase%2;rows[0]='.'+String(a).repeat(2)+String(b).repeat(2)+String(c).repeat(2)+'..';rows[1]='..'+String(b).repeat(2)+String(c).repeat(2)+'...';if(shift)rows=rows.map(line=>line.slice(1)+'.');loadPattern(rows)}
function activeColors(){const n=new Set();for(const row of state.grid)for(const cell of row)if(cell!==null)n.add(cell);return [...n]}
function newBubble(){const colors=activeColors();if(!colors.length)return 0;return colors[Math.floor(Math.random()*colors.length)]}
function paintAmmo(){const signature=[state.ready,state.next,!!state.shot,!!state.boss?.exposed,state.playing,state.paused].join('|');if(signature===lastAmmoSignature)return;lastAmmoSignature=signature;if(live&&live.ok)live.ammo(['pink','cyan','violet','mint','gold'][state.ready]||'gold',['pink','cyan','violet','mint','gold'][state.next]||'gold');for(const [el,c] of [[els.ready,state.ready],[els.next,state.next]]){el.style.setProperty('--orb',c<0?'#f8e3ae':COLORS[c]||COLORS[0]);el.setAttribute('aria-label',c<0?'Pearl Strike':(['Pink','Blue','Purple','Green','Gold'][c]||'Pearl')+' pearl')}const pearl=state.boss&&state.boss.exposed;els.ready.parentElement.querySelector('b').textContent=pearl?'STRIKE READY':'READY';els.next.parentElement.querySelector('b').textContent=pearl?'NO SWAP':'NEXT';$('swapBtn').disabled=!!state.shot||!!pearl||!state.playing||state.paused}
  function pressureLimit(){return physics.pressureLimit({mode:state.mode,level:state.level,boss:!!state.boss})}
 function dangerY(){return physics.dangerLineY({neutralMuzzleY:neutralLauncher().y,radius:state.r,multiplier:2.15,minY:state.r*4})}
 function criticalReef(){return state.started&&countGrid()>0&&bottomAttachedEdge()<dangerY()&&bottomAttachedEdge()+state.sy>=dangerY()-.5}
 function updatePressureHud(){
   const left=Math.max(0,pressureLimit()-state.pressure),danger=countGrid()>0&&bottomAttachedEdge()>=dangerY(),critical=criticalReef();
   const warning=left<=1&&!critical&&!danger;
   const text=critical?`⚠ CRITICAL • DESCENT IN ${left} SHOT${left===1?'':'S'}`:`DESCENT IN ${left} SHOT${left===1?'':'S'}`;
   if(els.pressure){if(els.pressure.textContent!==text)els.pressure.textContent=text;els.pressure.classList.toggle('pressure-warning',warning);els.pressure.classList.toggle('pressure-danger',danger||critical)}
   els.board.classList.toggle('pressure-warning',warning);
   els.board.classList.toggle('pressure-danger',danger);
   els.board.classList.toggle('reef-critical',critical);
   const alert=$('reefAlert');if(alert){alert.hidden=!critical;alert.dataset.critical=String(critical);}
   if(reefCritical!==critical){
     reefCritical=critical;
     if(live&&live.ok&&!state.modal&&state.playing)live.critical(critical);
     if(critical&&state.playing&&!state.modal){sfx('danger');setHint('DANGER! One more reef descent will reach Snap. Clear matching pearls!');}
   }
 }

 function updateHud(){const t=info();els.level.textContent=state.mode==='quick'?`Q${state.quickStage+1} / 2`:`${state.level} / 10`;els.score.textContent=state.score.toLocaleString();const remaining=Math.ceil(Math.max(0,state.seconds));els.time.textContent=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');els.combo.textContent='×'+Math.max(1,Math.min(5,state.streak));els.mission.textContent=t.objective;els.progress.textContent=state.mode==='quick'?'QUICK RESCUE':`Rescue ${Math.round((state.level-1)*100/10)}%`;els.bar.style.width=Math.max(0,100*state.seconds/state.total)+'%';document.querySelector('.timer-track').classList.toggle('danger',state.seconds<16);els.boss.hidden=!state.boss;if(state.boss){const b=state.boss;els.bossName.textContent=b.name;els.hp.style.width=(b.hp/b.max*100)+'%';els.bossStatus.textContent=b.exposed?'PEARL STRIKE! Aim for the glowing target':`Shielded • ${countGrid()} pearls remain`}
   updatePressureHud();els.board.classList.toggle('boss-board',!!state.boss);syncDesktopQuest();paintAmmo()}
function countGrid(){let n=0;for(const row of state.grid)for(const c of row)if(c!==null)n++;return n}
function showError(e){state.paused=true;els.error.hidden=false;$('errorMessage').textContent=String(e&&e.message||e);console.error(e)}
 function initialize(mode='story',level=1,quickStage=0){try{state.mode=mode;state.level=Math.min(10,Math.max(1,level));state.quickStage=quickStage;state.boss=null;state.seals=[];const cfg=info(),pressureState=physics.resetPressureState();C=Math.max(9,Math.min(17,Math.floor((els.board.getBoundingClientRect().width-12)/37)));state.baseOffset=Math.max(state.h<350?59:76,Math.min(cfg.boss?134:119,state.h*(cfg.boss?.25:.21)));state.descents=pressureState.descents;state.pressure=pressureState.pressure;fit();state.offset=state.baseOffset;state.boss=cfg.boss?{type:cfg.boss,name:cfg.boss==='jelly'?'Jellyfish Guardian':cfg.boss==='crab'?'Armored Crab Guardian':'Enchanted Pearl Core',hp:cfg.hp,max:cfg.hp,exposed:false,pending:0,invulnerable:0,attackWarned:false}:null;
if(state.boss){shieldPattern()}else loadPattern(cfg.rows);
 state.seals=(cfg.seals||[]).map(([r,c])=>({row:r,col:c+Math.max(0,Math.floor((C-9)/2)),broken:false}));state.seconds=state.total=cfg.time;state.shot=null;state.score=0;state.shots=0;state.streak=0;state.motionTime=0;lastAmmoSignature='';state.particles=[];state.floats=[];state.comboUntil=0;state.attachment=null;state.defeat=null;reefCritical=false;els.board.classList.remove('reef-critical');$('reefAlert').hidden=true;els.toast.classList.remove('show');els.error.hidden=true;state.started=true;state.playing=true;state.paused=false;chapterPending=true;cine.box.classList.remove('show');state.ready=state.boss?newBubble():newBubble();state.next=newBubble();if(activeColors().length>1&&state.next===state.ready)state.next=activeColors().find(c=>c!==state.ready);els.rescuePreview=$('rescuePreview');els.rescuePreview.hidden=!(state.level>=9&&!state.boss&&state.mode==='story');setTip('');setHint('Drag to aim • Release to fire • Tap Swap to switch');if(live&&live.ok)live.stage({boss:state.boss?.type,hp:state.boss?.hp,maxHp:state.boss?.max,loaded:['pink','cyan','violet','mint','gold'][state.ready],next:['pink','cyan','violet','mint','gold'][state.next]});updateHud();syncClawAngle();render();return true}catch(e){showError(e);return false}}
function getSiblingsColor(row,col,onlySame){const color=state.grid[row][col];const seen=new Set([key(row,col)]),stack=[[row,col]],out=[];while(stack.length){const [r,c]=stack.pop();out.push([r,c]);for(const [nr,nc] of adj(r,c)){const k=key(nr,nc);if(!seen.has(k)&&state.grid[nr][nc]!==null&&(!onlySame||state.grid[nr][nc]===color)){seen.add(k);stack.push([nr,nc])}}}return out}
function detach(){const seen=new Set(),stack=[];for(let c=0;c<C;c++)if(state.grid[0][c]!==null){seen.add(key(0,c));stack.push([0,c])}while(stack.length){const [r,c]=stack.pop();for(const [nr,nc] of adj(r,c)){const k=key(nr,nc);if(!seen.has(k)&&state.grid[nr][nc]!==null){seen.add(k);stack.push([nr,nc])}}}let dropped=0;for(let row=0;row<state.rows;row++)for(let col=0;col<C;col++)if(state.grid[row][col]!==null&&!seen.has(key(row,col))){popCell(row,col);dropped++}return dropped}
function popCell(row,col){const color=state.grid[row][col];if(color===null)return;markGridDirty();const p=loc(row,col);particles(p.x,p.y,color,8);state.grid[row][col]=null;for(const seal of state.seals)if(seal.row===row&&seal.col===col&&!seal.broken){seal.broken=true;floating(p.x,p.y,'🔓', '#ffe6ae')}}
function particles(x,y,c,n=12){const r=rand(Math.floor(performance.now()*100+x+y));for(let i=0;i<n;i++){const angle=r()*PI*2,sp=40+r()*115;state.particles.push({x,y,vx:Math.cos(angle)*sp,vy:Math.sin(angle)*sp,life:.45+r()*.4,max:.85,size:2+r()*3,color:c})}if(state.particles.length>200)state.particles.splice(0,state.particles.length-200)}
function floating(x,y,text,color='#ffe18a'){state.floats.push({x,y,text,color,life:1.2})}
function applause(msg,desc){
 let kind='great';
 if(/LEGENDARY|INCREDIBLE/i.test(msg)||state.streak>=4)kind='incredible';
 else if(/DIRECT HIT|BRILLIANT/i.test(msg))kind='brilliant';
 else if(state.streak===3||/FANTASTIC/i.test(msg))kind='fantastic';
 else if(state.streak===2||/AMAZING/i.test(msg))kind=praiseSequence++%2?'awesome':'amazing';
 else {kind=['great','awesome','brilliant'][praiseSequence++%3];}
 const map={great:'GREAT!',amazing:'AMAZING!',awesome:'AWESOME!',fantastic:'FANTASTIC!',brilliant:'BRILLIANT!',incredible:'INCREDIBLE!'};
 els.comboTitle.textContent=map[kind];els.comboDesc.textContent=desc;
 const face=$('comboFace');if(face)face.src=(window.CASPIA_EMBEDDED_ASSETS&&window.CASPIA_EMBEDDED_ASSETS['assets/praise/caspia-'+kind+'.webp'])||'assets/praise/caspia-'+kind+'.webp';
 els.toast.classList.remove('show');void els.toast.offsetWidth;els.toast.classList.add('show');state.comboUntil=performance.now()+1550;
 els.snap.classList.remove('cheer');void els.snap.offsetWidth;els.snap.classList.add('cheer');if(live&&live.ok)live.matched(state.streak);sfx(state.streak>=2?'combo':'pop')
}
 const CLAW_MUZZLE={x:270,y:99},CLAW_ORIGIN={x:215,y:114};
 function clawAngle(){return physics.clawAimAngle({aimX:state.aim.x,boardWidth:state.w,maxAngle:18})}
 // This SVG-local point is shared by the DOM claw transform, loaded orb, aim path and shot spawn.
 function launcherAt(angleDeg){
 if(!cachedMuzzle){const board=els.board.getBoundingClientRect(),svg=els.snap&&els.snap.querySelector('svg');if(!svg||!board.width||!board.height)return{x:state.w/2,y:state.h-state.r*2.7};const r=svg.getBoundingClientRect(),scale=Math.min(r.width/300,r.height/196);cachedMuzzle={left:r.left+(r.width-300*scale)/2-board.left,top:r.top+(r.height-196*scale)/2-board.top,scale,x:state.w/board.width,y:state.h/board.height}}
 const local=physics.launcherLocalPoint({muzzle:CLAW_MUZZLE,origin:CLAW_ORIGIN,angleDeg});const a=cachedMuzzle;return{x:(a.left+local.x*a.scale)*a.x,y:(a.top+local.y*a.scale)*a.y}}

 function launcher(){return launcherAt(clawAngle())}
 function neutralLauncher(){return launcherAt(0)}
 function bottomAttachedEdge(){let bottom=-Infinity;for(let row=0;row<state.rows;row++)for(let col=0;col<C;col++)if(state.grid[row]&&state.grid[row][col]!==null)bottom=Math.max(bottom,loc(row,col).y+state.r);return bottom}
 function checkDanger(){if(state.playing&&countGrid()>0&&bottomAttachedEdge()>=dangerY()-.01){lose('danger-line');return true}return false}
 function pressureStep(){state.offset=state.baseOffset+state.descents*state.sy;markGridDirty();els.board.classList.remove('pressure-step');if(els.pressure)els.pressure.classList.remove('pressure-step');void els.board.offsetWidth;els.board.classList.add('pressure-step');if(els.pressure)els.pressure.classList.add('pressure-step');setTimeout(()=>{els.board.classList.remove('pressure-step');if(els.pressure)els.pressure.classList.remove('pressure-step')},520);const isBoss=!!state.boss;setHint(isBoss?'The guardian attacked! The pearl reef has descended.':'The current pushed the reef closer to Snap!');if(live&&live.ok){if(isBoss)live.bossAttack();else live.danger()}if(isBoss)sfx('boss-'+state.boss.type);if(isBoss)sceneCaption('GUARDIAN SURGE!','The boss pushed the pearls down!','BOSS ATTACK');sfx('danger');return checkDanger()}
 function recordShotResult(cleared){const next=physics.nextPressureState({pressure:state.pressure,descents:state.descents,cleared,limit:pressureLimit()});state.pressure=next.pressure;if(next.descended){state.descents=next.descents;return pressureStep()}if(state.boss&&!cleared&&state.pressure===pressureLimit()-1){sceneCaption('GUARDIAN CHARGING!','One more missed shot triggers its attack','BOSS WARNING')}return checkDanger()}
 function legalAttachmentSlots(){const slots=[];for(let row=0;row<state.rows;row++)for(let col=0;col<C;col++)if(state.grid[row][col]===null&&(row===0||adj(row,col).some(([r,c])=>state.grid[r][c]!==null)))slots.push({row,col,...loc(row,col)});return slots}
 function localAttachmentSlots(collided){if(!collided||!collided.length)return legalAttachmentSlots().filter(p=>p.row===0);return physics.attachmentCandidatesFromCollisions(collided,(row,col)=>adj(row,col).map(([r,c])=>({row:r,col:c})),(row,col)=>state.grid[row][col]===null,(row,col)=>loc(row,col))}
 function attachmentOutcome(b,collided){const slots=localAttachmentSlots(collided),legal=legalAttachmentSlots();const outcome=physics.classifyAttachment(slots,legal,b);if(outcome.kind!=='local-miss'||!collided||!collided.length)return outcome;const nearby=legal.filter(p=>Math.hypot(p.x-b.x,p.y-b.y)<=state.r*2.2);return nearby.length?physics.classifyAttachment(nearby,legal,b):outcome}
 function nearestAttach(b,collided){const outcome=attachmentOutcome(b,collided);return outcome.candidate}
 function land(b,collided){const outcome=attachmentOutcome(b,collided);state.attachment={kind:outcome.kind,impact:{x:Math.round(b.x),y:Math.round(b.y)},collisions:collided?collided.map(c=>({row:c.row,col:c.col,x:Math.round(c.x),y:Math.round(c.y)})):[],localSlots:localAttachmentSlots(collided).map(c=>({row:c.row,col:c.col,dist:Math.round(Math.hypot(c.x-b.x,c.y-b.y))})),legalSlots:legalAttachmentSlots().length,candidate:outcome.candidate&&{row:outcome.candidate.row,col:outcome.candidate.col}};state.shot=null;if(outcome.kind==='board-full'){lose('board-full');return}if(outcome.kind==='local-miss'){setHint('That impact had no safe local slot. Snap returned the bubble—aim again.');updateHud();return}const p=outcome.candidate;sfx('land');state.grid[p.row][p.col]=b.color;markGridDirty();const group=getSiblingsColor(p.row,p.col,true),cleared=group.length>=3;if(cleared){for(const [r,c] of group)popCell(r,c);const fallen=detach();if(fallen)sfx('fall');state.streak++;const points=(group.length*20+fallen*25)*Math.min(5,state.streak);state.score+=points;floating(b.x,b.y,'+'+points);impact('pop');applause(state.streak>=5?'LEGENDARY!':state.streak>=3?'FANTASTIC!':state.streak===2?'AMAZING!':'GREAT!',`${group.length+fallen} pearls cleared!`)}else state.streak=0;
state.shots++;if(!countGrid()){if(state.boss){state.boss.exposed=true;state.ready=-1;state.next=-1;if(live&&live.ok)live.shieldBreak();setHint('SHIELD BROKEN! Shoot the glowing weak point!');sceneCaption('PEARL STRIKE!','Aim for the glowing weak point','SHIELD BROKEN');sfx('shield')}else{finish(true);return}}
if(recordShotResult(cleared))return;
if(!state.boss||!state.boss.exposed){state.ready=activeColors().includes(state.next)?state.next:newBubble();state.next=newBubble()}
if(state.tutorial==='shoot'){state.tutorial='swap';setTip('GOOD! Now tap SWAP below to change the loaded pearl.');setHint('Try the Swap button to finish your training')}updateHud()}
function damageBoss(){const b=state.boss;if(!b||!b.exposed||b.invulnerable>0)return;state.shot=null;b.hp--;b.invulnerable=.45;if(live&&live.ok)live.bossHit(b.hp,b.max);state.shots++;state.streak++;state.score+=250*Math.max(1,state.streak);particles(weakPoint().x,weakPoint().y,4,35);floating(weakPoint().x,weakPoint().y,'-1 HP • +'+(250*Math.max(1,state.streak)),'#ffdf91');sfx('hit');impact('boss');state.shake=.24;applause(b.hp===0?'LEGENDARY!':'DIRECT HIT!','The guardian is weakening!');if(b.hp<=0){updateHud();finish(true);return}b.exposed=false;b.pending=.55;const palette=Array.from({length:info().colors},(_,i)=>i);const phase=b.max-b.hp;state.ready=palette[phase%palette.length];state.next=palette[(phase+1)%palette.length];setHint('The boss rebuilt its shield! Break it again.');updateHud()}
function launch(){if(!state.playing||state.paused||state.shot||state.modal||state.boss?.pending>0)return;cine.box.classList.remove('show');clearTimeout(cineTimer);const direction=shotDirection(),o=direction.o;state.shot={x:o.x,y:o.y,vx:direction.vx*610,vy:direction.vy*610,speed:610,color:state.ready,kind:state.boss&&state.boss.exposed?'pearl':'bubble',targetX:state.boss&&state.boss.exposed?weakPoint().x:null};els.snap.classList.remove('fire');void els.snap.offsetWidth;els.snap.classList.add('fire');if(live&&live.ok)live.shot();sfx('shoot');paintAmmo()}
function step(dt){if(!state.playing||state.paused||state.modal)return;state.seconds=Math.max(0,state.seconds-dt);if(state.seconds<=0){lose('timeout');return}state.motionTime=(state.motionTime||0)+dt;if(state.boss){if(state.boss.pending>0){state.boss.pending-=dt;if(state.boss.pending<=0){shieldPattern();if(live&&live.ok)live.bossShield(state.boss.hp,state.boss.max)}}state.boss.invulnerable=Math.max(0,state.boss.invulnerable-dt)}if(state.shot){const b=state.shot;const sub=Math.ceil(830*dt/Math.max(3,state.r*.3));for(let i=0;i<sub&&state.shot;i++){const t=dt/sub;const speed=Math.min(830,(b.speed||610)+240*t),ratio=speed/(b.speed||610);b.speed=speed;b.vx*=ratio;b.vy*=ratio;const reflected=physics.advanceReflectedX({x:b.x,vx:b.vx,dt:t,minX:state.r,maxX:state.w-state.r});b.x=reflected.x;b.vx=reflected.vx;b.y+=b.vy*t;if(reflected.bounceCount)sfxWall()
if(b.kind==='pearl'){const c=weakPoint();if(Math.hypot(b.x-c.x,b.y-c.y)<state.r*1.25+16){damageBoss();break}if(b.y<2){state.shot=null;state.shots++;setHint('Missed! Aim for the glowing boss core.');recordShotResult(false);break}}
 else{const collided=physics.collectOverlappingCells(occupiedCells(),b,state.r*1.85);if(collided.length){land(b,collided);break}if(b.y<=state.offset+state.r){land(b,null);break}}}}
for(const p of state.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=60*dt}state.particles=state.particles.filter(p=>p.life>0);for(const f of state.floats){f.life-=dt;f.y-=32*dt}state.floats=state.floats.filter(f=>f.life>0);state.shake=Math.max(0,state.shake-dt);if(state.comboUntil&&performance.now()>state.comboUntil){state.comboUntil=0;els.toast.classList.remove('show')}hudElapsed+=dt;if(hudElapsed>.12){hudElapsed=0;updateHud()}}
let hudElapsed=0;let wallTime=0;function sfxWall(){const t=performance.now();if(t-wallTime>180){wallTime=t;sfx('wall')}}
function bossPose(){const b=state.boss;const center=state.w/2,baseY=Math.min(166,Math.max(115,state.h*.36));if(!b)return{bodyX:center,bodyY:baseY,targetX:center,targetY:baseY};
 if(b.type==='crab'){const drift=(Math.floor((state.motionTime||0)*1000/3600)%2?1:-1)*Math.min(46,state.w*.12);const targetX=state.shot?.kind==='pearl'&&state.shot?.targetX!=null?state.shot.targetX:center+drift;return{bodyX:center,bodyY:baseY+6,targetX,targetY:baseY}}
 if(b.type==='core'){const now=(state.motionTime||0)*1000;const speed=b.hp<=b.max*.25?1.24:b.hp<=b.max*.5?1.13:1;const travel=Math.min(68,state.w*.17);const bodyX=center+Math.sin(now*speed/1180)*travel;const bodyY=baseY+Math.sin(now*speed/930)*10;const points=[{x:0,y:-18},{x:20,y:-6},{x:16,y:17},{x:-18,y:14},{x:-22,y:-4}];const segment=1120;const cycle=((now*speed)% (points.length*segment))/segment;const i=Math.floor(cycle)%points.length;const next=(i+1)%points.length;const t=cycle-i;const ease=t*t*(3-2*t);const px=points[i].x+(points[next].x-points[i].x)*ease;const py=points[i].y+(points[next].y-points[i].y)*ease;return{bodyX,bodyY,targetX:bodyX+px,targetY:bodyY+py}}
 return{bodyX:center,bodyY:baseY,targetX:center,targetY:baseY}}
function weakPoint(){const p=bossPose();return{x:p.targetX,y:p.targetY}}
const bubbleSprites=new Map();
function makeBubbleSprite(color){
 const cvs=document.createElement('canvas');cvs.width=cvs.height=128;
 const c=cvs.getContext('2d'),name=['pink','cyan','violet','mint','gold'][color]||'gold';
 if(window.CaspiaCharacterFX){window.CaspiaCharacterFX.drawPearl(c,64,64,54,name,{glow:true})}
 else{c.fillStyle=COLORS[color]||'#ffe7b0';c.beginPath();c.arc(64,64,54,0,PI*2);c.fill()}
 if(color===2){c.strokeStyle='#ffffff77';c.lineWidth=2;c.beginPath();c.arc(64,64,11,0,PI*2);c.stroke()}
 if(color===3){c.fillStyle='#ffffff77';c.beginPath();c.arc(64,64,4,0,PI*2);c.fill()}
 if(color===4||color<0){c.strokeStyle='#fff9d6ad';c.lineWidth=2;c.beginPath();c.moveTo(64,50);c.lineTo(77,64);c.lineTo(64,78);c.lineTo(51,64);c.closePath();c.stroke()}
 return cvs;
}
function orb(x,y,color,size=state.r){let sprite=bubbleSprites.get(color);if(!sprite){sprite=makeBubbleSprite(color);bubbleSprites.set(color,sprite)}ctx.drawImage(sprite,x-size*1.14,y-size*1.14,size*2.28,size*2.28)}
function bossTargetDraw(){
 if(!state.boss||!state.boss.exposed)return;
 const q=weakPoint();ctx.save();const shiftPhase=((state.motionTime||0)*1000*(state.boss.hp<=state.boss.max*.25?1.24:state.boss.hp<=state.boss.max*.5?1.13:1)/1120)%1;const anticipation=state.boss.type==='core'&&shiftPhase>.76;ctx.shadowColor=anticipation?'#ff85d5':'#fff1ae';ctx.shadowBlur=23;ctx.strokeStyle=anticipation?'#ffd0f4':'#fff4af';ctx.lineWidth=anticipation?5:4;
 ctx.beginPath();ctx.arc(q.x,q.y,16+Math.sin(performance.now()/140)*2,0,PI*2);ctx.stroke();ctx.fillStyle='#ffeab2';ctx.beginPath();ctx.arc(q.x,q.y,8,0,PI*2);ctx.fill();ctx.restore();
}

function bossDraw(){const b=state.boss;if(!b)return;const pose=bossPose(),c={x:pose.targetX,y:pose.targetY},x=pose.bodyX,y=pose.bodyY;ctx.save();ctx.translate(x,y);ctx.globalAlpha=b.pending>0?.5:1;
if(b.type==='jelly'){ctx.shadowColor='#da78fc';ctx.shadowBlur=22;ctx.fillStyle='#854dc4';ctx.strokeStyle='#f6b9ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-5,43,PI,0);ctx.quadraticCurveTo(46,36,0,35);ctx.quadraticCurveTo(-46,36,-43,-5);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#d7a7ff';for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*10,33);ctx.quadraticCurveTo(i*9-9,52,i*11,66);ctx.stroke()}ctx.fillStyle='#f8ebff';ctx.beginPath();ctx.arc(-13,5,5,0,PI*2);ctx.arc(13,5,5,0,PI*2);ctx.fill();ctx.fillStyle='#2a174d';ctx.beginPath();ctx.arc(-13,6,2,0,PI*2);ctx.arc(13,6,2,0,PI*2);ctx.fill()}
if(b.type==='crab'){ctx.fillStyle='#f97fa4';ctx.strokeStyle='#ffe1c7';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,12,42,30,0,0,PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#ff9abd';ctx.lineWidth=7;for(const dir of [-1,1]){ctx.beginPath();ctx.moveTo(dir*30,4);ctx.lineTo(dir*59,-12);ctx.lineTo(dir*69,1);ctx.stroke();ctx.fillStyle='#ffb1bc';ctx.beginPath();ctx.arc(dir*70,-6,16,0,PI*2);ctx.fill();ctx.strokeStyle='#ffca9a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(dir*48,25);ctx.lineTo(dir*60,37);ctx.moveTo(dir*42,35);ctx.lineTo(dir*55,46);ctx.stroke()}ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-14,4,7,0,PI*2);ctx.arc(14,4,7,0,PI*2);ctx.fill();ctx.fillStyle='#25314b';ctx.beginPath();ctx.arc(-14,4,3,0,PI*2);ctx.arc(14,4,3,0,PI*2);ctx.fill()}
if(b.type==='core'){ctx.rotate(performance.now()/1700);for(let i=0;i<8;i++){const a=PI*2*i/8;ctx.beginPath();ctx.moveTo(Math.cos(a)*35,Math.sin(a)*35);ctx.lineTo(Math.cos(a+.22)*58,Math.sin(a+.22)*58);ctx.lineTo(Math.cos(a+.44)*35,Math.sin(a+.44)*35);ctx.closePath();ctx.fillStyle=i%2?'#7c70e9':'#bd7cee';ctx.fill()}ctx.rotate(-performance.now()/1700);ctx.fillStyle='#7851ce';ctx.strokeStyle='#e6bafa';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,38,0,PI*2);ctx.fill();ctx.stroke()}
ctx.restore();if(b.exposed){const glow=(b.type==='crab'||b.type==='core')?weakPoint():{x,y};ctx.save();ctx.shadowColor='#ffe6a8';ctx.shadowBlur=24;ctx.strokeStyle='#fff1ad';ctx.lineWidth=4;ctx.beginPath();ctx.arc(glow.x,glow.y,16+Math.sin(performance.now()/150)*2,0,PI*2);ctx.stroke();ctx.fillStyle='#ffe39a';ctx.beginPath();ctx.arc(glow.x,glow.y,9,0,PI*2);ctx.fill();ctx.restore()}else{ctx.save();ctx.globalAlpha=.6;ctx.strokeStyle='#d49bfd';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,54+Math.sin(performance.now()/300)*2,0,PI*2);ctx.stroke();ctx.restore()}}
function shotDirection(){
  const o=launcher();
  const dx=state.aim.x-o.x,dy=Math.min(-state.r,state.aim.y-o.y);
  // Never allow near-horizontal loops: clamp consistently for preview AND live shot.
  const angle=Math.max(-68,Math.min(68,Math.atan2(dx,-dy)*180/PI))*PI/180;
  return {o,vx:Math.sin(angle),vy:-Math.cos(angle)};
}
function aimPath(steps=36,spacing=22){const v=shotDirection(),o=v.o;return physics.simulateReflectedPath({x:o.x,y:o.y,vx:v.vx,vy:v.vy,dt:spacing,steps,minX:state.r,maxX:state.w-state.r})}
function traceAim(){if(state.shot||!state.playing)return;const path=aimPath();ctx.save();ctx.fillStyle='#b9f0f1a8';for(let i=0;i<path.length;i++){const point=path[i];if(point.y<state.r+state.offset||point.y<10)break;ctx.beginPath();ctx.arc(point.x,point.y,Math.max(1.4,2.2-i*.025),0,PI*2);ctx.fill()}ctx.restore()}
function drawDangerLine(){
 const y=dangerY(),near=criticalReef()||bottomAttachedEdge()>=y;
 const beat=near?.48+.52*(.5+.5*Math.sin(performance.now()/112)):1;
 ctx.save();ctx.setLineDash([8,7]);ctx.lineWidth=near?2.7:2;ctx.globalAlpha=beat;
 ctx.strokeStyle=near?'#ff234d':'#ffd36f';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=near?19:5;
 ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(state.w-10,y);ctx.stroke();ctx.setLineDash([]);ctx.shadowBlur=0;
 ctx.fillStyle=near?'#ffd5de':'#ffe2a0';ctx.font='800 10px system-ui';ctx.textAlign='right';ctx.fillText(near?'⚠ DANGER LINE':'DANGER LINE',state.w-14,y-9);
 ctx.restore()
}
function render(){renderCount++;if(state.boss&&live&&live.ok)live.motion(bossPose());ctx.clearRect(0,0,state.w,state.h);if(state.shake>0){ctx.save();ctx.translate(Math.sin(performance.now()/25)*state.shake*9,0)}ctx.save();if(state.boss){if(live&&live.ok)bossTargetDraw();else bossDraw();}for(let row=0;row<state.rows;row++)for(let col=0;col<C;col++)if(state.grid[row][col]!==null){const p=loc(row,col);orb(p.x,p.y,state.grid[row][col])}for(const seal of state.seals)if(!seal.broken&&state.grid[seal.row]&&state.grid[seal.row][seal.col]!==null){const q=loc(seal.row,seal.col);ctx.fillStyle='#ffdb91';ctx.font=`${state.r}px sans-serif`;ctx.textAlign='center';ctx.fillText('♙',q.x,q.y+state.r*.37)}drawDangerLine();if(state.playing&&!state.paused){traceAim();if(!state.shot){const o=launcher();orb(o.x,o.y,state.ready,state.r*.75)}}if(state.shot)orb(state.shot.x,state.shot.y,state.shot.color,state.r*.8);ctx.restore();for(const p of state.particles){ctx.globalAlpha=Math.min(1,p.life*1.3);ctx.fillStyle=COLORS[p.color]||'#ffe3ae';ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,PI*2);ctx.fill()}ctx.globalAlpha=1;for(const f of state.floats){ctx.globalAlpha=Math.min(1,f.life);ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y)}ctx.globalAlpha=1;if(state.shake>0)ctx.restore()}
function makeButton(text,fn,kind=''){const b=document.createElement('button');b.textContent=text;b.className=kind;b.addEventListener('click',()=>{sfx('click');fn()});return b}
function dialog({eyebrow='ROYAL MISSION',title,text='',buttons=[],picture='',html=''}){els.overlay.classList.remove('royal-welcome-open');state.modal=true;state.paused=true;currentDialog={eyebrow,title,text,buttons,picture,html};els.eyebrow.textContent=eyebrow;els.title.textContent=title;els.modalText.textContent=text;els.illustration.innerHTML='';els.illustration.hidden=!(picture||html);if(picture){const img=document.createElement('img');img.src=(window.CASPIA_EMBEDDED_ASSETS&&window.CASPIA_EMBEDDED_ASSETS[picture])||picture;img.alt='Princess Caspia';els.illustration.appendChild(img)}if(html)els.illustration.innerHTML=html;els.actions.replaceChildren(...buttons.map(v=>makeButton(v.label,v.action,v.kind||'')));els.overlay.hidden=false}
function closeDialog(){els.overlay.classList.remove('royal-welcome-open');state.modal=false;state.paused=false;els.overlay.hidden=true;els.overlay.classList.remove('final-rescue');last=performance.now();updateHud();if(chapterPending)stampChapter()}
function ask(title,text,doIt,back){dialog({eyebrow:'PLEASE CONFIRM',title,text,buttons:[{label:'Cancel',action:()=>{if(back)back();else closeDialog()}},{label:'Confirm',kind:'warn',action:()=>{closeDialog();doIt()}}]})}
function pauseDialog(){dialog({eyebrow:'GAME PAUSED',title:'Take a breath, Guardian',text:'Your timer is paused. All unlocked stages stay saved.',buttons:[{label:'Resume',kind:'primary',action:closeDialog},{label:'Guide',action:()=>guide(true)},{label:'Levels',action:levelMap},{label:'Restart',action:()=>ask('Restart this level?','The current round will restart.',()=>resetLevel(),pauseDialog)},{label:window.CASPIA_STANDALONE?'⌂ Main Menu':'⌂ Website Home',action:()=>ask(window.CASPIA_STANDALONE?'Return to Main Menu?':'Return to Website Home?','Your completed levels are saved. Your current attempt will end.',()=>goHome(),pauseDialog)},{label:'Quit Round',kind:'warn',action:()=>ask('End this round?', 'Your completed levels and earned stars are saved.',()=>goHome(),pauseDialog)}]})}
function resetLevel(){initialize(state.mode,state.level,state.quickStage);if(state.tutorial){state.tutorial='';setTip('')}closeDialog()}
function enterStage(mode,level,quickStage=0){initialize(mode,level,quickStage);if(!state.boss){closeDialog();return}const boss=state.boss;const descriptions={jelly:'The Jellyfish Guardian protects the first passage. Clear its shield and fire glowing Pearl Strikes at its center.',crab:'The Armored Crab blocks the palace. Break its shield, then strike its moving weak point.',core:'Caspia is behind the Enchanted Pearl Core! Pop the shield, then track its moving weak point as it glides across the reef—never aim at Caspia.'};dialog({eyebrow:'BOSS ENCOUNTER',title:boss.name,text:descriptions[boss.type],picture:boss.type==='core'?'assets/bosses/caspia-prison.webp':'assets/bosses/'+boss.type+'-idle.webp',buttons:[{label:'Begin Battle!',kind:'primary',action:closeDialog},{label:'Level Map',action:levelMap}]})}
function victoryMessage(){if(state.mode==='quick')return state.quickStage?'Caspia is free! The enchanted pearl has shattered.':'The route is open! Time to break the final spell.';if(state.level===10)return 'The spell is broken! You saved Princess Caspia and restored her kingdom.';if(state.level===4)return 'The Jellyfish Guardian is defeated. Caspia feels the magic weakening!';if(state.level===7)return 'The Armored Crab has fallen. The palace is within reach!';if(state.level===9)return 'The palace gates are open. Only the final spell remains.';return 'Snap is one step closer to rescuing Princess Caspia.'}
function finish(won){if(!state.playing)return;chapterPending=false;state.playing=false;state.paused=true;state.modal=true;const cfg=info(),elapsed=state.total-state.seconds;const stars=state.seconds>state.total*.62&&state.shots<=16?3:state.seconds>state.total*.23?2:1;const isFinal=state.mode==='quick'&&state.quickStage===1||state.mode==='story'&&state.level===10;const reached=state.level;if(won&&state.mode==='story'){progress.unlocked=Math.min(10,Math.max(progress.unlocked,state.level+1));progress.stars[state.level]=Math.max(progress.stars[state.level]||0,stars);if(isFinal)progress.completed=true;store()}sfx(isFinal?'rescue':'win');if(isFinal)els.progress.textContent='Rescue 100%';if(live&&live.ok)live.win(isFinal);const starText='★'.repeat(stars)+'☆'.repeat(3-stars);const buttons=isFinal?[{label:'Play Again',kind:'primary',action:()=>ask('Restart Adventure?', 'Start again at the beginning? Completed stages will remain unlocked.',()=>{initialize(state.mode,1,0);closeDialog()},()=>finishDialog())},{label:'Level Map',action:levelMap},{label:'Home',action:()=>ask('Return to the portal?','Your rescue has been saved.',()=>goHome(),()=>finishDialog())},{label:'Quit',kind:'warn',action:()=>ask('Quit Game?', 'Your rescue achievement will remain saved.',()=>goHome(),()=>finishDialog())}]:[{label:state.mode==='quick'?'Final Challenge →':`Level ${Math.min(10,state.level+1)} →`,kind:'primary',action:()=>{if(state.mode==='quick'){enterStage('quick',1,1)}else enterStage('story',Math.min(10,reached+1))}},{label:'Replay',action:()=>ask('Replay this level?','Restart this stage from the beginning.',()=>resetLevel(),()=>finishDialog())},{label:'Home',action:()=>ask('Go back to the portal?','Unlocked progress is saved.',()=>goHome(),()=>finishDialog())},{label:'Quit',kind:'warn',action:()=>ask('Quit Game?', 'Your unlocked levels stay saved.',()=>goHome(),()=>finishDialog())}];const isBonus=state.mode==='demo';if(isBonus){buttons.splice(0,buttons.length,{label:'Play Adventure',kind:'primary',action:()=>{initialize('story',progress.unlocked);closeDialog()}},{label:'Home',action:()=>goHome()})}
function finishDialog(){dialog({eyebrow:isFinal?'THE KINGDOM IS FREE!':'LEVEL COMPLETE',title:isFinal?'You Saved Princess Caspia!':'Congratulations!',text:victoryMessage()+` Score ${state.score.toLocaleString()} · ${state.shots} shots · ${Math.round(elapsed)}s played.`,picture:isFinal?'assets/bosses/caspia-rescue.webp':'assets/characters/caspia-victory.webp',html:'',buttons})}finishDialog();els.overlay.classList.toggle('final-rescue',isFinal);if(!isFinal)els.illustration.insertAdjacentHTML('afterbegin',`<div class="victory-stars" aria-label="${stars} stars">${starText}</div>`);else{els.illustration.insertAdjacentHTML('afterbegin','<div class="victory-stars">★★★</div>');}};
const DEFEATS={'danger-line':{eyebrow:'DANGER LINE CROSSED',title:'The Reef Reached Snap',message:'The enchanted pearls touched Snap’s danger line.'},'board-full':{eyebrow:'REEF FULL',title:'No Safe Attachment Remains',message:'The reef has no legal attachment slots.'},timeout:{eyebrow:'TIME EXPIRED',title:'The Rescue Window Closed',message:'Time ran out before Caspia could be freed.'}};
function lose(code){if(!state.playing)return;const defeat=DEFEATS[code]||DEFEATS.timeout;state.defeat={code,message:defeat.message};state.playing=false;state.paused=true;els.board.classList.add('reef-defeat');setTimeout(()=>els.board.classList.remove('reef-defeat'),1300);if(live&&live.ok)live.lose();sfx('lose');dialog({eyebrow:defeat.eyebrow,title:defeat.title,text:defeat.message+' Snap can try again. Your unlocked levels are safe.',buttons:[{label:'Retry Level',kind:'primary',action:()=>resetLevel()},{label:'Level Map',action:levelMap},{label:'Home',action:()=>ask('Return home?','Your unlocked levels stay saved.',()=>goHome(),()=>lose(code))}]})}
function levelMap(){const wasWelcome=els.title.textContent==='Save Princess Caspia';const container=document.createElement('div');container.className='level-map';LEVELS.forEach((v,i)=>{const n=i+1,b=makeButton(n+(v.boss?' 👑':''),()=>{if(n>progress.unlocked)return;enterStage('story',n)},(v.boss?'boss ':'')+(n>progress.unlocked?'locked ':'')+(n===state.level?'active':''));b.disabled=n>progress.unlocked;const tiny=document.createElement('small');tiny.textContent=n>progress.unlocked?'Locked':v.boss?'BOSS':(progress.stars[n]?'★'.repeat(progress.stars[n]):'Stage');b.appendChild(tiny);container.appendChild(b)});dialog({eyebrow:'THE UNDERWATER KINGDOM',title:'Choose Your Level',text:`${Math.min(10,progress.unlocked)} of 10 stages unlocked.`,buttons:[{label:'Back',action:()=>{if(wasWelcome||!state.playing)welcome();else pauseDialog() }},{label:'Quick Rescue',kind:'primary',action:()=>{initialize('quick',1,0);closeDialog()}}]});els.illustration.hidden=false;els.illustration.replaceChildren(container)}
function welcome(){
 const unlocked=progress.unlocked||1;
 const stars=Object.values(progress.stars||{}).reduce((a,b)=>a+(Number(b)||0),0);
 const complete=!!progress.completed;
 const adventureTitle=complete?'PLAY AGAIN':unlocked>1?'CONTINUE STORY':'STORY ADVENTURE';
 const adventureSub=complete?'Replay all 10 stages':unlocked>1?`Resume at level ${unlocked}`:'10 levels · 3 guardians';
 const portrait=(window.CASPIA_EMBEDDED_ASSETS&&window.CASPIA_EMBEDDED_ASSETS['assets/characters/caspia-idle.webp'])||'assets/characters/caspia-idle.webp';
 const card=`<section class="welcome-hero" aria-label="Princess Caspia's rescue adventure">
 <div class="welcome-hero-art"><img src="${portrait}" alt="Princess Caspia, a pink-haired mermaid in a shimmering underwater kingdom"></div>
 <div class="welcome-hero-copy"><span class="welcome-badge">${complete?'RESCUE COMPLETED':'THE KINGDOM NEEDS YOU'}</span>
 <h3>${complete?'The kingdom celebrates!':'An enchanted adventure awaits.'}</h3>
 <p>Help Snap match magical pearls, outsmart three guardians, and free Princess Caspia.</p>
 <div class="welcome-stats" aria-label="Your saved progress"><span><b>${Math.min(10,Math.max(1,unlocked))}</b><small>Level unlocked</small></span><span><b>${stars}</b><small>Stars earned</small></span><span><b>3</b><small>Boss battles</small></span></div>
 </div></section>
 <div class="mode-cards premium"><button id="startAdventure" type="button"><span aria-hidden="true">✦</span><strong>${adventureTitle}</strong><small>${adventureSub}</small></button>
 <button id="startQuick" type="button"><span aria-hidden="true">♛</span><strong>QUICK RESCUE</strong><small>2 short stages · try it fast</small></button></div>`;
 dialog({eyebrow:'WELCOME TO THE DEEP',title:'Save Princess Caspia',text:'Choose your adventure to begin.',html:card,picture:'',buttons:[{label:'Level Map',action:levelMap},{label:'Boss Demo',action:()=>enterStage('demo',4)},{label:'How to Play',action:()=>guide('welcome')},{label:'Sound',action:soundSettings},...(!window.CASPIA_STANDALONE?[{label:'⌂ Website Home',action:()=>goHome()}]:[])]});
 els.overlay.classList.add('royal-welcome-open');
 $('startAdventure').onclick=()=>{initialize('story',complete?1:progress.unlocked);beginAdventure()};
 $('startQuick').onclick=()=>{initialize('quick',1,0);beginAdventure()};
}
function soundSettings(){
 const a=audioEngine?audioEngine.getSettings():{enabled:soundEnabled,music:false,volume:.58};
 const content=`<div class="royal-audio-settings"><label><input type="checkbox" id="audioFxEnabled" ${a.enabled?'checked':''}> Sound effects</label><label><input type="checkbox" id="audioMusicEnabled" ${a.music?'checked':''}> Quiet underwater ambience</label><label for="audioMasterVolume">Volume <span id="audioVolumeValue">${Math.round(a.volume*100)}%</span></label><input id="audioMasterVolume" type="range" min="0" max="100" value="${Math.round(a.volume*100)}" step="5"><p>Royal Arcade effects. Sound starts after you interact with the game.</p></div>`;
 const wasPlaying=state.playing&&!state.modal;
 dialog({eyebrow:'ROYAL ARCADE AUDIO',title:'Sound Settings',html:content,text:'Customize your underwater adventure.',buttons:[{label:'Done',kind:'primary',action:()=>wasPlaying?closeDialog():welcome()},{label:'Test Sound',action:()=>audioEngine?.play('match')}]});
 $('audioFxEnabled').onchange=e=>{soundEnabled=e.target.checked;audioEngine?.setEnabled(soundEnabled);syncSoundButton()};
 $('audioMusicEnabled').onchange=e=>audioEngine?.setMusic(e.target.checked);
 $('audioMasterVolume').oninput=e=>{$('audioVolumeValue').textContent=e.target.value+'%';audioEngine?.setVolume(Number(e.target.value)/100)};
}
function syncSoundButton(){$('soundBtn').textContent=soundEnabled?'♫':'♪';$('soundBtn').setAttribute('aria-label',soundEnabled?'Mute sound effects':'Unmute sound effects');$('soundBtn').setAttribute('aria-pressed',String(soundEnabled))}
function beginAdventure(){let seen=guideShownThisPage;try{seen=seen||localStorage.getItem(GUIDE)==='yes'}catch{}if(!seen&&state.level===1&&state.quickStage===0){guide(false)}else closeDialog()}
function guide(fromPause){
 const steps=[
   {title:'Meet Snap!',text:'Meet Snap, Caspia’s royal pistol shrimp! His powerful glowing claw launches magical pearls to rescue the princess.'},
   {title:'Aim and Shoot',text:'Move your mouse or drag to aim, then release to shoot. Match 3 pearls of one color. Try a wall bounce for hidden targets!'},
   {title:'Swap Your Pearls',text:'Use READY and NEXT to choose the best color. Tap SWAP anytime before firing — swapping costs no shot.'}
 ];
 let i=0;
 function tutorialArt(index){
  const path=window.CASPIA_EMBEDDED_ASSETS||{};
  const image=name=>path['assets/characters/'+name]||'assets/characters/'+name;
  if(index===0)return `<div class="royal-guide-scene guide-meet"><div class="royal-guide-glow"></div><div class="guide-meet-card"><img class="royal-guide-snap" alt="Snap the royal pistol shrimp holding a glowing pearl in his snapping claw" src="${image('snap-idle.webp')}"><span class="royal-guide-pearl pearl-a"></span><span class="royal-guide-pearl pearl-b"></span><span class="royal-guide-pearl pearl-c"></span></div><div class="royal-guide-subtitle">YOUR PEARL GUARDIAN</div></div>`;
  if(index===1)return `<div class="royal-guide-scene guide-shoot"><img class="guide-shooter" alt="Snap firing a glowing pearl" src="${image('snap-fire.webp')}"><div class="guide-targets" aria-hidden="true"><span></span><span></span><span></span></div><div class="guide-dot-path" aria-hidden="true"></div><span class="guide-flying-pearl" aria-hidden="true"></span><strong class="guide-match-text">MATCH 3 ✦</strong></div>`;
  return `<div class="royal-guide-scene guide-swap"><div class="guide-swap-group"><div class="guide-swap-ready"><span class="royal-orb pink"></span><small>READY</small></div><div class="guide-swap-arrows" aria-hidden="true">⇄</div><div class="guide-swap-next"><span class="royal-orb cyan"></span><small>NEXT</small></div></div><strong class="royal-guide-subtitle">CHOOSE YOUR COLOR BEFORE SHOOTING</strong></div>`;
 }
 function page(){
  const step=steps[i];
  dialog({eyebrow:`HOW TO PLAY · ${i+1} / 3`,title:step.title,text:step.text,html:tutorialArt(i),buttons:[
    {label:'Skip Guide',action:()=>finishGuide(true)},
    {label:i===steps.length-1?'Start Playing!':'Next →',kind:'primary',action:()=>{if(++i<steps.length)page();else finishGuide(false)}}
  ]});
  els.overlay.classList.add('royal-guide-open');
 }
 function finishGuide(skip){
  guideShownThisPage=true;
  try{localStorage.setItem(GUIDE,'yes')}catch{}
  els.overlay.classList.remove('royal-guide-open');
  if(fromPause==='welcome'){welcome();return}
  if(fromPause){pauseDialog();return}
  closeDialog();
  if(!skip&&state.playing&&state.mode==='story'&&state.level===1){state.tutorial='shoot';setTip('PRACTICE: Aim and shoot to match three pearls!');setHint('Practice your first shot • timer paused');}
  else state.tutorial='';
 }
 page()
}

 function syncClawAngle(){const angle=clawAngle(),claw=els.snap.querySelector('#clawGroup');if(claw){claw.style.setProperty('--claw-angle',angle+'deg');claw.style.transform='rotate('+angle+'deg)'}if(live&&live.ok&&state.started){const vector=shotDirection(),p=vector.o,a=Math.atan2(vector.vx,-vector.vy)*180/PI;live.aim(a,{muzzle:p,bossBody:state.boss?bossPose():null,w:state.w,h:state.h})}return angle}
 function aimPoint(e){const rect=els.canvas.getBoundingClientRect();const scaleX=state.w/rect.width,scaleY=state.h/rect.height;state.aim.x=(e.clientX-rect.left)*scaleX;state.aim.y=(e.clientY-rect.top)*scaleY;syncClawAngle()}
els.canvas.addEventListener('pointerdown',e=>{if(state.modal||state.paused&&!state.tutorial||!state.playing)return;pointerDown=true;try{els.canvas.setPointerCapture(e.pointerId)}catch{}aimPoint(e)});
els.canvas.addEventListener('pointermove',e=>{if(pointerDown||(e.pointerType==='mouse'&&state.playing&&!state.modal))aimPoint(e)});
els.canvas.addEventListener('pointerup',e=>{if(!pointerDown)return;pointerDown=false;aimPoint(e);launch()});els.canvas.addEventListener('pointercancel',()=>pointerDown=false);
 els.canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){state.aim.x-=16;syncClawAngle();e.preventDefault()}else if(e.key==='ArrowRight'){state.aim.x+=16;syncClawAngle();e.preventDefault()}else if(e.code==='Space'||e.key==='Enter'){e.preventDefault();launch()}});
$('swapBtn').addEventListener('click',()=>{if(!state.playing||state.modal||state.shot||state.boss?.exposed)return;if(state.paused&&state.tutorial!=='swap')return;[state.ready,state.next]=[state.next,state.ready];paintAmmo();sfx('swap');if(state.tutorial==='swap'){state.tutorial='';setTip('');setHint('Great! The rescue has begun.');last=performance.now()}});
$('desktopMapBtn').onclick=levelMap;$('guideBtn').onclick=()=>guide(true);$('mapBtn').onclick=levelMap;$('pauseBtn').onclick=()=>{if(state.playing)pauseDialog();else welcome()};$('soundBtn').onclick=()=>{soundEnabled=!soundEnabled;audioEngine?.setEnabled(soundEnabled);syncSoundButton();if(soundEnabled)sfx('click')};$('audioSettingsBtn').onclick=soundSettings;syncSoundButton();$('retryInit').onclick=()=>initialize(state.mode,state.level,state.quickStage);const homeLink=$('backLink');
const isOfflineGame=!!window.CASPIA_STANDALONE;
homeLink.querySelector('.home-label').textContent=isOfflineGame?'Main Menu':'Home';
homeLink.setAttribute('aria-label',isOfflineGame?'Return to the game main menu':'Return to website home');
homeLink.title=isOfflineGame?'Return to Main Menu':'Return to Website Home';
homeLink.addEventListener('click',e=>{
  e.preventDefault();
  if(!state.playing){goHome();return;}
  ask(isOfflineGame?'Return to Main Menu?':'Return to Website Home?',
      'Your completed levels are saved. Your current attempt will end.',
      ()=>goHome(), ()=>pauseDialog());
});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&state.playing&&!state.modal&&!['BUTTON','A'].includes(document.activeElement.tagName)){e.preventDefault();launch()}else if(e.key==='Escape'&&state.playing&&!state.modal){pauseDialog();e.preventDefault()}else if((e.key==='s'||e.key==='S')&&state.playing&&!state.modal&&!state.shot){$('swapBtn').click()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.playing&&!state.modal){pauseDialog()}});
window.addEventListener('resize',()=>{if(!state.started)return;fit();if(live&&live.ok)live.resize();if(state.playing&&!state.modal)checkDanger();render()});
function frame(now){const dt=Math.min(.045,Math.max(0,(now-last)/1000||0));last=now;try{const practice=state.tutorial==='shoot'||state.tutorial==='swap';if(!document.hidden&&state.playing&&!state.modal){if(practice){state.paused=false;const seconds=state.seconds;step(dt);state.seconds=seconds}else step(dt);render()}}catch(e){showError(e)}raf=requestAnimationFrame(frame)}
 function installTestHooks(){window.__CASPIA_TEST__={snapshot:()=>{const o=launcher(),angle=clawAngle(),localMuzzle=physics.launcherLocalPoint({muzzle:CLAW_MUZZLE,origin:CLAW_ORIGIN,angleDeg:angle});return{mode:state.mode,level:state.level,playing:state.playing,modal:state.modal,claw:{angle,muzzleSvg:localMuzzle,muzzleCanvas:{...o}},launcher:{...o},loadedBubble:{...o,color:state.ready},shot:state.shot&&{x:state.shot.x,y:state.shot.y,color:state.shot.color},pressure:state.pressure,pressureLimit:pressureLimit(),descents:state.descents,offset:state.offset,dangerY:dangerY(),bottomEdge:bottomAttachedEdge(),gridCount:countGrid(),gridCols:C,defeatDiagnostics:{reason:state.defeat,dangerCrossed:bottomAttachedEdge()>=dangerY()},attachmentDiagnostics:{legalSlots:legalAttachmentSlots().length,last:state.attachment},unlocked:progress.unlocked,visuals:live&&live.ok?{boss:live.getState().bossType,active:true}:null}},aimPath:(steps=24,spacing=22)=>aimPath(steps,spacing).map(p=>({...p})),attachmentFor:(impact,collided)=>attachmentOutcome(impact,collided),startLevel:(level=1)=>{initialize('story',level);closeDialog();return window.__CASPIA_TEST__.snapshot()},launch:()=>{launch();return window.__CASPIA_TEST__.snapshot()},nonClearingShots:(count=1)=>{for(let i=0;i<count&&state.playing;i++)recordShotResult(false);updateHud();render();return window.__CASPIA_TEST__.snapshot()},hitBoss:()=>{if(state.boss){state.boss.exposed=true;damageBoss()}return window.__CASPIA_TEST__.snapshot()},bossState:()=>state.boss&&{...state.boss},bossPose:()=>bossPose(),audio:()=>audioEngine?.getSettings(),renderCount:()=>renderCount,returnHome:()=>goHome(),levelTimes:()=>LEVELS.map(l=>l.time),levelColors:()=>LEVELS.map(l=>l.colors),forceDanger:()=>{let guard=0;while(state.playing&&bottomAttachedEdge()<dangerY()&&guard++<30){state.descents++;pressureStep()}updateHud();render();return window.__CASPIA_TEST__.snapshot()},critical:()=>({critical:criticalReef(),visible:!$('reefAlert').hidden}),praise:()=>{applause('GREAT!','3 pearls cleared!');return {title:els.comboTitle.textContent,source:$('comboFace').getAttribute('src')}},retry:()=>{resetLevel();return window.__CASPIA_TEST__.snapshot()}}}
if(new URLSearchParams(location.search).get('test')==='1')installTestHooks();
try{initialize('story',1);const hash=location.hash.slice(1);if(hash==='quick'){initialize('quick',1,0);if(new URLSearchParams(location.search).get('test')==='1')beginAdventure();else guide(false)}else if(hash==='demo'){enterStage('demo',4);if(new URLSearchParams(location.search).get('test')!=='1')guide(false)}else if(new URLSearchParams(location.search).get('test')==='1')welcome();else guide('welcome');last=performance.now();raf=requestAnimationFrame(frame)}catch(e){showError(e)}
})();
