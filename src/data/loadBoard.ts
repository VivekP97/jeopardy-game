import type { Board, Category, Clue } from '../types/game'
import { sortBoardRowsByValue } from '../game/board'

export const STANDARD_CATEGORY_COUNT = 6
export const STANDARD_CLUES_PER_CATEGORY = 5
export const CLUE_VALUES_BY_ROW = [200, 400, 600, 800, 1000] as const

export type LoadBoardResult =
  | { ok: true; board: Board }
  | { ok: false; error: string }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidClueValue(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

function validateRowValues(categories: Category[]): void {
  if (categories.length === 0) {
    return
  }

  const rowCount = categories[0].clues.length

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const referenceValue = categories[0].clues[rowIndex].value

    for (let catIndex = 0; catIndex < categories.length; catIndex++) {
      const value = categories[catIndex].clues[rowIndex].value
      const path = `categories[${catIndex}].clues[${rowIndex}].value`

      if (!isValidClueValue(value)) {
        throw new Error(`${path} must be a positive integer.`)
      }

      if (value !== referenceValue) {
        throw new Error(
          `Row ${rowIndex + 1} values must match across all categories.`,
        )
      }
    }

    if (rowIndex > 0 && referenceValue <= categories[0].clues[rowIndex - 1].value) {
      throw new Error(
        `Row values must strictly increase (row ${rowIndex + 1} is not greater than row ${rowIndex}).`,
      )
    }
  }
}

function parseClue(value: unknown, path: string): Clue {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${path} must be an object.`)
  }

  const clue = value as Record<string, unknown>

  if (!isNonEmptyString(clue.id)) {
    throw new Error(`${path}.id must be a non-empty string.`)
  }
  if (typeof clue.value !== 'number' || !Number.isFinite(clue.value)) {
    throw new Error(`${path}.value must be a number.`)
  }
  if (!isValidClueValue(clue.value)) {
    throw new Error(`${path}.value must be a positive integer.`)
  }
  if (!isNonEmptyString(clue.question)) {
    throw new Error(`${path}.question must be a non-empty string.`)
  }
  if (!isNonEmptyString(clue.answer)) {
    throw new Error(`${path}.answer must be a non-empty string.`)
  }

  return {
    id: clue.id.trim(),
    value: clue.value,
    question: clue.question.trim(),
    answer: clue.answer.trim(),
  }
}

function parseCategory(value: unknown, path: string): Category {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${path} must be an object.`)
  }

  const category = value as Record<string, unknown>

  if (!isNonEmptyString(category.id)) {
    throw new Error(`${path}.id must be a non-empty string.`)
  }
  if (!isNonEmptyString(category.title)) {
    throw new Error(`${path}.title must be a non-empty string.`)
  }
  if (!Array.isArray(category.clues)) {
    throw new Error(`${path}.clues must be an array.`)
  }
  if (category.clues.length !== STANDARD_CLUES_PER_CATEGORY) {
    throw new Error(
      `${path}.clues must contain exactly ${STANDARD_CLUES_PER_CATEGORY} clues.`,
    )
  }

  const clues = category.clues.map((clue, index) =>
    parseClue(clue, `${path}.clues[${index}]`),
  )

  return {
    id: category.id.trim(),
    title: category.title.trim(),
    clues,
  }
}

export function validateBoard(data: unknown): Board {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Board must be a JSON object.')
  }

  const board = data as Record<string, unknown>

  if (!Array.isArray(board.categories)) {
    throw new Error('Board must include a categories array.')
  }
  if (board.categories.length !== STANDARD_CATEGORY_COUNT) {
    throw new Error(
      `Board must contain exactly ${STANDARD_CATEGORY_COUNT} categories.`,
    )
  }

  const categories = board.categories.map((category, index) =>
    parseCategory(category, `categories[${index}]`),
  )

  const sortedBoard = sortBoardRowsByValue({ categories })

  validateRowValues(sortedBoard.categories)

  const seenIds = new Set<string>()
  for (const category of sortedBoard.categories) {
    if (seenIds.has(category.id)) {
      throw new Error(`Duplicate category id "${category.id}".`)
    }
    seenIds.add(category.id)

    for (const clue of category.clues) {
      if (seenIds.has(clue.id)) {
        throw new Error(`Duplicate clue id "${clue.id}".`)
      }
      seenIds.add(clue.id)
    }
  }

  return sortedBoard
}

async function fetchBoardJson(): Promise<unknown> {
  const apiResponse = await fetch('/api/board')
  if (apiResponse.ok) {
    return apiResponse.json()
  }

  const staticResponse = await fetch('/data/board.json')
  if (!staticResponse.ok) {
    throw new Error('Could not load board data. Is the dev server running?')
  }

  return staticResponse.json()
}

export async function loadBoard(): Promise<LoadBoardResult> {
  try {
    const data = await fetchBoardJson()
    const board = validateBoard(data)
    return { ok: true, board }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load board.'
    return { ok: false, error: message }
  }
}
