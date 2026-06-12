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
          status: 'idle',
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: false,
        }}
        buzzedPlayerName={null}
        onOpenBuzz={vi.fn()}
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
          status: 'idle',
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: false,
        }}
        buzzedPlayerName={null}
        onOpenBuzz={vi.fn()}
        onJudge={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))

    expect(screen.getByText('Everything')).toBeInTheDocument()
  })

  it('disables judge buttons until someone has buzzed in', () => {
    renderWithTheme(
      <CluePanel
        clue={clue}
        buzzState={{
          status: 'idle',
          buzzedPlayerIndex: null,
          attemptedPlayerIndices: [],
          isSteal: false,
        }}
        buzzedPlayerName={null}
        onOpenBuzz={vi.fn()}
        onJudge={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Correct' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Incorrect' })).toBeDisabled()
  })

  it('calls parent handlers when buzz is opened and answer is judged', async () => {
    const user = userEvent.setup()
    const onOpenBuzz = vi.fn()
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
        onOpenBuzz={onOpenBuzz}
        onJudge={onJudge}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Correct' }))
    await user.click(screen.getByRole('button', { name: 'Incorrect' }))

    expect(onJudge).toHaveBeenCalledWith(true)
    expect(onJudge).toHaveBeenCalledWith(false)
  })
})
