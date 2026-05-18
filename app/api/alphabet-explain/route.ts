import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LearningLang, InterfaceLang } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { letter, name, learningLanguage, interfaceLanguage } = await request.json() as {
      letter: string
      name: string
      learningLanguage: LearningLang
      interfaceLanguage: InterfaceLang
    }

    const supabase = await createClient()

    // 1. Проверяем кэш в БД
    const { data: cached } = await supabase
      .from('alphabet_explanations')
      .select('explanation, ai_model')
      .eq('language', learningLanguage)
      .eq('letter', letter)
      .eq('interface_language', interfaceLanguage)
      .maybeSingle()

    if (cached) {
      return NextResponse.json({ explanation: cached.explanation, cached: true })
    }

    // 2. Генерируем mock объяснение
    const explanation = generateMock(letter, name, learningLanguage, interfaceLanguage)

    // 3. Сохраняем в кэш
    await supabase.from('alphabet_explanations').upsert({
      language: learningLanguage,
      letter,
      letter_name: name,
      explanation,
      interface_language: interfaceLanguage,
      ai_model: 'claude',
    }, {
      onConflict: 'language,letter,interface_language',
      ignoreDuplicates: true,
    })

    return NextResponse.json({ explanation, cached: false })

  } catch (error) {
    console.error('Alphabet explain error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function generateMock(
  letter: string,
  name: string,
  lang: LearningLang,
  ui: InterfaceLang
): string {
  const isSpanish = lang === 'es'

  const templates: Record<InterfaceLang, (l: string, n: string) => string> = {
    ru: (l, n) => `**Как читается**
Буква ${l} («${n}») — ${isSpanish ? 'одна из основ испанского произношения' : 'ключевая буква английского алфавита'}. Произносится чётко и уверенно.

**Примеры слов**
${isSpanish
  ? `• ${l.toLowerCase()}asa — дом\n• ${l.toLowerCase()}alle — улица\n• ${l.toLowerCase()}ueno — хороший`
  : `• ${l.toLowerCase()}pple — яблоко\n• ${l.toLowerCase()}mazing — удивительный\n• ${l.toLowerCase()}nswer — ответ`}

**Хитрости**
${isSpanish
  ? `В испанском буква ${l} ведёт себя предсказуемо — это одна из причин, почему испанский проще английского.`
  : `В английском буква ${l} может звучать по-разному в зависимости от позиции в слове.`}

**Лайфхак**
Повторяй вслух 3 раза: «${name}, ${name}, ${name}» — и произношение запомнится само.`,

    en: (l, n) => `**How to pronounce**
The letter ${l} ("${n}") is ${isSpanish ? 'a fundamental part of Spanish pronunciation' : 'a key letter of the English alphabet'}. Pronounced clearly and consistently.

**Example words**
${isSpanish
  ? `• ${l.toLowerCase()}asa — house\n• ${l.toLowerCase()}alle — street\n• ${l.toLowerCase()}ueno — good`
  : `• ${l.toLowerCase()}pple — a fruit\n• ${l.toLowerCase()}mazing — wonderful\n• ${l.toLowerCase()}nswer — a reply`}

**Tricky parts**
${isSpanish
  ? `In Spanish, ${l} behaves very consistently — that's one reason Spanish pronunciation is easier than English.`
  : `In English, ${l} can sound different depending on its position in a word.`}

**Pro tip**
Say it out loud 3 times: "${n}, ${n}, ${n}" — muscle memory will do the rest.`,

    es: (l, n) => `**Cómo se pronuncia**
La letra ${l} ("${n}") es ${isSpanish ? 'una de las bases de la pronunciación española' : 'una letra clave del alfabeto inglés'}. Se pronuncia de forma clara y consistente.

**Palabras de ejemplo**
${isSpanish
  ? `• ${l.toLowerCase()}asa — casa\n• ${l.toLowerCase()}alle — calle\n• ${l.toLowerCase()}ueno — bueno`
  : `• ${l.toLowerCase()}pple — manzana\n• ${l.toLowerCase()}mazing — increíble\n• ${l.toLowerCase()}nswer — respuesta`}

**Trucos**
${isSpanish
  ? `En español, la ${l} se comporta de forma predecible — esa es una de las razones por las que el español es más fácil que el inglés.`
  : `En inglés, la ${l} puede sonar diferente según su posición en la palabra.`}

**Consejo**
Repítelo en voz alta 3 veces: "${n}, ${n}, ${n}" — la memoria muscular hará el resto.`,
  }

  return templates[ui](letter, name)
}