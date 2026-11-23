import type { InterfaceLang, LearningLang } from '@/lib/languages'

type L10n = Record<InterfaceLang, string>

export interface Example {
  word: string
  // Translation per interface language; omitted when it matches the learning language
  tr: Partial<L10n>
}

export interface Letter {
  letter: string
  name: string
  sound: L10n
  how: L10n
  examples: Example[]
  tip?: L10n
  isSpecial?: boolean
}

export type Digraph = Letter

const es = (word: string, ru: string, en: string): Example => ({ word, tr: { ru, en } })
const en = (word: string, ru: string, esTr: string): Example => ({ word, tr: { ru, es: esTr } })

// ─────────────────────────────────────────────
// Spanish
// ─────────────────────────────────────────────

export const SPANISH_LETTERS: Letter[] = [
  {
    letter: "A", name: "a",
    sound: { ru: "а", en: "ah, as in 'father'", es: "a, como en «casa»" },
    how: {
      ru: "Всегда чистое открытое «а», как в слове «мама». Не ослабляется даже без ударения.",
      en: "Always an open, clear 'ah' as in 'father'. It never weakens to 'uh', even when unstressed.",
      es: "Vocal abierta y clara. Suena igual en cualquier posición, con o sin acento.",
    },
    examples: [es("agua", "вода", "water"), es("casa", "дом", "house"), es("mañana", "утро; завтра", "morning; tomorrow")],
  },
  {
    letter: "B", name: "be",
    sound: { ru: "б", en: "b (softer between vowels)", es: "b, como en «boca»" },
    how: {
      ru: "В начале фразы и после m, n — как русское «б». Между гласными губы почти не смыкаются, и звук становится мягче, ближе к «в».",
      en: "At the start of a phrase and after m or n it's a normal 'b'. Between vowels the lips barely touch, giving a softer sound halfway to 'v'.",
      es: "Oclusiva [b] al inicio de frase y tras m, n («hombre»); entre vocales se suaviza en [β] («lobo»).",
    },
    examples: [es("boca", "рот", "mouth"), es("bebé", "малыш", "baby"), es("lobo", "волк", "wolf")],
    tip: {
      ru: "B и V в испанском читаются одинаково.",
      en: "B and V sound exactly the same in Spanish.",
      es: "B y V se pronuncian igual, por eso hay que memorizar la ortografía.",
    },
  },
  {
    letter: "C", name: "ce", isSpecial: true,
    sound: { ru: "к / с (θ в Испании)", en: "k / s (th in Spain)", es: "k / s (z en España)" },
    how: {
      ru: "Перед a, o, u и согласными — «к». Перед e, i — «с» в Латинской Америке и межзубный звук «θ» (как англ. think) в большей части Испании.",
      en: "Before a, o, u and consonants it's 'k'. Before e and i it's 's' in Latin America and 'th' (as in 'think') in most of Spain.",
      es: "Ante a, o, u y consonante suena [k]. Ante e, i suena [θ] en el centro y norte de España y [s] en América y Canarias (seseo).",
    },
    examples: [es("casa", "дом", "house"), es("cena", "ужин", "dinner"), es("cielo", "небо", "sky")],
    tip: {
      ru: "Звук «к» перед e, i пишется через qu: queso, quinto.",
      en: "The 'k' sound before e and i is spelled qu: queso, quinto.",
      es: "El sonido [k] ante e, i se escribe con qu: «queso», «quinto».",
    },
  },
  {
    letter: "D", name: "de",
    sound: { ru: "д", en: "d (softer between vowels)", es: "d, como en «dedo»" },
    how: {
      ru: "Кончик языка касается верхних зубов. Между гласными звук ослабевает почти до англ. «th» в слове this, а в конце слова часто едва слышен.",
      en: "The tongue touches the back of the upper teeth. Between vowels it softens to almost the 'th' in 'this'; at the end of a word it's often barely heard.",
      es: "Dental [d] al inicio y tras n, l; entre vocales se suaviza en [ð] («cada»). A final de palabra se relaja mucho («Madrid»).",
    },
    examples: [es("dedo", "палец", "finger"), es("cada", "каждый", "each"), es("verdad", "правда", "truth")],
  },
  {
    letter: "E", name: "e",
    sound: { ru: "э", en: "eh, as in 'bet'", es: "e, como en «mesa»" },
    how: {
      ru: "Как русское «э» в слове «это», без призвука «й» в начале. Всегда звучит чётко.",
      en: "Like the 'e' in 'bet': short and pure, never 'ee' and never the glide 'ay'.",
      es: "Vocal media anterior [e]; suena igual en sílaba tónica y átona.",
    },
    examples: [es("mesa", "стол", "table"), es("leche", "молоко", "milk"), es("verde", "зелёный", "green")],
  },
  {
    letter: "F", name: "efe",
    sound: { ru: "ф", en: "f", es: "f, como en «fuego»" },
    how: {
      ru: "Как русское «ф», без особенностей.",
      en: "Same as English 'f'.",
      es: "Fricativa labiodental sorda [f], sin variaciones.",
    },
    examples: [es("fuego", "огонь", "fire"), es("familia", "семья", "family"), es("café", "кофе", "coffee")],
  },
  {
    letter: "G", name: "ge", isSpecial: true,
    sound: { ru: "г / х", en: "g / throaty h", es: "g / j" },
    how: {
      ru: "Перед a, o, u и согласными — «г» (между гласными мягче). Перед e, i — гортанное «х», как буква j.",
      en: "Before a, o, u and consonants it's 'g' (softer between vowels). Before e and i it becomes a rough, throaty 'h', like Spanish j.",
      es: "Ante a, o, u y consonante suena [g], suave entre vocales («lago»). Ante e, i suena como la j [x]: «gente», «girar».",
    },
    examples: [es("gato", "кот", "cat"), es("gente", "люди", "people"), es("guitarra", "гитара", "guitar")],
    tip: {
      ru: "В gue, gui буква u не читается: guerra = «герра». Чтобы u прочиталась, над ней ставят точки: pingüino.",
      en: "In gue and gui the u is silent (guerra = 'GEH-rra'). Two dots make it pronounced: pingüino.",
      es: "En gue, gui la u no suena («guerra»); con diéresis sí suena: «pingüino».",
    },
  },
  {
    letter: "H", name: "hache", isSpecial: true,
    sound: { ru: "не читается", en: "silent", es: "muda" },
    how: {
      ru: "Всегда немая: hola читается «ола». Звучит только в сочетании ch (см. диграфы).",
      en: "Always silent: 'hola' is 'OH-la'. It only matters in the pair ch (see digraphs).",
      es: "No representa ningún sonido: «hola», «ahora». Solo forma parte del dígrafo ch.",
    },
    examples: [es("hola", "привет", "hello"), es("hora", "час", "hour"), es("ahora", "сейчас", "now")],
  },
  {
    letter: "I", name: "i",
    sound: { ru: "и", en: "ee, as in 'see'", es: "i, como en «isla»" },
    how: {
      ru: "Чистое короткое «и». Рядом с другой гласной превращается в «й»: bien = «бьен».",
      en: "A pure, short 'ee'. Next to another vowel it glides into 'y': bien = 'byen'.",
      es: "Vocal cerrada [i]; junto a otra vocal forma diptongo y se convierte en semivocal: «bien», «aire».",
    },
    examples: [es("isla", "остров", "island"), es("libro", "книга", "book"), es("bien", "хорошо", "well")],
  },
  {
    letter: "J", name: "jota",
    sound: { ru: "х (гортанное)", en: "throaty h, as in 'loch'", es: "j, como en «jamón»" },
    how: {
      ru: "Как русское «х», а в Испании ещё твёрже, с хрипотцой. Никогда не «ж» и не «дж».",
      en: "A raspy 'h' from the back of the throat, like Scottish 'loch'. Never like English 'j'.",
      es: "Fricativa velar [x], muy marcada en España; en el Caribe y otras zonas se suaviza en [h].",
    },
    examples: [es("jamón", "хамон (ветчина)", "ham"), es("ojo", "глаз", "eye"), es("joven", "молодой", "young")],
  },
  {
    letter: "K", name: "ka",
    sound: { ru: "к", en: "k (no puff of air)", es: "k, como en «kilo»" },
    how: {
      ru: "Как русское «к». Встречается только в заимствованных словах.",
      en: "Like English 'k' but without the puff of air. Found only in borrowed words.",
      es: "Oclusiva velar [k]. Solo aparece en préstamos y extranjerismos.",
    },
    examples: [es("kilo", "килограмм", "kilo"), es("koala", "коала", "koala"), es("karate", "карате", "karate")],
  },
  {
    letter: "L", name: "ele",
    sound: { ru: "л (мягче русского)", en: "light l, as in 'leaf'", es: "l, como en «luna»" },
    how: {
      ru: "Мягче русского «л», ближе к «ль» в слове «лес». Остаётся мягким даже в конце слова.",
      en: "Always a light 'l' as in 'leaf' — never the dark l of 'ball', even at the end of a word.",
      es: "Lateral alveolar [l], siempre clara, también a final de sílaba («sol»).",
    },
    examples: [es("luna", "луна", "moon"), es("sol", "солнце", "sun"), es("libro", "книга", "book")],
  },
  {
    letter: "M", name: "eme",
    sound: { ru: "м", en: "m", es: "m, como en «madre»" },
    how: {
      ru: "Как русское «м».",
      en: "Same as English 'm'.",
      es: "Nasal bilabial [m].",
    },
    examples: [es("madre", "мать", "mother"), es("mano", "рука", "hand"), es("mamá", "мама", "mom")],
  },
  {
    letter: "N", name: "ene",
    sound: { ru: "н", en: "n", es: "n, como en «nube»" },
    how: {
      ru: "Как русское «н». Перед b, v, p звучит как «м»: un beso ≈ «ум бесо».",
      en: "Like English 'n'. Before b, v and p it turns into 'm': 'un beso' sounds like 'um beso'.",
      es: "Nasal alveolar [n]; ante b, v, p se asimila a [m]: «envío», «un beso».",
    },
    examples: [es("nombre", "имя", "name"), es("nada", "ничего", "nothing"), es("nube", "облако", "cloud")],
  },
  {
    letter: "Ñ", name: "eñe", isSpecial: true,
    sound: { ru: "нь", en: "ny, as in 'canyon'", es: "ñ, como en «niño»" },
    how: {
      ru: "Мягкое «нь», как в слове «няня». Это отдельная буква алфавита, а не n со значком.",
      en: "Like the 'ny' in 'canyon'. It's a separate letter of the alphabet, not just an n with a mark.",
      es: "Nasal palatal [ɲ]. Es una letra propia del alfabeto y va después de la n en el diccionario.",
    },
    examples: [es("niño", "ребёнок", "child"), es("año", "год", "year"), es("España", "Испания", "Spain")],
    tip: {
      ru: "Тильда меняет смысл: pena — печаль, peña — скала.",
      en: "The tilde changes meaning: pena = sorrow, peña = rock.",
      es: "La virgulilla cambia el significado: «pena» no es lo mismo que «peña».",
    },
  },
  {
    letter: "O", name: "o",
    sound: { ru: "о", en: "oh (short, pure)", es: "o, como en «ojo»" },
    how: {
      ru: "Всегда «о», даже без ударения, никакого «аканья»: bonito = «бонито», не «банито».",
      en: "A short, pure 'o', without the 'ow' glide of English 'go'.",
      es: "Vocal media posterior [o], igual en sílaba tónica y átona.",
    },
    examples: [es("ojo", "глаз", "eye"), es("todo", "всё", "everything"), es("como", "как", "how; like")],
  },
  {
    letter: "P", name: "pe",
    sound: { ru: "п", en: "p (no puff of air)", es: "p, como en «padre»" },
    how: {
      ru: "Как русское «п».",
      en: "Like English 'p' but without the puff of air — closer to the p in 'spin'.",
      es: "Oclusiva bilabial sorda [p], sin aspiración.",
    },
    examples: [es("padre", "отец", "father"), es("pan", "хлеб", "bread"), es("papá", "папа", "dad")],
  },
  {
    letter: "Q", name: "cu", isSpecial: true,
    sound: { ru: "к (только в que, qui)", en: "k (only in que, qui)", es: "k, solo en que, qui" },
    how: {
      ru: "Встречается только в сочетаниях que и qui, где u не читается: queso = «кесо».",
      en: "Appears only in que and qui, and the u is silent: queso = 'KEH-so'. Never 'kw'.",
      es: "Solo se usa en los grupos que, qui, donde la u es muda: [ke], [ki].",
    },
    examples: [es("queso", "сыр", "cheese"), es("quien", "кто", "who"), es("aquí", "здесь", "here")],
  },
  {
    letter: "R", name: "erre", isSpecial: true,
    sound: { ru: "р / рр (раскатистое)", en: "tapped r / rolled rr", es: "r suave / rr fuerte" },
    how: {
      ru: "Одиночная r между гласными и в конце слога — один короткий удар языка (pero). В начале слова и после l, n, s — раскатистое «рр» (rosa).",
      en: "A single r between vowels or at the end of a syllable is one quick tap, like the 'tt' in American 'butter' (pero). At the start of a word and after l, n, s it's a full rolled trill (rosa).",
      es: "Vibrante simple [ɾ] entre vocales y a final de sílaba («pero», «mar»); vibrante múltiple [r] a inicio de palabra y tras l, n, s («rosa», «alrededor»).",
    },
    examples: [es("pero", "но", "but"), es("rosa", "роза", "rose"), es("mar", "море", "sea")],
    tip: {
      ru: "pero (но) и perro (собака) различаются только раскатистостью «р».",
      en: "pero (but) and perro (dog) differ only in the trill.",
      es: "«pero» y «perro» solo se distinguen por la vibrante.",
    },
  },
  {
    letter: "S", name: "ese",
    sound: { ru: "с", en: "s (never z)", es: "s, como en «semana»" },
    how: {
      ru: "Всегда глухое «с», даже между гласными: casa = «каса», не «каза». В Андалусии и на Карибах в конце слога часто звучит как лёгкий выдох.",
      en: "Always a hissing 's', even between vowels: casa is 'KAH-sa', not 'KAH-za'. In Andalusia and the Caribbean it often weakens to a breathy 'h' at the end of a syllable.",
      es: "Fricativa sorda [s]. En Andalucía, Canarias y el Caribe se aspira a final de sílaba: «e(h)to».",
    },
    examples: [es("semana", "неделя", "week"), es("casa", "дом", "house"), es("mes", "месяц", "month")],
  },
  {
    letter: "T", name: "te",
    sound: { ru: "т", en: "t (dental, no puff)", es: "t, como en «taza»" },
    how: {
      ru: "Как русское «т»: кончик языка у верхних зубов.",
      en: "The tongue touches the back of the upper teeth and there's no puff of air — softer than English 't'.",
      es: "Oclusiva dental sorda [t], sin aspiración.",
    },
    examples: [es("taza", "чашка", "cup"), es("tiempo", "время; погода", "time; weather"), es("tomate", "помидор", "tomato")],
  },
  {
    letter: "U", name: "u",
    sound: { ru: "у", en: "oo, as in 'moon'", es: "u, como en «uva»" },
    how: {
      ru: "Чистое «у». Рядом с другой гласной — короткое, как англ. w: bueno = «буэно». В que, qui, gue, gui не читается.",
      en: "A pure 'oo' as in 'moon'. Next to another vowel it glides into 'w': bueno = 'BWEH-no'. Silent in que, qui, gue, gui.",
      es: "Vocal cerrada posterior [u]; semivocal en diptongos («bueno») y muda en que, qui, gue, gui.",
    },
    examples: [es("uva", "виноград", "grape"), es("bueno", "хороший", "good"), es("música", "музыка", "music")],
  },
  {
    letter: "V", name: "uve", isSpecial: true,
    sound: { ru: "б (как B)", en: "b (same as B)", es: "igual que la b" },
    how: {
      ru: "Читается точно как b: в начале — «б», между гласными — мягкое «б». Звука «в» в испанском нет.",
      en: "Pronounced exactly like b — a 'b' at the start, a soft b between vowels. Spanish has no 'v' sound.",
      es: "Representa el mismo sonido que la b: [b] o [β] según la posición. Pronunciarla labiodental es un error.",
    },
    examples: [es("vino", "вино", "wine"), es("vaca", "корова", "cow"), es("nuevo", "новый", "new")],
    tip: {
      ru: "При диктовке по буквам различают так: «be de burro» и «uve de vaca».",
      en: "When spelling aloud, people say 'be de burro' and 'uve de vaca' to tell them apart.",
      es: "Para deletrear se dice «be de burro» y «uve de vaca».",
    },
  },
  {
    letter: "W", name: "uve doble",
    sound: { ru: "у (в заимствованиях)", en: "w (in loanwords)", es: "w, como en «web»" },
    how: {
      ru: "Только в заимствованных словах. Обычно «у» (web = «уэб»), в некоторых словах немецкого происхождения — «б».",
      en: "Only in loanwords. Usually 'w' (web, wifi); in a few older German loans it's a b.",
      es: "Solo en extranjerismos: [w] en palabras de origen inglés («web», «wifi») y [b] en algunas de origen alemán («wolframio»).",
    },
    examples: [es("web", "веб-сайт", "website"), es("wifi", "вай-фай", "wi-fi"), es("sándwich", "сэндвич", "sandwich")],
  },
  {
    letter: "X", name: "equis", isSpecial: true,
    sound: { ru: "кс / х", en: "ks / h (in México)", es: "ks / j" },
    how: {
      ru: "Обычно «кс» (taxi). В начале слова часто просто «с» (xilófono). В некоторых мексиканских названиях — «х»: México = «Мехико».",
      en: "Usually 'ks' (taxi). At the start of a word often just 's' (xilófono). In some Mexican names it's a throaty 'h': México = 'MEH-hee-ko'.",
      es: "Suele sonar [ks] («taxi», «examen»); a inicio de palabra, [s] («xilófono»); en algunos nombres mexicanos, [x] («México», «Oaxaca»).",
    },
    examples: [es("taxi", "такси", "taxi"), es("examen", "экзамен", "exam"), es("México", "Мексика", "Mexico")],
  },
  {
    letter: "Y", name: "ye", isSpecial: true,
    sound: { ru: "й / и", en: "y / ee", es: "y, como en «yo»" },
    how: {
      ru: "Перед гласной — «й» (в Аргентине и Уругвае — «ж» или «ш»). Как отдельное слово y («и») и в конце слова — «и».",
      en: "Before a vowel it's 'y' (closer to 'zh' or 'sh' in Argentina and Uruguay). As the word y ('and') and at the end of a word it's 'ee'.",
      es: "Consonante palatal [ʝ] ante vocal («yo», «playa»), con rehilamiento en el Río de la Plata; vocal [i] como conjunción y a final de palabra («hoy»).",
    },
    examples: [es("yo", "я", "I"), es("playa", "пляж", "beach"), es("hoy", "сегодня", "today")],
  },
  {
    letter: "Z", name: "zeta", isSpecial: true,
    sound: { ru: "θ (в Испании) / с", en: "th (in Spain) / s", es: "z, como en «zapato»" },
    how: {
      ru: "В Испании — межзубный звук, как англ. th в слове think. В Латинской Америке и на Канарах — обычное «с».",
      en: "In Spain it's the 'th' of 'think'. In Latin America and the Canary Islands it's a plain 's'.",
      es: "Interdental [θ] en la mayor parte de España; [s] en América, Canarias y parte de Andalucía (seseo).",
    },
    examples: [es("zapato", "ботинок", "shoe"), es("azul", "синий", "blue"), es("luz", "свет", "light")],
  },
]

