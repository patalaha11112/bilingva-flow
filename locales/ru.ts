// ============================================
// Russian UI messages — the reference locale.
// Every other locale is typed as `Messages` (the shape of this object), so a
// missing or extra key in en.ts / es.ts is a TypeScript error.
//
// Values are strings, string arrays, or functions for text with parameters.
// Plurals: give the Intl.PluralRules forms ({ one, few, many, other } for
// Russian, { one, other } for English/Spanish) and use `plural()` from
// lib/format.ts.
// ============================================

import type { PluralForms } from '@/lib/format'

export const ru = {
  common: {
    loading: 'Загрузка...',
    error: 'Ошибка',
    tryAgain: 'Попробовать снова',
    back: 'Назад',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    comingSoon: 'Скоро',
    listen: 'Послушать',
  },

  nav: {
    home: 'Главная',
    alphabet: 'Алфавит',
    sentences: 'Предложения',
    practice: 'Практика',
    video: 'Видео',
  },

  levels: {
    A1: 'Начинающий',
    A2: 'Элементарный',
    B1: 'Средний',
    B2: 'Выше среднего',
    C1: 'Продвинутый',
    C2: 'Свободное владение',
  },

  auth: {
    email: 'Email',
    password: 'Пароль',
    loginTitle: 'Войти',
    loginSubtitle: 'в Bilingva Flow AI',
    loginButton: 'Войти',
    loggingIn: 'Вход...',
    or: 'или',
    loginWithGoogle: 'Войти через Google',
    noAccount: 'Нет аккаунта?',
    registerLink: 'Зарегистрироваться',
    registerTitle: 'Регистрация',
    registerSubtitle: 'Создай аккаунт в Bilingva Flow AI',
    registerButton: 'Создать аккаунт',
    registering: 'Создаём...',
    haveAccount: 'Уже есть аккаунт?',
    loginLink: 'Войти',
    checkEmailTitle: 'Проверь email',
    checkEmailText: (email: string) => `Мы отправили ссылку для подтверждения на ${email}`,
    errors: {
      invalid_credentials: 'Неверный email или пароль',
      email_not_confirmed: 'Email ещё не подтверждён — проверь почту',
      user_already_exists: 'Аккаунт с таким email уже есть',
      weak_password: 'Пароль слишком простой — минимум 6 символов',
      over_email_send_rate_limit: 'Слишком много писем. Попробуй через минуту',
    },
  },

  home: {
    learningLanguage: 'Язык',
    yourLevel: 'Ваш уровень',
    change: 'Изменить',
    stats: {
      sentences: 'Предложений',
      dialogs: 'Диалогов',
      essays: 'Эссе',
      videos: 'Видео',
    },
    weekActivity: 'Активность недели',
    thisWeek: 'Эта неделя',
    legend: {
      sentences: 'Предложения',
      dialog: 'Диалог',
      video: 'Видео',
    },
    tipOfDay: 'Совет дня',
    startExercise: 'Начать упражнение',
    finishProfileSetup: 'Завершите настройку профиля…',
  },

  activity: {
    archiveTitle: 'Архив активности',
    noData: 'Пока нет данных',
    sentences: 'Предложения',
    dialog: 'Диалог',
    essay: 'Эссе',
    video: 'Видео',
  },

  settings: {
    title: 'Настройки',
    interfaceLanguage: 'Язык интерфейса',
    learningLanguage: 'Язык',
    level: 'Уровень',
    theme: 'Тема',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    logout: 'Выйти из аккаунта',
    resetProgress: 'Сбросить прогресс',
    reset: 'Сбросить',
    resetConfirmTitle: 'Сбросить прогресс?',
    resetConfirmMessage: 'Все данные будут удалены. Это действие нельзя отменить.',
  },

  sentences: {
    title: 'Предложения недели',
    refresh: 'Обновить предложения',
    train: 'Тренироваться',
    addMore: '+ Добавить ещё одно',
    generatingShort: 'Генерируем...',
    activeLimitReached: 'Лимит достигнут. Нажмите обновить для новых предложений',
    weeklyLimitReached: 'Лимит предложений на эту неделю исчерпан. Новые — с понедельника',
    showBreakdown: 'Показать разбор',
    hint: 'Прочитай каждую часть. Отметь те которые ты понимаешь без перевода — даже если ещё не используешь в речи. Это уже пассивная память — и это отличный старт!',
    allUnderstood: 'Всё понятно',
    lowLevelEncouragement: 'На начальном уровне нормально не понимать всё — каждая галочка это прогресс! 🎉',
    next: 'Следующее предложение',
    finish: 'Завершить',
    generating: 'Генерируем предложения для тебя...',
    generatingHint: 'Это займёт несколько секунд',
    generatingLowLevel: 'Подбираем предложения специально для твоего уровня 🎯',
  },

  practice: {
    topic: 'Тема',
    bonus: 'Бонус',
    suggestedWords: 'Попробуй использовать эти слова',
    placeholder: 'Пишите здесь на изучаемом языке...',
    words: { one: '{n} слово', few: '{n} слова', many: '{n} слов', other: '{n} слова' } as PluralForms,
    minHint: 'Минимум 1 предложение',
    submit: 'Отправить',
    analyzing: 'Анализирую...',
    greatWork: 'Отличная работа!',
    score: 'Оценка',
    feedback: 'Анализ',
    improvements: 'Как улучшить',
    original: 'Было',
    better: 'Лучше',
    alternatives: 'Другие способы выразить',
    instead: 'вместо',
    funFact: 'Интересный факт',
    writeAnother: 'Написать ещё одно',
    doneToday: 'Ты уже написал эссе сегодня 🎉',
    errors: {
      limit_reached: 'На сегодня лимит эссе исчерпан. Возвращайся завтра!',
      too_long: 'Эссе слишком длинное. Сократи его, пожалуйста',
      generic: 'Не удалось отправить эссе. Попробуй ещё раз',
    },
  },

  alphabet: {
    subtitle: 'Нажми на букву, чтобы узнать, как она читается',
    noAlphabet: 'Алфавит для этого языка пока не добавлен',
    digraphs: 'Диграфы',
    selectHint: 'Выбери букву чтобы увидеть объяснение',
    hasQuirks: 'с особенностями',
    playLetter: 'Буква',
    playName: 'Название',
    stop: 'Стоп',
    how: 'Как читается',
    examples: 'Примеры',
    tip: 'Обрати внимание',
  },

  // Texts produced on the server (API routes)
  server: {
    essayFallbackFeedback: 'Отличная работа! Продолжай в том же духе.',
    fallbackTopics: ['Мой обычный день', 'Мои увлечения', 'Моя семья', 'Еда, которую я люблю', 'Моё любимое место'],
  },
}

export type Messages = typeof ru
