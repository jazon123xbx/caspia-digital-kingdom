/* Caspia Boss Encounters — visual-only, framework-free module.
   Does NOT control HP, grid, collision, timers, progress, or damage. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CaspiaBosses = api;
})(typeof globalThis !== 'undefined' ? globalThis : null, function () {
  'use strict';
  const BOSSES = Object.freeze({
    jelly: Object.freeze({id:'jelly', level:4, name:'Jellyfish Guardian', epithet:'The Tidebound Sovereign', hp:3, color:'#bb83ff', attack:'ELECTRIC TIDE',
      intro:'A graceful tyrant guarding the first passage.',
      lines:Object.freeze({intro:'A tiny shrimp dares enter my waters?',attack:'The current obeys ME!',hit:'My light… you broke through?',shield:'My veil will not fall!',defeat:'The tide… has turned…'}),
      images:Object.freeze({idle:'jelly-idle.webp',attack:'jelly-attack.webp',hit:'jelly-hit.webp',defeat:'jelly-defeat.webp'})}),
    crab: Object.freeze({id:'crab', level:7, name:'Armored Crab', epithet:'The Iron Reef Warden', hp:4, color:'#ff9474', attack:'CORAL CRUSH',
      intro:'An unyielding giant in enchanted reef armor.',
      lines:Object.freeze({intro:'No one passes these palace gates.',attack:'FEEL THE WEIGHT OF THE REEF!',hit:'You cracked my armor?!',shield:'My shell cannot be broken!',defeat:'Impossible… my armor…'}),
      images:Object.freeze({idle:'crab-idle.webp',attack:'crab-attack.webp',hit:'crab-hit.webp',defeat:'crab-defeat.webp'})}),
    core: Object.freeze({id:'core', level:10, name:'Enchanted Pearl Core', epithet:'The Final Prison', hp:5, color:'#8de3ff', attack:'ABYSSAL SURGE',
      intro:'The spell imprisoning Princess Caspia.',
      lines:Object.freeze({intro:'Her kingdom belongs to the abyss.',attack:'THE PRISON WILL NEVER BREAK!',hit:'The seal is cracking!',shield:'The pearl is eternal.',defeat:'The spell… is shattered…'}),
      images:Object.freeze({idle:'core-idle.webp',attack:'core-attack.webp',hit:'core-hit.webp',defeat:'core-defeat.webp'})})
  });
  const POSES = new Set(['idle','attack','hit','defeat']);
  const EVENTS = new Set(['attack','hit','shield','break','defeat','reset']);
  function clamp(n,min,max) { return Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min)); }
  function describe(type, hp, maxHp, exposed, defeated) {
    if (defeated || hp <= 0) return 'DEFEATED';
    if (exposed) return 'WEAK POINT EXPOSED';
    return hp <= maxHp*.5 ? 'ENRAGED · SHIELDED' : 'SHIELD ACTIVE';
  }
  function create(options) {
    if (typeof document==='undefined') throw new Error('Boss visuals require a browser DOM');
    const opts = options || {};
    const host = typeof opts.mount==='string' ? document.querySelector(opts.mount) : opts.mount;
    if (!host) throw new Error('CaspiaBosses.create: mount element missing');
    const assetBase = opts.assetBase === undefined ? 'assets/bosses/' : opts.assetBase;
    const wrap = document.createElement('div');
    wrap.className = 'cb-stage';
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML = '<div class="cb-aura cb-aura--outer"></div><div class="cb-aura cb-aura--inner"></div>'+
      '<div class="cb-runering cb-runering--one"></div><div class="cb-runering cb-runering--two"></div>'+
      '<div class="cb-sentinel cb-sentinel--left"></div><div class="cb-sentinel cb-sentinel--right"></div>'+
      '<div class="cb-boss-image"><img class="cb-sprite cb-sprite--a is-active" alt="" draggable="false"><img class="cb-sprite cb-sprite--b" alt="" draggable="false"></div>'+
      '<div class="cb-weakspot"></div><div class="cb-ripples"></div><div class="cb-fracture"></div><div class="cb-ground"></div>'+
      '<div class="cb-dust" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
    host.replaceChildren(wrap);
    const sprites = Array.from(wrap.querySelectorAll('.cb-sprite'));
    const weakspot = wrap.querySelector('.cb-weakspot');
    const showWeakspot = opts.showWeakspot !== false; // production should normally use the engine's exact canvas target
    const state = {type:'jelly',hp:3,maxHp:3,exposed:false,defeated:false,pose:'idle'};
    let active = 0, imageSeq = 0, effectTimer = 0, poseTimer = 0, disposed = false;
    function assetURL(f) { return (typeof window!=='undefined' && window.CASPIA_BOSS_EMBEDDED_ASSETS && window.CASPIA_BOSS_EMBEDDED_ASSETS[f]) || assetBase+f; }
    function warmImages(config) {
      // Keep preloading bounded to four small, optimized images.
      if (typeof Image==='undefined') return;
      for (const f of Object.values(config.images)) { const preload=new Image(); preload.src=assetURL(f); }
    }
    function imageForPose() { return BOSSES[state.type].images[state.pose] || BOSSES[state.type].images.idle; }
    function showImage(immediate) {
      const path=assetURL(imageForPose());
      if (immediate) { sprites[0].src=path; sprites[0].classList.add('is-active'); sprites[1].classList.remove('is-active'); active=0; return; }
      if (sprites[active].getAttribute('src')===path) return;
      const next=1-active, token=++imageSeq, img=sprites[next];
      let activated=false; // onload and the cached-image fast path may BOTH run.
      const activate=()=>{
        if(activated || disposed || token!==imageSeq) return;
        activated=true;
        img.onload=null; img.onerror=null;
        sprites[active].classList.remove('is-active');
        img.classList.add('is-active');
        active=next;
      };
      img.onload=activate;
      img.onerror=()=>{ if(token===imageSeq) console.warn('Caspia boss image not found:',path); };
      img.src=path;
      if(img.complete && img.naturalWidth>0) activate();
    }
    function paint() {
      const config=BOSSES[state.type];
      wrap.dataset.boss=state.type;
      wrap.dataset.pose=state.pose;
      wrap.dataset.phase=state.defeated?'defeated':(state.hp<=state.maxHp*.5?'enraged':'normal');
      wrap.dataset.exposed=String(state.exposed&&!state.defeated);
      wrap.style.setProperty('--cb-glow',config.color);
      weakspot.hidden=!showWeakspot||!state.exposed||state.defeated;
      showImage(false);
    }
    function setBoss(type, snapshot) {
      if (!Object.prototype.hasOwnProperty.call(BOSSES,type)) throw new Error('Unknown boss: '+type);
      window.clearTimeout(effectTimer); window.clearTimeout(poseTimer);
      wrap.classList.remove('cb-fx-attack','cb-fx-hit','cb-fx-shield','cb-fx-break','cb-fx-defeat');
      const cfg=BOSSES[type];
      Object.assign(state,{type,hp:cfg.hp,maxHp:cfg.hp,exposed:false,defeated:false,pose:'idle'});
      warmImages(cfg);
      if(snapshot) update(snapshot);
      else paint();
      return getState();
    }
    function update(data) {
      if(!data || typeof data!=='object') return getState();
      if (data.type && data.type!==state.type) return setBoss(data.type,data);
      if (data.maxHp!==undefined) state.maxHp=clamp(data.maxHp,1,99);
      if (data.hp!==undefined) state.hp=clamp(data.hp,0,state.maxHp);
      if (data.exposed!==undefined) state.exposed=Boolean(data.exposed);
      if (data.defeated!==undefined) state.defeated=Boolean(data.defeated);
      if (state.hp<=0) state.defeated=true;
      if (state.defeated) {state.pose='defeat';state.exposed=false;}
      else if (data.pose && POSES.has(data.pose)) state.pose=data.pose;
      else if (data.pose==='idle') state.pose='idle';
      paint();
      return getState();
    }
    function trigger(event) {
      if (!EVENTS.has(event)) throw new Error('Unknown boss effect: '+event);
      if (event==='reset') { setBoss(state.type); return; }
      // Shield renewal can arrive while a hit reaction is playing.
      // It must NOT cancel the hit-to-idle timer, or the hurt pose sticks forever.
      const poseEvent=(event==='attack'||event==='hit'||event==='defeat');
      window.clearTimeout(effectTimer);
      if(poseEvent)window.clearTimeout(poseTimer);
      wrap.classList.remove('cb-fx-attack','cb-fx-hit','cb-fx-shield','cb-fx-break','cb-fx-defeat');
      void wrap.offsetWidth;
      wrap.classList.add('cb-fx-'+event);
      if (event==='attack'&&!state.defeated) state.pose='attack';
      if (event==='hit'&&!state.defeated) state.pose='hit';
      if (event==='defeat') {state.pose='defeat';state.hp=0;state.defeated=true;state.exposed=false;}
      if (event==='break') state.exposed=true;
      if (event==='shield') state.exposed=false;
      paint();
      effectTimer=window.setTimeout(()=>wrap.classList.remove('cb-fx-'+event),1100);
      if(event==='attack'||event==='hit') {
        const eventPose=state.pose;
        // Give damage an expressive 1.6s reaction; attacks last 1.2s.
        const delay=event==='hit'?1600:1200;
        poseTimer=window.setTimeout(()=>{
          if(!disposed&&!state.defeated&&state.pose===eventPose){state.pose='idle';paint();}
        },delay);
      }
      return getState();
    }
    function getState() { return Object.freeze({...state, status:describe(state.type,state.hp,state.maxHp,state.exposed,state.defeated)}); }
    function destroy(){disposed=true;window.clearTimeout(effectTimer);window.clearTimeout(poseTimer);imageSeq++;wrap.remove();}
    setBoss(opts.type && BOSSES[opts.type] ? opts.type : 'jelly');
    return Object.freeze({setBoss,update,trigger,getState,destroy});
  }
  return Object.freeze({BOSSES,create,clamp,describe});
});
