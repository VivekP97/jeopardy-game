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

function formatClueLocation(
  categoryIndex: number,
  clueIndex: number,
  board?: Board,
): string {
  const categoryNumber = categoryIndex + 1
  const value = board?.categories[categoryIndex]?.clues[clueIndex]?.value

  if (value !== undefined) {
    return `Category ${categoryNumber} ($${value.toLocaleString()})`
  }

  return `Category ${categoryNumber}, row ${clueIndex + 1}`
}

export function formatBoardValidationError(
  message: string,
  board?: Board,
): string {
  const categoryClueField = message.match(
    /^categories\[(\d+)\]\.clues\[(\d+)\]\.(\w+) must be a non-empty string\.$/,
  )
  if (categoryClueField) {
    const categoryIndex = Number(categoryClueField[1])
    const clueIndex = Number(categoryClueField[2])
    const field = categoryClueField[3]
    const location = formatClueLocation(categoryIndex, clueIndex, board)
    const fieldLabel =
      field === 'question' ? 'Question' : field === 'answer' ? 'Answer' : field

    return `${location}: ${fieldLabel} cannot be empty.`
  }

  const categoryTitle = message.match(
    /^categories\[(\d+)\]\.title must be a non-empty string\.$/,
  )
  if (categoryTitle) {
    return `Category ${Number(categoryTitle[1]) + 1}: Category name cannot be empty.`
  }

  const categoryClueValue = message.match(
    /^categories\[(\d+)\]\.clues\[(\d+)\]\.value must be a (positive integer|number)\.$/,
  )
  if (categoryClueValue) {
    const categoryIndex = Number(categoryClueValue[1])
    const clueIndex = Number(categoryClueValue[2])
    const location = formatClueLocation(categoryIndex, clueIndex, board)

    if (categoryClueValue[3] === 'positive integer') {
      return `${location}: Value must be a positive whole number.`
    }

    return `${location}: Value must be a number.`
  }

  const categoryClueCount = message.match(
    /^categories\[(\d+)\]\.clues must contain exactly (\d+) clues\.$/,
  )
  if (categoryClueCount) {
    return `Category ${Number(categoryClueCount[1]) + 1} must have exactly ${categoryClueCount[2]} clues.`
  }

  const rowValueMismatch = message.match(/^Row (\d+) values must match across all categories\.$/)
  if (rowValueMismatch) {
    return `Row ${rowValueMismatch[1]} has mismatched values across categories. Each row must use the same value in every category.`
  }

  if (message.includes('Row values must strictly increase')) {
    return 'Row values must increase from top to bottom, with a unique value on each row.'
  }

  const duplicateCategoryId = message.match(/^Duplicate category id "(.+)"\.$/)
  if (duplicateCategoryId) {
    return `Duplicate category id "${duplicateCategoryId[1]}". Each category needs a unique id.`
  }

  const duplicateClueId = message.match(/^Duplicate clue id "(.+)"\.$/)
  if (duplicateClueId) {
    return `Duplicate clue id "${duplicateClueId[1]}". Each clue needs a unique id.`
  }

  const knownMessages: Record<string, string> = {
    'Board must be a JSON object.': 'The board file must be a JSON object.',
    'Board must include a categories array.': 'The board must include a categories list.',
    [`Board must contain exactly ${STANDARD_CATEGORY_COUNT} categories.`]: `The board must have exactly ${STANDARD_CATEGORY_COUNT} categories.`,
    'Could not load board data. Is the dev server running?':
      'Could not load the board. Is the dev server running?',
    'Failed to load board.': 'Could not load the board.',
  }

  return knownMessages[message] ?? message
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
    return { ok: false, error: formatBoardValidationError(message) }
  }
}
