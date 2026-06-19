import { http, HttpResponse } from 'msw'
import {
  CLUE_VALUES_BY_ROW,
  loadBoard,
  validateBoard,
} from './loadBoard'
import { getRowValues } from '../game/board'
import { createStandardBoard } from '../test/fixtures/board'
import { server } from '../test/msw/server'

describe('validateBoard', () => {
  it('accepts a minimal valid 6×5 board', () => {
    const board = createStandardBoard()

    expect(validateBoard(board)).toEqual(board)
  })

  it('accepts custom ascending row values', () => {
    const board = createStandardBoard()
    const customValues = [100, 250, 500, 750, 900]

    board.categories.forEach((category) => {
      category.clues.forEach((clue, index) => {
        clue.value = customValues[index]
      })
    })

    expect(getRowValues(validateBoard(board))).toEqual(customValues)
  })

  it('sorts out-of-order row values on validate', () => {
    const board = createStandardBoard()
    board.categories.forEach((category) => {
      category.clues[0].value = 1000
      category.clues[4].value = 200
    })

    const validated = validateBoard(board)

    expect(getRowValues(validated)).toEqual([200, 400, 600, 800, 1000])
  })

  it('trims whitespace on string fields', () => {
    const board = createStandardBoard()
    board.categories[0].title = '  Science  '
    board.categories[0].clues[0].question = '  Question?  '
    board.categories[0].clues[0].answer = '  Answer  '

    const validated = validateBoard(board)

    expect(validated.categories[0].title).toBe('Science')
    expect(validated.categories[0].clues[0].question).toBe('Question?')
    expect(validated.categories[0].clues[0].answer).toBe('Answer')
  })

  it.each([
    {
      name: 'not an object',
      input: null,
      expectedError: 'Board must be a JSON object.',
    },
    {
      name: 'missing categories array',
      input: {},
      expectedError: 'Board must include a categories array.',
    },
    {
      name: 'wrong category count',
      input: { categories: [{ id: 'cat-1', title: 'One', clues: [] }] },
      expectedError: 'Board must contain exactly 6 categories.',
    },
    {
      name: 'wrong clue count',
      input: {
        categories: Array.from({ length: 6 }, (_, index) => ({
          id: `cat-${index + 1}`,
          title: `Category ${index + 1}`,
          clues: [{ id: `cat-${index + 1}-200`, value: 200, question: 'Q?', answer: 'A' }],
        })),
      },
      expectedError: 'categories[0].clues must contain exactly 5 clues.',
    },
    {
      name: 'mismatched row values across categories',
      input: (() => {
        const board = createStandardBoard()
        board.categories[1].clues[0].value = 300
        return board
      })(),
      expectedError: 'Row 1 values must match across all categories.',
    },
    {
      name: 'duplicate row values',
      input: (() => {
        const board = createStandardBoard()
        board.categories.forEach((category) => {
          category.clues[1].value = 200
        })
        return board
      })(),
      expectedError: 'Row values must strictly increase',
    },
    {
      name: 'empty category title',
      input: (() => {
        const board = createStandardBoard()
        board.categories[0].title = '   '
        return board
      })(),
      expectedError: 'categories[0].title must be a non-empty string.',
    },
    {
      name: 'empty clue question',
      input: (() => {
        const board = createStandardBoard()
        board.categories[0].clues[0].question = ''
        return board
      })(),
      expectedError: 'categories[0].clues[0].question must be a non-empty string.',
    },
    {
      name: 'duplicate category ids',
      input: (() => {
        const board = createStandardBoard()
        board.categories[1].id = board.categories[0].id
        return board
      })(),
      expectedError: `Duplicate category id "${boardDuplicateId()}".`,
    },
    {
      name: 'duplicate clue ids',
      input: (() => {
        const board = createStandardBoard()
        board.categories[1].clues[0].id = board.categories[0].clues[0].id
        return board
      })(),
      expectedError: `Duplicate clue id "${boardDuplicateClueId()}".`,
    },
    {
      name: 'clue is not an object',
      input: (() => {
        const board = createStandardBoard()
        board.categories[0].clues[0] = null as unknown as typeof board.categories[0]['clues'][0]
        return board
      })(),
      expectedError: 'categories[0].clues[0] must be an object.',
    },
    {
      name: 'clue value is not a number',
      input: (() => {
        const board = createStandardBoard()
        board.categories[0].clues[0].value = '200' as unknown as number
        return board
      })(),
      expectedError: 'categories[0].clues[0].value must be a number.',
    },
    {
      name: 'empty clue answer',
      input: (() => {
        const board = createStandardBoard()
        board.categories[0].clues[0].answer = ''
        return board
      })(),
      expectedError: 'categories[0].clues[0].answer must be a non-empty string.',
    },
    {
      name: 'category is not an object',
      input: { categories: [null, ...createStandardBoard().categories.slice(1)] },
      expectedError: 'categories[0] must be an object.',
    },
    {
      name: 'empty category id',
      input: (() => {
        const board = createStandardBoard()
        board.categories[0].id = '   '
        return board
      })(),
      expectedError: 'categories[0].id must be a non-empty string.',
    },
    {
      name: 'category clues is not an array',
      input: (() => {
        const board = createStandardBoard()
        board.categories[0].clues = null as unknown as typeof board.categories[0]['clues']
        return board
      })(),
      expectedError: 'categories[0].clues must be an array.',
    },
  ])('rejects $name', ({ input, expectedError }) => {
    expect(() => validateBoard(input)).toThrow(expectedError)
  })
})

function boardDuplicateId(): string {
  return createStandardBoard().categories[0].id
}

function boardDuplicateClueId(): string {
  return createStandardBoard().categories[0].clues[0].id
}

describe('loadBoard', () => {
  it('returns a validated board when the API succeeds', async () => {
    const result = await loadBoard()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.board.categories).toHaveLength(6)
      expect(result.board.categories[0].clues).toHaveLength(5)
      expect(result.board.categories[0].clues[0].value).toBe(CLUE_VALUES_BY_ROW[0])
    }
  })

  it('falls back to static board.json when the API returns 404', async () => {
    server.use(
      http.get('/api/board', () => new HttpResponse(null, { status: 404 })),
    )

    const result = await loadBoard()

    expect(result.ok).toBe(true)
  })

  it('returns an error when both API and static fallback fail', async () => {
    server.use(
      http.get('/api/board', () => new HttpResponse(null, { status: 404 })),
      http.get('/data/board.json', () => new HttpResponse(null, { status: 404 })),
    )

    const result = await loadBoard()

    expect(result).toEqual({
      ok: false,
      error: 'Could not load board data. Is the dev server running?',
    })
  })

  it('returns a validator message for invalid JSON shape', async () => {
    server.use(http.get('/api/board', () => HttpResponse.json({ categories: [] })))

    const result = await loadBoard()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('6 categories')
    }
  })

  it('returns a generic error for unexpected failures', async () => {
    server.use(http.get('/api/board', () => HttpResponse.error()))

    const result = await loadBoard()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0)
    }
  })
})
