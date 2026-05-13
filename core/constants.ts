import type { Interest, Level, UserProfile, Stats, AppState } from './types'

export const INTERESTS: { id: Interest; labelRu: string; labelEn: string; labelEs: string }[] = [
  { id: 'sports', labelRu: 'Спорт', labelEn: 'Sports', labelEs: 'Deportes' },
  { id: 'food', labelRu: 'Еда', labelEn: 'Food', labelEs: 'Comida' },
  { id: 'travel', labelRu: 'Путешествия', labelEn: 'Travel', labelEs: 'Viajes' },
  { id: 'technology', labelRu: 'Технологии', labelEn: 'Technology', labelEs: 'Tecnología' },
  { id: 'cinema', labelRu: 'Кино', labelEn: 'Cinema', labelEs: 'Cine' },
  { id: 'business', labelRu: 'Бизнес', labelEn: 'Business', labelEs: 'Negocios' },
  { id: 'nature', labelRu: 'Природа', labelEn: 'Nature', labelEs: 'Naturaleza' },
  { id: 'music', labelRu: 'Музыка', labelEn: 'Music', labelEs: 'Música' },
]

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export const LEVEL_DESCRIPTIONS: Record<Level, { ru: string; en: string; es: string }> = {
  A1: { ru: 'Начинающий', en: 'Beginner', es: 'Principiante' },
  A2: { ru: 'Элементарный', en: 'Elementary', es: 'Elemental' },
  B1: { ru: 'Средний', en: 'Intermediate', es: 'Intermedio' },
  B2: { ru: 'Выше среднего', en: 'Upper Intermediate', es: 'Intermedio Alto' },
  C1: { ru: 'Продвинутый', en: 'Advanced', es: 'Avanzado' },
  C2: { ru: 'Свободное владение', en: 'Proficient', es: 'Competente' },
}

export const TIPS_BY_LEVEL: Record<Level, string[]> = {
  A1: [
    'Слушай даже если не понимаешь — мозг всё равно учится',
    '15 минут в день дадут заметный результат через месяц',
    'Начни с простых песен — повторяй припев',
  ],
  A2: [
    'Читай то что тебе реально интересно — детективы, спорт, рецепты',
    'Смотри детские мультфильмы на изучаемом языке',
    'Подписывай предметы дома стикерами на новом языке',
  ],
  B1: [
    'Шадоуинг 5 минут в день = лучший тренинг произношения',
    'Смотри сериалы — сначала с субтитрами, потом без',
    'Веди дневник на изучаемом языке — хотя бы 3 предложения',
  ],
  B2: [
    '15-20 минут каждый день лучше чем 2 часа раз в неделю',
    'Слушай подкасты во время прогулок или в транспорте',
    'Попробуй думать на изучаемом языке — начни с простых мыслей',
  ],
  C1: [
    'Читай новости и статьи — расширяй словарный запас',
    'Участвуй в языковых обменах с носителями',
    'Изучай идиомы и разговорные выражения',
  ],
  C2: [
    'Фокусируйся на нюансах и стилистике',
    'Читай литературу в оригинале',
    'Практикуй написание формальных текстов',
  ],
}

export const DEFAULT_PROFILE: UserProfile = {
  interfaceLanguage: 'ru',
  learningLanguage: 'spanish',
  level: 'A1',
  interests: [],
  sentencesPerWeek: 7,
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
}

export const DEFAULT_STATS: Stats = {
  totalSentences: 0,
  totalWritings: 0,
  totalVideos: 0,
  currentStreak: 0,
  longestStreak: 0,
}

export const DEFAULT_APP_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  sentences: [],
  writings: [],
  videos: [],
  weekProgress: [],
  stats: DEFAULT_STATS,
}

export const STORAGE_KEY = 'linguaflow_state'
