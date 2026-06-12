import { http, HttpResponse } from 'msw'
import { getAllClueIds } from '../game/board'
import { createGame, resumeGameFromSave } from '../game/engine'
import {
  createMidGameSavedPayload,
  createValidSavedPayload,
} from '../test/fixtures/savedGame'
import { createStandardBoard, createTestBoard, createTestConfig } from '../test/fixtures/board'
import { server } from '../test/msw/server'
import {
  gameStateToSavedPayload,
  loadSavedGameFile,
  parseSavedGameFile,
  savedPayloadToGameState,
  saveSavedGameFile,
  validateSavedGamePayload,
} from './savedGame'

describe('validateSavedGamePayload', () => {
  it('accepts a valid payload', () => {
    const payload = createValidSavedPayload()

    expect(validateSavedGamePayload(payload)).toEqual(payload)
  })

  it.each([
    {
      name: 'wrong version',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        version: 2 as 1,
      }),
      expectedError: 'Unsupported saved game version. Expected 1.',
    },
    {
      name: 'invalid savedAt',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        savedAt: 'not-a-date',
      }),
      expectedError: 'savedAt must be a valid ISO timestamp.',
    },
    {
      name: 'missing savedAt',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        savedAt: '   ',
      }),
      expectedError: 'savedAt must be a non-empty ISO timestamp string.',
    },
    {
      name: 'too few players',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        config: { players: createTestConfig(2).players },
        scores: [0, 0],
      }),
      expectedError: 'config.players must contain 3–5 players.',
    },
    {
      name: 'too many players',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        config: { players: createTestConfig(6).players },
        scores: [0, 0, 0, 0, 0, 0],
      }),
      expectedError: 'config.players must contain 3–5 players.',
    },
    {
      name: 'duplicate player ids',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        config: {
          players: [
            { id: 'p1', name: 'One' },
            { id: 'p1', name: 'Two' },
            { id: 'p3', name: 'Three' },
          ],
        },
      }),
      expectedError: 'Duplicate player id "p1".',
    },
    {
      name: 'scores length mismatch',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        scores: [0, 0],
      }),
      expectedError: 'scores length must match player count.',
    },
    {
      name: 'negative score',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        scores: [-1, 0, 0],
      }),
      expectedError: 'scores[0] must be >= 0.',
    },
    {
      name: 'non-integer score',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        scores: [1.5, 0, 0],
      }),
      expectedError: 'scores[0] must be an integer.',
    },
    {
      name: 'currentSelectorIndex out of range',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        currentSelectorIndex: 9,
      }),
      expectedError: 'currentSelectorIndex is out of range.',
    },
    {
      name: 'missing clueStates entry',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => {
        const clueStates = { ...payload.clueStates }
        delete clueStates[getAllClueIds(payload.board)[0]]
        return { ...payload, clueStates }
      },
      expectedError: 'clueStates is missing entry for',
    },
    {
      name: 'extra clueStates key',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        clueStates: { ...payload.clueStates, 'unknown-clue': 'unanswered' as const },
      }),
      expectedError: 'clueStates contains unknown clue id "unknown-clue".',
    },
    {
      name: 'active clue unknown',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        activeClueId: 'missing-clue',
      }),
      expectedError: 'activeClueId "missing-clue" is not on the board.',
    },
    {
      name: 'active clue already answered',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => {
        const clueId = getAllClueIds(payload.board)[0]
        return {
          ...payload,
          activeClueId: clueId,
          clueStates: { ...payload.clueStates, [clueId]: 'answered' as const },
        }
      },
      expectedError: 'activeClueId must refer to an unanswered clue.',
    },
    {
      name: 'idle buzz with active clue missing consistency',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        activeClueId: null,
        buzzState: {
          status: 'open' as const,
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: false,
        },
      }),
      expectedError: 'buzzState must be idle when no active clue is set.',
    },
    {
      name: 'buzzed requires player index',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        activeClueId: getAllClueIds(payload.board)[0],
        buzzState: {
          status: 'buzzed' as const,
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: false,
        },
      }),
      expectedError: 'buzzedPlayerIndex is required when buzzState.status is "buzzed".',
    },
    {
      name: 'complete phase with active clue',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        phase: 'complete' as const,
        activeClueId: getAllClueIds(payload.board)[0],
      }),
      expectedError: 'activeClueId must be null when phase is complete.',
    },
    {
      name: 'attempted player out of range',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        activeClueId: getAllClueIds(payload.board)[0],
        buzzState: {
          status: 'open' as const,
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [99],
          isSteal: true,
        },
      }),
      expectedError: 'attemptedPlayerIndices contains an out-of-range index.',
    },
    {
      name: 'buzzed player out of range',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        activeClueId: getAllClueIds(payload.board)[0],
        buzzState: {
          status: 'buzzed' as const,
          buzzedPlayerIndex: 99,
          attemptedPlayerIndices: [],
          isSteal: false,
        },
      }),
      expectedError: 'buzzedPlayerIndex is out of range.',
    },
    {
      name: 'invalid buzz status',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        buzzState: {
          status: 'invalid' as 'idle',
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: false,
        },
      }),
      expectedError: 'buzzState.status must be "idle", "open", or "buzzed".',
    },
    {
      name: 'non-integer buzzedPlayerIndex',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        buzzState: {
          status: 'idle' as const,
          buzzedPlayerIndex: 1.5 as unknown as null,
          attemptedPlayerIndices: [],
          isSteal: false,
        },
      }),
      expectedError: 'buzzState.buzzedPlayerIndex must be an integer or null.',
    },
    {
      name: 'attemptedPlayerIndices not an array',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        buzzState: {
          status: 'idle' as const,
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: null as unknown as number[],
          isSteal: false,
        },
      }),
      expectedError: 'buzzState.attemptedPlayerIndices must be an array.',
    },
    {
      name: 'isSteal not boolean',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        buzzState: {
          status: 'idle' as const,
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: 'yes' as unknown as boolean,
        },
      }),
      expectedError: 'buzzState.isSteal must be a boolean.',
    },
    {
      name: 'invalid clue state value',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => {
        const clueId = getAllClueIds(payload.board)[0]
        return {
          ...payload,
          clueStates: { ...payload.clueStates, [clueId]: 'pending' as 'unanswered' },
        }
      },
      expectedError: 'clueStates["',
    },
    {
      name: 'invalid phase',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        phase: 'paused' as 'playing',
      }),
      expectedError: 'phase must be "playing" or "complete".',
    },
    {
      name: 'scores not an array',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        scores: null as unknown as number[],
      }),
      expectedError: 'scores must be an array.',
    },
    {
      name: 'currentSelectorIndex not an integer',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        currentSelectorIndex: 1.5,
      }),
      expectedError: 'currentSelectorIndex must be an integer.',
    },
    {
      name: 'clueStates not an object',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        clueStates: null as unknown as Record<string, 'unanswered'>,
      }),
      expectedError: 'clueStates must be an object.',
    },
    {
      name: 'activeClueId invalid type',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        activeClueId: 123 as unknown as null,
      }),
      expectedError: 'activeClueId must be a string or null.',
    },
    {
      name: 'buzzedPlayerIndex set without active clue',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        activeClueId: null,
        buzzState: {
          status: 'idle' as const,
          buzzedPlayerIndex: 0,
          attemptedPlayerIndices: [],
          isSteal: false,
        },
      }),
      expectedError: 'buzzedPlayerIndex must be null when no active clue is set.',
    },
    {
      name: 'attempted indices present without active clue',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        activeClueId: null,
        buzzState: {
          status: 'idle' as const,
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [0],
          isSteal: false,
        },
      }),
      expectedError:
        'attemptedPlayerIndices must be empty when no active clue is set.',
    },
    {
      name: 'isSteal true without active clue',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        activeClueId: null,
        buzzState: {
          status: 'idle' as const,
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: true,
        },
      }),
      expectedError: 'isSteal must be false when no active clue is set.',
    },
    {
      name: 'buzzed status without buzzed index',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        activeClueId: getAllClueIds(payload.board)[0],
        buzzState: {
          status: 'open' as const,
          buzzedPlayerIndex: 0,
          attemptedPlayerIndices: [],
          isSteal: false,
        },
      }),
      expectedError:
        'buzzState.status must be "buzzed" when a player has buzzed.',
    },
    {
      name: 'invalid player object',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        config: {
          players: [null, ...payload.config.players.slice(1)] as typeof payload.config.players,
        },
      }),
      expectedError: 'config.players[0] must be an object.',
    },
    {
      name: 'empty player name',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        config: {
          players: [
            { id: 'p1', name: '   ' },
            payload.config.players[1],
            payload.config.players[2],
          ],
        },
      }),
      expectedError: 'config.players[0].name must be a non-empty string.',
    },
    {
      name: 'config not an object',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        config: null as unknown as typeof payload.config,
      }),
      expectedError: 'config must be an object.',
    },
    {
      name: 'players not an array',
      mutate: (payload: ReturnType<typeof createValidSavedPayload>) => ({
        ...payload,
        config: { players: null as unknown as typeof payload.config.players },
      }),
      expectedError: 'config.players must be an array.',
    },
    {
      name: 'payload not an object',
      mutate: () => null,
      expectedError: 'Saved game payload must be a JSON object.',
    },
  ])('rejects $name', ({ mutate, expectedError }) => {
    expect(() => validateSavedGamePayload(mutate(createValidSavedPayload()))).toThrow(
      expectedError,
    )
  })
})

