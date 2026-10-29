const {makeStore,makeClient,sleep}=require('./harness');
const {ai}=require('./aimocks');
const assert=require('assert');
const waitFor=async(c,ms)=>{const t0=Date.now();while(Date.now()-t0<(ms||6000)){if(c())return;await sleep(40);}throw new Error('timeout: '+c);};
const eq=(a,b,m)=>assert.strictEqual(a,b,m+' (atteso '+b+', trovato '+a+')');
(async()=>{
  const store=makeStore();
  const w=makeClient(store,'uA',{ai});await sleep(120);const T=w.__TB;
  // generatore: deterministico, luoghi sulla terra, mare rifiutato
  for(const mode of ['arcipelago','continenti','fiordi']){
    const a=T.newMap('seme',mode),b=T.newMap('seme',mode);
    eq(JSON.stringify(a),JSON.stringify(b),'stesso seme, stessa mappa ('+mode+')');
    const dests=a.places.filter(p=>p.hint);
    assert.ok(dests.length>=6,'pochi luoghi in '+mode);
    eq(new Set(a.places.map(p=>p.id)).size,a.places.length,'id unici');
    eq(new Set(a.places.map(p=>p.name)).size,a.places.length,'nomi unici');
    const sea=a.places.find(p=>p.kind==='mare');assert.ok(sea,'manca il mare');
    eq(T.placeAt(a,sea.x,sea.y),null,'toccare il mare non sceglie nulla');
    eq(T.placeAt(a,dests[0].x+4,dests[0].y).id,dests[0].id,'tocco vicino a un luogo con nome');
  }
  assert.notStrictEqual(JSON.stringify(T.newMap('uno','fiordi')),JSON.stringify(T.newMap('due','fiordi')),'semi diversi, mappe diverse');
  console.log('A OK: generatore deterministico, luoghi sulla terra, mare rifiutato');
  // la trollbabe umana sceglie mondo e destinazione dopo la creazione
  T.D.n_name='S';T.D.n_role='tb';T.D.n_other='ai';await T.ACT.newGame();await sleep(150);
  assert.ok(w.document.querySelector('#dock datalist#tb-nomi option[value="Astrid"]'),'mancano i nomi vichinghi suggeriti');
  Object.assign(T.D,{pc_name:'Gwenna',pc_num:'6',pc_magic:'troll',pc_fight:'missile',pc_social:'fun'});await T.ACT.createPC();
  eq(T.G.step,'travel','dopo la creazione si sceglie dove andare');
  const dock=()=>w.document.querySelector('#dock');
  assert.ok(dock().querySelector('canvas[data-map="pick"]'),'manca la mappa da toccare');
  assert.ok(dock().querySelector('[data-seg="tv_world"]'),'manca la scelta del mondo');
  T.D.tv_world='arcipelago';T.ACT.tvWorld();const s1=T.ui.mapDraft.m.seed;eq(T.ui.mapDraft.m.mode,'arcipelago','mondo scelto');
  T.ACT.tvReroll();T.render();assert.notStrictEqual(T.ui.mapDraft.m.seed,s1,'«Un’altra mappa» cambia il seme');
  await assert.rejects(T.ACT.travel(),/Tocca la mappa/,'partire senza destinazione');
  const draft=T.ui.mapDraft.m,first=draft.places.find(p=>p.kind==='costa');
  T.ACT.tvPlace({dataset:{val:first.id}});
  assert.ok(dock().textContent.indexOf('Parti verso '+first.name)>=0,'il pulsante non nomina la destinazione');
  await T.ACT.travel();await sleep(50);
  assert.ok(T.G.step!=='travel','partenza');eq(T.G.map.seed,draft.seed,'la mappa scelta diventa quella della partita');
  eq(T.G.locName,first.name,'luogo');assert.ok(T.G.locHint.indexOf('villaggio sulla costa')===0,'descrizione del luogo: '+T.G.locHint);
  assert.ok(w.document.querySelector('#side-body canvas[data-map="side"]'),'manca la mappa nella scheda');
  await waitFor(()=>T.G.step==='scene_play');
  const prep=w.__calls.find(c=>c.task==='gm_prep');
  assert.ok(prep&&prep.prompt.indexOf(first.name+' ('+T.G.locHint+')')>=0,'il GM IA non riceve luogo e descrizione');
  assert.ok(prep.prompt.indexOf('Luoghi vicini sulla mappa')>=0,'il GM IA non vede i luoghi vicini');
  assert.ok(/nomi nordici come questi: [A-Z]/.test(prep.prompt),'il GM IA non riceve i nomi vichinghi');
  console.log('B OK: mondo e destinazione scelti dalla trollbabe, visti dal GM IA, con i nomi vichinghi');
  // avventura successiva: stessa mappa, nessuna scelta del mondo, luogo nuovo toccato sulla terra
  await T.A.beginEnding();await waitFor(()=>T.G.step==='interim');await T.ACT.interim();
  eq(T.G.step,'travel','dopo l’interim si torna alla mappa');
  assert.ok(!dock().querySelector('[data-seg="tv_world"]'),'il mondo non si sceglie più');
  const t=T.G.map,land=T.newMap(t.seed,t.mode);// stessi luoghi di partenza
  let fresh=null;
  for(let y=30;y<400&&!fresh;y+=7)for(let x=30;x<650&&!fresh;x+=7){const p=T.placeAt(t,x,y);if(p&&p.fresh)fresh=p;}
  assert.ok(fresh,'nessun punto libero sulla terra');eq(land.places.length,t.places.length,'nessun luogo aggiunto prima di partire');
  T.ui.mapPick=fresh;await T.ACT.travel();
  eq(T.G.map.seed,t.seed,'la mappa resta la stessa');eq(T.G.locName,fresh.name,'luogo nuovo');
  const saved=T.G.map.places.find(p=>p.id===fresh.id);assert.ok(saved&&saved.visited&&!('fresh' in saved),'luogo nuovo non salvato bene');
  eq(T.G.map.places.filter(p=>p.visited).length,2,'due luoghi visitati');
  assert.ok(JSON.stringify(T.G.map).length<6000,'mappa troppo grande nello stato condiviso');
  console.log('C OK: stessa mappa nelle avventure successive, luogo nuovo toccato sulla terra');
  process.exit(0);
})().catch(e=>{console.error('FAIL',e.stack||e);process.exit(1);});
