const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
(async()=>{
  const ai={gm_prep:()=>({where:'w',who:'h',stakes:'S',a:'a',b:'b',characters:[],notes:''}),scene_open:()=>({text:'Eirik è davanti a te.',npcs:['Eirik'],heal:false}),
    gm_respond:()=>({text:'Eirik spalanca gli occhi mentre la scure lascia la tua mano.',conflict:{type:'fighting',pace:1},end_scene:false})};
  const w=makeClient(makeStore(),'uA',{ai});await sleep(120);const T=w.__TB;
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(150);
  Object.assign(T.D,{pc_name:'Gwenna',pc_num:'6',pc_magic:'troll',pc_fight:'missile',pc_social:'fun',pc_loc:'9'});await T.ACT.createPC();await sleep(1500);
  T.D.sp_text='Lancio la scure e uccido Eirik.';await T.ACT.say();await sleep(1200);
  const p=w.__calls.find(c=>c.task==='gm_respond').prompt;
  assert.ok(p.indexOf('mi sta bene che vada come dice lei')>=0&&p.indexOf('CHIAMA IL CONFLITTO')>=0&&p.indexOf('fermati PRIMA dell’esito')>=0,'prompt senza il test dei conflitti');
  assert.ok(p.indexOf('Lancio la scure e uccido Eirik.')>=0,'la dichiarazione deve essere nel diario letto dall’IA');
  assert.strictEqual(T.G.step,'conflict');assert.strictEqual(T.G.conflict.by,'gm');assert.strictEqual(T.G.conflict.stage,'goal','tocca alla giocatrice dichiarare il Goal');
  // il Goal può essere "lo uccido": se fallisce, Eirik non muore
  await T.A.setGoal('Uccido Eirik','keep');
  console.log('OK: dichiarazione di uccidere un PNG con nome → conflitto chiamato dal GM, Goal alla giocatrice');process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
