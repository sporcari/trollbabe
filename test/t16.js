// Chat «Al GM»: domande fuori gioco al GM IA e domande di chiarimento del GM, senza mosse di gioco.
const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
const until=async(f,ms,m)=>{const t=Date.now()+(ms||3000);while(Date.now()<t){if(f())return;await sleep(20);}throw new Error('timeout: '+m);};
(async()=>{
  const ai={
   gm_prep:()=>({where:'w',who:'h',stakes:'Le ossa',a:'sepolte',b:'perdute',characters:[{name:'Ingrid',want:'x'}],notes:''}),
   scene_open:()=>({text:'Nebbia sul molo. Ingrid ti guarda.',npcs:['Ingrid'],heal:false}),
   gm_respond:n=>n===1?{text:'',ask:'Lo chiedi a Ingrid o a me come GM?'}:n===2?{text:'Ingrid ha vent’anni.',ask:'Ancora una domanda'}:n===3?{text:'',ask:'Cosa intendi?'}:{text:'Ingrid annuisce.'},
   table_talk:()=>({text:'Hai ragione: sei troppo lontana, la frase della cieca non l’hai sentita.'})
  };
  const w=makeClient(makeStore(),'uA',{ai});await sleep(120);const T=w.__TB;
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(60);
  await T.A.createPC({name:'Mirna',number:4,magic:'troll',fight:'melee',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'},4);
  await until(()=>T.G.step==='scene_play',3000,'scena aperta');
  await sleep(60);
  const calls=t=>w.__calls.filter(c=>c.task===t);
  const doc=w.document;
  assert.ok(!doc.querySelector('#side .tabs [data-tab="chat"]').classList.contains('hidden'),'la scheda «Al GM» deve comparire col GM IA');
  assert.ok(doc.body.classList.contains('chaton'),'pulsanti «?» attivi');

  // 1) domanda fuori gioco su un passaggio: nessuna mossa, risposta nella chat
  const sc=T.LOG.find(e=>e.type==='scene');
  doc.querySelector('#log .q[data-id="'+sc._id+'"]').click();await sleep(30);
  eq(T.ui.tab,'chat','il «?» apre la chat');eq(T.D.chat_re,sc._id,'citazione del passaggio');
  const v0=T.G.seq+':'+T.G.rev;
  T.D.chat='Sono ancora troppo lontana per sentire la cieca';
  await T.ACT.chatSend();
  await until(()=>T.LOG.some(e=>e.type==='ooc'&&e.who==='gm'),3000,'risposta in chat');await sleep(40);
  eq(T.G.seq+':'+T.G.rev,v0,'la chat non deve toccare lo stato condiviso');
  eq(T.G.step,'scene_play','step invariato');eq(T.G.turn||'tb','tb','turno invariato');
  eq(calls('gm_respond').length,0,'nessuna mossa del GM');
  const tt=calls('table_talk')[0].prompt;
  assert.ok(tt.indexOf('Domanda della giocatrice: «Sono ancora troppo lontana per sentire la cieca»')>=0,'la domanda è nelle note');
  assert.ok(tt.indexOf('«Nebbia sul molo. Ingrid ti guarda.»')>=0,'il passaggio citato è nel prompt');
  assert.ok(doc.querySelector('#log').textContent.indexOf('troppo lontana')<0,'la chat non va nel diario di gioco');
  assert.ok(doc.querySelector('#side-body').textContent.indexOf('la frase della cieca')>=0,'la risposta compare nella chat');
  console.log('1 OK: domanda al GM fuori gioco, stato invariato');

  // 2) il GM chiede un chiarimento su una mossa: il gioco si ferma
  await T.A.say('tb','Che età ha Ingrid?');
  await until(()=>T.askOpen(T.G),3000,'domanda del GM');await sleep(60);
  eq(calls('gm_respond').length,1,'una sola chiamata');
  assert.ok(T.LOG.some(e=>e.type==='ooc'&&e.meta&&e.meta.ask&&e.text==='Lo chiedi a Ingrid o a me come GM?'),'domanda nella chat');
  assert.ok(!T.LOG.some(e=>e.type==='gm'),'nessuna risposta in fiction');
  eq(T.nextAIJob(),null,'con la domanda aperta l’IA aspetta');
  assert.ok(doc.querySelector('#dock-body').textContent.indexOf('Il GM ti chiede un chiarimento')>=0,'avviso nel riquadro');
  const p1=calls('gm_respond')[0].prompt;
  assert.ok(p1.indexOf('puoi farle UNA domanda')>=0,'la prima volta può chiedere');
  assert.ok(p1.indexOf('Hai ragione: sei troppo lontana')>=0,'le correzioni della chat valgono nei prompt successivi');
  assert.ok(p1.indexOf('nota fuori gioco della giocatrice: Sono ancora')<0,'la chat non è nel diario del prompt');

  // 3) rispondo nella chat: il GM rifà la mossa, senza seconda domanda
  T.D.chat='Lo chiedo a te come GM';await T.ACT.chatSend();
  await until(()=>T.LOG.some(e=>e.type==='gm'),3000,'mossa del GM dopo la risposta');await sleep(40);
  eq(calls('gm_respond').length,2,'seconda chiamata');eq(calls('table_talk').length,1,'la risposta a una domanda non chiama table_talk');
  const p2=calls('gm_respond')[1].prompt;
  assert.ok(p2.indexOf('Lo chiedo a te come GM')>=0&&p2.indexOf('Hai già chiesto un chiarimento')>=0,'la risposta è nel prompt e non può richiedere');
  eq(T.LOG.filter(e=>e.type==='gm').pop().text,'Ingrid ha vent’anni.','la seconda domanda viene ignorata');
  eq(T.askOpen(T.G),false,'domanda chiusa');
  console.log('2 OK: domanda del GM, risposta in chat, una sola domanda per mossa');

  // 4) «Interpreta tu»
  await T.A.say('tb','Mi avvicino al molo');
  await until(()=>T.askOpen(T.G),3000,'seconda domanda del GM');
  await T.ACT.askSkip();
  await until(()=>T.LOG.filter(e=>e.type==='gm').length===2,3000,'il GM interpreta da solo');
  eq(calls('gm_respond').length,4,'quattro chiamate');
  assert.ok(calls('gm_respond')[3].prompt.indexOf('Hai già chiesto un chiarimento')>=0,'dopo «Interpreta tu» niente altre domande');
  console.log('3 OK: «Interpreta tu» fa procedere il GM');

  // 5) il diario esportato riporta gli scambi fuori gioco
  await T.ACT.exportDiary();
  const md=w.__saved.pop().data;
  assert.ok(md.indexOf('> _Fuori gioco_ · **')>=0&&md.indexOf('Lo chiedi a Ingrid o a me come GM?')>=0,'chat nel diario esportato');
  console.log('4 OK: diario esportato con la chat');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.message||e);process.exit(1);});
