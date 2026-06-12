import { getAllClueIds } from './board'
import {
  buzz,
  createGame,
  judgeAnswer,
  openBuzz,
  resumeGameFromSave,
  selectClue,
} from './engine'
import {
  createMidGameSavedPayload,
  createValidSavedPayload,
} from '../test/fixtures/savedGame'
import {
  createTestBoard,
  createTestConfig,
  getClueId,
} from '../test/fixtures/board'
import { playThroughClue } from '../test/helpers/engine'
import type { GameState } from '../types/game'

describe('createGame', () => {
  it.each([3, 4, 5])('initializes zero scores for %i players', (playerCount) => {
    const state = createGame(createTestConfig(playerCount), createTestBoard())

    expect(state.scores).toEqual(Array.from({ length: playerCount }, () => 0))
  })

  it('sets currentSelectorIndex to 0 and phase to playing', () => {
    const state = createGame(createTestConfig(), createTestBoard())

    expect(state.currentSelectorIndex).toBe(0)
    expect(state.phase).toBe('playing')
  })

  it('marks every clue unanswered and resets buzz state', () => {
    const board = createTestBoard()
    const state = createGame(createTestConfig(), board)

    for (const clueId of getAllClueIds(board)) {
      expect(state.clueStates[clueId]).toBe('unanswered')
    }

    expect(state.activeClueId).toBeNull()
    expect(state.buzzState).toEqual({
      status: 'idle',
      buzzedPlayerIndex: null,
      attemptedPlayerIndices: [],
      isSteal: false,
    })
  })
})

describe('selectClue', () => {
  it('activates an unanswered clue and resets buzz state', () => {
    const board = createTestBoard()
    const state = createGame(createTestConfig(), board)
    const clueId = getClueId(board, 0, 0)

    const next = selectClue(state, clueId)

    expect(next.activeClueId).toBe(clueId)
    expect(next.buzzState.status).toBe('idle')
    expect(next.buzzState.attemptedPlayerIndices).toEqual([])
  })

  it('does not mutate the input state', () => {
    const board = createTestBoard()
    const state = createGame(createTestConfig(), board)
    const clueId = getClueId(board, 0, 0)

    selectClue(state, clueId)

    expect(state.activeClueId).toBeNull()
  })

  it.each([
    {
      name: 'wrong phase',
      prepare: (state: GameState) => ({ ...state, phase: 'complete' as const }),
      clueId: (board: ReturnType<typeof createTestBoard>) => getClueId(board, 0, 0),
    },
    {
      name: 'clue already active',
      prepare: (state: GameState) => ({
        ...state,
        activeClueId: getClueId(state.board, 0, 0),
      }),
      clueId: (board: ReturnType<typeof createTestBoard>) => getClueId(board, 0, 1),
    },
    {
      name: 'clue already answered',
      prepare: (state: GameState) => {
        const clueId = getClueId(state.board, 0, 0)
        return {
          ...state,
          clueStates: { ...state.clueStates, [clueId]: 'answered' as const },
        }
      },
      clueId: (board: ReturnType<typeof createTestBoard>) => getClueId(board, 0, 0),
    },
    {
      name: 'unknown clue id',
      prepare: (state: GameState) => state,
      clueId: () => 'missing-clue',
    },
  ])('rejects when $name', ({ prepare, clueId }) => {
    const board = createTestBoard()
    const prepared = prepare(createGame(createTestConfig(), board))

    expect(selectClue(prepared, clueId(board))).toBe(prepared)
  })

  it('rejects when clue id is absent from the board', () => {
    const board = createTestBoard()
    const state = createGame(createTestConfig(), board)
    const orphanState: GameState = {
      ...state,
      clueStates: { ...state.clueStates, 'orphan-clue': 'unanswered' },
    }

    expect(selectClue(orphanState, 'orphan-clue')).toBe(orphanState)
  })
})

describe('openBuzz', () => {
  it('opens buzzers when a clue is active', () => {
    const board = createTestBoard()
    let state = createGame(createTestConfig(), board)
    state = selectClue(state, getClueId(board, 0, 0))

    const next = openBuzz(state)

    expect(next.buzzState.status).toBe('open')
    expect(next.buzzState.buzzedPlayerIndex).toBeNull()
  })

  it.each([
    {
      name: 'no active clue',
      setup: (_board: ReturnType<typeof createTestBoard>, state: GameState) => state,
    },
    {
      name: 'buzz already open',
      setup: (board: ReturnType<typeof createTestBoard>, state: GameState) => {
        const withClue = selectClue(state, getClueId(board, 0, 0))
        return openBuzz(withClue)
      },
    },
    {
      name: 'player already buzzed',
      setup: (board: ReturnType<typeof createTestBoard>, state: GameState) => {
        let withClue = selectClue(state, getClueId(board, 0, 0))
        withClue = openBuzz(withClue)
        return buzz(withClue, 0)
      },
    },
    {
      name: 'wrong phase',
      setup: (_board: ReturnType<typeof createTestBoard>, state: GameState) => ({
        ...selectClue(state, getClueId(_board, 0, 0)),
        phase: 'complete' as const,
      }),
    },
  ])('rejects when $name', ({ setup }) => {
    const board = createTestBoard()
    const state = createGame(createTestConfig(), board)
    const prepared = setup(board, state)

    expect(openBuzz(prepared)).toBe(prepared)
  })
})

