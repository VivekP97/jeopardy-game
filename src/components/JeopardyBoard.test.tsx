import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import JeopardyBoard from './JeopardyBoard'
import { createGame } from '../game/engine'
import { createTestBoard, createTestConfig } from '../test/fixtures/board'
import { renderWithTheme } from '../test/render'

describe('JeopardyBoard', () => {
  it('shows the selector prompt with the current player name', () => {
    const state = createGame(createTestConfig(), createTestBoard())

    renderWithTheme(<JeopardyBoard state={state} onSelectClue={vi.fn()} />)

    expect(screen.getByText('Player 1 — pick a clue')).toBeInTheDocument()
  })

  it('disables answered clues and enables unanswered clues', () => {
    const board = createTestBoard()
    const state = createGame(createTestConfig(), board)
    state.clueStates['cat-a-200'] = 'answered'

    renderWithTheme(<JeopardyBoard state={state} onSelectClue={vi.fn()} />)

    const buttons = screen.getAllByRole('button')
    const answeredButton = buttons.find((button) => button.textContent === '')
    expect(answeredButton).toBeDefined()
    expect(answeredButton).toBeDisabled()
    expect(screen.getAllByRole('button', { name: '$400' })[0]).toBeEnabled()
  })

  it('calls onSelectClue when an unanswered clue is clicked', async () => {
    const user = userEvent.setup()
    const onSelectClue = vi.fn()
    const state = createGame(createTestConfig(), createTestBoard())

    renderWithTheme(<JeopardyBoard state={state} onSelectClue={onSelectClue} />)

    await user.click(screen.getAllByRole('button', { name: '$200' })[0])

    expect(onSelectClue).toHaveBeenCalledWith('cat-a-200')
  })

  it('shows in-progress message and disables selection when a clue is active', () => {
    const state = createGame(createTestConfig(), createTestBoard())
    state.activeClueId = 'cat-a-200'

    renderWithTheme(<JeopardyBoard state={state} onSelectClue={vi.fn()} />)

    expect(
      screen.getByText('Clue in progress — finish judging to return to the board'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '$200' })[0]).toBeDisabled()
  })
})
