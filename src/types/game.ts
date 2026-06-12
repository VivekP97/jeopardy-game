export type Clue = {
  id: string
  value: number
  question: string
  answer: string
}

export type Category = {
  id: string
  title: string
  clues: Clue[]
}

export type Board = {
  categories: Category[]
}

export type Player = {
  id: string
  name: string
}

export type GameConfig = {
  players: Player[]
}

export type ClueState = 'unanswered' | 'answered'

export type BuzzStatus = 'idle' | 'open' | 'buzzed'

export type BuzzState = {
  status: BuzzStatus
  buzzedPlayerIndex: number | null
  attemptedPlayerIndices: number[]
  isSteal: boolean
}

export type GamePhase = 'playing' | 'complete'

export type GameState = {
  config: GameConfig
  board: Board
  scores: number[]
  currentSelectorIndex: number
  phase: GamePhase
  clueStates: Record<string, ClueState>
  activeClueId: string | null
  buzzState: BuzzState
}

export type SavedGamePayload = {
  version: 1
  savedAt: string
  config: GameConfig
  board: Board
  scores: number[]
  currentSelectorIndex: number
  phase: GamePhase
  clueStates: Record<string, ClueState>
  activeClueId: string | null
  buzzState: BuzzState
}

export type SavedGameFile = {
  savedGame: SavedGamePayload | null
}
