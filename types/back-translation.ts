// Shapes returned by /api/back-translation (shared by client and server)

/** A fragment of a sentence with its translation, shown as a gloss */
export interface GlossChunk {
  text: string
  translation: string
}

export interface BackTSentence {
  id: string
  sentence_text: string
  chunks: GlossChunk[]
}

export interface BackTFeedback {
  score: number
  verdict: 'exact' | 'close' | 'different'
  praise: string
  corrections: { yours: string; better: string; why: string }[]
  tips: string[]
}

/** Step 2 is open: the user sees only their own translation, never the original */
export interface BackTDue {
  id: string
  forward_text: string
  forward_date: string
}

/** A sentence for step 1 today: pending (id null) or already translated today */
export interface BackTToday {
  id: string | null
  sentence: BackTSentence
  forward_text: string | null
}

/** Step 2 finished today: the original is revealed with the feedback */
export interface BackTDone {
  id: string
  forward_text: string
  back_text: string
  feedback: BackTFeedback
  sentence: BackTSentence
}

export interface BackTState {
  /** New sentences per day for the user's level */
  target: number
  /** Upper limit of new sentences per day */
  max: number
  due: BackTDue[]
  today: BackTToday[]
  done: BackTDone[]
  /** All sentences the user has seen are already used: learn new ones first */
  noMoreSentences: boolean
}
