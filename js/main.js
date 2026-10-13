const $=id=>document.getElementById(id),cl=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),ease=t=>t*t*(3-2*t),lerp=(a,b,t)=>a+(b-a)*t;
const cv=$('cv'),track=$('track');
const R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
R.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.75:2));R.outputEncoding=THREE.sRGBEncoding;
R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.18;R.localClippingEnabled=true;
const S=new THREE.Scene();S.fog=new THREE.Fog(0x050505,16,34);
const cam=new THREE.PerspectiveCamera(35,1,.1,60);

// Studio environment: soft boxes for realistic glass reflections
const E=new THREE.Scene();
E.add(new THREE.Mesh(new THREE.BoxGeometry(40,40,40),new THREE.MeshBasicMaterial({color:0x1a0f0a,side:THREE.BackSide})));
[[0,16,0,16,16,0,1],[-14,3,0,3,14,1,0],[14,3,2,2,12,1,0],[0,4,-14,18,3,1,1]].forEach(([x,y,z,w,h,s,t])=>{
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(1,.93,.82).multiplyScalar(t?7:11),side:THREE.DoubleSide}));
 m.position.set(x,y,z);m.lookAt(0,3,0);E.add(m)});
S.environment=new THREE.PMREMGenerator(R).fromScene(E,.03).texture;
S.add(new THREE.AmbientLight(0xffe3c4,.15));
const key=new THREE.DirectionalLight(0xfff0dc,1.4);key.position.set(-5,9,6);S.add(key);
const rim=new THREE.DirectionalLight(0xffb070,1.6);rim.position.set(5,4,-6);S.add(rim);

// Floor + contact shadow
const floor=new THREE.Mesh(new THREE.CircleGeometry(40,64),new THREE.MeshStandardMaterial({color:0x080808,roughness:.16,metalness:.85}));
floor.rotation.x=-Math.PI/2;S.add(floor);
const sc=document.createElement('canvas');sc.width=sc.height=128;let g=sc.getContext('2d'),gr=g.createRadialGradient(64,64,4,64,64,64);
gr.addColorStop(0,'rgba(0,0,0,.85)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
const blob=new THREE.Mesh(new THREE.PlaneGeometry(4.6,4.6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false}));
blob.rotation.x=-Math.PI/2;blob.position.y=.01;S.add(blob);

// Glass tumbler (lathe with real wall thickness)
const cup=new THREE.Group();S.add(cup);
const inR=y=>.88+(y-.35)*(.42/2.65),outR=y=>1+(y-.05)*(.35/2.95);
const prof=[[0,0],[.95,0],[1,.05],[1.35,3],[1.31,3],[inR(3)-.01,2.98],[inR(.35),.35],[0,.32]].map(([x,y])=>new THREE.Vector2(x,y));
const glass=new THREE.Mesh(new THREE.LatheGeometry(prof,96),new THREE.MeshPhysicalMaterial({color:0xeaf4f4,metalness:0,roughness:.02,transparent:true,opacity:.2,clearcoat:1,clearcoatRoughness:0,envMapIntensity:3,side:THREE.DoubleSide,depthWrite:false}));
glass.renderOrder=10;cup.add(glass);

// Coffee
const plane=new THREE.Plane(new THREE.Vector3(0,-1,0),0);
const cofMat=new THREE.MeshPhysicalMaterial({color:0x2a1207,roughness:.12,transparent:true,opacity:.93,clearcoat:.6,side:THREE.DoubleSide,clippingPlanes:[plane],depthWrite:false});
const liq=new THREE.Mesh(new THREE.LatheGeometry([[0,.35],[inR(.35)-.01,.35],[inR(3)-.01,3],[0,3]].map(([x,y])=>new THREE.Vector2(x,y)),64),cofMat);
liq.renderOrder=5;cup.add(liq);
const cap=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshPhysicalMaterial({color:0x4a2410,roughness:.2,clearcoat:1}));
cap.rotation.x=-Math.PI/2;cup.add(cap);

// Ice cubes (rounded boxes)
function cubeGeo(){const b=new THREE.BoxGeometry(.6,.6,.6,8,8,8),p=b.attributes.position,v=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(cl(v.x,-.2,.2),cl(v.y,-.2,.2),cl(v.z,-.2,.2));v.sub(c).normalize().multiplyScalar(.1).add(c);p.setXYZ(i,v.x,v.y,v.z)}
 b.computeVertexNormals();return b}
