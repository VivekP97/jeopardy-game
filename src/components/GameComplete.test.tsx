import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameComplete from './GameComplete'
import { createGame } from '../game/engine'
import { createTestBoard, createTestConfig } from '../test/fixtures/board'
import { renderWithTheme } from '../test/render'

describe('GameComplete', () => {
  it('shows a single winner and final scores', () => {
    const state = createGame(createTestConfig(), createTestBoard())
    state.phase = 'complete'
    state.scores = [600, 1200, 400]

    renderWithTheme(<GameComplete state={state} onNewGame={vi.fn()} />)

    expect(screen.getByText('Winner: Player 2')).toBeInTheDocument()
    expect(screen.getByText('$1,200')).toBeInTheDocument()
  })

  it('shows tied winners', () => {
    const state = createGame(createTestConfig(), createTestBoard())
    state.phase = 'complete'
    state.scores = [800, 800, 200]

    renderWithTheme(<GameComplete state={state} onNewGame={vi.fn()} />)

    expect(screen.getByText('Winners: Player 1, Player 2')).toBeInTheDocument()
  })

  it('calls onNewGame when requested', async () => {
    const user = userEvent.setup()
    const onNewGame = vi.fn()
    const state = createGame(createTestConfig(), createTestBoard())
    state.phase = 'complete'

    renderWithTheme(<GameComplete state={state} onNewGame={onNewGame} />)

    await user.click(screen.getByRole('button', { name: 'New Game' }))

    expect(onNewGame).toHaveBeenCalledOnce()
  })
})
