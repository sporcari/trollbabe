
/* ================= mappa del mondo ================= */
// Il terreno si ricalcola dal seme (niente immagini nello stato condiviso); nomi e coordinate dei luoghi
// invece si salvano in g.map.places, così i due client li vedono uguali anche con font diversi.
const MAP_W=680,MAP_H=440,MAP_CELL=4;
const WORLDS={arcipelago:{label:'Arcipelago',land:.22},continenti:{label:'Grandi continenti',land:.42},fiordi:{label:'Fiordi e coste frastagliate',land:.48}};
const SYL=['Skar','Hval','Ulf','Trond','Grim','Hel','Kvar','Brann','Fjal','Myr','Sig','Rav','Tor','Hjal','Ved','Ørn','Kjøl','Svart','Bjar','Stein','Hrafn','Ask','Dun','Frost','Lyng','Mor','Nid','Odd','Ran','Snø','Vind','Gnip','Tjørn'];
const SUF={costa:['vik','nes','fjord','sund','havn','holm','by'],terra:['heim','stad','dal','gard','rud','vang','set'],isola:['øy','holm','ey','skjær'],picco:['tind','fjell','horn','berg'],riva:['nes','strand','vik'],entro:['dal','mark','skog','myr']};
const MARI=['dei Corvi','dei Lupi','dei Ghiacci','dei Silenzi','delle Nebbie','dei Naufragi','delle Balene'];
const KIND_HINT={costa:'villaggio sulla costa',terra:'villaggio nell’entroterra',picco:'picco',tana:'tana dei troll tra i monti',riva:'luogo sulla costa',monti:'luogo tra i monti',entro:'luogo nell’entroterra'};
const DEST_KINDS=['costa','terra','picco','tana','riva','monti','entro'];

