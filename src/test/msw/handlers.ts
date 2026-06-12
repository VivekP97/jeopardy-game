import { http, HttpResponse } from 'msw'
import { createStandardBoard } from '../fixtures/board'
import { createValidSavedPayload } from '../fixtures/savedGame'

const standardBoard = createStandardBoard()

export const handlers = [
  http.get('/api/board', () => HttpResponse.json(standardBoard)),
  http.put('/api/board', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body)
  }),
  http.get('/api/saved-game', () => HttpResponse.json({ savedGame: null })),
  http.put('/api/saved-game', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body)
  }),
  http.get('/data/board.json', () => HttpResponse.json(standardBoard)),
  http.get('/data/saved-game.json', () => HttpResponse.json({ savedGame: null })),
]

export { standardBoard, createValidSavedPayload }
