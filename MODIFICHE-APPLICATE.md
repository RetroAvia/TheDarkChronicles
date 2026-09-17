# The Dark Chronicles — Modifiche applicate

Tutti gli interventi del report di analisi sono stati implementati e verificati.
61 file scritti nella cartella del progetto. Questo documento è il registro di
cosa è cambiato e perché.

---

## Come verificare che tutto funzioni

```bash
npm install
npm test      # 4 suite di verifica automatiche, ~10 secondi
npm run dev   # e provalo
```

`npm test` esegue:

| Suite | Cosa fa |
|---|---|
| `test/run.mjs` | Avvia il **gioco vero** su un DOM/canvas simulato: menu, tutorial, tutti gli 8 livelli per 400 frame con input casuali, portale e arena del boss, codici sconto, pausa, punteggio, qualità grafica, resilienza del loop. Fallisce su qualsiasi eccezione o coordinata NaN. |
| `test/viewports.mjs` | Rirenderizza tutto su 8 viewport reali e stampa quanto mondo è visibile su ciascuno. |
| `test/reachability.mjs` | Guida le classi `Player`/`Platform` reali con ~90 piani di salto da ogni piattaforma: dimostra che ogni cristallo è raccoglibile. |
| `test/data-check.mjs` | Coerenza dei dati di livello e dei 98 quiz. |

Stato attuale: **tutte verdi, 0 problemi**.

Il gioco è stato anche eseguito in un Chromium reale e fotografato su 8
schermate diverse: nessun errore JavaScript.

---

## 1. Codici sconto — riprogettati attorno al flusso via email

Dato che i codici li ricevi via email e tieni traccia a mano di chi ha già
riscosso, il lavoro è andato in quella direzione invece che su un backend.

- **Un giocatore, un codice per fascia, per sempre.** Il codice viene generato
  una sola volta e salvato in `rewardCodes`. Rigiocare la Dimensione 4 o la 8
  rimostra *lo stesso* codice invece di generarne uno nuovo — prima ogni
  ripetizione ne creava uno diverso, e ti saresti trovato richieste multiple
  con codici diversi dalla stessa persona.
- **"Azzera progressi" non cancella i codici.** Stessa ragione.
- **Sezione "I tuoi codici sconto" nel menu principale**, con pulsante copia e
  pulsante "invia per email". Prima i codici venivano salvati ma non mostrati
  da nessuna parte, e la schermata di vittoria diceva comunque di cercarli nel
  menu: chi chiudeva la scheda perdeva il codice per sempre.
- **Email precompilata.** Il pulsante principale della schermata ricompensa
  apre un messaggio già pronto verso `retroaviaofficial@gmail.com` con codice,
  fascia di sconto, nome dell'esploratore e livello completato. Ti arriva tutto
  già formattato e identico ogni volta, così è facile da archiviare e cercare.
- **Schermata ricompensa riscritta**: l'email è ora l'azione primaria,
  Instagram resta come alternativa. Se rigiochi un livello premio, il testo lo
  dice chiaramente ("Avevi già sbloccato questa ricompensa").
- **Migrazione automatica dei salvataggi** `v2`/`v3` → `v4`: nessun giocatore
  esistente perde progressi né codici già ottenuti.
- Percentuali, soglie e handle Instagram: **invariati**, come richiesto.

---

## 2. Mobile — il problema più grosso, risolto

**Prima:** la scala del canvas era agganciata solo all'altezza. Su un iPhone in
verticale vedevi **266 px di mondo**: poco più di una piattaforma, senza sapere
dove stavi saltando.

**Ora:** la scala considera larghezza *e* altezza, con un minimo garantito di
campo visivo.

| Dispositivo | Prima | Dopo |
|---|---:|---:|
| iPhone verticale | 266 px | **760 px** |
| iPad orizzontale | 827 px | **980 px** |
| iPhone orizzontale | 1244 px | 1125 px |
| Desktop 1920×1080 | 1022 px | 980 px |

Sui dispositivi grandi il campo è leggermente più stretto ma **costante**: tutti
vedono la stessa porzione di mondo, quindi la difficoltà è la stessa per tutti.

Inoltre:

- **Invito a ruotare il dispositivo** su touch in verticale, con anteprima
  animata. È rifiutabile ("Gioca comunque in verticale") e la scelta viene
  ricordata — uno schermo bloccato senza via d'uscita è peggio di uno stretto.