describe('buzz', () => {
  it('locks in the first valid buzz', () => {
    const board = createTestBoard()
    let state = createGame(createTestConfig(), board)
    state = selectClue(state, getClueId(board, 0, 0))
    state = openBuzz(state)

    const next = buzz(state, 1)

    expect(next.buzzState.status).toBe('buzzed')
    expect(next.buzzState.buzzedPlayerIndex).toBe(1)
  })

  it.each([
    {
      name: 'buzz not open',
      setup: (board: ReturnType<typeof createTestBoard>, state: GameState) =>
        selectClue(state, getClueId(board, 0, 0)),
      playerIndex: 0,
    },
    {
      name: 'invalid player index',
      setup: (board: ReturnType<typeof createTestBoard>, state: GameState) => {
        const withClue = selectClue(state, getClueId(board, 0, 0))
        return openBuzz(withClue)
      },
      playerIndex: 99,
    },
    {
      name: 'player already attempted',
      setup: (board: ReturnType<typeof createTestBoard>, state: GameState) => ({
        ...selectClue(state, getClueId(board, 0, 0)),
        buzzState: {
          status: 'open' as const,
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [1],
          isSteal: true,
        },
      }),
      playerIndex: 1,
    },
  ])('rejects when $name', ({ setup, playerIndex }) => {
    const board = createTestBoard()
    const state = createGame(createTestConfig(), board)
    const prepared = setup(board, state)

    expect(buzz(prepared, playerIndex)).toBe(prepared)
  })

  it('rejects when phase is not playing', () => {
    const board = createTestBoard()
    let state = createGame(createTestConfig(), board)
    state = openBuzz(selectClue(state, getClueId(board, 0, 0)))
    state = { ...state, phase: 'complete' as const }

    expect(buzz(state, 0)).toBe(state)
  })

  it('allows unattempted players to buzz during steal round', () => {
    const board = createTestBoard()
    const clueId = getClueId(board, 0, 0)
    let state = createGame(createTestConfig(3), board)

    state = playThroughClue(state, { clueId, buzzer: 0, correct: false })
    state = openBuzz(state)
    state = buzz(state, 1)

    expect(state.buzzState.status).toBe('buzzed')
    expect(state.buzzState.buzzedPlayerIndex).toBe(1)
    expect(state.buzzState.isSteal).toBe(true)
  })
})

describe('judgeAnswer — correct', () => {
  it('adds clue value, sets selector, marks clue answered, and resets buzz', () => {
    const board = createTestBoard()
    const clueId = getClueId(board, 0, 0)
    let state = createGame(createTestConfig(3), board)
    state = selectClue(state, clueId)
    state = openBuzz(state)
    state = buzz(state, 2)

    const next = judgeAnswer(state, true)

    expect(next.scores[2]).toBe(200)
    expect(next.currentSelectorIndex).toBe(2)
    expect(next.clueStates[clueId]).toBe('answered')
    expect(next.activeClueId).toBeNull()
    expect(next.buzzState.status).toBe('idle')
  })

  it('sets phase to complete when the last clue is answered', () => {
    const board = createTestBoard()
    let state = createGame(createTestConfig(3), board)

    for (const clueId of getAllClueIds(board).slice(0, -1)) {
      state = playThroughClue(state, { clueId, buzzer: 0, correct: true })
    }

    const lastClueId = getAllClueIds(board).at(-1)!
    state = playThroughClue(state, { clueId: lastClueId, buzzer: 1, correct: true })

    expect(state.phase).toBe('complete')
  })
})

