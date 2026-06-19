import {
  buzz,
  judgeAnswer,
  selectClue,
} from '../../game/engine'
import type { GameState } from '../../types/game'

export function playThroughClue(
  state: GameState,
  options: { clueId: string; buzzer: number; correct: boolean },
): GameState {
  let next =
    state.activeClueId === options.clueId
      ? state
      : selectClue(state, options.clueId)
  next = buzz(next, options.buzzer)
  next = judgeAnswer(next, options.correct)
  return next
}
