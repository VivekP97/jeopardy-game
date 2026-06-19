import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BuzzPanel from './BuzzPanel'
import { createGame } from '../game/engine'
import { createTestBoard, createTestConfig } from '../test/fixtures/board'
import { renderWithTheme } from '../test/render'

describe('BuzzPanel', () => {
  it('disables buzz buttons when no clue is active', () => {
    const state = createGame(createTestConfig(), createTestBoard())

    renderWithTheme(<BuzzPanel state={state} onBuzz={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Buzz — Player 1' })).toBeDisabled()
    expect(screen.getByText('Select a clue to enable buzzers.')).toBeInTheDocument()
  })

  it('enables player buttons when a clue is active', () => {
    const state = createGame(createTestConfig(), createTestBoard())
    state.activeClueId = 'cat-a-200'
    state.buzzState.status = 'open'

    renderWithTheme(<BuzzPanel state={state} onBuzz={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Buzz — Player 1' })).toBeEnabled()
  })

  it('disables player buttons while waiting for host judgment', () => {
    const state = createGame(createTestConfig(), createTestBoard())
    state.activeClueId = 'cat-a-200'
    state.buzzState = {
      status: 'buzzed',
      buzzedPlayerIndex: 0,
      attemptedPlayerIndices: [],
      isSteal: false,
    }

    renderWithTheme(<BuzzPanel state={state} onBuzz={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Buzz — Player 1' })).toBeDisabled()
  })

  it('shows steal round messaging and disables attempted players', () => {
    const state = createGame(createTestConfig(), createTestBoard())
    state.activeClueId = 'cat-a-200'
    state.buzzState = {
      status: 'open',
      buzzedPlayerIndex: null,
      attemptedPlayerIndices: [0],
      isSteal: true,
    }

    renderWithTheme(<BuzzPanel state={state} onBuzz={vi.fn()} />)

    expect(screen.getByText(/Steal round!/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buzz — Player 1' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Buzz — Player 2' })).toBeEnabled()
  })

  it('calls onBuzz with the player index', async () => {
    const user = userEvent.setup()
    const onBuzz = vi.fn()
    const state = createGame(createTestConfig(), createTestBoard())
    state.activeClueId = 'cat-a-200'
    state.buzzState.status = 'open'

    renderWithTheme(<BuzzPanel state={state} onBuzz={onBuzz} />)

    await user.click(screen.getByRole('button', { name: 'Buzz — Player 2' }))

    expect(onBuzz).toHaveBeenCalledWith(1)
  })
})
