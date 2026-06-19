import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { GameState } from '../types/game'

export type BuzzPanelProps = {
  state: GameState
  onBuzz: (playerIndex: number) => void
}

function canPlayerBuzz(state: GameState, playerIndex: number): boolean {
  const { buzzState, activeClueId } = state
  if (activeClueId === null || buzzState.status !== 'open') {
    return false
  }
  if (buzzState.attemptedPlayerIndices.includes(playerIndex)) {
    return false
  }
  return true
}

export default function BuzzPanel({ state, onBuzz }: BuzzPanelProps) {
  const { config, buzzState, activeClueId } = state
  const hasActiveClue = activeClueId !== null

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Buzzers
        {buzzState.isSteal ? (
          <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
            — Steal round!
          </Typography>
        ) : null}
      </Typography>

      {!hasActiveClue ? (
        <Typography color="text.secondary" variant="body2">
          Select a clue to enable buzzers.
        </Typography>
      ) : buzzState.status === 'buzzed' ? (
        <Typography color="text.secondary" variant="body2">
          Waiting for host to judge the answer.
        </Typography>
      ) : (
        <Typography color="text.secondary" variant="body2">
          Host: select the player who buzzed in.
        </Typography>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        useFlexGap
        sx={{ mt: 2, flexWrap: 'wrap' }}
      >
        {config.players.map((player, index) => {
          const canBuzz = canPlayerBuzz(state, index)
          const hasAttempted = buzzState.attemptedPlayerIndices.includes(index)
          const isBuzzedIn = buzzState.buzzedPlayerIndex === index

          return (
            <Button
              key={player.id}
              variant="contained"
              size="large"
              disabled={!canBuzz}
              onClick={() => onBuzz(index)}
              aria-label={`Buzz — ${player.name}`}
              sx={{
                flex: { sm: '1 1 0' },
                minWidth: 140,
                py: 2,
                fontWeight: 700,
                bgcolor: isBuzzedIn ? 'secondary.main' : 'primary.light',
                color: isBuzzedIn ? 'secondary.contrastText' : 'primary.contrastText',
                '&:hover': {
                  bgcolor: isBuzzedIn ? 'secondary.dark' : 'primary.main',
                },
                '&.Mui-disabled': {
                  bgcolor: hasAttempted ? 'rgba(0, 0, 0, 0.3)' : undefined,
                },
              }}
            >
              {player.name}
              {hasAttempted && !isBuzzedIn ? ' (missed)' : ''}
            </Button>
          )
        })}
      </Stack>

      {hasActiveClue && buzzState.status === 'open' ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Tap a player when they buzz in live.
          </Typography>
        </Box>
      ) : null}
    </Paper>
  )
}
