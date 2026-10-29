'use strict';
(function(){
/* ================= util ================= */
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rid=n=>Math.random().toString(36).slice(2,2+(n||4));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const ss={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}};
const rnd=n=>{try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}catch(e){return Math.floor(Math.random()*n)}};
const d10=()=>rnd(10)+1;

/* ================= dati di gioco ================= */
const LOCS=[
 {id:1,name:'Lazy Bog',hint:'palude'},
 {id:2,name:'Kjallr’s Wood',hint:'foresta'},
 {id:3,name:'The Rotten Teeth',hint:'scogli in mare'},
 {id:4,name:'Gyfrshal',hint:'luogo fortificato'},
 {id:5,name:'The High Lake',hint:'lago tra i monti'},
 {id:6,name:'Mount Yawny',hint:'montagna'},
 {id:7,name:'Smouldering Shores',hint:'coste fumanti'},
 {id:8,name:'Madman’s Henge',hint:'pietre erette'},
 {id:9,name:'The Singing Stones',hint:'pietre'},
 {id:10,name:'The Ice Palace',hint:'ghiaccio'},
 {id:11,name:'Leviathan Isles',hint:'isole nel mare'}
];
const SCALES=['Persona','Piccolo gruppo','Gruppo organizzato','Villaggio','Comunità sostanziosa','Provincia','Terra'];
const TYPES={
 fighting:{label:'Fighting',rule:'successo se il d10 è sotto il tuo numero',desc:'Solo violenza: sottomettere, mettere fuori gioco, uccidere. Niente dialogo né sfumature.'},
 magic:{label:'Magic',rule:'successo se il d10 è sopra il tuo numero',desc:'Lenta e flessibile: richiede tempo. Informazioni, viaggi, protezione, controllo, trasformazioni.'},
 social:{label:'Social',rule:'successo con il tuo numero o oltre, dal lato meno probabile',desc:'Cambia il comportamento altrui: convincere, guidare, spaventare, sedurre, trattare.'}
};
const PACES={3:{label:'Action by action',it:'azione per azione',max:5},2:{label:'Clash by clash',it:'scontro per scontro',max:3},1:{label:'Entire conflict',it:'intero conflitto',max:1}};
const ITEMS={carried:'Oggetto portato',ally:'Alleato improvviso',found:'Oggetto trovato o raggiunto',spell:'Incantesimo ricordato',geo:'Elemento del terreno'};
const BOXES=[{t:'Tiro iniziale',f:'Scomodata'},{t:'1° roll-again',f:'Ferita'},{t:'2° roll-again',f:'Incapacitata'},{t:'3° roll-again',f:'Alla mercé'}];
const IMP_MAGIC={troll:'Magia troll',human:'Magia umana'};
const IMP_FIGHT={unarmed:'A mani nude',melee:'Armi in mano',missile:'Armi da lancio'};
const IMP_SOCIAL={scary:'Spaventosa',sexy:'Sexy',fun:'Divertente',insightful:'Perspicace',feisty:'Grintosa',perky:'Vivace',remote:'Distaccata',fierce:'Feroce'};
const REL_TYPES={ally:'Alleato',opp:'Avversario',lover:'Amante'};
const STATUS={ok:'In forma',injured:'Ferita',incap:'Incapacitata',dead:'Morta'};

