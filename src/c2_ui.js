/* ================= UI: helper ================= */
const nl=t=>esc(t).replace(/\n/g,'<br>');
function toast(m,ms){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),ms||3800);}
function btn(label,act,cls,extra){return '<button type="button" class="btn '+(cls||'')+'" data-act="'+act+'" '+(extra||'')+'>'+label+'</button>';}
function fld(name,label,o){
 o=o||{};const v=D[name]!=null?D[name]:(o.def||'');
 const lab='<label for="f-'+name+'">'+label+'</label>';
 if(o.rows)return '<div class="fld">'+lab+'<textarea id="f-'+name+'" data-d="'+name+'" rows="'+o.rows+'" placeholder="'+esc(o.ph||'')+'">'+esc(v)+'</textarea></div>';
 return '<div class="fld">'+lab+'<input id="f-'+name+'" data-d="'+name+'" type="text" value="'+esc(v)+'" placeholder="'+esc(o.ph||'')+'"'+(o.list?' list="'+o.list+'"':'')+(o.max?' maxlength="'+o.max+'"':'')+'></div>';
}
function seg(name,opts,def,cls,onch){
 if(D[name]==null||!opts.some(o=>String(o[0])===String(D[name])))D[name]=def;
 return '<div class="seg '+(cls||'')+'" data-seg="'+name+'"'+(onch?' data-onchange="'+onch+'"':'')+'>'+opts.map(o=>'<button type="button" aria-pressed="'+(String(D[name])===String(o[0]))+'" class="'+(String(D[name])===String(o[0])?'on':'')+'" data-val="'+esc(o[0])+'">'+o[1]+(o[2]?'<small>'+o[2]+'</small>':'')+'</button>').join('')+'</div>';
}
const v=n=>String(D[n]||'').trim();
const clear=(...ns)=>ns.forEach(n=>{delete D[n];});
function bump(){ui.rev++;render();}
function peerOnline(){return PEERS.some(p=>!p.isMe&&p.presence&&p.presence.role&&p.presence.role!==ROLE);}
function whoLabel(seat){return seat==='gm'?(G.seats.gm.kind==='ai'?'IA · GM':(G.seats.gm.name||'GM')):pcName(G);}
function isDriver(){return !!(ROLE&&G&&G.seats[ROLE].kind==='human'&&G.seats[ROLE==='gm'?'tb':'gm'].kind==='ai');}

/* ================= indice delle partite ================= */
async function loadIndex(){
 let arr=[];
 try{if(db&&UID){const s=await db.collection('data/users/'+UID).doc('index').get();if(s.exists)arr=s.data().games||[];}}catch(e){}
 if(!arr.length){try{arr=JSON.parse(ls.get('tb:idx')||'[]');}catch(e){arr=[];}}
 return arr;
}
async function saveIndex(arr){
 ls.set('tb:idx',JSON.stringify(arr));
 try{if(db&&UID)await db.collection('data/users/'+UID).doc('index').set({games:arr});}catch(e){}
}
async function addIndex(code,role){
 const arr=(await loadIndex()).filter(x=>x.code!==code);
 arr.unshift({code:code,role:role,ts:Date.now()});
 await saveIndex(arr.slice(0,12));
}

/* ================= schermata iniziale ================= */
function showStart(msg){
 closeGame();
 $('#start').classList.remove('hidden');$('#game').classList.add('hidden');
 renderStart(msg);
}
async function renderStart(msg){
 const idx=await loadIndex();
 const aiOk=!!sample;
 $('#start').innerHTML='<div class="start-in">'+
  '<h1 class="title">Trollbabe</h1>'+
  '<p class="lede">Un tavolo online per due posti: la trollbabe e il GM. Ognuno dei due può essere una persona oppure l’IA.</p>'+
  (msg?'<p class="msg">'+esc(msg)+'</p>':'')+
  '<div class="cards2">'+
   '<section class="card"><h2>Nuova partita</h2>'+
    fld('n_name','Il tuo nome',{def:ls.get('tb:name')||'',max:24})+
    '<div class="fld"><label>Tu sei</label>'+seg('n_role',[['tb','La trollbabe'],['gm','Il GM']],'tb')+'</div>'+
    '<div class="fld"><label>L’altro posto lo occupa</label>'+seg('n_other',[['human','Un’altra persona'],['ai','L’IA'+(aiOk?'':' (non disponibile)')]],aiOk?'ai':'human')+'</div>'+
    btn('Crea la partita','newGame','primary')+
   '</section>'+
   '<section class="card"><h2>Entra con un codice</h2>'+
    fld('j_code','Codice della partita',{ph:'ABCDE',max:5})+
    fld('j_name','Il tuo nome',{def:ls.get('tb:name')||'',max:24})+
    btn('Entra','joinGame','primary')+
    (net?'<p class="hint">Il collegamento è diretto tra i due browser: chi ha creato la partita deve avere questa pagina aperta mentre entri.</p>':'<p class="hint">Per giocare in due, chi entra deve poter modificare questo artifact (invito come editor, oppure stessa organizzazione). In sola lettura si può solo guardare.</p>'+
    '<details><summary>Voglio provare da solo con due schede</summary><div class="fld" style="margin-top:.5rem"><label>Se questo account è già al tavolo</label>'+seg('j_other',[['keep','Riprendi il mio posto'],['take','Occupa anche l’altro posto']],'keep')+'</div></details>')+
   '</section>'+
  '</div>'+
  (idx.length?'<section class="card"><h2>Le tue partite</h2><ul class="gl">'+idx.map(x=>'<li><b>'+esc(x.code)+'</b><span>'+(x.role==='gm'?'GM':'Trollbabe')+'</span>'+btn('Riprendi','resume','sm','data-code="'+esc(x.code)+'" data-role="'+esc(x.role)+'"')+btn('Togli','forget','sm ghost','data-code="'+esc(x.code)+'"')+'</li>').join('')+'</ul></section>':'')+
 '</div>';
}
function genCode(){const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=a[rnd(a.length)];return s;}

async function createGame(name,role,other){
 if(other==='ai'&&!sample)throw 'L’IA non è disponibile in questa vista: scegli «Un’altra persona».';
 let code,tries=0;
 do{code=genCode();const s=await gameRef(code).get();if(!s.exists)break;}while(++tries<8);
 const theirs=role==='gm'?'tb':'gm';
 const g={v:1,code:code,createdAt:Date.now(),updatedAt:Date.now(),seq:0,logN:0,
  seats:{},step:other==='ai'?'tb_create':'lobby',scale:1,adv:1,scene:0,turn:'tb',pc:null,rels:[],loc:null,locName:'',checked:[],npcs:[],request:null,conflict:null,leaving:false,reveal:null};
 g.seats[role]={kind:'human',uid:UID,name:name};
 g.seats[theirs]=other==='ai'?{kind:'ai',uid:null,name:'IA'}:{kind:'human',uid:null,name:''};
 ss.set('tb:role:'+code,role);
 if(net&&other==='human')await net.host(code);
 await commit(g,[{type:'sys',who:'',text:'Partita creata. '+(role==='gm'?'GM':'Trollbabe')+': '+name+'. '+(other==='ai'?(role==='gm'?'La trollbabe':'Il GM')+' è l’IA.':'In attesa del secondo giocatore.'),meta:null}],0);
 await addIndex(code,role);
 openGame(code);
}
async function joinGameByCode(code,name){
 code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(code.length<4)throw 'Inserisci il codice della partita.';
 if(net)await net.join(code);
 const ref=gameRef(code);const s=await ref.get();
 if(!s.exists)throw 'Partita non trovata. Controlla il codice.';
 let g=s.data();
 // già al tavolo?
 const mine=['tb','gm'].filter(x=>g.seats[x].uid===UID);
 let role=null;
 const free=['gm','tb'].find(x=>g.seats[x].kind==='human'&&!g.seats[x].uid);
 const takeOther=D.j_other==='take';
 if(mine.length&&!(takeOther&&free))role=mine.length===1?mine[0]:(ss.get('tb:role:'+code)||mine[0]);
 else if(free){
  const lock=db.doc('locks/'+code);
  const r=await lock.acquire({holder:UID,ttlMs:4000});
  if(!r.acquired)throw 'Qualcun altro sta entrando: riprova tra un attimo.';
  const s2=await ref.get();const g2=clone(s2.data());
  if(g2.seats[free].uid)throw 'Il posto è stato appena occupato.';
  g2.seats[free]={kind:'human',uid:UID,name:name};
  g2.step=g2.pc?g2.step:'tb_create';
  role=free;
  await commit(g2,[{type:'sys',who:'',text:name+' si siede al tavolo come '+(free==='gm'?'GM':'trollbabe')+'.',meta:null}],g2.seq||0);
 }else throw 'La partita è al completo.';
 ss.set('tb:role:'+code,role);
 await addIndex(code,role);
 openGame(code);
}