const cg=cubeGeo(),iceMat=new THREE.MeshPhysicalMaterial({color:0xd8f2ff,roughness:.18,transparent:true,opacity:.62,clearcoat:1,envMapIntensity:2.6,depthWrite:false});
const homes=[[-.4,.2],[.38,-.3],[.12,.48],[-.2,-.5],[.62,.2],[-.6,-.1]];
const ice=homes.map((h,i)=>{const m=new THREE.Mesh(cg,iceMat);m.renderOrder=6;m.userData={h,i,s:.85+.15*((i*7)%3)};cup.add(m);m.visible=false;return m});

// Condensation
const drops=new THREE.InstancedMesh(new THREE.SphereGeometry(.03,10,8),new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:0,transparent:true,opacity:0,clearcoat:1,envMapIntensity:3,depthWrite:false}),130);
const dm=new THREE.Object3D();for(let i=0;i<130;i++){const y=.4+Math.random()*2.4,a=Math.random()*6.28,r=outR(y)+.005,s=.6+Math.random()*1.4;
 dm.position.set(Math.cos(a)*r,y,Math.sin(a)*r);dm.scale.set(s,s*(1+Math.random()),s*.6);dm.lookAt(0,y,0);dm.updateMatrix();drops.setMatrixAt(i,dm.matrix)}
drops.renderOrder=11;cup.add(drops);

// Sachet (pillow-shaped foil pouch)
function art(c,back){const g=c.getContext('2d');
 const T=(txt,y,wt,fam,size,max=320)=>{let s=size;g.font=`${wt} ${s}px ${fam}`;while(g.measureText(txt).width>max&&s>10){s-=2;g.font=`${wt} ${s}px ${fam}`}g.fillText(txt,256,y)};
 const SY='Syne,Arial,sans-serif',MO='"Space Mono",monospace';
 let lg=g.createLinearGradient(0,0,512,768);lg.addColorStop(0,'#2a0009');lg.addColorStop(.45,'#7d1028');lg.addColorStop(1,'#2a0009');g.fillStyle=lg;g.fillRect(0,0,512,768);
 const sh=g.createLinearGradient(0,0,512,0);sh.addColorStop(0,'#fff0');sh.addColorStop(.5,'#ffffff22');sh.addColorStop(1,'#fff0');g.fillStyle=sh;g.fillRect(0,0,512,768);
 g.fillStyle='#00000066';for(let y=0;y<44;y+=6){g.fillRect(0,y,512,2);g.fillRect(0,768-y,512,2)}
 g.strokeStyle='#f3e3df';g.lineWidth=4;g.strokeRect(40,76,432,616);g.lineWidth=1.5;g.strokeRect(52,88,408,592);
 g.fillStyle='#f6e8e4';g.textAlign='center';g.textBaseline='alphabetic';
 if(!back){T('NESCAFÉ',300,800,SY,80);T('CLASSIC',376,800,SY,54);T('ICED INSTANT COFFEE',428,400,MO,24);
  g.fillStyle='#1a0005';g.beginPath();g.ellipse(256,548,56,76,.4,0,6.28);g.fill();g.strokeStyle='#f3e3df';g.lineWidth=7;g.beginPath();g.moveTo(224,616);g.bezierCurveTo(272,562,234,522,290,474);g.stroke()}
 else{T('HOW TO ENJOY',170,800,SY,38);
  ['1 · Empty sachet into glass','2 · Add cold water & ice','3 · Stir well and enjoy'].forEach((s,i)=>T(s,250+i*52,400,MO,22));
  T('NESCAFÉ',470,800,SY,44);T('NET WT 2 g e',512,400,MO,20);
  g.fillStyle='#f6e8e4';g.fillRect(166,540,180,100);g.fillStyle='#1a0005';let x=174,s=7;while(x<336){const w=1+(s=(s*37+11)%7);g.fillRect(x,548,w,84);x+=w+2+(s%3)}}}
const tcF=document.createElement('canvas'),tcB=document.createElement('canvas');tcF.width=tcB.width=512;tcF.height=tcB.height=768;
const sF=new THREE.CanvasTexture(tcF),sB=new THREE.CanvasTexture(tcB);sF.encoding=sB.encoding=THREE.sRGBEncoding;
const drawS=()=>{art(tcF,0);art(tcB,1);sF.needsUpdate=sB.needsUpdate=true};drawS();document.fonts.ready.then(drawS);
function pouch(){const g=new THREE.PlaneGeometry(1.1,1.6,24,36),p=g.attributes.position;
for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),nx=Math.abs(x/.55),ny=Math.abs(y/.8);
 let z=.22*(1-Math.pow(nx,2.4))*(1-Math.pow(ny,7))+.008;if(ny>.86)z+=.01*Math.sin(x*95);p.setZ(i,Math.max(z,.006))}
