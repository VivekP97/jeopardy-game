import { http, HttpResponse } from 'msw'
import { createStandardBoard } from '../test/fixtures/board'
import { server } from '../test/msw/server'
import { saveBoard } from './saveBoard'

describe('saveBoard', () => {
  it('returns a validated board copy on success', async () => {
    const board = createStandardBoard()
    board.categories[0].title = '  Updated  '

    const result = await saveBoard(board)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.board.categories[0].title).toBe('Updated')
    }
  })

  it('rejects invalid boards before fetch', async () => {
    const result = await saveBoard({ categories: [] })

    expect(result).toEqual({
      ok: false,
      error: 'The board must have exactly 6 categories.',
    })
  })

  it('returns API error message when PUT fails', async () => {
    server.use(
      http.put('/api/board', () =>
        HttpResponse.json({ error: 'Write denied' }, { status: 400 }),
      ),
    )

    const result = await saveBoard(createStandardBoard())

    expect(result).toEqual({ ok: false, error: 'Write denied' })
  })

  it('returns a default message when PUT fails without a JSON body', async () => {
    server.use(
      http.put('/api/board', () => new HttpResponse('nope', { status: 500 })),
    )

    const result = await saveBoard(createStandardBoard())

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Save failed (500)')
    }
  })

  it('returns a network error when fetch fails', async () => {
    server.use(http.put('/api/board', () => HttpResponse.error()))

    const result = await saveBoard(createStandardBoard())

    expect(result.ok).toBe(false)
  })
})
