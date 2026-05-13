import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { letter, name, learningLanguage, interfaceLanguage } = await request.json()

    const langName = learningLanguage === 'spanish' ? 'Spanish' : 'English'
    const uiLang = interfaceLanguage === 'ru' ? 'Russian' : interfaceLanguage === 'en' ? 'English' : 'Spanish'

    const systemPrompts: Record<string, string> = {
      ru: `Ты преподаватель ${langName === 'Spanish' ? 'испанского' : 'английского'} для русскоязычных. Объясняй букву живо, практично и с юмором. 
Формат ответа (строго):
1. **Как читается** — 1-2 предложения с фонетикой для русского уха
2. **Примеры слов** — 4-5 слов: слово (транскрипция) — перевод
3. **Хитрости** — особые правила или ловушки (если есть)
4. **Лайфхак** — 1 совет как запомнить

Пиши на русском. Коротко и по делу. Без лишних вступлений.`,
      en: `You are a ${langName} language teacher for English speakers. Explain the letter in an engaging, practical way with some humor.
Response format (strictly follow):
1. **How to pronounce** — 1-2 sentences with phonetics for English speakers
2. **Example words** — 4-5 words: word (pronunciation) — meaning
3. **Tricky parts** — special rules or pitfalls (if any)
4. **Pro tip** — 1 tip to remember it

Write in English. Keep it short and practical. No lengthy introductions.`,
      es: `Eres un profesor de ${langName === 'Spanish' ? 'español' : 'inglés'} para hispanohablantes. Explica la letra de forma amena, práctica y con humor.
Formato de respuesta (estricto):
1. **Cómo se pronuncia** — 1-2 oraciones con fonética clara
2. **Palabras de ejemplo** — 4-5 palabras: palabra (pronunciación) — significado
3. **Trucos** — reglas especiales o trampas (si las hay)
4. **Consejo** — 1 tip para recordarlo

Escribe en español. Corto y al grano. Sin introducciones largas.`
    }

    const userPrompts: Record<string, string> = {
      ru: `Объясни букву ${letter} (название: "${name}") ${langName === 'Spanish' ? 'испанского' : 'английского'} алфавита.`,
      en: `Explain the letter ${letter} (name: "${name}") of the ${langName} alphabet.`,
      es: `Explica la letra ${letter} (nombre: "${name}") del alfabeto ${langName === 'Spanish' ? 'español' : 'inglés'}.`
    }

    // For demo purposes, return a mock explanation
    // In production, this would call Claude API through a secure backend
    const mockExplanations: Record<string, Record<string, string>> = {
      ru: {
        A: `**Как читается**
Буква A в ${langName === 'Spanish' ? 'испанском' : 'английском'} читается просто и чётко${langName === 'Spanish' ? ' — всегда как русское «а»' : ' — может быть «эй», «э» или «а» в зависимости от слова'}.

**Примеры слов**
${langName === 'Spanish' 
  ? '• agua (агуа) — вода\n• amigo (амиго) — друг\n• amor (амор) — любовь\n• casa (каса) — дом'
  : '• apple (эпл) — яблоко\n• amazing (эмэйзинг) — удивительный\n• cat (кэт) — кот\n• father (фазер) — отец'}

**Хитрости**
${langName === 'Spanish' 
  ? 'В испанском A всегда читается одинаково — это одна из причин, почему испанское произношение проще английского!'
  : 'В английском A — самая непредсказуемая гласная. В "cat" это «э», в "cake" это «эй», в "father" это «а».'}

**Лайфхак**
${langName === 'Spanish'
  ? 'Просто говори «а» как в русском «мама» — не ошибёшься.'
  : 'Запомни: короткое a = «э» (cat), длинное a = «эй» (cake).'}`,
      },
      en: {
        A: `**How to pronounce**
The letter A in ${langName} ${langName === 'Spanish' ? 'is always pronounced as a clear "ah" sound, like in "father"' : 'has multiple sounds: "ay" in "cake", short "a" in "cat", and "ah" in "father"'}.

**Example words**
${langName === 'Spanish'
  ? '• agua (AH-gwah) — water\n• amigo (ah-MEE-goh) — friend\n• amor (ah-MOR) — love\n• casa (KAH-sah) — house'
  : '• apple (AP-ul) — a fruit\n• amazing (uh-MAY-zing) — wonderful\n• cat (KAT) — a pet\n• father (FAH-ther) — dad'}

**Tricky parts**
${langName === 'Spanish'
  ? 'Good news: Spanish A is always consistent! No weird exceptions like in English.'
  : 'The letter A has at least 4 different sounds in English. Context is everything!'}

**Pro tip**
${langName === 'Spanish'
  ? 'Think of the A in "spa" — that\'s your Spanish A sound every time.'
  : 'When in doubt, check if there\'s a silent E at the end — it usually makes A say "ay".'}`,
      },
      es: {
        A: `**Cómo se pronuncia**
La letra A en ${langName === 'Spanish' ? 'español' : 'inglés'} ${langName === 'Spanish' ? 'siempre suena igual — como una "a" abierta y clara' : 'tiene varios sonidos: "ei" en "cake", "a" corta en "cat", y "a" abierta en "father"'}.

**Palabras de ejemplo**
${langName === 'Spanish'
  ? '• agua — líquido vital\n• amigo — persona querida\n• amor — sentimiento profundo\n• casa — hogar'
  : '• apple (ápol) — manzana\n• amazing (améizing) — asombroso\n• cat (cat) — gato\n• father (fáder) — padre'}

**Trucos**
${langName === 'Spanish'
  ? '¡La A española es fácil! Siempre suena igual, sin excepciones.'
  : 'La A inglesa es impredecible. Puede sonar como "ei", "a" o "e" dependiendo de la palabra.'}

**Consejo**
${langName === 'Spanish'
  ? 'Pronuncia la A con la boca bien abierta, como cuando dices "¡Ah!"'
  : 'Si hay una E muda al final de la palabra, la A suele sonar como "ei".'}`,
      }
    }

    // Return mock for demo (in production, call Claude API)
    const explanation = mockExplanations[interfaceLanguage]?.[letter] || 
      `${interfaceLanguage === 'ru' ? 'Объяснение для буквы' : interfaceLanguage === 'en' ? 'Explanation for letter' : 'Explicación para la letra'} ${letter} ${interfaceLanguage === 'ru' ? 'скоро будет добавлено' : interfaceLanguage === 'en' ? 'coming soon' : 'próximamente'}...`

    return NextResponse.json({ explanation })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to get explanation' },
      { status: 500 }
    )
  }
}
