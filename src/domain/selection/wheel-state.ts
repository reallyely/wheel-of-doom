/**
 * Wheel lifecycle states following the State pattern.
 * Each state defines valid transitions and allowed operations.
 */
export enum WheelState {
  /** Wheel is idle, ready to be spun */
  Idle = 'IDLE',
  /** Wheel is actively spinning, influence allowed */
  Spinning = 'SPINNING',
  /** Wheel is decelerating, influence still allowed */
  Stopping = 'STOPPING',
  /** Wheel has stopped, outcome determined */
  Stopped = 'STOPPED',
}

/**
 * Valid state transitions for the wheel.
 * Enforces the state machine invariants.
 */
const STATE_TRANSITIONS: Record<WheelState, WheelState[]> = {
  [WheelState.Idle]: [WheelState.Spinning],
  [WheelState.Spinning]: [WheelState.Stopping],
  [WheelState.Stopping]: [WheelState.Stopped, WheelState.Spinning],
  [WheelState.Stopped]: [WheelState.Idle],
};

/**
 * Checks if a state transition is valid.
 */
export function canTransition(from: WheelState, to: WheelState): boolean {
  return STATE_TRANSITIONS[from].includes(to);
}

/**
 * Returns the list of valid next states from the current state.
 */
export function getValidTransitions(state: WheelState): WheelState[] {
  return [...STATE_TRANSITIONS[state]];
}

/**
 * Checks if influence actions are allowed in the given state.
 */
export function canApplyInfluence(state: WheelState): boolean {
  return state === WheelState.Spinning || state === WheelState.Stopping;
}

/**
 * Checks if the wheel can be started from the given state.
 */
export function canStart(state: WheelState): boolean {
  return state === WheelState.Idle;
}

/**
 * Checks if the wheel has completed its spin cycle.
 */
export function isComplete(state: WheelState): boolean {
  return state === WheelState.Stopped;
}
