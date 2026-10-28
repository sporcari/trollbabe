# Trollbabe — tavolo online

Una partita a *Trollbabe* per due posti, la trollbabe e il GM, ciascuno occupabile da una persona o dall’IA.
Un solo file `index.html`, tutto nel browser, senza server.

## Come si gioca

- **Due persone.** Chi crea la partita sceglie «Un’altra persona» e passa il codice di 5 lettere. L’altra persona sceglie «Entra con un codice». Il collegamento è diretto tra i due browser (PeerJS, come in Frenemies): chi ha creato la partita deve avere la pagina aperta mentre l’altro entra. Se la linea cade, il secondo giocatore si riconnette da solo. Se l’host chiude e riapre la pagina, ritrova partita e ruolo da «Le tue partite».
- **Contro l’IA.** Serve una chiave Anthropic (sk-ant-…), che la pagina chiede alla prima risposta dell’IA. Resta solo in memoria della scheda: non viene salvata e non viene mai inviata all’altro giocatore. Le chiamate sono a carico di chi gioca.
- **Dove sono i dati.** Ogni browser conserva la propria copia della partita nel `localStorage`. La preparazione segreta del GM resta solo sul browser del GM e non viene mai trasmessa.

## Limiti

- Per giocare in due servono entrambi collegati nello stesso momento (non c’è un server che tenga la partita).
- Il collegamento PeerJS usa il servizio pubblico di segnalazione; dietro reti molto restrittive può non riuscire.
- Il codice della partita è l’unica chiave d’ingresso: una volta occupati i due posti, l’host rifiuta chiunque non sia uno dei due.

## Pubblicazione su GitHub Pages

```sh
cd ~/sviluppo && mkdir trollbabe && cd trollbabe
# copia qui index.html e README.md
git init -b main && git add . && git commit -m "Trollbabe online"
gh repo create sporcari/trollbabe --public --source=. --push
```

Poi su GitHub: Settings → Pages → «Deploy from a branch» → `main` / `/ (root)`.
L’indirizzo sarà `https://sporcari.github.io/trollbabe/`.
Senza `gh`: crea il repository vuoto sul sito, poi `git remote add origin git@github.com:sporcari/trollbabe.git && git push -u origin main`.

## Sviluppo

I sorgenti sono in `src/`; `index.html` e `dist/` si generano. `npm install && npm test` assembla e lancia i 19 test. Vedi `CLAUDE.md` per l'architettura e le decisioni.