function hashStr(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// solo imul, floor e operazioni elementari: stesso risultato in ogni browser (niente Math.pow)
function noiseFor(seed){
 const sh=hashStr(seed)|0;
 const hs=(x,y)=>{let h=Math.imul(x,374761393)+Math.imul(y,668265263)+sh|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};
 const vn=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);const a=hs(ix,iy),b=hs(ix+1,iy),c=hs(ix,iy+1),d=hs(ix+1,iy+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
 return (x,y,o,p)=>{let a=1,f=1,s=0,n=0;for(let i=0;i<o;i++){s+=a*vn(x*f+i*17.3,y*f-i*9.1);n+=a;a*=p;f*=2;}return s/n;};
}
const TERRAIN={key:null,t:null};
function terrain(m){
 const key=m.seed+'|'+m.mode+'|'+m.land+'|'+m.rough;
 if(TERRAIN.key===key)return TERRAIN.t;
 const W=MAP_W,H=MAP_H,fbm=noiseFor(m.seed),rough=m.rough,E=new Float32Array(W*H),asp=W/H,pers=.45+.15*rough;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const nu=x/W,nv=y/H,u=nu*asp,v=nv,ed=Math.max(Math.abs(2*nu-1),Math.abs(2*nv-1)),fall=ed*ed*ed*ed;
  const wf=m.mode==='continenti'?3:4,w=(m.mode==='continenti'?.35:m.mode==='arcipelago'?.25:.3)*rough;
  const wx=u+w*(fbm(u*wf,v*wf,3,.5)-.5)*2,wy=v+w*(fbm(u*wf+5.2,v*wf+1.3,3,.5)-.5)*2;
  let e;
  if(m.mode==='continenti')e=fbm(wx*1.8,wy*1.8,6,pers)-.45*fall;
  else if(m.mode==='arcipelago')e=fbm(wx*7,wy*7,4,pers)-.15*fall;
  else{const r=1-Math.abs(2*fbm(wx*6,wy*6,3,.5)-1),r2=r*r;e=fbm(wx*1.6,wy*1.6,5,pers)-(.08+.3*rough)*r2*r2*r2-.4*fall;}
  E[y*W+x]=e;
 }
 const s=[];for(let i=0;i<E.length;i+=7)s.push(E[i]);s.sort((a,b)=>a-b);
 const sea=s[Math.floor((1-m.land)*s.length)],mx=s[s.length-1];
 const L=new Uint8Array(W*H);for(let i=0;i<E.length;i++)L[i]=E[i]>sea?1:0;
 // distanza dalla costa (per terra e mare), chamfer a due passate
 const D=new Float32Array(W*H).fill(1e9);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(x<W-1&&L[i]!==L[i+1])D[i]=D[i+1]=0;if(y<H-1&&L[i]!==L[i+W])D[i]=D[i+W]=0;}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let v=D[i];if(x>0)v=Math.min(v,D[i-1]+1);if(y>0){v=Math.min(v,D[i-W]+1);if(x>0)v=Math.min(v,D[i-W-1]+1.414);if(x<W-1)v=Math.min(v,D[i-W+1]+1.414);}D[i]=v;}
 for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;let v=D[i];if(x<W-1)v=Math.min(v,D[i+1]+1);if(y<H-1){v=Math.min(v,D[i+W]+1);if(x<W-1)v=Math.min(v,D[i+W+1]+1.414);if(x>0)v=Math.min(v,D[i+W-1]+1.414);}D[i]=v;}
 // terre emerse (componenti connesse su una griglia di 4 px)
 const gw=W/MAP_CELL|0,gh=H/MAP_CELL|0,C=new Int32Array(gw*gh).fill(-1),comps=[],cp=c=>((c/gw|0)*MAP_CELL+2)*W+(c%gw)*MAP_CELL+2;
 for(let c=0;c<gw*gh;c++){
  if(!L[cp(c)]||C[c]>=0)continue;
  const id=comps.length,q=[c];C[c]=id;let area=0,best=cp(c);
  while(q.length){const k=q.pop(),kx=k%gw,ky=k/gw|0,kp=cp(k);area++;if(D[kp]>D[best])best=kp;
   for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=kx+dx,ny=ky+dy;if(nx<0||ny<0||nx>=gw||ny>=gh)continue;const n=ny*gw+nx;if(C[n]<0&&L[cp(n)]){C[n]=id;q.push(n);}}}
  comps.push({id:id,area:area,x:best%W,y:best/W|0});
 }
 const t={E:E,L:L,D:D,sea:sea,mx:mx,C:C,gw:gw,comps:comps,hn:i=>(E[i]-sea)/(mx-sea)};
 t.comp=(x,y)=>{const cx=clamp(x/MAP_CELL|0,0,gw-1),cy=clamp(y/MAP_CELL|0,0,gh-1);return C[cy*gw+cx];};
 TERRAIN.key=key;TERRAIN.t=t;
 return t;
}
function mapNamer(m,salt){
 const R=mulberry(hashStr(m.seed+'#'+(salt!=null?salt:m.places?m.places.length:0)));
 const names=(m.places||[]).map(p=>p.name),used=new Set(names),pick=a=>a[Math.floor(R()*a.length)];
 // radici diverse per luoghi diversi: «Torøy» e «Torey» sulla stessa mappa si confondono
 const stems=new Set(SYL.filter(st=>names.some(n=>n.indexOf(st)>=0)));
 const stem=()=>{let st='';for(let k=0;k<40;k++){st=pick(SYL);if(!stems.has(st))break;}stems.add(st);return st;};
 return {R:R,pick:pick,stem:stem,name(t){let n='';for(let k=0;k<40;k++){n=(k<30?stem():pick(SYL))+pick(SUF[t]);if(!used.has(n))break;}used.add(n);return n;}};
}
function newMap(seed,mode){
 mode=WORLDS[mode]?mode:'fiordi';
 const m={seed:String(seed),mode:mode,land:WORLDS[mode].land,rough:.65,places:[]};
 const t=terrain(m),W=MAP_W,H=MAP_H,N=mapNamer(m),R=N.R,places=m.places;
 const far=(x,y,r)=>places.every(p=>p.kind==='isola'||p.kind==='terre'||p.kind==='mare'||(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y)>r*r);
 const add=(kind,name,x,y)=>{const p={id:'p'+places.length,name:name,kind:kind,x:x,y:y};const c=t.comp(x,y);if(c>=0)p.c=c;places.push(p);return p;};
 const cand=[];for(let y=10;y<H-10;y+=4)for(let x=10;x<W-10;x+=4){const i=y*W+x;if(t.L[i]&&t.hn(i)>.68&&t.D[i]>6)cand.push([t.E[i],x,y]);}
 cand.sort((a,b)=>b[0]-a[0]);
 let np=0;for(const[,x,y]of cand){if(np>=3)break;if(far(x,y,100)){add(np?'picco':'tana',np?N.name('picco'):'Tana dei troll',x,y);np++;}}
 const co=[],te=[];for(let y=12;y<H-12;y+=5)for(let x=12;x<W-12;x+=5){const i=y*W+x;if(!t.L[i])continue;if(t.D[i]>=2&&t.D[i]<=7)co.push({x:x,y:y});else if(t.D[i]>12)te.push({x:x,y:y});}
 const sh=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const x=a[i];a[i]=a[j];a[j]=x;}return a;};
 [[sh(co),'costa',8],[sh(te),'terra',3]].forEach(([list,kind,max])=>{let k=0;for(const p of list){if(k>=max)break;if(far(p.x,p.y,62)){add(kind,N.name(kind),p.x,p.y);k++;}}});
 const tot=t.comps.reduce((s,c)=>s+c.area,0);
 t.comps.slice().sort((a,b)=>b.area-a.area).slice(0,7).forEach(c=>{
  if(c.area<35)return;
  const big=c.area>.35*tot&&mode!=='arcipelago';
  const p=add(big?'terre':'isola',big?'Terre di '+N.stem()+N.pick(['land','mark','rike']):N.name('isola'),c.x,c.y);p.c=c.id;
 });
 let sp=null,sd=0;for(let y=20;y<H-20;y+=3)for(let x=40;x<W-40;x+=3){const i=y*W+x;if(!t.L[i]&&t.D[i]>sd){sd=t.D[i];sp={x:x,y:y};}}
 if(sp)add('mare','Mare '+N.pick(MARI),sp.x,sp.y);
 places.forEach(p=>{if(DEST_KINDS.indexOf(p.kind)>=0)p.hint=placeHint(m,p);});
 return m;
}
function placeHint(m,p){
 const land=p.c!=null&&(m.places||[]).find(q=>q.c===p.c&&(q.kind==='isola'||q.kind==='terre'));
 return KIND_HINT[p.kind]+(land?(land.kind==='isola'?' di ':' nelle ')+land.name:'');
}
const isDest=p=>DEST_KINDS.indexOf(p.kind)>=0;
// punto toccato sulla mappa: il luogo con nome più vicino, altrimenti un luogo nuovo; null se è mare
function placeAt(m,x,y){
 x=Math.round(clamp(x,0,MAP_W-1));y=Math.round(clamp(y,0,MAP_H-1));
 let best=null,bd=22*22;
 m.places.filter(isDest).forEach(p=>{const d=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y);if(d<bd){bd=d;best=p;}});
 if(best)return best;
 const t=terrain(m),i=y*MAP_W+x;
 if(!t.L[i])return null;
 const kind=t.D[i]<=6?'riva':t.hn(i)>.55?'monti':'entro';
 const N=mapNamer(m,x+':'+y),p={id:'p'+m.places.length+'-'+hashStr(x+':'+y).toString(36).slice(0,4),name:N.name(kind==='monti'?'picco':kind),kind:kind,x:x,y:y,fresh:true};
 const c=t.comp(x,y);if(c>=0)p.c=c;
 p.hint=placeHint(m,p);
 return p;
}
function mapNear(g,n){
 const m=g.map,cur=m&&m.places.find(p=>p.id===g.loc);if(!cur)return [];
 return m.places.filter(p=>isDest(p)&&p.id!==cur.id).sort((a,b)=>((a.x-cur.x)*(a.x-cur.x)+(a.y-cur.y)*(a.y-cur.y))-((b.x-cur.x)*(b.x-cur.x)+(b.y-cur.y)*(b.y-cur.y))).slice(0,n);
}

