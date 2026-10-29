// Serie intermedie: il GM narra un avvicinamento al Goal, non il Goal; «Accetta l’esito» non chiude il conflitto se mancano Serie.
const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
const until=async(f,ms,m)=>{const t=Date.now()+(ms||3000);while(Date.now()<t){if(f())return;await sleep(20);}throw new Error('timeout: '+m);};
(async()=>{
  const ai={
   gm_prep:()=>({where:'w',who:'h',stakes:'Oskel',a:'vive',b:'muore',characters:[{name:'Harald',want:'x'}],notes:''}),
   scene_open:()=>({text:'Riva del fiume. Harald alza l’ascia.',npcs:['Harald'],heal:false}),
   gm_respond:()=>({text:'Harald aspetta.'}),
   fair_gm:()=>({text:'Harald carica con l’ascia del padre.'}),
   narr_gm:()=>({text:'Un passo avanti.'})
  };
  const w=makeClient(makeStore(),'uA',{ai});await sleep(120);const T=w.__TB;
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(60);
  await T.A.createPC({name:'Kreshk',number:4,magic:'troll',fight:'unarmed',social:'feisty',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'},4);
  await until(()=>T.G.step==='scene_play',3000,'scena aperta');
  const doc=w.document;
  const prompts=()=>w.__calls.filter(c=>c.task==='narr_gm').map(c=>c.prompt);
  const stopLabel=()=>{const b=doc.querySelector('[data-act="narrStop"]');return b?b.textContent:null;};
  const stage=s=>until(()=>T.G.conflict&&T.G.conflict.stage===s,3000,'stage '+s);

  // funzione pura
  eq(T.lastSeries({succ:0,fail:0,pace:3},'success'),false,'1 su 3 non chiude');
  eq(T.lastSeries({succ:2,fail:0,pace:3},'success'),true,'3 su 3 chiude');
  eq(T.lastSeries({succ:0,fail:0,pace:1},'fail'),true,'Entire conflict chiude subito');

  // Action by action: R F R F R
  await T.A.declare('tb',{type:'fighting',pace:3,goal:'Porto il troll in salvo'});
  await stage('fair');
  await T.A.fairSay('tb','Mi metto tra Harald e il troll.');
  await until(()=>T.G.conflict.fair.gm&&T.G.conflict.fair.gmOk,3000,'fair del GM');
  await T.A.fairOk('tb');
  await stage('roll');

  await T.A.roll(1);
  await until(()=>prompts().length===1,3000,'narr_gm 1');
  assert.ok(prompts()[0].indexOf('il Goal NON è ancora raggiunto')>=0,'Serie 1 riuscita: il GM non deve concedere il Goal');
  assert.ok(prompts()[0].indexOf('Il Goal della trollbabe è RIUSCITO')<0,'Serie 1: niente Goal riuscito');
  await until(()=>T.G.conflict.series===2&&T.G.conflict.stage==='roll',3000,'Serie 2');

  await T.A.roll(9);await stage('narr_tb');await sleep(40);
  eq(stopLabel(),'Accetta l’esito e vai alla Serie successiva','Serie 2 fallita, conflitto aperto');
  await T.A.narrTB('Devo schivare l’ascia e mi allontano dal troll.',null);
  await until(()=>T.G.conflict.series===3,3000,'Serie 3');

  await T.A.roll(1);
  await until(()=>prompts().length===2,3000,'narr_gm 2');
  assert.ok(prompts()[1].indexOf('Serie riuscite 2 su 3')>=0,'conteggio nel prompt');
  await until(()=>T.G.conflict.series===4&&T.G.conflict.stage==='roll',3000,'Serie 4');

  await T.A.roll(9);await stage('narr_tb');await sleep(40);
  eq(stopLabel(),'Accetta l’esito e vai alla Serie successiva','Serie 4 fallita (2 su 3), conflitto aperto');
  await T.A.narrTB('Scivolo sul fango.',null);
  await until(()=>T.G.conflict.series===5,3000,'Serie 5');

  await T.A.roll(1);
  await until(()=>prompts().length===3,3000,'narr_gm 3');
  assert.ok(prompts()[2].indexOf('Il Goal della trollbabe è RIUSCITO')>=0,'ultima Serie: Goal riuscito');
  await until(()=>T.G.step!=='conflict',3000,'fine conflitto');
  eq(T.G.lastConflict.outcome,'success','conflitto vinto 3 a 2');
  console.log('1 OK: Action by action, narrazioni intermedie e finale');

  // Entire conflict: il primo fallimento chiude
  if(T.G.step==='rel_offer')await T.A.relSkip();
  await until(()=>T.G.step==='scene_play',3000,'di nuovo in scena');
  await T.A.declare('tb',{type:'fighting',pace:1,goal:'Lo metto al tappeto'});
  await stage('fair');
  await T.A.fairSay('tb','Carico a testa bassa.');
  await until(()=>T.G.conflict.fair.gm&&T.G.conflict.fair.gmOk,3000,'fair del GM 2');
  await T.A.fairOk('tb');
  await stage('roll');
  await T.A.roll(9);await stage('narr_tb');await sleep(40);
  eq(stopLabel(),'Accetta l’esito: il Goal fallisce','Entire conflict: il fallimento chiude');
  assert.ok(w.__calls.filter(c=>c.task==='fair_gm').every(c=>c.prompt.indexOf('niente esiti né conseguenze anticipate')>=0),'fair_gm senza esiti anticipati');
  console.log('2 OK: Entire conflict ed etichetta finale');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
