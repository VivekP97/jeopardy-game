import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { GameConfig, Player } from '../types/game'

const MIN_PLAYERS = 3
const MAX_PLAYERS = 5

export type GameSetupFormProps = {
  onStart: (config: GameConfig) => void
  savedGameAt?: string | null
  savedGameError?: string
  onContinueSavedGame?: () => void
  onAbandonSave?: () => void
  isContinuing?: boolean
  isAbandoning?: boolean
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return date.toLocaleString()
}

function defaultNames(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `Player ${index + 1}`)
}

export default function GameSetupForm({
  onStart,
  savedGameAt = null,
  savedGameError = '',
  onContinueSavedGame,
  onAbandonSave,
  isContinuing = false,
  isAbandoning = false,
}: GameSetupFormProps) {
  const [playerCount, setPlayerCount] = useState(MIN_PLAYERS)
  const [names, setNames] = useState(defaultNames(MIN_PLAYERS))
  const [error, setError] = useState('')

  const handleCountChange = (count: number) => {
    setPlayerCount(count)
    setNames((prev) => {
      if (count > prev.length) {
        return [
          ...prev,
          ...Array.from(
            { length: count - prev.length },
            (_, index) => `Player ${prev.length + index + 1}`,
          ),
        ]
      }
      return prev.slice(0, count)
    })
    setError('')
  }

  const handleNameChange = (index: number, value: string) => {
    setNames((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
    setError('')
  }

  const handleStart = () => {
    const trimmed = names.map((name) => name.trim())
    if (trimmed.some((name) => name.length === 0)) {
      setError('Every player needs a name.')
      return
    }

    const players: Player[] = trimmed.map((name, index) => ({
      id: `p${index + 1}`,
      name,
    }))

    onStart({ players })
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      {savedGameAt && onContinueSavedGame ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" color="secondary" gutterBottom>
            Continue Saved Game
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Saved {formatSavedAt(savedGameAt)}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="secondary"
              onClick={onContinueSavedGame}
              disabled={isContinuing || isAbandoning}
            >
              {isContinuing ? 'Loading…' : 'Continue saved game'}
            </Button>
            {onAbandonSave ? (
              <Button
                variant="outlined"
                color="secondary"
                onClick={onAbandonSave}
                disabled={isContinuing || isAbandoning}
              >
                {isAbandoning ? 'Clearing…' : 'Abandon save'}
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : null}

      {savedGameError ? (
        <Alert severity="warning">{savedGameError}</Alert>
      ) : null}

      <Paper sx={{ p: 4 }}>
      <Typography variant="h4" color="secondary" gutterBottom>
        New Game
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Choose 3–5 players and enter their names.
      </Typography>

      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel id="player-count-label">Number of players</InputLabel>
          <Select
            labelId="player-count-label"
            label="Number of players"
            value={playerCount}
            onChange={(event) => handleCountChange(Number(event.target.value))}
          >
            {Array.from(
              { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
              (_, index) => MIN_PLAYERS + index,
            ).map((count) => (
              <MenuItem key={count} value={count}>
                {count} players
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {names.map((name, index) => (
          <TextField
            key={index}
            label={`Player ${index + 1}`}
            value={name}
            onChange={(event) => handleNameChange(index, event.target.value)}
            fullWidth
            error={error.length > 0 && name.trim().length === 0}
          />
        ))}

        {error ? (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        ) : null}

        <Box>
          <Button variant="contained" color="secondary" size="large" onClick={handleStart}>
            Start Game
          </Button>
        </Box>
      </Stack>
      </Paper>
    </Stack>
  )
}
