const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
(async()=>{
  const store=makeStore();
  const A=makeClient(store,'uGM',{noSample:true}),B=makeClient(store,'uTB',{noSample:true});
  await sleep(120);const TA=A.__TB,TB=B.__TB;
  TA.D.n_name='M';TA.D.n_role='gm';TA.D.n_other='human';await TA.ACT.newGame();await sleep(60);
  TB.D.j_code=TA.G.code;TB.D.j_name='T';await TB.ACT.joinGame();await sleep(100);
  const S=()=>sleep(120);
  await TB.A.createPC({name:'Retta',number:6,magic:'troll',fight:'melee',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'});await TB.go();await S();
  await TA.A.savePrep({stakes:'S',a:'A',b:'B',chars:'',where:'',who:'',notes:''});await S();
  await TA.A.openScene('Scena',['Eirik'],false);await S();
  await TB.A.declare('tb',{type:'fighting',pace:1,goal:'g'});await S();await TA.A.paceAdj('keep');await S();
  await TB.A.fairSay('tb','b');await S();await TA.A.fairSay('gm','a');await S();await TB.A.fairOk('tb');await S();await S();
  await TB.A.roll(1);await S();await TA.A.narrGM('ok');await S();
  await TB.A.relPropose({name:'Eirik',type:'ally',text:'Gli porge acqua.'});await S();
  assert.strictEqual(TA.G.step,'rel_approve');
  await TA.A.relApprove(false);await sleep(250);
  // banner per la trollbabe, non per il GM
  const dock=B.document.querySelector('#dock-body');
  assert.ok(dock.querySelector('.verdict.veto'),'manca il banner del veto');
  assert.ok(dock.textContent.indexOf('Veto del GM')>=0&&dock.textContent.indexOf('Eirik')>=0&&dock.textContent.indexOf('riprovare')>=0);
  assert.ok(!A.document.querySelector('#dock-body .verdict'),'il GM non deve vedere il banner');
  assert.ok(B.document.querySelector('#log .e.verdict.veto'),'manca il riquadro nel diario');
  assert.ok(B.document.querySelector('#toast').classList.contains('on')&&B.document.querySelector('#toast').textContent.indexOf('Veto')>=0,'manca l’avviso');
  // "Ho capito" lo chiude e non torna al ridisegno
  await TB.ACT.relSeen();await S();
  assert.ok(!B.document.querySelector('#dock-body .verdict'),'il banner doveva sparire');
  await TB.A.say('tb','x');await S();
  assert.ok(!B.document.querySelector('#dock-body .verdict'),'il banner non deve tornare');
  // riaprire la partita non ripropone un esito vecchio
  TB.showStart();await sleep(50);TB.openGame(TA.G.code);await sleep(250);
  assert.ok(!B.document.querySelector('#dock-body .verdict'),'banner vecchio ripropone dopo la riapertura');
  console.log('OK: veto evidente (riquadro nel diario, banner, avviso), chiudibile, non ricompare');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
