// ===== USER PROFILE =====
export type InterfaceLanguage = 'ru' | 'en' | 'es'
export type LearningLanguage = 'spanish' | 'english'
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type Interest = 
  | 'sports' 
  | 'food' 
  | 'travel' 
  | 'technology' 
  | 'cinema' 
  | 'business' 
  | 'nature' 
  | 'music'

export interface UserProfile {
  interfaceLanguage: InterfaceLanguage
  learningLanguage: LearningLanguage
  level: Level
  interests: Interest[]
  sentencesPerWeek: number // min 7
  onboardingCompleted: boolean
  createdAt: string
}

// ===== SENTENCES =====
export type SentenceStatus = 'new' | 'learning' | 'known' | 'unsure'

export interface Sentence {
  id: string
  text: string // in learning language
  translation: string // in interface language
  grammar: string
  pronunciation: string
  context: string
  examples: string[]
  level: Level
  topics: Interest[]
}

export interface UserSentence {
  sentenceId: string
  status: SentenceStatus
  knownByHeart: boolean
  usedInLife: boolean
  assignedDate: string
  completedDate?: string
}

// ===== WRITING =====
export interface WritingTask {
  id: string
  words: string[]
  topic: string
  assignedDate: string
}

export interface UserWriting {
  taskId: string
  text: string
  feedback?: string
  completedDate: string
}

// ===== VIDEO =====
export type RecapLevel = 'full' | 'topic' | 'listened'

export interface VideoTask {
  id: string
  youtubeUrl: string
  topic: string
  keywords: string[]
  level: Level
  assignedDate: string
}

export interface UserVideo {
  taskId: string
  recapLevel: RecapLevel
  recapText?: string
  feedback?: string
  completedDate: string
}

// ===== DAILY PROGRESS =====
export interface DayProgress {
  date: string // YYYY-MM-DD
  sentenceCompleted: boolean
  writingCompleted: boolean
  videoCompleted: boolean
  sentenceId?: string
  writingId?: string
  videoId?: string
}

// ===== STATS =====
export interface Stats {
  totalSentences: number
  totalWritings: number
  totalVideos: number
  currentStreak: number
  longestStreak: number
}

// ===== FULL APP STATE =====
export interface AppState {
  profile: UserProfile
  sentences: UserSentence[]
  writings: UserWriting[]
  videos: UserVideo[]
  weekProgress: DayProgress[]
  stats: Stats
}
