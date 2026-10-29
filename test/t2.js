const {makeStore,makeClient,sleep}=require('./harness');
const {tbBot,runUntil}=require('./bots');
const assert=require('assert');

const ai={
  gm_prep:()=>({where:'Un porto fumoso',who:'Umani e troll',stakes:'Oskel, figlio del capo',a:'Oskel vive',b:'Oskel muore',characters:[{name:'Orm',want:'onore'},{name:'Ennda',want:'pace'}],notes:'segreto'}),
  scene_open:(n)=>({text:'Scena aperta '+n+': nebbia.',npcs:['Orm'],heal:true}),
  gm_respond:(n)=> n===1?{text:'Hrenk ti squadra.',npcs:['Hrenk'],conflict:null,end_scene:false}
                 : n===2?{text:'Hrenk ti sputa ai piedi.',conflict:{type:'social',pace:2},end_scene:false}
                 : n===3?{text:'La folla si disperde.',end_scene:true}
                 : n===4?{text:'Altra nebbia.',end_scene:false}
                 : {text:'Il molo brucia.',end_adventure:true},
  fair_gm:()=>({text:'Hrenk avanza minaccioso.'}),
  step_gm:()=>({text:'Hrenk ritenta.'}),
  narr_gm:()=>({text:'Un colpo netto.'}),
  ending:()=>({outcome:'b',text:'Il porto cade.'}),
};

async function once(seed){
  const store=makeStore();
  const w=makeClient(store,'uA',{ai});
  await sleep(120);
  const T=w.__TB;
  T.D.n_name='Saverio';T.D.n_role='tb';T.D.n_other='ai';
  await T.ACT.newGame();
  const b={declare:true,type:'fighting',pace:2,relName:'Hrenk',alwaysCont:seed%2===0,die:seed%3===0};
  const ok=await runUntil(()=>T.G&&T.G.adv>=2&&T.G.step==='scene_play',[[w,tbBot,b]],20000,'S1');
  const G=T.G;
  const tasks=w.__calls.map(c=>c.task);
  console.log('seed',seed,'ok:',ok,'adv',G.adv,'step',G.step,'scene',G.scene,'rels',G.rels.map(r=>r.name+':'+r.type+':'+(r.dead?'morto':r.status)).join(','),'pcN',G.pc.number,'scale',G.scale,'AIerr',T.AI.err,'log',T.LOG.length);
  console.log('  chiamate IA:',tasks.join(' '));
  assert.ok(ok,'non è arrivato alla seconda avventura; step='+G.step+' stage='+(G.conflict&&G.conflict.stage));
  assert.ok(!T.AI.err);
  assert.ok(G.reveal===null||G.adv>=2);
  // la prep dell'IA è privata: non compare nel documento condiviso
  const shared=JSON.stringify(G);
  assert.ok(shared.indexOf('Oskel')<0,'la preparazione segreta è finita nel documento pubblico!');
  assert.ok(T.PRIV&&T.PRIV.stakes);
  // il diario non rivela gli Stakes oltre all'epilogo/reveal
  return w;
}
(async()=>{
  for(const s of [1,2,3,4,5,6]){await once(s);}
  console.log('S1 OK');process.exit(0);
})().catch(e=>{console.error('FAIL',e.message||e);process.exit(1);});
