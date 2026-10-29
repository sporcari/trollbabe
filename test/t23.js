// Presenza degli alleati: valgono come roll-again solo se sono in scena; avversari e amanti sempre.
const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
(async()=>{
  const store=makeStore();
  const w=makeClient(store,'uGM',{noSample:true}),w2=makeClient(store,'uTB',{noSample:true});
  await sleep(120);const T=w.__TB,T2=w2.__TB;
  T.D.n_name='M';T.D.n_role='gm';T.D.n_other='human';await T.ACT.newGame();await sleep(30);
  T2.D.j_code=T.G.code;T2.D.j_name='T';await T2.ACT.joinGame();await sleep(80);
  await T.A.createPC({name:'Retta',number:6,magic:'troll',fight:'melee',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'},4);
  await T.A.savePrep({stakes:'S',a:'A',b:'B',chars:'',where:'',who:'',notes:''});
  await T.A.openScene('Il guado.',[],false);
  const win=async(name,type)=>{
   await T.A.declare('tb',{type:'fighting',pace:1,goal:'x'});await T.A.paceAdj('keep');
   await T.A.fairSay('tb','b');await T.A.fairSay('gm','a');await T.A.fairOk('tb');
   await T.A.roll(1);await T.A.narrGM('ok');await T.A.relPropose({name:name,type:type,text:'x'});
  };
  const ids=()=>T.availableItems(T.G).map(i=>i.label);
  const next=async()=>{await T.A.endScene();await T.A.request('altrove',false);await T.A.openScene('Altrove.',[],false);};
  await win('uno dei guerrieri','ally');await win('una rivale del nord','opp');
  assert.ok(ids().includes('uno dei guerrieri (alleato)'),'appena stretta, l’alleato è in scena');
  // nuova scena: l’alleato resta indietro, l’avversaria no
  await next();
  assert.ok(!ids().includes('uno dei guerrieri (alleato)'),'alleato fuori scena: niente roll-again');
  assert.ok(ids().includes('una rivale del nord (avversario)'),'l’avversaria è sempre disponibile');
  assert.ok(T.stateText('gm').indexOf('uno dei guerrieri (alleato, fuori scena)')>=0,'l’IA sa chi è fuori scena');
  // la trollbabe lo porta in scena dalla scheda
  await sleep(150);T2.ui.tab='sheet';T2.render();await sleep(40);
  const ally=T2.G.rels.find(r=>r.type==='ally');
  w2.document.querySelector('#side-body [data-act="relHereToggle"][data-id="'+ally.id+'"]').click();await sleep(150);
  assert.ok(ids().includes('uno dei guerrieri (alleato)'),'portato in scena');
  // «l’accompagna sempre» resiste al cambio di scena
  w2.document.querySelector('#side-body [data-act="relAlwaysToggle"][data-id="'+ally.id+'"]').click();await sleep(150);
  await next();
  assert.ok(ids().includes('uno dei guerrieri (alleato)'),'compagno fisso: resta disponibile');
  eq(await T.A.relPresence(T.G.rels.find(r=>r.type==='opp').id,{here:false}),false,'la presenza vale solo per gli alleati');
  console.log('OK: presenza degli alleati, avversari sempre disponibili, compagno fisso');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