export const SPANISH_DIGRAPHS: Digraph[] = [
  {
    letter: "CH", name: "che",
    sound: { ru: "ч", en: "ch, as in 'church'", es: "ch, como en «chico»" },
    how: {
      ru: "Как русское «ч», но твёрже. Читается всегда одинаково.",
      en: "Like the 'ch' in 'church'. Always the same.",
      es: "Africada palatal sorda [tʃ], sin variaciones.",
    },
    examples: [es("chico", "мальчик, парень", "boy"), es("mucho", "много", "a lot"), es("chocolate", "шоколад", "chocolate")],
  },
  {
    letter: "LL", name: "elle",
    sound: { ru: "й (ж/ш в Аргентине)", en: "y (zh/sh in Argentina)", es: "ll, como en «llave»" },
    how: {
      ru: "Сегодня почти везде читается как y — «й»: calle = «кайе». В Аргентине и Уругвае — «ж» или «ш»: «каже», «каше».",
      en: "Today almost everywhere it's the same as y: calle = 'KAH-yeh'. In Argentina and Uruguay it sounds like 'zh' or 'sh'.",
      es: "Hoy la mayoría de hablantes la pronuncia igual que la y (yeísmo); la lateral [ʎ] se conserva en zonas andinas y del norte de España.",
    },
    examples: [es("llave", "ключ", "key"), es("calle", "улица", "street"), es("pollo", "курица", "chicken")],
  },
  {
    letter: "RR", name: "doble erre",
    sound: { ru: "рр (раскатистое)", en: "rr (rolled trill)", es: "rr, como en «perro»" },
    how: {
      ru: "Длинное раскатистое «р» — язык ударяет 2–4 раза. Пишется только между гласными.",
      en: "A strong rolled trill — the tongue taps 2–4 times. Written only between vowels.",
      es: "Vibrante múltiple [r]; solo se escribe entre vocales. A inicio de palabra basta una r («rosa»).",
    },
    examples: [es("perro", "собака", "dog"), es("tierra", "земля", "earth; land"), es("carro", "машина; тележка", "car; cart")],
    tip: {
      ru: "Тренировка: быстро повторяй «тр-др-тр», пока язык не начнёт вибрировать.",
      en: "Practice: say 'tr-dr-tr' quickly until your tongue starts to vibrate.",
      es: "Para practicar, repite rápido «tr-dr-tr» hasta que la lengua vibre.",
    },
  },
]

