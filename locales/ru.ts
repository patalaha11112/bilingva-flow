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
    listen: 'Послушать',
  },

  nav: {
    home: 'Главная',
    sentences: 'Предложения',
    backT: 'Back-T',
    essay: 'Эссе',
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
      backT: 'Back-T',
      essays: 'Эссе',
    },
    weekActivity: 'Активность недели',
    thisWeek: 'Эта неделя',
    legend: {
      sentences: 'Предложения',
      backT: 'Back-T',
      essay: 'Эссе',
    },
    alphabetTitle: 'Алфавит',
    alphabetSubtitle: 'Как читаются буквы и сочетания',
    plan: {
      title: 'План на сегодня',
      sentences: 'Предложения',
      sentencesHint: (n: number, goal: number) => `Разобрано ${Math.min(n, goal)} из ${goal}`,
      backT: 'Back-T',
      backTHint: 'Перевод туда и обратно',
      essay: 'Эссе',
      essayHint: 'Одно эссе со словами набора',
      allDone: 'День выполнен! 🎉',
    },
    tipOfDay: 'Совет дня',
    finishProfileSetup: 'Завершите настройку профиля…',
  },

  activity: {
    archiveTitle: 'Архив активности',
    noData: 'Пока нет данных',
    sentences: 'Предложения',
    backT: 'Back-T',
    essay: 'Эссе',
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
    title: 'Предложения',
    setLabel: (n: number) => `Текущий набор · ${n}`,
    skipSet: 'Пропустить набор',
    skipConfirmTitle: 'Пропустить набор?',
    skipConfirmText: 'Вместо этих предложений придут новые. Прогресс по текущим сохранится.',
    setMaxReached: 'В наборе уже максимум предложений',
    dailyLimitReached: 'На сегодня лимит новых предложений исчерпан. Продолжим завтра',
    setComplete: 'Набор пройден! 🎉 Новые предложения — завтра.',
    nextSteps: 'Дальше по плану: Back-T и эссе по этим предложениям.',
    train: 'Тренироваться',
    addMore: '+ Добавить ещё одно',
    generatingShort: 'Генерируем...',
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

  backT: {
    title: 'Back-T',
    subtitle: 'Перевод туда и обратно',
    howTitle: 'Как это работает',
    how: [
      'Переведи предложение на русский — своими словами.',
      'На следующий день оригинал спрячется: переведи свой русский обратно.',
      'Сравним с оригиналом и подскажем, что улучшить.',
    ],
    dueTitle: 'Переведи обратно',
    dueHint: 'Оригинала не видно — только твой перевод. Как это сказать на изучаемом языке?',
    fromDate: (date: string) => `Твой перевод · ${date}`,
    todayTitle: 'Новые на сегодня',
    doneTitle: 'Готово сегодня',
    forwardPlaceholder: 'Твой перевод на русский…',
    backPlaceholder: 'Перевод на изучаемый язык…',
    save: 'Сохранить',
    check: 'Проверить',
    checking: 'Сравниваю с оригиналом…',
    savedTomorrow: 'Сохранено. Обратный перевод — завтра 🌙',
    yourTranslation: 'Твой перевод',
    yourVersion: 'Твой вариант',
    original: 'Оригинал',
    showHints: 'Показать перевод слов',
    hideHints: 'Скрыть перевод слов',
    addMore: '+ Ещё предложение',
    maxReached: (n: number) => `Не больше ${n} новых предложений в день`,
    noMoreSentences: 'Все твои предложения уже в работе. Пройди новые во вкладке «Предложения».',
    goToSentences: 'К предложениям',
    allDone: 'На сегодня всё! Завтра — обратный перевод 🎉',
    verdict: {
      exact: 'Точно как в оригинале!',
      close: 'Почти точно',
      different: 'Есть расхождения',
    },
    corrections: 'Что поправить',
    tips: 'Совет',
    errors: {
      limit_reached: 'На сегодня лимит новых предложений',
      too_early: 'Обратный перевод откроется завтра',
      already_done: 'Это предложение уже проверено',
      ai_failed: 'Не удалось проверить. Попробуй ещё раз',
      generic: 'Что-то пошло не так. Попробуй ещё раз',
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