- **I controlli touch non spariscono più su tablet.** La regola era
  `@media (min-width: 900px)`, che su un iPad in orizzontale nascondeva i
  comandi e rendeva il gioco impossibile. Ora dipende dal tipo di puntatore.
- **Bug scoperto guardando gli screenshot:** il pulsante 🔫 era *sempre*
  visibile su mobile fin dal livello 1, anche se l'abilità si sblocca solo
  nell'arena finale. La regola `.ra-touch-btn { display: flex }` batteva
  l'`[hidden]` del browser. Era un bug pre-esistente.
- HUD e pulsanti compattati sui telefoni bassi in orizzontale.

---

## 3. Inquadratura e grafica

**Il problema:** dal 40% al 70% dello schermo era cielo vuoto, perché la camera
seguiva solo l'asse X e l'altezza del mondo era una costante.

- **Camera verticale** con zona morta centrale, che si muove solo quando il
  giocatore esce davvero dalla banda centrale (una camera verticale nervosa dà
  il mal di mare).
- **Inquadratura sul contenuto reale del livello.** Ogni livello calcola il
  proprio riquadro dalle piattaforme che contiene, invece di usare un'altezza
  fissa: niente più mezzo schermo di cielo sopra i livelli bassi.
- La camera **non insegue più il giocatore nel vuoto**: se cadi, l'ultima cosa
  che vedi è il terreno che hai mancato, non gradiente vuoto.
- **Sfondi riscritti da zero**: 4 livelli di profondità per dimensione invece
  di uno — cielo a tre stop, campo stellare, due bande di sagome specifiche per
  tema (montagne, isole fluttuanti, torri, guglie) e un livello in **primo
  piano** che passa *davanti* all'azione (braci, pioggia digitale, cenere,
  pulviscolo). È quello che comunica davvero la profondità.
