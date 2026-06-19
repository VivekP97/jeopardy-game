import { describe, expect, it } from 'vitest'
import {
  getRowValues,
  parseClueValueInput,
  setRowValueAndSort,
  sortBoardRowsByValue,
} from './board'
import { createStandardBoard } from '../test/fixtures/board'

describe('board row values', () => {
  it('getRowValues returns values from the first category', () => {
    const board = createStandardBoard()

    expect(getRowValues(board)).toEqual([200, 400, 600, 800, 1000])
  })

  it('sortBoardRowsByValue reorders rows by ascending value', () => {
    const board = createStandardBoard()
    board.categories.forEach((category) => {
      category.clues[0].value = 900
      category.clues[4].value = 100
    })

    const sorted = sortBoardRowsByValue(board)

    expect(getRowValues(sorted)).toEqual([100, 400, 600, 800, 900])
    expect(sorted.categories[0].clues[0].question).toBe(
      board.categories[0].clues[4].question,
    )
    expect(sorted.categories[0].clues[4].question).toBe(
      board.categories[0].clues[0].question,
    )
  })

  it('setRowValueAndSort updates all categories and reorders rows', () => {
    const board = createStandardBoard()
    const next = setRowValueAndSort(board, 0, 750)

    expect(getRowValues(next)).toEqual([400, 600, 750, 800, 1000])
    expect(next.categories[0].clues[2].question).toBe('Question 1-1?')
  })

  it('parseClueValueInput accepts dollar-prefixed integers', () => {
    expect(parseClueValueInput('$500')).toBe(500)
    expect(parseClueValueInput(' 300 ')).toBe(300)
    expect(parseClueValueInput('')).toBeNull()
    expect(parseClueValueInput('0')).toBeNull()
    expect(parseClueValueInput('2.5')).toBeNull()
  })
})
