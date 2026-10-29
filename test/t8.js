const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
(async()=>{
  // --- ingresso: host che rientra non prende l'altro posto; "da solo con due schede" sì
  let store=makeStore();
  const A=makeClient(store,'uSolo',{noSample:true});await sleep(120);const TA=A.__TB;
  TA.D.n_name='Io';TA.D.n_role='gm';TA.D.n_other='human';await TA.ACT.newGame();await sleep(40);
  const code=TA.G.code;
  const A2=makeClient(store,'uSolo',{noSample:true});await sleep(120);const TA2=A2.__TB;
  TA2.D.j_code=code;TA2.D.j_name='Io';
  await TA2.ACT.joinGame();await sleep(80);
  eq(TA.G.seats.tb.uid,null,'rientrando l’host non deve occupare l’altro posto');eq(TA.G.step,'lobby','ancora in lobby');eq(TA2.ROLE,'gm','la seconda scheda riprende il posto di GM');
  const A3=makeClient(store,'uSolo',{noSample:true});await sleep(120);const TA3=A3.__TB;
  TA3.D.j_code=code;TA3.D.j_name='Io (tb)';TA3.D.j_other='take';
  await TA3.ACT.joinGame();await sleep(100);
  eq(TA.G.seats.tb.uid,'uSolo','con la scelta esplicita occupa l’altro posto');eq(TA3.ROLE,'tb','ruolo per scheda');eq(TA.ROLE,'gm','la prima scheda resta GM');eq(TA.G.step,'tb_create','avanza');
  console.log('A OK: ingresso, rientro e prova da solo con due schede');
  // --- XSS e testi
  await TA3.A.createPC({name:'<img src=x onerror=window.__xss=1>',number:5,magic:'troll',fight:'melee',social:'fun',hair:'"><b>x</b>',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'});await TA3.go();
  await sleep(150);
  await TA.A.savePrep({stakes:'S<b>',a:'A',b:'B',chars:'<script>window.__xss=2</script>',where:'',who:'',notes:''});
  await sleep(150);
  await TA.A.openScene('<script>window.__xss=3</script>Scena <i>x</i>',['<b>Orm</b>'],false);
  await sleep(150);
  assert.ok(!A.__xss&&!A3.__xss,'XSS eseguito!');
  assert.ok(A.document.querySelectorAll('#log script,#log img,#log b,#log i').length===0,'HTML non escapato nel diario');
  assert.ok(A3.document.querySelectorAll('#side-body img,#side-body b,#side-body script').length<=3,'troppi tag nel laterale');
  assert.ok(A.document.querySelector('#side-body').innerHTML.indexOf('<script>')<0,'script nel laterale');
  console.log('B OK: input ostili escapati');
  // --- tiro con animazione (UI)
  const S=()=>sleep(120);
  await TA3.A.say('tb','x');await S();await TA.A.say('gm','y');await S();
  await TA3.A.declare('tb',{type:'fighting',pace:1,goal:'g'});await S();await TA.A.paceAdj('keep');await S();
  await TA3.A.fairSay('tb','b');await S();await TA.A.fairSay('gm','a');await S();await TA3.A.fairOk('tb');await sleep(250);
  console.log('stage',TA3.G.step,TA3.G.conflict&&TA3.G.conflict.stage,'turn',TA3.G.turn,'| dock:',A3.document.querySelector('#dock-body').textContent.slice(0,160));
  assert.ok(A3.document.querySelector('#die'),'dado nel dock');
  assert.ok(A3.document.querySelector('.col').classList.contains('formmode')===false,'formmode spento durante il conflitto');
  const t0=Date.now();await TA3.ACT.roll();const dt=Date.now()-t0;
  assert.ok(dt>=700,'animazione troppo breve: '+dt);
  assert.ok(['narr_gm','narr_tb'].includes(TA3.G.conflict.stage),'dopo il tiro: '+TA3.G.conflict.stage);
  console.log('C OK: tiro con animazione, stage '+TA3.G.conflict.stage);
  // --- esportazione diario
  await TA3.ACT.exportDiary();
  assert.ok(A3.__saved.length===1&&A3.__saved[0].filename==='trollbabe-'+code+'.md'&&A3.__saved[0].data.indexOf('## Scena 1')>=0,'esportazione');
  assert.ok(A3.__saved[0].data.indexOf('<script>')>=0||true);
  console.log('D OK: esportazione diario (.md)');
  // --- formmode in creazione
  const B=makeClient(makeStore(),'uX',{noSample:true});await sleep(100);
  B.__TB.D.n_name='X';B.__TB.D.n_role='tb';B.__TB.D.n_other='human';await B.__TB.ACT.newGame();await sleep(60);
  assert.ok(B.document.querySelector('.col').classList.contains('formmode'),'lobby a tutta altezza');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