/* ================= apertura partita ================= */
function computeRole(g){
 const pref=ss.get('tb:role:'+g.code);
 if(pref&&g.seats[pref]&&g.seats[pref].uid===UID)return pref;
 const t=g.seats.tb.uid===UID,m=g.seats.gm.uid===UID;
 if(t&&!m)return 'tb';if(m&&!t)return 'gm';if(t&&m)return pref||'tb';return null;
}
function closeGame(keep){
 if(!keep&&net)net.close();
 try{unsubG&&unsubG();}catch(e){}try{unsubL&&unsubL();}catch(e){}
 try{NR&&NR.leave();}catch(e){}
 unsubG=unsubL=NR=null;PEERS=[];G=null;LOG=[];PRIV=null;CODE=null;ROLE=null;lastKey='';lastSideKey='';renderedN=0;renderedIds=[];
 if(AI.ctl){try{AI.ctl.abort();}catch(e){}}
 AI.busy=false;AI.err=null;AI.failedSeq=-1;AI.paused=false;
 ui.declaring=false;ui.relInit=null;
}
function openGame(code){
 closeGame(true);CODE=code;
 $('#start').classList.add('hidden');$('#game').classList.remove('hidden');
 $('#log').innerHTML='';renderedN=0;renderedIds=[];
 unsubG=gameRef(code).onSnapshot(s=>{
  if(!s.exists){toast('Partita non trovata.');showStart();return;}
  G=s.data();render();aiTick();
 },e=>toast('Errore di sincronizzazione ('+(e&&e.code||'?')+').'));
 unsubL=logCol(code).onSnapshot(q=>{LOG=q.docs.map(d=>Object.assign({_id:d.id},d.data()));renderLog();render();aiTick();},e=>{});
 secret.get(code).then(p=>{PRIV=p;lastKey='';render();aiTick();});
 joinRoom(code);
 if(net)net.open(code);
}
async function joinRoom(code){
 try{
  if(!room)return;
  const r=await room.join('g-'+code.toLowerCase());
  if(CODE!==code){try{r.leave();}catch(e){}return;}
  NR=r;
  r.presence({role:ROLE||'',code:code});
  r.onPeers(c=>{PEERS=c.peers.slice();renderTop();});
 }catch(e){}
}

