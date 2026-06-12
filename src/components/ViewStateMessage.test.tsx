import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ViewStateMessage from './ViewStateMessage'
import { renderWithTheme } from '../test/render'

describe('ViewStateMessage', () => {
  it('renders an error alert with title and message', () => {
    renderWithTheme(
      <ViewStateMessage title="Could not load board" message="File missing" />,
    )

    expect(screen.getByText('Could not load board')).toBeInTheDocument()
    expect(screen.getByText('File missing')).toBeInTheDocument()
  })

  it('renders an optional hint', () => {
    renderWithTheme(
      <ViewStateMessage
        title="Warning"
        message="Something happened"
        severity="warning"
        hint="Try again later."
      />,
    )

    expect(screen.getByText('Try again later.')).toBeInTheDocument()
  })
})
