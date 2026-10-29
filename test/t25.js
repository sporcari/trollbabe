// Scala reale degli Stakes: se dagli esiti dipende un gruppo più grande dello Scale, la preparazione dell’IA non si salva.
const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
const until=async(f,ms,m)=>{const t=Date.now()+(ms||3000);while(Date.now()<t){if(f())return;await sleep(20);}throw new Error('timeout: '+m);};
(async()=>{
  const prep=sc=>({where:'w',who:'h',stakes:'Il bambino dell’oste',a:'vive',b:'muore e il drago risorge',who_bears:{a:'il bambino',b:'tutto il villaggio',scale:sc},characters:[{name:'Orm',want:'x'}],notes:''});
  const ai={gm_prep:n=>n===1?prep(4):prep(1),scene_open:()=>({text:'La locanda.',npcs:[],heal:false}),gm_respond:()=>({text:'ok'})};
  const w=makeClient(makeStore(),'uA',{ai});await sleep(120);const T=w.__TB;
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(60);
  await T.A.createPC({name:'Retta',number:7,magic:'troll',fight:'missile',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'});await T.go();
  // Scale 1, ma l’esito B coinvolge il villaggio (Scale 4): niente salvataggio, banner con il motivo
  await until(()=>T.AI.err,3000,'errore di Scale');
  eq(T.G.step,'gm_prep','la preparazione non è stata salvata');
  assert.ok(!T.PRIV,'niente preparazione privata');
  assert.ok(T.AI.err.indexOf('Villaggio invece di Persona')>=0,'il banner spiega lo Scale: '+T.AI.err);
  assert.ok(w.__calls[0].prompt.indexOf('la posta vera è quel gruppo')>=0,'la regola è nel prompt');
  assert.ok(w.__calls[0].prompt.indexOf('"who_bears"')>=0,'lo schema chiede chi subisce gli esiti');
  // «Riprova»: la seconda preparazione resta alla Persona e passa
  await T.ACT.aiRetry();
  await until(()=>T.G.step==='scene_play',3000,'preparazione salvata');
  eq(T.PRIV.stakes,'Il bambino dell’oste','Stakes salvati');
  console.log('OK: Stakes oltre lo Scale respinti, Riprova, poi preparazione salvata');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
