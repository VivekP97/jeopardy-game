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

export type SavedGamePreview = {
  savedAt: string
  players: Player[]
  scores: number[]
}

export type GameSetupFormProps = {
  onStart: (config: GameConfig) => void
  savedGamePreview?: SavedGamePreview | null
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
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatScore(score: number): string {
  return `$${score.toLocaleString()}`
}

function defaultNames(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `Player ${index + 1}`)
}

export default function GameSetupForm({
  onStart,
  savedGamePreview = null,
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
    <Stack spacing={3}>
      {savedGameError ? (
        <Alert severity="warning">{savedGameError}</Alert>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        <Paper sx={{ p: 4, flex: 1, minWidth: 0, maxWidth: { md: 480 } }}>
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

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box>
              <Button variant="contained" color="secondary" size="large" onClick={handleStart}>
                Start Game
              </Button>
            </Box>
          </Stack>
        </Paper>

        {savedGamePreview && onContinueSavedGame ? (
          <Paper
            sx={{
              p: 4,
              flex: 1,
              minWidth: 0,
              maxWidth: { md: 480 },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h4" color="secondary" gutterBottom>
              Continue Saved Game
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Saved {formatSavedAt(savedGamePreview.savedAt)}
            </Typography>

            <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
              {savedGamePreview.players.map((player, index) => (
                <Box
                  key={player.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 2,
                    py: 1,
                    px: 1.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <Typography variant="subtitle1">{player.name}</Typography>
                  <Typography variant="subtitle1" color="secondary">
                    {formatScore(savedGamePreview.scores[index] ?? 0)}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
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
      </Box>
    </Stack>
  )
}
