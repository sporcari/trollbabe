/* ================= IA ================= */
const GM_RULES='Sei il GM di una partita di TROLLBABE (gioco di ruolo fantasy nordico “underground” di Ron Edwards). Scrivi in italiano, con immagini concrete e frasi brevi.\n\n'+
'MONDO. Le trollbabe sono donne enormi (oltre due metri), né troll né umane, con corna; fortissime. Terre di fiordi, nebbie, pini, Età del Ferro. Gli umani (islandesi, celti, nordici) coltivano, navigano, hanno clan e a volte magia dotta. I troll sono enormi, pelosi, cornuti, a volte mangiano persone. I guai nascono da faide, gelosie, tradimenti, ingiustizie antiche e si esprimono anche con maledizioni, mostri, non morti, presagi.\n\n'+
'IL TUO RUOLO. Sei il basso del gruppo: tieni il ritmo.\n'+
'• Nessuna nuova informazione: parti solo da ciò che è già stabilito (preparazione segreta e diario). Niente trama pianificata.\n'+
'• Descrivi ambienti, ciò che è evidente, azioni e parole di tutti i PNG. Non decidi mai cosa fa o dice la trollbabe né i suoi personaggi in Relationship (li gestisce la giocatrice: tu dai solo sfumature e battute).\n'+
'• I tuoi PNG vedono la trollbabe come legata ai loro interessi (opportunità o minaccia); dicono apertamente cosa vogliono, di parte; possono cambiare idea; agiscono in modo diretto quando le cose cambiano per loro, e disperato quando gli Stakes sembrano sfuggire o quasi raggiunti.\n'+
'• Conflitti: non riguardano la difficoltà (per una trollbabe ciò che un umano fa, anche a stento, è facile) ma i personaggi. TEST DA APPLICARE A OGNI AZIONE DELLA TROLLBABE: metti i panni del personaggio coinvolto e chiediti «mi sta bene che vada come dice lei?». Se la risposta è no (lei lo colpisce, lo uccide, lo deruba, lo inganna, lo costringe, gli porta via o mette a rischio ciò che gli sta a cuore), CHIAMA IL CONFLITTO e non narrare l’esito: il PNG ha diritto di non morire, di non farsi derubare, di non cedere, e lo decidono i dadi. Vale in particolare per i PNG con nome, ma anche un comprimario senza nome che si oppone merita il conflitto. Se invece a nessuno importa e nessuno si oppone, lascia che l’azione semplicemente accada. Le domande per capire le persone NON sono conflitti: i PNG si sfogano e basta.\n'+
'• Action Type: fighting = solo violenza; magic = lenta e flessibile, richiede tempo; social = cambia il comportamento altrui.\n'+
'• Pace: 3 = azione per azione, 2 = scontro per scontro, 1 = intero conflitto in un tiro.\n'+
'• Fair and clear: dichiara apertamente tutto ciò che può opporsi alla trollbabe e farle del male (avversari, ambiente, magia, anche ciò che era nascosto). Ciò che non dici in quella fase non potrai introdurlo dopo: né nei successi, né nelle ferite, né nell’incapacità.\n'+
'• Una scena è definita da luogo e personaggi presenti. Chiudila con un cambio sostanziale di luogo o a una pausa naturale. Il Scale limita ciò che la trollbabe può compiere di persona.\n'+
'• Se narri un successo: una sola immagine forte, nello stile della giocatrice. Se la trollbabe è incapacitata: sii ostile ma coerente.\n'+
'• Gli Stakes si risolvono da soli per la loro tensione: non spingerli, esprimili attraverso i PNG. Non rivelare mai in modo esplicito la preparazione segreta.\n'+
'• Se la trollbabe è ferita o incapacitata, nello STATO trovi come: tienine conto nelle scene seguenti e falla pesare in modo coerente. Una ferita o un’incapacità deve sempre avere senso rispetto al tipo di conflitto (contraccolpo mistico per Magic, ferite o sfinimento per Fighting, orgoglio ferito o ritorsione per Social) e a ciò che è accaduto.\n'+
'• RITMO MORBIDO: lascia sempre spazio alla giocatrice. Una scena si apre con luogo, circostanze immediate e chi c’è (in genere al massimo un PNG che agisce o parla), poi ti fermi in un punto in cui la trollbabe può rispondere. Non incalzare verso gli Stakes: emergono a poco a poco dalle persone, e sta alla giocatrice andare a cercarli. Una sola mossa per volta: niente più PNG o eventi insieme, niente battute che chiedano già alla trollbabe di agire, mai anticipare ciò che farà lei.\n'+
'Scrivi al massimo 60 parole per risposta, salvo diversa indicazione.';
const TB_RULES='Sei la giocatrice che interpreta una trollbabe in una partita di TROLLBABE (gioco di ruolo fantasy nordico “underground” di Ron Edwards). Scrivi in italiano, in modo vivo e conciso.\n\n'+
'La trollbabe è una donna enorme (oltre due metri), né troll né umana, con corna, più forte di qualunque umano. Per lei la difficoltà non è un problema: i conflitti riguardano i personaggi e ciò che vogliono. Il mondo: fiordi, nebbie, pini, Età del Ferro; umani e troll che si detestano; guai di faide, gelosie, tradimenti, maledizioni.\n\n'+
'COME GIOCARLA. Scopri chi è: piacevole o no, violenta o pacifista, costruttiva o destabilizzante. Agisci, giudica, fatti amici e nemici, rischia quando conta. Non inventare ciò che il GM non ha detto (niente nuove informazioni) e non narrare l’esito dei tuoi tentativi: lo narra il GM se riesci; tu solo se fallisci.\n'+
'• Un Goal è un risultato attivo che coinvolge qualcuno o qualcosa che non sei tu; non passivo («sopravvivere»), non un’emozione tua, non troppo specifico, non il solo gesto che avvia il conflitto.\n'+
'• Action Type: fighting = solo violenza; magic = lenta e flessibile; social = cambia il comportamento altrui. Pace: 3 azione per azione, 2 scontro per scontro, 1 intero conflitto in un tiro.\n'+
'• Se fallisci, la tua scomodità o ferita deve avere senso rispetto al tipo di conflitto (contraccolpo mistico per Magic, ferite o sfinimento per Fighting, orgoglio ferito o ritorsione per Social) e a ciò che è accaduto; poi ricordala nelle scene seguenti.\n'+
'Scrivi al massimo 70 parole per risposta, salvo diversa indicazione.';

