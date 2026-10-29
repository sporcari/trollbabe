const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
(async()=>{
  const ai={gm_prep:()=>({where:'w',who:'h',stakes:'S',a:'a',b:'b',characters:[],notes:''}),scene_open:()=>({text:"Un sentiero. L'acqua ferma.",npcs:[],heal:false})};
  const w=makeClient(makeStore(),'uA',{ai});await sleep(120);const T=w.__TB;
  T.D.n_name='Sharmay';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(150);
  Object.assign(T.D,{pc_name:'Sharmay',pc_num:'6',pc_magic:'troll',pc_fight:'melee',pc_social:'fun'});await T.ACT.createPC();await T.ACT.tvPlace({dataset:{val:'p3'}});await T.ACT.travel();await sleep(1500);
  console.log('step',T.G.step,'calls',w.__calls.map(c=>c.task).join(','),'err',T.AI.err);
  const p=w.__calls.find(c=>c.task==='scene_open').prompt;
  assert.ok(p.indexOf('Massimo 50 parole')>=0&&p.indexOf('RITMO MORBIDO')>=0&&p.indexOf('senza mettere già in scena la posta')>=0,'prompt non aggiornato');
  assert.ok(T.LOG.some(e=>e.type==='scene'&&e.text==='Un sentiero. L’acqua ferma.'),'apostrofi non normalizzati: '+JSON.stringify(T.LOG.map(e=>e.text)));
  const dock=w.document.querySelector('#dock-body').textContent;
  assert.ok(dock.indexOf('Sharmay (Sharmay)')<0,'nome duplicato: '+dock.slice(0,80));
  console.log('OK');process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
