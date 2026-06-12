import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { GameState } from '../types/game'

export type ScoreboardProps = {
  state: GameState
}

function formatScore(score: number): string {
  return `$${score.toLocaleString()}`
}

export default function Scoreboard({ state }: ScoreboardProps) {
  const { config, scores, currentSelectorIndex, buzzState } = state
  const buzzedPlayerIndex = buzzState.buzzedPlayerIndex

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        useFlexGap
        sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {config.players.map((player, index) => {
          const isSelector = index === currentSelectorIndex
          const isBuzzed = index === buzzedPlayerIndex

          return (
            <Box
              key={player.id}
              sx={{
                flex: { sm: '1 1 0' },
                minWidth: 120,
                p: 2,
                textAlign: 'center',
                borderRadius: 1,
                border: '2px solid',
                borderColor: isSelector
                  ? 'secondary.main'
                  : isBuzzed
                    ? 'info.main'
                    : 'transparent',
                bgcolor: isSelector ? 'rgba(255, 215, 0, 0.08)' : 'transparent',
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: isSelector ? 700 : 500 }}
              >
                {player.name}
              </Typography>
              <Typography variant="h6" color="secondary">
                {formatScore(scores[index])}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, justifyContent: 'center' }}>
                {isSelector ? (
                  <Chip label="Selector" size="small" color="secondary" variant="outlined" />
                ) : null}
                {isBuzzed ? (
                  <Chip label="Buzzed in" size="small" color="info" variant="outlined" />
                ) : null}
              </Stack>
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}