g.computeVertexNormals();return g}
const pm=()=>new THREE.MeshStandardMaterial({map:sF,metalness:.8,roughness:.3,envMapIntensity:1.8});
const mF=pm(),mB=pm();mB.map=sB;
const sachet=new THREE.Group();sachet.add(new THREE.Mesh(pouch(),mF),new THREE.Mesh(pouch().rotateY(Math.PI),mB));
S.add(sachet);

// Coffee granules
const N=170,gp=new Float32Array(N*3),gd=[...Array(N)].map(()=>({a:Math.random()*6.28,s:.1+Math.random()*.85,v:1.5+Math.random()*2.5}));
const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(gp,3));
const gm=new THREE.PointsMaterial({color:0x4a2610,size:.1,transparent:true,opacity:0,depthWrite:false}),pts=new THREE.Points(gg,gm);pts.frustumCulled=false;S.add(pts);

// Steam
const st=document.createElement('canvas');st.width=st.height=64;g=st.getContext('2d');gr=g.createRadialGradient(32,32,2,32,32,32);
gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
const stT=new THREE.CanvasTexture(st);
const steam=[...Array(34)].map((_,i)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:stT,transparent:true,opacity:0,depthWrite:false,color:0xfff2e4}));s.userData={o:i/34,x:(Math.random()-.5)*1.3,z:(Math.random()-.5)*1.3,w:Math.random()*6};S.add(s);return s});

