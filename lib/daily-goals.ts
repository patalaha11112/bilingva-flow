// ============================================
// The daily path: Sentences → Back-T → Essay.
// A day is complete when all three goals are met. Shared by client and server.
// ============================================

export const DAILY_GOALS = {
  /** Sentences whose breakdown was opened in training today */
  sentencesViewed: 5,
  /** New sentences translated "there" in Back-T today (plus all due translations back) */
  backTranslations: 2,
  /** Non-bonus essays today */
  essays: 1,
} as const

/** Sentences in a new set */
export const SET_SIZE = 5
/** Most sentences a set can grow to with "+ add one more" */
export const SET_MAX = 10
/** Most new Back-T sentences a day ("+ one more") */
export const BACK_T_MAX_PER_DAY = 5
