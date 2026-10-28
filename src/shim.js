/* ============================================================
   Strato per l’uso fuori da Claude (GitHub Pages).
   Dentro Claude esiste già window.claude e questo file non fa nulla.
   Fuori, ricrea con lo stesso contratto: db (replicato via PeerJS),
   user, sample (chiave Anthropic dell’utente), room, downloads.
   ============================================================ */
(function(){
if(window.claude)return;
const ls={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
const clone=o=>JSON.parse(JSON.stringify(o));
const rid=n=>Math.random().toString(36).slice(2,2+(n||4));

/* ---------- archivio locale ---------- */
const store=new Map();
const listeners=new Set();
const parentOf=p=>p.split('/').slice(0,-1).join('/');
const isShared=p=>p.indexOf('games/')===0;
const isPrivate=p=>p.indexOf('data/users/')===0;
const codeOf=p=>{const m=/^games\/([A-Za-z0-9]+)/.exec(p);return m?m[1]:null;};
function loadAll(){
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&k.indexOf('tb:g:')===0){const o=JSON.parse(localStorage.getItem(k));Object.keys(o.docs||{}).forEach(p=>store.set(p,o.docs[p]));}
    }
    const pv=ls.get('tb:priv');
    if(pv){const o=JSON.parse(pv);Object.keys(o).forEach(p=>store.set(p,o[p]));}
  }catch(e){}
}
const dirty=new Set();let dirtyPriv=false,pt=null;
function markDirty(p){
  if(isPrivate(p))dirtyPriv=true;else{const c=codeOf(p);if(c)dirty.add(c);}
  clearTimeout(pt);pt=setTimeout(flush,250);
}
function flush(){
  dirty.forEach(c=>{const docs={};store.forEach((v,p)=>{if(codeOf(p)===c)docs[p]=v;});ls.set('tb:g:'+c,JSON.stringify({docs:docs}));});
  dirty.clear();
  if(dirtyPriv){const o={};store.forEach((v,p)=>{if(isPrivate(p))o[p]=v;});ls.set('tb:priv',JSON.stringify(o));dirtyPriv=false;}
}
window.addEventListener('pagehide',flush);window.addEventListener('beforeunload',flush);
function merge(a,b){
  const o=Object.assign({},a);
  Object.keys(b).forEach(k=>{
    const v=b[k];
    o[k]=(v&&typeof v==='object'&&!Array.isArray(v)&&a&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))?merge(a[k],v):v;
  });
  return o;
}
function notify(path){
  listeners.forEach(l=>{
    if(((l.kind==='doc'&&l.path===path)||(l.kind==='col'&&l.path===parentOf(path)))&&!l.pending){
      l.pending=true;
      setTimeout(()=>{l.pending=false;if(l.alive)l.fn();},0);
    }
  });
}
function apply(op,path,data){
  if(op==='delete')store.delete(path);
  else if(op==='update'){const d=store.get(path);if(!d)return false;store.set(path,merge(d,clone(data)));}
  else store.set(path,clone(data));
  markDirty(path);notify(path);return true;
}
function write(op,path,data){
  const ok=apply(op,path,data);
  if(op==='update'&&!ok)throw {code:'invalid_argument',message:'documento inesistente'};
  if(isShared(path))net.send({t:'w',op:op,path:path,data:op==='delete'?null:data});
}
const snapDoc=p=>{const d=store.get(p);return {id:p.split('/').pop(),exists:d!==undefined,data:()=>d===undefined?undefined:clone(d)};};
const colSnap=path=>{
  const keys=[];store.forEach((v,k)=>{if(parentOf(k)===path)keys.push(k);});keys.sort();
  const docs=keys.map(snapDoc);
  return {docs:docs,size:docs.length,empty:!docs.length};
};
const leases=new Map();
function docRef(path){
  const n=path.split('/').length;if(n%2)throw new TypeError('percorso di documento non valido: '+path);
  return {
    id:path.split('/').pop(),path:path,
    async get(){return snapDoc(path);},
    async set(d){write('set',path,d);},
    async update(d){write('update',path,d);},
    async delete(){write('delete',path);},
    async acquire(o){const l=leases.get(path),t=Date.now();if(l&&l.exp>t&&l.holder!==o.holder)return {acquired:false};leases.set(path,{holder:o.holder,exp:t+((o&&o.ttlMs)||30000)});return {acquired:true,holder:o.holder};},
    onSnapshot(next){
      const l={kind:'doc',path:path,alive:true,pending:false,fn:()=>next(snapDoc(path))};
      listeners.add(l);setTimeout(()=>{if(l.alive)l.fn();},0);
      return ()=>{l.alive=false;listeners.delete(l);};
    },
    collection(sub){return colRef(path+'/'+sub);}
  };
}
function colRef(path){
  const n=path.split('/').length;if(!(n%2))throw new TypeError('percorso di collezione non valido: '+path);
  const q={path:path,
    doc(id){return docRef(path+'/'+(id||rid(8)));},
    async add(d){const r=q.doc();await r.set(d);return r;},
    async get(){return colSnap(path);},
    onSnapshot(next){
      const l={kind:'col',path:path,alive:true,pending:false,fn:()=>next(colSnap(path))};
      listeners.add(l);setTimeout(()=>{if(l.alive)l.fn();},0);
      return ()=>{l.alive=false;listeners.delete(l);};
    },
    where(){return q;},orderBy(){return q;},limit(){return q;}};
  return q;
}

