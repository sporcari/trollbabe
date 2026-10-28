const {makeStore,makeClient,sleep}=require('./harness');
const {tbBot,gmBot,runUntil}=require('./bots');
const assert=require('assert');

async function once(seed){
  const store=makeStore();
  const A=makeClient(store,'uGM',{});
  const B=makeClient(store,'uTB',{});
  await sleep(120);
  const TA=A.__TB,TB=B.__TB;
  // A crea come GM, altro posto umano
  TA.D.n_name='Marta';TA.D.n_role='gm';TA.D.n_other='human';
  await TA.ACT.newGame();
  await sleep(60);
  const code=TA.G.code;
  assert.strictEqual(TA.G.step,'lobby');
  assert.ok(A.document.querySelector('.lobby .code').textContent===code,'codice non mostrato in lobby');
  // un terzo giocatore non può entrare dopo che B è dentro; B entra
  TB.D.j_code=code.toLowerCase();TB.D.j_name='Giulia';
  await TB.ACT.joinGame();
  await sleep(100);
  assert.strictEqual(TA.G.step,'tb_create','A non ha visto il cambio di stato');
  assert.strictEqual(TA.G.seats.tb.name,'Giulia');
  assert.strictEqual(TA.ROLE,'gm');assert.strictEqual(TB.ROLE,'tb');
  // C prova a entrare: al completo
  const C=makeClient(store,'uC',{});await sleep(100);
  C.__TB.D.j_code=code;C.__TB.D.j_name='Terzo';
  const before=C.document.querySelector('#toast').textContent;
  await C.__TB.ACT.joinGame().catch(()=>{});
  // runAct cattura l'errore e mostra il toast: invoco direttamente per leggere l'eccezione
  let err=null;try{await C.__TB.ACT.joinGame();}catch(e){err=e;}
  assert.ok(String(err).indexOf('completo')>=0,'il terzo giocatore doveva essere respinto: '+err);

  const bt={declare:true,type:seed%2?'magic':'fighting',pace:seed%3===0?3:2,relName:'Hrenk',alwaysCont:seed%2===0,die:seed%2===0};
  const bg={gmDeclare:true,endAt:2};
  const ok=await runUntil(()=>TA.G.adv>=2&&TA.G.step==='scene_play'&&TB.G.adv>=2,[[B,tbBot,bt],[A,gmBot,bg]],30000,'S2');
  await sleep(150);
  const G=TA.G;
  console.log('seed',seed,'ok',ok,'adv',G.adv,'step',G.step,'rels',G.rels.map(r=>r.name+':'+r.type+':'+(r.dead?'morto':r.status)).join(','),'num',G.pc.number,'scale',G.scale,'log',TA.LOG.length,'LOGB',TB.LOG.length,'seqA',TA.G.seq,'seqB',TB.G.seq);
  assert.ok(ok,'bloccato: step='+G.step+' stage='+(G.conflict&&G.conflict.stage)+' turn='+G.turn);
  assert.strictEqual(TA.G.seq,TB.G.seq,'client desincronizzati');
  assert.strictEqual(TA.LOG.length,TB.LOG.length);
  // la prep del GM è nel suo spazio privato e non nel documento condiviso
  assert.ok(JSON.stringify(G).indexOf('Orm — vuole')<0,'prep nel documento pubblico');
  assert.ok(TA.PRIV&&TA.PRIV.stakes==='Oskel'||G.adv>=2);
  assert.ok(!TB.PRIV||!TB.PRIV.stakes,'la trollbabe vede la prep del GM!');
  // la trollbabe non vede la scheda segreta nel DOM
  assert.ok(B.document.querySelector('#side-body').textContent.indexOf('Preparazione segreta')<0);
}
(async()=>{
  for(const s of [1,2,3,4,5,6,7,8]){await once(s);}
  console.log('S2 (due umani) OK');process.exit(0);
})().catch(e=>{console.error('FAIL',e.message||e);process.exit(1);});
