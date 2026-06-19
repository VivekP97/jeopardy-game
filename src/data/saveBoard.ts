import type { Board } from '../types/game'
import { formatBoardValidationError, validateBoard } from './loadBoard'

export type SaveBoardResult =
  | { ok: true; board: Board }
  | { ok: false; error: string }

export async function saveBoard(board: Board): Promise<SaveBoardResult> {
  try {
    const validated = validateBoard(board)
    const response = await fetch('/api/board', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated, null, 2),
    })

    if (!response.ok) {
      let message = `Save failed (${response.status}).`
      try {
        const body = (await response.json()) as { error?: string }
        if (body.error) {
          message = body.error
        }
      } catch {
        // use default message
      }
      return { ok: false, error: message }
    }

    return { ok: true, board: validated }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save board.'
    return { ok: false, error: formatBoardValidationError(message, board) }
  }
}