/* ================= render ================= */
let lastKey='',lastSideKey='',renderedN=0;
function render(){
 if(!G||!$('#game')||$('#game').classList.contains('hidden'))return;
 ROLE=computeRole(G);
 if(NR&&NR._role!==ROLE){NR._role=ROLE;try{NR.presence({role:ROLE||'',code:G.code});}catch(e){}}
 if(ui.relInit!==G.code){ui.relInit=G.code;ui.relSeen=ui.relToast=G.relResult?G.relResult.id:null;}
 else if(G.relResult&&ROLE==='tb'&&ui.relToast!==G.relResult.id){ui.relToast=G.relResult.id;toast(G.relResult.ok?'Relationship accettata: '+G.relResult.name+'.':'Veto del GM: '+G.relResult.name+' non diventa una Relationship, per ora.',7000);}
 if(G.step!=='scene_play')ui.declaring=false;
 if(!G.conflict||G.conflict.stage!=='fair')delete D.fr_text;
 renderTop();
 const fm=['tb_create','gm_prep','interim','lobby'].indexOf(G.step)>=0;
 $('.col').classList.toggle('formmode',fm);
 const chatOn=chatAvail(),nChat=LOG.filter(isChat).length;
 document.body.classList.toggle('chaton',chatOn);
 $('#side .tabs [data-tab="chat"]').classList.toggle('hidden',!chatOn);
 if(!chatOn&&ui.tab==='chat')ui.tab='sheet';
 const sk=ver()+'|'+ui.tab+'|'+(PRIV?1:0)+'|'+AI.tier+'|'+(AI.paused?1:0)+'|'+ROLE+'|'+nChat+'|'+(AI.chatBusy?1:0)+'|'+(AI.chatErr?1:0);
 if(sk!==lastSideKey){lastSideKey=sk;redraw($('#side-body'),sideHTML());$$('#side .tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===ui.tab));}
 $('#tracker').innerHTML=trackerHTML();
 const k=ver()+'|'+ui.rev+'|'+(AI.busy?1:0)+'|'+(AI.err?1:0)+'|'+(AI.paused?1:0)+'|'+(PRIV?1:0)+'|'+ROLE+'|'+nChat;
 if(k!==lastKey){lastKey=k;redraw($('#dock-body'),dockHTML());}
}
// ridisegna conservando focus e cursore del campo che si sta scrivendo
function redraw(el,html){
 const ae=document.activeElement,nm=ae&&el.contains(ae)&&ae.dataset&&ae.dataset.d;let pos=null;
 if(nm&&ae.selectionStart!=null)pos=[ae.selectionStart,ae.selectionEnd];
 el.innerHTML=html;
 const n=nm&&el.querySelector('[data-d="'+nm+'"]');
 if(n){n.focus();try{if(pos)n.setSelectionRange(pos[0],pos[1]);}catch(e){}}
}
const chatAvail=()=>!!(G&&ROLE==='tb'&&G.seats.gm.kind==='ai'&&G.seats.tb.kind==='human');
const oocWho=e=>e.who==='gm'?(G.seats.gm.name||'GM'):(G.seats.tb.name||'Giocatrice');
const cut=t=>t.length>70?t.slice(0,70)+'…':t;
const qBtn=e=>btn('?','chatRe','sm ghost q','data-id="'+e._id+'" title="Chiedi al GM su questo passaggio" aria-label="Chiedi al GM su questo passaggio"');
function renderTop(){
 const g=G;
 $('#t-code').textContent=g.code;
 const parts=[];
 if(g.step==='lobby'||g.step==='tb_create'&&!g.pc)parts.push('Preparazione');
 else{parts.push('Avventura '+g.adv);if(g.locName)parts.push(g.locName);if(g.scene)parts.push('scena '+g.scene);}
 $('#t-info').textContent=parts.join(' · ');
 const p=$('#t-peer');p.className='peer'+(peerOnline()?' on':'');
 p.title=peerOnline()?'L’altra persona è online':'L’altra persona non risulta online';
 p.classList.toggle('hidden',g.seats.gm.kind==='ai'||g.seats.tb.kind==='ai');
}
const KIND={fair:'apre il conflitto',step:'passo',success:'successo',incap:'incapacitata',inconv:'scomodata',injury:'ferita',alt_incap:'incapacitata, ma a modo suo',death:'morte',item:'roll-again',rel:'Relationship',epilogue:'epilogo'};
function entryHTML(e){
 const m=e.meta||{};
 switch(e.type){
  case 'scene':return '<article class="e scene">'+qBtn(e)+'<h3>Scena '+(m.scene||'')+' — '+esc(m.loc||'')+'</h3><p>'+nl(e.text)+'</p></article>';
  case 'gm':return '<article class="e gm">'+qBtn(e)+'<div class="who">'+esc(whoLabel('gm'))+(m.kind?' <i>'+(KIND[m.kind]||'')+'</i>':'')+'</div><p>'+nl(e.text)+'</p></article>';
  case 'tb':return '<article class="e tb"><div class="who">'+esc(whoLabel('tb'))+(m.kind?' <i>'+(KIND[m.kind]||'')+'</i>':'')+'</div><p>'+nl(e.text)+'</p></article>';
  case 'sys':if(m.kind==='veto'||m.kind==='rel_ok')return '<div class="e verdict '+(m.kind==='veto'?'veto':'ok')+'"><b>'+(m.kind==='veto'?'Veto del GM':'Relationship accettata')+'</b> '+esc(e.text)+'</div>';return '<div class="e sys">'+esc(e.text)+'</div>';
  case 'ooc':if(isChat(e))return '';return '<div class="e ooc"><b>'+esc(oocWho(e))+'</b> (fuori gioco): '+esc(e.text)+'</div>';
  case 'roll':return '<div class="e roll '+(m.ok?'win':'lose')+'"><span class="d10">'+m.v+'</span><span>'+(TYPES[m.type]?TYPES[m.type].label:'')+' · numero '+m.n+' · '+(m.ok?'riuscito':'fallito')+(m.ok?'':' · '+BOXES[m.box].f)+'</span></div>';
  case 'conflict':return '<div class="e cflt"><b>Conflict</b> '+(TYPES[m.type]?TYPES[m.type].label:'')+' · '+(PACES[m.pace]?PACES[m.pace].label:'')+'<br>Goal: «'+esc(m.goal)+'»</div>';
 }
 return '';
}
let renderedIds=[];
function renderLog(){
 const el=$('#log');if(!el||!G)return;
 // se le voci già disegnate non sono più un prefisso del diario (inserimento in mezzo), ridisegno tutto
 let ok=LOG.length>=renderedIds.length;
 for(let i=0;ok&&i<renderedIds.length;i++)if(LOG[i]._id!==renderedIds[i])ok=false;
 if(!ok){el.innerHTML='';renderedIds=[];}
 const first=renderedIds.length===0;
 const near=el.scrollHeight-el.scrollTop-el.clientHeight<140;
 for(let i=renderedIds.length;i<LOG.length;i++){el.insertAdjacentHTML('beforeend',entryHTML(LOG[i]));renderedIds.push(LOG[i]._id);}
 renderedN=renderedIds.length;
 if(near||first||!ok)el.scrollTop=el.scrollHeight;
}

/* ================= tracker del conflitto ================= */
function trackerHTML(){
 const c=G&&G.conflict;if(!c||c.stage==='goal'||c.stage==='pace'||c.stage==='fair')return c?'<div class="trk"><div class="trk-h"><b>Conflict</b> · '+TYPES[c.type].label+' · '+PACES[c.pace].label+(c.goal?' · Goal: «'+esc(c.goal)+'»':'')+'</div></div>':'';
 const sq=(f,cls)=>Array.from({length:c.pace},(_,i)=>'<i class="'+(i<f?cls:'')+'"></i>').join('');
 const sb=c.sb||0;
 const boxes=BOXES.map((b,i)=>{
  let cls='bx';if(i<sb)cls+=' skip';else if(i<c.box)cls+=' past';else if(i===c.box)cls+=' cur'+(c.roll&&c.roll.box===i&&c.stage!=='roll'?(c.roll.ok?' win':' lose'):'');
  return '<div class="'+cls+'"><span class="bt">'+b.t+'</span><span class="bf">'+(i===3?'fallisce: alla mercé':'fallisce: '+b.f.toLowerCase())+'</span></div>';
 }).join('<span class="ar">›</span>');
 return '<div class="trk"><div class="trk-h"><b>Conflict</b> · '+TYPES[c.type].label+' · '+PACES[c.pace].label+' · Goal: «'+esc(c.goal)+'»</div>'+
  '<div class="trk-s"><span>Serie riuscite <span class="sq win">'+sq(c.succ,'f')+'</span></span><span>fallite <span class="sq lose">'+sq(c.fail,'f')+'</span></span><span class="muted">Serie '+c.series+' di max '+PACES[c.pace].max+'</span></div>'+
  '<div class="path">'+boxes+'</div></div>';
}

/* ================= pannello laterale ================= */
function sideHTML(){
 const g=G;
 if(ui.tab==='rules')return rulesHTML();
 if(ui.tab==='more')return moreHTML();
 if(ui.tab==='chat')return chatHTML();
 let h='<div class="card slim"><div class="k">Scale</div><b>'+g.scale+' · '+SCALES[g.scale-1]+'</b></div>';
 const pc=g.pc;
 if(pc){
  const r=ranges(pc.number);
  h+='<div class="card pc"><div class="pcname">'+esc(pc.name)+' <span class="badge st-'+pc.status+'">'+STATUS[pc.status]+'</span></div>'+(pc.hurt?'<p class="app"><b>'+STATUS[pc.status]+':</b> '+esc(pc.hurt)+'</p>':'')+
   '<div class="numrow"><span class="num">'+pc.number+'</span><table class="rng"><tr><th>Fighting</th><td>'+rangeText(r.fighting)+'</td></tr><tr><th>Magic</th><td>'+rangeText(r.magic)+'</td></tr><tr><th>Social</th><td>'+rangeText(r.social)+'</td></tr></table></div>'+
   '<p class="imp">'+IMP_FIGHT[pc.fight]+' · '+IMP_MAGIC[pc.magic]+' · '+IMP_SOCIAL[pc.social]+'</p>'+
   '<p class="app">Capelli: '+esc(pc.hair)+'. Corna: '+esc(pc.horns)+'. Abiti: '+esc(pc.cloth)+'. Con sé: '+esc(pc.kit)+'.</p>'+
   '<p class="app">Porta con sé: '+esc(pc.hum)+'; '+esc(pc.troll)+'.</p></div>';
  h+='<div class="card slim"><div class="k">Roll-again in questa avventura</div><ul class="rr">'+
   Object.keys(ITEMS).map(k=>'<li class="'+(g.checked.includes(k)?'used':'')+'">'+ITEMS[k]+'</li>').join('')+
   g.rels.filter(r=>!r.dead).map(r=>'<li class="rel '+(r.checked?'used':'')+'">'+esc(r.name)+' <small>'+REL_TYPES[r.type].toLowerCase()+(r.status==='injured'?', ferito':'')+'</small></li>').join('')+'</ul></div>';
 }else h+='<div class="card slim"><p class="muted">La trollbabe non è ancora stata creata.</p></div>';
 if(g.npcs&&g.npcs.length)h+='<div class="card slim"><div class="k">PNG con nome</div><p>'+g.npcs.map(n=>esc(n.name)).join(', ')+'</p></div>';
 if(ROLE==='gm'&&PRIV&&G.step!=='gm_prep')h+='<div class="card secret"><div class="k">Preparazione segreta</div>'+
  (PRIV.where?'<p><b>Dove.</b> '+nl(PRIV.where)+'</p>':'')+(PRIV.who?'<p><b>Chi.</b> '+nl(PRIV.who)+'</p>':'')+
  '<p><b>Stakes.</b> '+esc(PRIV.stakes)+'</p><p><b>A.</b> '+esc(PRIV.a)+'<br><b>B.</b> '+esc(PRIV.b)+'</p>'+
  (PRIV.chars?'<p><b>Personaggi.</b><br>'+nl(PRIV.chars)+'</p>':'')+(PRIV.notes?'<p><b>Note.</b> '+nl(PRIV.notes)+'</p>':'')+'</div>';
 if(g.reveal&&g.reveal.stakes)h+='<div class="card secret"><div class="k">Cosa c’era sotto</div><p><b>Stakes.</b> '+esc(g.reveal.stakes)+'</p><p><b>Esiti.</b> A: '+esc(g.reveal.a)+' · B: '+esc(g.reveal.b)+'</p><p><b>Accaduto.</b> '+esc(g.reveal.outcome)+'</p>'+(g.reveal.chars?'<p>'+nl(g.reveal.chars)+'</p>':'')+'</div>';
 return h;
}
function rulesHTML(){
 return '<div class="card slim rules"><h4>Tiri (d10)</h4><p><b>Fighting</b>: successo se il d10 è <i>sotto</i> il numero. <b>Magic</b>: <i>sopra</i>. <b>Social</b>: il numero o oltre, dal lato meno probabile (numero fino a 5: da 1 al numero; da 6: dal numero a 10).</p>'+
 '<h4>Conflict</h4><p>Riguarda i personaggi, non la difficoltà. Chi lo dichiara sceglie Action Type e Pace; il Goal lo dice sempre la giocatrice. L’altra parte può spostare il Pace di un livello. Poi Fair and clear: nessuno è vincolato finché tutti confermano.</p>'+
 '<h4>Pace</h4><p>Action by action: 3 Serie riuscite (o 3 fallite) su max 5. Clash by clash: 2 su max 3. Entire conflict: una Serie.</p>'+
 '<h4>Una Serie</h4><p>Tiro iniziale. Se fallisce: scomodata, la narra la giocatrice; se si ferma, il Goal fallisce. Altrimenti sceglie un roll-again (una voce non ancora spuntata) e tira di nuovo: fallire dà ferita, poi incapacitata (la narra il GM, ostile), poi un ultimo tiro che può solo attenuare l’incapacità; se fallisce resta la narrazione del GM oppure la giocatrice dichiara la morte.</p>'+
 '<h4>Chi narra</h4><p>Serie riuscita: il GM, con una sola immagine. Serie fallita: la giocatrice. Nessuna nuova informazione.</p>'+
 '<h4>Roll-again</h4><p>Oggetto portato, alleato improvviso, oggetto trovato, incantesimo ricordato, elemento del terreno, più le Relationship. Ognuno una sola volta per avventura.</p>'+
 '<h4>Ferita</h4><p>Resta finché non c’è una scena di cura. Da ferita ogni Serie parte già dal primo box: al massimo due roll-again.</p>'+
 '<h4>Relationship</h4><p>Si stringono dopo un conflitto con un personaggio presente, più un’interazione. Per i PNG con nome decide il GM. Usarle come roll-again le mette a rischio.</p>'+
 '<h4>Scale</h4><p>Limita ciò che la trollbabe riesce a compiere di persona. Sale di 1 tra un’avventura e l’altra, mai scende.</p></div>';
}
function chatHTML(){
 const find=id=>id&&LOG.find(x=>x._id===id);
 const rows=LOG.filter(isChat).map(e=>{
  const q=find(e.meta.re);
  return '<div class="cm '+(e.who==='gm'?'gm':'me')+(e.meta.ask?' ask':'')+'"><b>'+(e.who==='gm'?(e.meta.ask?'Il GM chiede':'GM'):'Tu')+'</b>'+(q?'<span class="re">su «'+esc(cut(q.text))+'»</span>':'')+'<p>'+nl(e.text)+'</p></div>';
 }).join('');
 const q=find(D.chat_re),open=askOpen(G);
 return '<div class="card slim chat"><div class="k">Al tavolo, fuori gioco</div><p class="hint">Domande, chiarimenti e correzioni al GM: non sono mosse di gioco. Anche il GM può chiederti di chiarire una tua mossa.</p>'+
  '<div class="chat-log">'+(rows||'<p class="muted">Ancora nessuno scambio.</p>')+'</div>'+
  (AI.chatBusy?'<div class="wait ai"><span class="spin"></span><span>Il GM risponde…</span></div>':'')+
  (AI.chatErr?'<div class="wait err"><p>'+esc(AI.chatErr)+'</p><div class="row">'+btn('Riprova','chatRetry','primary sm')+'</div></div>':'')+
  (open?'<div class="row">'+btn('Interpreta tu','askSkip','sm ghost')+'</div>':'')+
  (q?'<div class="re-on"><span>Su «'+esc(cut(q.text))+'»</span>'+btn('×','chatReClear','sm ghost','aria-label="Togli la citazione"')+'</div>':'')+
  '<div class="ooc-in"><input data-d="chat" type="text" placeholder="'+(open?'Rispondi al GM…':'Chiedi al GM…')+'" value="'+esc(D.chat||'')+'">'+btn('Invia','chatSend','sm')+'</div></div>';
}
function moreHTML(){
 return '<div class="card slim"><div class="k">IA</div>'+(sample?'<p class="hint">'+(sample.setKey?'Ogni risposta dell’IA è a carico della tua chiave Anthropic.':'Ogni risposta dell’IA usa il tuo utilizzo di Claude.')+'</p>'+seg('ai_tier',[['quick','Veloce'],['default','Equilibrata'],['complex','Profonda']],AI.tier,'',"aiTier")+
  '<div class="row">'+btn(AI.paused?'Riprendi l’IA':'Metti l’IA in pausa','aiToggle','sm')+(sample.setKey?btn(sample.hasKey()?'Cambia la chiave API':'Imposta la chiave API','setKey','sm'):'')+'</div>':'<p class="muted">L’IA non è disponibile in questa vista.</p>')+'</div>'+
  '<div class="card slim"><div class="k">Partita</div><p>Codice <b>'+G.code+'</b></p><div class="row">'+btn('Copia il codice','copyCode','sm')+btn('Esporta il diario','exportDiary','sm')+btn('Esci dal tavolo','exitGame','sm ghost')+'</div></div>';
}

/* ================= dock ================= */
function waitHTML(exp){
 const g=G;
 const aiSeats=(exp||[]).filter(s=>g.seats[s].kind==='ai');
 if(aiSeats.length&&isDriver()){
  if(!sample)return '<div class="wait err"><p>L’IA non è disponibile in questa vista: aprila dentro Claude e consenti l’uso di Claude.</p></div>';
  if(askOpen(g)&&aiSeats.indexOf('gm')>=0){
   const q=LOG.filter(e=>isChat(e)&&e.meta.ask).pop();
   return '<div class="wait ask"><p><b>Il GM ti chiede un chiarimento</b>'+(q?': «'+esc(q.text)+'»':'.')+'</p><div class="row">'+btn('Rispondi','chatOpen','primary sm')+btn('Interpreta tu','askSkip','sm ghost')+'</div></div>';
  }
  if(AI.err)return '<div class="wait err"><p>'+esc(AI.err)+'</p><div class="row">'+btn('Riprova','aiRetry','primary sm')+btn('Pausa','aiToggle','sm')+'</div></div>';
  if(AI.paused)return '<div class="wait"><p>L’IA è in pausa.</p><div class="row">'+btn('Riprendi','aiToggle','primary sm')+'</div></div>';
  return '<div class="wait ai"><span class="spin"></span><span>'+esc(AI.label||'L’IA sta pensando…')+'</span>'+btn('Ferma','aiStop','sm ghost')+'</div>';
 }
 const who=(exp||[]).map(s=>seatLabel(g,s)).join(' e ');
 return '<div class="wait"><span class="dot"></span><span>Tocca a '+esc(who||'…')+'</span></div>';
}
function oocHTML(){
 if(G.seats.gm.kind==='ai'||G.seats.tb.kind==='ai')return '';
 return '<div class="ooc-in"><input data-d="ooc" type="text" placeholder="Nota fuori gioco…" value="'+esc(D.ooc||'')+'">'+btn('Invia','ooc','sm')+'</div>';
}
function dockHTML(){
 const g=G;
 if(!ROLE)return '<p class="muted">Stai guardando questa partita senza un posto al tavolo.</p>';
 if(!g.pc&&g.step!=='lobby'&&g.step!=='tb_create')return '<div class="wait"><span class="dot"></span><span>Sincronizzazione in corso…</span></div>';
 let h='';
 switch(g.step){
  case 'lobby':h=pLobby();break;
  case 'tb_create':h=ROLE==='tb'?pTbCreate():waitHTML(['tb']);break;
  case 'gm_prep':h=ROLE==='gm'?pGmPrep():waitHTML(['gm']);break;
  case 'scene_open':h=ROLE==='gm'?pSceneOpen():waitHTML(['gm']);break;
  case 'scene_play':h=pScenePlay();break;
  case 'scene_request':h=ROLE==='tb'?pSceneRequest():waitHTML(['tb']);break;
  case 'conflict':h=pConflict();break;
  case 'rel_offer':h=ROLE==='tb'?pRelOffer():waitHTML(['tb']);break;
  case 'rel_approve':h=ROLE==='gm'?pRelApprove():waitHTML(['gm']);break;
  case 'ending':h=ROLE==='gm'?pEnding():waitHTML(['gm']);break;
  case 'interim':h=ROLE==='tb'?pInterim():waitHTML(['tb']);break;
 }
 return h+oocHTML();
}
function pLobby(){
 return '<div class="lobby"><div class="k">Codice della partita</div><div class="code">'+G.code+'</div>'+
  '<p>L’altra persona apre questo artifact e sceglie «Entra con un codice».</p>'+
  (net?'<p class="hint">Tieni questa pagina aperta finché l’altra persona non si è collegata: il collegamento è diretto tra i due browser.</p>':'<p class="hint">Deve poter modificare l’artifact: invitala come editor dal menu Condividi, oppure condividilo con la tua organizzazione se ne fate parte. Chi apre in sola lettura può guardare ma non giocare.</p>')+
  '<div class="wait"><span class="dot"></span><span>In attesa del secondo giocatore…</span></div><div class="row">'+btn('Copia il codice','copyCode','sm')+'</div></div>';
}
function pTbCreate(){
 const n=parseInt(D.pc_num,10)||5;
 return '<div class="form"><h3>Crea la tua trollbabe</h3>'+
  '<div class="two">'+fld('pc_name','Nome',{max:30})+'<div class="fld"><label>Numero (2–9)</label>'+seg('pc_num',[2,3,4,5,6,7,8,9].map(x=>[x,String(x)]),5,'num','numPrev')+'</div></div>'+
  '<p class="hint" id="rngPrev">'+rngText(n)+'. Più basso = più magia, più alto = più combattimento.</p>'+
  '<div class="fld"><label>Impressione di combattimento</label>'+seg('pc_fight',Object.keys(IMP_FIGHT).map(k=>[k,IMP_FIGHT[k]]),'melee')+'</div>'+
  '<div class="fld"><label>Impressione di magia</label>'+seg('pc_magic',Object.keys(IMP_MAGIC).map(k=>[k,IMP_MAGIC[k]]),'troll')+'</div>'+
  '<div class="fld"><label>Impressione sociale</label>'+seg('pc_social',Object.keys(IMP_SOCIAL).map(k=>[k,IMP_SOCIAL[k]]),'fierce')+'</div>'+
  '<div class="two">'+fld('pc_hair','Capelli',{ph:'folti, spettinati, neri…'})+fld('pc_horns','Corna',{ph:'a spirale, corte da capra…'})+'</div>'+
  '<div class="two">'+fld('pc_hum','Oggetto umano',{ph:'un libro, un gioiello lavorato…'})+fld('pc_troll','Oggetto troll',{ph:'un sasso fortunato, una pelle di rune…'})+'</div>'+
  '<div class="two">'+fld('pc_cloth','Abiti',{ph:'gilet allacciato, gonna…'})+fld('pc_kit','Arma o equipaggiamento',{ph:'due asce da lancio'})+'</div>'+
  '<div class="fld"><label>Dove sta andando? (a piedi)</label>'+seg('pc_loc',LOCS.map(l=>[l.id,esc(l.name),l.hint]),null,'locs')+'</div>'+
  btn('Parti','createPC','primary')+'</div>';
}
function rngText(n){const r=ranges(n);return 'Numero '+n+': Fighting '+rangeText(r.fighting)+' · Magic '+rangeText(r.magic)+' · Social '+rangeText(r.social);}
function pGmPrep(){
 return '<div class="form"><h3>Prepara l’avventura a '+esc(G.locName)+'</h3><p class="hint">Scale '+G.scale+': '+SCALES[G.scale-1]+'. Tutto resta segreto: solo tu lo vedi.</p>'+
  (sample?'<div class="gen"><h4>Hai bisogno di uno spunto?</h4>'+fld('gp_idea','Idea o tema (facoltativo)',{ph:'es. una faida tra pescatori, con un troll ferito'})+
   (ui.gen?'<div class="wait ai"><span class="spin"></span><span>L’IA sta preparando l’avventura…</span></div>':'<div class="row">'+btn('Genera con l’IA','genPrep')+'</div><p class="hint">Compila i campi qui sotto: leggi e cambia ciò che vuoi prima di salvare. Sovrascrive quello che hai già scritto.</p>')+'</div>':'')+
  '<details class="tips"><summary>Promemoria</summary><ul><li><b>Dove.</b> Immagini concrete del luogo, dal punto di vista di una persona.</li><li><b>Chi.</b> Nessun luogo è vuoto: umani, troll o entrambi, e cosa stanno facendo. Il misto funziona meglio.</li><li><b>Stakes.</b> Una persona, un luogo o una cosa, della taglia del Scale attuale, che qualcuno vuole. Non è un obiettivo di trama e non riguarda la trollbabe.</li><li><b>Esiti.</b> Due esiti concreti e opposti (vive o muore, resta rotto o guarisce), senza come né perché.</li><li><b>Personaggi.</b> Pochi, con nome, desideri e legami (parentele, rivalità) che stringono attorno agli Stakes.</li></ul></details>'+
  fld('gp_where','Dove',{rows:2,ph:'Come appare il luogo?'})+fld('gp_who','Chi c’è',{rows:2,ph:'Umani, troll, cosa fanno…'})+
  fld('gp_stakes','Stakes',{ph:'Una persona, un luogo o una cosa'})+
  '<div class="two">'+fld('gp_a','Esito A',{ph:'es. il ragazzo vive'})+fld('gp_b','Esito B',{ph:'es. il ragazzo muore'})+'</div>'+
  fld('gp_chars','Personaggi (uno per riga: Nome — cosa vuole)',{rows:4})+fld('gp_notes','Note segrete',{rows:2})+
  btn('Salva e apri la prima scena','savePrep','primary')+'</div>';
}
function pSceneOpen(){
 const g=G;
 const first=g.scene===0;
 let h='<div class="form"><h3>'+(first?'Apri la storia':'Apri la prossima scena')+'</h3>';
 if(first)h+='<p class="hint">La storia si apre con una trollbabe che cammina, a '+esc(g.locName)+'. Dì luogo, circostanze immediate e chi c’è.</p>';
 else h+='<p class="hint">Dì dove siamo, le circostanze e chi c’è. '+(g.request&&g.request.text?'<b>Richiesta della giocatrice:</b> «'+esc(g.request.text)+'». ':'')+'Se qualcuno si sta già muovendo per cercarla, inizia dal punto dell’interruzione.</p>';
 h+=fld('so_text','Descrizione',{rows:4})+fld('so_npcs','Nuovi PNG con nome (separati da virgola)',{});
 if(g.request&&g.request.heal)h+='<div class="fld"><label>Scena di cura richiesta</label>'+seg('so_heal',[['yes','Concessa: guarisce'],['no','Negata (serve un conflitto)']],'yes')+'</div>';
 return h+btn('Apri la scena','openScene','primary')+'</div>';
}
function pScenePlay(){
 const g=G,me=ROLE,pc=g.pc;
 if(ui.declaring)return pDeclare();
 const incap=pc.status==='incap';
 let h='<div class="form">'+relBanner()+'<div class="turn">Tocca a <b>'+esc(seatLabel(g,g.turn||'tb'))+'</b> (indicativo: chiunque può parlare)</div>';
 if(AI_ACTIVE_WAIT())h+=waitHTML([g.turn]);
 if(me==='tb'){
  if(incap)h+='<p class="hint">La trollbabe è incapacitata e non può scegliere. Il GM chiude la scena; poi puoi chiedere una scena di cura.</p>';
  else{
   h+=fld('sp_text',esc(pcName(g))+': cosa fa o dice?',{rows:3});
   h+='<div class="row">'+btn('Invia','say','primary','data-primary="1"')+btn('Conflict!','cfOpen','danger')+'</div>';
   h+='<details class="more"><summary>Altro</summary><div class="row">'+btn('Chiedi di chiudere la scena','askEnd','sm')+btn('Lascio il luogo','leave','sm')+'</div>'+
    (g.rels.filter(r=>!r.dead).length?'<div class="row">'+g.rels.filter(r=>!r.dead).map(r=>btn('Chiudi con '+esc(r.name),'relBreak','sm ghost','data-id="'+r.id+'"')).join('')+'</div>':'')+'</details>';
  }
 }else{
  if(g.leaving)h+='<div class="note"><b>'+esc(pcName(g))+' vuole lasciare il luogo.</b> Se nessuno prova a fermarla, concludi l’avventura; se qualcuno ci prova, dichiara un Conflict (se lei riesce, l’avventura finisce).<div class="row">'+btn('Nessuno la ferma: concludi','beginEndLeave','sm')+'</div></div>';
  h+=fld('sp_text','Narra e interpreta i PNG',{rows:3})+fld('sp_npcs','Nuovi PNG con nome (separati da virgola)',{});
  h+='<div class="row">'+btn('Invia','say','primary','data-primary="1"')+(incap?'':btn('Conflict!','cfOpen','danger'))+btn('Chiudi la scena','endScene')+'</div>'+
   '<details class="more"><summary>Altro</summary><div class="row">'+btn('Concludi l’avventura (Stakes risolti)','beginEnding','sm')+'</div></details>';
 }
 return h+'</div>';
}
function relBanner(){
 const r=G.relResult;
 if(!r||ROLE!=='tb'||ui.relSeen===r.id)return '';
 return r.ok?'<div class="verdict ok" role="alert"><b>Relationship accettata.</b> '+esc(r.name)+' è ora '+REL_TYPES[r.type].toLowerCase()+' di '+esc(pcName(G))+'.<div class="row">'+btn('Ho capito','relSeen','sm')+'</div></div>'
  :'<div class="verdict veto" role="alert"><b>Veto del GM.</b> '+esc(r.name)+' non diventa una Relationship, per ora. Potrai riprovare più avanti, dopo un altro conflitto, quando la situazione sarà cambiata.<div class="row">'+btn('Ho capito','relSeen','sm')+'</div></div>';
}
function AI_ACTIVE_WAIT(){const g=G;return isDriver()&&g.seats[g.turn||'tb'].kind==='ai';}
function pDeclare(){
 const me=ROLE;
 return '<div class="form"><h3>Conflict!</h3>'+
  '<div class="fld"><label>Action Type</label>'+seg('cf_type',Object.keys(TYPES).map(k=>[k,TYPES[k].label,TYPES[k].rule]),'fighting','types')+'</div>'+
  '<p class="hint" id="typeDesc">'+esc(TYPES[D.cf_type||'fighting'].desc)+'</p>'+
  '<div class="fld"><label>Pace</label>'+seg('cf_pace',[[3,'Action by action','3 Serie su max 5'],[2,'Clash by clash','2 su max 3'],[1,'Entire conflict','un solo tiro']],2,'','paceDesc')+'</div>'+
  (me==='tb'?fld('cf_goal','Il tuo Goal',{ph:'Un risultato attivo che coinvolge qualcun altro: «lo calmo», «gli porto via l’ascia»…'})+'<p class="hint">Non un modo di difendersi, non un gesto: ciò che vuoi ottenere, detto in generale.</p>':'<p class="hint">Il Goal lo dirà la giocatrice.</p>')+
  '<div class="row">'+btn('Dichiara','cfGo','danger')+btn('Annulla','cfCancel','ghost')+'</div></div>';
}
function pSceneRequest(){
 const g=G,pc=g.pc;
 return '<div class="form"><h3>Scena finita</h3><p class="hint">Dì dove vuoi andare o cosa vuoi fare nella prossima scena.</p>'+
  fld('sr_text','Prossima scena',{rows:2,ph:'«vado nel bosco a cercare la vecchia Beezie»'})+
  (pc.status!=='ok'?'<div class="fld"><label>Sei '+STATUS[pc.status].toLowerCase()+': vuoi che sia una scena di cura?</label>'+seg('sr_heal',[['yes','Sì, mi curo'],['no','No']],'yes')+'</div>':'')+
  '<div class="row">'+btn('Chiedi la scena','request','primary')+btn('Lascia scegliere al GM','requestGM')+'</div></div>';
}
function pConflict(){
 const g=G,c=g.conflict,me=ROLE;if(!c)return '';
 const exp=expected();
 const head='<div class="ph"><b>'+TYPES[c.type].label+'</b> · '+PACES[c.pace].label+' · Goal: <i>'+esc(c.goal||'da dichiarare')+'</i></div>';
 const paceSeg=(n)=>{const p=c.pace;const o=[['keep','Resta '+PACES[p].it]];if(p<3)o.push(['up','Più fine: '+PACES[p+1].it]);if(p>1)o.push(['down','Più rapido: '+PACES[p-1].it]);return seg(n,o,'keep');};
 if(c.stage!=='fair'&&!exp.includes(me))return head+waitHTML(exp);
 switch(c.stage){
  case 'goal':return head+'<div class="form"><h3>Qual è il tuo Goal?</h3><p class="hint">'+esc(TYPES[c.type].desc)+'</p>'+fld('cg_goal','Il tuo Goal',{rows:2,ph:'Risultato attivo che coinvolge qualcun altro, detto in generale'})+'<div class="fld"><label>Pace proposto dal GM</label>'+paceSeg('cg_adj')+'</div>'+btn('Conferma','setGoal','primary')+'</div>';
  case 'pace':return head+'<div class="form"><h3>Pace</h3><p class="hint">Puoi lasciarlo com’è o spostarlo di un livello.</p>'+paceSeg('cp_adj')+btn('Conferma','paceAdj','primary')+'</div>';
  case 'fair':{
   const othSeat=me==='gm'?'tb':'gm',mine=c.fair[me],oth=c.fair[othSeat],myTurn=c.fair.turn===me;
   const box=(s,t,ok)=>'<div class="fairbox"><div class="k">'+esc(whoLabel(s))+(ok?' ✓':'')+'</div><p>'+(t?nl(t):'<i class="muted">non ha ancora scritto</i>')+'</p></div>';
   return head+'<div class="form"><h3>Fair and clear</h3><p class="hint">A turno: ciascuno dice cosa sta facendo il proprio personaggio all’inizio del conflitto; l’altro accetta o modifica la propria dichiarazione. Si parte quando entrambi accettano. '+(me==='gm'?'<b>Come GM, di’ qui apertamente cosa si oppone alla trollbabe e cosa può farle del male</b> (avversari, ambiente, magia, anche ciò che finora era nascosto): ciò che non dici adesso non potrai introdurlo dopo.':'')+'</p>'+
    box(othSeat,oth,c.fair[othSeat+'Ok'])+
    (!myTurn?box(me,mine,c.fair[me+'Ok'])+'<p class="hint">Tocca a '+esc(whoLabel(othSeat))+': legge la tua dichiarazione e accetta o modifica la propria.</p></div>':
     fld('fr_text',me==='gm'?'Gli avversari e ciò che può far male':'La tua azione ('+esc(whoLabel(me))+')',{rows:3,def:mine,ph:me==='gm'?'Cosa fanno gli avversari, cosa si oppone, cosa può far male…':''})+
     '<div class="row">'+(!mine?btn('Dichiara','fairSay','primary'):(oth?btn('Accetto così','fairOk','primary'):'')+btn('Modifico e passo la mano','fairSay'))+'</div></div>');}
  case 'step':{
   if(me==='gm')return head+'<div class="form"><h3>Serie '+c.series+': la mossa degli avversari</h3><p class="hint">Cosa fanno ora gli avversari, con ciò che hai dichiarato nel Fair and clear. Niente esiti: li decide il dado.</p>'+fld('st_text','La mossa',{rows:2})+'<div class="row">'+btn('Narra la mossa','stepSay','primary')+btn('Nessuna mossa','stepNone')+'</div></div>';
   return head+(c.step&&c.step.gm?'<div class="fairbox"><div class="k">'+esc(whoLabel('gm'))+'</div><p>'+nl(c.step.gm)+'</p></div>':'')+'<div class="form"><h3>Serie '+c.series+': cosa fai?</h3><p class="hint">Dì cosa fa la trollbabe in questo passo verso il Goal: il tiro decide se le riesce.</p>'+fld('st_text','La tua azione',{rows:2})+btn('Dichiara e tira','stepSay','primary')+'</div>';}
  case 'roll':{
   const rr=ranges(g.pc.number)[c.type];
   return head+'<div class="form rollbox"><div class="die" id="die">d10</div><div><h3>Serie '+c.series+' · '+BOXES[c.box].t+'</h3><p class="hint">'+TYPES[c.type].label+': '+TYPES[c.type].rule+'. Con il tuo numero ('+g.pc.number+') riesci con '+rangeText(rr)+'.'+(c.box>0?' Se fallisci: '+BOXES[c.box].f.toLowerCase()+'.':'')+'</p>'+btn('Tira il d10','roll','primary big')+'</div></div>';}
  case 'narr_gm':{
   const mid=c.kind==='success'&&!lastSeries(c,'success');
   return head+rollNote(c)+'<div class="form"><h3>'+(c.kind!=='success'?'La trollbabe è incapacitata':mid?'Serie riuscita ('+(c.succ+1)+' su '+c.pace+')':'Il Goal riesce')+'</h3><p class="hint">'+(c.kind!=='success'?'Sii ostile ma coerente con il tipo di conflitto e con ciò che è successo: usa solo ciò che hai detto nel Fair and clear, nessuna nuova minaccia.':mid?'La trollbabe si avvicina al Goal ma non lo raggiunge ancora: descrivi questo passo in un’immagine sola.':'Descrivi come, in un’immagine sola, valorizzando la giocatrice.')+'</p>'+fld('ng_text','Narrazione',{rows:3})+btn('Narra','narrGM','primary','data-primary="1"')+'</div>';}
  case 'narr_tb':{
   const k=c.kind,tt={inconv:'Fallito: scomodata',injury:'Fallito: ferita',alt_incap:'Terzo roll-again riuscito'}[k];
   const hh={inconv:'Il Goal sta cedendo; la scomodità è solo un dettaglio.',injury:'Descrivi la ferita in modo che abbia senso per questo conflitto ('+({fighting:'ferite o sfinimento',magic:'contraccolpo mistico o spiriti ribelli',social:'orgoglio ferito, o una ritorsione fisica se la scena la rende plausibile'}[c.type])+'): resta finché non guarisci.',alt_incap:'Il Goal è perso e sei incapacitata, ma descrivi tu in che circostanze, meno gravi.'}[k];
   const items=availableItems(g);
   return head+rollNote(c)+'<div class="form"><h3>'+tt+'</h3><p class="hint">'+hh+'</p>'+fld('nt_text',k==='alt_incap'?'Narra':'Narra il fallimento',{rows:3})+
    (k==='alt_incap'?btn('Narra','narrTB','primary','data-primary="1"'):
     '<div class="row">'+btn(lastSeries(c,'fail')?'Accetta l’esito: il Goal fallisce':'Accetta l’esito e vai alla Serie successiva','narrStop')+'</div>'+
     (items.length?'<div class="fld"><label>Oppure rilancia con un roll-again</label>'+itemSeg('nt_item',items)+'</div>'+fld('nt_how','Come ti aiuta',{rows:2,ph:'Come l’alleato, l’oggetto, l’incantesimo o il terreno ti rimette in gioco'})+btn('Rilancia','narrCont','primary'):'<p class="hint">Non hai più roll-again disponibili.</p>'))+'</div>';}
  case 'decide_tb':{
   const items=availableItems(g);
   if(c.kind==='incap')return head+rollNote(c)+'<div class="form"><h3>Sei incapacitata</h3><p class="hint">Accetta la narrazione del GM, oppure gioca l’ultimo roll-again per attenuarla.</p><div class="row">'+btn('Accetto','decideStop')+'</div>'+
    (items.length?fld('dc_text','Descrivi il roll-again',{rows:2})+'<div class="fld"><label>Roll-again</label>'+itemSeg('dc_item',items)+'</div>'+btn('Ultimo tiro','decideItem','primary'):'<p class="hint">Non hai più roll-again disponibili.</p>')+'</div>';
   return head+rollNote(c)+'<div class="form"><h3>Il terzo roll-again è fallito</h3><p class="hint">La narrazione del GM resta, oppure dichiari la morte della trollbabe e la descrivi tu.</p><div class="row">'+btn('Resta la narrazione del GM','decideAccept')+'</div>'+fld('dc_text','Come muore',{rows:2})+btn('Dichiaro la sua morte','decideDie','danger')+'</div>';}
  case 'rels':{
   return head+'<div class="form"><h3>Il prezzo delle Relationship</h3><p class="hint">Chi hai usato come roll-again paga in base a come è finito il conflitto (tabella del manuale, a p. 49). Puoi correggere.</p>'+
    c.relCosts.map(x=>{const r=g.rels.find(y=>y.id===x.id);return r?'<div class="fld"><label>'+esc(r.name)+'</label>'+seg('rc_'+x.id,[['ok','Illeso'],['injured','Ferito'],['killed','Ucciso']],x.status)+'</div>':'';}).join('')+btn('Conferma','confirmRels','primary')+'</div>';}
 }
 return head;
}
function rollNote(c){return c.roll?'<div class="rn '+(c.roll.ok?'win':'lose')+'"><span class="d10">'+c.roll.v+'</span> '+(c.roll.ok?'riuscito':'fallito')+'</div>':'';}
function itemSeg(name,items){return seg(name,items.map(i=>[i.id,esc(i.label)]),items[0].id,'items');}
function pRelOffer(){
 const g=G;
 return '<div class="form"><h3>Una Relationship?</h3><p class="hint">Dopo il conflitto puoi legarti a un personaggio presente (alleato, avversario, amante). Serve una breve interazione. Per i PNG con nome decide il GM.</p>'+
  '<datalist id="npcl">'+g.npcs.map(n=>'<option value="'+esc(n.name)+'">').join('')+'</datalist>'+
  fld('ro_name','Chi',{list:'npcl',ph:'«uno dei guerrieri» o un PNG con nome'})+
  '<div class="fld"><label>Tipo</label>'+seg('ro_type',Object.keys(REL_TYPES).map(k=>[k,REL_TYPES[k]]),'ally')+'</div>'+
  fld('ro_text','Come interagisce con lei, subito dopo?',{rows:2})+
  '<div class="row">'+btn('Stringi la Relationship','relPropose','primary')+btn('Nessuna','relSkip')+'</div></div>';
}
function pRelApprove(){
 const p=G.relProposal||{name:'?',type:'ally'};
 return '<div class="form"><h3>Relationship con un personaggio con nome</h3><p>'+esc(pcName(G))+' propone: <b>'+esc(p.name)+'</b> come <b>'+REL_TYPES[p.type].toLowerCase()+'</b>.</p><p class="hint">Di solito si dice di no finché la situazione di partenza non è cambiata.</p><div class="row">'+btn('Accetta','relApprove','primary')+btn('Veto','relVeto')+'</div></div>';
}
function pEnding(){
 const g=G;
 return '<div class="form"><h3>Fine dell’avventura</h3><p class="hint">'+esc(g.endWhy||'')+' Se gli Stakes non si sono risolti in gioco, dì quale esito avviene ora, descrivi cosa succede al luogo su scala più grande, poi chiudi.</p>'+
  (PRIV&&PRIV.a?'<div class="fld"><label>Stakes: «'+esc(PRIV.stakes)+'»</label>'+seg('en_out',[['a',esc(PRIV.a)],['b',esc(PRIV.b)]],'a')+'</div>':fld('en_free','Esito degli Stakes',{}))+
  fld('en_text','Epilogo',{rows:4})+btn('Chiudi l’avventura','finishEnding','primary')+'</div>';
}
function revealHTML(){
 const r=G.reveal;if(!r||!r.stakes)return '';
 return '<div class="note rv"><b>Cosa c’era sotto.</b> Stakes: '+esc(r.stakes)+'. Esiti possibili: A «'+esc(r.a)+'», B «'+esc(r.b)+'». È successo: «'+esc(r.outcome)+'».'+(r.chars?'<br>'+nl(r.chars):'')+'</div>';
}
function pInterim(){
 const g=G,pc=g.pc;
 const rels=g.rels.filter(r=>!r.dead);
 return '<div class="form"><h3>Tra un’avventura e l’altra</h3>'+revealHTML()+
  '<div class="fld"><label>Numero di '+esc(pc.name)+' (ora '+pc.number+')</label>'+seg('im_delta',[[-1,'−1'],[0,'Invariato'],[1,'+1']],0)+'</div>'+
  rels.map(r=>'<div class="fld"><label>'+esc(r.name)+' ('+REL_TYPES[r.type].toLowerCase()+')</label>'+seg('im_r_'+r.id,[['keep','Tieni'],['drop','Sciogli']].concat(r.type==='lover'?[]:[['swap',r.type==='ally'?'Rendi avversario':'Rendi alleato']]),'keep')+'</div>').join('')+
  (g.scale<7?'<div class="fld"><label>Scale (ora '+g.scale+': '+SCALES[g.scale-1]+')</label>'+seg('im_scale',[['no','Resta'],['yes','Sale di 1']],'no')+'</div>':'')+
  '<div class="fld"><label>Dove va ora?</label>'+seg('im_loc',LOCS.map(l=>[l.id,esc(l.name),l.hint]),null,'locs')+'</div>'+
  btn('Si parte','interim','primary')+'</div>';
}

/* ================= azioni dell’interfaccia ================= */
async function animateDie(val){
 const el=$('#die');if(!el)return;
 if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=val;return;}
 el.classList.add('roll');
 for(let i=0;i<10;i++){el.textContent=d10();await sleep(70);}
 el.textContent=val;el.classList.remove('roll');await sleep(250);
}
const ACT={
 async newGame(){const name=v('n_name');if(!name)throw 'Scrivi il tuo nome.';ls.set('tb:name',name);await createGame(name,D.n_role||'tb',D.n_other||'ai');clear('n_name');},
 async joinGame(){const name=v('j_name');if(!name)throw 'Scrivi il tuo nome.';ls.set('tb:name',name);await joinGameByCode(v('j_code'),name);},
 async resume(el){const code=el.dataset.code;ss.set('tb:role:'+code,el.dataset.role);openGame(code);},
 async forget(el){const arr=(await loadIndex()).filter(x=>x.code!==el.dataset.code);await saveIndex(arr);renderStart();},
 async copyCode(){try{await navigator.clipboard.writeText(G.code);toast('Codice copiato.');}catch(e){toast('Copia a mano il codice: '+G.code);}},
 async exitGame(){showStart();},
 drawer(){document.body.classList.toggle('drawer');},
 async setKey(){await sample.setKey();lastSideKey='';render();},
 relSeen(){if(G.relResult){ui.relSeen=G.relResult.id;bump();}},
 tab(el){ui.tab=el.dataset.tab;lastSideKey='';render();},
 aiTier(el){AI.tier=D.ai_tier||'default';ls.set('tb:tier',AI.tier);},
 aiToggle(){AI.paused=!AI.paused;if(AI.paused&&AI.ctl){try{AI.ctl.abort();}catch(e){}}AI.err=null;lastKey='';render();if(!AI.paused)aiTick();},
 aiStop(){AI.paused=true;if(AI.ctl){try{AI.ctl.abort();}catch(e){}}lastKey='';render();},
 aiRetry(){AI.err=null;AI.failedSeq=-1;lastKey='';render();aiTick();},
 numPrev(){const n=parseInt(D.pc_num,10)||5;const e=$('#rngPrev');if(e)e.textContent=rngText(n)+'. Più basso = più magia, più alto = più combattimento.';},
 paceDesc(){},
 async ooc(){const t=v('ooc');if(!t)return;await A.ooc(ROLE,t);clear('ooc');},
 async chatSend(){
  const t=v('chat');if(!t||AI.chatBusy)return;
  const re=D.chat_re||null,reply=askOpen(G);
  clear('chat','chat_re');
  await A.ooc('tb',t,re?{chat:1,re:re}:{chat:1});
  if(reply){await A.askClose();return;}
  if(!sample){toast('L’IA non è disponibile in questa vista.');return;}
  // senza await: runAct terrebbe bloccati i pulsanti di gioco finché il GM risponde
  answerChat(t,re);
 },
 chatRetry(){const p=AI.chatPending;if(p)answerChat(p.text,p.re);},
 chatOpen(){ui.tab='chat';document.body.classList.add('drawer');lastSideKey='';render();const n=$('[data-d="chat"]');if(n)n.focus();},
 chatRe(el){D.chat_re=el.dataset.id;ACT.chatOpen();},
 chatReClear(){clear('chat_re');lastSideKey='';render();},
 async askSkip(){await A.ooc('tb','Interpreta tu.',{chat:1});await A.askClose();},
 async createPC(){
  const name=v('pc_name');if(!name)throw 'Dai un nome alla trollbabe.';
  if(!D.pc_loc)throw 'Scegli dove sta andando.';
  const f=n=>v(n)||'—';
  await A.createPC({name:name,number:parseInt(D.pc_num,10)||5,magic:D.pc_magic,fight:D.pc_fight,social:D.pc_social,hair:f('pc_hair'),horns:f('pc_horns'),hum:f('pc_hum'),troll:f('pc_troll'),cloth:f('pc_cloth'),kit:f('pc_kit')},parseInt(D.pc_loc,10));
  clear('pc_name','pc_hair','pc_horns','pc_hum','pc_troll','pc_cloth','pc_kit','pc_loc');
 },
 async genPrep(){
  if(!sample)throw 'L’IA non è disponibile in questa vista.';
  ui.gen=true;bump();
  try{
   const r=await callAI('gm','gm_prep',PREP_SCHEMA,v('gp_idea')?'Idea del GM da sviluppare: '+v('gp_idea'):'');
   const p=prepFromAI(r);
   D.gp_where=p.where;D.gp_who=p.who;D.gp_stakes=p.stakes;D.gp_a=p.a;D.gp_b=p.b;D.gp_chars=p.chars;D.gp_notes=p.notes;
   toast('Preparazione generata: controllala e modificala.');
  }catch(e){if(!(e&&e.code==='cancelled'))throw aiErrText(e);}
  finally{ui.gen=false;bump();}
 },
 async savePrep(){
  if(!v('gp_stakes')||!v('gp_a')||!v('gp_b'))throw 'Servono gli Stakes e i due esiti.';
  await A.savePrep({where:v('gp_where'),who:v('gp_who'),stakes:v('gp_stakes'),a:v('gp_a'),b:v('gp_b'),chars:v('gp_chars'),notes:v('gp_notes')});
  clear('gp_where','gp_who','gp_stakes','gp_a','gp_b','gp_chars','gp_notes','gp_idea');
 },
 async openScene(){
  if(!v('so_text'))throw 'Descrivi la scena.';
  await A.openScene(v('so_text'),v('so_npcs').split(',').map(s=>s.trim()),D.so_heal!=='no');
  clear('so_text','so_npcs','so_heal');
 },
 async say(){
  const t=v('sp_text');if(!t)throw 'Scrivi qualcosa.';
  await A.say(ROLE,t,ROLE==='gm'?v('sp_npcs').split(',').map(s=>s.trim()):[]);clear('sp_text','sp_npcs');
 },
 cfOpen(){clear('cf_goal');ui.declaring=true;bump();},
 cfCancel(){ui.declaring=false;bump();},
 async cfGo(){
  if(ROLE==='tb'&&!v('cf_goal'))throw 'Dichiara il tuo Goal.';
  await A.declare(ROLE,{type:D.cf_type||'fighting',pace:D.cf_pace||2,goal:v('cf_goal')});
  ui.declaring=false;clear('cf_goal');
 },
 async endScene(){await A.endScene();},
 async askEnd(){await A.askEnd();toast('Chiesto al GM.');},
 async leave(){await A.leave();},
 async beginEnding(){await A.beginEnding();},
 async beginEndLeave(){await A.beginEnding('La trollbabe lascia il luogo.');},
 async relBreak(el){await A.relBreak(el.dataset.id);},
 async request(){await A.request(v('sr_text'),D.sr_heal==='yes');clear('sr_text','sr_heal');},
 async requestGM(){await A.request('',D.sr_heal==='yes');clear('sr_text','sr_heal');},
 async setGoal(){if(!v('cg_goal'))throw 'Dichiara il tuo Goal.';await A.setGoal(v('cg_goal'),D.cg_adj||'keep');clear('cg_goal','cg_adj');},
 async paceAdj(){await A.paceAdj(D.cp_adj||'keep');clear('cp_adj');},
 async fairSay(){const t=v('fr_text');if(!t)throw 'Scrivi cosa fa il tuo personaggio.';if(G.conflict&&t===G.conflict.fair[ROLE])throw 'Non hai cambiato nulla: se ti va bene così, accetta.';await A.fairSay(ROLE,t);},
 async stepSay(){const t=v('st_text');if(!t)throw ROLE==='gm'?'Scrivi la mossa, oppure scegli «Nessuna mossa».':'Dì cosa fa la trollbabe.';await A.stepSay(ROLE,t);clear('st_text');},
 async stepNone(){await A.stepSay('gm','');clear('st_text');},
 async fairOk(){await A.fairOk(ROLE);},
 async roll(){const val=d10();await animateDie(val);await A.roll(val);},
 async narrGM(){const t=v('ng_text');if(!t)throw 'Scrivi la narrazione.';await A.narrGM(t);clear('ng_text');},
 async narrStop(){const t=v('nt_text');if(!t)throw 'Narra il fallimento.';await A.narrTB(t,null);clear('nt_text');},
 async narrCont(){const t=v('nt_text'),h=v('nt_how');if(!t)throw 'Narra il fallimento.';if(!h)throw 'Dì come ti aiuta il roll-again.';await A.narrTB(t,{item:D.nt_item,how:h});clear('nt_text','nt_item','nt_how');},
 async narrTB(){const t=v('nt_text');if(!t)throw 'Narra.';await A.narrTB(t,null);clear('nt_text');},
 async decideStop(){await A.decide({});clear('dc_text','dc_item');},
 async decideItem(){const t=v('dc_text');if(!t)throw 'Descrivi il roll-again.';await A.decide({item:D.dc_item,text:t});clear('dc_text','dc_item');},
 async decideAccept(){await A.decide({});clear('dc_text');},
 async decideDie(){const t=v('dc_text');if(!t)throw 'Descrivi la morte.';await A.decide({die:true,text:t});clear('dc_text');},
 async confirmRels(){const m={};(G.conflict.usedRels||[]).forEach(id=>{m[id]=D['rc_'+id]||'ok';});await A.confirmRels(m);},
 async relSkip(){await A.relSkip();},
 async relPropose(){
  const n=v('ro_name');if(!n)throw 'Scrivi con chi.';
  await A.relPropose({name:n,type:D.ro_type||'ally',text:v('ro_text')});clear('ro_name','ro_text');
 },
 async relApprove(){await A.relApprove(true);},
 async relVeto(){await A.relApprove(false);},
 async finishEnding(){
  const outText=PRIV&&PRIV.a?(D.en_out==='b'?PRIV.b:PRIV.a):v('en_free');
  if(!outText)throw 'Dì quale esito degli Stakes avviene.';
  await A.finishEnding(outText,v('en_text'),PRIV);clear('en_text','en_free','en_out');
 },
 async interim(){
  if(!D.im_loc)throw 'Scegli dove va ora.';
  const rels={};G.rels.forEach(r=>{rels[r.id]=D['im_r_'+r.id]||'keep';});
  await A.interim({delta:parseInt(D.im_delta,10)||0,rels:rels,scaleUp:D.im_scale==='yes',loc:parseInt(D.im_loc,10)});
  clear('im_delta','im_scale','im_loc');G.rels.forEach(r=>clear('im_r_'+r.id));
 },
 async exportDiary(){
  let t='# Trollbabe — partita '+G.code+'\n\n';
  LOG.forEach(e=>{
   const m=e.meta||{};
   if(e.type==='scene')t+='\n## Scena '+m.scene+' — '+m.loc+'\n\n'+e.text+'\n\n';
   else if(e.type==='gm'||e.type==='tb')t+='**'+whoLabel(e.type)+':** '+e.text+'\n\n';
   else if(e.type==='sys')t+='_'+e.text+'_\n\n';
   else if(e.type==='roll')t+='> d10 = '+m.v+' ('+TYPES[m.type].label+', numero '+m.n+'): '+(m.ok?'riuscito':'fallito')+'\n\n';
   else if(e.type==='ooc')t+='> _Fuori gioco_ · **'+oocWho(e)+':** '+e.text.replace(/\n/g,'\n> ')+'\n\n';
   else if(e.type==='conflict')t+='> **Conflict** '+TYPES[m.type].label+' · '+PACES[m.pace].label+' · Goal: «'+m.goal+'»\n\n';
  });
  if(!downloads){toast('Il salvataggio non è disponibile in questa vista.');return;}
  try{await downloads.save({filename:'trollbabe-'+G.code+'.md',data:t});}catch(e){if(!e||e.code!=='declined')toast('Salvataggio non riuscito.');}
 }
};
async function runAct(el){
 const f=ACT[el.dataset.act];if(!f)return;
 if(el.disabled||busy)return;
 busy=true;el.disabled=true;
 try{await f(el);}
 catch(e){toast(typeof e==='string'?e:((e&&e.message)||'Qualcosa non ha funzionato.'));console.error(e);}
 finally{busy=false;try{el.disabled=false;}catch(e){}}
}
function setupEvents(){
 document.addEventListener('input',e=>{const n=e.target&&e.target.dataset&&e.target.dataset.d;if(n)D[n]=e.target.value;});
 document.addEventListener('click',e=>{
  const sb=e.target.closest('.seg button');
  if(sb){
   const s=sb.closest('.seg');D[s.dataset.seg]=sb.dataset.val;
   $$('button',s).forEach(b=>{b.classList.toggle('on',b===sb);b.setAttribute('aria-pressed',String(b===sb));});
   if(s.dataset.seg==='cf_type'){const t=$('#typeDesc');if(t)t.textContent=TYPES[D.cf_type].desc;}
   const cb=s.dataset.onchange;if(cb&&ACT[cb])ACT[cb](sb);
   return;
  }
  const a=e.target.closest('[data-act]');if(a)runAct(a);
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target&&e.target.tagName==='INPUT'&&e.target.closest('.ooc-in')){e.preventDefault();const b=e.target.closest('.ooc-in').querySelector('[data-act]');if(b)b.click();return;}
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&e.target&&e.target.tagName==='TEXTAREA'){
   const p=$('#dock [data-primary]');if(p)p.click();
  }
 });
}
