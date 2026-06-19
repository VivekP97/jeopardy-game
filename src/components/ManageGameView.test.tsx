import userEvent from '@testing-library/user-event'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import ManageGameView from './ManageGameView'
import { renderWithTheme } from '../test/render'
import { server } from '../test/msw/server'

describe('ManageGameView', () => {
  it('loads the board into an editable draft', async () => {
    renderWithTheme(<ManageGameView />)

    expect(await screen.findByRole('textbox', { name: 'Category 1' })).toHaveValue(
      'Category 1',
    )
    expect(screen.getByRole('button', { name: 'Save board' })).toBeDisabled()
  })

  it('enables save when the draft is dirty and persists on success', async () => {
    const user = userEvent.setup()
    const onBoardSaved = vi.fn()

    renderWithTheme(<ManageGameView onBoardSaved={onBoardSaved} />)

    const categoryField = await screen.findByRole('textbox', { name: 'Category 1' })
    fireEvent.change(categoryField, { target: { value: 'Updated Category' } })

    const saveButton = screen.getByRole('button', { name: 'Save board' })
    expect(saveButton).toBeEnabled()

    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Board saved successfully.')).toBeInTheDocument()
    })
    expect(onBoardSaved).toHaveBeenCalledOnce()
    expect(saveButton).toBeDisabled()
  })

  it('shows a validation error and skips PUT for invalid edits', async () => {
    const user = userEvent.setup()
    renderWithTheme(<ManageGameView />)

    const categoryField = await screen.findByRole('textbox', { name: 'Category 1' })
    fireEvent.change(categoryField, { target: { value: '   ' } })
    await user.click(screen.getByRole('button', { name: 'Save board' }))

    expect(
      await screen.findByText('Category 1: Category name cannot be empty.'),
    ).toBeInTheDocument()
  })

  it('shows a friendly message when an answer is empty', async () => {
    const user = userEvent.setup()
    renderWithTheme(<ManageGameView />)

    await screen.findByRole('textbox', { name: 'Category 1' })

    const answerFields = screen.getAllByRole('textbox', { name: 'Answer' })
    fireEvent.change(answerFields[0], { target: { value: '' } })
    await user.click(screen.getByRole('button', { name: 'Save board' }))

    expect(
      await screen.findByText('Category 1 ($200): Answer cannot be empty.'),
    ).toBeInTheDocument()
  })

  it('resets the draft to the last saved board', async () => {
    const user = userEvent.setup()
    renderWithTheme(<ManageGameView />)

    const categoryField = await screen.findByRole('textbox', { name: 'Category 1' })
    fireEvent.change(categoryField, { target: { value: 'Temporary edit' } })
    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(await screen.findByRole('textbox', { name: 'Category 1' })).toHaveValue(
      'Category 1',
    )
  })

  it('shows API errors from failed saves', async () => {
    const user = userEvent.setup()
    server.use(
      http.put('/api/board', () =>
        HttpResponse.json({ error: 'Write denied' }, { status: 400 }),
      ),
    )

    renderWithTheme(<ManageGameView />)

    const categoryField = await screen.findByRole('textbox', { name: 'Category 1' })
    fireEvent.change(categoryField, { target: { value: 'Category 1!' } })
    await user.click(screen.getByRole('button', { name: 'Save board' }))

    expect(await screen.findByText('Write denied')).toBeInTheDocument()
  })
})
