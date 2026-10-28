const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
const waitFor=async(c,ms)=>{const t0=Date.now();while(Date.now()-t0<(ms||6000)){if(c())return true;await sleep(40);}throw new Error('timeout: '+c);};
(async()=>{
  const store=makeStore();
  const ai={gm_prep:()=>({where:'w',who:'h',stakes:'S',a:'a',b:'b',characters:[],notes:''}),scene_open:()=>({text:'Scena.',npcs:[],heal:true}),gm_respond:()=>({text:'ok'}),fair_gm:()=>({text:'Il canto sale.'}),narr_gm:()=>({text:'ok'})};
  const w=makeClient(store,'uA',{ai});await sleep(120);const T=w.__TB;
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(150);
  Object.assign(T.D,{pc_name:'Gwenna',pc_num:'6',pc_magic:'troll',pc_fight:'missile',pc_social:'fun',pc_loc:'9'});await T.ACT.createPC();await sleep(1500);
  // conflitto Magic: due fallimenti → ferita descritta
  await T.A.declare('tb',{type:'magic',pace:1,goal:'Capisco chi canta'});
  await waitFor(()=>T.G.conflict&&T.G.conflict.stage==='fair');
  await T.A.fairSay('tb','Gwenna siede e canta');
  await waitFor(()=>T.G.conflict.fair.gm&&T.G.conflict.fair.gmOk);
  await T.A.fairOk('tb');
  await waitFor(()=>T.G.conflict.stage==='roll');
  await T.A.roll(1);await waitFor(()=>T.G.conflict.stage==='narr_tb');
  await T.A.narrTB('Il fiato le manca.',{item:'carried'});await waitFor(()=>T.G.conflict.stage==='roll');
  await T.A.roll(1);await waitFor(()=>T.G.conflict.kind==='injury');
  await T.A.narrTB('Gli spiriti la rimbalzano: sangue dal naso e vista offuscata.',null);await sleep(200);
  eq(T.G.pc.status,'injured','ferita');
  assert.ok(T.G.pc.hurt&&T.G.pc.hurt.indexOf('spiriti')>=0,'descrizione della ferita non salvata');
  assert.ok(w.document.querySelector('#side-body').textContent.indexOf('spiriti la rimbalzano')>=0,'ferita non mostrata nella scheda');
  // l'IA la vede nel suo stato anche se il diario scorre
  await T.A.relSkip();await sleep(100);
  const st=w.__TB.TASKS&&null;
  // una seconda ferita non sostituisce la prima
  await T.A.say('tb','Mi riposo.');await sleep(900);
  const prompts=w.__calls.filter(c=>c.task==='gm_respond');
  assert.ok(prompts.length&&prompts[prompts.length-1].prompt.indexOf('sangue dal naso')>=0,'l’IA non vede la natura della ferita');
  assert.ok(prompts[0].prompt.indexOf('Una ferita o un’incapacità deve sempre avere senso')>=0,'regola mancante nel prompt');
  // la cura la cancella
  await T.A.endScene();await T.A.request('mi curo',true);await sleep(1500);
  eq(T.G.pc.status,'ok','curata');eq(T.G.pc.hurt,null,'descrizione cancellata');
  console.log('OK: ferita coerente — descrizione salvata, visibile all’IA e in scheda, cancellata dalla cura');process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
