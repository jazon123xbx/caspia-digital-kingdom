/* Royal Arcade audio: original synthesised SFX and optional soft ambience.
   Gameplay never depends on audio. Browser autoplay unlocks on user interaction. */
(function(root){'use strict';
 const STORAGE='caspia-royal-audio-v1';
 let prefs={enabled:true,music:false,volume:.58};
 try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');if(saved&&typeof saved==='object')prefs={...prefs,...saved}}catch{}
 let ctx=null,master=null,ambience=null,noise=null;
 const cooldowns={wall:115,click:80,shot:95,shoot:95,match:115,pop:115,swap:150,danger:1200,'boss-attack':900,'weak-shift':480};
 const lastPlayed=new Map();let voices=0;const maxVoices=13;
 function save(){try{localStorage.setItem(STORAGE,JSON.stringify(prefs))}catch{}}
 function init(){const C=root.AudioContext||root.webkitAudioContext;if(!C)return false;if(!ctx){ctx=new C();master=ctx.createGain();master.gain.value=0.2*prefs.volume;master.connect(ctx.destination)}if(ctx.state==='suspended')ctx.resume().catch(()=>{});return true}
 function tone(freq,when,dur,opts={}){
  if(!ctx||voices>=maxVoices)return;voices++;
  const osc=ctx.createOscillator(),env=ctx.createGain(),filter=opts.filter?ctx.createBiquadFilter():null;
  osc.type=opts.wave||'sine';osc.frequency.setValueAtTime(Math.max(50,freq),when);
  if(opts.end)osc.frequency.exponentialRampToValueAtTime(Math.max(45,opts.end),when+dur);
  if(opts.filter){filter.type='lowpass';filter.frequency.value=opts.filter;osc.connect(filter);filter.connect(env)}else osc.connect(env);
  env.gain.setValueAtTime(.0001,when);env.gain.exponentialRampToValueAtTime(Math.max(.0003,opts.vol||.12),when+.012);
  env.gain.exponentialRampToValueAtTime(.0001,when+dur);
  env.connect(master);osc.onended=()=>{voices=Math.max(0,voices-1);try{osc.disconnect();env.disconnect();filter?.disconnect()}catch{}};osc.start(when);osc.stop(when+dur+.025)
 }
 function noiseBurst(when,dur,opts={}){
  if(!ctx||voices>=maxVoices)return;
  if(!noise){const length=Math.ceil(ctx.sampleRate*.24);noise=ctx.createBuffer(1,length,ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<length;i++)data[i]=Math.random()*2-1}
  voices++;const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=noise;
  filter.type=opts.filterType||'lowpass';filter.frequency.value=opts.cutoff||1700;
  gain.gain.setValueAtTime(opts.vol||.07,when);gain.gain.exponentialRampToValueAtTime(.0001,when+dur);
  src.connect(filter).connect(gain).connect(master);src.onended=()=>{voices=Math.max(0,voices-1);try{src.disconnect();filter.disconnect();gain.disconnect()}catch{}};src.start(when);src.stop(when+Math.min(dur,.23));
 }
 function notes(freqs,when,gap,dur,vol=.12,wave='sine'){freqs.forEach((n,i)=>tone(n,when+i*gap,dur,{vol,wave,end:n*1.045}))}
 function play(name){
  if(!prefs.enabled||document.hidden)return false;
  const now=performance.now();const cd=cooldowns[name]||0;
  if(cd&&now-(lastPlayed.get(name)||-1e6)<cd)return false;
  if(!init())return false;lastPlayed.set(name,now);
  const t=ctx.currentTime+.008;
  try{switch(name){
   case 'click':tone(710,t,.075,{vol:.06,end:900});break;
   case 'shoot':case 'shot':tone(380,t,.16,{wave:'triangle',vol:.18,end:190});tone(950,t+.035,.12,{vol:.08,end:530});noiseBurst(t,.095,{cutoff:1900,vol:.1});break;
   case 'wall':tone(860,t,.08,{vol:.055,end:1120});break;
   case 'land':tone(510,t,.09,{vol:.06,end:430});break;
   case 'swap':notes([440,660],t,.08,.14,.075);break;
   case 'pop':case 'match':notes([585,780,1050],t,.055,.2,.1);noiseBurst(t,.095,{cutoff:3000,vol:.05});break;
   case 'combo':notes([587,740,880,1174],t,.075,.24,.13);break;
   case 'fall':notes([880,665,530],t,.052,.12,.045);break;
   case 'stage':notes([392,494,587,784],t,.11,.26,.105);break;
   case 'shield':notes([660,880,1047,1320],t,.06,.22,.13);noiseBurst(t,.17,{cutoff:4100,vol:.07});break;
   case 'hit':tone(245,t,.34,{wave:'sawtooth',end:100,vol:.14,filter:1100});noiseBurst(t,.18,{cutoff:1050,vol:.14});tone(780,t+.09,.16,{end:330,vol:.08});break;
   case 'boss-jelly':tone(790,t,.4,{wave:'triangle',end:240,vol:.13});tone(1060,t+.09,.28,{wave:'sawtooth',end:330,vol:.06,filter:2300});break;
   case 'boss-crab':noiseBurst(t,.20,{cutoff:560,vol:.18});tone(160,t,.42,{wave:'triangle',end:72,vol:.16});break;
   case 'boss-core':tone(200,t,.62,{wave:'sawtooth',end:84,vol:.1,filter:850});tone(620,t+.08,.36,{vol:.10,end:290});break;
   case 'weak-shift':tone(1140,t,.12,{vol:.045,end:930});break;
   case 'danger':notes([455,310,220],t,.14,.21,.14,'triangle');break;
   case 'lose':notes([440,370,280,198],t,.19,.35,.105,'triangle');break;
   case 'win':notes([523,659,784,1047,1175,1568],t,.13,.36,.13);break;
   case 'rescue':notes([392,523,659,784,1047,1319,1568,2093],t,.21,.56,.15);break;
   case 'snap-cheer':notes([740,930],t,.07,.15,.06);break;
   case 'caspia-hope':notes([880,1175],t,.09,.19,.05);break;
   default:tone(640,t,.09,{vol:.06,end:800})}
  }catch{return false}return true
 }
 function stopAmbience(){if(ambience){ambience.forEach(n=>{try{if(typeof n.stop==='function')n.stop()}catch{}try{n.disconnect()}catch{}});ambience=null}}
 function updateAmbience(){stopAmbience();if(!prefs.music||!prefs.enabled||document.hidden||!ctx)return;ambience=[];[110,164.81,220].forEach((freq,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.value=.009/(1+i*.7);o.connect(g).connect(master);o.start();ambience.push(o,g)});}
 function setEnabled(value){prefs.enabled=!!value;save();if(!prefs.enabled)stopAmbience();else if(init())updateAmbience();return getSettings()}
 function setMusic(value){prefs.music=!!value;save();if(init())updateAmbience();return getSettings()}
 function setVolume(value){prefs.volume=Math.min(1,Math.max(0,Number(value)||0));save();if(master)master.gain.setTargetAtTime(.2*prefs.volume,ctx.currentTime,.04);return getSettings()}
 function getSettings(){return {...prefs,activeVoices:voices}}
 function suspend(){stopAmbience()}
 function resume(){if(prefs.music&&prefs.enabled&&init())updateAmbience()}
 root.CaspiaAudio=Object.freeze({play,init,setEnabled,setMusic,setVolume,getSettings,suspend,resume});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else if(ctx&&ctx.state==='running')resume()});
})(window);