/* ================= regole pure ================= */
function ranges(n){return {fighting:[1,n-1],magic:[n+1,10],social:n<=5?[1,n]:[n,10]};}
function rollOk(type,n,v){if(type==='fighting')return v<n;if(type==='magic')return v>n;return n<=5?v<=n:v>=n;}
function rangeText(r){return r[0]>r[1]?'—':(r[0]===r[1]?String(r[0]):r[0]+'–'+r[1]);}
function adjPace(p,adj){return adj==='up'?Math.min(3,p+1):adj==='down'?Math.max(1,p-1):p;}
function startBox(g){return g.pc&&g.pc.status==='injured'?1:0;}
function lastSeries(c,res){return (res==='success'?c.succ:c.fail)+1>=c.pace;}
// Costo per le Relationship usate come roll-again (tabella a p. 49)
function relCost(outcome,pcStatus){
  if(outcome==='success')return pcStatus==='injured'?'ok':'injured';
  return pcStatus==='incap'?'injured':(pcStatus==='injured'?'killed':'injured');
}
// gli alleati valgono come roll-again solo se sono in scena; avversari e amanti sono sempre nei paraggi
const relHere=r=>r.type!=='ally'||!!r.always||!!r.here;
// un nome conta come «con nome» se contiene, come parola intera, il nome di un PNG già nominato
function namedIn(g,name){
  const s=String(name||'').toLowerCase(),esc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return (g.npcs||[]).some(n=>new RegExp('(^|[^\\p{L}])'+esc(n.name.toLowerCase())+'($|[^\\p{L}])','u').test(s));
}
function availableItems(g){
  const out=Object.entries(ITEMS).filter(([k])=>!(g.checked||[]).includes(k)).map(([k,l])=>({id:k,label:l}));
  (g.rels||[]).filter(r=>!r.dead&&!r.checked&&relHere(r)).forEach(r=>out.push({id:'rel:'+r.id,label:r.name+' ('+REL_TYPES[r.type].toLowerCase()+')'}));
  return out;
}

/* ================= stato globale ================= */
let db=null,user=null,sample=null,room=null,downloads=null,net=null;
let UID=null,CODE=null,ROLE=null,G=null,LOG=[],PRIV=null;
let unsubG=null,unsubL=null,NR=null,PEERS=[];
const ui={declaring:false,tab:'sheet',rev:0,drawer:false};
const D={};            // bozze dei campi
const AI={busy:false,err:null,failedSeq:-1,paused:false,tier:'default',ctl:null,label:'',chatBusy:false,chatErr:null,chatPending:null};
let busy=false;

const ver=()=>G?G.seq+':'+(G.rev||''):null;
// domanda di chiarimento del GM ancora aperta sull’ultima mossa (una nuova mossa la supera)
const askOpen=g=>!!(g&&g.ask&&g.ask.open&&g.ask.at===g.logN);
const isChat=e=>e.type==='ooc'&&!!(e.meta&&e.meta.chat);
// retcon: per ogni voce del diario, le voci «amend» che la correggono (vale l’ultima)
function amendMap(log){const m={};(log||LOG).forEach(e=>{if(e.type==='amend'&&e.meta&&e.meta.of)(m[e.meta.of]=m[e.meta.of]||[]).push(e);});return m;}
const textOf=(e,m)=>{const a=(m||amendMap())[e._id];return a?a[a.length-1].text:e.text;};
// con il GM IA e la trollbabe umana, ciò che lei narra nei conflitti passa dal GM prima del tiro successivo
const needReview=g=>{if(g.seats.gm.kind==='ai'&&g.seats.tb.kind==='human')g.review={from:(g.logN||0)+1};};
const gameRef=c=>db.doc('games/'+c);
const logCol=c=>db.collection('games/'+c+'/log');
const pcName=g=>(g.pc&&g.pc.name)||'La trollbabe';
const seatLabel=(g,s)=>s==='gm'?(g.seats.gm.kind==='ai'?'l’IA (GM)':(g.seats.gm.name||'il GM')):(g.seats.tb.kind==='ai'?'l’IA ('+pcName(g)+')':(g.seats.tb.name||'la giocatrice')+(g.pc&&g.pc.name!==g.seats.tb.name?' ('+pcName(g)+')':''));
const localId=()=>{let id=ls.get('tb:cid');if(!id){id='c_'+rid(12);ls.set('tb:cid',id);}return id;};

/* ================= segreti del GM (privati) ================= */
const secret={
 async get(code){
  try{if(db&&UID){const s=await db.collection('data/users/'+UID).doc('prep-'+code).get();if(s.exists)return clone(s.data());}}catch(e){}
  const v=ls.get('tb:prep:'+code);try{return v?JSON.parse(v):null;}catch(e){return null;}
 },
 async set(code,obj){
  try{if(db&&UID)await db.collection('data/users/'+UID).doc('prep-'+code).set(obj);}catch(e){}
  ls.set('tb:prep:'+code,JSON.stringify(obj));
 }
};

