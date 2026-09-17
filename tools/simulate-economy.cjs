/* Deterministic tuning scenario, not a retention forecast. No ads, purchases,
   offline catch-up, quests, achievements, training or random sticker rewards.
   Active: a pet every 2 seconds, walks, one perfect game when available.
   Buys affordable upgrades with the best steady marginal return every 5s. */
const {fixture}=require('../tests/helpers/economy-fixture.cjs');
const E=require('../js/economy'),G=require('../js/content');
function simulate(active){
 const c=fixture(),s=c.state;s.ore=0;let walk=null,nextEvent=90,firstHelper=null,park=null,forest=null;
 // Idle comparison starts with one purchased helper; its 55-bone cost is counted.
 if(!active){s.levels.miner=1;s.stats.lifetimeBones=55;firstHelper=0;}
 const ledger={petting:0,idle:0,walks:0,events:0},rows=[];
 function credit(n,type){s.ore+=n;s.stats.lifetimeBones+=n;ledger[type]+=n;}
 for(let t=0;t<=3600;t++){
  credit(c.getOrePerSec(true),'idle');
  if(walk&&t>=walk.end){credit(walk.reward,'walks');s.stats.walksDone++;s.energy=Math.min(100,s.energy+8);walk=null;}
  if(!walk)s.energy=Math.min(100,s.energy+1.2);
  if(active&&!walk){
   if(t>=nextEvent){credit(E.activity(c.economyRate(),1),'events');s.stats.eventsDone++;nextEvent=t+135;}
   let tier=G.WALK_TIERS.filter(x=>c.isWalkUnlocked(x)).at(-1),quote=E.walk(tier,c.economyRate(),0,'trail');
   // A small greeting interval allows care and energy recovery between walks.
   if(t%15===0&&s.energy>=quote.energy){s.energy-=quote.energy;walk={...quote,end:t+tier.durationMs/1000};}
   else if(t%2===0&&s.energy>=1.6){credit(c.getClickPower(true),'petting');s.energy-=1.6;s.stats.totalClicks++;}
  }
  if(t%5===0){
   const utility=()=>active?c.economyRate():c.getOrePerSec(true);const before=utility(),candidates=[];
   for(const id of G.UPGRADE_ORDER){if(!c.isUpgradeUnlocked(id))continue;const cost=c.upgradeCost(id);if(cost>s.ore)continue;s.levels[id]++;const delta=utility()-before;s.levels[id]--;if(delta>0)candidates.push({cost,delta,levels:s.levels,id});}
   for(const card of G.SKILL_CARDS){const id=card.id;if(!c.isPackCardOpen(card)||s.levelsCards[id]>=20)continue;const cost=c.cardCost(id);if(cost>s.ore)continue;s.levelsCards[id]++;const delta=utility()-before;s.levelsCards[id]--;if(delta>0)candidates.push({cost,delta,levels:s.levelsCards,id});}
   candidates.sort((a,b)=>b.delta/b.cost-a.delta/a.cost);const best=candidates[0];if(best){s.ore-=best.cost;best.levels[best.id]++;if(firstHelper===null&&c.getOrePerSec(true)>0)firstHelper=t;}
  }
  if(s.stats.lifetimeBones>=2500){s.yardStage=Math.max(2,s.yardStage);if(park===null)park=t;}
  if(s.stats.lifetimeBones>=35000){s.yardStage=3;if(forest===null)forest=t;}
  if([300,900,1800,3600].includes(t))rows.push({minutes:t/60,lifetime:Math.round(s.stats.lifetimeBones),wallet:Math.round(s.ore),idle:+c.getOrePerSec(true).toFixed(2),walks:s.stats.walksDone,games:s.stats.eventsDone});
 }
 return {mode:active?'care-walk-play':'idle-one-helper',firstHelperSeconds:firstHelper,parkSeconds:park,forestSeconds:forest,ledger:Object.fromEntries(Object.entries(ledger).map(([k,v])=>[k,Math.round(v)])),rows};
}
console.log(JSON.stringify([simulate(true),simulate(false)],null,2));
