'use strict';
const assert=require('node:assert/strict');
const E=require('../js/economy'),G=require('../js/content'),Core=require('../js/game-core');
const {fixture}=require('./helpers/economy-fixture.cjs');
const results=[];
for(const [name,level] of [['new',0],['early',3],['middle',10],['late',20]]){
 const c=fixture(),s=c.state;
 if(level){for(const id of ['pickaxe','miner'])s.levels[id]=level;const ids=name==='early'?['neighbor','kiosk']:name==='middle'?['neighbor','walker','sitter','kiosk','skver','vet','poster','mascot']:G.SKILL_CARD_IDS;for(const id of ids)s.levelsCards[id]=level;s.stats.walksDone=2;s.stats.eventsDone=2;if(name!=='early'){s.levels.ball=level;s.levels.warehouse=level;s.yardStage=3;}}
 const pet=c.getClickPower(true),idle=c.getOrePerSec(true),unit=c.economyRate();
 s.combo=G.COMBO_MAX;s.joyUntil=Date.now()+100000;s.adBoostUntil=Date.now()+100000;s.seasonBoostUntil=Date.now()+100000;s.activeItem={id:'boneBoost',until:Date.now()+100000};s.energy=0;
 assert.equal(c.economyRate(),unit,'temporary buffs and fatigue cannot change reward basis');
 assert(c.getOrePerSec()<=idle*2+1e-8,'boosts do not multiply together');
 const rewards=G.WALK_TIERS.map(t=>E.walk(t,unit,0,'trail').reward);
 assert(rewards[0]>=45);assert(rewards[1]/150>=rewards[0]/60*.98);assert(rewards[2]/240>=rewards[1]/150*.98);
 for(const t of G.WALK_TIERS){const trail=E.walk(t,unit,0,'trail'),sniff=E.walk(t,unit,0,'sniff');assert(trail.reward>sniff.reward);assert(trail.energy>sniff.energy);assert(sniff.stickerChance>trail.stickerChance);}
 results.push({stage:name,pet:+pet.toFixed(2),idle:+idle.toFixed(2),walk60:rewards[0],park150:rewards[1],long240:rewards[2],perfectGame:E.activity(unit,1)});
}
// Exactly one payout; departure quote survives JSON save/reload and economy changes.
{
 const c=fixture(),s=c.state;c.startWalk('short','sniff');const quote=JSON.parse(JSON.stringify(c.serialize())).activeWalk;assert.equal(s.ore,10000);assert.equal(s.energy,82);assert.equal(quote.reward,36);
 s.activeWalk=quote;s.activeWalk.endsAt=Date.now()-1;s.levels.miner=1000;
 c.completeWalk(true);assert.equal(s.ore,10036);assert.equal(s.stats.walksDone,1);c.completeWalk(true);assert.equal(s.ore,10036);
}
// No regeneration of claimed quests; no bonus-to-quest feedback loop.
{
 const c=fixture(),s=c.state;c.ensureQuests();assert.equal(s.quests.length,3);const ids=s.quests.map(q=>q.id).join(',');
 for(const q of s.quests){q.progress=q.target;c.claimQuest(q.id);const after=s.ore;c.claimQuest(q.id);assert.equal(s.ore,after);}
 c.ensureQuests();assert.equal(s.quests.map(q=>q.id).join(','),ids);assert(s.quests.every(q=>q.claimed));assert.equal(s.questStreak,1);
 s.quests=[{id:'earn',type:'earn',target:100,progress:0,reward:10}];c.creditBones(20,'achievements',false);assert.equal(s.quests[0].progress,0);c.creditBones(20,'walks',true);assert.equal(s.quests[0].progress,20);
}
assert(!E.petAllowed(1000,900,100,false));assert(!E.petAllowed(1000,null,0,false));assert(!E.petAllowed(1000,null,100,true));assert(E.petAllowed(1000,500,100,false));
assert(E.rhythmGain(600)>0);assert(E.rhythmGain(50)<0);assert(E.rhythmGain(1000)<0);
assert(E.activity(100,1)>E.activity(100,0));assert.equal(E.activity(100,1000),E.activity(100,1));
for(const n of [NaN,Infinity,-1]){const s={ore:0,stats:{lifetimeBones:0}};assert.equal(E.credit(s,n,'test'),0);assert.equal(s.ore,0);}
for(const t of G.WALK_TIERS){const s=Core.applyVersionMigrations({v:8,ore:123,activeWalk:{tierId:t.id,endsAt:100},levels:{miner:7}},9);assert.equal(s.ore,123);assert.equal(s.levels.miner,7);assert(s.activeWalk.legacyEntryCost>0);}
for(const u of Object.values(G.UPGRADES))if(u.orePerSec)assert(u.baseCost/u.orePerSec<=900,'helper ROI '+u.id);
console.table(results);
console.log('economy: reward basis, no boost stacking, quoted walks, single claims, quests, migration, input cadence, helper ROI OK');

{const c=fixture();c.hiddenAt=12345;assert.equal(c.serialize().lastSaveAt,12345,'background saves keep the start of absence');}

// Exploration is persistent and only awards newly crossed discoveries.
{
 const c=fixture(),s=c.state;s.exploration={short:2};
 const q=c.explorationQuote(G.WALK_TIERS[0],'trail');assert.equal(q.reward,56);assert.equal(q.discoveryBonus,11);
 c.startWalk('short','trail');s.activeWalk.endsAt=Date.now()-1;c.completeWalk(true);
 assert.equal(s.exploration.short,3);assert.equal(c.serialize().exploration.short,3);
 assert.equal(c.explorationQuote(G.WALK_TIERS[0],'trail').discoveryBonus,0);
 assert.equal(c.explorationQuote(G.WALK_TIERS[0],'trail').energy,25);
 assert.equal(E.exploration(9,'sniff').after,11);assert(E.exploration(9,'sniff').discovered);
 c.completeWalk(true);assert.equal(s.exploration.short,3);
}
