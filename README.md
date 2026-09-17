# RetroAvia — The Dark Chronicles

Platform game a **8 dimensioni** con storia, nemici, boss a fasi, quiz tra un
livello e l'altro e **codici sconto reali** per i clienti RetroAvia.
Web app statica, nessuna dipendenza a runtime, build con Vite.

---

## Come funzionano i codici sconto

Questo è il cuore commerciale del progetto, quindi vale la pena essere espliciti.

- Le ricompense si sbloccano completando la **Dimensione 4** (`RETRO3`, sconto
  3% su ordini sopra 150€) e la **Dimensione 8** (`RETRO5`, sconto 5% su
  ordini sopra 180€). I dati vivono in `src/rewards/rewards.js`.
- I codici **non sono collegati a un checkout**. Il giocatore li invia per
  email a `retroaviaofficial@gmail.com` (la schermata ricompensa apre un
  messaggio già precompilato) e lo sconto viene applicato a mano, tenendo
  traccia di chi ha già riscosso.
- **Un giocatore, un codice per fascia, per sempre.** Il codice viene generato
  una sola volta e salvato in `rewardCodes` (`src/core/SaveManager.js`);
  rigiocare il livello 4 o il livello 8 rimostra lo stesso codice invece di
  generarne uno nuovo. Anche "Azzera progressi" lascia i codici al loro posto,
  proprio per non far arrivare richieste con codici diversi dalla stessa
  persona.
- Il giocatore ritrova sempre i suoi codici nel menu principale, nella sezione
  **"I tuoi codici sconto"**, con pulsante copia e pulsante invia-per-email.

> Se un giorno servisse blindare i codici lato server (firma HMAC, un solo
> utilizzo, scadenza), il punto in cui intervenire è `Game.showReward()` in
> `src/core/Game.js`: è l'unico posto da cui passa la generazione.

---

## Struttura del progetto

```
the-dark-chronicles/
├── index.html                 punto di ingresso + meta social + splash
├── public/                    asset statici copiati così come sono
│   ├── og-image.png             anteprima 1200×630 per i social
│   ├── icon-192/512.png         icone PWA
│   ├── apple-touch-icon.png     icona "Aggiungi a Home" iOS
│   ├── manifest.webmanifest     installabilità
│   └── robots.txt
├── test/                      verifiche headless (vedi sotto)
└── src/
    ├── main.js                bootstrap
    ├── style/                 tema colori, layout, UI, animazioni
    ├── core/
    │   ├── Game.js              macchina a stati, collisioni, regia
    │   ├── Renderer.js          canvas, scala adattiva, hook qualità
    │   ├── Camera.js            inseguimento orizzontale + verticale
    │   ├── GameLoop.js          loop a delta-time, resiliente agli errori
    │   ├── quality.js           livello grafico (auto/alta/leggera)
    │   ├── WorldRenderer.js     disegno di tutto ciò che sta nel mondo
    │   ├── ParticleSystem.js    particelle
    │   ├── AudioEngine.js       audio procedurale (Web Audio, zero file)
    │   └── SaveManager.js       progressi + codici sconto (localStorage)
    ├── entities/              player, nemici, boss, piattaforme, ostacoli
    ├── world/                 dati dei livelli, sfondi parallax, palette
    ├── narrative/             storia e 98 domande di quiz
    ├── rewards/               logica dei codici sconto
    └── ui/                    menu, HUD, overlay, modali, controlli touch
```

---

## Sviluppo locale

