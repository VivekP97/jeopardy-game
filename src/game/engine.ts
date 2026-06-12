import type {
  Board,
  BuzzState,
  Clue,
  GameConfig,
  GameState,
} from '../types/game'
import { getAllClueIds, isGameComplete } from './board'

const INITIAL_BUZZ_STATE: BuzzState = {
  status: 'idle',
  buzzedPlayerIndex: null,
  attemptedPlayerIndices: [],
  isSteal: false,
}

function findClue(board: Board, clueId: string): Clue | undefined {
  for (const category of board.categories) {
    const clue = category.clues.find((item) => item.id === clueId)
    if (clue) {
      return clue
    }
  }
  return undefined
}

function buildInitialClueStates(board: Board): Record<string, 'unanswered'> {
  const clueStates: Record<string, 'unanswered'> = {}
  for (const clueId of getAllClueIds(board)) {
    clueStates[clueId] = 'unanswered'
  }
  return clueStates
}

function resolvePhase(state: GameState): GameState['phase'] {
  return isGameComplete(state) ? 'complete' : state.phase
}

function withResolvedPhase(state: GameState): GameState {
  const phase = resolvePhase(state)
  if (phase === state.phase) {
    return state
  }
  return { ...state, phase }
}

export function createGame(config: GameConfig, board: Board): GameState {
  const playerCount = config.players.length
  const state: GameState = {
    config,
    board,
    scores: Array.from({ length: playerCount }, () => 0),
    currentSelectorIndex: 0,
    phase: 'playing',
    clueStates: buildInitialClueStates(board),
    activeClueId: null,
    buzzState: { ...INITIAL_BUZZ_STATE },
  }
  return state
}

export function selectClue(state: GameState, clueId: string): GameState {
  if (state.phase !== 'playing' || state.activeClueId !== null) {
    return state
  }
  if (state.clueStates[clueId] !== 'unanswered') {
    return state
  }
  if (!findClue(state.board, clueId)) {
    return state
  }

  return {
    ...state,
    activeClueId: clueId,
    buzzState: { ...INITIAL_BUZZ_STATE },
  }
}

export function openBuzz(state: GameState): GameState {
  if (state.phase !== 'playing' || state.activeClueId === null) {
    return state
  }
  if (state.buzzState.status !== 'idle') {
    return state
  }

  return {
    ...state,
    buzzState: {
      ...state.buzzState,
      status: 'open',
      buzzedPlayerIndex: null,
    },
  }
}

export function buzz(state: GameState, playerIndex: number): GameState {
  if (state.phase !== 'playing' || state.activeClueId === null) {
    return state
  }
  if (state.buzzState.status !== 'open') {
    return state
  }
  if (playerIndex < 0 || playerIndex >= state.config.players.length) {
    return state
  }
  if (state.buzzState.attemptedPlayerIndices.includes(playerIndex)) {
    return state
  }

  return {
    ...state,
    buzzState: {
      ...state.buzzState,
      status: 'buzzed',
      buzzedPlayerIndex: playerIndex,
    },
  }
}

export function judgeAnswer(state: GameState, correct: boolean): GameState {
  if (state.phase !== 'playing' || state.activeClueId === null) {
    return state
  }
  if (state.buzzState.status !== 'buzzed') {
    return state
  }

  const buzzedPlayerIndex = state.buzzState.buzzedPlayerIndex
  if (buzzedPlayerIndex === null) {
    return state
  }

  const activeClueId = state.activeClueId
  const clue = findClue(state.board, activeClueId)
  if (!clue) {
    return state
  }

  if (correct) {
    const scores = [...state.scores]
    scores[buzzedPlayerIndex] += clue.value

    const nextState: GameState = {
      ...state,
      scores,
      currentSelectorIndex: buzzedPlayerIndex,
      clueStates: {
        ...state.clueStates,
        [activeClueId]: 'answered',
      },
      activeClueId: null,
      buzzState: { ...INITIAL_BUZZ_STATE },
    }
    return withResolvedPhase(nextState)
  }

  const attemptedPlayerIndices = [
    ...state.buzzState.attemptedPlayerIndices,
    buzzedPlayerIndex,
  ]
  const playerCount = state.config.players.length
  const allAttempted = attemptedPlayerIndices.length >= playerCount

  if (allAttempted) {
    const nextState: GameState = {
      ...state,
      clueStates: {
        ...state.clueStates,
        [activeClueId]: 'answered',
      },
      activeClueId: null,
      buzzState: { ...INITIAL_BUZZ_STATE },
    }
    return withResolvedPhase(nextState)
  }

  return {
    ...state,
    buzzState: {
      status: 'idle',
      buzzedPlayerIndex: null,
      attemptedPlayerIndices,
      isSteal: true,
    },
  }
}