// ─────────────────────────────────────────────
// English
// ─────────────────────────────────────────────

export const ENGLISH_LETTERS: Letter[] = [
  {
    letter: "A", name: "a", isSpecial: true,
    sound: { ru: "эй / э / а", en: "ay (name) / a (cat) / ah (father)", es: "ei / a abierta / a larga" },
    how: {
      ru: "Три главных чтения: «эй» в открытом слоге (name), широкое «э», почти «а», в закрытом (cat) и долгое «а» (father, car). Без ударения — нейтральный звук «ə» (about).",
      en: "Three main sounds: 'ay' as in 'name', short 'a' as in 'cat', and 'ah' as in 'father'. Unstressed it often weakens to 'uh' (about).",
      es: "Tres lecturas principales: «ei» en sílaba abierta (name), una «a» muy abierta, casi «e», en sílaba cerrada (cat) y «a» larga (father, car). Sin acento se reduce a [ə] (about).",
    },
    examples: [en("name", "имя", "nombre"), en("cat", "кошка", "gato"), en("father", "отец", "padre")],
  },
  {
    letter: "B", name: "bee",
    sound: { ru: "б", en: "b, as in 'book'", es: "b (siempre fuerte)" },
    how: {
      ru: "Как русское «б». Не читается после m в конце слова (lamb, comb) и перед t (doubt).",
      en: "A regular 'b'. Silent after m at the end of a word (lamb, comb) and before t (doubt).",
      es: "Siempre oclusiva, con los labios bien cerrados, también entre vocales. Muda en -mb final (lamb) y ante t (doubt).",
    },
    examples: [en("book", "книга", "libro"), en("baby", "малыш", "bebé"), en("lamb", "ягнёнок", "cordero")],
  },
  {
    letter: "C", name: "cee", isSpecial: true,
    sound: { ru: "к / с", en: "k (cup) / s (city)", es: "k / s" },
    how: {
      ru: "Перед a, o, u и согласными — «к» (cup), перед e, i, y — «с» (city).",
      en: "Hard 'k' before a, o, u and consonants (cup); soft 's' before e, i, y (city).",
      es: "Suena [k] ante a, o, u y consonante (cup); [s] ante e, i, y (city), nunca [θ] como en España.",
    },
    examples: [en("cup", "чашка", "taza"), en("city", "город", "ciudad"), en("cold", "холодный", "frío")],
  },
  {
    letter: "D", name: "dee",
    sound: { ru: "д", en: "d, as in 'dog'", es: "d (alveolar)" },
    how: {
      ru: "Похоже на «д», но язык касается бугорков за зубами, а не самих зубов. Окончание -ed бывает «д» (played), «т» (walked) или «ид» (wanted).",
      en: "A regular 'd'. The past ending -ed can sound like 'd' (played), 't' (walked) or 'id' (wanted).",
      es: "La lengua toca los alvéolos, no los dientes, y no se suaviza entre vocales. La terminación -ed suena [d], [t] o [ɪd]: played, walked, wanted.",
    },
    examples: [en("dog", "собака", "perro"), en("day", "день", "día"), en("walked", "гулял", "caminó")],
  },
  {
    letter: "E", name: "e", isSpecial: true,
    sound: { ru: "и / э", en: "ee (he) / e (ten)", es: "i / e" },
    how: {
      ru: "В открытом слоге — долгое «и» (he), в закрытом — «э» (ten). Буква e в конце слова не читается, но делает предыдущую гласную «длинной»: hop → hope.",
      en: "Long 'ee' as in 'he', short 'e' as in 'ten'. A silent final e makes the previous vowel long: hop → hope.",
      es: "«i» larga en sílaba abierta (he), «e» en sílaba cerrada (ten). La e final es muda y alarga la vocal anterior: hop → hope.",
    },
    examples: [en("he", "он", "él"), en("ten", "десять", "diez"), en("hope", "надежда", "esperanza")],
  },
  {
    letter: "F", name: "ef",
    sound: { ru: "ф", en: "f, as in 'fish'", es: "f" },
    how: {
      ru: "Как русское «ф». Исключение: of читается «ов».",
      en: "A regular 'f'. One exception: 'of' is pronounced 'uv'.",
      es: "Igual que en español. Excepción: «of» se pronuncia [əv].",
    },
    examples: [en("fish", "рыба", "pez"), en("family", "семья", "familia"), en("coffee", "кофе", "café")],
  },
  {
    letter: "G", name: "gee", isSpecial: true,
    sound: { ru: "г / дж", en: "g (go) / j (gym)", es: "g / «ch» sonora" },
    how: {
      ru: "Перед a, o, u и согласными — «г» (go). Перед e, i, y часто «дж» (gym), но есть много исключений: get, give, girl.",
      en: "Hard 'g' as in 'go'; often soft 'j' before e, i, y (gym, giant) — with many exceptions: get, give, girl.",
      es: "Suena [g] (go). Ante e, i, y a menudo [dʒ], como una «ch» sonora (gym), aunque hay muchas excepciones: get, give, girl.",
    },
    examples: [en("go", "идти", "ir"), en("gym", "спортзал", "gimnasio"), en("girl", "девочка", "niña")],
  },
  {
    letter: "H", name: "aitch",
    sound: { ru: "х (лёгкий выдох)", en: "h, as in 'house'", es: "j muy suave (aspirada)" },
    how: {
      ru: "Лёгкий выдох, тише и мягче русского «х». В некоторых словах не читается: hour, honest.",
      en: "Just a puff of breath. Silent in a few words: hour, honest, honour.",
      es: "Una exhalación suave, mucho más débil que la j española. Muda en hour, honest.",
    },
    examples: [en("house", "дом", "casa"), en("hello", "привет", "hola"), en("hour", "час", "hora")],
  },
  {
    letter: "I", name: "i", isSpecial: true,
    sound: { ru: "ай / и", en: "eye (time) / i (sit)", es: "ai / i breve" },
    how: {
      ru: "В открытом слоге — «ай» (time), в закрытом — короткое расслабленное «и», немного похожее на «ы» (sit). Перед r — звук, похожий на «ё» (bird).",
      en: "'Eye' as in 'time', short 'i' as in 'sit', and the 'ur' sound before r (bird).",
      es: "«ai» en sílaba abierta (time), una «i» corta y relajada en sílaba cerrada (sit), y [ɜː] ante r (bird).",
    },
    examples: [en("time", "время", "tiempo"), en("sit", "сидеть", "sentarse"), en("bird", "птица", "pájaro")],
  },
  {
    letter: "J", name: "jay",
    sound: { ru: "дж", en: "j, as in 'job'", es: "«ch» sonora [dʒ]" },
    how: {
      ru: "Всегда «дж»: job, juice. Никогда не «й» и не «х».",
      en: "Always the 'j' of 'job' and 'juice'.",
      es: "Siempre [dʒ], como una «ch» sonora: job, juice. Nunca como la j española.",
    },
    examples: [en("job", "работа", "trabajo"), en("juice", "сок", "zumo, jugo"), en("June", "июнь", "junio")],
  },
  {
    letter: "K", name: "kay",
    sound: { ru: "к (с придыханием)", en: "k, as in 'key'", es: "k (aspirada)" },
    how: {
      ru: "«к» с лёгким выдохом. Перед n в начале слова не читается: know, knife.",
      en: "A regular 'k'. Silent before n at the start of a word: know, knife, knee.",
      es: "[k] con aspiración. Muda ante n inicial: know, knife.",
    },
    examples: [en("key", "ключ", "llave"), en("kitchen", "кухня", "cocina"), en("knife", "нож", "cuchillo")],
  },
  {
    letter: "L", name: "el",
    sound: { ru: "л (в конце — твёрдое)", en: "light l / dark l", es: "l (oscura al final)" },
    how: {
      ru: "Перед гласной — мягкое, светлое «л» (light). В конце слова и перед согласными — «тёмное», как твёрдое русское «л» (ball, milk). Иногда не читается: walk, talk.",
      en: "Clear 'l' before vowels (light), dark 'l' at the end of a word and before consonants (ball, milk). Silent in walk, talk, half.",
      es: "Clara ante vocal (light) y «oscura», con la lengua retraída, a final de sílaba (ball, milk). Muda en walk, talk.",
    },
    examples: [en("light", "свет", "luz"), en("ball", "мяч", "pelota"), en("milk", "молоко", "leche")],
  },
  {
    letter: "M", name: "em",
    sound: { ru: "м", en: "m, as in 'man'", es: "m" },
    how: {
      ru: "Как русское «м».",
      en: "A regular 'm'.",
      es: "Igual que en español.",
    },
    examples: [en("man", "мужчина", "hombre"), en("mother", "мать", "madre"), en("summer", "лето", "verano")],
  },
  {
    letter: "N", name: "en",
    sound: { ru: "н", en: "n, as in 'no'", es: "n" },
    how: {
      ru: "Как «н». В сочетании ng — носовой звук без «г» (sing). После m в конце слова не читается: autumn.",
      en: "A regular 'n'. In 'ng' it merges into one nasal sound (sing). Silent after m at the end of a word: autumn.",
      es: "Como la n española. En -ng forma un sonido nasal [ŋ] sin «g» audible (sing). Muda en -mn final: autumn.",
    },
    examples: [en("no", "нет", "no"), en("nose", "нос", "nariz"), en("sing", "петь", "cantar")],
  },
  {
    letter: "O", name: "o", isSpecial: true,
    sound: { ru: "оу / о / а", en: "oh (go) / o (hot) / uh (love)", es: "ou / o / a breve" },
    how: {
      ru: "В открытом слоге — «оу» (go, home). В закрытом — короткое «о» в британском и почти «а» в американском (hot). Нередко звучит как краткое «а» (love, mother).",
      en: "'Oh' as in 'go', short 'o' as in 'hot', and 'uh' in words like 'love' and 'mother'.",
      es: "«ou» en sílaba abierta (go, home), «o» breve en sílaba cerrada (hot; casi «a» en EE. UU.) y [ʌ], parecida a una «a» breve, en love, mother.",
    },
    examples: [en("home", "дом", "casa, hogar"), en("hot", "горячий", "caliente"), en("love", "любовь", "amor")],
  },
  {
    letter: "P", name: "pee",
    sound: { ru: "п (с придыханием)", en: "p, as in 'pen'", es: "p (aspirada)" },
    how: {
      ru: "«п» с заметным выдохом в начале слова (pen). Сочетание ph читается «ф», а в psychology p не читается.",
      en: "A 'p' with a puff of air at the start of a word (pen). 'ph' sounds like 'f'; p is silent in 'psychology'.",
      es: "[p] con aspiración a inicio de palabra (pen). En ph suena [f]; muda en psychology.",
    },
    examples: [en("pen", "ручка", "bolígrafo"), en("apple", "яблоко", "manzana"), en("people", "люди", "gente")],
  },
  {
    letter: "Q", name: "cue", isSpecial: true,
    sound: { ru: "кв (qu)", en: "kw (qu)", es: "kw (qu)" },
    how: {
      ru: "Почти всегда стоит в паре с u и читается «кв»: queen, quick.",
      en: "Almost always followed by u and pronounced 'kw': queen, quick.",
      es: "Casi siempre va con u y suena [kw]: queen, quick (no [k] como en español).",
    },
    examples: [en("queen", "королева", "reina"), en("question", "вопрос", "pregunta"), en("quick", "быстрый", "rápido")],
  },
  {
    letter: "R", name: "ar", isSpecial: true,
    sound: { ru: "р (без вибрации)", en: "r, as in 'red'", es: "r (sin vibrar)" },
    how: {
      ru: "Кончик языка загнут назад и не касается нёба — звук без вибрации. В британском варианте после гласной не читается (car = «ка:»), в американском — слышен.",
      en: "The tongue curls back without touching anything — no tap or trill. In British English it's silent after a vowel (car = 'cah'); in American English it's pronounced.",
      es: "La lengua se curva hacia atrás sin tocar el paladar: no vibra. En inglés británico no suena tras vocal (car); en americano, sí.",
    },
    examples: [en("red", "красный", "rojo"), en("car", "машина", "coche, carro"), en("river", "река", "río")],
  },
  {
    letter: "S", name: "ess", isSpecial: true,
    sound: { ru: "с / з", en: "s (sun) / z (rose)", es: "s / z sonora" },
    how: {
      ru: "«с» в начале слова (sun), часто «з» между гласными и в окончаниях (rose, dogs). В sure, sugar — «ш».",
      en: "'s' as in 'sun', 'z' between vowels and in many endings (rose, dogs), and 'sh' in sure, sugar.",
      es: "[s] a inicio de palabra (sun), [z] sonora entre vocales y en muchas terminaciones (rose, dogs), [ʃ] en sure, sugar.",
    },
    examples: [en("sun", "солнце", "sol"), en("rose", "роза", "rosa"), en("dogs", "собаки", "perros")],
  },
  {
    letter: "T", name: "tee",
    sound: { ru: "т (с придыханием)", en: "t, as in 'tea'", es: "t (aspirada)" },
    how: {
      ru: "«т» с выдохом; язык касается бугорков за зубами. В американском варианте между гласными звучит почти как быстрое «д» (water).",
      en: "A 't' with a puff of air at the start of a word (tea). In American English between vowels it becomes a quick tap like 'd' (water, better).",
      es: "[t] alveolar con aspiración (tea). En EE. UU., entre vocales se convierte en un toque suave, como la r de «pero» (water).",
    },
    examples: [en("tea", "чай", "té"), en("table", "стол", "mesa"), en("water", "вода", "agua")],
  },
  {
    letter: "U", name: "u", isSpecial: true,
    sound: { ru: "ю / а / у", en: "you (use) / uh (cup) / oo (put)", es: "iu / a breve / u" },
    how: {
      ru: "В открытом слоге — «ю» (use, music), в закрытом — краткое «а» (cup, sun), иногда «у» (put, rule).",
      en: "'You' as in 'use', 'uh' as in 'cup', and 'oo' as in 'put' or 'rule'.",
      es: "«iu» en sílaba abierta (use, music), [ʌ], parecida a una «a» breve, en sílaba cerrada (cup, sun) y «u» en put, rule.",
    },
    examples: [en("use", "использовать", "usar"), en("cup", "чашка", "taza"), en("put", "класть", "poner")],
  },
  {
    letter: "V", name: "vee",
    sound: { ru: "в", en: "v, as in 'very'", es: "v (labiodental)" },
    how: {
      ru: "Как русское «в»: верхние зубы касаются нижней губы. Не путай с w.",
      en: "Upper teeth touch the lower lip. Keep it distinct from 'b' and 'w'.",
      es: "A diferencia del español, es labiodental: los dientes superiores tocan el labio inferior.",
    },
    examples: [en("very", "очень", "muy"), en("voice", "голос", "voz"), en("five", "пять", "cinco")],
    tip: {
      ru: "v и w — разные звуки: vest (жилет) ≠ west (запад).",
      en: "v and w are different sounds: vest ≠ west.",
      es: "En inglés b y v se distinguen: very ≠ berry, vote ≠ boat.",
    },
  },
  {
    letter: "W", name: "double-u",
    sound: { ru: "у (губы трубочкой)", en: "w, as in 'we'", es: "u breve, como en «huevo»" },
    how: {
      ru: "Короткое «у», переходящее в следующую гласную; губы вытянуты трубочкой (we, window). Это не «в»! Перед r не читается: write.",
      en: "Round the lips as for 'oo' and glide into the vowel (we, window). Silent before r: write, wrong.",
      es: "Una «u» breve que se desliza hacia la vocal siguiente, como en «huevo» (we, window). Muda ante r: write.",
    },
    examples: [en("we", "мы", "nosotros"), en("window", "окно", "ventana"), en("write", "писать", "escribir")],
  },
  {
    letter: "X", name: "ex",
    sound: { ru: "кс / гз", en: "ks (box) / gz (exam)", es: "ks / gz" },
    how: {
      ru: "Обычно «кс» (box), перед ударной гласной — «гз» (exam). В начале слова — «з» (xylophone).",
      en: "'ks' as in 'box', 'gz' as in 'exam', and 'z' at the start of a word (xylophone).",
      es: "[ks] (box), [gz] ante vocal acentuada (exam) y [z] a inicio de palabra (xylophone).",
    },
    examples: [en("box", "коробка", "caja"), en("exam", "экзамен", "examen"), en("six", "шесть", "seis")],
  },
  {
    letter: "Y", name: "wye", isSpecial: true,
    sound: { ru: "й / ай / и", en: "y (yes) / eye (my) / ee (funny)", es: "y / ai / i" },
    how: {
      ru: "В начале слова — «й» (yes), в конце коротких слов — «ай» (my), в конце длинных — «и» (funny).",
      en: "'y' as in 'yes' at the start, 'eye' at the end of short words (my, fly), and 'ee' at the end of longer ones (funny).",
      es: "Consonante [j] a inicio de palabra (yes), «ai» al final de palabras cortas (my) e «i» al final de palabras largas (funny).",
    },
    examples: [en("yes", "да", "sí"), en("my", "мой", "mi"), en("funny", "смешной", "gracioso")],
  },
  {
    letter: "Z", name: "zee",
    sound: { ru: "з", en: "z, as in 'zoo'", es: "z sonora (zumbido)" },
    how: {
      ru: "Звонкое «з», как в слове «зебра». В британском английском буква называется zed, в американском — zee.",
      en: "A buzzing 'z'. The letter is called 'zed' in British English and 'zee' in American English.",
      es: "[z] sonora, como el zumbido de una abeja; nunca [θ] ni [s]. Se llama «zed» en Reino Unido y «zee» en EE. UU.",
    },
    examples: [en("zoo", "зоопарк", "zoológico"), en("zero", "ноль", "cero"), en("size", "размер", "tamaño")],
  },
]

