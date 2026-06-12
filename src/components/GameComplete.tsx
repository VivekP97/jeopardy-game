import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { getWinnerIndices } from '../game/board'
import type { GameState } from '../types/game'

export type GameCompleteProps = {
  state: GameState
  onNewGame: () => void
}

function formatScore(score: number): string {
  return `$${score.toLocaleString()}`
}

export default function GameComplete({ state, onNewGame }: GameCompleteProps) {
  const winnerIndices = getWinnerIndices(state)
  const winnerNames = winnerIndices.map(
    (index) => state.config.players[index]?.name ?? `Player ${index + 1}`,
  )

  const rankedPlayers = state.config.players
    .map((player, index) => ({
      player,
      score: state.scores[index],
      index,
    }))
    .sort((a, b) => b.score - a.score)

  const winnerLabel =
    winnerNames.length > 1
      ? `Winners: ${winnerNames.join(', ')}`
      : `Winner: ${winnerNames[0] ?? 'Unknown'}`

  return (
    <Paper sx={{ p: 4, maxWidth: 560 }}>
      <Typography variant="h4" color="secondary" gutterBottom>
        Game Complete
      </Typography>
      <Typography variant="h6" gutterBottom>
        {winnerLabel}
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 3, mb: 1 }}>
        Final standings
      </Typography>
      <List dense>
        {rankedPlayers.map(({ player, score, index }, rank) => {
          const isWinner = winnerIndices.includes(index)
          return (
            <ListItem
              key={player.id}
              sx={{
                bgcolor: isWinner ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                borderRadius: 1,
              }}
            >
              <ListItemText
                primary={`${rank + 1}. ${player.name}`}
                secondary={formatScore(score)}
                slotProps={{
                  primary: { sx: { fontWeight: isWinner ? 700 : 400 } },
                }}
              />
            </ListItem>
          )
        })}
      </List>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="secondary" onClick={onNewGame}>
          New Game
        </Button>
      </Box>
    </Paper>
  )
}
