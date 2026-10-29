# Trollbabe online — contesto per Claude Code

Tavolo online per *Trollbabe* (GdR di Ron Edwards; regole dal manuale 2023, *body text*; esempi e consigli dalla seconda stampa del 2009, Adept Press): due posti, la trollbabe e il GM;
ciascun posto è una persona oppure l'IA. Sviluppato da Saverio (Porcari) insieme a Claude in chat; da qui in poi si lavora in questo repository.
Lingua: tutto in italiano (interfaccia, commenti, messaggi di commit), con i termini del sistema in inglese (Stakes, Scale, Pace, Goal, Relationship, Fair and clear, roll-again).

## Due versioni dallo stesso codice
- `index.html`: versione per GitHub Pages (indirizzo previsto: https://sporcari.github.io/trollbabe/). Aggiunge `src/shim.js` e PeerJS.
- `dist/trollbabe-artifact.html`: versione per l'artifact dentro Claude (https://claude.ai/artifact/N97CGLN7L6ChUDDq6B4Exj), dove esiste già `window.claude` (db condiviso, `sample` per l'IA, `room`, `downloads`). Claude Code NON può pubblicarla: si ripubblica solo da claude.ai. Non cambiare il comportamento di quel percorso senza dirlo a Saverio.
- **Non modificare mai `index.html` o `dist/` a mano.** I sorgenti stanno in `src/`; poi `npm run build` (usa `python3 build.py`, che controlla anche la sintassi).

## File
- `src/head.html`: stile (carta e inchiostro, chiaro/scuro) e scheletro.
- `src/c1_core.js`: dati di gioco, regole pure (`ranges`, `rollOk`, `relCost`), scrittura condivisa (`tx`, `commit`, `deepDiff`), azioni `A.*`, `expected()`.
- `src/c2_ui.js`: schermata iniziale, creazione/ingresso partita, `render()`, pannelli `p*()`, gestori `ACT.*`, eventi.
- `src/c3_ai.js`: prompt (`GM_RULES`, `TB_RULES`, `TASKS`), `stateText`, lavori IA `J.*`, `nextAIJob`, `aiTick`, avvio (`boot`).
- `src/shim.js`: ricrea `window.claude` fuori da Claude: db locale replicato via PeerJS, `sample` con chiave Anthropic dell'utente, presenza, download.
- `test/`: banco di prova (vedi sotto).

## Architettura in breve
- Stato condiviso: documento `games/CODE` (campi `step`, `scene`, `turn`, `pc`, `rels` con `here`/`always`/`note`, `conflict{stage,kind,box,sb,fair{turn,round},step,...}`, `review`, `objection`, `seq`, `rev`) e diario in `games/CODE/log/NNNNNN-xxx`. Il diario cresce solo per aggiunte: un retcon è una voce `amend` con `meta.of` che sostituisce la voce indicata al momento di leggerla (`amendMap`, `textOf`); le voci `ooc` della chat laterale hanno `meta.chat` (più `ask` o `objection`). I dati privati (preparazione segreta del GM, indice delle partite) stanno in `data/users/<uid>/…` e **non vengono mai replicati né finiscono nei prompt della trollbabe**.
- Ogni mossa è `A.xxx()` → `tx()` clona lo stato, applica, poi `commit()` scrive le voci di diario e **solo i campi cambiati** (`deepDiff` + `update` con unione ricorsiva): due scritture simultanee non si cancellano. `ver()` = `seq:rev` fa da guardia. Le note fuori gioco scrivono solo il diario.
- Macchina a stati: `g.step` (`lobby, tb_create, gm_prep, scene_open, scene_play, scene_request, conflict, rel_offer, rel_approve, ending, interim`) e, nei conflitti, `conflict.stage` (`goal|pace|fair|step|roll|narr_gm|narr_tb|decide_tb|rels`). `expected()` dice chi deve agire; con `g.review` (il GM IA sta leggendo) o `g.objection` (eccezione aperta) il gioco è fermo.
- IA: `aiTick()` gira solo nel client dell'unico umano (con lease `locks/CODE-ai`); `nextAIJob()` sceglie il lavoro, `J.*` chiama `callAI()` e applica l'esito con le stesse azioni `A.*` dell'interfaccia. Se l'IA sbaglia: banner con «Riprova», nessun ciclo automatico.
- Interfaccia: bozze dei campi in `D` (si conservano ai ridisegni), `render()` ridisegna il pannello solo se cambia `ver|ui.rev|…`.
- Rete (solo `index.html`): l'host registra il peer `trollbabe-CODICE`; il guest si collega e invia `sync` con il proprio `uid`; l'host verifica (`allowed`) prima di rispondere e ignora scritture di chi non è verificato; poi ogni scrittura condivisa è replicata. Riconnessione automatica del guest ogni 4 s. Persistenza in `localStorage` (`tb:g:CODICE`, `tb:priv`).

