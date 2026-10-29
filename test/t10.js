const {makeStore,makeClient,sleep}=require('./harness');
const {tbBot,runUntil}=require('./bots');
const assert=require('assert');
(async()=>{
  const ai={gm_prep:()=>({who_bears:{a:'x',b:'y',scale:1},where:'w',who:'h',stakes:'Oskel',a:'vive',b:'muore',characters:[{name:'Orm',want:'x'}],notes:''}),
   scene_open:()=>({text:'t',npcs:[],heal:false}),gm_respond:(n)=>n<2?{text:'x'}:{text:'fine',end_adventure:true},ending:()=>({outcome:'a',text:'e'}),fair_gm:()=>({text:'f'}),narr_gm:()=>({text:'n'})};
  const w=makeClient(makeStore(),'uA',{ai});await sleep(120);const T=w.__TB;
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();
  const ok=await runUntil(()=>T.G&&T.G.adv>=2&&T.G.step==='scene_play',[[w,tbBot,{}]],20000,'x');
  assert.ok(ok);
  const preps=w.__calls.filter(c=>c.task==='gm_prep');
  assert.ok(preps.length>=2,'serve la seconda preparazione');
  assert.ok(preps[1].prompt.indexOf('PREPARAZIONE SEGRETA')<0,'la prep precedente è nel prompt della nuova!');
  assert.ok(w.__calls.find(c=>c.task==='scene_open').prompt.indexOf('PREPARAZIONE SEGRETA')>=0,'la scena deve vedere la prep corrente');
  console.log('OK: nessuna contaminazione tra avventure');process.exit(0);
})().catch(e=>{console.error('FAIL',e.message||e);process.exit(1);});
