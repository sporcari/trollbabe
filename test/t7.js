const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
(async()=>{
  const store=makeStore();
  const A=makeClient(store,'uGM',{noSample:true}),B=makeClient(store,'uTB',{noSample:true});
  await sleep(120);const TA=A.__TB,TB=B.__TB;
  TA.D.n_name='M';TA.D.n_role='gm';TA.D.n_other='human';await TA.ACT.newGame();await sleep(40);
  TB.D.j_code=TA.G.code;TB.D.j_name='T';await TB.ACT.joinGame();await sleep(80);
  await TB.A.createPC({name:'Retta',number:6,magic:'troll',fight:'melee',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'},4);await sleep(60);
  await TA.A.savePrep({stakes:'S',a:'A',b:'B',chars:'',where:'',who:'',notes:''});await sleep(60);
  await TA.A.openScene('Scena',[],false);await sleep(80);
  eq(TB.G.step,'scene_play','B vede la scena');
  // 1) messaggi simultanei: entrambi devono comparire nel diario
  await Promise.all([TA.A.say('gm','GM parla insieme'),TB.A.say('tb','TB parla insieme')]);
  await sleep(150);
  const texts=TA.LOG.map(e=>e.text);
  assert.ok(texts.includes('GM parla insieme')&&texts.includes('TB parla insieme'),'un messaggio simultaneo è andato perso: '+JSON.stringify(texts.slice(-4)));
  eq(TA.LOG.length,TB.LOG.length,'diari uguali');
  // il DOM del diario mostra entrambi una sola volta
  const dom=A.document.querySelector('#log').textContent;
  eq((dom.match(/GM parla insieme/g)||[]).length,1,'GM una volta nel DOM');eq((dom.match(/TB parla insieme/g)||[]).length,1,'TB una volta nel DOM');
  console.log('1 OK: messaggi simultanei conservati entrambi');
  // 2) nota fuori gioco simultanea a un cambio di stato: lo stato non si perde
  await Promise.all([TA.A.ooc('gm','nota fuori gioco'),TB.A.declare('tb',{type:'fighting',pace:1,goal:'g'})]);
  await sleep(150);
  eq(TA.G.step,'conflict','il conflitto non deve essere cancellato dalla nota');eq(TB.G.step,'conflict','B');
  assert.ok(TA.LOG.some(e=>e.type==='ooc'&&e.text==='nota fuori gioco'),'nota assente');
  const ids=TA.LOG.map(e=>e._id);assert.deepStrictEqual([...ids],[...ids].sort(),'diario non ordinato per id');
  console.log('2 OK: la nota fuori gioco non cancella lo stato');
  await TA.A.paceAdj('keep');await sleep(100);
  // 3) Fair and clear: pubblicazioni simultanee
  await Promise.all([TA.A.fairSay('gm','azione GM'),TB.A.fairSay('tb','azione TB')]);
  await sleep(200);
  eq(TA.G.conflict.fair.gm,'azione GM','testo GM conservato');eq(TA.G.conflict.fair.tb,'azione TB','testo TB conservato');
  // 4) conferme simultanee: il conflitto deve partire comunque (assestamento)
  await Promise.all([TA.A.fairOk('gm'),TB.A.fairOk('tb')]);
  await sleep(500);
  eq(TA.G.conflict.stage,'roll','il conflitto deve partire anche con conferme simultanee (stage='+TA.G.conflict.stage+' gmOk='+TA.G.conflict.fair.gmOk+' tbOk='+TA.G.conflict.fair.tbOk+')');
  eq(TB.G.conflict.stage,'roll','B');
  const headers=TA.LOG.filter(e=>e.type==='conflict').length;eq(headers,1,'una sola intestazione di conflitto');
  console.log('3/4 OK: Fair and clear con scritture e conferme simultanee');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