## Decisioni sulle regole (dal manuale) e punti da verificare
- Test dei conflitti (deciso con Saverio): il GM chiede «mi sta bene che vada come dice lei?»; se no, conflitto e narrazione ferma prima dell'esito. La difficoltà non conta.
- Pace 3/2/1 = 3 su max 5 / 2 su max 3 / una Serie. Box della Serie: tiro iniziale → 1° roll-again (ferita) → 2° (incapacitata, narra il GM) → 3° (attenua o morte). Da ferita si parte dal box 1. Voci spuntate valide per tutta l'avventura.
- **Tabella dei costi delle Relationship**: confermata da entrambe le edizioni (2023 p. 48, 2009 p. 61): successo da scomodata → ferita; successo da ferita → illesa; fallimento da ferita → uccisa; fallimento da incapacitata → ferita. Il caso «fallimento da scomodata» non è nella tabella: diamo «ferita» (aggiunta nostra). Il giocatore può correggere in interfaccia.
- Prima di ogni tiro la trollbabe dice cosa fa: Fair and clear per il primo tiro, fase `step` (mossa del GM, poi azione della trollbabe) all'inizio di ogni Serie successiva, campo «Come ti aiuta» per ogni roll-again. Nelle Serie che non chiudono il conflitto il GM narra solo un avvicinamento al Goal (`lastSeries`).
- Fair and clear a turni: comincia la trollbabe; chi ha il turno accetta o modifica la propria dichiarazione e passa la mano; si parte quando entrambi accettano. Il GM IA rilegge la dichiarazione aggiornata; dopo tre giri a testa (`FAIR_ROUNDS`) accetta senza chiamare il modello. Ciò che il GM non dichiara qui non entra nel conflitto.
- Retcon: si correggono dettagli minori (età, date, distanze, chi era presente) per salvare la preparazione segreta e ciò che è stato decisivo; mai Stakes, esiti o retroscena; mai per bocca di un PNG. Ognuno emenda solo le proprie voci; il GM IA lo fa dalla chat laterale (`amend` in `table_talk`).
- Eccezioni del GM IA (solo con trollbabe umana): nelle mosse in scena (`objection` in `gm_respond`), nel Fair and clear e, con il compito leggero `review`, sui passi e sulle narrazioni della trollbabe nei conflitti. Vanno in chat e fermano il gioco finché lei non rettifica o il GM non le ritira. Solo violazioni chiare (informazioni nuove, Goal fallito ritentato nella scena, in scena anche azioni dei PNG decise da lei, nei conflitti un fallimento in cui il Goal avanza, alleato improvviso con nome); mai stile o colore.
- Veto sulle Relationship con PNG con nome: conta come «con nome» un nome che contiene, come parola intera, un PNG già nominato (`namedIn`). Il GM IA rifiuta nelle prime due scene e accetta dalla terza (`J.relApprove`, euristica mia; il manuale 2023 dice «di’ di no finché la situazione di partenza non è cambiata»). Aperto: farlo giudicare all'IA.
- Relationship: «Rinomina» nella scheda (la descrizione resta in `note`); gli alleati valgono come roll-again solo se sono in scena (`relHere`; tornano fuori scena a ogni nuova scena, salvo «l'accompagna sempre»); avversari e amanti sempre. Lo Scale delle Relationship (2023) non è implementato.
- La ferita ha senso rispetto al tipo di conflitto; la descrizione è salvata in `pc.hurt` e visibile all'IA finché non c'è una scena di cura.
- Il GM IA ha un «ritmo morbido»: aperture di circa 50 parole, un solo PNG che agisce o parla, una mossa per volta, nessuna spinta verso gli Stakes, niente aperture «a missione». È una scelta della casa: il 2023 dice «se un conflitto si può chiamare, chiamalo».
- L'incapacitata non entra in nuovi conflitti finché non c'è una scena di cura: il 2023 tace, il 2009 la farebbe tirare dall'ultimo box.
- Una sola trollbabe per partita (il capitolo 8 sulle trollbabe multiple non è implementato). Niente libreria di avventure già pronte.
- Magia: Saverio ricorda «la magia è sempre rischiosa»; non c'è in nessuna delle due edizioni. Lasciato com'è (scelta estetica da osservare in gioco).

## Convenzioni (obbligatorie)
- Tutto il testo che l'utente legge: apostrofo tipografico ’ e virgolette « » anche nelle stringhe inserite da script; mai `'` o `"` dritti nei testi visibili. Il testo dell'IA passa da `str()` che normalizza gli apostrofi.
- Ogni testo di utente o dell'IA mostrato nel DOM passa da `esc()`/`nl()`. Niente `innerHTML` con testo non escapato.
- La chiave Anthropic resta solo in memoria della scheda (come in Frenemies): mai in `localStorage`, nello stato condiviso, nel diario o nei prompt. Esiste un test che lo verifica.
- La preparazione segreta (`PRIV`) non entra mai nel documento condiviso né nei prompt della trollbabe IA.
- Per i compiti IA «leggeri» si usa il modello veloce (`LIGHT` in `c3_ai.js`).

## Test
`npm install` poi `npm test` (assembla e lancia tutto). `t*.js` provano la versione artifact con un runtime Claude simulato (`harness.js`: db condiviso finto, IA finta); `ts*.js` provano la versione GitHub con un PeerJS finto e `fetch` finto (`harness2.js`). `bots.js` fa giocare un GM e una trollbabe usando gli stessi gestori dei pulsanti. I test dipendono da piccole attese di sincronizzazione (`sleep`): se uno fallisce in modo casuale, riprova prima di cercare un difetto. Dopo ogni modifica alle regole o ai prompt: `npm test`. Con GM IA e trollbabe umana ogni test ha bisogno del mock di `review` (e di `step_gm` se c'è più di una Serie), e i tiri diretti devono aspettare che `G.review` sia vuoto. `t17`–`t24` coprono Serie intermedie, turni del Fair and clear, passo e «Come ti aiuta», retcon, eccezioni, Relationship ed esempi.

## Cosa NON è stato verificato
- Il vero PeerJS tra due reti diverse, e i vincoli di NAT (nessun server TURN).
- Le risposte di veri modelli Anthropic: i prompt sono stati scritti e provati solo con risposte finte. In particolare: se il GM IA chiama davvero i conflitti, se rispetta il ritmo morbido, se tiene conto della ferita, se nelle Serie intermedie non concede il Goal, se le eccezioni sono giuste e rare, se i retcon salvano la preparazione.
- I flussi nuovi (passo, Fair and clear a turni, retcon, eccezioni, presenza degli alleati, «Rinomina») sono provati solo con jsdom: mai visti in un browser.
- Il costo in partita del compito `review` (una chiamata leggera dopo ogni narrazione della trollbabe nei conflitti).
- Aspetto e uso su telefono: mai visti a schermo.
- Il salvataggio del diario (`downloads`) su un browser vero.

## Pubblicazione
Repository separato da Frenemies: `sporcari/trollbabe`, GitHub Pages dal branch `main`, cartella root. Non toccare `~/sviluppo/frenemies-on-the-road` (il suo `sw.js` copre tutto il suo percorso; il suo README parla di Netlify ma è un residuo: il sito vero è GitHub Pages).
