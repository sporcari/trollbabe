const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
(async()=>{
  const store=makeStore();
  let n=0;
  const w=makeClient(store,'uGM',{ai:{gm_prep:()=>({where:'Un fiordo',who:'Pescatori e un troll',stakes:'La barca di Unn',a:'Si salva',b:'Affonda',characters:[{name:'Unn',want:'partire'},{name:'Gunnar',want:'trattenerla'}],notes:'n'+(++n)})}});
  const w2=makeClient(store,'uTB',{noSample:true});
  await sleep(120);const T=w.__TB;
  T.D.n_name='M';T.D.n_role='gm';T.D.n_other='human';await T.ACT.newGame();await sleep(40);
  w2.__TB.D.j_code=T.G.code;w2.__TB.D.j_name='T';await w2.__TB.ACT.joinGame();await sleep(80);
  await w2.__TB.A.createPC({name:'Retta',number:6,magic:'troll',fight:'melee',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'},4);await sleep(150);
  assert.ok(w.document.querySelector('[data-act="genPrep"]'),'manca il pulsante Genera');
  T.D.gp_idea='una faida tra pescatori';
  await T.ACT.genPrep();
  assert.strictEqual(T.D.gp_stakes,'La barca di Unn');assert.ok(T.D.gp_chars.indexOf('Unn — partire')>=0);
  assert.ok(w.document.querySelector('#f-gp_stakes').value==='La barca di Unn','il campo del modulo non è stato compilato');
  assert.ok(w.__calls[0].prompt.indexOf('una faida tra pescatori')>=0,'idea non passata');
  // la trollbabe non vede nulla
  assert.ok(JSON.stringify(w2.__TB.G).indexOf('barca')<0,'segreto nel documento pubblico');
  await T.ACT.savePrep();await sleep(100);
  assert.strictEqual(T.G.step,'scene_open');
  // seconda avventura con GM IA: il prompt di prep non deve contenere la prep precedente
  console.log('OK: generazione per il GM umano');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
