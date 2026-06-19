import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
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
import { loadBoard, validateBoard } from '../data/loadBoard'
import { saveBoard } from '../data/saveBoard'
import {
  getRowValues,
  parseClueValueInput,
  setRowValueAndSort,
} from '../game/board'
import type { Board } from '../types/game'
import ViewStateMessage from './ViewStateMessage'

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

const centeredFieldSx = {
  '& .MuiInputBase-input': { textAlign: 'center' },
  '& .MuiInputBase-inputMultiline': { textAlign: 'center' },
}

const gridBorder = '1px solid rgba(255, 215, 0, 0.32)'

const tableCellBase = {
  textAlign: 'center' as const,
  border: gridBorder,
  px: 1.5,
}

const valueColumnWidth = 128

const valueHeaderCellSx = {
  ...tableCellBase,
  fontWeight: 700,
  color: 'secondary.main',
  width: valueColumnWidth,
  minWidth: valueColumnWidth,
  fontSize: '1.25rem',
  verticalAlign: 'bottom',
  py: 1.5,
  bgcolor: 'rgba(255, 215, 0, 0.08)',
  borderBottom: '2px solid rgba(255, 215, 0, 0.55)',
}

const valueBodyCellSx = {
  ...tableCellBase,
  fontWeight: 700,
  color: 'secondary.main',
  width: valueColumnWidth,
  minWidth: valueColumnWidth,
  whiteSpace: 'nowrap' as const,
  fontSize: '1.35rem',
  verticalAlign: 'middle',
  py: 2.5,
  bgcolor: 'rgba(255, 215, 0, 0.06)',
}

const bodyRowCellSx = {
  ...tableCellBase,
  verticalAlign: 'middle',
  py: 2.5,
}

const headerCategoryCellSx = {
  ...tableCellBase,
  verticalAlign: 'top',
  py: 1.5,
  bgcolor: 'rgba(0, 0, 0, 0.15)',
  borderBottom: '2px solid rgba(255, 215, 0, 0.55)',
}

type RowValueFieldProps = {
  value: number
  onCommit: (value: number) => void
}

function RowValueField({ value, onCommit }: RowValueFieldProps) {
  const [localValue, setLocalValue] = useState(String(value))

  useEffect(() => {
    setLocalValue(String(value))
  }, [value])

  const commitValue = () => {
    const parsed = parseClueValueInput(localValue)
    if (parsed === null) {
      setLocalValue(String(value))
      return
    }
    if (parsed !== value) {
      onCommit(parsed)
    }
  }

  return (
    <TextField
      value={localValue}
      onChange={(event) => setLocalValue(event.target.value)}
      onBlur={() => commitValue()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur()
        }
      }}
      size="small"
      fullWidth
      aria-label="Clue value"
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
          sx: { fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' },
        },
      }}
      sx={centeredFieldSx}
    />
  )
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

  const handleRowValueCommit = (rowIndex: number, value: number) => {
    setDraft((prev) => {
      if (!prev) {
        return prev
      }
      return setRowValueAndSort(prev, rowIndex, value)
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 6,
        }}
      >
        <CircularProgress color="secondary" aria-label="Loading board editor" />
        <Typography color="text.secondary">Loading board editor…</Typography>
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <ViewStateMessage
        title="Could not load board editor"
        message={loadError}
        hint="Ensure public/data/board.json is valid JSON with 6 categories and 5 clues per category. Restart the dev server if the file was added recently."
      />
    )
  }

  if (!draft) {
    return (
      <ViewStateMessage
        title="Board editor unavailable"
        message="No board data is loaded."
        severity="warning"
        hint="Restore public/data/board.json or copy the sample from the repository."
      />
    )
  }

  const rowValues = getRowValues(draft)
  const rowCount = rowValues.length

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" color="secondary" gutterBottom>
          Manage Game
        </Typography>
        <Typography color="text.secondary">
          Edit category titles, questions, answers, and row values. Rows reorder
          automatically to keep values increasing top to bottom.
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
        sx={{
          overflowX: 'auto',
          bgcolor: 'background.paper',
          border: '1px solid rgba(255, 215, 0, 0.45)',
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: 960,
            borderCollapse: 'collapse',
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={valueHeaderCellSx}>Value</TableCell>
              {draft.categories.map((category, categoryIndex) => (
                <TableCell key={category.id} sx={headerCategoryCellSx}>
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
                    sx={centeredFieldSx}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rowCount }, (_, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell sx={valueBodyCellSx}>
                  <RowValueField
                    value={rowValues[rowIndex]}
                    onCommit={(value) => handleRowValueCommit(rowIndex, value)}
                  />
                </TableCell>
                {draft.categories.map((category, categoryIndex) => {
                  const clue = category.clues[rowIndex]

                  return (
                    <TableCell key={clue.id} sx={bodyRowCellSx}>
                      <Stack spacing={1} sx={{ alignItems: 'center' }}>
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
                          sx={centeredFieldSx}
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
                          sx={centeredFieldSx}
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
