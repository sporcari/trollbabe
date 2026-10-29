// Relationship: un nome che contiene un PNG con nome passa dal GM; la rinomina vale ovunque.
const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
(async()=>{
  const store=makeStore();
  const w=makeClient(store,'uGM',{noSample:true}),w2=makeClient(store,'uTB',{noSample:true});
  await sleep(120);const T=w.__TB,T2=w2.__TB;
  T.D.n_name='M';T.D.n_role='gm';T.D.n_other='human';await T.ACT.newGame();await sleep(30);
  T2.D.j_code=T.G.code;T2.D.j_name='T';await T2.ACT.joinGame();await sleep(80);
  await T.A.createPC({name:'Mirna',number:4,magic:'troll',fight:'melee',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'});await T.go();
  await T.A.savePrep({stakes:'S',a:'A',b:'B',chars:'',where:'',who:'',notes:''});
  await T.A.openScene('Il lago.',['Torvald'],false);
  const win=async()=>{
   await T.A.declare('tb',{type:'social',pace:1,goal:'x'});await T.A.paceAdj('keep');
   await T.A.fairSay('tb','b');await T.A.fairSay('gm','a');await T.A.fairOk('tb');
   await T.A.roll(1);await T.A.narrGM('ok');eq(T.G.step,'rel_offer','conflitto vinto');
  };
  // 1) veto: «Lo spettro di Torvald» contiene un PNG con nome
  await win();
  await T.A.relPropose({name:'Lo spettro di Torvald',type:'ally',text:'Gli dona pace.'});
  eq(T.G.step,'rel_approve','il nome che contiene «Torvald» passa dal GM');
  await T.A.relApprove(true);
  eq(T.namedIn(T.G,'Torvaldsen'),false,'solo parole intere');
  // un anonimo non passa dal GM
  await win();
  await T.A.relPropose({name:'Il pescatore che mi ha riconosciuta',type:'lover',text:'Beviamo insieme.'});
  eq(T.G.step,'scene_play','anonimo: niente veto');
  console.log('1 OK: veto per i nomi che contengono un PNG con nome');

  // 2) rinomina dall’interfaccia della trollbabe
  await sleep(150);
  const fish=T2.G.rels.find(r=>r.type==='lover');
  T2.ui.tab='sheet';T2.render();await sleep(40);
  const b=w2.document.querySelector('#side-body [data-act="relRenameOpen"][data-id="'+fish.id+'"]');
  assert.ok(b,'pulsante «Rinomina» nella scheda');
  assert.ok(!w.document.querySelector('#side-body [data-act="relRenameOpen"]'),'il GM non rinomina');
  b.click();await sleep(30);
  T2.D.rn_name='Mark';await T2.ACT.relRenameSave();await sleep(150);
  const r=T.G.rels.find(x=>x.id===fish.id);
  eq(r.name,'Mark','nuovo nome');eq(r.note,'Il pescatore che mi ha riconosciuta','la descrizione resta come nota');
  assert.ok(T.G.npcs.some(n=>n.name==='Mark'),'Mark diventa un PNG con nome');
  assert.ok(T.availableItems(T.G).some(i=>i.label==='Mark (amante)'),'roll-again con il nuovo nome');
  assert.ok(w2.document.querySelector('#side-body').textContent.indexOf('Mark')>=0,'scheda aggiornata');
  assert.ok(T.LOG.some(e=>e.type==='sys'&&e.text.indexOf('ora si chiama Mark')>=0),'riga nel diario');
  assert.ok(T.stateText('gm').indexOf('Mark (amante')>=0,'l’IA vede il nuovo nome');
  // 3) il GM IA può rifiutare un alleato improvviso con nome
  assert.ok(T.TASKS.review().indexOf('alleato improvviso')>=0,'criterio nella lettura del GM');
  console.log('2/3 OK: rinomina ovunque; criterio sull’alleato improvviso con nome');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