describe('judgeAnswer — incorrect', () => {
  it('does not change scores and enables steal for remaining players', () => {
    const board = createTestBoard()
    const clueId = getClueId(board, 0, 0)
    let state = createGame(createTestConfig(3), board)
    state = selectClue(state, clueId)
    state = openBuzz(state)
    state = buzz(state, 0)
    const scoresBefore = [...state.scores]

    state = judgeAnswer(state, false)

    expect(state.scores).toEqual(scoresBefore)
    expect(state.buzzState.isSteal).toBe(true)
    expect(state.buzzState.status).toBe('idle')
    expect(state.activeClueId).toBe(clueId)
    expect(state.buzzState.attemptedPlayerIndices).toEqual([0])
  })

  it('marks clue answered and keeps selector unchanged when all players miss', () => {
    const board = createTestBoard()
    const clueId = getClueId(board, 0, 0)
    let state = createGame(createTestConfig(3), board)
    const selectorBefore = state.currentSelectorIndex
    const scoresBefore = [...state.scores]

    state = playThroughClue(state, { clueId, buzzer: 0, correct: false })
    state = playThroughClue(state, { clueId, buzzer: 1, correct: false })
    state = playThroughClue(state, { clueId, buzzer: 2, correct: false })

    expect(state.scores).toEqual(scoresBefore)
    expect(state.currentSelectorIndex).toBe(selectorBefore)
    expect(state.clueStates[clueId]).toBe('answered')
    expect(state.activeClueId).toBeNull()
    expect(state.buzzState.status).toBe('idle')
  })

  it.each([
    {
      name: 'no active clue',
      prepare: (state: GameState) => ({ ...state, activeClueId: null }),
    },
    {
      name: 'buzz not locked',
      prepare: (state: GameState) => ({
        ...state,
        buzzState: { ...state.buzzState, status: 'open' as const },
      }),
    },
  ])('rejects when $name', ({ prepare }) => {
    const board = createTestBoard()
    let state = createGame(createTestConfig(), board)
    state = selectClue(state, getClueId(board, 0, 0))
    state = openBuzz(state)
    state = buzz(state, 0)
    const prepared = prepare(state)

    expect(judgeAnswer(prepared, true)).toBe(prepared)
  })

  it('rejects when buzzedPlayerIndex is null', () => {
    const board = createTestBoard()
    let state = createGame(createTestConfig(), board)
    state = buzz(openBuzz(selectClue(state, getClueId(board, 0, 0))), 0)
    state = {
      ...state,
      buzzState: { ...state.buzzState, buzzedPlayerIndex: null },
    }

    expect(judgeAnswer(state, true)).toBe(state)
  })

  it('rejects when the active clue is missing from the board', () => {
    const board = createTestBoard()
    let state = createGame(createTestConfig(), board)
    state = buzz(openBuzz(selectClue(state, getClueId(board, 0, 0))), 0)
    state = {
      ...state,
      activeClueId: 'missing-clue',
      clueStates: { ...state.clueStates, 'missing-clue': 'unanswered' },
    }

    expect(judgeAnswer(state, true)).toBe(state)
  })
})

describe('multi-step scenarios', () => {
  it('P1 wrong then P2 steals correctly', () => {
    const board = createTestBoard()
    const clueId = getClueId(board, 0, 0)
    let state = createGame(createTestConfig(3), board)

    state = playThroughClue(state, { clueId, buzzer: 0, correct: false })
    state = playThroughClue(state, { clueId, buzzer: 1, correct: true })

    expect(state.scores[1]).toBe(200)
    expect(state.currentSelectorIndex).toBe(1)
    expect(state.clueStates[clueId]).toBe('answered')
  })

  it('plays until the board is empty', () => {
    const board = createTestBoard()
    let state = createGame(createTestConfig(3), board)

    for (const clueId of getAllClueIds(board)) {
      state = playThroughClue(state, { clueId, buzzer: 0, correct: true })
    }

    expect(state.phase).toBe('complete')
    expect(getAllClueIds(board).every((id) => state.clueStates[id] === 'answered')).toBe(
      true,
    )
  })

  it('excludes each wrong attempt from buzzing in a 5-player steal chain', () => {
    const board = createTestBoard()
    const clueId = getClueId(board, 0, 0)
    let state = createGame(createTestConfig(5), board)

    for (let playerIndex = 0; playerIndex < 4; playerIndex += 1) {
      state = playThroughClue(state, { clueId, buzzer: playerIndex, correct: false })
      expect(state.buzzState.attemptedPlayerIndices).toEqual(
        Array.from({ length: playerIndex + 1 }, (_, index) => index),
      )
      expect(buzz(state, playerIndex)).toBe(state)
    }

    state = playThroughClue(state, { clueId, buzzer: 4, correct: false })
    expect(state.clueStates[clueId]).toBe('answered')
  })
})

describe('resumeGameFromSave', () => {
  it('deep-copies mutable arrays so mutations do not alias the payload', () => {
    const payload = createValidSavedPayload({
      scores: [100, 200, 300],
      buzzState: {
        status: 'idle',
        buzzedPlayerIndex: null,
        attemptedPlayerIndices: [0],
        isSteal: false,
      },
    })

    const state = resumeGameFromSave(payload)
    state.scores[0] = 999
    state.buzzState.attemptedPlayerIndices.push(2)
    const clueId = getAllClueIds(state.board)[0]
    state.clueStates[clueId] = 'answered'

    expect(payload.scores).toEqual([100, 200, 300])
    expect(payload.buzzState.attemptedPlayerIndices).toEqual([0])
    expect(payload.clueStates[clueId]).toBe('unanswered')
  })

  it('preserves mid-clue steal buzz state', () => {
    const payload = createMidGameSavedPayload()
    const state = resumeGameFromSave(payload)

    expect(state.activeClueId).toBe(payload.activeClueId)
    expect(state.buzzState).toEqual(payload.buzzState)
    expect(state.scores).toEqual(payload.scores)
  })

  it('preserves buzzed-in state', () => {
    const payload = createValidSavedPayload({
      activeClueId: 'cat-a-200',
      buzzState: {
        status: 'buzzed',
        buzzedPlayerIndex: 1,
        attemptedPlayerIndices: [],
        isSteal: false,
      },
    })

    const state = resumeGameFromSave(payload)

    expect(state.buzzState.status).toBe('buzzed')
    expect(state.buzzState.buzzedPlayerIndex).toBe(1)
  })
})
