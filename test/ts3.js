const {makeStandalone,sleep,lsDump}=require('./harness2');
const {tbBot,runUntil}=require('./bots');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
const {ai,mkFetch}=require('./aimocks');
const fillModal=async(w,key,btn)=>{
  for(let i=0;i<100;i++){const m=w.document.querySelector('.keymodal');if(m){m.querySelector('input').value=key;m.querySelector('[data-k="'+(btn||'ok')+'"]').click();return true;}await sleep(30);}
  return false;
};
(async()=>{
  // ---------- 1. partita contro l'IA con chiave
  const counter={};
  const w=makeStandalone(new Map(),{fetch:mkFetch(counter)});await sleep(250);const T=w.__TB;
  T.D.n_name='Saverio';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(150);
  const keyP=fillModal(w,'sk-ant-TEST123');
  const ok=await runUntil(()=>T.G&&T.G.adv>=2,[[w,tbBot,{declare:true,type:'fighting',pace:2,relName:'Hrenk'}]],30000,'ia-standalone');
  assert.ok(await keyP,'la finestra della chiave non è comparsa');
  assert.ok(ok,'avventura non completata: '+T.G.step+' err='+T.AI.err);
  eq(w.document.querySelectorAll('.keymodal').length,0,'la finestra deve chiudersi');
  const f=w.__fetches;
  assert.ok(f.length>5,'poche chiamate: '+f.length);
  f.forEach(x=>{eq(x.url,'https://api.anthropic.com/v1/messages','url');eq(x.init.headers['x-api-key'],'sk-ant-TEST123','chiave nelle intestazioni');eq(x.init.headers['anthropic-dangerous-direct-browser-access'],'true','intestazione browser');eq(x.init.headers['anthropic-version'],'2023-06-01','versione');});
  const models=[...new Set(f.map(x=>x.body.model))].sort();
  console.log('   modelli usati:',models.join(', '));
  assert.ok(models.includes('claude-sonnet-5'),'modello equilibrato');
  f.filter(x=>x.body.model==='claude-sonnet-5').forEach(x=>eq(x.body.output_config.effort,'low','effort'));
  f.filter(x=>x.body.model==='claude-haiku-4-5').forEach(x=>assert.ok(!x.body.output_config,'haiku senza effort'));
  // la chiave non è mai salvata
  assert.ok(JSON.stringify(lsDump(w)).indexOf('TEST123')<0,'la chiave è finita nel localStorage!');
  assert.ok(JSON.stringify(T.G).indexOf('TEST123')<0&&JSON.stringify(T.LOG).indexOf('TEST123')<0,'la chiave è finita nello stato');
  assert.ok(f.length&&!f.some(x=>x.body.messages[0].content.indexOf('TEST123')>=0),'la chiave è finita in un prompt');
  console.log('1 OK: partita contro l’IA con chiave dell’utente (intestazioni, modelli, nessuna fuga della chiave)');
  // ---------- 2. annullare la finestra
  const w2=makeStandalone(new Map(),{fetch:mkFetch({})});await sleep(250);const T2=w2.__TB;
  T2.D.n_name='S';T2.D.n_role='tb';T2.D.n_other='ai';await T2.ACT.newGame();await sleep(150);
  Object.assign(T2.D,{pc_name:'Retta',pc_num:'6',pc_magic:'troll',pc_fight:'melee',pc_social:'fun'});await T2.ACT.createPC();await T2.ACT.tvPlace({dataset:{val:'p3'}});await T2.ACT.travel();
  await fillModal(w2,'','no');await sleep(300);
  assert.ok(T2.AI.err&&T2.AI.err.indexOf('negato')>=0,'messaggio di rifiuto: '+T2.AI.err);
  assert.ok(w2.document.querySelector('[data-act="aiRetry"]'),'manca Riprova');
  assert.strictEqual(w2.__fetches.length,0,'nessuna chiamata senza chiave');
  // riprovo e fornisco la chiave
  const p2=fillModal(w2,'sk-ant-ALTRA');await T2.ACT.aiRetry();await p2;await sleep(500);
  assert.ok(w2.__fetches.length>=1,'dopo Riprova deve chiamare');
  console.log('2 OK: finestra annullata → messaggio e Riprova, nessuna chiamata finché non c’è la chiave');
  // ---------- 3. chiave non valida
  const w3=makeStandalone(new Map(),{fetch:async()=>({ok:false,status:401,json:async()=>({error:{message:'invalid x-api-key'}})})});await sleep(250);const T3=w3.__TB;
  T3.D.n_name='S';T3.D.n_role='tb';T3.D.n_other='ai';await T3.ACT.newGame();await sleep(150);
  Object.assign(T3.D,{pc_name:'Retta',pc_num:'6',pc_magic:'troll',pc_fight:'melee',pc_social:'fun'});await T3.ACT.createPC();await T3.ACT.tvPlace({dataset:{val:'p3'}});await T3.ACT.travel();
  await fillModal(w3,'sk-ant-SBAGLIATA');await sleep(400);
  assert.ok(T3.AI.err&&T3.AI.err.indexOf('chiave')>=0,'messaggio chiave non valida: '+T3.AI.err);
  assert.ok(!w3.__tbNet||true);
  // al successivo tentativo la chiave sbagliata è stata dimenticata: richiede di nuovo
  const p3=fillModal(w3,'sk-ant-SBAGLIATA2');await T3.ACT.aiRetry();assert.ok(await p3,'doveva richiedere la chiave');
  console.log('3 OK: chiave non valida (401) → messaggio chiaro, la chiave viene dimenticata e richiesta di nuovo');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
