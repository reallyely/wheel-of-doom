import { InfluenceAction } from '../influence/influence-action';
import { WheelSlice } from './wheel-slice';

/**
 * Represents the outcome of a completed selection round.
 * Immutable value object containing all relevant data about the selection.
 */
export class Selection {
  readonly id: string;
  readonly roundId: string;
  readonly selectedSlice: WheelSlice;
  readonly finalAngle: number;
  readonly durationMs: number;
  readonly influences: readonly InfluenceAction[];
  readonly resolvedAt: number;

  constructor(
    id: string,
    roundId: string,
    selectedSlice: WheelSlice,
    finalAngle: number,
    durationMs: number,
    influences: readonly InfluenceAction[],
    resolvedAt: number
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Selection id cannot be empty');
    }
    if (!roundId || roundId.trim().length === 0) {
      throw new Error('Round id cannot be empty');
    }
    if (durationMs < 0) {
      throw new Error('Duration cannot be negative');
    }

    this.id = id;
    this.roundId = roundId;
    this.selectedSlice = selectedSlice;
    this.finalAngle = finalAngle;
    this.durationMs = durationMs;
    this.influences = Object.freeze([...influences]);
    this.resolvedAt = resolvedAt;
  }

  /**
   * Returns the duration in seconds.
   */
  get durationSeconds(): number {
    return this.durationMs / 1000;
  }

  /**
   * Returns the number of influence actions applied.
   */
  get totalInfluences(): number {
    return this.influences.length;
  }

  /**
   * Returns the number of unique participants who influenced.
   */
  get uniqueParticipantCount(): number {
    const participantIds = new Set(this.influences.map((i) => i.participantId));
    return participantIds.size;
  }

  /**
   * Calculates the net impulse applied during this selection.
   * Positive means the wheel was sped up overall, negative means slowed down.
   */
  get netImpulse(): number {
    return this.influences.reduce((sum, influence) => {
      return sum + influence.calculateImpulse();
    }, 0);
  }

  /**
   * Returns statistics about this selection.
   */
  getStats(): SelectionStats {
    return new SelectionStats(
      this.totalInfluences,
      this.uniqueParticipantCount,
      this.netImpulse,
      this.durationSeconds
    );
  }

  /**
   * Checks if this selection had any participant influence.
   */
  hadInfluence(): boolean {
    return this.influences.length > 0;
  }

  /**
   * Returns all influences from a specific participant.
   */
  getInfluencesByParticipant(participantId: string): readonly InfluenceAction[] {
    return this.influences.filter((i) => i.participantId === participantId);
  }
}

/**
 * Summary statistics for a selection round.
 */
export class SelectionStats {
  constructor(
    readonly totalInfluences: number,
    readonly uniqueParticipants: number,
    readonly netImpulse: number,
    readonly durationSeconds: number
  ) {}

  /**
   * Returns the average influences per participant.
   */
  get averageInfluencesPerParticipant(): number {
    if (this.uniqueParticipants === 0) {
      return 0;
    }
    return this.totalInfluences / this.uniqueParticipants;
  }

  /**
   * Checks if the selection was influenced towards speeding up.
   */
  get wasSpedUp(): boolean {
    return this.netImpulse > 0;
  }

  /**
   * Checks if the selection was influenced towards slowing down.
   */
  get wasSlowedDown(): boolean {
    return this.netImpulse < 0;
  }
}
