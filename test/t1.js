const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
(async()=>{
  const store=makeStore();
  const w=makeClient(store,'uA',{});
  await sleep(150);
  const T=w.__TB;
  console.log('start visibile:',!w.document.querySelector('#start').classList.contains('hidden'));
  console.log('titolo:',w.document.querySelector('.title')&&w.document.querySelector('.title').textContent);
  // regole pure
  const r=T.ranges;
  const J=x=>JSON.stringify(x);assert.strictEqual(J(r(7)),J({fighting:[1,6],magic:[8,10],social:[7,10]}));
  assert.strictEqual(J(r(3)),J({fighting:[1,2],magic:[4,10],social:[1,3]}));
  assert.strictEqual(J(r(4)),J({fighting:[1,3],magic:[5,10],social:[1,4]}));
  assert.strictEqual(J(r(6)),J({fighting:[1,5],magic:[7,10],social:[6,10]}));
  assert.strictEqual(J(r(5).social),J([1,5]));
  // coerenza tra rollOk e intervalli per ogni numero e tipo
  for(let n=2;n<=9;n++){const rr=r(n);for(const t of ['fighting','magic','social']){for(let v=1;v<=10;v++){const inRange=v>=rr[t][0]&&v<=rr[t][1];assert.strictEqual(T.rollOk(t,n,v),inRange,`n=${n} ${t} v=${v}`);}}}
  // il social è sempre il lato meno probabile (<=5 successi su 10)
  for(let n=2;n<=9;n++){const rr=r(n).social;assert.ok(rr[1]-rr[0]+1<=5||n===5,'social n='+n);}
  console.log('relCost',T.relCost('success','ok'),T.relCost('success','injured'),T.relCost('fail','injured'),T.relCost('fail','incap'));
  console.log('REGOLE PURE OK');
  // crea partita contro IA
  T.D.n_name='Saverio';T.D.n_role='tb';T.D.n_other='ai';
  await T.ACT.newGame();
  await sleep(100);
  console.log('step:',T.G.step,'seats:',JSON.stringify(T.G.seats));
  console.log('dock ha form crea pg:',!!w.document.querySelector('[data-act="createPC"]'));
  console.log('game visibile:',!w.document.querySelector('#game').classList.contains('hidden'));
  process.exit(0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
