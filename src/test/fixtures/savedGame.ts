import { getAllClueIds } from '../../game/board'
import { gameStateToSavedPayload } from '../../data/savedGame'
import type { GameState, SavedGamePayload } from '../../types/game'
import { createStandardBoard, createTestBoard, createTestConfig } from './board'

export function createValidSavedPayload(
  overrides?: Partial<SavedGamePayload>,
): SavedGamePayload {
  const board = createStandardBoard()
  const config = createTestConfig(3)
  const clueStates = Object.fromEntries(
    getAllClueIds(board).map((id) => [id, 'unanswered' as const]),
  )

  return {
    version: 1,
    savedAt: '2026-06-12T12:00:00.000Z',
    config,
    board,
    scores: [0, 0, 0],
    currentSelectorIndex: 0,
    phase: 'playing',
    clueStates,
    activeClueId: null,
    buzzState: {
      status: 'idle',
      buzzedPlayerIndex: null,
      attemptedPlayerIndices: [],
      isSteal: false,
    },
    ...overrides,
  }
}

export function createValidSavedPayloadFromState(state: GameState): SavedGamePayload {
  return gameStateToSavedPayload(state)
}

export function createMidGameSavedPayload(): SavedGamePayload {
  const board = createTestBoard()
  const config = createTestConfig(3)
  const clueId = board.categories[0].clues[0].id
  const clueStates = Object.fromEntries(
    getAllClueIds(board).map((id) => [id, 'unanswered' as const]),
  )

  return {
    version: 1,
    savedAt: '2026-06-12T15:30:00.000Z',
    config,
    board,
    scores: [200, 0, 400],
    currentSelectorIndex: 2,
    phase: 'playing',
    clueStates,
    activeClueId: clueId,
    buzzState: {
      status: 'open',
      buzzedPlayerIndex: null,
      attemptedPlayerIndices: [0],
      isSteal: true,
    },
  }
}
