# The Dark Chronicles — Analisi tecnica pre-pubblicazione

**Progetto:** RetroAvia — The Dark Chronicles (Vite + JS vanilla, canvas 2D, ~230 KB di sorgenti)
**Data analisi:** 15 settembre 2026
**Metodo:** lettura integrale di `src/` (44 file), controllo sintattico di tutti i moduli ES, simulazione headless della fisica reale di `Player.js` su tutte le 8 mappe, verifica dell'integrità dei dati di quiz/livelli, ispezione degli screenshot di gameplay.

---

## 1. Verdetto sintetico

L'architettura è **solida e sopra la media** per un progetto di questo tipo: separazione netta dei moduli, game loop a delta-time con clamp, fisica del personaggio con coyote time / jump buffer / jump cut, hitbox dedicate (`hurtBounds` vs `bounds`), macchina a stati del boss a 4 fasi, audio procedurale senza asset. Il codice è documentato meglio del 95% dei progetti hobbistici.

Ho verificato la geometria dei livelli con un simulatore che pilota le classi `Player`/`Platform` reali provando ~90 piani di salto diversi da ogni piattaforma: **tutti i cristalli delle 8 dimensioni risultano raggiungibili e tutti i gap superabili con le abilità disponibili in quel momento**. È un risultato notevole e significa che non hai problemi di level design bloccanti.

I problemi veri **non sono nel motore di gioco, ma nel modello commerciale e nell'esperienza mobile**. Tre cose, oggi, ti impedirebbero di pubblicarlo come strumento promozionale funzionante:

1. I codici sconto sono generabili all'infinito, da chiunque, in pochi secondi.
2. Il gioco promette di mostrare i codici sbloccati nel menu, ma il menu non li mostra da nessuna parte.
3. In verticale su smartphone il gioco è di fatto ingiocabile — ed è lì che giocherà la maggior parte dei tuoi clienti.

Sotto trovi tutto in ordine di priorità, con riferimenti a file e riga.

---

## 2. 🔴 P0 — Da risolvere prima di pubblicare

### 2.1 I codici sconto sono infinitamente generabili (rischio economico reale)

`src/rewards/rewards.js:16-23`, `src/core/Game.js:384-399`

Il codice è generato interamente lato client:

```js
return `${prefix}-${nameHash}${timestamp.slice(-3)}-${random}`;
```

Nessuna firma, nessuna validazione server, nessun limite. Tre vie di abuso, in ordine di banalità:

- **Rigiocare il livello 8.** Dopo aver finito, `bestLevel` diventa 9 ma viene riportato a 8 (`Game.js:183`, `MainMenu.js:7`). Il menu dice "Continua — Dimensione 8", si rigioca l'ultimo livello, e `showReward` genera **un nuovo RETRO5 ogni volta**. 4-5 minuti a codice, all'infinito.
- **"Azzera progressi"** e rifare i livelli 4 e 8.
- **Aprire i DevTools.** Il bundle è pubblico: chiunque legga `generateRewardCode` sa che il formato è `RETRO5-XX123-ABCD` e può inventarne quanti ne vuole senza nemmeno aprire il gioco.

**Cosa fare (in ordine di costo crescente):**

