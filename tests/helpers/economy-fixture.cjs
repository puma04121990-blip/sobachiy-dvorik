'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../../js/economy'),G=require('../../js/content'),Core=require('../../js/game-core');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../js/game.js'),'utf8');
function fn(name){const start=source.indexOf('  function '+name+'(');assert(start>=0,name);const next=source.indexOf('\n  function ',start+5);return source.slice(start,next);}
function fixture(){
 const state={ore:10000,levels:G.defaultLevels(),levelsCards:G.defaultCardLevels(),levelsTraining:G.defaultTrainingLevels(),stats:{lifetimeBones:0,walksDone:0,eventsDone:0,totalClicks:0,upgradesBought:0},energy:100,combo:1,medals:0,medalUpgrades:{},packUnlocked:{},selectedBreed:'lab',yardStage:1,questStreak:0,quests:[],dailyGoals:[],questDaySeed:'',dailyDayKey:'',questClaimsToday:0,stickers:[],unlockedBreeds:['lab'],unlockedYards:['sunny'],acorns:0};
 const ctx={...G,state,Economy:E,Date,Math,Number,Object,Array,console,window:{GameCore:Core},hiddenAt:0,activeTab:'shop',toyActive:false,trainActive:false,hideActive:false,raceActive:false,getBreed:()=>G.BREEDS.lab,getFriend:()=>null,$:()=>null,daySeed:()=> '2026-09-17',localDayKey:()=> '2026-09-17',tr:x=>x,locn:x=>x.name,fmt:String,showToast(){},updateEnergyUI(){},renderStats(){},scheduleSave(){},renderQuests(){},checkAchievements(){},maybeUnlockStory(){},paintQuestProgress(){},isSeasonActive:()=>false,grantSticker:()=>false};
 vm.createContext(ctx);
 for(const name of ['getMedalLevel','getMedalShopMult','getYardStageMult','getPrestigeMult','getVipMult','getTrainingSum','getTrainingAllIncomeMult','isPackCatOwned','getCardSum','getCardOrePerSec','getItemMult','getClickPctMult','getEnergyClickMult','getClickPower','getIdleMult','getOrePerSec','economyRate','creditBones','seededRand','makeQuestReward','generateQuests','ensureQuests','ensureDailyGoals','bumpQuest','claimQuest','isWalkUnlocked','startWalk','walkRewardBones','completeWalk','serialize','isUpgradeUnlocked','isCardUnlocked','cardNeedList','isPackCardOpen','cardMaxLevel','upgradeCost','cardCost'])vm.runInContext(fn(name),ctx);
 ctx.softcapValue=Core.softcapValue;ctx.getEnergyMax=()=>100;ctx.hasSticker=id=>state.stickers.includes(id);
 return ctx;
}
module.exports={fixture,fn};