/* disegno: carta e inchiostro, colori presi dal tema */
const MAPIMG={key:null,c:null};
function hexRGB(s){s=String(s||'').trim().replace('#','');if(s.length===3)s=s.split('').map(c=>c+c).join('');const n=parseInt(s,16);return isNaN(n)?[128,128,128]:[n>>16&255,n>>8&255,n&255];}
const mixRGB=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
function mapColors(){const cs=getComputedStyle(document.documentElement),g=n=>hexRGB(cs.getPropertyValue(n));return {P:g('--paper'),I:g('--ink'),F:g('--fjord'),font:(cs.getPropertyValue('--serif')||'serif').trim()};}
function terrainImage(m,col){
 const t=terrain(m),key=TERRAIN.key+'|'+col.P+col.I+col.F;
 if(MAPIMG.key===key)return MAPIMG.c;
 const W=MAP_W,H=MAP_H,o=document.createElement('canvas');o.width=W;o.height=H;
 const oc=o.getContext('2d');if(!oc)return null;
 const lb=mixRGB(col.P,[186,117,23],.07),sb=mixRGB(col.P,col.F,.16),img=oc.createImageData(W,H),px=img.data;
 for(let i=0;i<t.E.length;i++){
  const d=t.D[i];let c;
  if(t.L[i]){const h=t.hn(i);c=mixRGB(lb,col.I,h>.45?.2*(h-.45)/.55:0);if(d<1.2)c=mixRGB(c,col.I,.85);}
  else{c=sb;if(d<1.2)c=mixRGB(c,col.I,.85);else{const a=Math.abs(d-4)<.6?.35:Math.abs(d-9)<.5?.22:Math.abs(d-15)<.5?.12:0;c=mixRGB(c,col.I,a);}}
  px[i*4]=c[0];px[i*4+1]=c[1];px[i*4+2]=c[2];px[i*4+3]=255;
 }
 oc.putImageData(img,0,0);
 const R=mulberry(hashStr(m.seed+'^'));oc.strokeStyle='rgb('+col.I.join(',')+')';oc.lineWidth=1;oc.lineJoin='round';
 for(let y=8;y<H-8;y+=13)for(let x=8;x<W-8;x+=13){
  const jx=Math.round(x+(R()-.5)*8),jy=Math.round(y+(R()-.5)*8),i=jy*W+jx,h=t.hn(i);
  if(!t.L[i]||h<.52||t.D[i]<5)continue;
  if(m.places.some(p=>isDest(p)&&(p.x-jx)*(p.x-jx)+(p.y-jy)*(p.y-jy)<196))continue;
  const z=3+5*(h-.52)/.48;
  oc.beginPath();oc.moveTo(jx-z,jy+z*.6);oc.lineTo(jx,jy-z*.7);oc.lineTo(jx+z,jy+z*.6);oc.stroke();
  oc.beginPath();oc.moveTo(jx,jy-z*.7);oc.lineTo(jx+z*.3,jy+z*.6);oc.stroke();
 }
 MAPIMG.key=key;MAPIMG.c=o;
 return o;
}
// o: {cur: id del luogo attuale, pick: luogo scelto (anche nuovo)}
function drawMap(cv,m,o){
 o=o||{};
 let ctx=null;try{ctx=cv.getContext('2d');}catch(e){}
 if(!ctx)return;
 const col=mapColors(),img=terrainImage(m,col);if(!img)return;
 const dpr=window.devicePixelRatio||1,W=MAP_W,H=MAP_H;
 cv.width=W*dpr;cv.height=H*dpr;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.drawImage(img,0,0,W,H);
 const ink='rgb('+col.I.join(',')+')',paper='rgb('+mixRGB(col.P,[186,117,23],.07).map(Math.round).join(',')+')',rune=getComputedStyle(document.documentElement).getPropertyValue('--rune').trim()||ink;
 const rects=[];
 const hit=r=>r.x<2||r.y<2||r.x+r.w>W-2||r.y+r.h>H-2||rects.some(q=>r.x<q.x+q.w&&r.x+r.w>q.x&&r.y<q.y+q.h&&r.y+r.h>q.y);
 const label=(t,x,y,font,alpha,center,color)=>{
  ctx.font=font;const w=ctx.measureText(t).width,h=14;
  const opts=center?[[x-w/2,y-h/2]]:[[x+7,y-h/2],[x-7-w,y-h/2],[x-w/2,y-h-6],[x-w/2,y+6]];
  for(const[ax,ay]of opts){const r={x:ax-2,y:ay-1,w:w+4,h:h+2};if(hit(r))continue;rects.push(r);
   ctx.textBaseline='top';ctx.lineWidth=3;ctx.strokeStyle=paper;ctx.globalAlpha=1;ctx.strokeText(t,ax,ay);ctx.globalAlpha=alpha;ctx.fillStyle=color||ink;ctx.fillText(t,ax,ay);ctx.globalAlpha=1;return;}
 };
 const all=m.places.concat(o.pick&&!m.places.some(p=>p.id===o.pick.id)?[o.pick]:[]);
 const rank=p=>p.id===(o.pick&&o.pick.id)?0:p.id===o.cur?1:p.visited?2:3;
 const dest=all.filter(isDest).sort((a,b)=>rank(a)-rank(b));
 dest.forEach(p=>rects.push({x:p.x-5,y:p.y-5,w:10,h:10}));
 dest.slice().reverse().forEach(p=>{
  const hl=rank(p)<2;ctx.fillStyle=paper;ctx.beginPath();ctx.arc(p.x,p.y,hl?7:4,0,7);ctx.fill();
  ctx.fillStyle=hl?rune:ink;ctx.strokeStyle=hl?rune:ink;
  if(p.kind==='picco'||p.kind==='tana'||p.kind==='monti'){ctx.beginPath();ctx.moveTo(p.x-6,p.y+5);ctx.lineTo(p.x,p.y-6);ctx.lineTo(p.x+6,p.y+5);ctx.closePath();ctx.fill();}
  else{ctx.beginPath();ctx.arc(p.x,p.y,p.visited||hl?3:2.6,0,7);if(p.visited&&!hl){ctx.lineWidth=1.4;ctx.stroke();}else ctx.fill();}
  if(hl){ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(p.x,p.y,9,0,7);ctx.stroke();}
 });
 dest.forEach(p=>{const hl=rank(p)<2;label(p.name,p.x,p.y,(hl?'600 13px ':(p.kind==='costa'||p.kind==='terra'?'':'italic ')+'12px ')+col.font,1,false,hl?rune:null);});
 all.filter(p=>p.kind==='isola'||p.kind==='terre').forEach(p=>label(p.name,p.x,p.y,'italic 15px '+col.font,.75,true));
 all.filter(p=>p.kind==='mare').forEach(p=>label(p.name,p.x,p.y,'italic 15px '+col.font,.6,true));
 ctx.strokeStyle=ink;ctx.lineWidth=1;ctx.strokeRect(.5,.5,W-1,H-1);
}