Richiede [Node.js](https://nodejs.org) 18 o superiore.

```bash
npm install
npm run dev        # http://localhost:5173, con hot reload
npm run build      # build statica in dist/
npm run preview    # prova la build di produzione in locale
npm test           # verifiche headless (vedi sotto)
```

### Le verifiche headless

`npm test` esegue quattro controlli, tutti senza browser e senza dipendenze:

| Comando | Cosa verifica |
|---|---|
| `test/run.mjs` | Avvia il gioco vero su un DOM/canvas simulato: menu, tutorial, tutti gli 8 livelli per 400 frame con input casuali, portale e arena del boss, codici sconto, pausa, punteggio, qualità grafica, resilienza del loop. Segnala qualsiasi eccezione o coordinata NaN finita sul canvas. |
| `test/viewports.mjs` | Rirenderizza tutto su 8 viewport reali (desktop, laptop, iPad, telefono orizzontale e verticale, ultrawide) e stampa quanto mondo è visibile su ciascuno. |
| `test/reachability.mjs` | Guida le classi `Player`/`Platform` reali con ~90 piani di salto diversi da ogni piattaforma, per dimostrare che ogni cristallo è raccoglibile e ogni salto fattibile con le abilità disponibili in quel punto. |
| `test/data-check.mjs` | Coerenza dei dati: nemici o checkpoint dentro la geometria, cristalli senza appoggio, checkpoint su piattaforme che si sgretolano, quiz con risposte duplicate o indice sbagliato. |

Se modifichi un livello, `npm test` è il modo più rapido per sapere se hai
rotto qualcosa prima ancora di aprire il browser.

---

## Dove intervenire per modifiche future

| Cosa vuoi cambiare | File |
|---|---|
| Testi della storia | `src/narrative/story.js` |
| Domande dei quiz | `src/narrative/quiz.js` |
| **Codici sconto, percentuali, soglie, email** | `src/rewards/rewards.js` |
| Layout dei livelli (piattaforme, nemici, cristalli) | `src/world/levels.js` |
| Colori e tema di ogni dimensione | `src/world/palettes.js` + `src/style/theme.css` |
| Sfondi parallax | `src/world/backgrounds.js` |
| Aspetto di personaggio, nemici, effetti | `src/core/WorldRenderer.js` |
| Difficoltà di salto e movimento | costanti in cima a `src/entities/Player.js` |
| Boss (fasi, pattern, vita) | `src/entities/Boss.js` |
| Inquadratura e zoom | `MIN_VIEW_W` / `MIN_VIEW_H` in `src/core/Renderer.js` |

> Attenzione: `src/style/theme.css` ha una riga `[data-dimension="N"]` per
> ciascuna delle 8 dimensioni. Se aggiungi un livello, aggiungi anche la sua
> riga, altrimenti l'interfaccia resta sul colore di default.

---

## Comandi di gioco

| Azione | Tastiera | Mobile |
|---|---|---|
| Muoviti | `←` `→` oppure `A` `D` | pad sinistro |
| Salta / doppio salto | `SPAZIO`, `W`, `↑` | pulsante grande |
| Scatto (dal livello 3) | `MAIUSC` o `K` | pulsante 💨 |
| Lama al plasma | `E` o `L` | pulsante ⚔️ |
| Fuoco a distanza | `F` o `J` | pulsante 🔫 |
| Pausa / riprendi | `ESC` o `P` | pulsante ⏸ |

Su telefono in verticale compare un invito a ruotare il dispositivo: si può
rifiutare e giocare comunque, con un campo visivo più stretto.

---

## Deploy su Vercel

Il progetto è già configurato (`vercel.json`, preset Vite, output in `dist/`).

1. Carica la cartella su GitHub (`git init` → `git add .` → `git commit` → push).
2. Su [vercel.com](https://vercel.com): **Add New… → Project** → importa il repo.
3. Vercel riconosce Vite da solo: lascia i default e clicca **Deploy**.

In alternativa, dalla CLI:

```bash
npm i -g vercel
vercel          # anteprima
vercel --prod   # produzione
```

### ⚠️ Da fare subito dopo il primo deploy

In `index.html` ci sono tre meta tag con un dominio segnaposto:

```html
<meta property="og:url"   content="https://the-dark-chronicles.vercel.app/" />
<meta property="og:image" content="https://the-dark-chronicles.vercel.app/og-image.png" />
<meta name="twitter:image" content="https://the-dark-chronicles.vercel.app/og-image.png" />
```

Sostituiscili con il dominio vero. `og:image` **deve** essere un URL assoluto:
WhatsApp, Telegram e LinkedIn non risolvono i percorsi relativi e mostrerebbero
il link senza anteprima — esattamente quando conta di più, cioè quando qualcuno
condivide il gioco.

Puoi verificare l'anteprima su
[opengraph.xyz](https://www.opengraph.xyz/) o con il debugger di Facebook.

---

## Font

Orbitron e Rajdhani arrivano da Google Fonts, caricati in modo **non bloccante**:
se il CDN è lento o irraggiungibile il gioco parte comunque con lo stack di
fallback definito in `src/style/theme.css`.

Per eliminare del tutto la dipendenza esterna — più veloce, e più pulito lato
GDPR, dato che il caricamento da `fonts.gstatic.com` trasferisce l'IP
dell'utente a Google:

```bash
npm i @fontsource/orbitron @fontsource/rajdhani
```

poi in `src/main.js`:

```js
import '@fontsource/orbitron/500.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import '@fontsource/rajdhani/400.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
```

e infine togli i `<link>` di Google Fonts da `index.html`.

---

## Note tecniche

- **Nessuna dipendenza a runtime**: solo Vite come strumento di build.
- **Grafica e audio 100% procedurali**: nessuna immagine di gioco e nessun
  file audio da scaricare. Gli unici asset sono le icone e l'anteprima social.
- **Salvataggio** in `localStorage`, chiave `retroavia.dimensions.v4`. Le
  chiavi `v2`/`v3` vengono migrate automaticamente al primo avvio, quindi
  nessun giocatore perde progressi o codici.
- **Qualità grafica adattiva**: `src/core/quality.js` sceglie da solo una
  fascia in base a memoria, core e densità di pixel del dispositivo; il
  giocatore può forzare "Alta" o "Leggera" dal menu di pausa. La fascia
  leggera disattiva il glow del canvas (`shadowBlur`, di gran lunga
  l'operazione più costosa) e dimezza le particelle.
- **`prefers-reduced-motion`** è rispettato: niente animazioni decorative,
  niente fuochi d'artificio, niente lampi di tempesta.
- **Il game loop è a prova di eccezione**: richiede il frame successivo prima
  di eseguire update/render, quindi un errore non congela più la pagina.
- **Accessibilità**: lo zoom della pagina non è bloccato, i controlli sono
  `<button>` veri con focus visibile, e solo i messaggi transitori passano da
  una live region (`#ui-announcer`) invece che tutta l'interfaccia.

---

## Prima di annunciarlo

- [ ] Sostituire il dominio nei meta OG (vedi sopra)
- [ ] `npm run build && npm run preview` e partita completa sulla build reale
- [ ] Prova su iOS Safari e Android Chrome, orizzontale e verticale
- [ ] Analytics leggero (Vercel Analytics o Plausible) con eventi: partita
      iniziata, livello 4 completato, livello 8 completato, codice copiato,
      codice inviato per email — così sai quanto converte davvero
- [ ] Una pagina o un post con i **termini della promozione**: validità dei
      codici, scadenza, cumulabilità, un codice per cliente
