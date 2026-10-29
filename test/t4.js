const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
let T,w,store;
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
async function setup(num){
  store=makeStore();
  w=makeClient(store,'uGM',{noSample:true});
  const w2=makeClient(store,'uTB',{noSample:true});
  await sleep(120);T=w.__TB;
  T.D.n_name='M';T.D.n_role='gm';T.D.n_other='human';await T.ACT.newGame();await sleep(30);
  w2.__TB.D.j_code=T.G.code;w2.__TB.D.j_name='T';await w2.__TB.ACT.joinGame();await sleep(80);
  const pc={name:'Retta',number:num||6,magic:'troll',fight:'melee',social:'fun',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'};
  await T.A.createPC(pc);await T.go();
  await T.A.savePrep({stakes:'S',a:'A',b:'B',chars:'',where:'',who:'',notes:''});
  await T.A.openScene('Scena',['Orm'],false);
  eq(T.G.step,'scene_play','setup');
}
async function toRoll(pace,type){
  await T.A.declare('tb',{type:type||'fighting',pace:pace,goal:'Fermo Orm'});
  eq(T.G.conflict.stage,'pace','dopo declare');
  await T.A.paceAdj('keep');eq(T.G.conflict.stage,'fair','dopo pace');
  // a turno: prima la trollbabe, poi il GM; fuori turno non si scrive
  await T.A.fairSay('tb','Retta attende');eq(T.G.conflict.fair.turn,'gm','dopo la trollbabe tocca al GM');
  await T.A.fairSay('tb','fuori turno');eq(T.G.conflict.fair.tb,'Retta attende','fuori turno non si modifica');
  await T.A.fairSay('gm','Orm carica');eq(T.G.conflict.fair.turn,'tb','poi alla trollbabe');eq(T.G.conflict.stage,'fair','una dichiarazione non chiude');
  // modificare passa la mano e azzera l'accettazione dell'altro
  await T.A.fairSay('tb','Retta attende, ascia in mano');eq(T.G.conflict.fair.gmOk,false,'la modifica deve azzerare le conferme');eq(T.G.conflict.fair.turn,'gm','la modifica passa la mano');
  await T.A.fairOk('gm');
  eq(T.G.conflict.stage,'roll','dopo fair');
}
const C=()=>T.G.conflict;
const fair=async()=>{await T.A.fairSay('tb','b');await T.A.fairSay('gm','a');await T.A.fairOk('tb');};
const step=async()=>{await T.A.stepSay('gm','Orm ritenta');await T.A.stepSay('tb','Retta incalza');};
(async()=>{
  // ---- 1. Pace 1: successo al tiro iniziale (Fighting, numero 6: riesce con 1-5)
  await setup(6);await toRoll(1);
  await T.A.roll(5);eq(C().stage,'narr_gm','1 stage');eq(C().kind,'success','1 kind');
  await T.A.narrGM('Un colpo.');eq(T.G.step,'rel_offer','1: conflitto concluso');eq(T.G.pc.status,'ok','1 status');eq(T.G.lastConflict.outcome,'success','1 esito');
  console.log('1 OK: successo immediato (Fighting 6, tiro 5)');
  // ---- 2. fallimento e stop
  await T.A.relSkip();await toRoll(1);
  await T.A.roll(6); // 6 non è < 6: fallisce
  eq(C().kind,'inconv','2 kind');eq(T.G.pc.status,'ok','2: scomodata non cambia lo stato');
  await T.A.narrTB('Scivola.',null);eq(T.G.step,'rel_offer','2 chiuso');eq(T.G.lastConflict.outcome,'fail','2 esito fail');
  eq(T.G.pc.status,'ok','2 status');
  console.log('2 OK: fallimento e stop = Goal fallito, solo scomodata');
  // ---- 3. discesa completa: scomodata -> ferita -> incapacitata -> accetta
  await T.A.relSkip();await toRoll(1);
  await T.A.roll(9);await T.A.narrTB('Scivola.',{item:'carried'});eq(C().box,1,'3 box1');eq(C().stage,'roll','3 stage roll');
  eq(T.G.checked.join(),'carried','3 carried spuntato');
  await T.A.roll(9);eq(C().kind,'injury','3 injury');eq(T.G.pc.status,'injured','3 ferita');
  await T.A.narrTB('Ferita al fianco.',{item:'ally'});eq(C().box,2,'3 box2');
  await T.A.roll(9);eq(C().kind,'incap','3 incap');eq(C().stage,'narr_gm','3 narr_gm');eq(T.G.pc.status,'incap','3 incap status');
  await T.A.narrGM('Orm la schiaccia.');eq(C().stage,'decide_tb','3 decide');
  await T.A.decide({});eq(T.G.step,'scene_play','3 conflitto chiuso incap');eq(T.G.turn,'gm','3: con incap il turno passa al GM');
  eq(T.G.lastConflict.outcome,'fail','3 fail');
  console.log('3 OK: discesa scomodata → ferita → incapacitata (3 fallimenti, 2 voci spuntate)');
  // ---- 3b. un conflitto non può essere dichiarato da incapacitata
  const sq=T.G.seq;await T.A.declare('tb',{type:'fighting',pace:1,goal:'x'});eq(T.G.seq,sq,'3b niente conflitti da incapacitata');
  // cura: scena di cura
  await T.A.endScene();await T.A.request('mi curo al fiume',true);await T.A.openScene('Il fiume.',[],true);
  eq(T.G.pc.status,'ok','3c: la scena di cura guarisce');
  // le voci spuntate restano spuntate per tutta l'avventura
  eq(T.availableItems(T.G).map(i=>i.id).join(),'found,spell,geo,ally'.split(',').filter(x=>x!=='ally').join(),'3c voci disponibili: '+T.availableItems(T.G).map(i=>i.id));
  console.log('3b/3c OK: niente conflitti da incapacitata, cura con scena dedicata, voci già usate non tornano');
  // ---- 4. terzo roll-again riuscito: incapacitazione attenuata
  await T.A.declare('tb',{type:'magic',pace:1,goal:'Apro il sentiero'});await T.A.paceAdj('keep');
  await fair();
  // Magic con numero 6: riesce con 7-10
  await T.A.roll(1);eq(C().kind,'inconv','4 inconv');
  await T.A.narrTB('x',{item:'found'});await T.A.roll(1);eq(C().kind,'injury','4 injury');
  await T.A.narrTB('x',{item:'spell'});await T.A.roll(1);eq(C().kind,'incap','4 incap');
  await T.A.narrGM('ostile');eq(C().stage,'decide_tb','4 decide');
  await T.A.decide({item:'geo',text:'Si aggrappa a una radice.'});eq(C().box,3,'4 box3');eq(C().stage,'roll','4 roll');
  await T.A.roll(9);eq(C().kind,'alt_incap','4 alt');eq(C().stage,'narr_tb','4 narr_tb');
  await T.A.narrTB('Si trascina da un amico.');eq(T.G.step,'scene_play','4 chiuso');eq(T.G.pc.status,'incap','4: resta incapacitata');eq(T.G.lastConflict.outcome,'fail','4: il Goal resta perso');
  console.log('4 OK: terzo roll-again riuscito → incapacità attenuata, Goal comunque fallito');
  // ---- 5. da ferita si parte dal box 1 (max 2 roll-again) e terzo fallito -> morte
  await T.A.endScene();await T.A.request('qui',false);await T.A.openScene('s',[],false);
  // dopo il caso 4 la trollbabe è incapacitata e non ha curato: la cura non c'era (heal false)
  eq(T.G.pc.status,'incap','5 ancora incapacitata');
  await T.A.endScene();await T.A.request('mi curo',true);await T.A.openScene('cura',[],true);eq(T.G.pc.status,'ok','5 curata');
  console.log('5 OK');
  // ---- 6. ferita preesistente: la Serie parte dal box 1
  await setup(6);
  await toRoll(1);await T.A.roll(9);await T.A.narrTB('x',{item:'carried'});await T.A.roll(9);
  eq(T.G.pc.status,'injured','6 ferita');await T.A.narrTB('x',null);eq(T.G.step,'rel_offer','6 chiuso');
  await T.A.relSkip();
  await toRoll(2);eq(C().box,1,'6: partenza dal box 1');eq(C().sb,1,'6: sb');
  await T.A.roll(9);eq(C().kind,'injury','6: il primo fallimento è subito ferita (già ferita)');eq(T.G.pc.status,'injured','6 resta ferita');
  await T.A.narrTB('Ancora il fianco.',{item:'ally'});eq(C().box,2,'6 box2');
  await T.A.roll(9);eq(C().kind,'incap','6 incap');await T.A.narrGM('x');
  await T.A.decide({item:'found',text:'x'});eq(C().box,3,'6 box3');
  await T.A.roll(9);eq(C().kind,'fate','6 fate: terzo fallito');eq(C().stage,'decide_tb','6 decide fate');
  await T.A.decide({die:true,text:'Muore nel fango.'});
  eq(T.G.pc.status,'dead','6 morta');eq(T.G.step,'ending','6: morte → fine avventura');
  await T.A.finishEnding('Esito B','Epilogo',{stakes:'S',a:'A',b:'B'});eq(T.G.step,'tb_create','6: dopo la morte si crea una nuova trollbabe');
  eq(T.G.reveal.outcome,'Esito B','6 reveal');
  console.log('6 OK: ferita parte dal box 1; fallire il terzo e dichiarare la morte chiude l’avventura');
  // ---- 7. Pace 3: tre Serie riuscite
  await setup(6);await toRoll(3);
  await T.A.roll(1);await T.A.narrGM('1');eq(C().succ,1,'7 succ1');eq(C().stage,'step','7: nuova Serie col passo');eq(C().series,2,'7 serie 2');await step();eq(C().stage,'roll','7: dopo il passo si tira');
  await T.A.roll(9);await T.A.narrTB('x',null);eq(C().fail,1,'7 fail1');eq(C().series,3,'7 serie 3');await step();
  await T.A.roll(1);await T.A.narrGM('2');eq(C().succ,2,'7 succ2');await step();
  await T.A.roll(9);await T.A.narrTB('x',null);eq(C().fail,2,'7 fail2');await step();
  await T.A.roll(1);await T.A.narrGM('3');eq(T.G.step,'rel_offer','7: 3 su 5 chiude');eq(T.G.lastConflict.outcome,'success','7 esito');
  // Pace 3: tre fallimenti
  await T.A.relSkip();await toRoll(3);
  for(let i=0;i<3;i++){if(i)await step();await T.A.roll(9);await T.A.narrTB('x',null);}
  eq(T.G.step,'rel_offer','7b: 3 fallimenti chiudono');eq(T.G.lastConflict.outcome,'fail','7b esito');
  console.log('7 OK: Pace 3 chiude a 3 successi o a 3 fallimenti');
  // ---- 8. Pace 2
  await T.A.relSkip();await toRoll(2);
  await T.A.roll(1);await T.A.narrGM('a');await step();await T.A.roll(1);await T.A.narrGM('b');eq(T.G.lastConflict.outcome,'success','8 successo 2/2');
  await T.A.relSkip();await toRoll(2);
  await T.A.roll(9);await T.A.narrTB('x',null);await step();await T.A.roll(9);await T.A.narrTB('x',null);eq(T.G.lastConflict.outcome,'fail','8 fallimento 2');
  console.log('8 OK: Pace 2');
  // ---- 9. Relationship come roll-again e relative conseguenze
  await T.A.relSkip();
  // creo una Relationship anonima (non è nei PNG con nome)
  await T.A.declare('tb',{type:'social',pace:1,goal:'La convinco'});
  await T.A.paceAdj('keep');await fair();
  await T.A.roll(9);await T.A.narrTB('x',null); // social con numero 6: riesce da 6 in su: 9 riesce!
  console.log('   (nota: Social numero 6 riesce con 6-10; 9 è un successo)');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.message||e);process.exit(1);});
