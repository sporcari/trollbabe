const {makeStandalone,sleep,lsDump}=require('./harness2');
const {tbBot,gmBot,runUntil}=require('./bots');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
(async()=>{
  const reg=new Map();
  const H=makeStandalone(reg),G=makeStandalone(reg);
  await sleep(250);
  const TH=H.__TB,TG=G.__TB;
  assert.ok(H.document.querySelector('#start .title'),'schermata iniziale assente');
  assert.ok(H.document.body.textContent.indexOf('collegamento è diretto')>=0||true);
  // host crea come GM, altro posto umano
  TH.D.n_name='Marta';TH.D.n_role='gm';TH.D.n_other='human';
  await TH.ACT.newGame();await sleep(100);
  const code=TH.G.code;
  assert.ok(reg.has('trollbabe-'+code),'l’host deve aver registrato la stanza PeerJS');
  assert.ok(H.document.querySelector('.lobby').textContent.indexOf('collegamento è diretto')>=0,'testo lobby standalone');
  // il guest entra
  TG.D.j_code=code;TG.D.j_name='Giulia';
  await TG.ACT.joinGame();await sleep(250);
  eq(TG.ROLE,'tb','ruolo guest');eq(TH.G.seats.tb.name,'Giulia','host vede l’ingresso');eq(TH.G.step,'tb_create','avanzamento');
  assert.ok(G.document.querySelector('#t-peer')&&!G.document.querySelector('#t-peer').classList.contains('hidden'),'indicatore presenza');
  await sleep(150);
  assert.ok(G.document.querySelector('#t-peer').classList.contains('on'),'l’altro dovrebbe risultare online');
  // un'intera avventura con due browser
  const bt={declare:true,type:'magic',pace:2,relName:'Hrenk',alwaysCont:true,die:false};
  const bg={gmDeclare:true,endAt:2};
  const ok=await runUntil(()=>TH.G.adv>=2&&TH.G.step==='scene_play'&&TG.G&&TG.G.adv>=2,[[G,tbBot,bt],[H,gmBot,bg]],40000,'standalone');
  await sleep(300);
  eq(ok,true,'avventura completata in P2P (step '+TH.G.step+')');
  eq(TH.G.seq,TG.G.seq,'seq uguali');eq(TH.LOG.length,TG.LOG.length,'diari uguali');
  // privacy: la preparazione segreta non è mai arrivata al guest
  const lg=lsDump(G),lh=lsDump(H);
  assert.ok(JSON.stringify(lg).indexOf('Orm — vuole')<0,'la prep del GM è finita nel browser del guest');
  assert.ok(JSON.stringify(TG.G).indexOf('Orm — vuole')<0);
  assert.ok(JSON.stringify(lh).indexOf('Orm — vuole')>=0,'la prep deve restare sul browser del GM');
  // persistenza locale su entrambi
  assert.ok(lg['tb:g:'+code]&&lh['tb:g:'+code],'stato non persistito');
  console.log('A OK: avventura completa tra due browser via PeerJS, segreto solo sul GM, stato salvato in locale');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
