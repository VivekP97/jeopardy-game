import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import { loadBoard } from '../data/loadBoard'
import {
  buzz,
  createGame,
  judgeAnswer,
  openBuzz,
  selectClue,
} from '../game/engine'
import type { Board, Clue, GameConfig, GameState } from '../types/game'
import BuzzPanel from './BuzzPanel'
import CluePanel from './CluePanel'
import GameComplete from './GameComplete'
import GameSetupForm from './GameSetupForm'
import JeopardyBoard from './JeopardyBoard'
import Scoreboard from './Scoreboard'

type LoadStatus = 'loading' | 'ready' | 'error'

function findClue(board: Board, clueId: string): Clue | undefined {
  for (const category of board.categories) {
    const clue = category.clues.find((item) => item.id === clueId)
    if (clue) {
      return clue
    }
  }
  return undefined
}

export default function PlayGameView() {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState('')
  const [gameState, setGameState] = useState<GameState | null>(null)

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

  const handleStartGame = (config: GameConfig) => {
    if (!board) {
      return
    }
    setGameState(createGame(config, board))
  }

  const handleNewGame = () => {
    setGameState(null)
  }

  const handleSelectClue = (clueId: string) => {
    setGameState((prev) => (prev ? selectClue(prev, clueId) : prev))
  }

  const handleOpenBuzz = () => {
    setGameState((prev) => (prev ? openBuzz(prev) : prev))
  }

  const handleBuzz = (playerIndex: number) => {
    setGameState((prev) => (prev ? buzz(prev, playerIndex) : prev))
  }

  const handleJudge = (correct: boolean) => {
    setGameState((prev) => (prev ? judgeAnswer(prev, correct) : prev))
  }

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

  if (!board) {
    return null
  }

  if (!gameState) {
    return <GameSetupForm onStart={handleStartGame} />
  }

  if (gameState.phase === 'complete') {
    return <GameComplete state={gameState} onNewGame={handleNewGame} />
  }

  const activeClue =
    gameState.activeClueId !== null
      ? findClue(gameState.board, gameState.activeClueId)
      : undefined

  const buzzedPlayerName =
    gameState.buzzState.buzzedPlayerIndex !== null
      ? gameState.config.players[gameState.buzzState.buzzedPlayerIndex]?.name ?? null
      : null

  return (
    <Stack spacing={3}>
      <Scoreboard state={gameState} />

      {activeClue ? (
        <CluePanel
          clue={activeClue}
          buzzState={gameState.buzzState}
          buzzedPlayerName={buzzedPlayerName}
          onOpenBuzz={handleOpenBuzz}
          onJudge={handleJudge}
        />
      ) : (
        <JeopardyBoard state={gameState} onSelectClue={handleSelectClue} />
      )}

      <BuzzPanel state={gameState} onBuzz={handleBuzz} />
    </Stack>
  )
}