describe('parseSavedGameFile', () => {
  it('returns null for an empty save slot', () => {
    expect(parseSavedGameFile({ savedGame: null })).toBeNull()
  })

  it('returns a validated payload for a valid wrapper', () => {
    const payload = createValidSavedPayload()

    expect(parseSavedGameFile({ savedGame: payload })).toEqual(payload)
  })

  it('throws when savedGame key is missing', () => {
    expect(() => parseSavedGameFile({})).toThrow(
      'Saved game file must include a savedGame property.',
    )
  })

  it('throws when file is not an object', () => {
    expect(() => parseSavedGameFile(null)).toThrow(
      'Saved game file must be a JSON object.',
    )
  })
})

describe('round-trip helpers', () => {
  it('gameStateToSavedPayload validates successfully', () => {
    const state = createGame(createTestConfig(), createStandardBoard())
    const payload = gameStateToSavedPayload(state)

    expect(validateSavedGamePayload(payload)).toMatchObject({
      version: 1,
      config: state.config,
      scores: state.scores,
    })
  })

  it('savedPayloadToGameState matches resumeGameFromSave', () => {
    const payload = createMidGameSavedPayload()

    expect(savedPayloadToGameState(payload)).toEqual(resumeGameFromSave(payload))
  })

  it('preserves mid-game steal buzz state through round-trip', () => {
    const payload = createMidGameSavedPayload()
    const roundTripped = savedPayloadToGameState(payload)

    expect(roundTripped.activeClueId).toBe(payload.activeClueId)
    expect(roundTripped.buzzState).toEqual(payload.buzzState)
    expect(roundTripped.scores).toEqual(payload.scores)
  })
})

