'use strict';
// Only admin.html injects this file. No GamePush SDK is loaded in that document.
window.__DOG_TEST_MODE=true;
window.GameContent.SAVE_KEY=window.DogTestTools.KEY;
window.GameContent.LEGACY_SAVE_KEY=window.DogTestTools.KEY;
(function(){
  const key=window.DogTestTools.KEY;
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}};
  const save=async payload=>{localStorage.setItem(key,JSON.stringify(payload));return true};
  window.GPBridge={
    loadCloudSave:async()=>null,saveCloudSave:save,
    getStatus:()=>({connected:false,sdk:'test',cloudSave:'test-local',ads:'disabled',payments:'disabled'}),
    isGpConnected:()=>false,isPaymentsAvailable:()=>false,isRewardedAvailable:()=>false,
    waitForGp:async()=>null,fetchProducts:async()=>[],purchase:async()=>({success:false}),
    showRewarded:async()=>false,showFullscreen:async()=>false,hideSticky:()=>{},
    hasPurchase:()=>false,consume:async()=>false,consumeWipeFlag:()=>false,
    exportSaveRaw:async()=>JSON.stringify(read()),importSaveRaw:async()=>false,
    wipeProgress:save,clearSaves:async()=>{localStorage.removeItem(key);return true}
  };
})();
