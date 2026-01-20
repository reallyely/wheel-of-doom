import { InfluenceAction } from '../influence/influence-action';
import { Selection } from './selection';

/**
 * Strategy interface for selection methods.
 * Different implementations can provide various ways to select from options
 * (e.g., spinning wheel, card draw, dice roll).
 *
 * This follows the Strategy pattern - the selection method can be swapped
 * without affecting the rest of the domain.
 */
export interface SelectionMethod<TState = unknown> {
  /**
   * Unique identifier for this selection method type.
   */
  readonly methodType: string;

  /**
   * Starts a new selection round.
   * @param roundId Unique identifier for the round
   * @param timestamp Current timestamp in milliseconds
   * @returns true if the round was started successfully
   */
  startRound(roundId: string, timestamp: number): boolean;

  /**
   * Applies an influence action to the current round.
   * @param action The influence action to apply
   * @returns true if the influence was applied successfully
   */
  applyInfluence(action: InfluenceAction): boolean;

  /**
   * Advances the simulation by the given time delta.
   * @param deltaTimeMs Time elapsed since last tick in milliseconds
   */
  tick(deltaTimeMs: number): void;

  /**
   * Checks if the selection method has completed its round.
   */
  isComplete(): boolean;

  /**
   * Resolves the current round and returns the selection result.
   * Should only be called when isComplete() returns true.
   * @param timestamp Current timestamp in milliseconds
   * @returns The selection result, or null if not complete
   */
  resolveRound(timestamp: number): Selection | null;

  /**
   * Resets the selection method to its initial state.
   */
  reset(): void;

  /**
   * Returns the current state for rendering/synchronization.
   * The state shape depends on the implementation.
   */
  getState(): TState;
}

/**
 * State snapshot for any selection method.
 * Used for rendering and synchronization.
 */
export interface SelectionMethodState {
  /** The type of selection method */
  readonly methodType: string;
  /** Current round ID, if any */
  readonly roundId: string | null;
  /** Whether a round is currently in progress */
  readonly isActive: boolean;
  /** Whether the round is complete */
  readonly isComplete: boolean;
  /** Progress percentage (0-100) for UI display */
  readonly progress: number;
}
