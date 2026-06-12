import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  CLUE_VALUES_BY_ROW,
  loadBoard,
  validateBoard,
} from '../data/loadBoard'
import { saveBoard } from '../data/saveBoard'
import type { Board } from '../types/game'

export type ManageGameViewProps = {
  onBoardSaved?: () => void
}

type LoadStatus = 'loading' | 'ready' | 'error'

function cloneBoard(board: Board): Board {
  return structuredClone(board)
}

function boardsEqual(a: Board, b: Board): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export default function ManageGameView({ onBoardSaved }: ManageGameViewProps) {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState('')
  const [savedBoard, setSavedBoard] = useState<Board | null>(null)
  const [draft, setDraft] = useState<Board | null>(null)
  const [validationError, setValidationError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    void loadBoard().then((result) => {
      if (cancelled) {
        return
      }

      if (result.ok) {
        const board = cloneBoard(result.board)
        setSavedBoard(board)
        setDraft(cloneBoard(board))
        setStatus('ready')
        return
      }

      setLoadError(result.error)
      setStatus('error')
    })

    return () => {
      cancelled = true
    }
  }, [])

  const isDirty =
    draft !== null && savedBoard !== null && !boardsEqual(draft, savedBoard)

  const handleCategoryTitleChange = (categoryIndex: number, title: string) => {
    setDraft((prev) => {
      if (!prev) {
        return prev
      }

      const categories = prev.categories.map((category, index) =>
        index === categoryIndex ? { ...category, title } : category,
      )
      return { categories }
    })
    setValidationError('')
    setSaveMessage('')
  }

  const handleClueFieldChange = (
    categoryIndex: number,
    clueIndex: number,
    field: 'question' | 'answer',
    value: string,
  ) => {
    setDraft((prev) => {
      if (!prev) {
        return prev
      }

      const categories = prev.categories.map((category, catIndex) => {
        if (catIndex !== categoryIndex) {
          return category
        }

        const clues = category.clues.map((clue, clIndex) =>
          clIndex === clueIndex ? { ...clue, [field]: value } : clue,
        )
        return { ...category, clues }
      })
      return { categories }
    })
    setValidationError('')
    setSaveMessage('')
  }

  const handleReset = () => {
    if (!savedBoard) {
      return
    }
    setDraft(cloneBoard(savedBoard))
    setValidationError('')
    setSaveMessage('')
  }

  const handleSave = async () => {
    if (!draft) {
      return
    }

    setValidationError('')
    setSaveMessage('')

    try {
      validateBoard(draft)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Board validation failed.'
      setValidationError(message)
      return
    }

    setIsSaving(true)
    const result = await saveBoard(draft)
    setIsSaving(false)

    if (!result.ok) {
      setValidationError(result.error)
      return
    }

    const persisted = cloneBoard(result.board)
    setSavedBoard(persisted)
    setDraft(cloneBoard(persisted))
    setSaveMessage('Board saved successfully.')
    onBoardSaved?.()
  }

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress color="secondary" aria-label="Loading board editor" />
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <Alert severity="error" sx={{ maxWidth: 640 }}>
        {loadError}
      </Alert>
    )
  }

  if (!draft) {
    return null
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" color="secondary" gutterBottom>
          Manage Game
        </Typography>
        <Typography color="text.secondary">
          Edit category titles, questions, and answers. Dollar values are fixed
          by row ($200–$1000).
        </Typography>
      </Box>

      {validationError ? (
        <Alert severity="error" onClose={() => setValidationError('')}>
          {validationError}
        </Alert>
      ) : null}

      {saveMessage ? (
        <Alert severity="success" onClose={() => setSaveMessage('')}>
          {saveMessage}
        </Alert>
      ) : null}

      <TableContainer
        component={Paper}
        sx={{ overflowX: 'auto', bgcolor: 'background.paper' }}
      >
        <Table size="small" sx={{ minWidth: 960 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: 'secondary.main',
                  width: 80,
                  verticalAlign: 'bottom',
                }}
              >
                Value
              </TableCell>
              {draft.categories.map((category, categoryIndex) => (
                <TableCell key={category.id} sx={{ verticalAlign: 'top' }}>
                  <TextField
                    label={`Category ${categoryIndex + 1}`}
                    value={category.title}
                    onChange={(event) =>
                      handleCategoryTitleChange(
                        categoryIndex,
                        event.target.value,
                      )
                    }
                    fullWidth
                    size="small"
                    required
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {CLUE_VALUES_BY_ROW.map((value, rowIndex) => (
              <TableRow key={value}>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: 'secondary.main',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                    pt: 2,
                  }}
                >
                  ${value.toLocaleString()}
                </TableCell>
                {draft.categories.map((category, categoryIndex) => {
                  const clue = category.clues[rowIndex]

                  return (
                    <TableCell key={clue.id} sx={{ verticalAlign: 'top' }}>
                      <Stack spacing={1}>
                        <TextField
                          label="Question"
                          value={clue.question}
                          onChange={(event) =>
                            handleClueFieldChange(
                              categoryIndex,
                              rowIndex,
                              'question',
                              event.target.value,
                            )
                          }
                          fullWidth
                          size="small"
                          multiline
                          minRows={2}
                          required
                        />
                        <TextField
                          label="Answer"
                          value={clue.answer}
                          onChange={(event) =>
                            handleClueFieldChange(
                              categoryIndex,
                              rowIndex,
                              'answer',
                              event.target.value,
                            )
                          }
                          fullWidth
                          size="small"
                          required
                        />
                      </Stack>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => void handleSave()}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? 'Saving…' : 'Save board'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleReset}
          disabled={isSaving || !isDirty}
        >
          Reset
        </Button>
      </Stack>
    </Stack>
  )
}