/* ================= scrittura condivisa ================= */
let chain=Promise.resolve();
function tx(fn,guard){
  const gd=(guard===undefined)?ver():guard;
  const run=async()=>{
    if(!G||(gd!=null&&ver()!==gd))return false;
    const g=clone(G),entries=[];
    const push=(type,who,text,meta)=>entries.push({type:type,who:who||'',text:text||'',meta:meta||null});
    if(fn(g,push)===false)return false;
    await commit(g,entries,G.seq,G);
    return true;
  };
  const p=chain.then(run);
  chain=p.catch(()=>{});
  return p;
}
function deepDiff(a,b){
  const isO=x=>x&&typeof x==='object'&&!Array.isArray(x);
  if(!isO(a)||!isO(b))return JSON.stringify(a)===JSON.stringify(b)?undefined:b;
  const d={};let any=false;
  Object.keys(b).forEach(k=>{const r=deepDiff(a[k],b[k]);if(r!==undefined){d[k]=r;any=true;}});
  Object.keys(a).forEach(k=>{if(!(k in b)){d[k]=null;any=true;}});
  return any?d:undefined;
}
async function commit(g,entries,prevSeq,base){
  const col=logCol(g.code);let n=g.logN||0;
  for(const e of entries){
    n++;
    await col.doc(String(n).padStart(6,'0')+'-'+rid(3)).set(JSON.parse(JSON.stringify(Object.assign({},e,{n:n,t:Date.now()}))));
  }
  g.logN=n;g.seq=prevSeq+1;g.rev=rid(5);g.updatedAt=Date.now();
  const out=JSON.parse(JSON.stringify(g));
  if(base){
    // scrivo solo i campi cambiati: due azioni simultanee non si cancellano a vicenda
    const diff=deepDiff(base,out)||{};
    diff.seq=out.seq;diff.rev=out.rev;diff.logN=out.logN;diff.updatedAt=out.updatedAt;
    await gameRef(g.code).update(diff);
  }else await gameRef(g.code).set(out);
  if(G&&G.code===g.code&&G.rev!==out.rev&&G.seq<=out.seq){G=out;render();}
}

