import type { LearningLanguage, InterfaceLanguage } from './types'

export interface Letter {
  letter: string
  name: string
  sound: Record<InterfaceLanguage, string>
  isSpecial?: boolean
}

export interface Digraph {
  letter: string
  name: string
  sound: Record<InterfaceLanguage, string>
}

// Spanish alphabet
export const SPANISH_LETTERS: Letter[] = [
  { letter: "A", name: "a", sound: { ru: "а", en: "ah", es: "a" } },
  { letter: "B", name: "be", sound: { ru: "б (мягче)", en: "b (softer)", es: "b (suave)" } },
  { letter: "C", name: "ce", sound: { ru: "с / к", en: "s / k", es: "s / k" }, isSpecial: true },
  { letter: "D", name: "de", sound: { ru: "д (между зубами)", en: "d (dental)", es: "d (dental)" } },
  { letter: "E", name: "e", sound: { ru: "э", en: "eh", es: "e" } },
  { letter: "F", name: "efe", sound: { ru: "ф", en: "f", es: "f" } },
  { letter: "G", name: "ge", sound: { ru: "г / х", en: "g / h", es: "g / j" }, isSpecial: true },
  { letter: "H", name: "hache", sound: { ru: "не читается!", en: "silent!", es: "muda!" }, isSpecial: true },
  { letter: "I", name: "i", sound: { ru: "и", en: "ee", es: "i" } },
  { letter: "J", name: "jota", sound: { ru: "х (сильное)", en: "h (strong)", es: "j (fuerte)" } },
  { letter: "K", name: "ka", sound: { ru: "к", en: "k", es: "k" } },
  { letter: "L", name: "ele", sound: { ru: "л", en: "l", es: "l" } },
  { letter: "M", name: "eme", sound: { ru: "м", en: "m", es: "m" } },
  { letter: "N", name: "ene", sound: { ru: "н", en: "n", es: "n" } },
  { letter: "Ñ", name: "eñe", sound: { ru: "нь (как в «ня»)", en: "ny (like canyon)", es: "ñ (como niño)" }, isSpecial: true },
  { letter: "O", name: "o", sound: { ru: "о", en: "oh", es: "o" } },
  { letter: "P", name: "pe", sound: { ru: "п", en: "p", es: "p" } },
  { letter: "Q", name: "cu", sound: { ru: "к (только с «u»)", en: "k (only with u)", es: "k (solo con u)" }, isSpecial: true },
  { letter: "R", name: "erre", sound: { ru: "р / рр (раскатистое)", en: "r / rr (rolled)", es: "r / rr (vibrante)" }, isSpecial: true },
  { letter: "S", name: "ese", sound: { ru: "с", en: "s", es: "s" } },
  { letter: "T", name: "te", sound: { ru: "т", en: "t", es: "t" } },
  { letter: "U", name: "u", sound: { ru: "у", en: "oo", es: "u" } },
  { letter: "V", name: "uve", sound: { ru: "б (почти = B)", en: "b (same as B)", es: "b (igual que B)" }, isSpecial: true },
  { letter: "W", name: "doble uve", sound: { ru: "в / у (чужая)", en: "w / v (foreign)", es: "w / v (extranjera)" } },
  { letter: "X", name: "equis", sound: { ru: "кс / х", en: "ks / h", es: "ks / j" }, isSpecial: true },
  { letter: "Y", name: "ye", sound: { ru: "й / и", en: "y / ee", es: "y / i" }, isSpecial: true },
  { letter: "Z", name: "zeta", sound: { ru: "с (в Испании: «θ»)", en: "s (in Spain: th)", es: "s (en España: z)" }, isSpecial: true },
]

export const SPANISH_DIGRAPHS: Digraph[] = [
  { letter: "CH", name: "che", sound: { ru: "ч (как в «чай»)", en: "ch (like chair)", es: "ch (como chico)" } },
  { letter: "LL", name: "elle", sound: { ru: "й / ж (зависит от страны)", en: "y / zh (varies)", es: "y / ll (varía)" } },
  { letter: "RR", name: "erre doble", sound: { ru: "рр (раскатистое)", en: "rr (strongly rolled)", es: "rr (vibrante fuerte)" } },
]

