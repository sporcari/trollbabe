const {JSDOM}=require('jsdom');
const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','dist','trollbabe-artifact.html'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function makeStore(){return {docs:new Map(),ls:new Set(),leases:new Map()};}
function makeDB(store,uid){
  const parentOf=p=>p.split('/').slice(0,-1).join('/');
  const snapDoc=path=>{const d=store.docs.get(path);return {id:path.split('/').pop(),exists:!!d,data:()=>d?Object.freeze(JSON.parse(JSON.stringify(d))):undefined,metadata:{fromCache:false,hasPendingWrites:false}};};
  const colSnap=path=>{
    const keys=[...store.docs.keys()].filter(k=>parentOf(k)===path).sort();
    const docs=keys.map(snapDoc);
    return {docs,size:docs.length,empty:!docs.length,docChanges:()=>docs.map((d,i)=>({type:'added',doc:d,oldIndex:-1,newIndex:i})),metadata:{fromCache:false,hasPendingWrites:false}};
  };
  const notify=path=>{for(const l of store.ls){if((l.kind==='doc'&&l.path===path)||(l.kind==='col'&&l.path===parentOf(path)))setTimeout(()=>{if(l.alive)l.fn();},0);}};
  const check=(p,even)=>{const n=p.split('/').length;if(even&&n%2)throw new TypeError('path doc dispari: '+p);if(!even&&!(n%2))throw new TypeError('path collection pari: '+p);};
  function docRef(path){check(path,true);return {
    id:path.split('/').pop(),path,
    async get(){return snapDoc(path);},
    async set(data){if(typeof data!=='object'||Array.isArray(data))throw {code:'invalid_argument'};store.docs.set(path,JSON.parse(JSON.stringify(data)));notify(path);},
    async update(data){const d=store.docs.get(path);if(!d)throw {code:'invalid_argument'};const merge=(a,b)=>{const o=Object.assign({},a);for(const k of Object.keys(b)){const v=b[k];o[k]=(v&&typeof v==='object'&&!Array.isArray(v)&&a&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))?merge(a[k],v):v;}return o;};store.docs.set(path,merge(d,JSON.parse(JSON.stringify(data))));notify(path);},
    async delete(){store.docs.delete(path);notify(path);},
    async acquire(o){const l=store.leases.get(path);const t=Date.now();if(l&&l.exp>t&&l.holder!==o.holder)return {acquired:false};store.leases.set(path,{holder:o.holder,exp:t+(o.ttlMs||30000)});return {acquired:true,holder:o.holder};},
    onSnapshot(next,err){const l={kind:'doc',path,alive:true,fn:()=>next(snapDoc(path))};store.ls.add(l);setTimeout(()=>{if(l.alive)l.fn();},0);return ()=>{l.alive=false;store.ls.delete(l);};},
    collection(sub){return colRef(path+'/'+sub);}
  };}
  function colRef(path){check(path,false);const q={path,
    doc(id){return docRef(path+'/'+(id||Math.random().toString(36).slice(2,10)));},
    async add(data){const r=q.doc();await r.set(data);return r;},
    async get(){return colSnap(path);},
    onSnapshot(next){const l={kind:'col',path,alive:true,fn:()=>next(colSnap(path))};store.ls.add(l);setTimeout(()=>{if(l.alive)l.fn();},0);return ()=>{l.alive=false;store.ls.delete(l);};},
    where(){return q;},orderBy(){return q;},limit(){return q;}};return q;}
  return {doc:docRef,collection:colRef};
}

function makeClient(store,uid,opts){
  opts=opts||{};
  const calls=[];
  const win={};
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://trollbabe.test/',beforeParse(window){
    window.__TB_TEST__=true;
    const db=makeDB(store,uid);
    const sample=async()=>{throw {code:'invalid_request'};};
    sample.json=async(prompt,o)=>{
      const m=/=== COMPITO \[(\w+)\] ===/.exec(prompt);const task=m?m[1]:'?';
      calls.push({task,prompt,o});
      await sleep(5);
      if(opts.sampleFail&&opts.sampleFail(task,calls.length))throw {code:'rate_limited',message:'x'};
      const f=opts.ai&&opts.ai[task];
      if(!f)throw {code:'invalid_json',message:'nessun mock per '+task};
      return f(calls.filter(c=>c.task===task).length,prompt);
    };
    const saved=[];
    window.claude={use:async name=>{
      if(name==='db')return db;
      if(name==='user')return {id:async()=>uid,isOwner:async()=>true,canEdit:async()=>true};
      if(name==='sample')return opts.noSample?null:sample;
      if(name==='room')return {join:async()=>({presence(){},onPeers(){},leave(){}})};
      if(name==='downloads')return {save:async x=>{saved.push(x);return {status:'saved'};}};
      return null;
    }};
    window.__calls=calls;window.__saved=saved;window.__uid=uid;
    window.confirm=()=>true;
  }});
  return dom.window;
}
module.exports={makeStore,makeClient,sleep};
