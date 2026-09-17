'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8');
const fn=source.slice(source.indexOf('  function createYardDog()'),source.indexOf('  function applyBreedArt()'));
let next,now=1;const handlers={};
const sprite={style:{},clientWidth:96};
const actor={style:{},clientWidth:96,dataset:{walkStride:104/256,walkDuration:1.2,loopFps:20,transitionFps:20},classList:{add(){},remove(){}}};
for(const state of ['walk','idle','sitdown','sit','standup','reaction']){actor.dataset[state+'Src']=state+'.png';actor.dataset[state+'Frames']=state==='sitdown'||state==='standup'?12:24}
const stage={clientWidth:360,addEventListener(k,v){handlers[k]=v},removeEventListener(k){delete handlers[k]}};
const sandbox={$:s=>({'#dogActor':actor,'#dogSprite':sprite,'#mine-btn':stage}[s]),window:{matchMedia:()=>({matches:false})},document:{visibilityState:'visible'},performance:{now:()=>now},destroyed:false,requestAnimationFrame:f=>{next=f;return 1},cancelAnimationFrame(){},Math,Number,String};
vm.createContext(sandbox);vm.runInContext(fn+';this.dog=createYardDog();',sandbox);sandbox.dog.start();
function tick(ms=50){now+=ms;next(now)}
tick();const start=parseFloat(actor.style.transform.match(/\(([^p]+)/)[1]);for(let i=0;i<20;i++)tick();const end=parseFloat(actor.style.transform.match(/\(([^p]+)/)[1]);assert(Math.abs(end-start-32.5)<.2,'distance matches authored stride and cycle');
for(let i=0;i<160;i++){tick();const x=parseFloat(actor.style.transform.match(/\(([^p]+)/)[1]);assert(x>=8&&x<=162,'actor remains within yard')}
const modes=new Set();for(let i=0;i<800;i++){tick();modes.add(actor.dataset.mode);assert(sprite.style.backgroundImage.includes(actor.dataset.mode==='approach'?'walk':actor.dataset.mode),'correct sheet for each state')}
for(const state of ['walk','sitdown','sit','standup','idle'])assert(modes.has(state),'visits '+state);
while(actor.dataset.mode!=='sit')tick();handlers['dog:react']();assert.equal(actor.dataset.mode,'sit','click does not pop seated dog to standing');
actor.dataset.walkSrc='new-breed.png';tick();assert.equal(actor.dataset.mode,'walk');assert(sprite.style.backgroundImage.includes('new-breed'),'breed switch resets sheet');
sandbox.document.visibilityState='hidden';const held=actor.style.transform;tick(3000);assert.equal(actor.style.transform,held);sandbox.document.visibilityState='visible';tick();assert.equal(actor.style.transform,held,'no catch-up jump after hidden tab');
sandbox.window.matchMedia=()=>({matches:true});tick();assert.equal(actor.dataset.mode,'sit');assert.equal(sprite.style.backgroundPosition,'0px 0');sandbox.dog.stop();console.log('dog animation: stride, bounds, states, breed switch, seated click, tab pause, reduced motion OK');