export const ENGLISH_DIGRAPHS: Digraph[] = [
  {
    letter: "TH", name: "th",
    sound: { ru: "θ / ð (межзубные)", en: "th (think / this)", es: "z de España / d suave" },
    how: {
      ru: "Кончик языка между зубами. Глухой θ (think) — как «с», но с языком между зубами; звонкий ð (this) — так же, но как «з». Не заменяй на «с», «з», «ф» или «д».",
      en: "Tongue between the teeth: unvoiced in 'think', voiced in 'this'. Don't replace it with 's', 'f', 'd' or 'z'.",
      es: "Lengua entre los dientes: sorda [θ], como la z de España (think); sonora [ð], como la d de «cada» (this).",
    },
    examples: [en("think", "думать", "pensar"), en("this", "это", "esto"), en("mother", "мать", "madre")],
  },
  {
    letter: "SH", name: "sh",
    sound: { ru: "ш", en: "sh, as in 'she'", es: "sh, como al pedir silencio" },
    how: {
      ru: "Как «ш», но мягче, с округлёнными губами.",
      en: "As in 'she' and 'shop'.",
      es: "[ʃ], el sonido que usamos para pedir silencio: «shh».",
    },
    examples: [en("she", "она", "ella"), en("shop", "магазин", "tienda"), en("wash", "мыть", "lavar")],
  },
  {
    letter: "CH", name: "ch",
    sound: { ru: "ч", en: "ch, as in 'cheese'", es: "ch" },
    how: {
      ru: "Обычно «ч», твёрже русского (cheese). В словах греческого происхождения — «к» (school), французского — «ш» (machine).",
      en: "Usually as in 'cheese'; 'k' in some Greek-origin words (school) and 'sh' in French ones (machine).",
      es: "Normalmente como la ch española (cheese); [k] en palabras de origen griego (school) y [ʃ] en las de origen francés (machine).",
    },
    examples: [en("cheese", "сыр", "queso"), en("school", "школа", "escuela"), en("machine", "машина, механизм", "máquina")],
  },
  {
    letter: "PH", name: "ph",
    sound: { ru: "ф", en: "f, as in 'phone'", es: "f" },
    how: {
      ru: "Всегда «ф». Встречается в словах греческого происхождения.",
      en: "Always 'f'. Found in words of Greek origin.",
      es: "Siempre [f]; aparece en palabras de origen griego.",
    },
    examples: [en("phone", "телефон", "teléfono"), en("photo", "фото", "foto"), en("elephant", "слон", "elefante")],
  },
  {
    letter: "GH", name: "gh",
    sound: { ru: "не читается / ф / г", en: "silent / f / g", es: "muda / f / g" },
    how: {
      ru: "Чаще всего не читается (night, daughter). Иногда «ф» (laugh, enough), в начале слова — «г» (ghost).",
      en: "Usually silent (night, daughter), sometimes 'f' (laugh, enough), and 'g' at the start of a word (ghost).",
      es: "Casi siempre muda (night, daughter), a veces [f] (laugh, enough) y [g] a inicio de palabra (ghost).",
    },
    examples: [en("night", "ночь", "noche"), en("laugh", "смеяться", "reír"), en("ghost", "призрак", "fantasma")],
  },
]

