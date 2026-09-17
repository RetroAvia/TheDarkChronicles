// Between-level "enigmi interdimensionali" — a big, mixed pool across three
// categories (trivia, supereroi, logica) so a single playthrough (4 quizzes,
// one per level transition before the last) never comes close to exhausting
// it, and even someone replaying the game many times rarely sees a repeat.
// Never blocks progress: answering is for a score bonus/malus only (see
// Game.js showQuiz) — deliberately, since this game exists to drive real
// store discounts and a hard quiz gate could cost a conversion over a
// trivia question or a riddle.
//
// `category` drives QuizOverlay's eyebrow label/icon (see CATEGORY_META).
// `fact` is shown after answering either way — a fun fact for trivia/
// supereroi, the worked-out explanation for a logica puzzle.

export const CATEGORY_META = {
  trivia: { label: 'Enigma interdimensionale', icon: '🧠' },
  supereroi: { label: 'Sfida da supereroe', icon: '🦸' },
  logica: { label: 'Rompicapo di logica', icon: '🧩' },
  vero_falso: { label: 'Vero o Falso', icon: '⚖️' }
};

export const QUIZ_QUESTIONS = [
  // ---------------------------------------------------------------- trivia
  {
    category: 'trivia',
    question: 'In che anno è uscito Super Mario Bros., il gioco che ha reso celebre il genere platform come questo?',
    answers: ['1983', '1985', '1987', '1990'],
    correct: 1,
    fact: 'Super Mario Bros. è uscito nel 1985 su Nintendo Entertainment System, ridefinendo da solo il level design dei platform a scorrimento.'
  },
  {
    category: 'trivia',
    question: 'Qual è la stella più vicina al nostro Sistema Solare, dopo il Sole?',
    answers: ['Sirio', 'Proxima Centauri', 'Vega', 'Alpha Centauri A'],
    correct: 1,
    fact: 'Proxima Centauri dista "solo" 4,24 anni luce — vicinissima su scala cosmica, comunque irraggiungibile con la tecnologia attuale.'
  },
  {
    category: 'trivia',
    question: 'Più assorbo, più cresco, e nulla può sfuggirmi una volta troppo vicino. Cosa sono?',
    answers: ['Un cristallo energetico', 'Un buco nero', 'Un portale dimensionale', 'Una tempesta quantica'],
    correct: 1,
    fact: 'Un buco nero cresce letteralmente inglobando la materia che gli si avvicina troppo — proprio come quello che ti ha appena risucchiato nell\'arena.'
  },
  {
    category: 'trivia',
    question: 'Chi sono i due fratelli considerati pionieri del volo a motore, nel 1903?',
    answers: ['I fratelli Wright', 'I fratelli Montgolfier', 'I fratelli Lindbergh', 'I fratelli Curtiss'],
    correct: 0,
    fact: 'Orville e Wilbur Wright compirono il primo volo controllato e sostenuto a Kitty Hawk il 17 dicembre 1903 — l\'inizio dell\'aviazione moderna.'
  },
  {
    category: 'trivia',
    question: 'Come si chiamava la prima console Nintendo a cartucce, lanciata in Giappone nel 1983?',
    answers: ['Game Boy', 'Famicom', 'Super Famicom', 'Virtual Boy'],
    correct: 1,
    fact: 'Il Famicom (Family Computer) arrivò in occidente nel 1985 ribattezzato NES, e salvò l\'industria videoludica dopo il crash del 1983.'
  },
  {
    category: 'trivia',
    question: 'Attraverso ogni porta ma non sono una chiave, cambio ogni mondo ma resto sempre uguale a me stesso. Cosa sono?',
    answers: ['Un portale', 'Uno specchio', 'Un checkpoint', 'Un cristallo'],
    correct: 0,
    fact: 'I portali che stai attraversando in questo viaggio funzionano esattamente così: la stessa soglia, otto mondi diversi dall\'altra parte.'
  },
  {
    category: 'trivia',
    question: 'Quanti minuti impiega in media la luce del Sole per raggiungere la Terra?',
    answers: ['8 secondi', '8 minuti', '8 ore', '8 giorni'],
    correct: 1,
    fact: 'Quando guardi il Sole, lo stai vedendo com\'era 8 minuti prima — se si spegnesse ora, non lo sapresti per altri 8 minuti.'
  },
  {
    category: 'trivia',
    question: 'In informatica, quanti bit formano un byte?',
    answers: ['4', '8', '16', '32'],
    correct: 1,
    fact: 'Un byte (8 bit) può rappresentare 256 valori diversi — abbastanza per un intero carattere di testo.'
  },
  {
    category: 'trivia',
    question: 'Qual è la velocità approssimativa del suono al livello del mare?',
    answers: ['343 m/s', '1000 m/s', '150 m/s', '3000 m/s'],
    correct: 0,
    fact: 'Circa 1.235 km/h — è la soglia che ogni aereo supersonico deve superare per "rompere il muro del suono".'
  },
  {
    category: 'trivia',
    question: 'Nasco dal ghiaccio ma brucio i motori, guido i piloti quando tutto è buio. Cosa sono?',
    answers: ['Una bussola', 'Le stelle', 'Un radar', 'Un faro'],
    correct: 2,
    fact: 'Il radar (RAdio Detection And Ranging) fu decisivo nell\'aviazione bellica degli anni \'40 e resta oggi il modo principale per "vedere" nel buio o nel maltempo.'
  },
  {
    category: 'trivia',
    question: 'In che anno l\'uomo ha messo piede sulla Luna per la prima volta?',
    answers: ['1965', '1969', '1972', '1959'],
    correct: 1,
    fact: 'Il 20 luglio 1969 Neil Armstrong e Buzz Aldrin camminarono sulla Luna durante la missione Apollo 11.'
  },
  {
    category: 'trivia',
    question: 'Qual è il pianeta più grande del Sistema Solare?',
    answers: ['Saturno', 'Nettuno', 'Giove', 'Urano'],
    correct: 2,
    fact: 'Giove è così grande che potrebbe contenere più di 1.300 pianeti come la Terra al suo interno.'
  },
  {
    category: 'trivia',
    question: 'Come si chiama il primo videogioco arcade di grande successo commerciale, uscito nel 1972?',
    answers: ['Pong', 'Space Invaders', 'Pac-Man', 'Asteroids'],
    correct: 0,
    fact: 'Pong, di Atari, fu così popolare che le prime macchine si inceppavano perché i cassetti dei gettoni si riempivano troppo in fretta.'
  },
  {
    category: 'trivia',
    question: 'Qual è stato il primo aereo di linea a reazione ad entrare in servizio commerciale, nel 1952?',
    answers: ['Boeing 707', 'Concorde', 'De Havilland Comet', 'Douglas DC-3'],
    correct: 2,
    fact: 'Il De Havilland Comet dimezzò i tempi di volo transatlantici, anche se i primi esemplari soffrirono di gravi problemi strutturali poi risolti.'
  },
  {
    category: 'trivia',
    question: 'Quale gas compone circa il 78% dell\'atmosfera terrestre?',
    answers: ['Ossigeno', 'Anidride carbonica', 'Azoto', 'Idrogeno'],
    correct: 2,
    fact: 'L\'ossigeno che respiriamo è solo circa il 21%: la fetta più grande dell\'aria che ci circonda è azoto, quasi inerte per il nostro corpo.'
  },
  {
    category: 'trivia',
    question: 'Come viene soprannominato Marte per il suo caratteristico colore?',
    answers: ['Il pianeta blu', 'Il pianeta rosso', 'Il pianeta giallo', 'Il pianeta di ghiaccio'],
    correct: 1,
    fact: 'Il colore rossastro di Marte è dovuto all\'ossido di ferro (ruggine) che ricopre gran parte della sua superficie.'
  },
  {
    category: 'trivia',
    question: 'Quanti continenti si contano tradizionalmente sulla Terra?',
    answers: ['5', '6', '7', '8'],
    correct: 2,
    fact: 'La suddivisione più diffusa conta sette continenti: Africa, Antartide, Asia, Europa, America del Nord, America del Sud e Oceania.'
  },
  {
    category: 'trivia',
    question: 'Chi ha dipinto la Gioconda (Monna Lisa)?',
    answers: ['Michelangelo', 'Raffaello', 'Leonardo da Vinci', 'Caravaggio'],
    correct: 2,
    fact: 'Leonardo da Vinci lavorò alla Gioconda per anni, portandola sempre con sé: oggi è conservata al Louvre di Parigi.'
  },
  {
    category: 'trivia',
    question: 'Qual è l\'oceano più esteso del pianeta?',
    answers: ['Atlantico', 'Pacifico', 'Indiano', 'Artico'],
    correct: 1,
    fact: 'L\'Oceano Pacifico copre da solo circa un terzo della superficie terrestre, più di tutte le terre emerse messe insieme.'
  },
  {
    category: 'trivia',
    question: 'In che anno è caduto il Muro di Berlino?',
    answers: ['1985', '1989', '1991', '1993'],
    correct: 1,
    fact: 'Il Muro cadde la notte del 9 novembre 1989, segnando simbolicamente la fine della Guerra Fredda in Europa.'
  },
  {
    category: 'trivia',
    question: 'Qual è il simbolo chimico del ferro nella tavola periodica?',
    answers: ['Fr', 'Fe', 'F', 'Ir'],
    correct: 1,
    fact: '"Fe" deriva dal latino "ferrum": il simbolo chimico degli elementi spesso richiama il nome latino o greco antico.'
  },
  {
    category: 'trivia',
    question: 'Quanti giocatori compongono una squadra di calcio in campo, portiere incluso?',
    answers: ['9', '10', '11', '12'],
    correct: 2,
    fact: 'Ogni squadra schiera 11 giocatori in campo: un portiere e dieci di movimento.'
  },
  {
    category: 'trivia',
    question: 'Qual è la montagna più alta del mondo sul livello del mare?',
    answers: ['K2', 'Monte Bianco', 'Everest', 'Kilimangiaro'],
    correct: 2,
    fact: 'L\'Everest raggiunge 8.849 metri sul livello del mare, al confine tra Nepal e Tibet.'
  },
  {
    category: 'trivia',
    question: 'Da cosa prende il nome il linguaggio di programmazione Python?',
    answers: ['Dal serpente pitone', 'Da un gruppo comico britannico', 'Da un\'azienda tecnologica', 'Da una costellazione'],
    correct: 1,
    fact: 'Nonostante il logo a forma di serpente, il nome fu scelto dal suo creatore in onore dei Monty Python, non dell\'animale.'
  },

  // ------------------------------------------------------------ supereroi
  {
    category: 'supereroi',
    question: 'Qual è la vera identità di Spider-Man?',
    answers: ['Peter Parker', 'Tony Stark', 'Bruce Banner', 'Matt Murdock'],
    correct: 0,
    fact: 'Peter Parker fu morso da un ragno radioattivo durante una gita scolastica — da lì tutti i suoi poteri.'
  },
  {
    category: 'supereroi',
    question: 'Di che colore è la kryptonite più comune, quella che indebolisce Superman?',
    answers: ['Rossa', 'Verde', 'Blu', 'Viola'],
    correct: 1,
    fact: 'La kryptonite verde è un frammento del pianeta Krypton stesso, distrutto insieme al mondo natale di Superman.'
  },
  {
    category: 'supereroi',
    question: 'In quale città immaginaria opera principalmente Batman?',
    answers: ['Metropolis', 'Gotham City', 'Central City', 'Star City'],
    correct: 1,
    fact: 'Gotham City è ispirata a New York, ma resa più cupa e gotica — da cui il nome.'
  },
  {
    category: 'supereroi',
    question: 'Da quale pianeta proviene Superman?',
    answers: ['Marte', 'Krypton', 'Asgard', 'Namecc'],
    correct: 1,
    fact: 'Krypton fu distrutto poco dopo la nascita di Superman: i suoi genitori lo mandarono sulla Terra per salvarlo.'
  },
  {
    category: 'supereroi',
    question: 'Di che materiale è fatto lo scudo di Capitan America?',
    answers: ['Acciaio', 'Adamantio', 'Vibranio', 'Titanio'],
    correct: 2,
    fact: 'Il vibranio è un metallo fittizio che assorbe le vibrazioni — lo stesso materiale alla base della tecnologia di Wakanda.'
  },
  {
    category: 'supereroi',
    question: 'Come si chiama l\'organizzazione segreta per cui lavora Nick Fury nell\'universo Marvel?',
    answers: ['S.H.I.E.L.D.', 'HYDRA', 'A.I.M.', 'Stark Industries'],
    correct: 0,
    fact: 'S.H.I.E.L.D. sta per "Strategic Homeland Intervention, Enforcement and Logistics Division".'
  },
  {
    category: 'supereroi',
    question: 'Qual è il nome del più celebre nemico di Batman, dal volto dipinto di bianco e dal ghigno inquietante?',
    answers: ['Bane', 'Due Facce', 'Joker', 'Enigmista'],
    correct: 2,
    fact: 'Il Joker è considerato uno dei villain più iconici dei fumetti proprio per l\'assenza di una vera motivazione razionale.'
  },
  {
    category: 'supereroi',
    question: 'Quale supereroe Marvel diventa un gigante verde quando si arrabbia?',
    answers: ['Thing', 'Hulk', 'Abominio', 'Colosso'],
    correct: 1,
    fact: 'Bruce Banner si trasforma in Hulk a causa dell\'esposizione a radiazioni gamma durante il test di un\'arma sperimentale.'
  },
  {
    category: 'supereroi',
    question: 'Qual è la vera identità di Wonder Woman?',
    answers: ['Diana Prince', 'Hippolyta', 'Donna Troy', 'Artemide'],
    correct: 0,
    fact: 'Diana è una principessa amazzone dell\'isola di Themyscira, forgiata dall\'argilla secondo il mito classico.'
  },
  {
    category: 'supereroi',
    question: 'Da quale regno mitologico proviene Thor nei fumetti Marvel?',
    answers: ['Olimpo', 'Asgard', 'Valhalla', 'Midgard'],
    correct: 1,
    fact: 'Asgard è uno dei Nove Regni della mitologia norrena reinterpretata da Marvel, collegato agli altri tramite il Bifrost.'
  },
  {
    category: 'supereroi',
    question: 'Come si chiama il maggiordomo di fiducia di Bruce Wayne?',
    answers: ['Alfred Pennyworth', 'Lucius Fox', 'James Gordon', 'Dick Grayson'],
    correct: 0,
    fact: 'Alfred non è solo un maggiordomo: è spesso la voce della ragione (e il medico di fiducia) di Batman.'
  },
  {
    category: 'supereroi',
    question: 'Quale supereroe DC è conosciuto come "l\'uomo più veloce del mondo"?',
    answers: ['Flash', 'Nightwing', 'Freccia Verde', 'Blue Beetle'],
    correct: 0,
    fact: 'Flash attinge la sua velocità dalla "Forza della Velocità" (Speed Force), un\'energia extra-dimensionale.'
  },
  {
    category: 'supereroi',
    question: 'Qual è la vera identità di Iron Man?',
    answers: ['Tony Stark', 'Reed Richards', 'Hank Pym', 'Victor von Doom'],
    correct: 0,
    fact: 'Tony Stark costruì la sua prima armatura in una grotta, con risorse limitate, per scappare da una prigionia.'
  },
  {
    category: 'supereroi',
    question: 'Quale metallo indistruttibile riveste lo scheletro di Wolverine?',
    answers: ['Vibranio', 'Adamantio', 'Uru', 'Carbonio nero'],
    correct: 1,
    fact: 'L\'adamantio venne innestato sullo scheletro di Wolverine tramite un esperimento governativo segreto chiamato Arma X.'
  },
  {
    category: 'supereroi',
    question: 'Qual è il regno natale del supereroe Black Panther?',
    answers: ['Wakanda', 'Genosha', 'Latveria', 'Atlantide'],
    correct: 0,
    fact: 'Wakanda è una nazione africana mai colonizzata, tecnologicamente avanzatissima grazie al vibranio.'
  },
  {
    category: 'supereroi',
    question: 'Quale supereroina Marvel ha il potere di controllare il tempo atmosferico?',
    answers: ['Tempesta', 'Jean Grey', 'Scarlet Witch', 'Capitan Marvel'],
    correct: 0,
    fact: 'Tempesta (Storm) è una delle mutanti più potenti degli X-Men, venerata come una dea in alcune storie.'
  },
  {
    category: 'supereroi',
    question: 'Come si chiama il gruppo di supereroi mutanti guidato dal Professor X?',
    answers: ['I Vendicatori', 'La Justice League', 'Gli X-Men', 'I Difensori'],
    correct: 2,
    fact: 'Gli X-Men nacquero come metafora della discriminazione e della lotta per i diritti civili.'
  },
  {
    category: 'supereroi',
    question: 'Qual è il vero nome di Capitan America?',
    answers: ['Steve Rogers', 'Sam Wilson', 'Bucky Barnes', 'John Walker'],
    correct: 0,
    fact: 'Steve Rogers era un ragazzo gracile di Brooklyn prima di ricevere il siero del super soldato durante la Seconda Guerra Mondiale.'
  },
  {
    category: 'supereroi',
    question: 'Quale isola caraibica-mitologica è la patria di Wonder Woman?',
    answers: ['Themyscira', 'Atlantide', 'Skull Island', 'Krakoa'],
    correct: 0,
    fact: 'Themyscira è abitata solo dalle Amazzoni ed è nascosta al mondo esterno da magia antica.'
  },
  {
    category: 'supereroi',
    question: 'Chi è l\'arcinemico per eccellenza dei Fantastici Quattro, dominatore di una nazione europea immaginaria?',
    answers: ['Kingpin', 'Dottor Destino', 'Red Skull', 'Loki'],
    correct: 1,
    fact: 'Victor von Doom, il Dottor Destino, governa la nazione fittizia di Latveria con pugno di ferro e magia.'
  },
  {
    category: 'supereroi',
    question: 'Qual è la vera identità civile di Batman?',
    answers: ['Bruce Wayne', 'Dick Grayson', 'Harvey Dent', 'Lucius Fox'],
    correct: 0,
    fact: 'Bruce Wayne, miliardario di Gotham City, diventò Batman dopo aver assistito da bambino all\'omicidio dei suoi genitori.'
  },
  {
    category: 'supereroi',
    question: 'Chi è il celebre arcinemico di Superman, genio calvo e magnate senza superpoteri?',
    answers: ['Lex Luthor', 'Brainiac', 'Darkseid', 'Zod'],
    correct: 0,
    fact: 'Lex Luthor non ha superpoteri: sconfigge Superman a colpi di intelligenza, risorse economiche e pura ossessione.'
  },
  {
    category: 'supereroi',
    question: 'Come si chiama il celebre supergruppo DC che riunisce Superman, Batman e Wonder Woman?',
    answers: ['Gli Avengers', 'La Justice League', 'La Suicide Squad', 'I Teen Titans'],
    correct: 1,
    fact: 'La Justice League nacque nei fumetti nel 1960 come risposta DC al successo dei team di supereroi.'
  },
  {
    category: 'supereroi',
    question: 'Quale eroe Marvel è cieco ma possiede sensi sovrumani, ed è anche un avvocato?',
    answers: ['Occhio di Falco', 'Devil (Daredevil)', 'Punisher', 'Moon Knight'],
    correct: 1,
    fact: 'Matt Murdock perse la vista da bambino in un incidente che potenziò gli altri suoi sensi fino a livelli sovrumani.'
  },
  {
    category: 'supereroi',
    question: 'Come si chiama il gruppo di supereroi Marvel guidato da Iron Man e Capitan America?',
    answers: ['I Vendicatori', 'Gli X-Men', 'I Difensori', 'Gli Illuminati'],
    correct: 0,
    fact: 'I Vendicatori (Avengers) si formarono per affrontare minacce troppo grandi per un singolo eroe.'
  },
  {
    category: 'supereroi',
    question: 'Qual è il vero nome civile di Wolverine?',
    answers: ['James "Logan" Howlett', 'Victor Creed', 'Scott Summers', 'Remy LeBeau'],
    correct: 0,
    fact: 'Logan è il nome con cui è più conosciuto, ma il suo vero nome di nascita è James Howlett.'
  },
  {
    category: 'supereroi',
    question: 'Come si chiama il team formato da Mr. Fantastic, Donna Invisibile, Torcia Umana e la Cosa?',
    answers: ['I Difensori', 'I Fantastici Quattro', 'Gli Inhumans', 'I Guardiani della Galassia'],
    correct: 1,
    fact: 'I Fantastici Quattro ottennero i loro poteri dopo essere stati esposti a radiazioni cosmiche durante un volo spaziale sperimentale.'
  },
  {
    category: 'supereroi',
    question: 'Di che colore è il costume classico di Flash?',
    answers: ['Blu', 'Verde', 'Rosso', 'Giallo'],
    correct: 2,
    fact: 'Il costume rosso acceso di Flash, con i fulmini dorati sui fianchi, è uno dei design più riconoscibili dei fumetti DC.'
  },
  {
    category: 'supereroi',
    question: 'Qual è la vera identità di Robin, il primo giovane compagno di Batman?',
    answers: ['Tim Drake', 'Jason Todd', 'Dick Grayson', 'Damian Wayne'],
    correct: 2,
    fact: 'Dick Grayson, ex acrobata circense rimasto orfano, fu il primo Robin e in seguito divenne Nightwing.'
  },

  // -------------------------------------------------------------- logica
  {
    category: 'logica',
    question: 'Completa la sequenza: 2, 4, 8, 16, ?',
    answers: ['20', '24', '32', '30'],
    correct: 2,
    fact: 'Ogni numero è il doppio del precedente: la sequenza raddoppia ogni volta, quindi dopo 16 viene 32.'
  },
  {
    category: 'logica',
    question: 'Se oggi è lunedì, che giorno della settimana sarà tra 100 giorni?',
    answers: ['Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'],
    correct: 1,
    fact: '100 diviso 7 dà resto 2 (98 giorni sono esattamente 14 settimane): lunedì + 2 giorni = mercoledì.'
  },
  {
    category: 'logica',
    question: 'Completa la serie di lettere: A, C, E, G, ?',
    answers: ['H', 'I', 'F', 'J'],
    correct: 1,
    fact: 'La sequenza salta sempre una lettera: A, (B), C, (D), E, (F), G, (H), I.'
  },
  {
    category: 'logica',
    question: 'Qual è il numero mancante nella sequenza di Fibonacci: 1, 1, 2, 3, 5, 8, ?',
    answers: ['11', '12', '13', '10'],
    correct: 2,
    fact: 'Nella sequenza di Fibonacci ogni numero è la somma dei due precedenti: 5 + 8 = 13.'
  },
  {
    category: 'logica',
    question: 'Un uomo guarda una foto e dice: "Non ho fratelli né sorelle, ma il padre di quell\'uomo è il figlio di mio padre." Chi c\'è nella foto?',
    answers: ['Suo padre', 'Suo figlio', 'Se stesso', 'Suo cugino'],
    correct: 1,
    fact: '"Il figlio di mio padre" (senza fratelli) è lui stesso: quindi "il padre di quell\'uomo" è lui, e l\'uomo nella foto è suo figlio.'
  },
  {
    category: 'logica',
    question: 'Con un cifrario a scorrimento (+1, ogni lettera diventa la successiva), CIAO diventa DJBP. Come diventa MARE con lo stesso codice?',
    answers: ['NBSF', 'NBFS', 'MBSF', 'NASF'],
    correct: 0,
    fact: 'M→N, A→B, R→S, E→F: applicando +1 a ogni lettera di MARE si ottiene NBSF.'
  },
  {
    category: 'logica',
    question: 'Quanti quadrati in totale (di ogni dimensione) si contano in una griglia 3x3?',
    answers: ['9', '12', '14', '16'],
    correct: 2,
    fact: 'Ci sono 9 quadrati 1x1, 4 quadrati 2x2 e 1 quadrato 3x3: 9 + 4 + 1 = 14 in totale.'
  },
  {
    category: 'logica',
    question: 'Se 5 macchine impiegano 5 minuti per produrre 5 pezzi, quanto tempo impiegano 100 macchine per produrre 100 pezzi?',
    answers: ['100 minuti', '20 minuti', '5 minuti', '1 minuto'],
    correct: 2,
    fact: 'Ogni macchina produce 1 pezzo in 5 minuti, indipendentemente da quante macchine lavorano insieme: restano 5 minuti.'
  },
  {
    category: 'logica',
    question: 'Quale numero è l\'intruso nella serie: 3, 7, 11, 14, 15, 19?',
    answers: ['11', '14', '15', '19'],
    correct: 1,
    fact: 'La serie corretta cresce di 4 in 4 (3, 7, 11, 15, 19): il 14 rompe lo schema e dovrebbe essere 15.'
  },
  {
    category: 'logica',
    question: 'Un orologio segna le 3:15. Qual è l\'angolo più piccolo tra le due lancette?',
    answers: ['0°', '7,5°', '15°', '30°'],
    correct: 1,
    fact: 'Alle 3:15 la lancetta delle ore è leggermente oltre le 3 (97,5°) e quella dei minuti è sulle 3 (90°): la differenza è 7,5°.'
  },
  {
    category: 'logica',
    question: 'Quale animale si nasconde in questo anagramma: OGATT?',
    answers: ['Gatto', 'Topo', 'Tigre', 'Lupo'],
    correct: 0,
    fact: 'Riordinando le lettere O-G-A-T-T si ottiene GATTO.'
  },
  {
    category: 'logica',
    question: 'Completa la sequenza: 100, 50, 25, 12,5, ?',
    answers: ['6,25', '5', '10', '0'],
    correct: 0,
    fact: 'Ogni numero è la metà del precedente: 12,5 diviso 2 fa 6,25.'
  },
  {
    category: 'logica',
    question: 'Sei in una stanza buia con un fiammifero, una candela, una lampada a olio e una stufa a legna. Cosa accendi per primo?',
    answers: ['La candela', 'La lampada', 'Il fiammifero', 'La stufa'],
    correct: 2,
    fact: 'Per accendere qualsiasi altra cosa, devi prima accendere il fiammifero stesso.'
  },
  {
    category: 'logica',
    question: 'Quale numero positivo, sommato a se stesso, dà lo stesso risultato di moltiplicato per se stesso?',
    answers: ['1', '2', '3', '4'],
    correct: 1,
    fact: '2 + 2 = 4 e 2 × 2 = 4: è l\'unico numero (diverso da zero) per cui somma e prodotto con se stesso coincidono.'
  },
  {
    category: 'logica',
    question: 'Tre scatole contengono rispettivamente solo mele, solo arance e un misto — ma TUTTE le etichette sono sbagliate. Da quale scatola devi pescare un frutto per capire il contenuto di tutte e tre?',
    answers: ['Dalla scatola "mele"', 'Dalla scatola "arance"', 'Dalla scatola "misto"', 'Non è possibile'],
    correct: 2,
    fact: 'Dato che l\'etichetta "misto" è sbagliata, quella scatola contiene solo mele o solo arance: da lì scopri la verità e puoi dedurre le altre due per esclusione.'
  },
  {
    category: 'logica',
    question: 'Quale numero completa la sequenza: 8, 27, 64, 125, ?',
    answers: ['196', '200', '216', '225'],
    correct: 2,
    fact: 'Sono i cubi di 2, 3, 4, 5 e 6: 6³ = 216.'
  },
  {
    category: 'logica',
    question: 'Due padri e due figli vanno a pescare e catturano in totale 3 pesci, uno a testa. Com\'è possibile?',
    answers: ['Uno ha imbrogliato', 'Sono nonno, padre e figlio', 'Un pesce è stato liberato', 'Il totale è sbagliato'],
    correct: 1,
    fact: 'Sono solo tre persone: un nonno (padre), un padre (che è anche figlio) e un figlio — quindi "due padri e due figli", ma solo tre persone reali.'
  },
  {
    category: 'logica',
    question: 'Scrivendo tutti i numeri da 1 a 100, quante volte compare la cifra "9"?',
    answers: ['10', '19', '20', '9'],
    correct: 2,
    fact: 'La cifra 9 compare 10 volte nelle unità (9,19,...,99) e altre 10 volte nelle decine (90-99): in totale 20 volte.'
  },
  {
    category: 'logica',
    question: 'Segui lo schema: cerchio, quadrato, triangolo, cerchio, quadrato, ?',
    answers: ['Cerchio', 'Quadrato', 'Triangolo', 'Rombo'],
    correct: 2,
    fact: 'Lo schema si ripete ogni 3 forme (cerchio, quadrato, triangolo): dopo "quadrato" torna sempre "triangolo".'
  },
  {
    category: 'logica',
    question: 'Tre amici pagano 10€ a testa per una cena (30€ totali). Il conto reale è di 25€: il cameriere restituisce 5€, ma gliene dà solo 3 (1€ a testa) e si tiene 2€. Ognuno ha quindi pagato 9€: 9×3=27€, +2€ del cameriere = 29€. Dov\'è finito l\'euro mancante?',
    answers: ['Il cameriere lo ha nascosto', 'È un errore di conteggio: i 2€ sono già dentro i 27€, non vanno sommati', 'Un amico ha pagato in meno', 'Manca davvero un euro'],
    correct: 1,
    fact: 'È un classico tranello di conteggio: i 27€ pagati includono già i 2€ tenuti dal cameriere (25€ di conto + 2€ di mancia forzata) — sommarli di nuovo è l\'errore, non manca nulla.'
  },
  {
    category: 'logica',
    question: 'Completa la sequenza: 1, 4, 9, 16, 25, ?',
    answers: ['30', '36', '49', '32'],
    correct: 1,
    fact: 'Sono i quadrati perfetti dei numeri da 1 a 6: 6² = 36.'
  },
  {
    category: 'logica',
    question: 'Un treno viaggia a velocità costante di 60 km/h. Quanti km percorre in 30 minuti?',
    answers: ['15 km', '30 km', '60 km', '45 km'],
    correct: 1,
    fact: 'In mezz\'ora, a 60 km/h, si percorre esattamente metà distanza oraria: 30 km.'
  },
  {
    category: 'logica',
    question: 'Completa la serie (alfabeto a ritroso): Z, Y, X, W, ?',
    answers: ['V', 'U', 'T', 'A'],
    correct: 0,
    fact: 'La serie scende di una lettera alla volta partendo dalla fine dell\'alfabeto: dopo la W viene la V.'
  },
  {
    category: 'logica',
    question: 'Se 3 gatti catturano 3 topi in 3 minuti, quanto tempo impiegano 100 gatti per catturare 100 topi?',
    answers: ['100 minuti', '33 minuti', '3 minuti', '10 minuti'],
    correct: 2,
    fact: 'Ogni gatto cattura un topo in 3 minuti, indipendentemente da quanti gatti lavorano insieme in parallelo: restano 3 minuti.'
  },
  {
    category: 'logica',
    question: 'Sei in una gara e superi chi si trova al secondo posto. In che posizione sei ora?',
    answers: ['Primo', 'Secondo', 'Terzo', 'Ultimo'],
    correct: 1,
    fact: 'Superando il secondo prendi il SUO posto: diventi secondo, non primo — chi era primo resta comunque davanti a te.'
  },
  {
    category: 'logica',
    question: 'Quanti lati ha un esagono regolare?',
    answers: ['5', '6', '7', '8'],
    correct: 1,
    fact: 'Il prefisso "esa-" significa sei: un esagono ha sempre sei lati e sei angoli.'
  },
  {
    category: 'logica',
    question: 'Completa la sequenza: 5, 10, 20, 40, ?',
    answers: ['60', '70', '80', '100'],
    correct: 2,
    fact: 'Ogni numero raddoppia il precedente: 40 × 2 = 80.'
  },
  {
    category: 'logica',
    question: 'Se oggi è mercoledì, che giorno della settimana sarà tra 15 giorni?',
    answers: ['Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'],
    correct: 2,
    fact: '15 diviso 7 dà resto 1 (14 giorni sono esattamente 2 settimane): mercoledì + 1 giorno = giovedì.'
  },
  {
    category: 'logica',
    question: 'Quale animale si nasconde in questo anagramma: OLVUP?',
    answers: ['Lupo', 'Volpe', 'Leone', 'Orso'],
    correct: 0,
    fact: 'Riordinando le lettere O-L-V-U-P si ottiene LUPO.'
  },
  {
    category: 'logica',
    question: 'Un uomo vive al ventesimo piano. Ogni mattina scende in ascensore fino a terra. La sera, se piove, sale in ascensore fino al ventesimo piano; se non piove, sale in ascensore solo fino al decimo e fa il resto a piedi. Perché?',
    answers: ['È troppo pigro per salire tutte le scale', 'Non raggiunge i pulsanti alti, ma con l\'ombrello sì', 'L\'ascensore si guasta sempre di sera', 'Preferisce fare un po\' di esercizio'],
    correct: 1,
    fact: 'È troppo basso per premere il pulsante del 20° piano — ma con l\'ombrello riesce ad allungarsi quel poco che basta per raggiungerlo.'
  },

  // ----------------------------------------------------------- vero_falso
  {
    category: 'vero_falso',
    question: 'Il Sole è una stella.',
    answers: ['Vero', 'Falso'],
    correct: 0,
    fact: 'Il Sole è una stella di sequenza principale, una gigantesca sfera di plasma tenuta insieme dalla propria gravità.'
  },
  {
    category: 'vero_falso',
    question: 'I pinguini sono uccelli capaci di volare.',
    answers: ['Vero', 'Falso'],
    correct: 1,
    fact: 'I pinguini sono uccelli, ma non volano: le loro ali si sono evolute in pinne perfette per nuotare.'
  },
  {
    category: 'vero_falso',
    question: 'Un corpo umano adulto ha 206 ossa.',
    answers: ['Vero', 'Falso'],
    correct: 0,
    fact: 'Alla nascita abbiamo circa 300 ossa: molte si fondono durante la crescita, fino ad arrivare a 206 in età adulta.'
  },
  {
    category: 'vero_falso',
    question: 'Venere è il pianeta più vicino al Sole.',
    answers: ['Vero', 'Falso'],
    correct: 1,
    fact: 'Il pianeta più vicino al Sole è Mercurio: Venere è il secondo.'
  },
  {
    category: 'vero_falso',
    question: 'Il ghiaccio è meno denso dell\'acqua liquida, per questo galleggia.',
    answers: ['Vero', 'Falso'],
    correct: 0,
    fact: 'L\'acqua è una delle poche sostanze che si espande solidificando: per questo il ghiaccio è meno denso e galleggia.'
  },
  {
    category: 'vero_falso',
    question: 'I ragni sono classificati come insetti.',
    answers: ['Vero', 'Falso'],
    correct: 1,
    fact: 'I ragni sono aracnidi, non insetti: hanno otto zampe invece di sei e solo due parti del corpo invece di tre.'
  },
  {
    category: 'vero_falso',
    question: 'La Grande Muraglia Cinese è visibile a occhio nudo dallo spazio.',
    answers: ['Vero', 'Falso'],
    correct: 1,
    fact: 'È un mito molto diffuso: la Muraglia è troppo stretta per essere distinta a occhio nudo dall\'orbita, come confermato da diversi astronauti.'
  },
  {
    category: 'vero_falso',
    question: 'Il cuore umano è composto da quattro camere.',
    answers: ['Vero', 'Falso'],
    correct: 0,
    fact: 'Il cuore ha due atri e due ventricoli: quattro camere che pompano il sangue in un circuito a doppio senso, polmonare e sistemico.'
  },
  {
    category: 'vero_falso',
    question: 'Marte è conosciuto come "il pianeta rosso".',
    answers: ['Vero', 'Falso'],
    correct: 0,
    fact: 'Il soprannome deriva dall\'ossido di ferro che ricopre la sua superficie, dandole quella tipica colorazione rossastra.'
  },
  {
    category: 'vero_falso',
    question: 'Gli squali sono mammiferi.',
    answers: ['Vero', 'Falso'],
    correct: 1,
    fact: 'Gli squali sono pesci cartilaginei: respirano con le branchie e non allattano i piccoli come fanno i mammiferi.'
  },
  {
    category: 'vero_falso',
    question: 'Negli anni bisestili, febbraio ha 29 giorni.',
    answers: ['Vero', 'Falso'],
    correct: 0,
    fact: 'L\'anno bisestile aggiunge un giorno a febbraio ogni 4 anni circa, per compensare che l\'orbita terrestre dura poco più di 365 giorni.'
  },
  {
    category: 'vero_falso',
    question: 'Il numero zero è considerato un numero pari.',
    answers: ['Vero', 'Falso'],
    correct: 0,
    fact: 'Zero è divisibile per due senza resto, quindi matematicamente è a tutti gli effetti un numero pari.'
  },
  {
    category: 'vero_falso',
    question: 'L\'Everest è la montagna più alta del mondo misurata dalla base al picco.',
    answers: ['Vero', 'Falso'],
    correct: 1,
    fact: 'L\'Everest è la più alta sul livello del mare, ma il Mauna Kea (isole Hawaii), misurato dalla sua base sul fondale oceanico, è più alto in totale.'
  },
  {
    category: 'vero_falso',
    question: 'La luce viaggia più velocemente del suono.',
    answers: ['Vero', 'Falso'],
    correct: 0,
    fact: 'La luce viaggia a circa 300.000 km/s, mentre il suono si muove a circa 343 m/s: è per questo che vedi un fulmine prima di sentire il tuono.'
  },
  {
    category: 'vero_falso',
    question: 'Tutti i vulcani della Terra si trovano sulla terraferma.',
    answers: ['Vero', 'Falso'],
    correct: 1,
    fact: 'Esistono moltissimi vulcani sottomarini: la maggior parte dell\'attività vulcanica terrestre avviene proprio sul fondo degli oceani.'
  }
];

/** Returns a shuffled copy of the pool, so repeat playthroughs mix up which
 * questions show up first without ever repeating one within a single run. */
export function shuffledQuizPool() {
  const pool = [...QUIZ_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}