/* ================= azioni (motore) ================= */
function setLoc(g,id){const l=LOCS.find(x=>x.id===id)||LOCS[0];g.loc=l.id;g.locName=l.name;}
function resetAdv(g){g.scene=0;g.checked=[];g.npcs=[];g.conflict=null;g.leaving=false;g.request=null;g.reveal=null;g.lastConflict=null;g.relResult=null;(g.rels||[]).forEach(r=>{r.checked=false;});}
function addNpcs(g,list){
  (list||[]).forEach(n=>{n=String(n||'').trim().slice(0,60);if(n&&!g.npcs.some(x=>x.name.toLowerCase()===n.toLowerCase()))g.npcs.push({name:n});});
}
function beginEnd(g,push,why){g.step='ending';g.endWhy=why;push('sys','',why+' L’avventura volge al termine.');}
function startConflict(g,push,seat,o){
  g.conflict={by:seat,type:o.type,pace:o.pace,goal:o.goal||'',succ:0,fail:0,series:1,box:0,roll:null,kind:null,usedRels:[],
    fair:{gm:'',tb:'',gmOk:false,tbOk:false,turn:'tb',round:0},stage:seat==='tb'?'pace':'goal',departing:!!g.leaving,lastNarr:null};
  g.leaving=false;g.step='conflict';
  push('sys','','Conflict! '+(seat==='tb'?pcName(g):'Il GM')+' dichiara un conflitto '+TYPES[o.type].label+'.');
}
function useItem(g,id){
  const c=g.conflict;
  if(String(id).indexOf('rel:')===0){
    const r=(g.rels||[]).find(x=>x.id===String(id).slice(4)&&!x.dead&&!x.checked);
    if(!r)return null;r.checked=true;c.usedRels.push(r.id);return r.name;
  }
  if(!ITEMS[id]||(g.checked||[]).includes(id))return null;
  g.checked.push(id);return ITEMS[id];
}
function endSeries(g,push,result){
  const c=g.conflict;
  if(result==='success')c.succ++;else c.fail++;
  const need=c.pace,over=g.pc.status==='incap'||g.pc.status==='dead';
  let done=null;
  if(c.succ>=need&&!over)done='success';
  else if(c.fail>=need||over)done='fail';
  if(done){
    c.outcome=done;
    push('sys','','Conflict concluso: Goal '+(done==='success'?'raggiunto':'fallito')+' (Serie riuscite '+c.succ+', fallite '+c.fail+').');
    if(c.usedRels.length){
      c.stage='rels';
      const she=g.pc.status==='injured'?'injured':(g.pc.status==='incap'||g.pc.status==='dead')?'incap':'ok';
      c.relCosts=c.usedRels.map(id=>({id:id,status:relCost(done,she)}));
    }else afterConflict(g,push);
  }else{
    c.series++;c.box=startBox(g);c.sb=c.box;c.stage='step';c.step={gm:null,tb:null};c.kind=null;c.roll=null;
    push('sys','','Serie '+(c.succ+c.fail)+' chiusa: '+c.succ+' riuscite, '+c.fail+' fallite. Si continua.');
  }
}
function afterConflict(g,push){
  const c=g.conflict;
  g.lastConflict={type:c.type,pace:c.pace,goal:c.goal,outcome:c.outcome};
  const dep=c.departing,out=c.outcome;
  g.turn=(c.lastNarr==='gm')?'tb':'gm';
  g.conflict=null;
  if(g.pc.status==='dead'){beginEnd(g,push,'La trollbabe è morta.');return;}
  if(dep&&out==='success'){beginEnd(g,push,'La trollbabe lascia il luogo.');return;}
  g.step=g.pc.status==='incap'?'scene_play':'rel_offer';
  if(g.pc.status==='incap')g.turn='gm';
}
function startSeries(g,push){
  const c=g.conflict;
  push('conflict','','',{type:c.type,pace:c.pace,goal:c.goal,by:c.by});
  push('gm','gm',c.fair.gm,{kind:'fair'});push('tb','tb',c.fair.tb,{kind:'fair'});
  c.stage='roll';c.box=startBox(g);c.sb=c.box;c.roll=null;
}
function addRel(g,o){
  g.rels.push({id:'r'+rid(5),name:o.name,type:o.type,note:o.note||'',checked:false,status:'ok',here:true});
}