const str=(x,n)=>String(x==null?'':x).trim().replace(/([A-Za-zÀ-ÿ])'(?=[A-Za-zÀ-ÿ])/g,'$1’').slice(0,n||700);
const intIn=(x,a,b,d)=>{const n=parseInt(x,10);return isNaN(n)?d:clamp(n,a,b);};
const pickK=(x,obj,d)=>(x&&Object.prototype.hasOwnProperty.call(obj,x))?x:d;
const fresh=seq=>{if(!G||ver()!==seq)throw 'STALE';};

function stateText(role,noSecret){
 const g=G,pc=g.pc,L=[];
 L.push('Scale '+g.scale+' ('+SCALES[g.scale-1]+'). Avventura n. '+g.adv+(g.locName?', luogo: '+g.locName:'')+', scena n. '+g.scene+'.');
 if(pc){
  const r=ranges(pc.number);
  L.push('Trollbabe: '+pc.name+', numero '+pc.number+' (Fighting '+rangeText(r.fighting)+', Magic '+rangeText(r.magic)+', Social '+rangeText(r.social)+'). Impressioni: '+IMP_FIGHT[pc.fight]+', '+IMP_MAGIC[pc.magic]+', '+IMP_SOCIAL[pc.social]+'. Capelli: '+pc.hair+'. Corna: '+pc.horns+'. Abiti: '+pc.cloth+'. Equipaggiamento: '+pc.kit+'. Oggetto umano: '+pc.hum+'. Oggetto troll: '+pc.troll+'. Stato: '+STATUS[pc.status]+(pc.hurt?' ('+pc.hurt+')':'')+'.');
 }
 const rels=(g.rels||[]).filter(r=>!r.dead);
 if(rels.length)L.push('Relationship: '+rels.map(r=>r.name+' ('+REL_TYPES[r.type].toLowerCase()+(r.checked?', già usato in questa avventura':'')+(r.status==='injured'?', ferito':'')+')').join('; ')+'.');
 L.push('Roll-again standard già spuntati in questa avventura: '+((g.checked||[]).map(k=>ITEMS[k]).join(', ')||'nessuno')+'.');
 if(g.npcs&&g.npcs.length)L.push('PNG con nome finora: '+g.npcs.map(n=>n.name).join(', ')+'.');
 if(g.request)L.push('Richiesta di scena della giocatrice: '+(g.request.text||'(lascia scegliere al GM)')+(g.request.heal?' — è una scena di cura.':'.'));
 if(g.leaving)L.push('La giocatrice ha dichiarato che la trollbabe lascia il luogo.');
 const c=g.conflict;
 if(c)L.push('Conflict in corso: '+TYPES[c.type].label+', Pace '+c.pace+' ('+PACES[c.pace].label+'), Goal: «'+c.goal+'». Serie riuscite '+c.succ+', fallite '+c.fail+', Serie n. '+c.series+', box attuale: '+BOXES[c.box].t+'.');
 if(role==='gm'&&PRIV&&!noSecret){
  L.push('— PREPARAZIONE SEGRETA (solo per te) —\nDove: '+(PRIV.where||'—')+'\nChi: '+(PRIV.who||'—')+'\nStakes: '+PRIV.stakes+'\nEsito A: '+PRIV.a+'\nEsito B: '+PRIV.b+'\nPersonaggi:\n'+(PRIV.chars||'—')+(PRIV.notes?'\nNote: '+PRIV.notes:''));
 }
 return L.join('\n');
}
function logText(){
 const rows=LOG.slice(-24).map(e=>{
  const m=e.meta||{};
  if(e.type==='scene')return 'SCENA '+m.scene+' ('+m.loc+') GM: '+e.text;
  if(e.type==='gm')return 'GM: '+e.text;
  if(e.type==='tb')return pcName(G)+': '+e.text;
  if(e.type==='sys')return '['+e.text+']';
  if(e.type==='roll')return '[d10='+m.v+' '+TYPES[m.type].label+' numero '+m.n+' → '+(m.ok?'riuscito':'fallito')+']';
  if(e.type==='conflict')return '[CONFLICT '+TYPES[m.type].label+', Pace '+m.pace+', Goal: '+m.goal+']';
  if(e.type==='ooc'&&e.who==='tb'&&!isChat(e))return '[nota fuori gioco della giocatrice: '+e.text+']';
  return '';
 }).filter(Boolean).map(s=>s.length>700?s.slice(0,700)+'…':s);
 return rows.join('\n')||'(ancora niente)';
}
function chatText(){
 const rows=LOG.filter(isChat).slice(-8).map(e=>(e.who==='gm'?'GM':'Giocatrice')+': '+e.text);
 return rows.length?rows.join('\n'):'';
}
const askHelp=()=>(G.ask&&G.ask.at===G.logN)?' Hai già chiesto un chiarimento su questa mossa e la risposta è nei CHIARIMENTI: ora rispondi tu, con l’interpretazione più ragionevole; "ask" resta null.':' Se la mossa della giocatrice è davvero ambigua (non è chiaro a chi parla, se tenta un’azione o dichiara solo un’intenzione, se è una domanda a te come GM e non ai PNG, oppure contraddice la fiction stabilita), invece di rispondere puoi farle UNA domanda breve fuori gioco in "ask", lasciando "text" vuoto. Non usarla per dettagli che puoi decidere tu.';
const TASKS={
 pc_create:()=>'Crea la tua trollbabe. "number" va da 2 a 9: più basso = più brava in magia, più alto = più brava a combattere. Per fight/magic/social usa solo i valori ammessi. "loc" è il numero del luogo verso cui sta camminando: '+LOCS.map(l=>l.id+' '+l.name).join(', ')+'. Per capelli, corna, abiti, equipaggiamento e due oggetti (uno umano, uno troll: personali, non preziosi) scrivi descrizioni brevi e vivide.',
 gm_prep:()=>'Prepara in segreto l’avventura per '+G.locName+' al Scale '+G.scale+' ('+SCALES[G.scale-1]+'). "where": immagini concrete del luogo. "who": chi c’è (umani, troll o entrambi) e cosa fa: nessun luogo è vuoto. "stakes": una persona, luogo o cosa della taglia del Scale che qualcuno vuole (NON un obiettivo di trama, NON qualcosa che riguarda la trollbabe). "a" e "b": due esiti concreti e opposti degli Stakes, senza come né perché. "characters": 3–5 personaggi con nome e ciò che vogliono, legati tra loro (parentele, rivalità, desideri) in modo da stringere attorno agli Stakes. Il misto umani/troll funziona meglio; ogni tanto un elemento strano che accentui la tensione emotiva degli Stakes. Nei campi di testo scrivi al massimo 60 parole ciascuno.',
 scene_open:()=>(G.scene===0?'È la prima scena: la storia si apre con la trollbabe che cammina verso il luogo; mostra il luogo e al massimo una presenza, senza mettere già in scena la posta in gioco. ':'')+'Apri la scena: dì dove siamo, le circostanze immediate e chi c’è. Massimo 50 parole, al più un PNG che agisce o parla, e fermati dove la trollbabe può rispondere. '+(G.scene>0?'Rispetta la richiesta di scena della giocatrice, tranne se qualcuno si sta già muovendo per cercarla: in quel caso inizia nel punto dell’interruzione. ':'')+'In "npcs" elenca i nomi dei PNG con nome che introduci. "heal": true solo se la richiesta era una scena di cura e la concedi (se il luogo la rende problematica, concedila comunque: potrai chiamare un conflitto).',
 gm_respond:()=>'È il tuo turno di GM. Una sola mossa, massimo 50 parole, che lasci alla giocatrice il tempo di rispondere (niente eventi a catena, un solo PNG che parla alla volta). Reagisci a ciò che la trollbabe ha appena fatto o detto: descrivi ciò che si vede e le azioni e parole dei PNG (di parte, espliciti su ciò che vogliono). Applica il test dei Conflitti: se a un personaggio non sta bene che l’azione di lei vada come dichiara, o un gesto mette sotto stress il suo rapporto con gli Stakes, o un PNG agisce contro di lei, chiama il conflitto: "conflict" con type e pace (altrimenti null). Se lo chiami, fermati PRIMA dell’esito: descrivi solo l’istante dell’azione e la reazione del PNG, mai il risultato (niente «cade morto», «la scure lo colpisce»). Se la scena è a una pausa naturale o i personaggi hanno cambiato luogo, "end_scene": true. Se gli Stakes hanno raggiunto una condizione finale, "end_adventure": true. Se la trollbabe è incapacitata, chiudi la scena. Se la giocatrice ha deciso di lasciare il luogo, decidi se qualcuno cerca di fermarla (conflict) oppure "end_adventure": true. In "npcs" i nomi dei nuovi PNG con nome.'+askHelp(),
 table_talk:()=>'Sei al tavolo, fuori dal gioco: la giocatrice ti parla da persona a persona (la sua domanda è nelle NOTE), non è la trollbabe che parla ai PNG. Rispondi come GM, in prima persona, senza narrare e senza far parlare i PNG. Chiarisci la fiction già stabilita (età, distanze, chi è presente, cosa si vede o si sente). Se ti fa notare un’incoerenza o un errore, riconoscilo e correggi la fiction in modo esplicito («Hai ragione: …»): la correzione vale da ora in poi. Puoi fissare piccoli dettagli coerenti come faresti al tavolo, ma non rivelare la preparazione segreta (Stakes, esiti, retroscena, segreti dei PNG): se la domanda tocca un segreto, dì che si può scoprire in gioco. Non fare mosse, non far avanzare la scena, non chiamare conflitti. Massimo 60 parole.',
 tb_act:()=>'È il tuo turno: dì o fai qualcosa di coerente con chi è la tua trollbabe e con ciò che sta succedendo. Se vuoi un conflitto (cioè agisci per ottenere qualcosa da qualcuno o contro qualcuno), compila "conflict" con type, pace e goal (null altrimenti). "leave": true solo se vuoi davvero lasciare il luogo. "ask_end": true se la scena ti sembra conclusa.',
 tb_request:()=>'La scena è finita. Dì dove vuoi andare o cosa vuoi fare nella prossima scena (una frase). "heal": true se sei ferita o incapacitata e vuoi che sia una scena di cura.',
 goal:()=>'Il GM ha dichiarato un conflitto '+TYPES[G.conflict.type].label+'. Dichiara il tuo Goal: un risultato attivo che coinvolge qualcun altro o qualcosa, detto in generale, non passivo e non troppo specifico.',
 fair_gm:()=>'Fair and clear: descrivi cosa fanno i PNG avversari all’inizio di questo conflitto e dichiara apertamente tutto ciò che si oppone alla trollbabe e può farle del male (avversari, ambiente, magia, anche ciò che finora era nascosto): ciò che non dici adesso non potrai introdurlo dopo. Non decidere l’esito. Massimo 70 parole.',
 fair_tb:()=>'Fair and clear: descrivi cosa fa la tua trollbabe all’inizio di questo conflitto (azione di apertura, vivida). Non decidere l’esito. Massimo 50 parole.',
 narr_gm:()=>G.conflict.kind==='success'?'Il Goal della trollbabe è RIUSCITO. Narra il successo con una sola immagine forte, nello stile con cui la giocatrice l’ha giocata. Niente nuove azioni di PNG né nuovi conflitti. Massimo 50 parole.':'La trollbabe è INCAPACITATA (Goal fallito). Narra in modo ostile ma coerente (con il tipo di conflitto e con ciò che è accaduto) che cosa le succede e come finisce a terra o in balia degli avversari. Usa solo minacce e mezzi già dichiarati nel Fair and clear: niente nuove rivelazioni. Massimo 60 parole.',
 narr_tb:()=>{const k=G.conflict.kind;return k==='alt_incap'?'Il terzo roll-again è RIUSCITO: il Goal resta perso e la trollbabe è incapacitata, ma tu descrivi in che circostanze meno gravi si ritrova (es. riesce a trascinarsi da un amico). Massimo 50 parole.':'Il tiro è FALLITO ('+(k==='inconv'?'scomodata':'ferita')+'). Narra il fallimento: il Goal sta cedendo (è la sostanza), '+(k==='inconv'?'la scomodità':'la ferita')+' è un dettaglio e deve avere senso per il tipo di conflitto e per ciò che è accaduto. Poi decidi: "continue": false = ti fermi, il Goal fallisce; true = rischi un roll-again con una delle voci disponibili ("item" = id esatto) e nella narrazione descrivi come la usi. Rischiare ti espone a ferita e incapacità: fallo se il Goal ti sta a cuore.';},
 decide_tb:()=>G.conflict.kind==='incap'?'Sei incapacitata (il GM ha narrato). Puoi accettare ("accept": true) oppure giocare l’ultimo roll-again ("accept": false, "item" = id esatto, "text" = come lo usi, max 40 parole) per attenuare la sorte.':'Il terzo roll-again è fallito: resta la narrazione del GM ("die": false) oppure dichiari la morte della trollbabe ("die": true) e la descrivi in "text" (max 40 parole). Scegli la morte solo se è ciò che il personaggio vuole davvero.',
 rel_offer:()=>'Il conflitto è finito. Puoi legarti a un personaggio che era presente (alleato "ally", avversario "opp", amante "lover"). "form": true solo se ha senso per la tua trollbabe. "name": un PNG con nome già in scena oppure un anonimo ("uno dei guerrieri"). "text": come interagisce con lei subito dopo (max 40 parole).',
 ending:()=>'L’avventura finisce ('+(G.endWhy||'')+'). Scegli quale esito degli Stakes avviene ("a" o "b") se non si è risolto in gioco, e scrivi l’epilogo: cosa succede al luogo su scala più grande (max 90 parole), senza nuove scene.',
 interim:()=>'Tra un’avventura e l’altra. "delta": -1, 0 o 1 per il tuo numero. "drop": id delle Relationship che sciogli (lista, anche vuota). "scaleUp": true per far salire il Scale di 1. "loc": numero del luogo dove vai ora: '+LOCS.map(l=>l.id+' '+l.name).join(', ')+'.'
};

const LIGHT=['goal','fair_gm','fair_tb','rel_offer','interim','tb_request','decide_tb'];
const tierFor=t=>(AI.tier==='default'&&LIGHT.indexOf(t)>=0)?'quick':AI.tier;
async function callAI(role,task,schema,extra,own){
 const ch=role==='gm'?chatText():'';
 const prompt=[role==='gm'?GM_RULES:TB_RULES,'=== STATO ===\n'+stateText(role,task==='gm_prep'),'=== DIARIO RECENTE ===\n'+logText(),ch?'=== CHIARIMENTI FUORI GIOCO (accordi sulla fiction: valgono) ===\n'+ch:'',extra?'=== NOTE ===\n'+extra:'','=== COMPITO ['+task+'] ===\n'+TASKS[task](),'Rispondi SOLO con un oggetto JSON, senza altro testo, di questa forma:\n'+schema].filter(Boolean).join('\n\n');
 // la chat ha un proprio controller: «Ferma» e la pausa riguardano solo il gioco
 const ctl=new AbortController();if(!own)AI.ctl=ctl;
 try{return await sample.json(prompt,{modelTier:tierFor(task),signal:ctl.signal,cache:false});}
 finally{if(!own)AI.ctl=null;}
}
async function answerChat(text,re){
 const q=re&&LOG.find(e=>e._id===re);
 AI.chatBusy=true;AI.chatErr=null;AI.chatPending=null;render();
 try{
  const r=await callAI('gm','table_talk','{"text":"…"}','Domanda della giocatrice: «'+text+'»'+(q?'\nSi riferisce a questo passaggio: «'+q.text+'»':''),true);
  const t=str(r.text,900);if(!t)throw {code:'empty_completion'};
  await A.ooc('gm',t,{chat:1});
 }catch(e){AI.chatErr=aiErrText(e);AI.chatPending={text:text,re:re};console.error(e);}
 finally{AI.chatBusy=false;render();}
}
function aiErrText(e){
 const c=e&&e.code;
 if(c==='not_granted'||c==='sampling_disabled'||c==='not_declared')return 'L’uso di Claude è stato negato o non è disponibile per questa pagina. Riabilitalo dalle autorizzazioni e riprova.';
 if(c==='bad_key')return 'La chiave Anthropic non è valida, oppure non ha credito. Impostane un’altra dalla scheda «Altro».';
 if(c==='network')return 'Non riesco a raggiungere Anthropic: controlla la connessione e riprova.';
 if(c==='rate_limited')return 'Troppe richieste o limite di utilizzo raggiunto: attendi un po’ e riprova.';
 if(c==='invalid_json'||c==='empty_completion')return 'L’IA non ha risposto in modo leggibile. Riprova.';
 if(c==='refused')return 'L’IA ha rifiutato questa richiesta. Riprova.';
 return 'Errore dell’IA'+(e&&e.message?': '+e.message:'.')+' Riprova.';
}
const PREP_SCHEMA='{"where":"…","who":"…","stakes":"…","a":"…","b":"…","characters":[{"name":"…","want":"…"}],"notes":"…"}';
function prepFromAI(r){
 const chars=(Array.isArray(r.characters)?r.characters:[]).slice(0,6).map(c=>str(c&&c.name,40)+' — '+str(c&&c.want,160)).join('\n');
 return {where:str(r.where,500),who:str(r.who,500),stakes:str(r.stakes,200)||'Qualcosa che qualcuno vuole',a:str(r.a,160)||'Esito A',b:str(r.b,160)||'Esito B',chars:chars,notes:str(r.notes,400)};
}
const aiSeat=s=>G.seats[s].kind==='ai';
function itemHelp(){return 'Voci disponibili (usa l’id esatto): '+availableItems(G).map(i=>i.id+' = '+i.label).join('; ')+'.';}
function pickItem(x){
 const items=availableItems(G);if(!items.length)return null;
 const s=String(x||'');
 return (items.find(i=>i.id===s)||items.find(i=>i.label.toLowerCase().indexOf(s.toLowerCase())===0&&s)||items[0]).id;
}
const J={
 pcCreate:{label:'L’IA crea la trollbabe…',async run(seq){
  const r=await callAI('tb','pc_create','{"name":"…","number":5,"fight":"unarmed|melee|missile","magic":"troll|human","social":"scary|sexy|fun|insightful|feisty|perky|remote|fierce","hair":"…","horns":"…","hum":"…","troll":"…","cloth":"…","kit":"…","loc":4}');
  fresh(seq);
  await A.createPC({name:str(r.name,30)||'Skah',number:intIn(r.number,2,9,5),magic:pickK(r.magic,IMP_MAGIC,'troll'),fight:pickK(r.fight,IMP_FIGHT,'melee'),social:pickK(r.social,IMP_SOCIAL,'fierce'),hair:str(r.hair,60)||'—',horns:str(r.horns,60)||'—',hum:str(r.hum,80)||'—',troll:str(r.troll,80)||'—',cloth:str(r.cloth,80)||'—',kit:str(r.kit,80)||'—'},intIn(r.loc,1,11,1));
 }},
 gmPrep:{label:'L’IA prepara l’avventura (in segreto)…',async run(seq){
  const r=await callAI('gm','gm_prep',PREP_SCHEMA);
  fresh(seq);
  await A.savePrep(prepFromAI(r));
 }},
 sceneOpen:{label:'Il GM apre la scena…',async run(seq){
  const r=await callAI('gm','scene_open','{"text":"…","npcs":["…"],"heal":false}');
  fresh(seq);
  const t=str(r.text,1400);if(!t)throw {code:'empty_completion'};
  await A.openScene(t,Array.isArray(r.npcs)?r.npcs:[],!!r.heal);
 }},
 gmRespond:{label:'Il GM sta rispondendo…',async run(seq){
  const r=await callAI('gm','gm_respond','{"text":"…","npcs":["…"],"conflict":null,"end_scene":false,"end_adventure":false,"ask":null}\nSe chiami un conflitto: "conflict":{"type":"fighting|magic|social","pace":2}');
  fresh(seq);
  const q=str(r.ask,400);
  if(q&&!(G.ask&&G.ask.at===G.logN)){
   await A.ooc('gm',q,{chat:1,ask:1});
   await tx(g=>{if(g.step!=='scene_play')return false;g.ask={open:true,at:g.logN};},seq);
   return;
  }
  const t=str(r.text,1400);if(!t)throw {code:'empty_completion'};
  const ct=r.conflict&&pickK(r.conflict.type,TYPES,null);
  await tx((g,push)=>{
   if(g.step!=='scene_play')return false;
   addNpcs(g,Array.isArray(r.npcs)?r.npcs:[]);
   push('gm','gm',t);g.turn='tb';
   if(ct&&g.pc.status!=='incap'){startConflict(g,push,'gm',{type:ct,pace:intIn(r.conflict.pace,1,3,2),goal:''});return;}
   if(r.end_adventure){const why=g.leaving?'La trollbabe lascia il luogo.':'Il GM conclude l’avventura.';g.leaving=false;beginEnd(g,push,why);return;}
   if(r.end_scene||g.pc.status==='incap'){push('sys','','Fine della scena.');g.step='scene_request';}
  },seq);
 }},
 tbAct:{label:'La trollbabe sta agendo…',async run(seq){
  const r=await callAI('tb','tb_act','{"text":"…","conflict":null,"leave":false,"ask_end":false}\nSe vuoi un conflitto: "conflict":{"type":"fighting|magic|social","pace":2,"goal":"…"}');
  fresh(seq);
  const t=str(r.text,900);if(!t)throw {code:'empty_completion'};
  await A.say('tb',t,[]);
  const ct=r.conflict&&pickK(r.conflict.type,TYPES,null);
  if(ct&&str(r.conflict.goal,200)&&G.pc.status!=='incap')await A.declare('tb',{type:ct,pace:intIn(r.conflict.pace,1,3,2),goal:str(r.conflict.goal,200)});
  else if(r.leave)await A.leave();
  else if(r.ask_end)await A.askEnd();
 }},
 tbRequest:{label:'La trollbabe decide dove andare…',async run(seq){
  const r=await callAI('tb','tb_request','{"text":"…","heal":false}');
  fresh(seq);
  await A.request(str(r.text,300),!!r.heal&&G.pc.status!=='ok');
 }},
 goal:{label:'La trollbabe dichiara il Goal…',async run(seq){
  const r=await callAI('tb','goal','{"goal":"…"}');
  fresh(seq);
  const t=str(r.goal,200);if(!t)throw {code:'empty_completion'};
  await A.setGoal(t,'keep');
 }},
 paceKeep:{label:'…',async run(seq){fresh(seq);await A.paceAdj('keep');}},
 fairGM:{label:'Il GM descrive gli avversari…',async run(seq){
  const r=await callAI('gm','fair_gm','{"text":"…"}');fresh(seq);
  const t=str(r.text,700);if(!t)throw {code:'empty_completion'};await A.fairSay('gm',t);
 }},
 fairTB:{label:'La trollbabe apre il conflitto…',async run(seq){
  const r=await callAI('tb','fair_tb','{"text":"…"}');fresh(seq);
  const t=str(r.text,700);if(!t)throw {code:'empty_completion'};await A.fairSay('tb',t);
 }},
 fairOkGM:{label:'…',async run(seq){fresh(seq);await A.fairOk('gm');}},
 fairOkTB:{label:'…',async run(seq){fresh(seq);await A.fairOk('tb');}},
 roll:{label:'La trollbabe tira il dado…',async run(seq){await sleep(900);fresh(seq);await A.roll(d10());}},
 narrGM:{label:'Il GM narra…',async run(seq){
  const r=await callAI('gm','narr_gm','{"text":"…"}',G.conflict.roll?'Ultimo tiro: '+G.conflict.roll.v+'.':'');fresh(seq);
  const t=str(r.text,700);if(!t)throw {code:'empty_completion'};await A.narrGM(t);
 }},
 narrTB:{label:'La trollbabe narra…',async run(seq){
  const k=G.conflict.kind;
  const r=await callAI('tb','narr_tb',k==='alt_incap'?'{"text":"…"}':'{"text":"…","continue":false,"item":"id"}',k==='alt_incap'?'':itemHelp());fresh(seq);
  const t=str(r.text,700);if(!t)throw {code:'empty_completion'};
  const it=(k!=='alt_incap'&&r.continue)?pickItem(r.item):null;
  await A.narrTB(t,it?{item:it}:null);
 }},
 decideTB:{label:'La trollbabe decide…',async run(seq){
  const k=G.conflict.kind;
  const r=await callAI('tb','decide_tb',k==='incap'?'{"accept":true,"item":"id","text":"…"}':'{"die":false,"text":"…"}',k==='incap'?itemHelp():'');fresh(seq);
  if(k==='incap'){const it=r.accept===false?pickItem(r.item):null;await A.decide(it?{item:it,text:str(r.text,500)||'Si aggrappa a ciò che ha.'}:{});}
  else await A.decide(r.die&&str(r.text,500)?{die:true,text:str(r.text,500)}:{});
 }},
 relsAuto:{label:'…',async run(seq){fresh(seq);const m={};(G.conflict.relCosts||[]).forEach(x=>{m[x.id]=x.status;});await A.confirmRels(m);}},
 relOffer:{label:'La trollbabe guarda chi le sta intorno…',async run(seq){
  const r=await callAI('tb','rel_offer','{"form":false,"name":"…","type":"ally|opp|lover","text":"…"}');fresh(seq);
  const n=str(r.name,60);
  if(r.form&&n)await A.relPropose({name:n,type:pickK(r.type,REL_TYPES,'ally'),text:str(r.text,400)});
  else await A.relSkip();
 }},
 relApprove:{label:'…',async run(seq){fresh(seq);await A.relApprove(G.scene>=3);}},
 ending:{label:'Il GM chiude l’avventura…',async run(seq){
  const r=await callAI('gm','ending','{"outcome":"a","text":"…"}');fresh(seq);
  const o=r.outcome==='b'?'b':'a';
  await A.finishEnding(PRIV&&PRIV[o]?PRIV[o]:(o==='a'?'Esito A':'Esito B'),str(r.text,900),PRIV);
 }},
 interim:{label:'La trollbabe si rimette in cammino…',async run(seq){
  const r=await callAI('tb','interim','{"delta":0,"drop":[],"scaleUp":false,"loc":4}','Relationship (id = nome): '+(G.rels.filter(x=>!x.dead).map(x=>x.id+' = '+x.name).join('; ')||'nessuna'));fresh(seq);
  const rels={};(Array.isArray(r.drop)?r.drop:[]).forEach(id=>{rels[String(id)]='drop';});
  await A.interim({delta:intIn(r.delta,-1,1,0),rels:rels,scaleUp:!!r.scaleUp,loc:intIn(r.loc,1,11,1)});
 }}
};
function nextAIJob(){
 const g=G,c=g.conflict;
 switch(g.step){
  case 'tb_create':return aiSeat('tb')?J.pcCreate:null;
  case 'gm_prep':return aiSeat('gm')?J.gmPrep:null;
  case 'scene_open':return aiSeat('gm')?J.sceneOpen:null;
  case 'scene_play':if(askOpen(g))return null;if(aiSeat('gm')&&((g.turn||'tb')==='gm'||g.pc.status==='incap'))return J.gmRespond;if((g.turn||'tb')==='tb'&&aiSeat('tb')&&g.pc.status!=='incap')return J.tbAct;return null;
  case 'scene_request':return aiSeat('tb')?J.tbRequest:null;
  case 'rel_offer':return aiSeat('tb')?J.relOffer:null;
  case 'rel_approve':return aiSeat('gm')?J.relApprove:null;
  case 'ending':return aiSeat('gm')?J.ending:null;
  case 'interim':return aiSeat('tb')?J.interim:null;
  case 'conflict':
   if(!c)return null;
   switch(c.stage){
    case 'goal':return aiSeat('tb')?J.goal:null;
    case 'pace':return aiSeat('gm')?J.paceKeep:null;
    case 'fair':{
     if(aiSeat('tb')){
      if(!c.fair.tb)return J.fairTB;
      if(c.fair.gm&&!c.fair.tbOk)return J.fairOkTB;
     }
     if(aiSeat('gm')){
      if(!c.fair.gm&&c.fair.tb)return J.fairGM;
      if(c.fair.tb&&c.fair.gm&&!c.fair.gmOk)return J.fairOkGM;
     }
     return null;}
    case 'roll':return aiSeat('tb')?J.roll:null;
    case 'narr_gm':return aiSeat('gm')?J.narrGM:null;
    case 'narr_tb':return aiSeat('tb')?J.narrTB:null;
    case 'decide_tb':return aiSeat('tb')?J.decideTB:null;
    case 'rels':return aiSeat('tb')?J.relsAuto:null;
   }
 }
 return null;
}
AI.tab=rid(8);
// una sola scheda alla volta fa giocare l’IA (lease di 45 s, rinnovato a ogni mossa)
async function driverLease(){
 try{
  const r=await db.doc('locks/'+CODE+'-ai').acquire({holder:UID+':'+AI.tab,ttlMs:45000});
  return !!(r&&r.acquired);
 }catch(e){return true;}
}
async function aiTick(){
 if(!G||!sample||AI.busy||AI.paused||!isDriver())return;
 if(AI.failedSeq===ver())return;
 const job=nextAIJob();if(!job)return;
 AI.busy=true;
 const got=await driverLease();
 AI.busy=false;
 if(!got){setTimeout(aiTick,6000);return;}
 if(!G||AI.paused||AI.busy)return;
 const seq=ver();
 AI.busy=true;AI.err=null;AI.label=job.label;lastKey='';render();
 try{await job.run(seq);}
 catch(e){
  if(e==='STALE'||(e&&e.code==='cancelled')){}
  else{AI.failedSeq=seq;AI.err=aiErrText(e);console.error(e);}
 }
 finally{
  AI.busy=false;AI.ctl=null;lastKey='';
  if(G&&ver()===seq&&!AI.err&&!AI.paused){AI.failedSeq=seq;AI.err='L’IA non è riuscita ad agire. Riprova.';}
  render();
  if(G&&ver()!==seq)setTimeout(aiTick,60);
 }
}

/* ================= avvio ================= */
async function boot(){
 setupEvents();
 AI.tier=ls.get('tb:tier')||'default';
 $('#start').classList.remove('hidden');
 $('#start').innerHTML='<div class="start-in"><h1 class="title">Trollbabe</h1><p class="lede">Mi collego al tavolo…</p></div>';
 const c=window.claude;
 const use=async n=>{try{return c&&c.use?await c.use(n):null;}catch(e){return null;}};
 net=window.__tbNet||null;
 db=await use('db');user=await use('user');sample=await use('sample');room=await use('room');downloads=await use('downloads');
 if(!db){
  $('#start').innerHTML='<div class="start-in"><h1 class="title">Trollbabe</h1><p class="lede">Questa pagina funziona solo aperta dentro Claude, con l’accesso ai dati condivisi attivo. Aprila dal link dell’artifact in Claude e accedi.</p></div>';
  return;
 }
 let id=null;try{id=user?await user.id():null;}catch(e){}
 UID=id||localId();
 showStart();
}
if(window.__TB_TEST__){window.__TB={A:A,ACT:ACT,D:D,get G(){return G;},get LOG(){return LOG;},get AI(){return AI;},get PRIV(){return PRIV;},get ROLE(){return ROLE;},ranges:ranges,rollOk:rollOk,relCost:relCost,expected:expected,availableItems:availableItems,nextAIJob:nextAIJob,aiTick:aiTick,askOpen:askOpen,ui:ui,openGame:openGame,showStart:showStart,TASKS:TASKS};}
boot();
})();
