import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PlayGameView from './PlayGameView'
import { createValidSavedPayload } from '../test/fixtures/savedGame'
import { renderWithTheme } from '../test/render'
import { server } from '../test/msw/server'

describe('PlayGameView', () => {
  it('shows an error state when the board fails to load', async () => {
    server.use(
      http.get('/api/board', () => new HttpResponse(null, { status: 404 })),
      http.get('/data/board.json', () => new HttpResponse(null, { status: 404 })),
    )

    renderWithTheme(<PlayGameView />)

    expect(await screen.findByText('Could not load board')).toBeInTheDocument()
  })

  it('starts a game from the setup form and shows the board', async () => {
    const user = userEvent.setup()
    renderWithTheme(<PlayGameView />)

    await screen.findByRole('button', { name: 'Start Game' })
    await user.click(screen.getByRole('button', { name: 'Start Game' }))

    expect(await screen.findByText('Player 1 — pick a clue')).toBeInTheDocument()
  })

  it('continues a saved game from the setup menu', async () => {
    const user = userEvent.setup()
    const payload = createValidSavedPayload({
      scores: [400, 0, 0],
      currentSelectorIndex: 0,
    })

    server.use(
      http.get('/api/saved-game', () =>
        HttpResponse.json({ savedGame: payload }),
      ),
    )

    renderWithTheme(<PlayGameView />)

    await screen.findByRole('button', { name: 'Continue saved game' })
    await user.click(screen.getByRole('button', { name: 'Continue saved game' }))

    expect(await screen.findByText('Player 1 — pick a clue')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save & menu' })).toBeInTheDocument()
  })

  it('returns to the setup menu after Save & menu', async () => {
    const user = userEvent.setup()
    renderWithTheme(<PlayGameView />)

    await screen.findByRole('button', { name: 'Start Game' })
    await user.click(screen.getByRole('button', { name: 'Start Game' }))
    await user.click(await screen.findByRole('button', { name: 'Save & menu' }))

    expect(await screen.findByRole('button', { name: 'Start Game' })).toBeInTheDocument()
  })
})
