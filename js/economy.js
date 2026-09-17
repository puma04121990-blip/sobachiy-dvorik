(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.DogEconomy=factory();
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const nonnegative=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):0;
  // One second of sustainable play: idle plus one pet every two seconds.
  function rate(idle,pet){return Math.max(.5,nonnegative(idle)+nonnegative(pet)*.5);}
  function walk(tier,unit,bonus,style){
    const sniff=style==='sniff';
    return {
      reward:Math.floor(Math.max(tier.minReward,nonnegative(unit)*tier.durationMs/1000*tier.rewardMult)*(1+Math.min(1,nonnegative(bonus)))*(sniff?.8:1)),
      energy:tier.energy+(sniff?0:8),
      stickerChance:Math.min(.85,tier.stickerChance+(sniff?.25:0)),
      style:sniff?'sniff':'trail'
    };
  }
  function activity(unit,quality){return Math.floor(Math.max(25,nonnegative(unit)*60)*(.5+.5*Math.min(1,nonnegative(quality))));}
  function quest(type,target,unit,pet,streak){
    const r=nonnegative(unit),n=nonnegative(target);
    const base=type==='earn'?n*.12:type==='clicks'?n*nonnegative(pet)*.35:type==='walks'?r*n*35:type==='events'?r*n*30:r*30;
    return Math.floor(Math.max(10,base)*(1+Math.min(.25,nonnegative(streak)*.025)));
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
  return {rate,walk,activity,quest,credit,petAllowed,timing,rhythmGain};
});
