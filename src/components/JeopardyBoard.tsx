import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { GameState } from '../types/game'

export type JeopardyBoardProps = {
  state: GameState
  onSelectClue: (clueId: string) => void
}

function formatValue(value: number): string {
  return `$${value.toLocaleString()}`
}

export default function JeopardyBoard({ state, onSelectClue }: JeopardyBoardProps) {
  const { board, clueStates, currentSelectorIndex, activeClueId, config } = state
  const canSelect = activeClueId === null
  const selectorName = config.players[currentSelectorIndex]?.name ?? 'Player'

  return (
    <Box>
      <Typography variant="subtitle1" color="secondary" sx={{ mb: 2 }}>
        {canSelect
          ? `${selectorName} — pick a clue`
          : 'Clue in progress — finish judging to return to the board'}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${board.categories.length}, 1fr)`,
          gap: 1,
        }}
      >
        {board.categories.map((category) => (
          <Paper
            key={category.id}
            elevation={3}
            sx={{
              bgcolor: 'board.dark',
              p: 1,
              textAlign: 'center',
              minHeight: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'board.contrastText',
                lineHeight: 1.2,
              }}
            >
              {category.title}
            </Typography>
          </Paper>
        ))}

        {board.categories[0]?.clues.map((_, rowIndex) =>
          board.categories.map((category) => {
            const clue = category.clues[rowIndex]
            const isAnswered = clueStates[clue.id] === 'answered'
            const isSelectable = canSelect && !isAnswered

            return (
              <Button
                key={clue.id}
                variant="contained"
                disabled={!isSelectable}
                onClick={() => onSelectClue(clue.id)}
                sx={{
                  minHeight: 64,
                  bgcolor: isAnswered ? 'action.disabledBackground' : 'board.main',
                  color: isAnswered ? 'text.disabled' : 'board.contrastText',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  '&:hover': {
                    bgcolor: isAnswered ? 'action.disabledBackground' : 'board.light',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                    color: 'text.disabled',
                  },
                }}
              >
                {isAnswered ? '' : formatValue(clue.value)}
              </Button>
            )
          }),
        )}
      </Box>
    </Box>
  )
}
