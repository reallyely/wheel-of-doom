/**
 * Types of influence a participant can apply to the wheel.
 */
export enum InfluenceType {
  /** Apply positive torque to speed up the wheel */
  SpeedUp = 'SPEED_UP',
  /** Apply negative torque to slow down the wheel */
  SlowDown = 'SLOW_DOWN',
  /** Apply strong braking force */
  Brake = 'BRAKE',
}

/**
 * Default impulse magnitudes for each influence type.
 */
const DEFAULT_MAGNITUDES: Record<InfluenceType, number> = {
  [InfluenceType.SpeedUp]: 4,
  [InfluenceType.SlowDown]: 2,
  [InfluenceType.Brake]: 6,
};

/**
 * Command pattern implementation for participant influence actions.
 * Immutable value object that captures the intent, magnitude, and context
 * of a user's influence on the wheel.
 *
 * Commands can be stored for replay, analytics, and undo functionality.
 */
export class InfluenceAction {
  readonly id: string;
  readonly participantId: string;
  readonly type: InfluenceType;
  readonly magnitude: number;
  readonly timestamp: number;
  readonly roundId: string;

  constructor(
    id: string,
    participantId: string,
    type: InfluenceType,
    roundId: string,
    timestamp: number,
    magnitude?: number
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Action id cannot be empty');
    }
    if (!participantId || participantId.trim().length === 0) {
      throw new Error('Participant id cannot be empty');
    }
    if (!roundId || roundId.trim().length === 0) {
      throw new Error('Round id cannot be empty');
    }
    if (timestamp <= 0) {
      throw new Error('Timestamp must be positive');
    }

    const effectiveMagnitude = magnitude ?? DEFAULT_MAGNITUDES[type];
    if (effectiveMagnitude <= 0) {
      throw new Error('Magnitude must be positive');
    }

    this.id = id;
    this.participantId = participantId;
    this.type = type;
    this.magnitude = effectiveMagnitude;
    this.timestamp = timestamp;
    this.roundId = roundId;
  }

  /**
   * Calculates the torque impulse to apply based on this action.
   * Returns a signed value: positive for speed up, negative for slow down/brake.
   */
  calculateImpulse(): number {
    switch (this.type) {
      case InfluenceType.SpeedUp:
        return this.magnitude;
      case InfluenceType.SlowDown:
        return -this.magnitude;
      case InfluenceType.Brake:
        return -this.magnitude;
      default:
        return 0;
    }
  }

  /**
   * Checks if this action speeds up the wheel.
   */
  isSpeedUp(): boolean {
    return this.type === InfluenceType.SpeedUp;
  }

  /**
   * Checks if this action slows down the wheel.
   */
  isSlowDown(): boolean {
    return this.type === InfluenceType.SlowDown || this.type === InfluenceType.Brake;
  }

  /**
   * Checks equality based on id.
   */
  equals(other: InfluenceAction): boolean {
    return this.id === other.id;
  }

  /**
   * Type guard to check if an object is a valid InfluenceAction.
   */
  static isInfluenceAction(obj: unknown): obj is InfluenceAction {
    return obj instanceof InfluenceAction;
  }

  /**
   * Creates a SpeedUp action with default magnitude.
   */
  static speedUp(
    id: string,
    participantId: string,
    roundId: string,
    timestamp: number
  ): InfluenceAction {
    return new InfluenceAction(id, participantId, InfluenceType.SpeedUp, roundId, timestamp);
  }

  /**
   * Creates a SlowDown action with default magnitude.
   */
  static slowDown(
    id: string,
    participantId: string,
    roundId: string,
    timestamp: number
  ): InfluenceAction {
    return new InfluenceAction(id, participantId, InfluenceType.SlowDown, roundId, timestamp);
  }

  /**
   * Creates a Brake action with default magnitude.
   */
  static brake(
    id: string,
    participantId: string,
    roundId: string,
    timestamp: number
  ): InfluenceAction {
    return new InfluenceAction(id, participantId, InfluenceType.Brake, roundId, timestamp);
  }
}