describe('loadSavedGameFile', () => {
  it('loads an empty save slot', async () => {
    const result = await loadSavedGameFile()

    expect(result).toEqual({ ok: true, savedGame: null })
  })

  it('loads a valid saved game', async () => {
    const payload = createValidSavedPayload()
    server.use(
      http.get('/api/saved-game', () =>
        HttpResponse.json({ savedGame: payload }),
      ),
    )

    const result = await loadSavedGameFile()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.savedGame?.savedAt).toBe(payload.savedAt)
    }
  })

  it('returns an error for corrupt save data', async () => {
    server.use(
      http.get('/api/saved-game', () =>
        HttpResponse.json({ savedGame: { version: 99 } }),
      ),
    )

    const result = await loadSavedGameFile()

    expect(result.ok).toBe(false)
  })

  it('falls back to static saved-game.json when the API returns 404', async () => {
    server.use(
      http.get('/api/saved-game', () => new HttpResponse(null, { status: 404 })),
    )

    const result = await loadSavedGameFile()

    expect(result).toEqual({ ok: true, savedGame: null })
  })

  it('returns an error when both API and static fallback fail', async () => {
    server.use(
      http.get('/api/saved-game', () => new HttpResponse(null, { status: 404 })),
      http.get('/data/saved-game.json', () => new HttpResponse(null, { status: 404 })),
    )

    const result = await loadSavedGameFile()

    expect(result).toEqual({
      ok: false,
      error: 'Could not load saved game. Is the dev server running?',
    })
  })
})

describe('saveSavedGameFile', () => {
  it('saves a valid payload', async () => {
    const payload = createValidSavedPayload()
    const result = await saveSavedGameFile(payload)

    expect(result).toEqual({ ok: true })
  })

  it('clears the save slot with null', async () => {
    const result = await saveSavedGameFile(null)

    expect(result).toEqual({ ok: true })
  })

  it('returns API error message on failed PUT', async () => {
    server.use(
      http.put('/api/saved-game', () =>
        HttpResponse.json({ error: 'Disk full' }, { status: 400 }),
      ),
    )

    const result = await saveSavedGameFile(createValidSavedPayload())

    expect(result).toEqual({ ok: false, error: 'Disk full' })
  })

  it('returns a network error when fetch fails', async () => {
    server.use(http.put('/api/saved-game', () => HttpResponse.error()))

    const result = await saveSavedGameFile(createValidSavedPayload())

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0)
    }
  })

  it('re-validates payload before PUT', async () => {
    const payload = createValidSavedPayload({ scores: [-5, 0, 0] })

    const result = await saveSavedGameFile(payload)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('scores[0] must be >= 0.')
    }
  })
})

describe('validateSavedGamePayload board sync', () => {
  it('rejects a board that does not match standard dimensions', () => {
    expect(() =>
      validateSavedGamePayload(
        createValidSavedPayload({ board: createTestBoard() }),
      ),
    ).toThrow('Board must contain exactly 6 categories.')
  })
})
