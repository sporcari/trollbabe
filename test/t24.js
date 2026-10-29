// Esempi del 2009 e consigli in più: scheda delle regole, creazione, preparazione, Goal e prompt.
const {makeStore,makeClient,sleep}=require('./harness');
const assert=require('assert');
const has=(t,s,m)=>assert.ok(t.indexOf(s)>=0,m+': manca «'+s+'»');
(async()=>{
  const store=makeStore();
  const w=makeClient(store,'uGM',{noSample:true}),w2=makeClient(store,'uTB',{noSample:true});
  await sleep(120);const T=w.__TB,T2=w2.__TB;
  T.D.n_name='M';T.D.n_role='gm';T.D.n_other='human';await T.ACT.newGame();await sleep(30);
  T2.D.j_code=T.G.code;T2.D.j_name='T';await T2.ACT.joinGame();await sleep(150);
  const dock=x=>x.document.querySelector('#dock-body'),side=x=>x.document.querySelector('#side-body');
  // creazione: esempi delle quattro trollbabe
  const cr=dock(w2).textContent;
  ['Tha','Retta','Kreshk','Bniri'].forEach(n=>has(cr,n,'esempi di creazione'));
  // scheda delle regole
  T2.ui.tab='rules';T2.render();await sleep(30);
  const ru=side(w2).textContent;
  has(ru,'puoi alzarlo o abbassarlo di 1','numero');has(ru,'prima di ogni tiro dici cosa fai','azione prima del tiro');
  has(ru,'il portone resta in piedi','Goal sopra lo Scale');has(ru,'Non puoi salvare la città','Scale');has(ru,'il mare in cui ti tuffi','luoghi come avversari');
  await T.A.createPC({name:'Tha',number:3,magic:'human',fight:'unarmed',social:'scary',hair:'x',horns:'x',hum:'x',troll:'x',cloth:'x',kit:'x'});await T.go();await sleep(120);
  // preparazione: esempio delle Stumpy Mountains e promemoria
  const pr=dock(w).innerHTML;
  has(pr,'Ree-Shah','esempio degli Stakes');has(pr,'resta con la tribù','esiti');has(pr,'Gallg','personaggi');
  has(pr,'purché sia in crisi','promemoria');has(pr,'nessuna missione','niente storia');
  const gp=T.TASKS.gm_prep();has(gp,'in modo drastico','prompt gm_prep');has(gp,'non con un semplice cambio di proprietà','prompt gm_prep');has(gp,'nomi umani e troll ancora liberi','nomi liberi');
  await T.A.savePrep({stakes:'S',a:'A',b:'B',chars:'',where:'',who:'',notes:''});
  has(T.TASKS.scene_open(),'Non aprire con un PNG che le affida un incarico','apertura senza missioni');
  await T.A.openScene('Il bosco.',[],false);await sleep(120);
  // Goal: suggerimenti e i tre errori tipici
  await T2.ACT.cfOpen();await sleep(30);
  const dc=dock(w2).innerHTML;
  has(dc,'mi metto in salvo sulla terraferma','suggerimento del Goal');has(dc,'troppo passivo','errori tipici');
  // Magic: magia troll o umana nel Fair and clear
  await T.A.declare('tb',{type:'magic',pace:1,goal:'Scaccio lo spirito'});await T.A.paceAdj('keep');await sleep(120);
  has(T2.TASKS.fair_tb(),'magia troll','prompt fair_tb');
  assert.ok(w2.document.querySelector('#f-fr_text').placeholder.indexOf('Magia troll')>=0,'segnaposto Magic');
  console.log('OK: esempi del 2009 e consigli nei testi e nei prompt');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