- **Piattaforme ridisegnate**: ombra portata, fughe incise nella superficie,
  bordo luminoso con ritorni sugli spigoli (si vede dove finisce l'appoggio),
  crepa visibile su quelle che si sgretolano, frecce discrete su quelle mobili.
- **Colori dell'interfaccia per le dimensioni 6, 7 e 8**, che mancavano del
  tutto: Zeta, Eta e Omega usavano il ciano di default mentre il livello era
  viola, oro o rosso sangue.
- **Barra del boss spostata sotto l'HUD**: prima erano entrambe centrate in
  alto e si sovrapponevano durante ogni scontro.
- **Pilastri dell'arena** ora ricavati dalla geometria vera dell'arena: erano
  disegnati a 3400 px di distanza dal combattimento.
- Le stelle sono **pre-renderizzate una volta** su una texture: 2-4 `drawImage`
  per frame invece di ~90 cerchi.

---

## 4. Menu principale

- **Il pulsante "Inizia" è ora sempre visibile**, ancorato in fondo al pannello.
  Prima, su un laptop da 13", la call to action principale del prodotto finiva
  sotto la piega senza nessun segnale che il pannello scorresse.
- **La mappa non è più tagliata**: 8 nodi + 7 collegamenti occupavano 474 px in
  una traccia da 460, quindi l'ultima dimensione era sempre mozzata.
- **Selezione del livello**: i nodi sbloccati sono cliccabili e puoi rigiocare
  qualsiasi dimensione già superata. Prima, chi finiva il gioco restava
  inchiodato su "Continua — Dimensione 8" senza modo di tornare indietro.
- Sezione codici sconto (vedi §1), etichetta sul campo nome, focus visibile,
  menu compattato sugli schermi bassi.

---

## 5. Bug funzionali corretti

| Problema | Correzione |
|---|---|
| **Non si poteva scrivere uno spazio nel nome dell'eroe** (la `preventDefault` globale colpiva anche il campo di testo) | I listener ignorano `input`/`textarea`/`contenteditable` |
| **Una sola eccezione congelava il gioco per sempre** (il frame successivo veniva richiesto solo dopo update+render) | Il loop richiede il frame *prima* di eseguire, con `try/catch` e un avviso visibile al giocatore |
| **I proiettili attraversavano la geometria** — le torrette sparavano attraverso i pavimenti, tu colpivi il boss attraverso i muri | I colpi muoiono dove incontrano una piattaforma, con scintilla d'impatto |
| **Torretta sepolta nella piattaforma** in Eta (`y:235` invece di `204`) | Corretta |
| **Sfondo del menu bloccato sulla dimensione precedente** | `this.level = null` al ritorno al menu |
| **Il punteggio si gonfiava a ogni Game Over** | Riportato al valore di inizio livello |
| **ESC non chiudeva la pausa** | ESC/P ora è un interruttore |
| **La schermata uscente restava cliccabile per 170 ms** durante la dissolvenza | Input disattivato appena inizia l'uscita |
| **Due cristalli obbligatori sospesi sul vuoto** nel livello 8, subito prima del boss | Il portale ora scatta più avanti (`triggerX` 1560 → 1745), così atterri sull'ultima piattaforma e i cristalli stanno su terreno solido |
| `aria-live` su tutta l'interfaccia (gli screen reader rileggevano ogni menu e ogni pagina di storia) | Solo i messaggi transitori passano da una live region dedicata |
| AudioContext mai ripreso dopo il background su iOS | Ripristinato al `visibilitychange` |

---

## 6. Prestazioni

- **Interruttore qualità reale** (`settings.quality` esisteva ma non faceva
  nulla). Rileva da solo la fascia dal dispositivo — memoria, core, densità di
  pixel — ed è forzabile dal menu di pausa: **Auto / Alta / Leggera**.
- La fascia leggera **disattiva il glow del canvas** (`shadowBlur`, di gran
  lunga l'operazione più costosa: c'erano ~40 punti che lo impostavano),
  dimezza le particelle e abbassa il cap del DPR. Implementato con un solo
  intercettore sul contesto 2D, senza toccare i 40 punti di disegno.
- Gradienti del cielo messi in cache invece di ricrearli a ogni frame.
- Sostituito `array.shift()` nel sistema particellare — era O(n) e scattava
  proprio quando il sistema era già sotto carico.
- `prefers-reduced-motion` **rispettato**: niente animazioni decorative,
  niente fuochi d'artificio, niente lampi. La funzione esisteva da sempre e
  non era usata da nessuna parte.

---

## 7. Pubblicazione

- **Anteprima social** (`public/og-image.png`, 1200×630) con meta Open Graph e
  Twitter Card: condividendo il link su Instagram o WhatsApp esce un'anteprima
  vera invece di un link nudo.
- **Manifest + icone**: il gioco si installa da "Aggiungi a schermata Home" e
  si apre a schermo intero in orizzontale.
- **Schermata di caricamento** al posto del rettangolo nero iniziale.
- **Font non bloccanti** con stack di fallback vero: se Google Fonts è lento o
  irraggiungibile il gioco parte comunque (verificato — la sandbox in cui l'ho
  fotografato non ha accesso a Google Fonts).
- Zoom della pagina non più bloccato (era una violazione WCAG 1.4.4), con
  `touch-action: manipulation` sui controlli per evitare lo zoom accidentale.
- `vercel.json` con header di cache e sicurezza.
- **README riscritto** da zero: era fermo a 5 livelli, chiave di salvataggio
  `v2` e ricompense ai livelli 3 e 5.

---

## ⚠️ Due cose che devi fare tu

1. **Sostituisci il dominio segnaposto** in `index.html` dopo il primo deploy:

   ```html
   <meta property="og:url"    content="https://the-dark-chronicles.vercel.app/" />
   <meta property="og:image"  content="https://the-dark-chronicles.vercel.app/og-image.png" />
   <meta name="twitter:image" content="https://the-dark-chronicles.vercel.app/og-image.png" />
   ```

   `og:image` deve essere un URL assoluto: WhatsApp, Telegram e LinkedIn non
   risolvono i percorsi relativi e mostrerebbero il link senza anteprima.

2. **La cartella `dist/` che hai ora è vecchia.** Rifai `npm run build` prima
   di pubblicare. La cartella `legacy-v1/` (176 KB) non finisce nel bundle ma
   conviene spostarla fuori dal repository.

---

## Rimasto in sospeso (consigliato, non urgente)

- **Analytics leggero** (Vercel Analytics o Plausible) con eventi: partita
  iniziata, livello 4 completato, livello 8 completato, codice copiato, codice
  inviato. È l'unico modo per sapere quanto converte davvero.
- **Termini della promozione** in una pagina o in un post: validità, scadenza,
  cumulabilità, un codice per cliente. Non sono un avvocato e le regole
  italiane sulle operazioni a premi hanno casistiche specifiche: se il volume
  cresce, vale una verifica con il tuo commercialista.
- **Self-hosting dei font** (comandi esatti nel README): più veloce e più
  pulito lato GDPR.
- **Il punteggio non serve ancora a niente.** Il quiz può togliere punti, ma i
  punti non sbloccano nulla e non c'è classifica. O li colleghi a qualcosa o il
  malus è una punizione senza conseguenza.
