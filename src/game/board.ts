import type { Board, GameState } from '../types/game'

export function getAllClueIds(board: Board): string[] {
  return board.categories.flatMap((category) =>
    category.clues.map((clue) => clue.id),
  )
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
