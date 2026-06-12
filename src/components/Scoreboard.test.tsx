import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Scoreboard from './Scoreboard'
import { createGame } from '../game/engine'
import { createTestBoard, createTestConfig } from '../test/fixtures/board'
import { renderWithTheme } from '../test/render'

describe('Scoreboard', () => {
  it('lists player names and scores', () => {
    const state = createGame(createTestConfig(), createTestBoard())
    state.scores = [200, 400, 0]

    renderWithTheme(<Scoreboard state={state} />)

    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('$200')).toBeInTheDocument()
    expect(screen.getByText('$400')).toBeInTheDocument()
  })

  it('highlights the current selector and buzzed-in player', () => {
    const state = createGame(createTestConfig(), createTestBoard())
    state.currentSelectorIndex = 1
    state.buzzState = {
      status: 'buzzed',
      buzzedPlayerIndex: 2,
      attemptedPlayerIndices: [],
      isSteal: false,
    }

    renderWithTheme(<Scoreboard state={state} />)

    expect(screen.getByText('Selector')).toBeInTheDocument()
    expect(screen.getByText('Buzzed in')).toBeInTheDocument()
  })
})