- *Minimo indispensabile, costo zero:* una serverless function su Vercel (`/api/claim`) che riceve punteggio + livello e restituisce un codice firmato (HMAC con un segreto in variabile d'ambiente), salvato in un KV/Upstash con un contatore. Il client non genera più nulla. Vercel te la dà gratis nello stesso deploy.
- *Alternativa pragmatica se non vuoi backend:* smetti di far generare codici al gioco. Mostra invece **un codice-sessione non spendibile** (es. `TDC-4-AB12`) che il cliente deve mandarti su Instagram, e sei tu a rispondere con il codice vero dallo store. Cambia solo il testo del modale ed elimina il rischio al 100%. Il modale già invita a mandarlo su Instagram (`Modals.js:137`), quindi il flusso lo hai già.
- *In ogni caso:* blocca la rigiocabilità premiata. Se `save.data.unlockedRewards` contiene già un RETRO3/RETRO5, non rigenerarlo — mostra quello già ottenuto.

### 2.2 I codici sbloccati non sono visibili da nessuna parte

`src/ui/MainMenu.js:8` è l'**unico** punto in cui `unlockedRewards` viene letto, e lo usa solo come booleano per decidere l'etichetta del bottone.

Ma la schermata di vittoria dice testualmente (`Modals.js:164`):

> "Controlla i codici sconto sbloccati nel menu!"

Il menu non ha nessuna sezione codici. Se il cliente chiude la scheda senza copiare il codice, **lo perde per sempre**. Su un gioco il cui unico scopo è distribuire sconti, questo è il bug più costoso in assoluto.

**Fix:** una sezione "🎁 I tuoi codici" nel `MainMenu`, che elenca `save.data.unlockedRewards` con un bottone copia per ciascuno (riusa la funzione `copy` già scritta in `Modals.js:121-128`). Un'ora di lavoro.

### 2.3 Non esiste un link allo store

Il modale premio parla di "nostro store" (`Modals.js:137`) e il menu linka solo Instagram (`rewards.js:26`). Il gioco è un funnel di conversione a cui **manca la destinazione**.

**Fix:** aggiungi `STORE_URL` in `rewards.js` e un bottone `🛒 Vai allo store e usa il codice` nel `RewardModal` e nel `GameCompleteModal`, con UTM (`?utm_source=game&utm_campaign=darkchronicles`) per poter misurare quanto converte davvero.

### 2.4 In verticale su smartphone il gioco è ingiocabile

`src/core/Game.js:1042-1044`

```js
_scale() { return this.renderer.height / WORLD_HEIGHT; }   // WORLD_HEIGHT = 575
```

La scala è agganciata **solo all'altezza**. Su un iPhone in verticale (390×844): scala = 1,47 → la finestra visibile è larga **266 px di mondo**. Il giocatore è largo 30 px e le piattaforme 100-200 px: vedi poco più di una piattaforma alla volta, non hai idea di dove stai saltando, e i tasti touch coprono la striscia giocabile. Il tuo screenshot `D-mobile-controls.png` lo mostra esattamente: il 70% dello schermo è cielo vuoto e la piattaforma successiva è fuori campo.

**Fix (scegline uno):**

- **Il più veloce:** overlay "🔄 Ruota il dispositivo" quando `matchMedia('(orientation: portrait)')` e `isTouchDevice()`. Due ore, risolve il 90% del problema.
- **Il più corretto:** scala = `min(height/WORLD_HEIGHT, width/MIN_VIEW_WIDTH)` con `MIN_VIEW_WIDTH ≈ 900`, così in verticale il mondo si rimpicciolisce per farci stare la larghezza minima giocabile, con letterbox sopra/sotto. Da fare insieme al punto 4.1 (spreco verticale), perché sono lo stesso problema.

### 2.5 I controlli touch spariscono su tablet

`src/style/ui.css:489-491`

```css
@media (min-width: 900px) { .ra-mobile-controls { display: none; } }
```

Un iPad in orizzontale (1024-1366 px) è touch ma largo più di 900: i controlli vengono nascosti e **il gioco diventa impossibile da giocare**. Stesso problema su tablet Android e su molti laptop touch.

**Fix:** sostituisci la media query con `@media (hover: hover) and (pointer: fine)`, oppure — meglio ancora — togli la regola CSS e lascia decidere `isTouchDevice()` in `Game.beginPlaying:338`, che già fa la cosa giusta.

### 2.6 Non si può scrivere uno spazio nel nome dell'eroe

`src/core/InputManager.js:31`

```js
if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
```

Il `preventDefault` è incondizionato e il listener è su `window`, quindi vale anche mentre il giocatore sta scrivendo nel campo nome del menu: **spazio e frecce sono bloccati nell'input di testo**. "Dark Knight" è impossibile da digitare.

**Fix:** in cima a `_onKeyDown`:

```js
const t = e.target;
if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
```

---

## 3. 🟠 P1 — Bug funzionali confermati

| # | Problema | File | Fix |
|---|---|---|---|
| 1 | **Le dimensioni 6, 7 e 8 non hanno tema colore.** `theme.css` definisce `[data-dimension]` solo da 1 a 5; Zeta, Eta e Omega ricadono sul ciano di default, quindi HUD e bottoni non sono più coordinati con la palette del livello. | `style/theme.css:38-42` | Aggiungi le righe 6/7/8 leggendo i colori da `world/palettes.js` (zeta `#c15cff`, eta `#ffe066`, omega `#ff3b3b`). |
| 2 | **La barra del boss si sovrappone all'HUD cristalli.** Entrambe sono centrate in alto: nel tuo `3_omega_arena.png` si vede il punteggio spuntare da dietro la barra. | `ui/BossBar.js:79-83` vs `style/ui.css:245-251` | Sposta la barra boss sotto l'HUD (`top: 70px`) o sposta il gruppo cristalli a destra. |
| 3 | **Torretta sepolta nella piattaforma (Eta).** Il nemico a `(630, 235)` compenetra la piattaforma `(585, 230, 130×20)` per 15 px verticali. Tutte le altre torrette poggiano correttamente (`y = platform.y - h`). | `world/levels.js:385` | `y: 235` → `y: 204`. |
| 4 | **I proiettili attraversano la geometria.** Né `Projectile.update` né `Game._resolveProjectiles` testano le piattaforme: i colpi delle torrette passano attraverso i pavimenti (percepito come colpo ingiusto) e i tuoi colpi raggiungono il boss attraverso i muri dell'arena. | `entities/Projectile.js`, `core/Game.js:902-917` | Nel loop di update dei proiettili, marca `dead = true` su intersezione con una piattaforma non `gone`. ~15 righe. |
| 5 | **Una sola eccezione congela il gioco per sempre.** `_tick` chiama `update()` e `render()` *prima* di rischedulare il rAF: se una qualsiasi riga lancia un errore, il frame successivo non viene mai richiesto e lo schermo resta bloccato senza messaggio. | `core/GameLoop.js:35-47` | Sposta `requestAnimationFrame(this._tick)` in cima a `_tick`, e avvolgi update/render in try/catch che logga e mostra un toast. |
| 6 | **Lo sfondo del menu resta della dimensione precedente.** `showMainMenu` non azzera `this.level`, quindi `render()` continua a usare `level.data.key` come tema mentre il CSS torna a `data-dimension="1"`: sfondo rosso Omega con accenti ciano. | `core/Game.js:104-119` e `1053` | `this.level = null;` in `showMainMenu()`. |
| 7 | **Il punteggio non si azzera dopo un Game Over.** `triggerGameOver` → `onRetry` → `loadLevel` non tocca `this.score`, quindi morire ripetutamente gonfia il punteggio e il `bestScore` salvato. | `core/Game.js:414-426` | Azzera o riporta al valore di inizio livello. |
| 8 | **ESC non chiude la pausa.** L'input viene consumato solo dentro `_updateGameplay`, che non gira in stato `paused`: si esce solo col mouse. Su un platform da tastiera è controintuitivo. | `core/Game.js:527` | Gestisci `consumePausePressed()` anche in stato `paused` → `resume()`. |
| 9 | **`aria-live="polite"` su tutto `#ui-root`.** Ogni cambio schermata fa rileggere l'intera UI agli screen reader (compresi i testi lunghi della storia). | `index.html:19` | Sposta l'attributo solo sul contenitore dei toast. |
| 10 | **AudioContext non riagganciato.** Lo sblocco audio è un listener one-shot rimosso dopo il primo evento; su iOS il contesto torna `suspended` quando l'utente cambia app, e non viene più ripreso. | `core/Game.js:87-89` | Chiama `audio.unlock()` anche su `visibilitychange` quando la pagina torna visibile. |
| 11 | Ramo morto in `_applyDamage`: gestisce `chargeTelegraph`/`charge`, ma il danno è possibile solo in stato `vulnerable`. Il commento di `justEnraged` dice ancora `null \| 2 \| 3` mentre le fasi sono 4. | `entities/Boss.js:61`, `151` | Pulizia/commento. |

---

## 4. 🎨 Grafica e presentazione

### 4.1 Il problema numero uno: dal 40% al 70% dello schermo è vuoto

Guarda `B-gameplay-level1.png`: tutto il livello è schiacciato nel terzo inferiore e sopra c'è solo cielo. Il motivo è strutturale: la camera segue **solo l'asse X** (`Camera.y` è dichiarato e mai usato, `core/Camera.js:6`) e `WORLD_HEIGHT` è fisso a 575 mentre le piattaforme dei livelli avanzati stanno tra y 130 e y 300. Nell'arena finale, sotto il pavimento (y 380) restano 195 px di nero morto.

È la singola modifica che cambia di più la percezione di qualità del gioco. Tre opzioni, cumulabili:

- **Camera verticale.** Un `damp` su `camera.y` che segue il giocatore con una dead zone, più clamp sui limiti del livello. ~30 righe in `Camera.js` + un `ctx.translate(0, -camera.y)` in `Game.render`.
- **Altezza mondo per livello.** Ogni livello dichiara la sua `worldHeight` calcolata dai suoi estremi, invece della costante globale.
- **Riempire il vuoto.** Elementi di sfondo di media distanza (silhouette di strutture, nebbie, detriti fluttuanti) e un layer di primo piano sfocato che scorre più veloce: è quello che dà profondità e nasconde il vuoto anche senza toccare la camera.

### 4.2 Parallax e piattaforme troppo piatti

Lo sfondo è essenzialmente puntini su gradiente (`world/backgrounds.js`, 6 gradienti totali per 9 temi). Le piattaforme sono barre a tinta unita con un bordo neon. Otto dimensioni "visivamente distinte" oggi si distinguono quasi solo per la tinta.

Suggerimenti concreti, tutti proceduali (nessun asset da scaricare, coerenti con la scelta architetturale):
- 3 layer di parallax per dimensione invece di 1 (lontano / medio / vicino) con velocità 0.15 / 0.4 / 1.2.
- Texture sulle piattaforme: pattern ripetuto disegnato una volta su una `OffscreenCanvas` per palette e riusato con `createPattern` (costo zero a runtime, vedi §5).
- Bordi e angoli: smussi, luci d'accento sul lato illuminato, ombra proiettata sotto la piattaforma.
- Elementi ambientali animati per tema (cascate di dati in Alpha, cenere in Gamma, pioggia digitale in Zeta).

### 4.3 Menu principale: la call-to-action è sotto la piega

Nel tuo `1_main_menu.png` (960×540) si vede il titolo, la mappa e il campo nome — ma **il bottone "Inizia l'avventura" non è visibile** e le carte classe sono tagliate. Il pannello ha `max-height: 88vh` con `overflow-y: auto`, quindi tecnicamente si scrolla, ma senza nessuna affordance visiva: un visitatore su laptop 13" potrebbe non capire che deve scorrere.

Inoltre la mappa dei livelli è **tagliata a destra**: 8 nodi da 40 px + 7 collegamenti da 22 px = 474 px in un track largo ~460 px (`ui.css:142-192`). Il nodo 8 è mozzato.

**Fix:** compatta il menu — mappa più piccola (nodi 28 px) o a due righe, classi come riga orizzontale compatta, CTA sempre visibile in fondo al pannello con `position: sticky`. E un'ombra/sfumatura sul bordo inferiore del pannello che segnali lo scroll.

### 4.4 Assenze da colmare prima del lancio

- **Nessun Open Graph / Twitter Card.** Condividendo il link su Instagram, WhatsApp o Telegram non esce nessuna anteprima. Per un gioco di marketing è un'occasione persa enorme. Servono `og:title`, `og:description`, `og:image` (1200×630) e `twitter:card`.
- **Font Google caricati da CDN.** Bloccano il primo render e, in UE, il caricamento da `fonts.gstatic.com` comporta il trasferimento dell'IP dell'utente a Google — punto su cui in Germania ci sono state condanne. Auto-ospitali (`@fontsource/orbitron`, `@fontsource/rajdhani`) e usa `font-display: swap`: più veloce e più pulito.
- **Nessuna schermata di caricamento.** Tra il primo byte e il menu c'è uno schermo nero.
- **`prefers-reduced-motion` mai rispettato.** La funzione esiste (`utils/device.js:13`) ma non è usata da nessuna parte, e il gioco è pieno di glow pulsanti, shake e animazioni infinite (`ra-title-glow`). Una media query che disattiva le animazioni decorative è mezz'ora di lavoro.
- **`user-scalable=no`** (`index.html:5`) viola WCAG 1.4.4. Su un gioco è discutibilmente accettabile, ma sappilo.
- **Manca `apple-touch-icon`** e un `manifest.json`: senza, "Aggiungi a schermata Home" su iOS dà un'icona bianca. Con un manifest minimo il gioco si apre a schermo intero come un'app — perfetto per il tuo caso d'uso.

---

## 5. ⚡ Ottimizzazione

- **`shadowBlur` è il collo di bottiglia.** 38 occorrenze in `WorldRenderer.js` + 2 in `backgrounds.js`, molte dentro cicli per-entità. È l'operazione più costosa del canvas 2D: su un Android di fascia media con 30+ particelle e 6 nemici a schermo è il primo candidato per i cali di frame rate.
  **Fix:** pre-renderizza una volta sola cristallo, nemico, checkpoint e giocatore (glow incluso) su `OffscreenCanvas` per palette, e a runtime fai solo `drawImage`. Guadagno atteso: molto grande, lavoro contenuto.
- **20 `createLinearGradient`/`createRadialGradient` per frame** in `WorldRenderer` + 6 in `backgrounds`. I gradienti dipendono dalla palette, non dal frame: creali una volta e mettili in cache.
- **L'impostazione qualità esiste ma non fa nulla.** `settings.quality: 'auto'` (`SaveManager.js:19`) non è letta da nessun file. Collegala a un interruttore reale (glow on/off, densità particelle, cap del DPR) e mettila nel menu pausa: è la via più rapida per rendere il gioco fluido sui telefoni vecchi.
- **`ParticleSystem._spawn` usa `array.shift()`** quando si raggiungono le 420 particelle (`ParticleSystem.js:11`): è O(n) e riallinea tutto l'array. Usa un buffer circolare o un pool con indice di scrittura.
- **Il DPR è cappato a 2** (`device.js:19`): buona scelta, ma su mobile considera 1.5.
- **Il bundle è già ottimo** (~132 KB di JS + 16 KB di CSS non compressi, zero dipendenze runtime). Non c'è niente da tagliare qui.

---

## 6. 🧹 Da rimuovere / pulire

- `utils/device.js:9` `isSmallScreen()` — mai usata.
- `utils/device.js:13` `prefersReducedMotion()` — mai usata (ma vedi §4.4: meglio usarla che toglierla).
- `entities/Enemy.js:165` `hit()` — mai chiamata; i nemici muoiono sempre in un colpo.
- `core/Camera.js:6` `this.y` — dichiarata, mai aggiornata, mai letta (ma vedi §4.1: meglio usarla).
- `ui/HUD.js:19` — c'è uno `<span class="ra-hud-score">` **vuoto** usato come separatore accanto a quello vero. Toglilo e usa un margine CSS.
- `world/levels.js:456` — il `goal` "fantasma" di Omega a `(1850, 230)` non è mai raggiungibile perché il portale scatta prima. Il commento lo spiega, ma vale la pena renderlo esplicito con un flag `unreachable: true` o spostarlo nell'arena.
- `legacy-v1/index-v1-backup.html` (176 KB) — tienilo fuori dal repository di deploy (o almeno fuori dalla root: Vite non lo include nel bundle, ma appesantisce il repo e confonde).
- **`README.md` è obsoleto e va riscritto.** Dice "5 dimensioni" (ne hai 8), "chiave `retroavia.dimensions.v2`" (è `v3`, `SaveManager.js:1`), "ricompense ai livelli 3 e 5" (sono 4 e 8, `rewards.js:10`). Non menziona classi, tutorial giocabile, arena del boss, lama al plasma, quiz. È il documento a cui tornerai fra sei mesi: vale un'ora.

---

## 7. 🎮 Note di game design

Non sono bug, ma incidono sulla conversione:

- **La difficoltà fuori dall'arena è molto bassa.** Il respawn al checkpoint **ricarica l'energia al massimo** (`Game.js:967`), i tentativi sono illimitati e la lama al plasma uccide qualsiasi nemico in un colpo con più portata di uno stomp. Per un gioco promozionale è la scelta giusta (non vuoi perdere clienti frustrati), ma sappi che è quasi impossibile perdere, e il senso di conquista del codice sconto ne risente. Se vuoi alzare la posta, fallo solo sul boss finale — che è già l'unica eccezione, per design esplicito.
- **Il quiz può togliere punti ma i punti non servono a niente.** Non sbloccano nulla, non c'è classifica, non c'è confronto. O li colleghi a qualcosa (una classifica locale, un badge nel menu, un terzo codice bonus sopra una soglia) o il malus è una punizione senza conseguenza.
- **98 domande di quiz** per una partita che ne mostra 7: ottimo margine contro la ripetizione. Ho verificato che non ci sono domande duplicate, risposte duplicate, indici `correct` fuori range o `fact` mancanti. Tutto pulito.
- **Il tutorial giocabile è un'ottima scelta** ed è isolato correttamente dal salvataggio. Valuta di proporlo automaticamente al primo avvio invece di lasciarlo come bottone secondario: chi arriva da Instagram non sa cos'è un coyote time.

---

## 8. ✅ Checklist di lancio

**Bloccanti**
- [ ] Risolvere la generazione dei codici sconto (§2.1) — scegliere fra backend firmato o codice-sessione da validare su Instagram
- [ ] Sezione "I tuoi codici" nel menu (§2.2)
- [ ] Link allo store con UTM (§2.3)
- [ ] Gestione dell'orientamento verticale su mobile (§2.4)
- [ ] Media query dei controlli touch (§2.5)
- [ ] `preventDefault` che non blocca gli input di testo (§2.6)

**Importanti**
- [ ] Temi colore dimensioni 6-8 (§3.1)
- [ ] Sovrapposizione barra boss / HUD (§3.2)
- [ ] Torretta sepolta in Eta (§3.3)
- [ ] `requestAnimationFrame` rischedulato per primo + try/catch (§3.5)
- [ ] Menu compattato, CTA sopra la piega, mappa non tagliata (§4.3)
- [ ] Open Graph + immagine social 1200×630 (§4.4)
- [ ] Font auto-ospitati (§4.4)
- [ ] README riscritto (§6)

**Prima di annunciarlo**
- [ ] `npm run build && npm run preview` e test completo della build di produzione
- [ ] Partita completa su iOS Safari e su Android Chrome, in orizzontale e in verticale
- [ ] Lighthouse mobile (obiettivo: performance > 85)
- [ ] Analytics leggero (Vercel Analytics o Plausible) con eventi: partita iniziata, livello 4 completato, livello 8 completato, codice copiato, click sullo store — così sai quanto converte davvero
- [ ] Pagina o sezione con i **termini della promozione**: validità dei codici, scadenza, cumulabilità, un codice per cliente. Non sono un avvocato e le regole italiane sulle operazioni a premi hanno casistiche specifiche: se il volume diventa significativo vale una verifica con il tuo commercialista
- [ ] `manifest.json` + `apple-touch-icon` per l'installazione da schermata Home
