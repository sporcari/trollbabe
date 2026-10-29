// Fair and clear a turni: la modifica della trollbabe fa rispondere il GM IA; dopo tre giri a testa l’IA accetta.
const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
const until=async(f,ms,m)=>{const t=Date.now()+(ms||3000);while(Date.now()<t){if(f())return;await sleep(20);}throw new Error('timeout: '+m);};
(async()=>{
  let mode='agree';
  const ai={
   gm_prep:()=>({where:'w',who:'h',stakes:'x',a:'a',b:'b',characters:[{name:'Ingrid',want:'x'}],notes:''}),
   scene_open:()=>({text:'Il molo.',npcs:['Ingrid'],heal:false}),
   gm_respond:()=>({text:'Ingrid aspetta.'}),
   narr_gm:()=>({text:'Ingrid cede.'}),
   fair_gm:n=>mode==='agree'?(n===1?{text:'Ingrid arretra.'}:n===2?{text:'Ingrid arretra e chiama Hrafn.'}:{accept:true}):{text:'GM versione '+n}
  };
  const w=makeClient(makeStore(),'uA',{ai});await sleep(120);const T=w.__TB;
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(60);
  await T.A.createPC({name:'Mirna',number:4,magic:'troll',fight:'unarmed',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'},4);
  await until(()=>T.G.step==='scene_play',3000,'scena aperta');
  const doc=w.document,F=()=>T.G.conflict.fair;
  const calls=()=>w.__calls.filter(c=>c.task==='fair_gm');
  const acts=()=>[...doc.querySelectorAll('#dock-body [data-act]')].map(b=>b.dataset.act+'='+b.textContent);
  const say=async t=>{T.D.fr_text=t;await T.ACT.fairSay();};

  // 1) la modifica della trollbabe riapre il turno del GM, che rilegge e aggiorna
  await T.A.declare('tb',{type:'social',pace:1,goal:'Ingrid acconsente'});
  await until(()=>T.G.conflict&&T.G.conflict.stage==='fair',3000,'fair');
  eq(F().turn,'tb','comincia la trollbabe');await sleep(40);
  assert.deepStrictEqual(acts(),['fairSay=Dichiara'],'primo turno: solo «Dichiara»');
  await say('Allungo la mano verso i capelli di Ingrid.');
  await until(()=>F().gm&&F().turn==='tb',3000,'prima risposta del GM');await sleep(40);
  eq(F().gm,'Ingrid arretra.','prima dichiarazione del GM');
  assert.deepStrictEqual(acts(),['fairOk=Accetto così','fairSay=Modifico e passo la mano'],'turni successivi: accetta o modifica');
  const r0=F().round;
  await assert.rejects(say('Allungo la mano verso i capelli di Ingrid.'),/Non hai cambiato nulla/,'modifica senza cambiamenti rifiutata');
  eq(F().round,r0,'nessun giro in più');
  await say('Allungo la mano, con un sorriso che non ammette rifiuti.');
  await until(()=>calls().length===2&&F().turn==='tb',3000,'il GM rilegge');
  assert.ok(calls()[1].prompt.indexOf('È di nuovo il tuo turno')>=0&&calls()[1].prompt.indexOf('con un sorriso che non ammette rifiuti')>=0,'il GM riceve la nuova dichiarazione');
  eq(F().gm,'Ingrid arretra e chiama Hrafn.','il GM aggiorna la sua');
  await say('Allungo la mano e fisso Hrafn.');
  await until(()=>T.G.conflict.stage==='roll',3000,'il GM accetta');
  eq(calls().length,3,'tre chiamate al GM');
  console.log('1 OK: la modifica fa rispondere il GM, che poi accetta');

  // 2) GM IA ostinato: dopo tre giri a testa accetta senza chiamare il modello
  await T.A.roll(1);await until(()=>T.G.step!=='conflict',3000,'fine conflitto');
  if(T.G.step==='rel_offer')await T.A.relSkip();
  await until(()=>T.G.step==='scene_play',3000,'scena');
  mode='stubborn';const c0=calls().length;
  await T.A.declare('tb',{type:'social',pace:1,goal:'Hrafn tace'});
  await until(()=>T.G.conflict&&T.G.conflict.stage==='fair',3000,'fair 2');
  for(let i=1;i<=4;i++){
   await say('Versione '+i);
   if(i<4)await until(()=>F().turn==='tb'&&calls().length===c0+i,3000,'risposta '+i);
  }
  await until(()=>T.G.conflict.stage==='roll',3000,'limite dei giri');
  eq(calls().length-c0,3,'al quarto giro niente chiamata: accetta');
  console.log('2 OK: limite di tre giri per l’IA');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
