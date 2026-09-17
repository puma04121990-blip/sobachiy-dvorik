(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.DogEconomy=factory();
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const nonnegative=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):0;
  // One second of sustainable play: idle plus one pet every two seconds.
  function rate(idle,pet){return Math.max(.5,nonnegative(idle)+nonnegative(pet)*.5);}
  const trustSteps=[0,20,55,105,170,250,345,455,580,720,880];
  function trustLevel(points){
    const p=nonnegative(points);
    let level=0;
    for(let i=0;i<trustSteps.length;i++)if(p>=trustSteps[i])level=i;
    return level;
  }
  function trustNext(points){
    const p=nonnegative(points),level=trustLevel(p),next=trustSteps[level+1]||null;
    return {level,points:p,next,progress:next?Math.min(1,(p-trustSteps[level])/(next-trustSteps[level])):1};
  }
  function trustBonus(points){return Math.min(.35,trustLevel(points)*.035);}
  function walk(tier,unit,bonus,style){
    const sniff=style==='sniff';
    return {
      reward:Math.floor(Math.max(tier.minReward,nonnegative(unit)*tier.durationMs/1000*tier.rewardMult)*(1+Math.min(1.35,nonnegative(bonus)))*(sniff?.85:1)),
      energy:tier.energy+(sniff?0:8),
      stickerChance:Math.min(.85,tier.stickerChance+(sniff?.25:0)),
      style:sniff?'sniff':'trail'
    };
  }
  function activity(unit,quality){return Math.floor(Math.max(40,nonnegative(unit)*75)*(.45+.55*Math.min(1,nonnegative(quality))));}
  function quest(type,target,unit,pet,streak){
    const r=nonnegative(unit),n=nonnegative(target);
    const base=type==='earn'?n*.15:type==='clicks'?n*nonnegative(pet)*.32:type==='walks'?r*n*75:type==='events'?r*n*65:r*40;
    return Math.floor(Math.max(25,base)*(1+Math.min(.25,nonnegative(streak)*.025)));
  }
  function credit(state,amount,source){
    const value=nonnegative(amount);if(!value)return 0;
    state.ore+=value;state.stats.lifetimeBones+=value;
    if(!state.incomeBySource)state.incomeBySource={};
    state.incomeBySource[source]=nonnegative(state.incomeBySource[source])+value;
    return value;
  }
  function petAllowed(now,last,energy,walking){return !walking&&energy>=1.6&&(last==null||now-last>=500);}
  function timing(elapsed){const t=((nonnegative(elapsed)%1400)/700);return t<=1?t:2-t;}
  function rhythmGain(gap){return gap>=450&&gap<=750?14:-8;}
  const discoverySteps = [3, 10, 25, 60, 120];
  function exploration(progress, style) {
    const before = Math.floor(nonnegative(progress));
    const after = before + (style === 'sniff' ? 2 : 1);
    const rank = discoverySteps.filter(n => before >= n).length;
    const nextRank = discoverySteps.filter(n => after >= n).length;
    return {before, after, rank, nextRank, discovered: nextRank > rank, next: discoverySteps.find(n => n > before) || null};
  }
  return {trustLevel,trustNext,trustBonus,exploration, discoverySteps, rate,walk,activity,quest,credit,petAllowed,timing,rhythmGain};
});
