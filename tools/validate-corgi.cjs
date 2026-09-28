'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require('sharp');
const root=path.join(__dirname,'../assets/corgi-v3');
async function main(){
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))),frames={},assets={};
  for(const [state,count] of Object.entries(manifest.states)){
    const file=path.join(root,state+'.webp'),meta=await sharp(file).metadata();
    assert.equal(meta.width,256*count);assert.equal(meta.height,256);assert(meta.hasAlpha);
    frames[state]=[];
    for(let i=0;i<count;i++){
      const raw=await sharp(file).extract({left:i*256,top:0,width:256,height:256}).ensureAlpha().raw().toBuffer();
      let visible=0;
      for(let y=0;y<256;y++)for(let x=0;x<256;x++){
        const alpha=raw[(y*256+x)*4+3];if(alpha>32){visible++;assert(x>1&&x<254&&y>1&&y<254,state+' frame '+i+' clipped')}
      }
      assert(visible>5000,state+' frame '+i+' empty');
      // WebP may change RGB under fully transparent pixels; compare visible output.
      frames[state].push(await sharp(raw,{raw:{width:256,height:256,channels:4}}).flatten({background:'#fff'}).raw().toBuffer());
    }
    assets[state]='data:image/webp;base64,'+fs.readFileSync(file).toString('base64');
  }
  assert(frames.idle[0].equals(frames.sitdown[0]),'standing to sitdown continuity');
  assert(frames.sit[0].equals(frames.sitdown.at(-1)),'sitdown to sitting continuity');
  assert(frames.sit[0].equals(frames.standup[0]),'sitting to standup continuity');
  assert(frames.idle[0].equals(frames.standup.at(-1)),'standup to standing continuity');
  const template=fs.readFileSync(path.join(__dirname,'corgi-preview.html'),'utf8');
  fs.writeFileSync(path.join(root,'preview.html'),template.replace('/*ASSETS*/{}',JSON.stringify(assets)));
  console.log('All 200 frames: size, transparency, nonempty, no clipping; four exact visible transition joins; standalone preview built');
}
main().catch(e=>{console.error(e);process.exitCode=1});
