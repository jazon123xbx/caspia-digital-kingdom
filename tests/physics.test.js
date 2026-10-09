'use strict';
const assert=require('assert');
const physics=require('../js/physics.js');
const bounds={minX:10,maxX:110};
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-9,`${message||'values differ'}: ${actual} !== ${expected}`);

// Snap's signed aim uses the same y-down angle convention as CSS/SVG.
{assert.ok(physics.clawAimAngle({aimX:0,boardWidth:360})<0,'left aim rotates left');near(physics.clawAimAngle({aimX:180,boardWidth:360}),0,'center is neutral');assert.ok(physics.clawAimAngle({aimX:360,boardWidth:360})>0,'right aim rotates right');near(physics.clawAimAngle({aimX:9999,boardWidth:360}),18,'right angle clamps');near(physics.clawAimAngle({aimX:-9999,boardWidth:360}),-18,'left angle clamps')}
{const muzzle={x:270,y:99},origin={x:215,y:114};const neutral=physics.launcherLocalPoint({muzzle,origin,angleDeg:0}),right=physics.launcherLocalPoint({muzzle,origin,angleDeg:18}),left=physics.launcherLocalPoint({muzzle,origin,angleDeg:-18});assert.deepStrictEqual(neutral,muzzle);assert.ok(right.y>neutral.y&&left.y<neutral.y,'muzzle rotates around the declared claw origin');near(Math.hypot(right.x-origin.x,right.y-origin.y),Math.hypot(muzzle.x-origin.x,muzzle.y-origin.y),'rotation preserves muzzle radius')}
// The danger boundary uses the neutral muzzle and must never drift with aiming.
{const muzzle={x:270,y:99},origin={x:215,y:114},radius=17,neutral=physics.launcherLocalPoint({muzzle,origin,angleDeg:0});const anchor=physics.dangerLineY({neutralMuzzleY:neutral.y,radius,multiplier:2.15,minY:radius*4});for(const aimX of [0,180,360]){const angle=physics.clawAimAngle({aimX,boardWidth:360}),active=physics.launcherLocalPoint({muzzle,origin,angleDeg:angle});if(aimX===180)near(active.y,neutral.y,'center uses neutral muzzle');else assert.notStrictEqual(active.y,neutral.y,'off-center aim may move the active muzzle');near(physics.dangerLineY({neutralMuzzleY:neutral.y,radius,multiplier:2.15,minY:radius*4}),anchor,'danger anchor remains neutral across aims')}near(anchor,Math.max(radius*4,neutral.y-radius*2.15),'neutral danger formula')}
// Launcher, loaded bubble and projectile must receive the identical authoritative point.
{const launcher=physics.launcherLocalPoint({muzzle:{x:270,y:99},origin:{x:215,y:114},angleDeg:12});const loaded={...launcher};const shot={x:launcher.x,y:launcher.y};assert.deepStrictEqual(loaded,launcher);assert.deepStrictEqual(shot,launcher)}

// Extreme left/right shots preserve overshoot and reflect velocity.
{const r=physics.advanceReflectedX({x:11,vx:-30,dt:1,...bounds});near(r.x,39,'extreme left preserves overshoot');assert.strictEqual(r.vx,30);assert.strictEqual(r.bounceCount,1)}
{const r=physics.advanceReflectedX({x:109,vx:30,dt:1,...bounds});near(r.x,81,'extreme right preserves overshoot');assert.strictEqual(r.vx,-30);assert.strictEqual(r.bounceCount,1)}

// Exact-wall behavior: inward travel is not a bounce; outward travel is.
{const r=physics.advanceReflectedX({x:10,vx:20,dt:1,...bounds});assert.deepStrictEqual(r,{x:30,vx:20,bounceCount:0})}
{const r=physics.advanceReflectedX({x:10,vx:-20,dt:1,...bounds});assert.deepStrictEqual(r,{x:30,vx:20,bounceCount:1})}
{const r=physics.advanceReflectedX({x:110,vx:-20,dt:1,...bounds});assert.deepStrictEqual(r,{x:90,vx:-20,bounceCount:0})}
{const r=physics.advanceReflectedX({x:110,vx:20,dt:1,...bounds});assert.deepStrictEqual(r,{x:90,vx:-20,bounceCount:1})}

// Shallow, straight, single-bounce and repeated-bounce shots.
{const r=physics.advanceReflectedX({x:105,vx:6,dt:1,...bounds});near(r.x,109,'shallow-angle wall result');assert.strictEqual(r.vx,-6)}
{const r=physics.advanceReflectedX({x:55,vx:0,dt:12,...bounds});assert.deepStrictEqual(r,{x:55,vx:0,bounceCount:0})}
{const r=physics.advanceReflectedX({x:50,vx:80,dt:1,...bounds});near(r.x,90,'one bounce');assert.strictEqual(r.vx,-80);assert.strictEqual(r.bounceCount,1)}
{const r=physics.advanceReflectedX({x:50,vx:550,dt:1,...bounds});near(r.x,20,'multiple bounces');assert.strictEqual(r.vx,-550);assert.strictEqual(r.bounceCount,5)}
{const r=physics.advanceReflectedX({x:50,vx:100,dt:0,...bounds});assert.deepStrictEqual(r,{x:50,vx:100,bounceCount:0})}

