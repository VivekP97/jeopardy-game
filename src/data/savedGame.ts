import { getAllClueIds } from '../game/board'
import type {
  BuzzState,
  BuzzStatus,
  ClueState,
  GameConfig,
  GamePhase,
  GameState,
  Player,
  SavedGameFile,
  SavedGamePayload,
} from '../types/game'
import { validateBoard } from './loadBoard'

const SAVED_GAME_VERSION = 1
const MIN_PLAYERS = 3
const MAX_PLAYERS = 5

export type LoadSavedGameResult =
  | { ok: true; savedGame: SavedGamePayload | null }
  | { ok: false; error: string }

export type SaveSavedGameResult =
  | { ok: true }
  | { ok: false; error: string }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function parsePlayer(value: unknown, path: string): Player {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${path} must be an object.`)
  }

  const player = value as Record<string, unknown>

  if (!isNonEmptyString(player.id)) {
    throw new Error(`${path}.id must be a non-empty string.`)
  }
  if (!isNonEmptyString(player.name)) {
    throw new Error(`${path}.name must be a non-empty string.`)
  }

  return {
    id: player.id.trim(),
    name: player.name.trim(),
  }
}

function parseGameConfig(value: unknown, path: string): GameConfig {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${path} must be an object.`)
  }

  const config = value as Record<string, unknown>

  if (!Array.isArray(config.players)) {
    throw new Error(`${path}.players must be an array.`)
  }
  if (
    config.players.length < MIN_PLAYERS ||
    config.players.length > MAX_PLAYERS
  ) {
    throw new Error(
      `${path}.players must contain ${MIN_PLAYERS}–${MAX_PLAYERS} players.`,
    )
  }

  const players = config.players.map((player, index) =>
    parsePlayer(player, `${path}.players[${index}]`),
  )

  const seenIds = new Set<string>()
  for (const player of players) {
    if (seenIds.has(player.id)) {
      throw new Error(`Duplicate player id "${player.id}".`)
    }
    seenIds.add(player.id)
  }

  return { players }
}

function parseBuzzStatus(value: unknown, path: string): BuzzStatus {
  if (value !== 'idle' && value !== 'open' && value !== 'buzzed') {
    throw new Error(`${path} must be "idle", "open", or "buzzed".`)
  }
  return value
}

