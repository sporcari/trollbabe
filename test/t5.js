const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
let T,w,store;
async function setup(num){
  store=makeStore();w=makeClient(store,'uGM',{noSample:true});const w2=makeClient(store,'uTB',{noSample:true});
  await sleep(120);T=w.__TB;
  T.D.n_name='M';T.D.n_role='gm';T.D.n_other='human';await T.ACT.newGame();await sleep(30);
  w2.__TB.D.j_code=T.G.code;w2.__TB.D.j_name='T';await w2.__TB.ACT.joinGame();await sleep(80);
  await T.A.createPC({name:'Retta',number:num||6,magic:'troll',fight:'melee',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'},4);
  await T.A.savePrep({stakes:'S',a:'A',b:'B',chars:'',where:'',who:'',notes:''});
  await T.A.openScene('Scena',['Orm'],false);
}
async function conflict(pace,type,goal){
  await T.A.declare('tb',{type:type||'fighting',pace:pace,goal:goal||'x'});await T.A.paceAdj('keep');
  await T.A.fairSay('gm','a');await T.A.fairSay('tb','b');await T.A.fairOk('gm');await T.A.fairOk('tb');
}
const C=()=>T.G.conflict;
(async()=>{
  await setup(6);
  // vinco un conflitto e stringo una Relationship anonima
  await conflict(1);await T.A.roll(1);await T.A.narrGM('ok');eq(T.G.step,'rel_offer','a');
  await T.A.relPropose({name:'uno dei guerrieri',type:'ally',text:'Gli stringe il braccio.'});
  eq(T.G.step,'scene_play','anonimo: nessun veto');eq(T.G.rels.length,1,'rel creata');
  // Relationship con PNG con nome: serve l'approvazione
  await T.A.say('gm','Entra Orm.',['Skalgar']);
  eq(T.G.npcs.map(n=>n.name).join(),'Orm,Skalgar','PNG con nome');
  // uso la Relationship come roll-again: fallisco, poi riesco da scomodata
  await conflict(1);await T.A.roll(9);
  const rid=T.G.rels[0].id;
  assert.ok(T.availableItems(T.G).some(i=>i.id==='rel:'+rid),'la Relationship deve essere tra le voci');
  await T.A.narrTB('Il guerriero la affianca.',{item:'rel:'+rid});
  eq(T.G.rels[0].checked,true,'rel spuntata');
  await T.A.roll(1);eq(C().kind,'success','successo col rel');await T.A.narrGM('ok');
  eq(C().stage,'rels','fase costi');
  eq(C().relCosts[0].status,'injured','tabella: successo da scomodata → Relationship ferita');
  await T.A.confirmRels({[rid]:'injured'});
  eq(T.G.rels[0].status,'injured','rel ferita');eq(T.G.step,'rel_offer','dopo i costi');
  console.log('A OK: Relationship come roll-again, costo da tabella, ferita');
  // non è più disponibile in questa avventura
  await T.A.relSkip();
  assert.ok(!T.availableItems(T.G).some(i=>i.id==='rel:'+rid),'rel già usata non disponibile');
  // fallimento con la Relationship: ferita + fallita => ucciso
  await conflict(1);await T.A.roll(9);await T.A.narrTB('x',{item:'carried'});await T.A.roll(9);
  eq(T.G.pc.status,'injured','ferita');
  // sono finite le Relationship usabili; uso la voce 'ally' standard e fallisco
  await T.A.narrTB('x',null);
  console.log('B OK');
  // ---- tabella dei costi (4 righe)
  eq(T.relCost('success','ok'),'injured','t1');eq(T.relCost('success','injured'),'ok','t2');eq(T.relCost('fail','injured'),'killed','t3');eq(T.relCost('fail','incap'),'injured','t4');
  // ---- relazione uccisa
  await setup(6);
  await conflict(1);await T.A.roll(1);await T.A.narrGM('ok');await T.A.relPropose({name:'Hrenk',type:'opp',text:'Lo fissa.'});
  eq(T.G.step,'scene_play','Hrenk è anonimo qui');
  await conflict(1);const r1=T.G.rels[0].id;
  await T.A.roll(9);await T.A.narrTB('x',{item:'rel:'+r1});
  await T.A.roll(9);eq(C().kind,'injury','ferita');await T.A.narrTB('x',null);
  eq(C().stage,'rels','costi');eq(C().relCosts[0].status,'killed','fallita da ferita → Relationship uccisa');
  await T.A.confirmRels({[r1]:'killed'});eq(T.G.rels[0].dead,true,'morta');
  assert.ok(!T.availableItems(T.G).some(i=>i.id.indexOf('rel:')===0),'morta non disponibile');
  console.log('C OK: Relationship uccisa');
  // ---- veto e approvazione per PNG con nome
  await setup(6);
  await T.A.say('gm','Compare Orm.',['Orm']);
  await conflict(1);await T.A.roll(1);await T.A.narrGM('ok');
  await T.A.relPropose({name:'orm',type:'ally',text:'Gli sorride.'});eq(T.G.step,'rel_approve','nome noto (case-insensitive) → decide il GM');
  await T.A.relApprove(false);eq(T.G.rels.length,0,'veto');eq(T.G.step,'scene_play','dopo veto');
  console.log('D OK: veto del GM su PNG con nome');
  // ---- lascio il luogo
  await T.A.leave();eq(T.G.leaving,true,'leaving');
  await T.A.declare('gm',{type:'social',pace:1,goal:''});eq(C().departing,true,'conflitto di partenza');eq(C().stage,'goal','il goal lo dice la giocatrice');eq(T.G.leaving,false,'leaving azzerato');
  await T.A.setGoal('Convinco i guardiani a lasciarmi andare','keep');await T.A.fairSay('gm','a');await T.A.fairSay('tb','b');await T.A.fairOk('gm');await T.A.fairOk('tb');
  await T.A.roll(8);await T.A.narrGM('Passa.');eq(T.G.step,'ending','riuscire a partire chiude l’avventura');
  console.log('E OK: lasciare il luogo');
  // ---- fine, interim
  await T.A.finishEnding('Esito A','Epilogo',{stakes:'S',a:'A',b:'B',chars:'x'});eq(T.G.step,'interim','interim');
  eq(T.G.reveal.stakes,'S','reveal');
  await T.A.say('gm','x');// no-op fuori scena
  const ck=T.G.checked.slice();
  await T.A.interim({delta:1,rels:{},scaleUp:true,loc:8});
  eq(T.G.pc.number,7,'numero +1');eq(T.G.scale,2,'scale 2');eq(T.G.loc,8,'loc');eq(T.G.step,'gm_prep','prep');eq(T.G.checked.length,0,'checked azzerati');eq(T.G.adv,2,'adv');eq(T.G.scene,0,'scena');eq(T.G.reveal,null,'reveal azzerato');
  console.log('F OK: interim (numero, Scale, destinazione, reset delle voci)');
  // clamp del numero
  await setup(9);await conflict(1);await T.A.roll(10);// 9 fighting: riesce con 1-8, 10 fallisce
  await T.A.narrTB('x',null);await T.A.relSkip();await T.A.beginEnding();await T.A.finishEnding('A','e',null);
  await T.A.interim({delta:1,rels:{},scaleUp:false,loc:1});eq(T.G.pc.number,9,'numero non supera 9');
  console.log('G OK: numero limitato a 9');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
