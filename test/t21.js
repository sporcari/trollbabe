// Eccezioni del GM IA: si aprono in chat, fermano il gioco e si chiudono con una rettifica o con il ritiro.
const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
const until=async(f,ms,m)=>{const t=Date.now()+(ms||3000);while(Date.now()<t){if(f())return;await sleep(20);}throw new Error('timeout: '+m);};
(async()=>{
  const ai={
   gm_prep:()=>({where:'w',who:'h',stakes:'Il troll',a:'vive',b:'muore',characters:[{name:'Harald',want:'x'}],notes:''}),
   scene_open:()=>({text:'Riva del fiume. Harald affila l’ascia.',npcs:['Harald'],heal:false}),
   gm_respond:n=>n===1?{text:'',objection:'Hrenk non è mai stato nominato: è un personaggio nuovo (niente informazioni nuove).'}
                 :n===3?{text:'',objection:'Ylva non esiste ancora nella storia.'}:{text:'Harald ti osserva.'},
   table_talk:()=>({text:'Hai ragione, l’avevamo detto: ritiro l’eccezione.',withdraw:true}),
   fair_gm:()=>({text:'Harald carica con l’ascia.'}),
   step_gm:()=>({text:'Harald ritenta.'}),
   review:n=>n===1?{objection:'Nel fallimento il troll finisce comunque al sicuro: il Goal avanza.'}:{objection:null},
   narr_gm:()=>({text:'Un passo avanti.'})
  };
  const w=makeClient(makeStore(),'uA',{ai});await sleep(120);const T=w.__TB;
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(60);
  await T.A.createPC({name:'Kreshk',number:4,magic:'troll',fight:'unarmed',social:'feisty',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'});await T.go();
  await until(()=>T.G.step==='scene_play',3000,'scena aperta');
  const doc=w.document,dock=()=>doc.querySelector('#dock-body').textContent,calls=t=>w.__calls.filter(c=>c.task===t);
  const fix=async(t)=>{doc.querySelector('#dock-body [data-act="amendOpen"]').click();await sleep(30);T.D.am_text=t;await T.ACT.amendSave();};

  // 1) eccezione su una mossa in scena: il gioco si ferma, la rettifica la chiude
  await T.A.say('tb','Chiamo Hrenk, mio cugino, con dieci guerrieri.');
  await until(()=>T.G.objection,3000,'eccezione');await sleep(60);
  const said=T.LOG.filter(e=>e.type==='tb').pop();
  eq(T.G.objection.of,said._id,'eccezione sulla mossa');
  assert.ok(T.LOG.some(e=>e.type==='ooc'&&e.meta&&e.meta.objection),'eccezione nella chat');
  assert.ok(!T.LOG.some(e=>e.type==='gm'),'nessuna mossa del GM');
  assert.ok(dock().indexOf('Il GM ha un’eccezione')>=0,'riquadro dell’eccezione');
  await sleep(150);eq(calls('gm_respond').length,1,'il GM resta fermo');
  await fix('Mi guardo attorno, sola.');
  await until(()=>!T.G.objection&&calls('gm_respond').length===2,3000,'rettifica e ripresa');
  assert.ok(calls('gm_respond')[1].prompt.indexOf('Mi guardo attorno, sola.')>=0&&calls('gm_respond')[1].prompt.indexOf('dieci guerrieri')<0,'il GM legge la rettifica');
  console.log('1 OK: eccezione in scena chiusa dalla rettifica');

  // 2) eccezione ritirata dopo una spiegazione in chat
  await until(()=>T.G.turn==='tb',3000,'turno');
  await T.A.say('tb','Parlo con mia sorella Ylva.');
  await until(()=>T.G.objection,3000,'seconda eccezione');
  T.D.chat='Ylva l’abbiamo stabilita al tavolo prima di cominciare.';await T.ACT.chatSend();
  await until(()=>!T.G.objection,3000,'ritiro');
  await until(()=>calls('gm_respond').length===4,3000,'il gioco riprende');
  assert.ok(calls('table_talk')[0].prompt.indexOf('eccezione aperta')>=0,'il GM sa dell’eccezione aperta');
  console.log('2 OK: eccezione ritirata in chat');

  // 3) nel conflitto: il GM legge la narrazione del fallimento prima di andare avanti
  await until(()=>T.G.turn==='tb',3000,'turno 2');
  await T.A.declare('tb',{type:'fighting',pace:2,goal:'Porto il troll in salvo'});
  await until(()=>T.G.conflict&&T.G.conflict.stage==='fair',3000,'fair');
  T.D.fr_text='Mi metto tra Harald e il troll.';await T.ACT.fairSay();
  await until(()=>T.G.conflict.fair.turn==='tb'&&T.G.conflict.fair.gm,3000,'fair GM');
  assert.ok(calls('fair_gm')[0].prompt.indexOf('"objection"')>=0,'il GM può eccepire anche nel Fair and clear');
  await T.ACT.fairOk();
  await until(()=>T.G.conflict.stage==='roll',3000,'roll');
  await T.A.roll(9);await until(()=>T.G.conflict.stage==='narr_tb',3000,'narr_tb');
  await T.A.narrTB('Scivolo nel fango, ma intanto il troll è già al sicuro oltre il guado.',null);
  await until(()=>T.G.objection,3000,'eccezione dalla lettura');
  assert.ok(calls('review')[0].prompt.indexOf('il troll è già al sicuro')>=0,'il GM legge la narrazione');
  await sleep(150);eq(calls('step_gm').length,0,'la Serie successiva aspetta');
  await fix('Scivolo nel fango e il troll resta allo scoperto.');
  await until(()=>!T.G.objection&&T.G.conflict.step&&T.G.conflict.step.gm!==null,3000,'il passo riprende');
  // 4) narrazione regolare: nessuna eccezione
  await T.A.stepSay('tb','Gli strappo l’ascia di mano.');
  await until(()=>!T.G.review,3000,'seconda lettura');
  assert.ok(!T.G.objection,'nessuna eccezione su una frase regolare');
  eq(await T.A.roll(1),true,'ora si tira');
  console.log('3/4 OK: lettura del GM nel conflitto, eccezione e via libera');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
