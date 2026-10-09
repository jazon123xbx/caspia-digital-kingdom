/* Caspia Character + Pearl Visual Kit v1.0 — presentation only, no replacement physics. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CaspiaCharacterFX = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const PALETTE = Object.freeze({ pink: '#f46ba8', cyan: '#53d9f5', violet: '#b28cf9', gold: '#f5c66e', mint: '#6bdcbd' });
  const CASPIA = Object.freeze({ idle: 'caspia-idle.webp', hopeful: 'caspia-hopeful.webp', worried: 'caspia-worried.webp', scared: 'caspia-scared.webp', surprised: 'caspia-surprised.webp', trapped: 'caspia-trapped.webp', victory: 'caspia-victory.webp' });
  const SNAP = Object.freeze({ idle: 'snap-idle.webp', aim: 'snap-aim.webp', charge: 'snap-charge.webp', fire: 'snap-fire.webp', recoil: 'snap-recoil.webp', determined: 'snap-determined.webp', worried: 'snap-worried.webp', win: 'snap-win.webp' });
  const LINE = Object.freeze({
    'level-start': ['idle', 'Snap… can you hear me? I’m counting on you!'],
    'good-shot': ['hopeful', 'Great shot! Keep going!'],
    'match': ['hopeful', 'Beautiful! The magic is weakening!'],
    'combo': ['hopeful', 'That was amazing, Snap!'],
    'miss': ['worried', 'We can do this. Try another angle!'],
    'danger': ['scared', 'Snap! The pearls are getting too close!'],
    'boss-attack': ['scared', 'Look out! The guardian is attacking!'],
    'boss-hit': ['hopeful', 'Yes! You broke through its defense!'],
    'defeat': ['worried', 'Please don’t give up on me…'],
    'victory': ['victory', 'I’m free! Thank you, Snap!']
  });
  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const clamp = (num, lo, hi) => Math.min(hi, Math.max(lo, Number(num) || 0));
  function imagePath(base, name) {
    if (typeof window !== 'undefined' && window.CASPIA_CHARACTER_EMBEDDED_ASSETS && hasOwn(window.CASPIA_CHARACTER_EMBEDDED_ASSETS, name)) return window.CASPIA_CHARACTER_EMBEDDED_ASSETS[name];
    return base + name;
  }
  function createPearl(color, options) {
    const opts = options || {};
    const name = hasOwn(PALETTE, color) ? color : 'cyan';
    const el = document.createElement('span');
    el.className = 'ck-pearl' + (opts.className ? ' ' + opts.className : '');
    el.dataset.color = name;
    el.style.setProperty('--ck-pearl-color', PALETTE[name]);
    if (opts.size) el.style.setProperty('--ck-pearl-size', (Number(opts.size) || 32) + 'px');
    if (opts.label) { el.setAttribute('role', 'img'); el.setAttribute('aria-label', opts.label); }
    else el.setAttribute('aria-hidden', 'true');
    const sheen = document.createElement('i'); sheen.className = 'ck-pearl-sheen'; el.appendChild(sheen);
    return el;
  }
  function setPearlColor(el, name) {
    if (!el || !hasOwn(PALETTE, name)) return false;
    el.dataset.color = name; el.style.setProperty('--ck-pearl-color', PALETTE[name]); return true;
  }
  // For canvas-based shooters: paints the same magical-pearl style without changing physics.
  function drawPearl(ctx, x, y, radius, color, options) {
    const opts = options || {};
    const r = Math.max(1, Number(radius) || 1);
    const pigment = hasOwn(PALETTE, color) ? PALETTE[color] : PALETTE.cyan;
    if (!ctx || typeof ctx.arc !== 'function' || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath();
    ctx.shadowColor = pigment; ctx.shadowBlur = opts.glow === false ? 0 : r * .55;
    const body = ctx.createRadialGradient(x-r*.42,y-r*.53,r*.04,x+r*.29,y+r*.26,r*1.24);
    body.addColorStop(0,'rgba(255,255,255,.98)');
    body.addColorStop(.15,'rgba(255,255,255,.73)');
    body.addColorStop(.41,pigment);
    body.addColorStop(.70,pigment);
    body.addColorStop(1,'rgba(9,28,79,.96)');
    ctx.fillStyle = body; ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth=Math.max(.8,r*.085);ctx.strokeStyle='rgba(231,252,255,.85)';ctx.stroke();
    const shine=ctx.createRadialGradient(x-r*.31,y-r*.48,0,x-r*.31,y-r*.48,r*.48);
    shine.addColorStop(0,'rgba(255,255,255,.92)');shine.addColorStop(.25,'rgba(255,255,255,.68)');shine.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=shine;ctx.beginPath();ctx.ellipse(x-r*.26,y-r*.34,r*.29,r*.18,-.40,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.72)';ctx.beginPath();ctx.arc(x+r*.43,y+r*.38,r*.085,0,Math.PI*2);ctx.fill();
    ctx.restore();return true;
  }
  function checkedMount(node, label) {
    if (typeof node === 'string') node = document.querySelector(node);
    if (!node || node.nodeType !== 1) throw new Error('CaspiaCharacterFX missing ' + label + ' element');
    return node;
  }
  class Director {
    constructor(options) {
      const opts = options || {};
      this.host = {
        portrait: checkedMount(opts.portrait, 'portrait'),
        prison: checkedMount(opts.prison, 'prison'),
        snap: checkedMount(opts.snap, 'snap'),
        effects: checkedMount(opts.effects, 'effects')
      };
      this.assetBase = opts.assetBase || 'assets/characters/';
      this.state = { caspia: 'idle', snap: 'idle', prison: 'sealed', loaded: 'cyan', next: 'pink', angle: 0, facing: 'right', dialogue: 'Snap… can you hear me? I’m counting on you!' };
      this.timers = new Set();
      this._disposers = [];
      this._mount();
    }
    _src(name) { return imagePath(this.assetBase, name); }
    _timer(fn, ms) {
      const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms);
      this.timers.add(id); return id;
    }
    _mount() {
      this.host.portrait.classList.add('ck-portrait');
      this.host.portrait.innerHTML = '<div class="ck-portrait-image"><span class="ck-portrait-aura"></span><img class="ck-caspia-face" alt="Princess Caspia reacting to the rescue" /></div><div class="ck-portrait-heading"><span class="ck-speaker-dot"></span><span>PRINCESS CASPIA</span><span class="ck-mood">HOPEFUL</span></div><p class="ck-caspia-dialogue" aria-live="polite"></p>';
      this.host.prison.classList.add('ck-prison');
      this.host.prison.innerHTML = '<div class="ck-prison-halo"></div><div class="ck-prison-ring ck-prison-ring-one"></div><div class="ck-prison-ring ck-prison-ring-two"></div><div class="ck-prison-globe"><div class="ck-prison-coreglow"></div><img class="ck-prison-caspia" alt="Caspia inside a magical prison bubble" /><span class="ck-prison-shine"></span><span class="ck-prison-seal">✦</span></div><div class="ck-prison-caption">ENCHANTED PRISON <strong>RESCUE CASPIA</strong></div>';
      this.host.snap.classList.add('ck-snap-host');
      this.host.snap.innerHTML = '<div class="ck-snap-shadow"></div><div class="ck-snap-shell"><img class="ck-snap-image" alt="Snap the pink pistol shrimp aiming with his giant aqua claw" /><span class="ck-snap-muzzle-glow"></span><span class="ck-snap-loaded"></span><span class="ck-snap-flash"></span></div><span class="ck-snap-name">SNAP <small>THE PEARL GUARDIAN</small></span>';
      this.host.effects.classList.add('ck-effects-host');
      this.caspiaImg = this.host.portrait.querySelector('.ck-caspia-face');
      this.prisonImg = this.host.prison.querySelector('.ck-prison-caspia');
      this.snapImg = this.host.snap.querySelector('.ck-snap-image');
      this.snapShell = this.host.snap.querySelector('.ck-snap-shell');
      this.dialogue = this.host.portrait.querySelector('.ck-caspia-dialogue');
      this.mood = this.host.portrait.querySelector('.ck-mood');
      this.loadedSlot = this.host.snap.querySelector('.ck-snap-loaded');
      this.loadedSlot.appendChild(createPearl(this.state.loaded, { size: 30, className: 'ck-loaded-orb' }));
      this.setCaspia('idle', this.state.dialogue);
      this.setSnap('idle');
      this.setPrison('sealed');
    }
    setCaspia(state, text) {
      const key = hasOwn(CASPIA, state) ? state : 'idle';
      this.state.caspia = key;
      this.caspiaImg.src = this._src(CASPIA[key]);
      this.host.portrait.dataset.reaction = key;
      this.mood.textContent = key.toUpperCase();
      if (typeof text === 'string' && text) { this.state.dialogue = text; this.dialogue.textContent = text; }
      this.host.portrait.classList.remove('ck-pop');
      void this.host.portrait.offsetWidth;
      this.host.portrait.classList.add('ck-pop');
      return this;
    }
    setPrison(state) {
      const key = ['sealed', 'danger', 'cracking', 'released'].includes(state) ? state : 'sealed';
      this.state.prison = key;
      this.host.prison.dataset.state = key;
      this.prisonImg.src = this._src(CASPIA[key === 'danger' ? 'scared' : key === 'released' ? 'victory' : 'trapped']);
      return this;
    }
    setSnap(state) {
      const key = hasOwn(SNAP, state) ? state : 'idle';
      this.state.snap = key;
      this.snapImg.src = this._src(SNAP[key]);
      this.host.snap.dataset.state = key;
      return this;
    }
    setAim(deg) {
      const angle = clamp(deg, -80, 80);
      this.state.angle = angle;
      // Keep screen-space aiming stable: flip only for left-facing, then apply a positive tilt magnitude.
      const left = angle < -5;
      this.state.facing = left ? 'left' : 'right';
      this.host.snap.dataset.facing = this.state.facing;
      const tilt = clamp(Math.abs(angle) * 0.16, 0, 13);
      this.snapShell.style.setProperty('--ck-aim-tilt', tilt + 'deg');
      if (['idle', 'aim'].includes(this.state.snap)) this.setSnap('aim');
      return this;
    }
    setAmmo(loaded, next) {
      if (hasOwn(PALETTE, loaded)) this.state.loaded = loaded;
      if (hasOwn(PALETTE, next)) this.state.next = next;
      setPearlColor(this.loadedSlot.querySelector('.ck-pearl'), this.state.loaded);
      return this;
    }
    playFire() {
      this.setSnap('charge');
      this._timer(() => {
        this.setSnap('fire');
        this.host.snap.classList.add('ck-firing');
        this._timer(() => { this.setSnap('recoil'); this.host.snap.classList.remove('ck-firing'); }, 135);
        this._timer(() => { if (this.state.snap === 'recoil') this.setSnap('aim'); }, 470);
      }, 120);
      return this;
    }
    trigger(type, extra) {
      const opts = extra || {};
      if (type === 'shot') { this.playFire(); return this; }
      if (type === 'aim') { this.setAim(opts.angle || 0); return this; }
      if (type === 'swap') { this.setAmmo(this.state.next, this.state.loaded); this.setSnap('charge'); this._timer(() => this.setSnap('aim'), 300); return this; }
      if (type === 'warning') { this.setPrison('danger'); this.setSnap('worried'); this.setCaspia('worried', 'Snap, please be careful!'); return this; }
      if (type === 'rescue') type = 'victory';
      if (hasOwn(LINE, type)) {
        const [reaction, line] = LINE[type];
        this.setCaspia(reaction, typeof opts.line === 'string' ? opts.line : line);
      }
      if (type === 'danger' || type === 'boss-attack') { this.setPrison('danger'); this.setSnap('determined'); }
      if (type === 'boss-hit') this.setPrison('cracking');
      if (type === 'victory') { this.setPrison('released'); this.setSnap('win'); }
      if (type === 'defeat') { this.setPrison('danger'); this.setSnap('worried'); }
      if (type === 'level-start') { this.setPrison('sealed'); this.setSnap('idle'); }
      return this;
    }
    burstAt(x, y, color, options) {
      const opts = options || {};
      const c = hasOwn(PALETTE, color) ? color : 'cyan';
      const hostRect = this.host.effects.getBoundingClientRect();
      let px = Number(x), py = Number(y);
      if (opts.clientCoordinates) { px -= hostRect.left; py -= hostRect.top; }
      if (!Number.isFinite(px) || !Number.isFinite(py)) return;
      const pulse = document.createElement('span');
      pulse.className = 'ck-impact-ring';
      pulse.style.cssText = `left:${px}px;top:${py}px;--impact-color:${PALETTE[c]}`;
      this.host.effects.appendChild(pulse);
      this._timer(() => pulse.remove(), 650);
      const count = Math.min(24, Math.max(6, opts.count || 12));
      for (let i = 0; i < count; i++) {
        const p = document.createElement('i'); p.className = 'ck-spark-particle';
        const a = (i / count) * Math.PI * 2 + Math.random() * .15;
        const radius = (opts.radius || 75) * (.62 + Math.random() * .6);
        p.style.cssText = `left:${px}px;top:${py}px;--dx:${Math.cos(a)*radius}px;--dy:${Math.sin(a)*radius}px;--spark:${PALETTE[c]};--delay:${Math.round(Math.random()*80)}ms`;
        this.host.effects.appendChild(p);
        this._timer(() => p.remove(), 950);
      }
      return this;
    }
    // Showcase-only flight. Real game physics/projectiles remain owned by js/game.js.
    demoFlight(pathClientPoints, color, onDone) {
      const rect = this.host.effects.getBoundingClientRect();
      const raw = Array.isArray(pathClientPoints) ? pathClientPoints : [];
      const points = raw.length >= 2 ? raw.map(pt => ({ x: pt.x - rect.left, y: pt.y - rect.top })) : null;
      if (!points) return this;
      const pearl = createPearl(color || this.state.loaded, { size: 30, className: 'ck-flight-pearl' });
      this.host.effects.appendChild(pearl);
      const segments = [];
      let total = 0;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        if (len > 0.1) { segments.push({ a, b, len }); total += len; }
      }
      if (!segments.length || total <= 0) { pearl.remove(); return this; }
      const duration = Math.max(360, Math.min(900, total * 1.35));
      const start = performance.now();
      let raf = null; let lastSpark = 0;
      const pointAt = (distance) => {
        let covered = 0;
        for (const seg of segments) {
          if (covered + seg.len >= distance) {
            const local = (distance - covered) / seg.len;
            return { x: seg.a.x + (seg.b.x - seg.a.x) * local, y: seg.a.y + (seg.b.y - seg.a.y) * local };
          }
          covered += seg.len;
        }
        return segments[segments.length - 1].b;
      };
      const tick = (now) => {
        const t = clamp((now - start) / duration, 0, 1);
        const eased = t * t * (0.35 + 0.65 * t);
        const pos = pointAt(total * eased);
        pearl.style.left = pos.x + 'px'; pearl.style.top = pos.y + 'px';
        if (now - lastSpark > 38) {
          lastSpark = now;
          const s = document.createElement('i'); s.className = 'ck-trail-dot';
          s.style.cssText = `left:${pos.x}px;top:${pos.y}px;--spark:${PALETTE[color] || PALETTE.cyan}`;
          this.host.effects.appendChild(s); this._timer(() => s.remove(), 370);
        }
        if (t < 1) raf = requestAnimationFrame(tick);
        else {
          pearl.remove();
          const end = segments[segments.length - 1].b;
          this.burstAt(end.x, end.y, color, {count:16, radius:75});
          if (typeof onDone === 'function') onDone(end);
        }
      };
      raf = requestAnimationFrame(tick);
      this._disposers.push(() => { if (raf != null) cancelAnimationFrame(raf); pearl.remove(); });
      return this;
    }
    getAimOriginClientPoint() {
      const shell = this.snapShell.getBoundingClientRect();
      return { x: shell.left + shell.width * 0.5, y: shell.top + shell.height * 0.63 };
    }
    getMuzzleClientPoint() {
      const claw = this.snapShell.getBoundingClientRect();
      const facingLeft = this.state.facing === 'left';
      return { x: claw.left + claw.width * (facingLeft ? .24 : .76), y: claw.top + claw.height * .50 };
    }
    getState() { return Object.assign({}, this.state); }
    destroy() {
      for (const t of this.timers) clearTimeout(t);
      this.timers.clear();
      this._disposers.forEach(fn => fn()); this._disposers = [];
      Object.values(this.host).forEach(el => { el.innerHTML = ''; });
    }
  }
  return Object.freeze({ PALETTE, CASPIA, SNAP, LINE, createPearl, setPearlColor, drawPearl, Director });
});
