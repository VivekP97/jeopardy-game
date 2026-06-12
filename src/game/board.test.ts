import {
  countRemainingClues,
  getAllClueIds,
  getWinnerIndices,
  isGameComplete,
} from './board'
import { createGame } from './engine'
import {
  createStandardBoard,
  createTestBoard,
  createTestConfig,
  getClueId,
} from '../test/fixtures/board'
import { playThroughClue } from '../test/helpers/engine'
import type { GameState } from '../types/game'

function makeState(scores: number[]): GameState {
  const board = createTestBoard()
  const config = createTestConfig(scores.length)
  return {
    config,
    board,
    scores,
    currentSelectorIndex: 0,
    phase: 'playing',
    clueStates: Object.fromEntries(
      getAllClueIds(board).map((id) => [id, 'unanswered' as const]),
    ),
    activeClueId: null,
    buzzState: {
      status: 'idle',
      buzzedPlayerIndex: null,
      attemptedPlayerIndices: [],
      isSteal: false,
    },
  }
}

describe('getAllClueIds', () => {
  it('returns 30 ids for a standard board in category-major order', () => {
    const board = createStandardBoard()
    const ids = getAllClueIds(board)

    expect(ids).toHaveLength(30)
    expect(ids[0]).toBe('cat-1-200')
    expect(ids[5]).toBe('cat-2-200')
    expect(ids).toEqual(getAllClueIds(board))
  })
})

describe('countRemainingClues', () => {
  it('matches the number of unanswered clues', () => {
    const board = createTestBoard()
    const state = createGame(createTestConfig(), board)

    expect(countRemainingClues(state)).toBe(getAllClueIds(board).length)
  })

  it('decreases after a clue is answered', () => {
    const board = createTestBoard()
    const clueId = getClueId(board, 0, 0)
    let state = createGame(createTestConfig(), board)
    const before = countRemainingClues(state)

    state = playThroughClue(state, { clueId, buzzer: 0, correct: true })

    expect(countRemainingClues(state)).toBe(before - 1)
  })
})

describe('isGameComplete', () => {
  it('is false while any clue remains unanswered', () => {
    const state = createGame(createTestConfig(), createTestBoard())

    expect(isGameComplete(state)).toBe(false)
  })

  it('is true when all clues are answered', () => {
    const board = createTestBoard()
    let state = createGame(createTestConfig(), board)

    for (const clueId of getAllClueIds(board)) {
      state = playThroughClue(state, { clueId, buzzer: 0, correct: true })
    }

    expect(isGameComplete(state)).toBe(true)
  })

  it('is true when phase is already complete', () => {
    const state = {
      ...createGame(createTestConfig(), createTestBoard()),
      phase: 'complete' as const,
    }

    expect(isGameComplete(state)).toBe(true)
  })
})

describe('getWinnerIndices', () => {
  it('returns a single winner index', () => {
    expect(getWinnerIndices(makeState([100, 500, 200]))).toEqual([1])
  })

  it('returns all tied winner indices', () => {
    expect(getWinnerIndices(makeState([300, 300, 100]))).toEqual([0, 1])
  })

  it('returns an empty array for empty scores', () => {
    expect(getWinnerIndices(makeState([]))).toEqual([])
  })

  it('returns all indices when every score is zero', () => {
    expect(getWinnerIndices(makeState([0, 0, 0]))).toEqual([0, 1, 2])
  })
})
