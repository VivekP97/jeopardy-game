import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CluePanel from './CluePanel'
import { renderWithTheme } from '../test/render'

describe('CluePanel', () => {
  const clue = {
    id: 'cat-a-200',
    value: 200,
    question: 'What is tested?',
    answer: 'Everything',
  }

  it('shows the question for the active clue', () => {
    renderWithTheme(
      <CluePanel
        clue={clue}
        buzzState={{
          status: 'open',
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: false,
        }}
        buzzedPlayerName={null}
        onJudge={vi.fn()}
      />,
    )

    expect(screen.getByText('What is tested?')).toBeInTheDocument()
  })

  it('reveals the answer when requested', async () => {
    const user = userEvent.setup()

    renderWithTheme(
      <CluePanel
        clue={clue}
        buzzState={{
          status: 'open',
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: false,
        }}
        buzzedPlayerName={null}
        onJudge={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))

    expect(screen.getByText('Everything')).toBeInTheDocument()
  })

  it('disables judge buttons until someone has been selected', () => {
    renderWithTheme(
      <CluePanel
        clue={clue}
        buzzState={{
          status: 'open',
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: false,
        }}
        buzzedPlayerName={null}
        onJudge={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Correct' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Incorrect' })).toBeDisabled()
  })

  it('calls onJudge when the host marks an answer', async () => {
    const user = userEvent.setup()
    const onJudge = vi.fn()

    renderWithTheme(
      <CluePanel
        clue={clue}
        buzzState={{
          status: 'buzzed',
          buzzedPlayerIndex: 0,
          attemptedPlayerIndices: [],
          isSteal: false,
        }}
        buzzedPlayerName="Player 1"
        onJudge={onJudge}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Correct' }))
    await user.click(screen.getByRole('button', { name: 'Incorrect' }))

    expect(onJudge).toHaveBeenCalledWith(true)
    expect(onJudge).toHaveBeenCalledWith(false)
  })
})
