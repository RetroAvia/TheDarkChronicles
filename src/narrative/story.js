// Narrative pass: every dimension carries a recurring antagonist (Xerath,
// glimpsed and referenced from Alpha onward rather than introduced cold at
// the end) so the arc reads as one escalating story instead of eight
// disconnected level intros. Prose stays tight — concrete sensory detail per
// dimension's visual theme, short paragraphs, no filler.

export const STORY = {
  intro1: {
    title: '🌌 DIMENSIONE ALPHA — IL RISVEGLIO',
    text: `Ti svegli dentro un cielo che non dovrebbe esistere: costellazioni di dati che sfarfallano, si spengono, rinascono altrove. L'Osservatorio Quantico ha perso il contatto con tre dimensioni nelle ultime dodici ore. Con la quarta, il segnale si è interrotto a metà frase.

Qualcosa si sta mangiando la realtà, un byte alla volta, e lascia dietro di sé un silenzio che non è mai del tutto vuoto — come se qualcosa, da qualche parte, stesse ancora guardando.

Sei l'ultimo Esploratore Dimensionale rimasto in servizio. I cristalli energetici sparsi in ogni dimensione sono l'unica cosa che può ristabilizzarla prima del collasso definitivo. Comincia da qui, dalle fondamenta: raccogli i cristalli di Alpha e raggiungi il portale. Il tempo, per una volta, non è una metafora.`,
    level: 1,
    actionText: 'INIZIA MISSIONE'
  },
  outro1: {
    title: '✨ ALPHA STABILIZZATA',
    text: `Il cielo smette di sfarfallare. Da qualche parte, sotto il tuo codice, senti la dimensione riprendere fiato.

I cristalli hanno fatto più che stabilizzare Alpha: hanno ricalibrato il tuo esoscheletro. I nuovi propulsori rispondono a un secondo impulso a mezz'aria — non dovrai più affidarti a un solo salto per attraversare il vuoto.

Ma la calma dura poco. Nei log dell'Osservatorio compare una firma che nessun sensore aveva mai registrato prima: una presenza che si muove tra le dimensioni come se le conoscesse, come se le avesse progettate lei stessa. Per ora ha un nome soltanto nei rapporti riservati: Xerath. La Dimensione Beta è la prossima a spegnersi.`,
    level: 1,
    actionText: 'CONTINUA'
  },
  intro2: {
    title: '🌊 DIMENSIONE BETA — LE ISOLE FLUTTUANTI',
    text: `Beta non ha un pavimento. È un arcipelago di isole energetiche sospese nel vuoto quantico, alla deriva su correnti che nessuna equazione dell'Osservatorio riesce ancora a descrivere — la gravità qui è un suggerimento, non una legge.

Le entità corrotte hanno imparato dai tuoi movimenti in Alpha. Ti aspettano su piattaforme che scivolano, salgono, si allontanano proprio mentre atterri. Un laser pulsa a intervalli regolari su uno dei varchi: la prima cosa in questo viaggio che può ucciderti restando immobile.

I cristalli di Beta pulsano di un'energia più densa del solito, quasi innervosita. Raccoglili prima che l'arcipelago si disgreghi — e prima che Xerath finisca di studiarti.`,
    level: 2,
    actionText: 'INIZIA MISSIONE'
  },
  outro2: {
    title: '🏆 BETA PURIFICATA',
    text: `Le isole tornano a brillare, stabili per la prima volta da giorni. Anche i vecchi Guardiani Digitali dell'arcipelago — presenze che di norma ignorano gli intrusi — si fermano un istante a osservarti passare.

L'energia dei cristalli sblocca un nuovo modulo: un propulsore laterale a scatto, abbastanza rapido da spingerti oltre i varchi più ampi e da attraversare un colpo nemico nell'istante in cui lo attivi. Ti servirà presto — più di quanto pensi.

Un messaggio ti raggiunge attraverso un canale che non dovrebbe poter esistere ancora: non parole, ma la sensazione precisa di essere osservato con interesse, non con odio. Xerath non ti considera un intruso da eliminare. Ti considera un esperimento in corso. La Dimensione Gamma — Il Guanto di Sfida — ti aspetta, ed è lì che le entità corrotte smettono di reagire e cominciano a coordinarsi.`,
    level: 2,
    actionText: 'CONTINUA'
  },
  intro3: {
    title: '⚔️ DIMENSIONE GAMMA — IL GUANTO DI SFIDA',
    text: `Il calore qui non è simulato: crinali di dati infuocati corrono a vista d'occhio, e ogni piattaforma su cui metti piede porta i segni di un logoramento che si accelera sotto i tuoi passi — pochi istanti, poi cede.

Questa è la prima dimensione dove le entità corrotte non si limitano a pattugliare: cacciano. Una ti ha già individuato prima ancora che tu finisca di orientarti, e da qualche parte più avanti una sentinella automatica aspetta con la pazienza di una macchina che non si stanca mai.

Supera il Guanto e la strada verso Delta si apre — ma i cristalli qui non regalano nulla: ogni singolo passo va guadagnato.`,
    level: 3,
    actionText: 'INIZIA MISSIONE'
  },
  outro3: {
    title: '🎖️ EROE DELLA GAMMA',
    text: `Il Guanto è superato. Dietro di te, i crinali infuocati si spengono in una brace che assomiglia quasi a un applauso.

Xerath non si è fatta vedere neanche una volta in tutta Gamma. Non è fuga: è calcolo. I rapporti dell'Osservatorio parlano ora di altre quattro dimensioni ancora attive, e di un pattern nei dati che nessuno vuole nominare ad alta voce — le difese stanno diventando precise, chirurgiche, come se qualcuno le stesse costruendo apposta per te. Delta è la prossima, e qualcosa in fondo a quella griglia ti aspetta di persona per la prima volta.`,
    level: 3,
    actionText: 'CONTINUA'
  },
  intro4: {
    title: '🎯 DIMENSIONE DELTA — PRECISIONE ASSOLUTA',
    text: `Delta è una griglia infinita che si estende in ogni direzione, esatta fino all'ultimo decimale — e proprio per questo, spietata. Le piattaforme sono più piccole, alcune scivolano lungo binari invisibili, e un solo calcolo sbagliato ti rimanda dritto nel vuoto quantico.

Qui le entità corrotte cacciano in coppia: una ti fiuta e ti insegue appena ti avvicini, un'altra tiene la distanza e colpisce da lontano nel momento esatto in cui abbassi la guardia. Non è più improvvisazione. È una tattica, ed è stata costruita per te.

E in fondo alla griglia, i sensori dell'Osservatorio registrano qualcosa che pattuglia in cerchio, immobile per ore e poi improvvisamente non più: il Custode del Nucleo, la prima vera sentinella di Xerath. Non un semplice ostacolo — un guardiano. Dimostra di essere pronto.`,
    level: 4,
    actionText: 'INIZIA MISSIONE'
  },
  outro4: {
    title: '🏅 MAESTRO DELLA PRECISIONE',
    text: `Il Custode del Nucleo si spegne in un lampo di dati frammentati, e per un istante l'intera griglia rallenta, come se anche lei avesse trattenuto il respiro. Non era un semplice nemico più grande degli altri: era un avvertimento, e l'hai superato.

Gli archivi digitali registrano la tua impresa senza margine di errore: sei un Maestro Esploratore, il primo a superare Delta — e il suo Custode — senza un solo cristallo perso. Come riconoscimento, la Confederazione Digitale sblocca il primo codice sconto reale per RetroAvia: guadagnato, non regalato.

Ma i rapporti dell'Osservatorio non si fermano qui: oltre Delta si aprono altre tre dimensioni mai catalogate prima — Epsilon, Zeta, Eta — comparse dal nulla proprio mentre Xerath si preparava a incontrarti. Come se stesse costruendo altro tempo. O altre difese.`,
    level: 4,
    actionText: 'CONTINUA'
  },
  intro5: {
    title: '💧 DIMENSIONE EPSILON — LA CASCATA DIGITALE',
    text: `Epsilon scroscia. Cascate di dati puri precipitano da piattaforme che si dissolvono e riformano al ritmo della corrente, e l'intera dimensione sembra scivolare costantemente verso il basso — combattere la deriva è parte del percorso, non un dettaglio.

Le entità corrotte qui si muovono in sciami piuttosto che in pattuglie isolate: cacciatori a terra, sentinelle in volo, torrette nascoste dietro il velo d'acqua digitale. Xerath ha smesso di testare le tue abilità una alla volta — ora le mette tutte alla prova insieme.

I cristalli di Epsilon brillano di un blu quasi liquido. Raccoglili prima che la corrente li trascini oltre la tua portata.`,
    level: 5,
    actionText: 'INIZIA MISSIONE'
  },
  outro5: {
    title: '🌊 SIGNORE DELLA CORRENTE',
    text: `La cascata rallenta fino a un flusso calmo, quasi silenzioso. Per la prima volta da quando hai messo piede in questa dimensione, riesci a sentire il tuo stesso respiro.

Epsilon si stabilizza, ma i sensori dell'Osservatorio rilevano qualcosa di nuovo nel rumore di fondo: un pattern che si ripete, si contorce, si riscrive da solo. Zeta — la prossima dimensione — non risponde a nessuna mappatura standard. È come se fosse stata progettata per confondere chiunque provasse a leggerla dall'esterno. Un labirinto, letteralmente.`,
    level: 5,
    actionText: 'CONTINUA'
  },
  intro6: {
    title: '🧠 DIMENSIONE ZETA — IL LABIRINTO NEURALE',
    text: `Zeta non è un luogo: è una rete di pensieri corrotti, intrecciata in corridoi che si piegano su se stessi. Le piattaforme seguono una logica che sembra quasi biologica — sinapsi che si accendono, tracciati che pulsano, percorsi che esistono solo per un istante prima di richiudersi.

Torrette e cacciatori presidiano ogni intersezione della rete, come anticorpi digitali che identificano la tua presenza come un'infezione da espellere. Ogni salto richiede precisione assoluta: qui un errore non ti fa cadere nel vuoto, ti fa perdere all'interno del labirinto stesso.

Xerath parla di nuovo, appena percettibile, come un pensiero che non è il tuo: "Vediamo se riesci a pensare più in fretta di me."`,
    level: 6,
    actionText: 'INIZIA MISSIONE'
  },
  outro6: {
    title: '🔓 MENTE LIBERATA',
    text: `Il labirinto si distende, i corridoi smettono di piegarsi su se stessi. Per un solo istante, senti — più che vedere — l'intera rete neurale di Zeta riconoscerti come qualcosa di diverso da un'infezione: un ospite che ha meritato di passare.

Ma la vittoria ha un retrogusto amaro: Zeta non era un ostacolo casuale. Era un test di velocità mentale, e Xerath ora sa esattamente quanto sei veloce. I log dell'Osservatorio segnalano che resta una sola dimensione conosciuta prima di Omega: Eta, l'Ultima Soglia. Il nome, questa volta, non sembra una metafora.`,
    level: 6,
    actionText: 'CONTINUA'
  },
  intro7: {
    title: "🚪 DIMENSIONE ETA — L'ULTIMA SOGLIA",
    text: `Eta è tesa come una corda pronta a spezzarsi. Ogni piattaforma, ogni nemico, ogni varco sembra costruito apposta per mettere alla prova tutto quello che hai imparato finora, tutto insieme, senza pause tra una sfida e l'altra.

Le entità corrotte qui non pattugliano più zone isolate: collaborano, si coprono a vicenda, colpiscono in sequenza. È la dimensione più dura che l'Osservatorio abbia mai mappato — e proprio per questo, l'ultima prima della soglia finale.

Oltre Eta c'è solo Omega. E oltre Omega, per la prima volta in questo viaggio, Xerath stessa ti aspetta di persona.`,
    level: 7,
    actionText: 'INIZIA MISSIONE'
  },
  outro7: {
    title: '🏆 GUARDIANO DELLA SOGLIA',
    text: `L'ultima piattaforma di Eta si stabilizza sotto i tuoi piedi. Il silenzio che segue non è vuoto: è un'attesa.

Hai superato ogni prova che portava fin qui. Poi, per la prima volta, Xerath parla non ai sensori dell'Osservatorio, ma a te, direttamente, attraverso ogni schermo che hai vicino: una sola frase, priva di rabbia, quasi rispettosa. "Hai superato ogni prova che ho costruito. Resta solo l'ultima, quella che ho costruito per me stessa." Omega ti aspetta, e con lei, la fine di questa storia — in un modo o nell'altro.`,
    level: 7,
    actionText: 'CONTINUA'
  },
  intro8: {
    title: '💀 DIMENSIONE OMEGA — LO SCONTRO FINALE',
    text: `Omega è dove tutto è cominciato e dove tutto deve finire: il nucleo della corruzione, l'anticamera del trono di Xerath. Il cielo qui non ha stelle, solo un temporale che non smette mai, e ogni piattaforma sotto i tuoi piedi comincia a dissolversi nell'istante in cui la tocchi.

Le entità corrotte non pattugliano più: attaccano con una furia che non hanno mai mostrato prima, come se sapessero che questa è l'ultima occasione per fermarti prima che tu raggiunga il varco.

In fondo alla dimensione si apre un buco nero — non una metafora, una porta vera. Attraversalo e non troverai un'altra piattaforma della stessa Omega: troverai la stanza del trono stessa, un luogo che esiste solo per questo scontro. Xerath ti aspetta lì, di persona, per la prima volta come avversario e non come voce nei sensori. Fallire significa la fine di ogni realtà digitale che l'Osservatorio protegge. Vincere significa scrivere il proprio nome nella storia interdimensionale. Sei pronto, Esploratore Supremo?`,
    level: 8,
    actionText: 'INIZIA MISSIONE'
  },
  outro8: {
    title: '👑 SALVATORE DELLE DIMENSIONI',
    text: `Xerath si dissolve in un ultimo lampo di dati puri — non un urlo, non una sconfitta rabbiosa, ma qualcosa più vicino a un respiro di sollievo. Forse, in fondo, anche lei era stanca di essere corrotta.

Tutte le dimensioni si stabilizzano insieme, come un'unica onda che attraversa l'intero multiverso digitale. L'Osservatorio Quantico registra il segnale più pulito mai ricevuto in mesi.

Il tuo nome entra negli archivi come Salvatore Leggendario — il primo Esploratore a riportare l'equilibrio senza perdere una sola dimensione. Come ricompensa finale, sblocchi il codice sconto supremo per RetroAvia: la gloria, in questo caso, si accompagna a uno sconto vero. Manda il codice su Instagram per riscattarlo — te lo sei guadagnato fino all'ultimo pixel.`,
    level: 8,
    actionText: 'CONTINUA'
  }
};

export function getStory(level, type = 'intro') {
  return STORY[`${type}${level}`];
}
