import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { BuzzState, Clue } from '../types/game'

export type CluePanelProps = {
  clue: Clue
  buzzState: BuzzState
  buzzedPlayerName: string | null
  onOpenBuzz: () => void
  onJudge: (correct: boolean) => void
}

function formatValue(value: number): string {
  return `$${value.toLocaleString()}`
}

export default function CluePanel({
  clue,
  buzzState,
  buzzedPlayerName,
  onOpenBuzz,
  onJudge,
}: CluePanelProps) {
  const [answerRevealed, setAnswerRevealed] = useState(false)

  useEffect(() => {
    setAnswerRevealed(false)
  }, [clue.id])

  const canOpenBuzz = buzzState.status === 'idle'
  const canJudge = buzzState.status === 'buzzed' && buzzedPlayerName !== null

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5" color="secondary">
            {formatValue(clue.value)}
          </Typography>
          {buzzState.isSteal ? (
            <Chip label="Steal!" color="warning" size="small" />
          ) : null}
          {buzzState.status === 'open' ? (
            <Chip label="Buzzers open" color="success" size="small" variant="outlined" />
          ) : null}
          {buzzState.status === 'buzzed' && buzzedPlayerName ? (
            <Chip label={`${buzzedPlayerName} buzzed in`} color="info" size="small" />
          ) : null}
        </Box>

        <Typography variant="h6" component="p">
          {clue.question}
        </Typography>

        {answerRevealed ? (
          <Box
            sx={{
              p: 2,
              bgcolor: 'rgba(255, 215, 0, 0.1)',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'secondary.dark',
            }}
          >
            <Typography variant="overline" color="text.secondary">
              Answer
            </Typography>
            <Typography variant="body1">{clue.answer}</Typography>
          </Box>
        ) : (
          <Button variant="outlined" color="secondary" onClick={() => setAnswerRevealed(true)}>
            Reveal answer
          </Button>
        )}

        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={onOpenBuzz}
            disabled={!canOpenBuzz}
          >
            Open buzzers
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => onJudge(true)}
            disabled={!canJudge}
          >
            Correct
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => onJudge(false)}
            disabled={!canJudge}
          >
            Incorrect
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
