'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8');
const fn=source.slice(source.indexOf('  function createYardDog()'),source.indexOf('  function applyBreedArt()'));
let next,now=1;const handlers={};
const sprite={style:{},dataset:{},clientWidth:96};
const bg={clientHeight:330,dataset:{walkLeft:.30,walkRight:.80,sourceWidth:1536,sourceHeight:1024}};
const images=[];class FakeImage{set src(value){this.url=value;images.push(this);this.onload()}}
const actor={style:{},clientWidth:96,dataset:{walkStride:104/256,walkDuration:1.2,loopFps:20,transitionFps:20},classList:{add(){},remove(){}}};
for(const state of ['walk','idle','sitdown','sit','standup','reaction']){actor.dataset[state+'Src']=state+'.png';actor.dataset[state+'Frames']=state==='sitdown'||state==='standup'?12:24}
const stage={clientWidth:360,clientHeight:260,querySelector(){return null},addEventListener(k,v){handlers[k]=v},removeEventListener(k){delete handlers[k]}};
const sandbox={Image:FakeImage,getBreed:()=>Object.fromEntries(Object.entries(actor.dataset)),$: s=>({'#dogActor':actor,'#dogSprite':sprite,'#mine-btn':stage,'#yard-bg':bg}[s]),window:{matchMedia:()=>({matches:false})},document:{visibilityState:'visible'},performance:{now:()=>now},destroyed:false,requestAnimationFrame:f=>{next=f;return 1},cancelAnimationFrame(){},Math,Number,String};
vm.createContext(sandbox);vm.runInContext(fn+source.slice(source.indexOf('  function applyBreedArt()'),source.indexOf('  function applyYardArt()'))+';this.dog=createYardDog();',sandbox);sandbox.dog.start();
function tick(ms=50){now+=ms;next(now)}
tick();const start=parseFloat(actor.style.transform.match(/\(([^p]+)/)[1]);for(let i=0;i<20;i++)tick();const end=parseFloat(actor.style.transform.match(/\(([^p]+)/)[1]);assert(Math.abs(end-start-32.5)<.2,'distance matches authored stride and cycle');
for(let i=0;i<160;i++){tick();const x=parseFloat(actor.style.transform.match(/\(([^p]+)/)[1]);assert(x>=87&&x<=157.9,'actor stays between flowerpots and kennel')}
const modes=new Set();for(let i=0;i<800;i++){tick();modes.add(actor.dataset.mode);const before=JSON.stringify(sprite.style);sandbox.applyBreedArt();assert.equal(JSON.stringify(sprite.style),before,'UI refresh does not reset or replace animation frame');assert(sprite.style.backgroundImage.includes(actor.dataset.mode==='approach'?'walk':actor.dataset.mode),'correct sheet for each state')}
for(const state of ['walk','sitdown','sit','standup','idle'])assert(modes.has(state),'visits '+state);
for(let guard=0;actor.dataset.mode!=='sit'&&guard<600;guard++)tick();assert.equal(actor.dataset.mode,'sit');handlers['dog:react']();assert.equal(actor.dataset.mode,'sit','click does not pop seated dog to standing');
actor.dataset.walkSrc='new-breed.png';tick();assert.equal(actor.dataset.mode,'walk');assert(sprite.style.backgroundImage.includes('new-breed'),'breed switch resets sheet');
sandbox.document.visibilityState='hidden';const held=actor.style.transform;tick(3000);assert.equal(actor.style.transform,held);sandbox.document.visibilityState='visible';tick();assert.equal(actor.style.transform,held,'no catch-up jump after hidden tab');
// Resizing or changing scenery clamps all states, including seated states.
for(const width of [280,320,360,600])for(const area of [[.30,.80],[.28,.72],[.32,.82],[.37,.77]]){
 stage.clientWidth=width;bg.dataset.walkLeft=area[0];bg.dataset.walkRight=area[1];tick();
 const x=parseFloat(actor.style.transform.match(/\(([^p]+)/)[1]),scaled=Math.max(width/1536,330/1024)*1536,crop=(width-scaled)/2;
 assert(x>=crop+area[0]*scaled+5.8,'whole dog clears left decorations');
 assert(x+96<=crop+area[1]*scaled-5.8,'whole dog clears right decorations');
 assert(x>=0&&x+96<=width,'dog remains on screen after resize');
}
assert.equal(images.length,7,'six sheets preload once; only changed sheet reloads');
sandbox.window.matchMedia=()=>({matches:true});tick();assert.equal(actor.dataset.mode,'sit');assert.equal(sprite.style.backgroundPosition,'0px 0');sandbox.dog.stop();console.log('dog animation: stride, bounds, states, breed switch, seated click, tab pause, reduced motion OK');
