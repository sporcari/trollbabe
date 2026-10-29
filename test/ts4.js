const {makeStandalone,sleep}=require('./harness2');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
(async()=>{
  const reg=new Map();
  const H=makeStandalone(reg),G=makeStandalone(reg),I=makeStandalone(reg);await sleep(250);
  const TH=H.__TB,TG=G.__TB;
  TH.D.n_name='Marta';TH.D.n_role='gm';TH.D.n_other='human';await TH.ACT.newGame();await sleep(100);
  const code=TH.G.code;
  // un intruso si collega PRIMA che il secondo posto sia occupato: può entrare (il posto è libero), ma poi è un guest legittimo
  TG.D.j_code=code;TG.D.j_name='Giulia';await TG.ACT.joinGame();await sleep(300);
  eq(TG.ROLE,'tb','guest legittimo seduto');
  // ora i due posti sono occupati: un intruso con il codice si collega a mano e prova a farsi mandare il diario
  const got=[];
  const peer=new I.Peer();
  await new Promise(r=>peer.on('open',r));
  const c=peer.connect('trollbabe-'+code,{reliable:true});
  c.on('data',d=>got.push(d));
  let closed=false;c.on('close',()=>{closed=true;});
  await new Promise(r=>c.on('open',r));
  c.send({t:'sync',code:code,uid:'c_intruso',docs:{}});
  await sleep(200);
  eq(got.length,0,'l’intruso non deve ricevere nulla');
  assert.ok(closed,'la connessione dell’intruso deve essere chiusa');
  // l'intruso prova anche a scrivere senza presentarsi
  const c2=peer.connect('trollbabe-'+code,{reliable:true});
  await new Promise(r=>c2.on('open',r));
  c2.send({t:'w',op:'update',path:'games/'+code,data:{step:'ending'}});
  await sleep(200);
  assert.notStrictEqual(TH.G.step,'ending','una scrittura non verificata non deve essere applicata');
  // il guest legittimo non è stato scalzato
  await TG.A.createPC({name:'Retta',number:6,magic:'troll',fight:'melee',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'});await TG.go();
  await sleep(250);
  eq(TH.G.pc&&TH.G.pc.name,'Retta','il guest legittimo continua a scrivere');
  assert.ok(G.document.querySelector('#t-peer').classList.contains('on'),'presenza del guest ok');
  // chi ha un posto, con l'identificativo giusto, può ricollegarsi
  const uidGuest=G.localStorage.getItem('tb:cid');
  const peer3=new I.Peer();await new Promise(r=>peer3.on('open',r));
  const c3=peer3.connect('trollbabe-'+code,{reliable:true});const got3=[];c3.on('data',d=>got3.push(d));
  await new Promise(r=>c3.on('open',r));
  c3.send({t:'sync',code:code,uid:uidGuest,docs:{}});
  await sleep(200);
  assert.ok(got3.some(d=>d.t==='sync'),'chi si presenta con l’identificativo di un posto riceve lo stato');
  console.log('OK: intruso con il codice → nessun dato, connessione chiusa, scritture ignorate; il guest vero non è scalzato');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
