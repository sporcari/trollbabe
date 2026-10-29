// Retcon: una voce «amend» sostituisce la voce corretta nel diario, nell’IA e nell’esportazione; l’originale resta.
const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
const until=async(f,ms,m)=>{const t=Date.now()+(ms||3000);while(Date.now()<t){if(f())return;await sleep(20);}throw new Error('timeout: '+m);};
(async()=>{
  let T=null;
  const scene=()=>T.LOG.find(e=>e.type==='scene'),mine=()=>T.LOG.find(e=>e.type==='tb');
  const ai={
   gm_prep:()=>({who_bears:{a:'x',b:'y',scale:1},where:'w',who:'h',stakes:'Ingrid',a:'vive',b:'muore',characters:[{name:'Hrafn',want:'il clan'}],notes:'Hrafn avvelenò l’offerta.'}),
   scene_open:()=>({text:'Il relitto di Torvald affondò vent’anni fa. Ingrid ti guarda.',npcs:['Ingrid'],heal:false}),
   gm_respond:()=>({text:'Ingrid annuisce.'}),
   table_talk:n=>n===1?{text:'Hai ragione: correggo, Torvald è morto quattro anni fa.',amend:{of:scene().n,text:'Il relitto di Torvald affondò quattro anni fa. Ingrid ti guarda.'}}
                     :{text:'Correggo anche la tua frase.',amend:{of:mine().n,text:'Testo riscritto dal GM'}}
  };
  const w=makeClient(makeStore(),'uA',{ai});await sleep(120);T=w.__TB;
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(60);
  await T.A.createPC({name:'Mirna',number:4,magic:'troll',fight:'unarmed',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'});await T.go();
  await until(()=>T.G.step==='scene_play'&&scene(),3000,'scena aperta');
  const doc=w.document,sc=scene(),art=id=>doc.querySelector('#log article[data-id="'+id+'"]');
  await T.A.say('tb','Chiedo di Hrafn.');
  await until(()=>T.G.turn==='tb'&&mine(),3000,'risposta del GM');

  // 1) retcon del GM dalla chat
  T.D.chat='Se Hrafn aveva cinque anni, come può essere stato lui?';await T.ACT.chatSend();
  await until(()=>T.LOG.some(e=>e.type==='amend'),3000,'retcon');await sleep(60);
  const am=T.LOG.find(e=>e.type==='amend');
  eq(am.meta.of,sc._id,'il retcon punta alla scena');eq(am.who,'gm','autore del retcon');
  eq(T.LOG.find(e=>e._id===sc._id).text,'Il relitto di Torvald affondò vent’anni fa. Ingrid ti guarda.','l’originale resta nel database');
  assert.ok(art(sc._id).querySelector('p').textContent.indexOf('quattro anni fa')>=0,'la scena mostra la versione corretta');
  assert.ok(art(sc._id).querySelector('details.was').textContent.indexOf('vent’anni fa')>=0,'la versione precedente è consultabile');
  assert.ok(doc.querySelector('#log .retcon'),'riga «Retcon» nel diario');
  eq(T.PRIV.notes,'Hrafn avvelenò l’offerta.','il retcon non tocca la preparazione segreta');
  assert.ok(w.__calls.filter(c=>c.task==='table_talk')[0].prompt.indexOf('#'+sc.n+' SCENA')>=0,'nella chat il GM vede le voci numerate');
  // l’IA legge solo la versione corretta
  await T.A.say('tb','Allora chi è stato?');
  await until(()=>w.__calls.filter(c=>c.task==='gm_respond').length===2,3000,'seconda risposta');
  const p=w.__calls.filter(c=>c.task==='gm_respond')[1].prompt;
  assert.ok(p.indexOf('quattro anni fa')>=0&&p.indexOf('vent’anni fa')<0,'il GM legge solo la versione corretta');
  // esportazione
  await T.ACT.exportDiary();
  const md=w.__saved[w.__saved.length-1].data;
  assert.ok(md.indexOf('quattro anni fa. Ingrid ti guarda. _(emendato)_')>=0&&md.indexOf('vent’anni fa')<0,'esportazione con la versione corretta');
  console.log('1 OK: retcon del GM in chat, diario, IA ed esportazione');

  // 2) ognuno emenda solo le proprie voci
  await until(()=>T.G.turn==='tb',3000,'turno');
  const tbE=mine();
  eq(await T.A.amend('tb',sc._id,'Riscritto dalla giocatrice'),false,'la trollbabe non emenda il GM');
  T.D.chat='E la mia frase?';await T.ACT.chatSend();
  await until(()=>T.LOG.filter(e=>e.type==='ooc'&&e.who==='gm').length===2,3000,'seconda risposta in chat');await sleep(60);
  assert.ok(!T.LOG.some(e=>e.type==='amend'&&e.meta.of===tbE._id),'il GM non emenda la trollbabe');
  assert.ok(art(tbE._id).querySelector('[data-act="amendOpen"]'),'«Emenda» sulle proprie voci');
  assert.ok(!art(sc._id).querySelector('[data-act="amendOpen"]'),'niente «Emenda» sulle voci del GM IA');
  // 3) due retcon della stessa voce: vale l’ultimo, dall’interfaccia
  art(tbE._id).querySelector('[data-act="amendOpen"]').click();await sleep(40);
  assert.ok(doc.querySelector('#f-am_text').value==='Chiedo di Hrafn.','il campo parte dal testo attuale');
  T.D.am_text='Chiedo di Hrafn, a bassa voce.';await T.ACT.amendSave();
  T.D.am_text='';await sleep(40);
  eq(await T.A.amend('tb',tbE._id,'Chiedo di Hrafn, guardando il lago.'),true,'secondo retcon');
  await until(()=>T.LOG.filter(e=>e.type==='amend'&&e.meta.of===tbE._id).length===2,3000,'due retcon');await sleep(60);
  eq(art(tbE._id).querySelector('p').textContent,'Chiedo di Hrafn, guardando il lago.','vale l’ultimo');
  assert.ok(art(tbE._id).querySelector('details.was').textContent.indexOf('a bassa voce')>=0,'precedente: il primo retcon');
  console.log('2/3 OK: solo le proprie voci; vale l’ultimo retcon');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