function parseBuzzState(value: unknown, path: string): BuzzState {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${path} must be an object.`)
  }

  const buzzState = value as Record<string, unknown>
  const status = parseBuzzStatus(buzzState.status, `${path}.status`)

  if (
    buzzState.buzzedPlayerIndex !== null &&
    (typeof buzzState.buzzedPlayerIndex !== 'number' ||
      !Number.isInteger(buzzState.buzzedPlayerIndex))
  ) {
    throw new Error(`${path}.buzzedPlayerIndex must be an integer or null.`)
  }

  if (!Array.isArray(buzzState.attemptedPlayerIndices)) {
    throw new Error(`${path}.attemptedPlayerIndices must be an array.`)
  }

  const attemptedPlayerIndices = buzzState.attemptedPlayerIndices.map(
    (index, arrayIndex) => {
      if (typeof index !== 'number' || !Number.isInteger(index)) {
        throw new Error(
          `${path}.attemptedPlayerIndices[${arrayIndex}] must be an integer.`,
        )
      }
      return index
    },
  )

  if (typeof buzzState.isSteal !== 'boolean') {
    throw new Error(`${path}.isSteal must be a boolean.`)
  }

  return {
    status,
    buzzedPlayerIndex: buzzState.buzzedPlayerIndex,
    attemptedPlayerIndices,
    isSteal: buzzState.isSteal,
  }
}

function parseClueState(value: unknown, path: string): ClueState {
  if (value !== 'unanswered' && value !== 'answered') {
    throw new Error(`${path} must be "unanswered" or "answered".`)
  }
  return value
}

function parseGamePhase(value: unknown, path: string): GamePhase {
  if (value !== 'playing' && value !== 'complete') {
    throw new Error(`${path} must be "playing" or "complete".`)
  }
  return value
}

export function validateSavedGamePayload(data: unknown): SavedGamePayload {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Saved game payload must be a JSON object.')
  }

  const payload = data as Record<string, unknown>

  if (payload.version !== SAVED_GAME_VERSION) {
    throw new Error(
      `Unsupported saved game version. Expected ${SAVED_GAME_VERSION}.`,
    )
  }
  if (!isNonEmptyString(payload.savedAt)) {
    throw new Error('savedAt must be a non-empty ISO timestamp string.')
  }
  if (Number.isNaN(Date.parse(payload.savedAt))) {
    throw new Error('savedAt must be a valid ISO timestamp.')
  }

  const config = parseGameConfig(payload.config, 'config')
  const board = validateBoard(payload.board)
  const playerCount = config.players.length

  if (!Array.isArray(payload.scores)) {
    throw new Error('scores must be an array.')
  }
  if (payload.scores.length !== playerCount) {
    throw new Error('scores length must match player count.')
  }

  const scores = payload.scores.map((score, index) => {
    if (typeof score !== 'number' || !Number.isInteger(score)) {
      throw new Error(`scores[${index}] must be an integer.`)
    }
    if (score < 0) {
      throw new Error(`scores[${index}] must be >= 0.`)
    }
    return score
  })

  if (
    typeof payload.currentSelectorIndex !== 'number' ||
    !Number.isInteger(payload.currentSelectorIndex)
  ) {
    throw new Error('currentSelectorIndex must be an integer.')
  }
  if (
    payload.currentSelectorIndex < 0 ||
    payload.currentSelectorIndex >= playerCount
  ) {
    throw new Error('currentSelectorIndex is out of range.')
  }

  const phase = parseGamePhase(payload.phase, 'phase')

  if (typeof payload.clueStates !== 'object' || payload.clueStates === null) {
    throw new Error('clueStates must be an object.')
  }

  const clueIds = getAllClueIds(board)
  const clueStates: Record<string, ClueState> = {}

  for (const clueId of clueIds) {
    const state = (payload.clueStates as Record<string, unknown>)[clueId]
    if (state === undefined) {
      throw new Error(`clueStates is missing entry for "${clueId}".`)
    }
    clueStates[clueId] = parseClueState(state, `clueStates["${clueId}"]`)
  }

  for (const key of Object.keys(payload.clueStates as Record<string, unknown>)) {
    if (!clueIds.includes(key)) {
      throw new Error(`clueStates contains unknown clue id "${key}".`)
    }
  }

  if (
    payload.activeClueId !== null &&
    !isNonEmptyString(payload.activeClueId)
  ) {
    throw new Error('activeClueId must be a string or null.')
  }

  const activeClueId =
    payload.activeClueId === null ? null : payload.activeClueId.trim()

  if (activeClueId !== null && !clueIds.includes(activeClueId)) {
    throw new Error(`activeClueId "${activeClueId}" is not on the board.`)
  }

  const buzzState = parseBuzzState(payload.buzzState, 'buzzState')

  if (activeClueId === null) {
    if (buzzState.status !== 'idle') {
      throw new Error('buzzState must be idle when no active clue is set.')
    }
    if (buzzState.buzzedPlayerIndex !== null) {
      throw new Error('buzzedPlayerIndex must be null when no active clue is set.')
    }
    if (buzzState.attemptedPlayerIndices.length > 0) {
      throw new Error(
        'attemptedPlayerIndices must be empty when no active clue is set.',
      )
    }
    if (buzzState.isSteal) {
      throw new Error('isSteal must be false when no active clue is set.')
    }
  } else if (clueStates[activeClueId] !== 'unanswered') {
    throw new Error('activeClueId must refer to an unanswered clue.')
  }

  for (const index of buzzState.attemptedPlayerIndices) {
    if (index < 0 || index >= playerCount) {
      throw new Error('attemptedPlayerIndices contains an out-of-range index.')
    }
  }

  if (buzzState.buzzedPlayerIndex !== null) {
    if (buzzState.buzzedPlayerIndex < 0 || buzzState.buzzedPlayerIndex >= playerCount) {
      throw new Error('buzzedPlayerIndex is out of range.')
    }
    if (buzzState.status !== 'buzzed') {
      throw new Error('buzzState.status must be "buzzed" when a player has buzzed.')
    }
  } else if (buzzState.status === 'buzzed') {
    throw new Error('buzzedPlayerIndex is required when buzzState.status is "buzzed".')
  }

  if (phase === 'complete' && activeClueId !== null) {
    throw new Error('activeClueId must be null when phase is complete.')
  }

  return {
    version: SAVED_GAME_VERSION,
    savedAt: payload.savedAt.trim(),
    config,
    board,
    scores,
    currentSelectorIndex: payload.currentSelectorIndex,
    phase,
    clueStates,
    activeClueId,
    buzzState,
  }
}

export function parseSavedGameFile(data: unknown): SavedGamePayload | null {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Saved game file must be a JSON object.')
  }

  const file = data as Record<string, unknown>

  if (!('savedGame' in file)) {
    throw new Error('Saved game file must include a savedGame property.')
  }

  if (file.savedGame === null) {
    return null
  }

  return validateSavedGamePayload(file.savedGame)
}

export function gameStateToSavedPayload(state: GameState): SavedGamePayload {
  return {
    version: SAVED_GAME_VERSION,
    savedAt: new Date().toISOString(),
    config: state.config,
    board: state.board,
    scores: state.scores,
    currentSelectorIndex: state.currentSelectorIndex,
    phase: state.phase,
    clueStates: { ...state.clueStates },
    activeClueId: state.activeClueId,
    buzzState: {
      ...state.buzzState,
      attemptedPlayerIndices: [...state.buzzState.attemptedPlayerIndices],
    },
  }
}

export function savedPayloadToGameState(payload: SavedGamePayload): GameState {
  return {
    config: payload.config,
    board: payload.board,
    scores: [...payload.scores],
    currentSelectorIndex: payload.currentSelectorIndex,
    phase: payload.phase,
    clueStates: { ...payload.clueStates },
    activeClueId: payload.activeClueId,
    buzzState: {
      ...payload.buzzState,
      attemptedPlayerIndices: [...payload.buzzState.attemptedPlayerIndices],
    },
  }
}

async function fetchSavedGameJson(): Promise<unknown> {
  const apiResponse = await fetch('/api/saved-game')
  if (apiResponse.ok) {
    return apiResponse.json()
  }

  const staticResponse = await fetch('/data/saved-game.json')
  if (!staticResponse.ok) {
    throw new Error('Could not load saved game. Is the dev server running?')
  }

  return staticResponse.json()
}

export async function loadSavedGameFile(): Promise<LoadSavedGameResult> {
  try {
    const data = await fetchSavedGameJson()
    const savedGame = parseSavedGameFile(data)
    return { ok: true, savedGame }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load saved game.'
    return { ok: false, error: message }
  }
}

export async function saveSavedGameFile(
  payload: SavedGamePayload | null,
): Promise<SaveSavedGameResult> {
  try {
    const file: SavedGameFile = {
      savedGame: payload === null ? null : validateSavedGamePayload(payload),
    }

    const response = await fetch('/api/saved-game', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file, null, 2),
    })

    if (!response.ok) {
      let message = `Save failed (${response.status}).`
      try {
        const body = (await response.json()) as { error?: string }
        if (body.error) {
          message = body.error
        }
      } catch {
        // use default message
      }
      return { ok: false, error: message }
    }

    return { ok: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save game.'
    return { ok: false, error: message }
  }
}
