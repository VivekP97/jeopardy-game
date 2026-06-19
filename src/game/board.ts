import type { Board, GameState } from '../types/game'

export function getAllClueIds(board: Board): string[] {
  return board.categories.flatMap((category) =>
    category.clues.map((clue) => clue.id),
  )
}

export function getRowValues(board: Board): number[] {
  if (board.categories.length === 0 || board.categories[0].clues.length === 0) {
    return []
  }
  return board.categories[0].clues.map((clue) => clue.value)
}

export function sortBoardRowsByValue(board: Board): Board {
  const rowCount = board.categories[0]?.clues.length ?? 0
  if (rowCount === 0) {
    return board
  }

  const rowValues = getRowValues(board)
  const rowOrder = Array.from({ length: rowCount }, (_, index) => index)
  rowOrder.sort((a, b) => {
    const diff = rowValues[a] - rowValues[b]
    return diff !== 0 ? diff : a - b
  })

  return {
    categories: board.categories.map((category) => ({
      ...category,
      clues: rowOrder.map((index) => category.clues[index]),
    })),
  }
}

export function setRowValueAndSort(
  board: Board,
  rowIndex: number,
  value: number,
): Board {
  const next: Board = structuredClone(board)
  for (const category of next.categories) {
    category.clues[rowIndex].value = value
  }
  return sortBoardRowsByValue(next)
}

export function parseClueValueInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/^\$/, '')
  if (trimmed === '') {
    return null
  }
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

export function countRemainingClues(state: GameState): number {
  return getAllClueIds(state.board).filter(
    (id) => state.clueStates[id] === 'unanswered',
  ).length
}

export function isGameComplete(state: GameState): boolean {
  if (state.phase === 'complete') {
    return true
  }
  return countRemainingClues(state) === 0
}

export function getWinnerIndices(state: GameState): number[] {
  if (state.scores.length === 0) {
    return []
  }

  const maxScore = Math.max(...state.scores)
  return state.scores
    .map((score, index) => (score === maxScore ? index : -1))
    .filter((index) => index >= 0)
}
