'use strict';
// Render one textured puppet with a four-beat gait, never blend two full poses.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const {createCanvas, loadImage} = require('@napi-rs/canvas');
const output = path.join(__dirname, '../assets/corgi-v3');
const TAU = Math.PI * 2, ground = 224, stance = 0.62;
const states = {walk:32, idle:32, sitdown:20, sit:32, standup:20, reaction:32, sitReaction:32};
const smooth = t => t*t*(3-2*t);
function foot(t, offset) {
  const phase = ((t-offset)%1+1)%1;
  if (phase < stance) return {x:18-36*phase/stance, y:ground};
  const u = (phase-stance)/(1-stance);
  return {x:-18+36*smooth(u), y:ground-12*Math.sin(Math.PI*u)**2};
}
function joint(a,b,l1,l2,side) {
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(0.001,Math.hypot(dx,dy));
  const q=Math.min(d,l1+l2-.001),along=(l1*l1-l2*l2+q*q)/(2*q);
  const h=Math.sqrt(Math.max(0,l1*l1-along*along));
  return {x:a.x+dx/d*along-side*dy/d*h,y:a.y+dy/d*along+side*dx/d*h};
}
function cat(a,b,c,d,t){return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)}
async function main() {
  const source=await loadImage(path.join(output,'parts.png'));
  const parts=[[50,150,870,500],[930,20,580,680],[1650,190,500,440]].map(box=>{
    const c=createCanvas(box[2],box[3]);c.getContext('2d').drawImage(source,...box,0,0,box[2],box[3]);return c;
  });
  function render(g,t,state,seat) {
    const walking=state==='walk',happy=state==='reaction'||state==='sitReaction';
    const bob=walking?0.8*Math.cos(2*TAU*t):.3*Math.sin(TAU*t);
    const hip={x:84+8*seat,y:170+25*seat+bob};
    const shoulder={x:172-3*seat,y:165+2*seat+bob};
    function leg(front,far,offset) {
      const root=front?shoulder:hip,p=foot(t,offset);
      const f=walking?{x:root.x+p.x,y:p.y}:{x:root.x+(front?5:12*seat)+(far?-5:3),y:ground};
      const ankle={x:f.x-3,y:f.y-8};
      const knee=joint(root,ankle,front?28:32,front?30:32,front?1:-1);
      const nodes=[root,knee,ankle,{x:f.x+3,y:f.y-5}],radii=[front?15:20,front?9:11,6,7];
      const points=[];
      for(let seg=0;seg<3;seg++)for(let i=0;i<12;i++){
        const u=i/11,a=nodes[Math.max(0,seg-1)],b=nodes[seg],c=nodes[seg+1],d=nodes[Math.min(3,seg+2)];
        points.push({x:cat(a.x,b.x,c.x,d.x,u),y:cat(a.y,b.y,c.y,d.y,u),r:radii[seg]+(radii[seg+1]-radii[seg])*smooth(u)});
      }
      const edges=[[],[]];points.forEach((p,i)=>{
        const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],angle=Math.atan2(b.y-a.y,b.x-a.x);
        [-1,1].forEach((side,k)=>edges[k].push({x:p.x-Math.sin(angle)*p.r*side,y:p.y+Math.cos(angle)*p.r*side}));
      });
      const layer=createCanvas(256,256),c=layer.getContext('2d');
      const coat=c.createLinearGradient(root.x-16,0,root.x+18,0);
      coat.addColorStop(0,far?'#b57535':'#e6a04a');coat.addColorStop(.5,far?'#d2a264':'#ffc776');coat.addColorStop(1,far?'#b08652':'#f3b663');
      c.fillStyle=coat;c.beginPath();[...edges[0],...edges[1].reverse()].forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();
      c.save();c.globalCompositeOperation='source-atop';
      const sock=c.createLinearGradient(0,ground-23,0,ground-10);sock.addColorStop(0,'rgba(255,246,221,0)');sock.addColorStop(1,far?'#d2c3a7':'#fff0d5');c.fillStyle=sock;c.fillRect(0,ground-24,256,24);c.restore();
      c.fillStyle=far?'#c5b497':'#fff0d5';c.beginPath();c.ellipse(f.x+4,f.y-5,10,5,0,0,TAU);c.fill();
      // Fade the wide upper limb into the torso, retaining an opaque lower leg.
      if(!far){c.globalCompositeOperation='destination-in';const fade=c.createLinearGradient(0,root.y,0,root.y+19);fade.addColorStop(0,'transparent');fade.addColorStop(1,'black');c.fillStyle=fade;c.fillRect(0,0,256,256);c.globalCompositeOperation='source-over'}
      c.strokeStyle=far?'#9c8a70':'#c6ac81';c.lineWidth=.65;c.beginPath();c.moveTo(f.x+8,f.y-7);c.lineTo(f.x+9,f.y-2);c.stroke();g.drawImage(layer,0,0);
    }
    leg(false,true,.5);leg(true,true,.75);
    g.save();g.translate(hip.x-2,hip.y-2);g.rotate((happy?.27:.055)*Math.sin(TAU*t*(happy?2:1)));g.drawImage(parts[2],-45,-31,53,47);g.restore();
    g.save();g.translate(hip.x,hip.y);g.rotate(Math.atan2(shoulder.y-hip.y,shoulder.x-hip.x));g.drawImage(parts[0],-31,-40,143,82);g.restore();
    leg(false,false,0);leg(true,false,.25);
    g.save();g.translate(shoulder.x,shoulder.y-12);g.rotate(.014*Math.sin(TAU*t));g.drawImage(parts[1],-30,-83,83,97);g.restore();
  }
  for(const [state,count] of Object.entries(states)){
    const strip=createCanvas(256*count,256),g=strip.getContext('2d');
    for(let i=0;i<count;i++){
      const transition=state==='sitdown'||state==='standup';
      let seat=state==='sit'||state==='sitReaction'?1:0;
      if(transition)seat=state==='standup'?1-smooth(i/(count-1)):smooth(i/(count-1));
      const cell=createCanvas(256,256);
      render(cell.getContext('2d'),transition?0:i/count,state,seat);
      g.drawImage(cell,i*256,0);
    }
    await sharp(strip.toBuffer('image/png')).webp({lossless:true}).toFile(path.join(output,state+'.webp'));
  }
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({frameW:256,frameH:256,states,ground,stride:36/stance,walkDuration:1.05},null,2)+'\n');
  console.log('Corgi: seven consistent states rendered');
}
main().catch(error=>{console.error(error);process.exitCode=1});