// English alphabet
export const ENGLISH_LETTERS: Letter[] = [
  { letter: "A", name: "ei", sound: { ru: "эй / э / а", en: "ay / a / ah", es: "ei / a / ah" }, isSpecial: true },
  { letter: "B", name: "bi", sound: { ru: "б", en: "b", es: "b" } },
  { letter: "C", name: "si", sound: { ru: "к / с", en: "k / s", es: "k / s" }, isSpecial: true },
  { letter: "D", name: "di", sound: { ru: "д", en: "d", es: "d" } },
  { letter: "E", name: "i", sound: { ru: "и / э", en: "ee / e", es: "i / e" }, isSpecial: true },
  { letter: "F", name: "ef", sound: { ru: "ф", en: "f", es: "f" } },
  { letter: "G", name: "dʒi", sound: { ru: "г / дж", en: "g / j", es: "g / y" }, isSpecial: true },
  { letter: "H", name: "eitch", sound: { ru: "х (выдох)", en: "h (breath)", es: "j (aspirada)" } },
  { letter: "I", name: "ai", sound: { ru: "ай / и", en: "eye / i", es: "ai / i" }, isSpecial: true },
  { letter: "J", name: "dʒei", sound: { ru: "дж", en: "j", es: "y" } },
  { letter: "K", name: "kei", sound: { ru: "к", en: "k", es: "k" } },
  { letter: "L", name: "el", sound: { ru: "л (тёмное)", en: "l (dark)", es: "l (oscura)" } },
  { letter: "M", name: "em", sound: { ru: "м", en: "m", es: "m" } },
  { letter: "N", name: "en", sound: { ru: "н", en: "n", es: "n" } },
  { letter: "O", name: "ou", sound: { ru: "оу / о / а", en: "oh / o / ah", es: "ou / o / a" }, isSpecial: true },
  { letter: "P", name: "pi", sound: { ru: "п (с придыханием)", en: "p (aspirated)", es: "p (aspirada)" } },
  { letter: "Q", name: "kju", sound: { ru: "кв (всегда с u)", en: "kw (always with u)", es: "kw (siempre con u)" }, isSpecial: true },
  { letter: "R", name: "ar", sound: { ru: "р (не раскатистое!)", en: "r (not rolled!)", es: "r (no vibrante!)" }, isSpecial: true },
  { letter: "S", name: "es", sound: { ru: "с / з", en: "s / z", es: "s / z" } },
  { letter: "T", name: "ti", sound: { ru: "т (с придыханием)", en: "t (aspirated)", es: "t (aspirada)" } },
  { letter: "U", name: "ju", sound: { ru: "ю / а / у", en: "you / u / uh", es: "yu / a / u" }, isSpecial: true },
  { letter: "V", name: "vi", sound: { ru: "в (губы + зубы)", en: "v (lip-teeth)", es: "v (labio-dental)" } },
  { letter: "W", name: "dʌblju", sound: { ru: "у", en: "w", es: "u" } },
  { letter: "X", name: "eks", sound: { ru: "кс / гз", en: "ks / gz", es: "ks / gz" } },
  { letter: "Y", name: "wai", sound: { ru: "й / ай / и", en: "y / ai / i", es: "y / ai / i" }, isSpecial: true },
  { letter: "Z", name: "zed/zi", sound: { ru: "з", en: "z", es: "z" } },
]

export const ENGLISH_DIGRAPHS: Digraph[] = [
  { letter: "TH", name: "th", sound: { ru: "θ / ð (межзубные)", en: "th (voiced/unvoiced)", es: "z / d (interdental)" } },
  { letter: "SH", name: "sh", sound: { ru: "ш", en: "sh", es: "sh" } },
  { letter: "CH", name: "ch", sound: { ru: "ч", en: "ch", es: "ch" } },
  { letter: "PH", name: "ph", sound: { ru: "ф", en: "f", es: "f" } },
  { letter: "GH", name: "gh", sound: { ru: "— / ф / г", en: "silent / f / g", es: "muda / f / g" } },
]

export function getAlphabetData(learningLanguage: LearningLanguage) {
  if (learningLanguage === 'spanish') {
    return {
      letters: SPANISH_LETTERS,
      digraphs: SPANISH_DIGRAPHS,
      flag: '🇪🇸',
      title: { ru: 'Испанский алфавит', en: 'Spanish Alphabet', es: 'Alfabeto Español' },
      subtitle: { ru: '27 букв', en: '27 letters', es: '27 letras' },
      digraphNote: { 
        ru: 'Классические диграфы (убраны из алфавита в 1994, но важны)', 
        en: 'Classic digraphs (removed from alphabet in 1994, but important)', 
        es: 'Dígrafos clásicos (eliminados del alfabeto en 1994, pero importantes)' 
      },
      langCode: 'es-ES',
    }
  }
  
  return {
    letters: ENGLISH_LETTERS,
    digraphs: ENGLISH_DIGRAPHS,
    flag: '🇬🇧',
    title: { ru: 'Английский алфавит', en: 'English Alphabet', es: 'Alfabeto Inglés' },
    subtitle: { ru: '26 букв', en: '26 letters', es: '26 letras' },
    digraphNote: { 
      ru: 'Важные сочетания букв', 
      en: 'Important letter combinations', 
      es: 'Combinaciones importantes' 
    },
    langCode: 'en-US',
  }
}
