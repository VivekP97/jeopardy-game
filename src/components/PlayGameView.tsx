import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { loadBoard } from '../data/loadBoard'
import type { Board } from '../types/game'

type LoadStatus = 'loading' | 'ready' | 'error'

export default function PlayGameView() {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    void loadBoard().then((result) => {
      if (cancelled) {
        return
      }

      if (result.ok) {
        setBoard(result.board)
        setStatus('ready')
        return
      }

      setError(result.error)
      setStatus('error')
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress color="secondary" aria-label="Loading board" />
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <Alert severity="error" sx={{ maxWidth: 640 }}>
        {error}
      </Alert>
    )
  }

  const clueCount = board!.categories.reduce(
    (total, category) => total + category.clues.length,
    0,
  )

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" color="secondary" gutterBottom>
        Play Game
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        Board loaded — {board!.categories.length} categories, {clueCount} clues.
        Game setup will appear here in a later phase.
      </Typography>
      <List dense sx={{ mt: 2 }}>
        {board!.categories.map((category) => (
          <ListItem key={category.id} disablePadding>
            <ListItemText primary={category.title} />
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}
