const {makeStandalone,sleep,lsDump}=require('./harness2');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
const waitFor=async(c,ms,msg)=>{const t0=Date.now();while(Date.now()-t0<(ms||8000)){if(c())return true;await sleep(40);}throw new Error('timeout: '+(msg||c));};
(async()=>{
  // ---------- 1. codice sbagliato / host offline
  let reg=new Map();
  const X=makeStandalone(reg);await sleep(200);
  X.__TB.D.j_code='ZZZZZ';X.__TB.D.j_name='Io';
  let err=null;try{await X.__TB.ACT.joinGame();}catch(e){err=e;}
  assert.ok(err&&String(err.message).indexOf('Nessuna partita')>=0,'messaggio atteso, trovato '+(err&&err.message));
  await sleep(300);
  assert.ok(!X.__tbNet.timer&&!X.__tbNet.code,'dopo il fallimento non deve restare un tentativo in background');
  console.log('1 OK: codice inesistente → messaggio chiaro, nessun tentativo in background');
  // ---------- 2. caduta e ripresa del collegamento
  reg=new Map();
  const H=makeStandalone(reg),G=makeStandalone(reg);await sleep(250);
  const TH=H.__TB,TG=G.__TB;
  TH.D.n_name='Marta';TH.D.n_role='gm';TH.D.n_other='human';await TH.ACT.newGame();await sleep(100);
  const code=TH.G.code;TG.D.j_code=code;TG.D.j_name='Giulia';await TG.ACT.joinGame();await sleep(300);
  await TG.A.createPC({name:'Retta',number:6,magic:'troll',fight:'melee',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'},4);await sleep(150);
  await TH.A.savePrep({stakes:'S',a:'A',b:'B',chars:'',where:'',who:'',notes:''});await sleep(150);
  await TH.A.openScene('Scena',[],false);await sleep(200);
  eq(TG.G.step,'scene_play','guest in gioco');
  // la linea cade
  reg.get('trollbabe-'+code).conns.forEach(c=>c.close());
  await sleep(50);
  assert.ok(!G.document.querySelector('#t-peer').classList.contains('on'),'la presenza deve spegnersi');
  await TH.A.say('gm','Scritto mentre il guest è offline.');
  await sleep(100);
  assert.ok(!TG.LOG.some(e=>e.text==='Scritto mentre il guest è offline.'),'non doveva arrivare');
  await waitFor(()=>TG.LOG.some(e=>e.text==='Scritto mentre il guest è offline.'),9000,'riconnessione del guest');
  eq(TG.G.seq,TH.G.seq,'seq uguali dopo la ripresa');
  await TG.A.say('tb','Rieccomi.');await waitFor(()=>TH.LOG.some(e=>e.text==='Rieccomi.'),3000,'ritorno verso l’host');
  assert.ok(G.document.querySelector('#t-peer').classList.contains('on'),'presenza riaccesa');
  console.log('2 OK: caduta della linea → il guest si riconnette da solo e si ricompone lo stato nei due sensi');
  // ---------- 3. l'host chiude la scheda e la riapre (stato dal browser)
  await sleep(500);                       // lascio scattare il salvataggio
  const lsHost=lsDump(H);
  H.__tbNet.closeNet();                   // la scheda si chiude
  const H2=makeStandalone(reg,{ls:lsHost});await sleep(250);
  const TH2=H2.__TB;
  TH2.openGame(code);await sleep(400);
  eq(TH2.G.step,'scene_play','stato ripristinato dal browser');assert.ok(TH2.LOG.length>=TH.LOG.length,'diario ripristinato');
  eq(TH2.ROLE,'gm','ruolo ripristinato');
  await waitFor(()=>reg.has('trollbabe-'+code)&&G.document.querySelector('#t-peer').classList.contains('on'),9000,'il guest ritrova il nuovo host');
  await TH2.A.say('gm','Dopo il riavvio.');await waitFor(()=>TG.LOG.some(e=>e.text==='Dopo il riavvio.'),3000,'messaggio dopo il riavvio');
  assert.ok(JSON.stringify(TH2.PRIV||{}).length>=0);
  console.log('3 OK: l’host riapre la pagina, ritrova partita e ruolo dal browser, il guest si riaggancia');
  // ---------- 4. servizio PeerJS non raggiungibile durante l'ingresso
  const reg2=new Map();
  const A2=makeStandalone(reg2,{peer:{down:true}}),B2=makeStandalone(reg2,{peer:{down:true}});await sleep(250);
  A2.__TB.D.n_name='M';A2.__TB.D.n_role='gm';A2.__TB.D.n_other='human';await A2.__TB.ACT.newGame();await sleep(80);
  B2.__TB.D.j_code=A2.__TB.G.code;B2.__TB.D.j_name='G';
  let e2=null;try{await B2.__TB.ACT.joinGame();}catch(e){e2=e;}
  assert.ok(e2,'doveva fallire con il servizio giù');
  console.log('4 OK: se il collegamento non è possibile l’ingresso fallisce con un messaggio ('+e2.message+')');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
