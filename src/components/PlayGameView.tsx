import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { loadBoard } from '../data/loadBoard'
import {
  gameStateToSavedPayload,
  loadSavedGameFile,
  saveSavedGameFile,
} from '../data/savedGame'
import {
  buzz,
  createGame,
  judgeAnswer,
  openBuzz,
  resumeGameFromSave,
  selectClue,
} from '../game/engine'
import type { Board, Clue, GameConfig, GameState } from '../types/game'
import BuzzPanel from './BuzzPanel'
import CluePanel from './CluePanel'
import GameComplete from './GameComplete'
import GameSetupForm from './GameSetupForm'
import JeopardyBoard from './JeopardyBoard'
import Scoreboard from './Scoreboard'
import ViewStateMessage from './ViewStateMessage'

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

export type PlayGameViewProps = {
  boardRevision?: number
}

export default function PlayGameView({ boardRevision = 0 }: PlayGameViewProps) {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState('')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [savedGameAt, setSavedGameAt] = useState<string | null>(null)
  const [savedGameError, setSavedGameError] = useState('')
  const [saveActionError, setSaveActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isContinuing, setIsContinuing] = useState(false)
  const [isAbandoning, setIsAbandoning] = useState(false)

  useEffect(() => {
    let cancelled = false

    void loadBoard().then((result) => {
      if (cancelled) {
        return
      }

      if (result.ok) {
        setBoard(result.board)
        setError('')
        setStatus('ready')
        return
      }

      setBoard(null)
      setError(result.error)
      setStatus('error')
    })

    return () => {
      cancelled = true
    }
  }, [boardRevision])

  useEffect(() => {
    if (status !== 'ready') {
      return
    }

    let cancelled = false

    void loadSavedGameFile().then((result) => {
      if (cancelled) {
        return
      }

      if (result.ok) {
        setSavedGameAt(result.savedGame?.savedAt ?? null)
        setSavedGameError('')
        return
      }

      setSavedGameAt(null)
      setSavedGameError(result.error)
    })

    return () => {
      cancelled = true
    }
  }, [status, boardRevision, gameState])

  const handleStartGame = (config: GameConfig) => {
    if (!board) {
      return
    }
    setSaveActionError('')
    setGameState(createGame(config, board))
  }

  const handleNewGame = () => {
    setSaveActionError('')
    setGameState(null)
  }

  const handleContinueSavedGame = async () => {
    setIsContinuing(true)
    setSaveActionError('')

    const result = await loadSavedGameFile()
    if (!result.ok) {
      setSavedGameError(result.error)
      setIsContinuing(false)
      return
    }

    if (!result.savedGame) {
      setSavedGameError('No saved game found.')
      setSavedGameAt(null)
      setIsContinuing(false)
      return
    }

    setGameState(resumeGameFromSave(result.savedGame))
    setSavedGameError('')
    setIsContinuing(false)
  }

  const handleAbandonSave = async () => {
    setIsAbandoning(true)
    setSaveActionError('')

    const result = await saveSavedGameFile(null)
    if (!result.ok) {
      setSaveActionError(result.error)
      setIsAbandoning(false)
      return
    }

    setSavedGameAt(null)
    setSavedGameError('')
    setIsAbandoning(false)
  }

  const handleSaveAndMenu = async () => {
    if (!gameState) {
      return
    }

    setIsSaving(true)
    setSaveActionError('')

    const payload = gameStateToSavedPayload(gameState)
    const result = await saveSavedGameFile(payload)

    if (!result.ok) {
      setSaveActionError(result.error)
      setIsSaving(false)
      return
    }

    setSavedGameAt(payload.savedAt)
    setGameState(null)
    setIsSaving(false)
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 6,
        }}
      >
        <CircularProgress color="secondary" aria-label="Loading board" />
        <Typography color="text.secondary">Loading game board…</Typography>
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <ViewStateMessage
        title="Could not load board"
        message={error}
        hint="Check that public/data/board.json exists and has 6 categories with 5 clues each. You can fix it in Manage Game or edit the file directly while the dev server is running."
      />
    )
  }

  if (!board) {
    return (
      <ViewStateMessage
        title="No board available"
        message="The game board could not be loaded."
        severity="warning"
        hint="Use Manage Game to create a valid board, or restore public/data/board.json from the repository."
      />
    )
  }

  if (!gameState) {
    return (
      <GameSetupForm
        onStart={handleStartGame}
        savedGameAt={savedGameAt}
        savedGameError={savedGameError}
        onContinueSavedGame={savedGameAt ? handleContinueSavedGame : undefined}
        onAbandonSave={savedGameAt ? handleAbandonSave : undefined}
        isContinuing={isContinuing}
        isAbandoning={isAbandoning}
      />
    )
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
      ? gameState.config.players[gameState.buzzState.buzzedPlayerIndex]?.name ??
        null
      : null

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Scoreboard state={gameState} />
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => void handleSaveAndMenu()}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save & menu'}
        </Button>
      </Box>

      {saveActionError ? (
        <Alert severity="error" onClose={() => setSaveActionError('')}>
          {saveActionError}
        </Alert>
      ) : null}

      {activeClue ? (
        <CluePanel
          key={activeClue.id}
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