/* ---------- collegamento diretto tra i browser (PeerJS) ---------- */
const PEER_PREFIX='trollbabe-';
const net={
  peer:null,conn:null,code:null,isHost:false,gotSync:null,myPresence:null,remotePresence:null,pl:new Set(),timer:null,
  send(msg){try{if(this.conn&&this.conn.open)this.conn.send(msg);}catch(e){}},
  snapshotFor(code){const docs={};store.forEach((v,p)=>{if(codeOf(p)===code)docs[p]=v;});return docs;},
  mergeSync(docs){
    Object.keys(docs||{}).forEach(path=>{
      const theirs=docs[path],mine=store.get(path);
      if(path.split('/').length===2){   // documento di gioco: vince la versione più avanzata
        if(!mine||theirs.seq>mine.seq||(theirs.seq===mine.seq&&theirs.rev!==mine.rev&&String(theirs.rev)>String(mine.rev)))apply('set',path,theirs);
      }else if(!store.has(path))apply('set',path,theirs);
    });
  },
  allowed(uid){
    // l'host accetta solo chi ha un posto, oppure chiunque finché ne resta uno libero
    const g=store.get('games/'+this.code);
    if(!g)return true;
    const seats=['gm','tb'].map(x=>g.seats[x]).filter(x=>x.kind==='human');
    return seats.some(x=>!x.uid)||seats.some(x=>x.uid===uid);
  },
  onData(d,c){
    if(!d||typeof d!=='object')return;
    if(this.isHost&&c&&!c.verified){
      if(d.t!=='sync'||d.code!==this.code||!this.allowed(d.uid)){try{c.close();}catch(e){}return;}
      c.verified=true;
      if(this.conn&&this.conn!==c){try{this.conn.close();}catch(e){}}
      this.conn=c;
      this.mergeSync(d.docs);
      try{c.send({t:'sync',code:this.code,docs:this.snapshotFor(this.code)});if(this.myPresence)c.send({t:'p',p:this.myPresence});}catch(e){}
      this.emitPeers();
      return;
    }
    if(d.t==='sync'){
      if(d.code===this.code)this.mergeSync(d.docs);
      if(this.gotSync){const f=this.gotSync;this.gotSync=null;f();}
    }else if(d.t==='w'){
      if(d.path&&codeOf(d.path)===this.code&&isShared(d.path))apply(d.op,d.path,d.data);
    }else if(d.t==='p'){this.remotePresence=d.p||null;this.emitPeers();}
  },
  peerList(){
    const l=[{isMe:true,presence:this.myPresence}];
    if(this.conn&&this.conn.open&&(!this.isHost||this.conn.verified))l.push({isMe:false,presence:this.remotePresence});
    return l;
  },
  emitPeers(){const c={peers:this.peerList()};this.pl.forEach(f=>{try{f(c);}catch(e){}});},
  attach(c){
    if(!this.isHost)this.conn=c;
    c.on('open',()=>{
      if(this.isHost)return;            // l'host risponde solo dopo aver verificato chi si presenta
      this.send({t:'sync',code:this.code,uid:ls.get('tb:cid')||'',docs:this.snapshotFor(this.code)});
      if(this.myPresence)this.send({t:'p',p:this.myPresence});
      this.emitPeers();
    });
    c.on('data',d=>this.onData(d,c));
    c.on('close',()=>{
      if(this.conn===c){
        this.conn=null;this.remotePresence=null;this.emitPeers();
        if(!this.isHost&&this.code){clearTimeout(this.timer);this.timer=setTimeout(()=>this.connectGuest().catch(()=>{}),4000);}
      }
    });
    c.on('error',()=>{});
  },
  startHost(){
    return new Promise((res,rej)=>{
      let done=false;const fin=(f,v)=>{if(!done){done=true;f(v);}};
      const go=()=>{
        try{
          const p=new Peer(PEER_PREFIX+this.code);this.peer=p;
          p.on('open',()=>fin(res));
          p.on('connection',c=>{this.attach(c);});
          p.on('error',e=>{
            if(e.type==='unavailable-id'){if(!done){try{p.destroy();}catch(_){}setTimeout(go,3000);}}
            else if(!done)fin(rej,new Error('Collegamento non riuscito ('+e.type+')'));
          });
        }catch(e){fin(rej,e);}
      };
      go();
      setTimeout(()=>fin(rej,new Error('Il servizio di collegamento (PeerJS) non risponde.')),25000);
    });
  },
  connectGuest(){
    return new Promise((res,rej)=>{
      let done=false;const fin=(f,v)=>{if(!done){done=true;f(v);}};
      try{
        if(this.peer){try{this.peer.destroy();}catch(e){}}
        const p=new Peer();this.peer=p;
        p.on('open',()=>{const c=p.connect(PEER_PREFIX+this.code,{reliable:true});this.gotSync=()=>fin(res);this.attach(c);});
        p.on('error',e=>{
          if(e.type==='peer-unavailable'){
            fin(rej,new Error('Nessuna partita con questo codice è online: chi l’ha creata deve avere la pagina aperta.'));
            if(!this.isHost&&this.code){clearTimeout(this.timer);this.timer=setTimeout(()=>this.connectGuest().catch(()=>{}),5000);}
          }else fin(rej,new Error('Collegamento non riuscito ('+e.type+')'));
        });
      }catch(e){fin(rej,e);}
      setTimeout(()=>fin(rej,new Error('Tempo scaduto nel collegamento.')),15000);
    });
  },
  host(code){this.code=code;this.isHost=true;ls.set('tb:host:'+code,'1');return this.startHost();},
  join(code){
    if(ls.get('tb:host:'+code)==='1')return this.open(code);
    this.closeNet();this.code=code;this.isHost=false;
    return this.connectGuest().catch(e=>{this.close();throw e;});
  },
  open(code){
    if(this.code===code&&this.peer&&!this.peer.destroyed&&(this.isHost||this.conn))return Promise.resolve();
    const g=store.get('games/'+code);
    if(!g||g.seats.gm.kind==='ai'||g.seats.tb.kind==='ai')return Promise.resolve();
    this.closeNet();this.code=code;
    if(ls.get('tb:host:'+code)==='1'){this.isHost=true;return this.startHost().catch(()=>{});}
    this.isHost=false;return this.connectGuest().catch(()=>{});
  },
  closeNet(){
    clearTimeout(this.timer);this.timer=null;
    try{if(this.conn)this.conn.close();}catch(e){}
    try{if(this.peer)this.peer.destroy();}catch(e){}
    this.conn=null;this.peer=null;this.remotePresence=null;this.gotSync=null;
  },
  close(){this.closeNet();this.code=null;this.emitPeers();}
};

