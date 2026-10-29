// Prima di ogni tiro la trollbabe dice cosa fa: passo tra le Serie e «Come ti aiuta» nei roll-again.
const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
const until=async(f,ms,m)=>{const t=Date.now()+(ms||3000);while(Date.now()<t){if(f())return;await sleep(20);}throw new Error('timeout: '+m);};
const rollWait=async T=>{const t=Date.now()+3000;while((T.G.review||T.G.objection)&&Date.now()<t)await sleep(20);};
(async()=>{
  const ai={
   gm_prep:()=>({where:'w',who:'h',stakes:'x',a:'a',b:'b',characters:[{name:'Harald',want:'x'}],notes:''}),
   scene_open:()=>({text:'Riva del fiume.',npcs:['Harald'],heal:false}),
   gm_respond:()=>({text:'Harald aspetta.'}),
   fair_gm:()=>({text:'Harald carica con l’ascia.'}),
   step_gm:()=>({text:'Harald gira attorno e colpisce di manico.'}),
   review:()=>({objection:null}),
   narr_gm:()=>({text:'Un passo avanti.'})
  };
  const w=makeClient(makeStore(),'uA',{ai});await sleep(120);const T=w.__TB;const roll=async v=>{await rollWait(T);return T.A.roll(v);};
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(60);
  await T.A.createPC({name:'Kreshk',number:4,magic:'troll',fight:'unarmed',social:'feisty',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'});await T.go();
  await until(()=>T.G.step==='scene_play',3000,'scena aperta');
  const doc=w.document,C=()=>T.G.conflict;
  const stage=s=>until(()=>C()&&C().stage===s,3000,'stage '+s);

  await T.A.declare('tb',{type:'fighting',pace:2,goal:'Porto il troll in salvo'});
  await stage('fair');
  T.D.fr_text='Mi metto tra Harald e il troll.';await T.ACT.fairSay();
  await until(()=>C().fair.gm&&C().fair.turn==='tb',3000,'fair del GM');
  await T.ACT.fairOk();await stage('roll');

  // roll-again: il fallimento e il modo in cui la voce aiuta sono due testi distinti, entrambi obbligatori
  await roll(9);await stage('narr_tb');
  T.D.nt_text='Devo schivare l’ascia.';T.D.nt_item='carried';
  await assert.rejects(T.ACT.narrCont(),/come ti aiuta/,'senza «Come ti aiuta» non si rilancia');
  eq(C().stage,'narr_tb','ancora da narrare');
  T.D.nt_how='Lancio la fiaschetta negli occhi di Harald.';await T.ACT.narrCont();
  eq(C().stage,'roll','rilancio');eq(C().box,1,'box 1');
  await until(()=>T.LOG.some(e=>e.meta&&e.meta.kind==='item'),3000,'voce del roll-again nel diario');
  const item=T.LOG.filter(e=>e.type==='tb'&&e.meta&&e.meta.kind==='item');
  eq(item.length,1,'una voce «roll-again» nel diario');eq(item[0].text,'Lancio la fiaschetta negli occhi di Harald.','testo dell’aiuto');
  // ferita: pc.hurt resta solo la ferita
  await roll(9);await stage('narr_tb');eq(C().kind,'injury','ferita');
  T.D.nt_text='Il manico mi spacca il labbro.';T.D.nt_item='ally';T.D.nt_how='Un pescatore mi tira su per il braccio.';await T.ACT.narrCont();
  eq(T.G.pc.hurt,'Il manico mi spacca il labbro.','la ferita non contiene il roll-again');
  console.log('1 OK: «Come ti aiuta» separato e obbligatorio, ferita pulita');

  // Serie riuscita non finale: prima del tiro successivo c’è il passo, mossa del GM e azione della trollbabe
  await roll(1);
  await until(()=>C()&&C().stage==='step'&&C().step.gm!==null,3000,'mossa del GM');
  eq(C().series,2,'Serie 2');eq(C().step.gm,'Harald gira attorno e colpisce di manico.','mossa del GM');
  await sleep(40);
  assert.ok(!doc.querySelector('#die'),'niente dado prima dell’azione');
  assert.ok(doc.querySelector('#dock-body [data-act="stepSay"]'),'pulsante per dichiarare l’azione');
  assert.ok(doc.querySelector('#dock-body').textContent.indexOf('colpisce di manico')>=0,'la mossa del GM è visibile');
  await assert.rejects(T.ACT.stepSay(),/cosa fa la trollbabe/,'senza azione non si tira');
  T.D.st_text='Gli strappo l’ascia e la getto nel fiume.';await T.ACT.stepSay();
  eq(C().stage,'roll','dopo l’azione si tira');
  await until(()=>!T.G.review,3000,'il GM ha letto');await sleep(40);
  assert.ok(doc.querySelector('#die'),'ora c’è il dado');
  await until(()=>T.LOG.filter(e=>e.meta&&e.meta.kind==='step').length===2,3000,'passo nel diario');
  const steps=T.LOG.filter(e=>e.meta&&e.meta.kind==='step').map(e=>e.who);
  assert.deepStrictEqual(steps,['gm','tb'],'mossa e azione nel diario');
  const p=w.__calls.filter(c=>c.task==='step_gm')[0].prompt;
  assert.ok(p.indexOf('Niente esiti')>=0,'prompt del passo senza esiti');
  await roll(1);await until(()=>T.G.step!=='conflict',3000,'fine conflitto');
  eq(T.G.lastConflict.outcome,'success','2 Serie riuscite');
  console.log('2 OK: passo prima della Serie successiva');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