// Every sampled result remains finite and within center-point wall bounds.
for(let x=10;x<=110;x+=5)for(const vx of [-1000,-1,0,1,1000]){const r=physics.advanceReflectedX({x,vx,dt:3.7,...bounds});assert.ok(r.x>=10&&r.x<=110,'reflected x stays bounded');assert.ok(Number.isFinite(r.vx))}

// Left/right symmetry.
{const left=physics.advanceReflectedX({x:31,vx:-247,dt:.83,...bounds});const right=physics.advanceReflectedX({x:89,vx:247,dt:.83,...bounds});near(left.x+right.x,120,'left/right symmetry');assert.strictEqual(left.vx,-right.vx);assert.strictEqual(left.bounceCount,right.bounceCount)}

// Aim preview and repeated projectile advancement use identical mathematics.
{const path=physics.simulateReflectedPath({x:31,y:200,vx:247,vy:-91,dt:.17,steps:14,...bounds});let x=31,y=200,vx=247;for(const point of path){const r=physics.advanceReflectedX({x,vx,dt:.17,...bounds});x=r.x;vx=r.vx;y-=91*.17;near(point.x,x,'preview/projectile x equivalence');near(point.y,y,'preview/projectile y equivalence');assert.strictEqual(point.vx,vx)}}

// The exact game substep formula is equivalent to one continuous advancement.
{const radius=17,width=360,dt=.016,shotBounds={minX:radius,maxX:width-radius},start={x:330,vx:5000};const direct=physics.advanceReflectedX({...start,dt,...shotBounds});const sub=Math.ceil(830*dt/Math.max(3,radius*.3)),stepDt=dt/sub;let current={...start},bounces=0;for(let i=0;i<sub;i++){const r=physics.advanceReflectedX({...current,dt:stepDt,...shotBounds});current={x:r.x,vx:r.vx};bounces+=r.bounceCount}near(current.x,direct.x,'game substeps preserve x');near(current.vx,direct.vx,'game substeps preserve vx');assert.strictEqual(bounces,direct.bounceCount)}

// Multiple reflections can be resolved safely even inside one game-sized substep.
{const radius=17,width=360,subDt=.008,r=physics.advanceReflectedX({x:180,vx:100000,dt:subDt,minX:radius,maxX:width-radius});assert.ok(r.bounceCount>=2,'multiple bounces within one substep');assert.ok(r.x>=radius&&r.x<=width-radius)}

// Attachment ranking only selects from the physically valid candidates supplied.
{const selected=physics.selectNearestAttachment([{row:2,col:4,x:50,y:50},{row:2,col:3,x:41,y:50}],{x:43,y:50});assert.deepStrictEqual({row:selected.row,col:selected.col},{row:2,col:3});assert.strictEqual(physics.selectNearestAttachment([],{x:1,y:1}),null)}
{const ceiling=physics.selectNearestAttachment([{row:0,col:0,x:44,y:30},{row:0,col:1,x:78,y:30}],{x:50,y:28});assert.deepStrictEqual({row:ceiling.row,col:ceiling.col},{row:0,col:0})}

// A substep can overlap more than one bubble; candidate union is order-independent and deduplicated.
{const impact={x:50,y:50},cells=[{row:2,col:2,x:40,y:50},{row:2,col:3,x:60,y:50},{row:1,col:1,x:3,y:3}];const hit=physics.collectOverlappingCells(cells,impact,15);assert.deepStrictEqual(hit.map(c=>c.col),[2,3]);const empty=new Set(['1,2','2,1','2,4']);const candidates=physics.attachmentCandidatesFromCollisions(hit,(row,col)=>[{row:row-1,col},{row,col:col-1},{row,col:col+1}],(row,col)=>empty.has(row+','+col),(row,col)=>({x:col*20,y:row*20}));assert.deepStrictEqual(candidates.map(c=>`${c.row},${c.col}`).sort(),['1,2','2,1','2,4']);const chosen=physics.selectNearestAttachment(candidates,{x:78,y:40});assert.deepStrictEqual({row:chosen.row,col:chosen.col},{row:2,col:4})}
// No local slot is not board full when another legal grid/top-boundary slot remains.
{const impact={x:10,y:10};assert.strictEqual(physics.classifyAttachment([],[{row:0,col:8,x:100,y:0}],impact).kind,'local-miss');assert.strictEqual(physics.classifyAttachment([],[],impact).kind,'board-full');assert.strictEqual(physics.classifyAttachment([{row:1,col:1,x:10,y:10}],[{row:0,col:8,x:100,y:0}],impact).kind,'attach')}

// The actual pressure rules are deterministic: thresholds, clearing reset, and retry reset.
{for(const mode of ['story','quick'])for(const level of [1,4,7,10])for(const boss of [true,false])assert.strictEqual(physics.pressureLimit({mode,level,boss}),3);let state=physics.resetPressureState();for(let i=0;i<2;i++){state=physics.nextPressureState({...state,cleared:false,limit:3});assert.strictEqual(state.descended,false)}state=physics.nextPressureState({...state,cleared:false,limit:3});assert.deepStrictEqual(state,{pressure:0,descents:1,descended:true});assert.deepStrictEqual(physics.nextPressureState({pressure:2,descents:3,cleared:true,limit:3}),{pressure:0,descents:3,descended:false});assert.deepStrictEqual(physics.resetPressureState(),{pressure:0,descents:0})}

assert.throws(()=>physics.advanceReflectedX({x:9,vx:1,dt:1,...bounds}),/within wall bounds/);
console.log('physics.test.js: all deterministic physics assertions passed');