/* ---------- IA con la chiave dell’utente (solo in memoria) ---------- */
let KEY='';
const st=document.createElement('style');
st.textContent='.keymodal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:100;padding:1rem}.keymodal .km{background:var(--paper);color:var(--ink);border:3px solid var(--ink);max-width:30rem;width:100%;padding:1rem 1.2rem}.keymodal h2{font-family:var(--disp);font-weight:400;margin:0 0 .5rem}.keymodal p{font-family:var(--sans);font-size:.92rem;margin:.3rem 0 .7rem}.keymodal input{width:100%;background:var(--paper2);border:2px solid var(--ink);padding:.45rem .6rem;font-size:1rem;border-radius:0}';
document.head.appendChild(st);
function askKey(){
  return new Promise(res=>{
    const d=document.createElement('div');d.className='keymodal';
    d.innerHTML='<div class="km" role="dialog" aria-modal="true"><h2>Chiave Anthropic</h2><p>Le chiamate dell’IA sono a tuo carico. Incolla la tua chiave (sk-ant-…): resta solo in memoria di questa scheda, non viene salvata e non viene mai inviata all’altro giocatore. La ottieni su console.anthropic.com.</p><input type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…"><div class="row"><button type="button" class="btn primary" data-k="ok">Usa questa chiave</button><button type="button" class="btn ghost" data-k="no">Annulla</button></div></div>';
    document.body.appendChild(d);
    const inp=d.querySelector('input');inp.focus();
    const end=v=>{d.remove();res(v);};
    d.addEventListener('click',e=>{
      const k=e.target.closest&&e.target.closest('[data-k]');if(!k)return;
      if(k.dataset.k==='no')return end(false);
      const v=inp.value.trim();if(!v){inp.focus();return;}
      KEY=v;end(true);
    });
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')d.querySelector('[data-k="ok"]').click();});
  });
}
const sample=async()=>{throw {code:'invalid_request'};};
sample.setKey=askKey;
sample.hasKey=()=>!!KEY;
sample.json=async function(prompt,opts){
  opts=opts||{};
  if(!KEY){const ok=await askKey();if(!ok)throw {code:'not_granted'};}
  const tier=opts.modelTier||'default';
  const model=tier==='quick'?'claude-haiku-4-5':tier==='complex'?'claude-opus-5':'claude-sonnet-5';
  const body={model:model,max_tokens:16000,messages:[{role:'user',content:prompt}]};
  if(model!=='claude-haiku-4-5'&&tier!=='complex')body.output_config={effort:'low'};
  let r;
  try{
    r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal:opts.signal,headers:{'content-type':'application/json','x-api-key':KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(body)});
  }catch(e){
    if(e&&e.name==='AbortError')throw {code:'cancelled'};
    throw {code:'network',message:'rete non raggiungibile'};
  }
  if(r.status===401||r.status===403){KEY='';throw {code:'bad_key'};}
  if(r.status===429)throw {code:'rate_limited'};
  if(!r.ok){let m='';try{m=(await r.json()).error.message;}catch(e){}throw {code:'upstream_error',message:m||('HTTP '+r.status)};}
  const d=await r.json();
  const txt=(d.content||[]).map(x=>x.text||'').join('');
  const i=txt.indexOf('{'),j=txt.lastIndexOf('}');
  if(i<0||j<=i)throw {code:'invalid_json'};
  try{return JSON.parse(txt.slice(i,j+1));}catch(e){throw {code:'invalid_json'};}
};

/* ---------- utente, presenza, download ---------- */
const userApi={id:async()=>{let id=ls.get('tb:cid');if(!id){id='c_'+rid(12);ls.set('tb:cid',id);}return id;}};
const roomApi={async join(){
  return {
    presence(p){net.myPresence=p;net.send({t:'p',p:p});net.emitPeers();},
    onPeers(fn){net.pl.add(fn);try{fn({peers:net.peerList()});}catch(e){}return ()=>net.pl.delete(fn);},
    leave(){}
  };
}};
const downloadsApi={save:async function(o){
  const b=new Blob([o.data],{type:'text/markdown;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=o.filename||'trollbabe.md';
  document.body.appendChild(a);a.click();
  setTimeout(()=>{try{URL.revokeObjectURL(a.href);}catch(e){}a.remove();},500);
  return {status:'saved'};
}};

loadAll();
window.__tbNet=net;
window.claude={use:async function(name){
  if(name==='db')return {doc:docRef,collection:colRef};
  if(name==='user')return userApi;
  if(name==='sample')return sample;
  if(name==='room')return roomApi;
  if(name==='downloads')return downloadsApi;
  return null;
}};
})();