// Gold: coaster, rim rings, halos, dust
const goldMat=new THREE.MeshStandardMaterial({color:0x8f1632,metalness:1,roughness:.22,envMapIntensity:2.2});
const coaster=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.68,.1,96),goldMat);coaster.position.y=.05;S.add(coaster);
const ringTop=new THREE.Mesh(new THREE.TorusGeometry(1.33,.03,16,96),goldMat);ringTop.rotation.x=Math.PI/2;ringTop.position.y=3;cup.add(ringTop);
const ringBase=new THREE.Mesh(new THREE.TorusGeometry(.98,.025,16,96),goldMat);ringBase.rotation.x=Math.PI/2;ringBase.position.y=.06;cup.add(ringBase);
const halo=new THREE.Mesh(new THREE.RingGeometry(2.3,2.36,128),new THREE.MeshBasicMaterial({color:0xe0506b,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
halo.rotation.x=-Math.PI/2;halo.position.y=.02;S.add(halo);
const halo2=halo.clone();halo2.scale.setScalar(1.4);halo2.material=halo.material.clone();halo2.material.opacity=.22;S.add(halo2);
const DN=260,dp=new Float32Array(DN*3),dv=[...Array(DN)].map(()=>Math.random());
for(let i=0;i<DN;i++){dp[i*3]=(Math.random()-.5)*14;dp[i*3+1]=Math.random()*9;dp[i*3+2]=(Math.random()-.5)*8}
const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
const dust=new THREE.Points(dg,new THREE.PointsMaterial({map:stT,color:0xe0506b,size:.16,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));dust.frustumCulled=false;S.add(dust);
// Film grain
const gc=$('grain'),gx=gc.getContext('2d');gc.width=gc.height=180;const gi=gx.createImageData(180,180);
function noise(){const d=gi.data;for(let i=0;i<d.length;i+=4){d[i]=d[i+1]=d[i+2]=Math.random()*255;d[i+3]=255}gx.putImageData(gi,0,0)}
// Scroll + camera path
let tgt=0,cur=0,grabbed=false,mx=0,my=0,cupX=0;
const read=()=>tgt=cl(scrollY/(track.offsetHeight-innerHeight));addEventListener('scroll',read,{passive:true});read();
addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});
const K=[[[0,5.8,11],[0,4.6,0]],[[3.4,4.8,8.6],[0,3,0]],[[-3.4,2.8,7.8],[0,2,0]],[[.6,2.6,8],[0,2.7,0]],[[2.6,3,8.4],[0,2.5,0]]];
const V=a=>new THREE.Vector3(...a),pc=new THREE.CatmullRomCurve3(K.map(k=>V(k[0])),false,'centripetal'),tc2=new THREE.CatmullRomCurve3(K.map(k=>V(k[1])),false,'centripetal'),B=new THREE.Vector3();
let sx=0,sy2=0;
function place(p,tx,ty,t){pc.getPoint(p,cam.position);tc2.getPoint(p,B);
 const f=cl(1.35/cam.aspect,1,1.75);cam.position.sub(B).multiplyScalar(f).add(B);
 cam.position.x+=mx*1.2+Math.sin(t*.3)*.08;cam.position.y+=-my*.6+Math.sin(t*.4)*.05;cam.lookAt(B);
 const w=cv.clientWidth,h=cv.clientHeight;sx+=(tx-sx)*.07;sy2+=(ty-sy2)*.07;cam.setViewOffset(w,h,-sx*w,sy2*h,w,h)}
const PC=[[0,'#6b0f24','#050304'],[.3,'#8f1630','#070304'],[.55,'#5c3a4a','#04050a'],[.85,'#a01834','#080304']].map(([s,a,b])=>[s,new THREE.Color(a),new THREE.Color(b)]),ca=new THREE.Color(),cb=new THREE.Color();
function bg(p){let i=0;while(i<PC.length-2&&p>PC[i+1][0])i++;const t=ease(cl((p-PC[i][0])/(PC[i+1][0]-PC[i][0])));
 ca.copy(PC[i][1]).lerp(PC[i+1][1],t);cb.copy(PC[i][2]).lerp(PC[i+1][2],t);
 $('stage').style.background=`radial-gradient(ellipse at ${innerWidth<=700?50:58}% 56%,#${ca.getHexString()} 0%,#${cb.getHexString()} 68%)`;S.fog.color.copy(cb);rim.color.copy(ca)}
function size(){const w=cv.clientWidth,h=cv.clientHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
addEventListener('resize',size);size();

const chs=['c1','c2','c3','c4'].map($),ranges=[[.04,.2],[.22,.4],[.42,.62],[.66,.86]];
let ready=false,last=0,hud=-1,fc=0;const NAMES=['SACHET','BREW','ICE','SERVE'];
function frame(ms){
 const t=ms/1000,dt=Math.min(.05,(ms-last)/1000||.016);last=ms;cur+=(tgt-cur)*(1-Math.exp(-dt*4));const p=cur;
 const a=ease(cl((p-.04)/.22)),b=ease(cl((p-.28)/.18)),c=cl((p-.47)/.17),d=ease(cl((p-.62)/.12)),e=ease(cl((p-.8)/.18));
 $('hero').style.opacity=1-cl(p/.07);$('hero').style.transform=`scale(${1+p*9})`;$('hero').style.filter=`blur(${p*60}px)`;$('hint').style.opacity=1-cl(p/.03);
 const mobile=innerWidth<=700,openT=0;cupX+=(openT-cupX)*.06;
 cup.position.set(cupX,.1+e*.55,0);cup.rotation.y=e*1.3+Math.sin(t*.45)*.12+(grabbed?t*.25:0);blob.position.x=cupX;blob.scale.setScalar(1+e*.2);blob.material.opacity=1-e*.4;
 // sachet drop
 const rimY=cup.position.y+3.05,y=lerp(5.4,rimY-1.4,a)+Math.sin(t*1.4)*.08*(1-a);
 const sink=cl((rimY-y)/1.6);
 sachet.position.set(cupX+Math.sin(a*3)*.12,y,0);sachet.rotation.set(.25*(1-a)+Math.sin(a*Math.PI)*.2,a*Math.PI*2+t*.45*(1-a),Math.sin(a*Math.PI)*.45);
 sachet.scale.setScalar(Math.max(.001,1-sink*.6));sachet.visible=p<.3;
 for(let i=0;i<DN;i++){dp[i*3+1]+=dt*(.15+dv[i]*.35);dp[i*3]+=Math.sin(t*.4+i)*dt*.1;if(dp[i*3+1]>9)dp[i*3+1]=0}dg.attributes.position.needsUpdate=true;
 halo.rotation.z=t*.2;halo2.rotation.z=-t*.1;halo.material.opacity=.35+.25*Math.sin(t*1.5);halo.position.x=halo2.position.x=coaster.position.x=cupX;
 // granules scrubbed by scroll
 const s=cl((a-.7)/.3);gm.opacity=s>0&&s<1?.95*(1-s*s*s):0;
 for(let i=0;i<N;i++){const d=gd[i];gp[i*3]=cupX+Math.cos(d.a)*d.s*s*.8;gp[i*3+1]=rimY+.5+d.v*s*.6-5.5*s*s;gp[i*3+2]=Math.sin(d.a)*d.s*s*.8}
 gg.attributes.position.needsUpdate=true;
 // coffee level
 const L=.35+b*2.35;plane.constant=cup.position.y+L;liq.visible=b>.002;cap.visible=b>.01;cap.position.y=L;cap.scale.setScalar(inR(L)-.012);cap.rotation.x=-Math.PI/2+Math.sin(t*1.6)*.012*b;
 // ice
 ice.forEach(m=>{const{h,i,s:sc2}=m.userData,k=ease(cl(c*1.8-i*.13));m.visible=k>.001;
  const fy=2.55+(i%2)*.1;m.position.set(h[0]+Math.sin(t*.8+i)*.04*k,lerp(.8,fy,k)+Math.sin(t*1.2+i*2)*.025*k,h[1]+Math.cos(t*.7+i)*.04*k);
  m.rotation.set(t*.15+i,t*.12*(i%2?1:-1)+i*2,(1-k)*2+i);m.scale.setScalar(sc2*ease(cl(k*2.5)))});
 drops.material.opacity=c*.7;
 // steam
 const sy=cup.position.y+L;
 steam.forEach(sp=>{const u=sp.userData,l=(t*.18+u.o)%1;
  sp.position.set(cupX+u.x*.6+Math.sin(t+u.w+l*5)*.25*l,sy+.1+l*2.4,u.z*.6);
  sp.scale.setScalar(.5+l*1.8);sp.material.opacity=d*Math.sin(l*Math.PI)*.2});
 const mm=Math.max(...chs.map(el=>+el.style.opacity||0)),mob=innerWidth<=700;
 cam.fov=35-4*ease(cl((p-.7)/.3));place(p,mob?0:(grabbed?-.2:.17*mm),(mob?(grabbed?.22:.17*mm):0)-.07*(1-cl(p/.1)),t);bg(p);$('scrim').style.opacity=grabbed?0:mm;

 let best=0,bv=0;chs.forEach((el,i)=>{const[s0,f]=ranges[i],m=cl((p-s0)/.05)*(1-cl((p-f+.05)/.05)),q=ease(m);
  el.style.opacity=q;el.style.filter=`blur(${(1-q)*14}px)`;el.style.clipPath=`inset(-30px ${(1-q)*100}% -30px -30px)`;
  el.style.transform=`translate3d(${(1-q)*-60}px,${mob?0:'-50%'},0)`;if(m>bv){bv=m;best=i}});
 if(best!==hud){hud=best;$('cn').textContent='0'+(best+1);$('cs').textContent=NAMES[best]}
 $('hud').style.opacity=ease(bv);$('rf').style.transform=`scaleY(${p})`;$('pct').textContent=String(Math.round(p*100)).padStart(2,'0');
 const bar=ease(cl((p-.03)/.05))*(1-ease(cl((p-.9)/.08)));$('bt').style.transform=$('bb').style.transform=`scaleY(${bar})`;
 $('flash').style.opacity=Math.max(0,1-Math.abs(p-.215)/.025)*.5+Math.max(0,1-Math.abs(p-.5)/.02)*.35+Math.max(0,1-Math.abs(p-.72)/.02)*.3;
 $('sweep').style.transform=`translateX(${(p*5%1)*300-100}%) skewX(-18deg)`;
 if(fc++%3===0)noise();
 const g2=$('grab'),on=e>.7&&!grabbed;g2.style.opacity=on?1:0;g2.style.pointerEvents=on?'auto':'none';
 R.render(S,cam);
 if(!ready){ready=true;$('load').style.opacity=0;setTimeout(()=>$('load').remove(),900)}
 requestAnimationFrame(frame)}
requestAnimationFrame(frame);

// Shop UI
const PRICE=4.5;let qty=1,cart=0;
$('grab').onclick=()=>{grabbed=true;$('panel').classList.add('open')};
const upd=()=>{$('q').textContent=qty;$('pr').textContent=(qty*PRICE).toFixed(2)};
$('mi').onclick=()=>{qty=Math.max(1,qty-1);upd()};$('pl').onclick=()=>{qty=Math.min(20,qty+1);upd()};
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function render(){$('cc').textContent=cart;$('items').textContent=cart?`Nescafé Iced Classic × ${cart}`:'Your cart is empty. Grab a cup to start.';$('tot').textContent='$'+(cart*PRICE).toFixed(2)}
$('add').onclick=()=>{cart+=qty;render();toast(`Added ${qty} to cart`);$('panel').classList.remove('open');grabbed=false;qty=1;upd();setTimeout(()=>$('drawer').classList.add('open'),500)};
$('cartBtn').onclick=()=>$('drawer').classList.add('open');$('cl').onclick=()=>$('drawer').classList.remove('open');
$('co').onclick=()=>{if(!cart){toast('Your cart is empty');return}toast(`Order placed: ${cart} box${cart>1?'es':''}. Enjoy!`);cart=0;render();$('drawer').classList.remove('open')};

if(matchMedia('(pointer:coarse)').matches)$('hint').textContent='Swipe up to brew ↑';
