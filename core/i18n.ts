import type { InterfaceLanguage } from './types'

type TranslationKey = 
  | 'home' | 'alphabet' | 'sentences' | 'writing' | 'video'
  | 'settings' | 'settingsTitle'
  | 'interfaceLanguage' | 'learningLanguage' | 'level' | 'interests' | 'sentencesPerWeek' | 'resetProgress'
  | 'spanish' | 'english'
  | 'save' | 'cancel' | 'confirm' | 'reset'
  | 'resetConfirmTitle' | 'resetConfirmMessage'
  | 'todayTasks' | 'weekProgress' | 'tipOfDay'
  | 'sentenceOfDay' | 'writeText' | 'videoOfDay'
  | 'open' | 'completed'
  | 'totalSentences' | 'totalWritings' | 'totalVideos'
  | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  | 'comingSoon'

const translations: Record<InterfaceLanguage, Record<TranslationKey, string>> = {
  ru: {
    home: 'Главная',
    alphabet: 'Алфавит',
    sentences: 'Предложения',
    writing: 'Письмо',
    video: 'Видео',
    settings: 'Настройки',
    settingsTitle: 'Настройки',
    interfaceLanguage: 'Язык интерфейса',
    learningLanguage: 'Изучаемый язык',
    level: 'Уровень',
    interests: 'Темы интересов',
    sentencesPerWeek: 'Предложений в неделю',
    resetProgress: 'Сбросить прогресс',
    spanish: 'Испанский',
    english: 'Английский',
    save: 'Сохранить',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    reset: 'Сбросить',
    resetConfirmTitle: 'Сбросить прогресс?',
    resetConfirmMessage: 'Все данные будут удалены. Это действие нельзя отменить.',
    todayTasks: 'Задачи на сегодня',
    weekProgress: 'Прогресс недели',
    tipOfDay: 'Совет дня',
    sentenceOfDay: 'Предложение дня',
    writeText: 'Написать текст',
    videoOfDay: 'Видео дня',
    open: 'Открыть',
    completed: 'Выполнено',
    totalSentences: 'Выучено предложений',
    totalWritings: 'Написано текстов',
    totalVideos: 'Просмотрено видео',
    mon: 'Пн',
    tue: 'Вт',
    wed: 'Ср',
    thu: 'Чт',
    fri: 'Пт',
    sat: 'Сб',
    sun: 'Вс',
    comingSoon: 'Скоро',
  },
  en: {
    home: 'Home',
    alphabet: 'Alphabet',
    sentences: 'Sentences',
    writing: 'Writing',
    video: 'Video',
    settings: 'Settings',
    settingsTitle: 'Settings',
    interfaceLanguage: 'Interface Language',
    learningLanguage: 'Learning Language',
    level: 'Level',
    interests: 'Interests',
    sentencesPerWeek: 'Sentences per week',
    resetProgress: 'Reset Progress',
    spanish: 'Spanish',
    english: 'English',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    reset: 'Reset',
    resetConfirmTitle: 'Reset Progress?',
    resetConfirmMessage: 'All data will be deleted. This cannot be undone.',
    todayTasks: "Today's Tasks",
    weekProgress: 'Week Progress',
    tipOfDay: 'Tip of the Day',
    sentenceOfDay: 'Sentence of the Day',
    writeText: 'Write Text',
    videoOfDay: 'Video of the Day',
    open: 'Open',
    completed: 'Completed',
    totalSentences: 'Sentences Learned',
    totalWritings: 'Texts Written',
    totalVideos: 'Videos Watched',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
    comingSoon: 'Coming Soon',
  },
  es: {
    home: 'Inicio',
    alphabet: 'Alfabeto',
    sentences: 'Oraciones',
    writing: 'Escritura',
    video: 'Video',
    settings: 'Ajustes',
    settingsTitle: 'Ajustes',
    interfaceLanguage: 'Idioma de interfaz',
    learningLanguage: 'Idioma de aprendizaje',
    level: 'Nivel',
    interests: 'Intereses',
    sentencesPerWeek: 'Oraciones por semana',
    resetProgress: 'Restablecer progreso',
    spanish: 'Español',
    english: 'Inglés',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    reset: 'Restablecer',
    resetConfirmTitle: '¿Restablecer progreso?',
    resetConfirmMessage: 'Todos los datos serán eliminados. Esta acción no se puede deshacer.',
    todayTasks: 'Tareas de hoy',
    weekProgress: 'Progreso semanal',
    tipOfDay: 'Consejo del día',
    sentenceOfDay: 'Oración del día',
    writeText: 'Escribir texto',
    videoOfDay: 'Video del día',
    open: 'Abrir',
    completed: 'Completado',
    totalSentences: 'Oraciones aprendidas',
    totalWritings: 'Textos escritos',
    totalVideos: 'Videos vistos',
    mon: 'Lun',
    tue: 'Mar',
    wed: 'Mié',
    thu: 'Jue',
    fri: 'Vie',
    sat: 'Sáb',
    sun: 'Dom',
    comingSoon: 'Próximamente',
  },
}

export function t(key: TranslationKey, lang: InterfaceLanguage): string {
  return translations[lang][key] || key
}

export function getInterestLabel(interestId: string, lang: InterfaceLanguage): string {
  const key = `label${lang.charAt(0).toUpperCase() + lang.slice(1)}` as 'labelRu' | 'labelEn' | 'labelEs'
  const { INTERESTS } = require('./constants')
  const interest = INTERESTS.find((i: { id: string }) => i.id === interestId)
  return interest ? interest[key] : interestId
}
