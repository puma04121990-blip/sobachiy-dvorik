'use strict';
(function(){
  const $=s=>document.querySelector(s),g=window.GameContent,key=window.DogTestTools.KEY,frame=$('#game');
  let api=null,generation=0,gameDocument='',lastSnapshot=null;
  function log(message,error=false){const li=document.createElement('li');li.textContent=new Date().toLocaleTimeString()+' · '+message;if(error)li.className='error';$('#log').prepend(li);while($('#log').children.length>150)$('#log').lastChild.remove()}
  window.DogAdminLog=message=>log(message,true);
  function options(target,items){target.replaceChildren();items.forEach(([value,name])=>{const o=document.createElement('option');o.value=value;o.textContent=name;target.append(o)})}
  options($('#breed'),Object.values(g.BREEDS).map(x=>[x.id,x.name]));
  options($('#yard'),Object.values(g.YARDS).map(x=>[x.id,x.name]));
  options($('#walk'),g.WALK_TIERS.map(x=>[x.id,x.name]));
  options($('#stat'),[['totalClicks','Почесушки'],['lifetimeBones','Всего заработано'],['upgradesBought','Покупки улучшений'],['eventsDone','Мини-игры'],['walksDone','Прогулки']]);
  function items(){const category=$('#group').value;const list=category==='levels'?Object.values(g.UPGRADES):category==='levelsCards'?g.SKILL_CARDS:g.TRAINING;options($('#item'),list.map(x=>[x.id,x.name]));updateLevel()}
  function updateLevel(){const category=$('#group').value,id=$('#item').value;const item=category==='levels'?g.UPGRADES[id]:category==='levelsCards'?g.SKILL_CARDS_BY_ID[id]:g.TRAINING.find(x=>x.id===id);$('#level').max=item.maxLevel||100;if(lastSnapshot)$('#level').value=lastSnapshot[category][id]||0}
  items();$('#group').onchange=items;$('#item').onchange=updateLevel;
  g.PACK_BRANCHES.forEach(p=>{const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.dataset.pack=p.id;label.append(document.createTextNode('Тест покупки: '+(p.name||p.id)),check);check.onchange=()=>run('pack',{id:p.id,enabled:check.checked});$('#packs').append(label)});
  [['noAds','Без рекламы'],['vipTreats','VIP-лакомства']].forEach(([id,name])=>{const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.dataset.entitlement=id;label.append(document.createTextNode('Тест покупки: '+name),check);check.onchange=()=>run('entitlement',{id,enabled:check.checked});$('#packs').append(label)});
  const stageOption=document.createElement('option');stageOption.value='yardStage';stageOption.textContent='Уровень двора';$('#resource').append(stageOption);
  function refresh(){if(!api)return;const s=api.snapshot();lastSnapshot=s;$('#metrics').textContent='Косточки: '+Math.floor(s.ore).toLocaleString()+' · Энергия: '+Math.round(s.energy)+' · Прогулки: '+s.stats.walksDone+' · Мини-игры: '+s.stats.eventsDone;$('#state-json').textContent=JSON.stringify(s,null,2);$('#breed').value=s.selectedBreed;$('#yard').value=s.selectedYard;document.querySelectorAll('[data-pack]').forEach(c=>{c.checked=!!s.packPaid[c.dataset.pack]});document.querySelectorAll('[data-entitlement]').forEach(c=>{c.checked=!!s[c.dataset.entitlement]})}
  function run(op,args){try{if(!api)throw new Error('Игра ещё загружается');api.command(op,args);log(op+' '+JSON.stringify(args||{}));$('#status').textContent='Команда выполнена';refresh()}catch(e){$('#status').textContent=e.message;log(e.message,true)}}
  $('#breed').onchange=e=>run('breed',{id:e.target.value});$('#yard').onchange=e=>run('yard',{id:e.target.value});
  function pose(step=false){if(step){$('#paused').checked=true;if($('#pose').value==='auto')$('#pose').value='walk'}run('animation',{state:$('#pose').value,paused:$('#paused').checked,dir:$('#left').checked?-1:1,speed:Number($('#speed').value),step})}
  ['pose','paused','left','speed'].forEach(id=>$('#'+id).onchange=()=>pose());$('#frame').onclick=()=>pose(true);
  $('#resource-form').onsubmit=e=>{e.preventDefault();run('resource',{key:$('#resource').value,value:$('#amount').value})};
  $('#stat-form').onsubmit=e=>{e.preventDefault();run('stat',{key:$('#stat').value,value:$('#stat-value').value})};
  $('#level-form').onsubmit=e=>{e.preventDefault();run('level',{group:$('#group').value,id:$('#item').value,value:$('#level').value})};
  document.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>run(b.dataset.command));
  $('#start-walk').onclick=()=>run('walk',{id:$('#walk').value,style:$('#walk-style').value});$('#start-event').onclick=()=>run('event',{id:$('#event').value});$('#open-tab').onclick=()=>run('tab',{id:$('#tab').value});
  frame.style.maxWidth='none';
  $('#viewport').onchange=e=>{frame.style.width=e.target.value==='100%'?'100%':e.target.value+'px'};
  $('#clear-log').onclick=()=>$('#log').replaceChildren();
  function envelope(){if(!api)throw new Error('Игра ещё загружается');return {format:'dog-yard-test-snapshot-v1',savedAt:new Date().toISOString(),state:api.snapshot()}}
  function validate(payload){
    if(!payload||payload.format!=='dog-yard-test-snapshot-v1'||!payload.state||!payload.state.levels||!payload.state.stats)throw new Error('Нужен тестовый снимок этой панели');
    function scan(x,depth){if(depth>20)throw new Error('Слишком глубокий JSON');if(typeof x==='number'&&(!Number.isFinite(x)||Math.abs(x)>1e15))throw new Error('Недопустимое число');if(x&&typeof x==='object'){if(Object.keys(x).length>10000)throw new Error('Слишком большой объект');for(const k of Object.keys(x)){if(['__proto__','prototype','constructor'].includes(k))throw new Error('Недопустимое поле');scan(x[k],depth+1)}}}
    scan(payload.state,0);return payload.state;
  }
  async function restore(payload){const s=validate(payload);await unload();s.lastSaveAt=Date.now();localStorage.setItem(key,JSON.stringify(s));await boot();log('Тестовый снимок восстановлен')}
  function guard(fn){return async()=>{try{await fn()}catch(e){log(e.message,true);$('#status').textContent=e.message}}}
  $('#checkpoint').onclick=guard(()=>{localStorage.setItem(key+'-checkpoint',JSON.stringify(envelope()));log('Снимок сохранён')});
  $('#restore').onclick=guard(async()=>{const raw=localStorage.getItem(key+'-checkpoint');if(!raw)throw new Error('Сначала создайте снимок');await restore(JSON.parse(raw))});
  $('#export').onclick=guard(()=>{const blob=new Blob([JSON.stringify(envelope(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dog-yard-test.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);log('JSON экспортирован')});
  $('#import').onchange=guard(async()=>{const f=$('#import').files[0];if(!f)return;if(f.size>5*1024*1024)throw new Error('Максимальный размер 5 МБ');await restore(JSON.parse(await f.text()));$('#import').value=''});
  $('#reset').onclick=guard(async()=>{if(!confirm('Удалить только тестовый прогресс? Сохранённый снимок останется.'))return;await unload();localStorage.removeItem(key);await boot();log('Новая тестовая игра')});
  $('#reload').onclick=guard(async()=>{await unload();await boot()});
  const retry=document.createElement('button');retry.textContent='Перезапустить';retry.onclick=guard(async()=>{await unload();await boot()});$('.toolbar').append(retry);
  async function unload(){api=null;$('#toolset').disabled=true;generation++;await new Promise(resolve=>{frame.onload=()=>{frame.onload=null;resolve()};frame.srcdoc='<!doctype html><title>Перезагрузка</title>'})}
  async function boot(){
    const current=++generation;api=null;$('#toolset').disabled=true;$('#status').textContent='Загрузка тестовой игры…';
    if(!gameDocument){
      const response=await fetch('index.html',{cache:'no-store'});if(!response.ok)throw new Error('Не удалось загрузить index.html: '+response.status);
      const doc=new DOMParser().parseFromString(await response.text(),'text/html');
      doc.querySelectorAll('script').forEach(s=>{if(/gamepush\.com|gp-bridge\.js/.test(s.getAttribute('src')||'')||s.textContent.includes('window.onGPInit'))s.remove()});
      const base=doc.createElement('base');base.href=new URL('.',location.href).href;doc.head.prepend(base);
      const capture=doc.createElement('script');capture.textContent="window.addEventListener('error',function(e){parent.DogAdminLog(e.message||'Ошибка загрузки ресурса')},true);window.addEventListener('unhandledrejection',function(e){parent.DogAdminLog(String(e.reason))});";doc.head.append(capture);
      const game=doc.querySelector('script[src="js/game.js"]');if(!game)throw new Error('Не найден запуск игры');
      ['js/admin-tools.js','js/admin-sandbox.js'].forEach(src=>{const s=doc.createElement('script');s.src=src;game.before(s)});
      gameDocument='<!doctype html>'+doc.documentElement.outerHTML;
    }
    frame.srcdoc=gameDocument;
    const started=Date.now();
    await new Promise((resolve,reject)=>{function check(){if(current!==generation){resolve();return}const child=frame.contentWindow;if(child&&child.DogAdmin){api=child.DogAdmin;$('#toolset').disabled=false;$('#status').textContent='Тестовая игра готова';$('#pose').value='auto';$('#paused').checked=false;refresh();updateLevel();log('Тестовая игра загружена');resolve()}else if(Date.now()-started>20000)reject(new Error('Игра не запустилась. Проверьте журнал и соединение.'));else setTimeout(check,100)}check()});
  }
  setInterval(()=>{try{refresh()}catch(e){log(e.message,true);api=null}},1000);
  guard(boot)();
})();
