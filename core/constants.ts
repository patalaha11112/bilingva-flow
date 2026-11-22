import type { Level } from './types'

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export const LEVEL_DESCRIPTIONS: Record<Level, { ru: string; en: string; es: string }> = {
  A1: { ru: 'Начинающий', en: 'Beginner', es: 'Principiante' },
  A2: { ru: 'Элементарный', en: 'Elementary', es: 'Elemental' },
  B1: { ru: 'Средний', en: 'Intermediate', es: 'Intermedio' },
  B2: { ru: 'Выше среднего', en: 'Upper Intermediate', es: 'Intermedio Alto' },
  C1: { ru: 'Продвинутый', en: 'Advanced', es: 'Avanzado' },
  C2: { ru: 'Свободное владение', en: 'Proficient', es: 'Competente' },
}