const A={
 createPC(pc,loc){return tx((g,push)=>{
  if(g.pc)g.adv=(g.adv||1)+1;
  g.pc=Object.assign({},pc,{status:'ok'});g.rels=[];setLoc(g,loc);resetAdv(g);g.step='gm_prep';
  push('sys','',pc.name+' (numero '+pc.number+') si mette in cammino verso '+g.locName+'.');
 });},
 savePrep(priv){return (async()=>{
  await secret.set(CODE,priv);PRIV=priv;
  return tx((g,push)=>{g.step='scene_open';g.reveal=null;push('sys','','Avventura preparata a '+g.locName+'. Stakes e retroscena restano segreti.');});
 })();},
 openScene(text,npcs,heal){return tx((g,push)=>{
  g.scene=(g.scene||0)+1;
  if(g.request&&g.request.heal&&heal&&g.pc.status!=='dead'){g.pc.status='ok';g.pc.hurt=null;push('sys','','Scena di cura: ferite e incapacità guarite.');}
  g.request=null;addNpcs(g,npcs);
  (g.rels||[]).forEach(r=>{if(!r.always)r.here=false;});
  push('scene','gm',text,{scene:g.scene,loc:g.locName});
  g.step='scene_play';g.turn='tb';
 });},
 say(seat,text,npcs){return tx((g,push)=>{
  if(g.step!=='scene_play')return false;
  if(seat==='gm')addNpcs(g,npcs);
  push(seat,seat,text);g.turn=seat==='gm'?'tb':'gm';
 });},
 async ooc(seat,text,meta){
  // nota fuori gioco: solo una voce di diario, senza toccare lo stato condiviso (né ver())
  if(!G)return;
  const n=(G.logN||0)+1;
  await logCol(G.code).doc(String(n).padStart(6,'0')+'-o'+Date.now().toString(36)+rid(2)).set({type:'ooc',who:seat,text:text,meta:meta||null,n:n,t:Date.now()});
 },
 askClose(){return tx(g=>{if(!askOpen(g))return false;g.ask.open=false;});},
 endScene(){return tx((g,push)=>{if(g.step!=='scene_play')return false;push('sys','','Fine della scena.');g.step='scene_request';});},
 request(text,heal){return tx((g,push)=>{
  g.request={text:text||'',heal:!!heal};
  push('sys','',pcName(g)+(text?' chiede la prossima scena: «'+text+'»':' lascia al GM la scelta della prossima scena')+(heal?' (scena di cura).':'.'));
  g.step='scene_open';
 });},
 leave(){return tx((g,push)=>{g.leaving=true;g.turn='gm';push('sys','',pcName(g)+' vuole lasciare il luogo.');});},
 askEnd(){return tx((g,push)=>{if(g.step!=='scene_play')return false;push('ooc','tb','Possiamo chiudere la scena?');g.turn='gm';});},
 beginEnding(why){return tx((g,push)=>{if(g.step!=='scene_play')return false;g.leaving=false;beginEnd(g,push,why||'Il GM conclude l’avventura.');});},
 finishEnding(outcomeText,epilogue,priv){return tx((g,push)=>{
  if(g.step!=='ending')return false;
  if(epilogue)push('gm','gm',epilogue,{kind:'epilogue'});
  push('sys','','Stakes: '+outcomeText);
  g.reveal=Object.assign({},priv||{},{outcome:outcomeText});
  push('sys','','— Fine dell’avventura —');
  g.conflict=null;g.leaving=false;g.request=null;
  g.step=g.pc.status==='dead'?'tb_create':'interim';
 });},
 interim(o){return tx((g,push)=>{
  if(g.step!=='interim')return false;
  const before=g.pc.number;
  g.pc.number=clamp(g.pc.number+(o.delta||0),2,9);
  if(g.pc.number!==before)push('sys','',pcName(g)+' passa dal numero '+before+' al numero '+g.pc.number+'.');
  (g.rels||[]).slice().forEach(r=>{
   const m=(o.rels||{})[r.id];
   if(m==='drop'){g.rels=g.rels.filter(x=>x.id!==r.id);push('sys','','La Relationship con '+r.name+' si scioglie.');}
   else if(m==='swap'&&r.type!=='lover'){r.type=r.type==='ally'?'opp':'ally';push('sys','',r.name+' diventa '+REL_TYPES[r.type].toLowerCase()+'.');}
  });
  if(o.scaleUp&&g.scale<7){g.scale++;push('sys','','Il Scale sale a '+g.scale+': '+SCALES[g.scale-1]+'.');}
  g.adv=(g.adv||1)+1;setLoc(g,o.loc);resetAdv(g);g.step='gm_prep';
  push('sys','',pcName(g)+' si dirige verso '+g.locName+'.');
 });},
 /* conflitti */
 declare(seat,o){return tx((g,push)=>{
  if(g.step!=='scene_play'||g.pc.status==='incap'||!TYPES[o.type])return false;
  startConflict(g,push,seat,{type:o.type,pace:clamp(parseInt(o.pace,10)||2,1,3),goal:o.goal});
 });},
 setGoal(goal,adj){return tx((g,push)=>{
  const c=g.conflict;if(!c||c.stage!=='goal')return false;
  c.goal=goal;const p=adjPace(c.pace,adj);
  if(p!==c.pace){push('sys','',pcName(g)+' sposta il Pace: '+PACES[p].label+'.');c.pace=p;}
  c.stage='fair';
 });},
 paceAdj(adj){return tx((g,push)=>{
  const c=g.conflict;if(!c||c.stage!=='pace')return false;
  const p=adjPace(c.pace,adj);
  if(p!==c.pace){push('sys','','Il GM sposta il Pace: '+PACES[p].label+'.');c.pace=p;}
  c.stage='fair';
 });},
 // Fair and clear a turni: dichiarare vale come accettare la propria versione e passa la mano
 fairSay(seat,text){return tx((g,push)=>{
  const c=g.conflict;if(!c||c.stage!=='fair'||c.fair.turn!==seat)return false;
  const o=seat==='gm'?'tb':'gm';
  c.fair[seat]=text;c.fair[seat+'Ok']=true;c.fair[o+'Ok']=false;c.fair.turn=o;c.fair.round++;
 });},
 fairOk(seat){return tx((g,push)=>{
  const c=g.conflict;if(!c||c.stage!=='fair'||c.fair.turn!==seat||!c.fair.gm||!c.fair.tb)return false;
  c.fair[seat+'Ok']=true;
  if(c.fair.gmOk&&c.fair.tbOk)startSeries(g,push);else c.fair.turn=seat==='gm'?'tb':'gm';
 });},
 // passo prima di ogni Serie successiva: mossa degli avversari (anche nessuna), poi azione della trollbabe
 stepSay(seat,text){return tx((g,push)=>{
  const c=g.conflict;if(!c||c.stage!=='step')return false;
  if(seat==='gm'&&c.step.gm===null){c.step.gm=text||'';if(text)push('gm','gm',text,{kind:'step'});return;}
  if(seat==='tb'&&c.step.gm!==null&&text){c.step.tb=text;push('tb','tb',text,{kind:'step'});c.stage='roll';needReview(g);return;}
  return false;
 });},
 roll(v){return tx((g,push)=>{
  const c=g.conflict;if(!c||c.stage!=='roll'||g.review||g.objection)return false;
  const ok=rollOk(c.type,g.pc.number,v),box=c.box;
  c.roll={v:v,ok:ok,box:box};
  push('roll','tb','',{v:v,ok:ok,box:box,type:c.type,n:g.pc.number,series:c.series});
  if(ok){
   if(box<=2){c.stage='narr_gm';c.kind='success';}
   else{c.stage='narr_tb';c.kind='alt_incap';g.pc.status='incap';}
  }else if(box===0){c.stage='narr_tb';c.kind='inconv';}
  else if(box===1){c.stage='narr_tb';c.kind='injury';if(g.pc.status==='ok')g.pc.status='injured';}
  else if(box===2){c.stage='narr_gm';c.kind='incap';g.pc.status='incap';}
  else{c.stage='decide_tb';c.kind='fate';g.pc.status='incap';}
 });},
 narrGM(text){return tx((g,push)=>{
  const c=g.conflict;if(!c||c.stage!=='narr_gm')return false;
  push('gm','gm',text,{kind:c.kind});c.lastNarr='gm';
  if(c.kind==='incap')g.pc.hurt=String(text).slice(0,300);
  if(c.kind==='success')endSeries(g,push,'success');
  else c.stage='decide_tb';
 });},
 narrTB(text,choice){return tx((g,push)=>{
  const c=g.conflict;if(!c||c.stage!=='narr_tb')return false;
  push('tb','tb',text,{kind:c.kind});c.lastNarr='tb';needReview(g);
  if(c.kind==='injury'&&!g.pc.hurt)g.pc.hurt=String(text).slice(0,300);
  if(c.kind==='alt_incap'){endSeries(g,push,'fail');return;}
  if(choice&&choice.item){
   const lab=useItem(g,choice.item);if(!lab)return false;
   c.box++;c.stage='roll';c.roll=null;push('sys','','Roll-again: '+lab+'.');
   if(choice.how)push('tb','tb',choice.how,{kind:'item'});
  }else endSeries(g,push,'fail');
 });},
 decide(choice){return tx((g,push)=>{
  const c=g.conflict;if(!c||c.stage!=='decide_tb')return false;
  if(c.kind==='incap'){
   if(choice.item){
    const lab=useItem(g,choice.item);if(!lab)return false;
    if(choice.text){push('tb','tb',choice.text,{kind:'item'});c.lastNarr='tb';needReview(g);}
    c.box=3;c.stage='roll';c.roll=null;push('sys','','Ultimo roll-again: '+lab+'.');
   }else endSeries(g,push,'fail');
  }else{
   if(choice.die){g.pc.status='dead';push('tb','tb',choice.text||'',{kind:'death'});c.lastNarr='tb';endSeries(g,push,'fail');}
   else{push('sys','','La narrazione del GM resta.');endSeries(g,push,'fail');}
  }
 });},
 confirmRels(map){return tx((g,push)=>{
  const c=g.conflict;if(!c||c.stage!=='rels')return false;
  c.usedRels.forEach(id=>{
   const r=g.rels.find(x=>x.id===id);if(!r)return;
   const s=(map&&map[id])||'ok';
   if(s==='killed'){r.dead=true;push('sys','',r.name+' non sopravvive.');}
   else if(s==='injured'){r.status='injured';push('sys','',r.name+' resta ferito.');}
   else r.status='ok';
  });
  afterConflict(g,push);
 });},
 amend(seat,id,text){return tx((g,push)=>{
  const e=LOG.find(x=>x._id===id);
  if(!e||e.who!==seat||['scene','gm','tb'].indexOf(e.type)<0||!text||text===textOf(e))return false;
  push('amend',seat,text,{of:id});
  if(g.objection&&g.objection.of===id)g.objection=null;
 });},
 objectionClose(){return tx(g=>{if(!g.objection)return false;g.objection=null;});},
 relSkip(){return tx((g)=>{if(g.step!=='rel_offer')return false;g.step='scene_play';});},
 relPropose(o){return tx((g,push)=>{
  if(g.step!=='rel_offer')return false;
  if(o.text)push('tb','tb',o.text,{kind:'rel'});
  const named=namedIn(g,o.name);
  if(!named){addRel(g,o);push('sys','','Nuova Relationship: '+o.name+' ('+REL_TYPES[o.type].toLowerCase()+').');g.step='scene_play';}
  else{g.relProposal={name:o.name,type:o.type,note:o.note||''};g.step='rel_approve';push('sys','',pcName(g)+' propone una Relationship con '+o.name+' (personaggio con nome: decide il GM).');}
 });},
 relApprove(ok){return tx((g,push)=>{
  if(g.step!=='rel_approve'||!g.relProposal)return false;
  const p=g.relProposal;
  if(ok){addRel(g,p);push('sys','','Il GM accetta: '+p.name+' diventa una Relationship ('+REL_TYPES[p.type].toLowerCase()+').',{kind:'rel_ok'});}
  else push('sys','','Il GM pone il veto: per ora '+p.name+' non diventa una Relationship.',{kind:'veto'});
  g.relResult={id:rid(4),name:p.name,ok:!!ok,type:p.type};
  g.relProposal=null;g.step='scene_play';
 });},
 relRename(id,name){return tx((g,push)=>{
  const r=(g.rels||[]).find(x=>x.id===id),n=String(name||'').trim().slice(0,60);
  if(!r||!n||n===r.name)return false;
  if(!r.note)r.note=r.name;
  push('sys','',r.name+' ora si chiama '+n+'.');
  r.name=n;addNpcs(g,[n]);
 });},
 relPresence(id,o){return tx(g=>{
  const r=(g.rels||[]).find(x=>x.id===id);if(!r||r.type!=='ally')return false;
  if('here' in o)r.here=!!o.here;
  if('always' in o){r.always=!!o.always;if(r.always)r.here=true;}
 });},
 relBreak(id){return tx((g,push)=>{
  const r=g.rels.find(x=>x.id===id);if(!r)return false;
  g.rels=g.rels.filter(x=>x.id!==id);push('sys','',pcName(g)+' chiude la Relationship con '+r.name+': torna un PNG qualunque.');
 });}
};

function expected(g){
 g=g||G;if(!g)return [];
 if(g.review)return ['gm'];
 if(g.objection)return ['tb'];
 const c=g.conflict;
 switch(g.step){
  case 'tb_create':case 'scene_request':case 'rel_offer':case 'interim':return ['tb'];
  case 'gm_prep':case 'scene_open':case 'rel_approve':case 'ending':return ['gm'];
  case 'scene_play':return [g.turn||'tb'];
  case 'conflict':
   if(!c)return [];
   switch(c.stage){
    case 'goal':case 'roll':case 'narr_tb':case 'decide_tb':case 'rels':return ['tb'];
    case 'pace':case 'narr_gm':return ['gm'];
    case 'fair':return [c.fair.turn||'tb'];
    case 'step':return [c.step&&c.step.gm===null?'gm':'tb'];
   }
 }
 return [];
}
