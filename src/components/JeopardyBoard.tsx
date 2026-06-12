import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import type { GameState } from '../types/game'

export type JeopardyBoardProps = {
  state: GameState
  onSelectClue: (clueId: string) => void
}

function formatValue(value: number): string {
  return `$${value.toLocaleString()}`
}

export default function JeopardyBoard({ state, onSelectClue }: JeopardyBoardProps) {
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down('md'))
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'))

  const { board, clueStates, currentSelectorIndex, activeClueId, config } = state
  const canSelect = activeClueId === null
  const selectorName = config.players[currentSelectorIndex]?.name ?? 'Player'

  const categoryCount = board.categories.length
  const minGridWidth = isNarrow ? 480 : isCompact ? 640 : undefined

  return (
    <Box>
      <Typography
        variant={isNarrow ? 'body2' : 'subtitle1'}
        color="secondary"
        sx={{ mb: 2 }}
      >
        {canSelect
          ? `${selectorName} — pick a clue`
          : 'Clue in progress — finish judging to return to the board'}
      </Typography>

      <Box
        sx={{
          overflowX: 'auto',
          pb: 1,
          mx: { xs: -1, sm: 0 },
          px: { xs: 1, sm: 0 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${categoryCount}, minmax(${isNarrow ? 72 : isCompact ? 88 : 100}px, 1fr))`,
            gap: isNarrow ? 0.5 : 1,
            minWidth: minGridWidth,
          }}
        >
          {board.categories.map((category) => (
            <Paper
              key={category.id}
              elevation={3}
              sx={{
                bgcolor: 'board.dark',
                p: isNarrow ? 0.5 : 1,
                textAlign: 'center',
                minHeight: isNarrow ? 44 : 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant={isNarrow ? 'caption' : 'subtitle2'}
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'board.contrastText',
                  lineHeight: 1.2,
                  fontSize: isNarrow ? '0.65rem' : undefined,
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
                    minHeight: isNarrow ? 48 : isCompact ? 56 : 64,
                    px: isNarrow ? 0.5 : 1,
                    bgcolor: isAnswered ? 'action.disabledBackground' : 'board.main',
                    color: isAnswered ? 'text.disabled' : 'board.contrastText',
                    fontSize: isNarrow ? '0.85rem' : isCompact ? '1rem' : '1.25rem',
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

      {isCompact ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Scroll horizontally to see all categories on small screens.
        </Typography>
      ) : null}
    </Box>
  )
}
