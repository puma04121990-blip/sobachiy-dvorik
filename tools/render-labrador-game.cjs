/* Renders generated artwork on the approved dog-walk-blocking kinematics.
   Clip contours define texture meshes; the original source is preserved. */
const sharp=require('sharp');
const {createCanvas,loadImage,Path2D}=require('@napi-rs/canvas');
const fs=require('fs'),path=require('path');
const out=path.join(__dirname,'../assets/labrador-rig');
const TAU=Math.PI*2,stance=.62,stride=104,ground=325;
const mod=x=>(x%1+1)%1;
function paw(t,offset){const p=mod(t-offset);if(p<stance)return{x:52-104*p/stance,y:ground,down:true};const u=(p-stance)/(1-stance);return{x:-52+104*u*u*(3-2*u),y:ground-29*Math.sin(Math.PI*u)**2,down:false}}
function knee(a,b,l1,l2,side){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),q=Math.min(d,l1+l2-1e-6),along=(l1*l1-l2*l2+q*q)/(2*q),h=Math.sqrt(Math.max(0,l1*l1-along*along));return{x:a.x+dx/d*along-side*dy/d*h,y:a.y+dy/d*along+side*dx/d*h}}
const meshes=[
[42,137,514,327,'M 47 263 C 70 179 130 150 187 154 C 258 151 321 190 429 146 C 461 133 476 133 500 158 C 535 199 552 253 553 300 C 555 355 530 400 502 425 C 475 459 415 466 378 456 L 383 443 C 293 464 223 439 165 417 C 109 419 53 394 46 339 C 38 313 40 287 47 263 Z'],
[592,89,456,386,'M 676 156 C 722 101 773 87 817 93 C 882 91 927 115 944 160 C 956 189 949 218 969 239 C 985 256 1013 257 1033 264 C 1051 272 1049 294 1035 314 C 1029 337 1020 348 1007 361 C 1003 380 982 397 953 397 C 918 400 884 390 870 404 C 858 416 864 441 869 460 C 809 485 715 467 674 416 C 678 399 682 387 681 370 C 630 348 596 322 594 287 C 590 254 623 222 648 190 Z'],
[1098,178,397,233,'M 1108 182 C 1122 172 1135 194 1160 212 C 1248 278 1343 288 1431 264 C 1460 252 1477 264 1487 293 C 1498 326 1495 369 1476 390 C 1456 409 1394 410 1369 407 C 1267 405 1177 361 1126 282 C 1104 248 1091 198 1108 182 Z']
];
(async()=>{const img=await loadImage(path.join(out,'parts-polished.png'));
const parts=meshes.map(([x,y,w,h,p])=>{const c=createCanvas(w,h),g=c.getContext('2d');g.translate(-x,-y);g.clip(new Path2D(p));g.drawImage(img,0,0);return c});
const dark=parts.map(c=>{const a=createCanvas(c.width,c.height),g=a.getContext('2d');g.drawImage(c,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(94,49,18,.28)';g.fillRect(0,0,c.width,c.height);return a});
function render(ctx,t,state='walk',amount=0){
const walking=state==='walk',sitting=state==='sit'||state==='sitdown'||state==='standup';
const blend=sitting?amount:0;
const bob=walking?2:0.7;
const hip={x:90+18*blend,y:192+66*blend+bob*Math.cos(TAU*2*t)},sh={x:240-8*blend,y:189+8*blend+bob*Math.cos(TAU*2*t+.8)};
// A single continuous silhouette per leg eliminates seams between bone textures.
function leg(front,far,offset){
 const a=front?sh:hip,p=paw(t,offset),f=walking?{x:a.x+p.x,y:p.y}:{x:a.x+(front?8:0)+(far?-7:3)+(front?0:25*blend),y:ground},ank={x:f.x-(front?4:16),y:f.y-(front?15:32)},j=knee(a,ank,front?64:59,front?66:61,front?1:-1);
 const mask=createCanvas(410,370),m=mask.getContext('2d');
 // Smooth variable-width limb envelope, broad at the body and tapered at the ankle.
 const nodes=[a,j,ank,{x:f.x+3,y:f.y-9}],radii=[front?29:39,front?16:19,10,12],points=[];
 function cat(p0,p1,p2,p3,t){return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)}
 for(let seg=0;seg<3;seg++)for(let n=0;n<=16;n++){const u=n/16,p0=nodes[Math.max(0,seg-1)],p1=nodes[seg],p2=nodes[seg+1],p3=nodes[Math.min(3,seg+2)];points.push({x:cat(p0.x,p1.x,p2.x,p3.x,u),y:cat(p0.y,p1.y,p2.y,p3.y,u),r:radii[seg]+(radii[seg+1]-radii[seg])*(u*u*(3-2*u))})}
 const left=[],right=[];points.forEach((p,i)=>{const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],angle=Math.atan2(after.y-before.y,after.x-before.x),nx=-Math.sin(angle),ny=Math.cos(angle);left.push({x:p.x+nx*p.r,y:p.y+ny*p.r});right.push({x:p.x-nx*p.r,y:p.y-ny*p.r})});
 m.fillStyle='#fff';m.beginPath();[...left,...right.reverse()].forEach((p,i)=>i?m.lineTo(p.x,p.y):m.moveTo(p.x,p.y));m.closePath();m.fill();m.beginPath();m.ellipse(f.x+8,f.y-8,20,9,0,0,TAU);m.fill();
 const skin=createCanvas(410,370),g=skin.getContext('2d');g.drawImage(mask,0,0);g.globalCompositeOperation='source-in';const grad=g.createLinearGradient(a.x-25,0,a.x+40,0);grad.addColorStop(0,far?'#bd7c2b':'#efb65a');grad.addColorStop(.42,far?'#d3953b':'#ffd17a');grad.addColorStop(1,far?'#b2762b':'#f1b553');g.fillStyle=grad;g.fillRect(0,0,410,370);
 // Outline only the perimeter of the entire limb, never its internal joints.
 const rim=createCanvas(410,370),r=rim.getContext('2d');r.drawImage(mask,0,0);r.globalCompositeOperation='source-in';r.fillStyle=far?'#92622b':'#a97433';r.fillRect(0,0,410,370);if(!far){r.globalCompositeOperation='destination-in';const blend=r.createLinearGradient(0,a.y+15,0,a.y+66);blend.addColorStop(0,'transparent');blend.addColorStop(1,'black');r.fillStyle=blend;r.fillRect(0,0,410,370)}const layer=createCanvas(410,370),lg=layer.getContext('2d');for(let n=0;n<8;n++)lg.drawImage(rim,Math.cos(n*TAU/8)*1.1,Math.sin(n*TAU/8)*1.1);lg.drawImage(skin,0,0);
 // Blend only the root into the coat; the near limb stays above the torso.
 if(!far){lg.globalCompositeOperation='destination-in';const fade=lg.createLinearGradient(0,a.y+2,0,a.y+52);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,1)');lg.fillStyle=fade;lg.fillRect(0,0,410,370)}ctx.drawImage(layer,0,0);
 ctx.strokeStyle=far?'#a16d30':'#cc9648';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(f.x+14,f.y-10);ctx.quadraticCurveTo(f.x+17,f.y-6,f.x+16,f.y-2);ctx.stroke();
}
leg(false,true,.5);leg(true,true,.75);
ctx.save();ctx.translate(hip.x-5,hip.y-16);ctx.rotate(.07*Math.sin(TAU*t-.5));ctx.drawImage(parts[2],-94,-22,104,36);ctx.restore();
// Far legs -> torso -> near legs -> head.
ctx.save();ctx.translate(hip.x,hip.y);ctx.rotate(Math.atan2(sh.y-hip.y,sh.x-hip.x));ctx.drawImage(parts[0],-35,-48,220,117);ctx.restore();
leg(false,false,0);leg(true,false,.25);
// The head is the same texture in every frame; only its secondary rotation changes.
ctx.save();ctx.translate(sh.x+6,sh.y-31);ctx.rotate(.025*Math.sin(TAU*t-.4));ctx.drawImage(parts[1],-40,-82,135,120);ctx.restore();}

const states={walk:24,idle:24,sitdown:12,sit:24,standup:12,reaction:24};
const target=path.join(__dirname,'../assets/lab-v5');fs.mkdirSync(target,{recursive:true});
for(const [state,count] of Object.entries(states)){
 const strip=createCanvas(count*256,256),g=strip.getContext('2d');
 for(let i=0;i<count;i++){let amount=state==='sit'?1:0;if(state==='sitdown'||state==='standup'){let u=i/(count-1);amount=u*u*(3-2*u);if(state==='standup')amount=1-amount}g.save();g.translate(i*256,0);g.scale(.62,.62);g.translate(25,38);render(g,(state==='sitdown'||state==='standup')?0:i/count,state,amount);g.restore()}
 await sharp(strip.toBuffer('image/png')).webp({lossless:true}).toFile(path.join(target,state+'.webp'));
 if(state==='sit'){const qa=createCanvas(512,512),q=qa.getContext('2d');q.fillStyle='#e8f0df';q.fillRect(0,0,512,512);q.drawImage(strip,0,0,256,256,0,0,512,512);fs.writeFileSync('/tmp/lab-sit.png',qa.toBuffer('image/png'))}
}
console.log('Six consistent Labrador animation states rendered');})();
