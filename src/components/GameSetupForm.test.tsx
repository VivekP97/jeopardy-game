import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameSetupForm from './GameSetupForm'
import { renderWithTheme } from '../test/render'

describe('GameSetupForm', () => {
  it('renders 3 name fields by default', () => {
    renderWithTheme(<GameSetupForm onStart={vi.fn()} />)

    expect(screen.getByLabelText('Player 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Player 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Player 3')).toBeInTheDocument()
  })

  it('shows 5 name fields when player count is changed to 5', async () => {
    const user = userEvent.setup()
    renderWithTheme(<GameSetupForm onStart={vi.fn()} />)

    await user.click(screen.getByLabelText('Number of players'))
    await user.click(screen.getByRole('option', { name: '5 players' }))

    expect(screen.getByLabelText('Player 5')).toBeInTheDocument()
  })

  it('shows an error and does not call onStart when a name is empty', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    renderWithTheme(<GameSetupForm onStart={onStart} />)

    await user.clear(screen.getByLabelText('Player 2'))
    await user.click(screen.getByRole('button', { name: 'Start Game' }))

    expect(screen.getByText('Every player needs a name.')).toBeInTheDocument()
    expect(onStart).not.toHaveBeenCalled()
  })

  it('calls onStart with player ids and trimmed names', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    renderWithTheme(<GameSetupForm onStart={onStart} />)

    await user.clear(screen.getByLabelText('Player 1'))
    await user.type(screen.getByLabelText('Player 1'), '  Alice  ')
    await user.click(screen.getByRole('button', { name: 'Start Game' }))

    expect(onStart).toHaveBeenCalledWith({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Player 2' },
        { id: 'p3', name: 'Player 3' },
      ],
    })
  })

  it('calls continue and abandon handlers when a saved game exists', async () => {
    const user = userEvent.setup()
    const onContinueSavedGame = vi.fn()
    const onAbandonSave = vi.fn()

    renderWithTheme(
      <GameSetupForm
        onStart={vi.fn()}
        savedGamePreview={{
          savedAt: '2026-06-12T12:00:00.000Z',
          players: [
            { id: 'p1', name: 'Alice' },
            { id: 'p2', name: 'Bob' },
            { id: 'p3', name: 'Carol' },
          ],
          scores: [200, 0, 400],
        }}
        onContinueSavedGame={onContinueSavedGame}
        onAbandonSave={onAbandonSave}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Continue saved game' }))
    await user.click(screen.getByRole('button', { name: 'Abandon save' }))

    expect(onContinueSavedGame).toHaveBeenCalledOnce()
    expect(onAbandonSave).toHaveBeenCalledOnce()
  })

  it('shows saved game player names and scores', () => {
    renderWithTheme(
      <GameSetupForm
        onStart={vi.fn()}
        savedGamePreview={{
          savedAt: '2026-06-12T12:00:00.000Z',
          players: [
            { id: 'p1', name: 'Alice' },
            { id: 'p2', name: 'Bob' },
          ],
          scores: [600, 1200],
        }}
        onContinueSavedGame={vi.fn()}
        onAbandonSave={vi.fn()}
      />,
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('$600')).toBeInTheDocument()
    expect(screen.getByText('$1,200')).toBeInTheDocument()
  })

  it('disables continue and abandon buttons while loading actions run', () => {
    renderWithTheme(
      <GameSetupForm
        onStart={vi.fn()}
        savedGamePreview={{
          savedAt: '2026-06-12T12:00:00.000Z',
          players: [{ id: 'p1', name: 'Alice' }],
          scores: [0],
        }}
        onContinueSavedGame={vi.fn()}
        onAbandonSave={vi.fn()}
        isContinuing
        isAbandoning
      />,
    )

    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Clearing…' })).toBeDisabled()
  })
})
