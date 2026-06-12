import { CLUE_VALUES_BY_ROW } from '../../data/loadBoard'
import type { Board, GameConfig } from '../../types/game'

export function createTestBoard(overrides?: Partial<Board>): Board {
  const board: Board = {
    categories: [
      {
        id: 'cat-a',
        title: 'Category A',
        clues: [
          {
            id: 'cat-a-200',
            value: 200,
            question: 'Question A1?',
            answer: 'Answer A1',
          },
          {
            id: 'cat-a-400',
            value: 400,
            question: 'Question A2?',
            answer: 'Answer A2',
          },
        ],
      },
      {
        id: 'cat-b',
        title: 'Category B',
        clues: [
          {
            id: 'cat-b-200',
            value: 200,
            question: 'Question B1?',
            answer: 'Answer B1',
          },
          {
            id: 'cat-b-400',
            value: 400,
            question: 'Question B2?',
            answer: 'Answer B2',
          },
        ],
      },
    ],
  }

  return { ...board, ...overrides }
}

export function createStandardBoard(): Board {
  const categories = Array.from({ length: 6 }, (_, categoryIndex) => ({
    id: `cat-${categoryIndex + 1}`,
    title: `Category ${categoryIndex + 1}`,
    clues: CLUE_VALUES_BY_ROW.map((value, rowIndex) => ({
      id: `cat-${categoryIndex + 1}-${value}`,
      value,
      question: `Question ${categoryIndex + 1}-${rowIndex + 1}?`,
      answer: `Answer ${categoryIndex + 1}-${rowIndex + 1}`,
    })),
  }))

  return { categories }
}

export function getClueId(
  board: Board,
  categoryIndex: number,
  rowIndex: number,
): string {
  return board.categories[categoryIndex].clues[rowIndex].id
}

export function createTestConfig(playerCount = 3): GameConfig {
  return {
    players: Array.from({ length: playerCount }, (_, index) => ({
      id: `p${index + 1}`,
      name: `Player ${index + 1}`,
    })),
  }
}
