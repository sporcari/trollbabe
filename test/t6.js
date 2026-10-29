const {makeStore,makeClient,sleep}=require('./harness');
const {gmBot,runUntil}=require('./bots');
const assert=require('assert');
const scan=(w,tag)=>{const t=['#start','#game','#toast'].map(q=>w.document.querySelector(q).textContent).join(' ');for(const bad of ['undefined','NaN','[object']){if(t.indexOf(bad)>=0){const i=t.indexOf(bad);throw new Error('['+tag+'] testo sospetto "'+bad+'" nel DOM: …'+t.slice(Math.max(0,i-60),i+60));}}};
const ai={
  pc_create:()=>({name:'Skah',number:3,fight:'unarmed',magic:'human',social:'scary',hair:'neri',horns:'a capra',hum:'un libro',troll:'una pelle',cloth:'tunica',kit:'bastone'}),
  travel:(n,prompt)=>({place:/(p\d+): [^,]+, villaggio/.exec(prompt.split('=== NOTE ===')[1])[1]}),
  tb_act:(n)=>n===1?{text:'Skah avanza tra la nebbia.',conflict:null}:n===2?{text:'Skah afferra Hrenk per il bavero.',conflict:{type:'fighting',pace:2,goal:'Lo disarmo'}}:{text:'Skah osserva.',ask_end:true},
  goal:()=>({goal:'Lo convinco a lasciar stare'}),
  fair_tb:()=>({text:'Skah gonfia il petto.'}),
  narr_tb:()=>({text:'Il Goal sfugge.',continue:true,item:'ally'}),
  decide_tb:()=>({accept:false,item:'found',text:'Trova un sasso.',die:true}),
  rel_offer:(n)=>n===1?{form:true,name:'Hrenk',type:'opp',text:'Lo guarda male.'}:{form:false},
  tb_request:()=>({text:'Vado al fiume.',heal:true}),
  interim:()=>({delta:-1,drop:[],scaleUp:false}),
};
async function once(seed){
  const store=makeStore();
  let failOnce=seed===1;
  const w=makeClient(store,'uGM',{ai,sampleFail:(task,n)=>{if(failOnce&&task==='pc_create'){failOnce=false;return true;}return false;}});
  await sleep(120);const T=w.__TB;
  T.D.n_name='Marta';T.D.n_role='gm';T.D.n_other='ai';await T.ACT.newGame();
  if(seed===1){
    await sleep(300);
    assert.ok(T.AI.err,'doveva comparire l’errore dell’IA');
    assert.ok(w.document.querySelector('[data-act="aiRetry"]'),'manca il pulsante Riprova');
    assert.ok(w.document.querySelector('#dock').textContent.indexOf('limite')>=0,'testo errore rate limit mancante');
    await T.ACT.aiRetry();
    console.log('  errore IA mostrato e Riprova funziona');
  }
  const bg={gmDeclare:true,endAt:2};
  const ok=await runUntil(()=>{scan(w,'dom');return T.G&&T.G.adv>=2&&T.G.step==='scene_play';},[[w,gmBot,bg]],25000,'S3');
  const G=T.G;
  console.log('seed',seed,'ok',ok,'adv',G.adv,'step',G.step,'pc',G.pc.name,G.pc.number,G.pc.status,'rels',G.rels.map(r=>r.name+':'+r.type).join(','),'AIerr',T.AI.err);
  console.log('  IA:',w.__calls.map(c=>c.task).join(' '));
  assert.ok(ok,'bloccato: step='+G.step+' stage='+(G.conflict&&G.conflict.stage)+' turn='+G.turn+' err='+T.AI.err);
  // prompt della trollbabe IA: non deve contenere la preparazione segreta del GM
  const tbPrompts=w.__calls.filter(c=>['tb_act','goal','fair_tb','narr_tb'].includes(c.task));
  tbPrompts.forEach(c=>assert.ok(c.prompt.indexOf('Oskel')<0&&c.prompt.indexOf('PREPARAZIONE SEGRETA')<0,'segreto nel prompt della trollbabe IA'));
}
(async()=>{
  for(const s of [1,2,3,4]){await once(s);}
  console.log('S3 (GM umano, trollbabe IA) OK');process.exit(0);
})().catch(e=>{console.error('FAIL',e.message||e);process.exit(1);});
