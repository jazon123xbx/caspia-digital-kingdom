/* Caspia's shared deterministic projectile/attachment physics. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CaspiaPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
  const finite=(value,name)=>{if(!Number.isFinite(value))throw new TypeError(name+' must be finite');return value};
  const mod=(value,base)=>((value%base)+base)%base;

  /** SVG-space rotation (positive angles follow CSS/SVG's y-down coordinate system). */
  function rotatePointAroundOrigin({point,origin,angleDeg}){
   finite(point&&point.x,'point.x');finite(point&&point.y,'point.y');finite(origin&&origin.x,'origin.x');finite(origin&&origin.y,'origin.y');finite(angleDeg,'angleDeg');
   const angle=angleDeg*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle),dx=point.x-origin.x,dy=point.y-origin.y;
   return {x:origin.x+dx*cos-dy*sin,y:origin.y+dx*sin+dy*cos};
  }
  /** Maps board aim to the CSS rotation used by Snap's claw. Left is negative, right positive. */
  function clawAimAngle({aimX,boardWidth,maxAngle=18}){
   finite(aimX,'aimX');finite(boardWidth,'boardWidth');finite(maxAngle,'maxAngle');
   if(!(boardWidth>0)||maxAngle<0)throw new RangeError('boardWidth and maxAngle must be positive');
   return Math.max(-maxAngle,Math.min(maxAngle,((aimX-boardWidth/2)/boardWidth)*48));
  }
  /** The authoritative SVG-local muzzle point after the DOM claw rotation. */
  function launcherLocalPoint({muzzle,origin,angleDeg}){return rotatePointAroundOrigin({point:muzzle,origin,angleDeg})}
  /** Stable danger boundary: it intentionally receives the neutral, not aimed, muzzle. */
  function dangerLineY({neutralMuzzleY,radius,multiplier=2.15,minY}){
   finite(neutralMuzzleY,'neutralMuzzleY');finite(radius,'radius');finite(multiplier,'multiplier');finite(minY,'minY');
   return Math.max(minY,neutralMuzzleY-radius*multiplier);
  }

 /** Advance one X coordinate through reflecting walls without losing overshoot. */
 function advanceReflectedX({x,vx,dt,minX,maxX}){
  finite(x,'x');finite(vx,'vx');finite(dt,'dt');finite(minX,'minX');finite(maxX,'maxX');
  if(dt<0)throw new RangeError('dt must not be negative');
  if(!(maxX>minX))throw new RangeError('maxX must be greater than minX');
   const span=maxX-minX,epsilon=Math.max(1,span)*1e-9;
   if(x<minX-epsilon||x>maxX+epsilon)throw new RangeError('x must be within wall bounds');
   const start=Math.min(span,Math.max(0,x-minX));
   if(dt===0||vx===0)return {x:minX+start,vx,bounceCount:0};
   const end=start+vx*dt;
   // The right wall belongs to the incoming band. This makes an inward shot
   // start there without a phantom bounce, while an outward shot crosses it.
   const startBand=start===span?0:Math.floor(start/span),endBand=Math.floor(end/span);
  const bounceCount=Math.abs(endBand-startBand);
  const folded=mod(end,span*2);
  const reflected=folded<=span?folded:span*2-folded;
  const direction=endBand%2===0?1:-1;
  return {x:minX+reflected,vx:vx*direction,bounceCount};
 }

 /** Produce deterministic samples using the exact same reflection operation as shots. */
 function simulateReflectedPath({x,y,vx,vy,dt,steps,minX,maxX}){
  finite(y,'y');finite(vy,'vy');
  if(!Number.isInteger(steps)||steps<0)throw new RangeError('steps must be a non-negative integer');
  const path=[];let current={x,vx};
  for(let i=0;i<steps;i++){
   const reflected=advanceReflectedX({...current,dt,minX,maxX});
   current={x:reflected.x,vx:reflected.vx};y+=vy*dt;
   path.push({x:current.x,y,vx:current.vx,vy,bounceCount:reflected.bounceCount});
  }
  return path;
 }

 /** Pick only from a caller-supplied physically valid candidate set. */
 function selectNearestAttachment(candidates,impact){
  if(!Array.isArray(candidates))throw new TypeError('candidates must be an array');
  finite(impact&&impact.x,'impact.x');finite(impact&&impact.y,'impact.y');
  let best=null;
  for(const candidate of candidates){
   if(!candidate)continue;
   finite(candidate.x,'candidate.x');finite(candidate.y,'candidate.y');
   const distance=(candidate.x-impact.x)**2+(candidate.y-impact.y)**2;
   if(!best||distance<best.distance||(distance===best.distance&&(candidate.row<best.row||(candidate.row===best.row&&candidate.col<best.col))))best={...candidate,distance};
  }
  return best;
 }
  /** All cells physically overlapping this projectile substep, independent of iteration order. */
  function collectOverlappingCells(cells,impact,collisionDistance){
   if(!Array.isArray(cells))throw new TypeError('cells must be an array');finite(impact&&impact.x,'impact.x');finite(impact&&impact.y,'impact.y');finite(collisionDistance,'collisionDistance');
   const limit=collisionDistance*collisionDistance,found=[];
   for(const cell of cells)if(cell&&cell.occupied!==false){finite(cell.x,'cell.x');finite(cell.y,'cell.y');if((cell.x-impact.x)**2+(cell.y-impact.y)**2<limit)found.push(cell)}
   return found;
  }
  /** Deduplicate empty neighbours of every simultaneous collision; callers retain board ownership. */
  function attachmentCandidatesFromCollisions(collided,adjacent,isEmpty,locate){
   if(!Array.isArray(collided)||typeof adjacent!=='function'||typeof isEmpty!=='function'||typeof locate!=='function')throw new TypeError('invalid attachment candidate arguments');
   const candidates=[],seen=new Set();
   for(const cell of collided)for(const neighbour of adjacent(cell.row,cell.col)){
    const id=neighbour.row+','+neighbour.col;
    if(!seen.has(id)&&isEmpty(neighbour.row,neighbour.col)){seen.add(id);candidates.push({...neighbour,...locate(neighbour.row,neighbour.col)})}
   }
   return candidates;
  }
  /** Distinguish no board capacity from an ambiguous local collision. */
  function classifyAttachment(localCandidates,legalCandidates,impact){
   const local=selectNearestAttachment(localCandidates,impact);
   if(local)return {kind:'attach',candidate:local};
   return legalCandidates.length?{kind:'local-miss',candidate:null}:{kind:'board-full',candidate:null};
  }
  function pressureLimit({mode,level,boss}){return 3} // every third unsuccessful shot descends the reef
  function resetPressureState(){return {pressure:0,descents:0}}
  function nextPressureState({pressure,descents,cleared,limit}){
   if(!Number.isInteger(pressure)||pressure<0||!Number.isInteger(descents)||descents<0||!Number.isInteger(limit)||limit<1)throw new RangeError('invalid pressure state');
   if(cleared)return {pressure:0,descents,descended:false};const next=pressure+1;
   return next>=limit?{pressure:0,descents:descents+1,descended:true}:{pressure:next,descents,descended:false};
  }
  return Object.freeze({rotatePointAroundOrigin,clawAimAngle,launcherLocalPoint,dangerLineY,advanceReflectedX,simulateReflectedPath,selectNearestAttachment,collectOverlappingCells,attachmentCandidatesFromCollisions,classifyAttachment,pressureLimit,resetPressureState,nextPressureState});
});