export interface AlphabetData {
  letters: Letter[]
  digraphs: Digraph[]
  title: L10n
  subtitle: L10n
  digraphNote: L10n
}

// Learning languages without an entry here have no alphabet page;
// keep hasAlphabet in lib/languages.ts in sync
const ALPHABETS: Partial<Record<LearningLang, AlphabetData>> = {
  es: {
    letters: SPANISH_LETTERS,
    digraphs: SPANISH_DIGRAPHS,
    title: { ru: 'Испанский алфавит', en: 'Spanish Alphabet', es: 'Alfabeto español' },
    subtitle: { ru: '27 букв', en: '27 letters', es: '27 letras' },
    digraphNote: {
      ru: 'Две буквы — один звук. CH и LL считались отдельными буквами до 2010 года',
      en: 'Two letters, one sound. CH and LL counted as separate letters until 2010',
      es: 'Dos letras, un sonido. CH y LL se consideraron letras hasta 2010',
    },
  },
  en: {
    letters: ENGLISH_LETTERS,
    digraphs: ENGLISH_DIGRAPHS,
    title: { ru: 'Английский алфавит', en: 'English Alphabet', es: 'Alfabeto inglés' },
    subtitle: { ru: '26 букв', en: '26 letters', es: '26 letras' },
    digraphNote: {
      ru: 'Важные сочетания букв',
      en: 'Important letter combinations',
      es: 'Combinaciones importantes',
    },
  },
}

export function getAlphabetData(language: LearningLang): AlphabetData | null {
  return ALPHABETS[language] ?? null
}
