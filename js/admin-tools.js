(function(root) {
  'use strict';
  const KEY = 'dog-yard-admin-test-v1';
  function number(value, max) {
    if (value === '' || value == null) throw new Error('Введите число');
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > max) throw new Error('Допустимо число от 0 до ' + max);
    return n;
  }
  function create(ctx) {
    const s=ctx.state, g=ctx.content;
    function known(table,id) { if (!Object.prototype.hasOwnProperty.call(table,id)) throw new Error('Неизвестный объект'); return id; }
    function command(op,a={}) {
      switch(op) {
        case 'resource': {
          const caps={ore:1e15,energy:ctx.energyMax(),medals:1e6,acorns:1e9,prestigeLevel:100,trust:880,yardStage:Math.max(...g.YARD_STAGES.map(x=>x.level))};
          known(caps,a.key);const n=number(a.value,caps[a.key]);
          if(a.key==='yardStage'&&(!Number.isInteger(n)||n<1))throw new Error('Уровень двора должен быть целым и не меньше 1');
          if(a.key==='trust')s.care.trust=n;else s[a.key]=n;break;
        }
        case 'stat': known(s.stats,a.key);s.stats[a.key]=number(a.value,1e15);break;
        case 'breed': known(g.BREEDS,a.id);if(!s.unlockedBreeds.includes(a.id))s.unlockedBreeds.push(a.id);s.selectedBreed=a.id;break;
        case 'yard': known(g.YARDS,a.id);if(!s.unlockedYards.includes(a.id))s.unlockedYards.push(a.id);s.selectedYard=a.id;break;
        case 'level': {
          const tables={levels:g.UPGRADES,levelsTraining:Object.fromEntries(g.TRAINING.map(x=>[x.id,x])),levelsCards:g.SKILL_CARDS_BY_ID};
          known(tables,a.group);known(tables[a.group],a.id);
          const item=tables[a.group][a.id];s[a.group][a.id]=Math.floor(number(a.value,item.maxLevel||100));break;
        }
        case 'unlock':
          s.unlockedBreeds=Object.keys(g.BREEDS);s.unlockedYards=Object.keys(g.YARDS);
          s.unlockedFriends=Object.keys(g.FRIENDS);s.stickers=g.STICKERS.map(x=>x.id);break;
        case 'pack': known(s.packPaid,a.id);s.packPaid[a.id]=!!a.enabled;s.packUnlocked[a.id]=!!a.enabled;break;
        case 'entitlement':
          if(!['noAds','vipTreats'].includes(a.id))throw new Error('Неизвестная покупка');
          s[a.id]=!!a.enabled;break;
        case 'quests': s.quests.forEach(q=>{if(!q.claimed)q.progress=q.target});s.dailyGoals.forEach(q=>{if(!q.claimed)q.progress=q.target});break;
        case 'event':
          if(!['toy','train','hide','race'].includes(a.id))throw new Error('Неизвестная мини-игра');
          if(ctx.busy()||s.activeWalk)throw new Error('Сначала завершите текущую активность');
          s.nextEventAt=0;s.eventReadyType=a.id;ctx.startEvent(a.id);break;
        case 'walk':
          if(!g.WALK_TIERS.some(x=>x.id===a.id)||!['trail','sniff'].includes(a.style))throw new Error('Неизвестный маршрут');
          if(ctx.busy()||s.activeWalk)throw new Error('Сначала завершите текущую активность');
          ctx.startWalk(a.id,a.style);if(!s.activeWalk)throw new Error('Маршрут закрыт или не хватает энергии. Измените прогресс/ресурсы.');break;
        case 'finishWalk': if(!s.activeWalk)throw new Error('Нет активной прогулки');s.activeWalk.endsAt=Date.now()-1;ctx.completeWalk(true);break;
        case 'tab':
          if(!['shop','cards','training','yard','breeds','friends','album','season','quests','achievements','prestige','story'].includes(a.id))throw new Error('Неизвестное меню');
          ctx.selectTab(a.id);break;
        case 'animation':
          if(!['auto','walk','idle','sitdown','sit','standup','reaction'].includes(a.state))throw new Error('Неизвестная анимация');
          if(number(a.speed,2)<.25)throw new Error('Темп от 0,25 до 2');
          ctx.animation(a);break;
        default: throw new Error('Неизвестная команда');
      }
      ctx.checkAchievements();ctx.render();ctx.persist();return snapshot();
    }
    function snapshot(){return JSON.parse(JSON.stringify(ctx.serialize()))}
    return {command,snapshot};
  }
  const api={KEY,create,number};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DogTestTools=api;
})(typeof window==='object'?window:globalThis);
