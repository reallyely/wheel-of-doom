import { InfluenceAction } from '../influence/influence-action';
import { SelectionMethod } from './selection-method';
import { Selection } from './selection';
import { WheelConfig } from './wheel-config';
import { WheelSlice, SliceCollection, SliceGeometry } from './wheel-slice';
import {
  WheelState,
  canTransition,
  canApplyInfluence,
  canStart,
  isComplete,
} from './wheel-state';

/**
 * Observable state of the wheel for rendering and synchronization.
 */
export class WheelSnapshot {
  constructor(
    readonly state: WheelState,
    readonly theta: number,
    readonly omega: number,
    readonly roundId: string | null,
    readonly slices: readonly WheelSlice[],
    readonly selectedSliceId: string | null,
    readonly progress: number
  ) {}

  /**
   * Checks if the wheel is currently spinning.
   */
  get isSpinning(): boolean {
    return this.state === WheelState.Spinning || this.state === WheelState.Stopping;
  }

  /**
   * Checks if the wheel has stopped.
   */
  get isStopped(): boolean {
    return this.state === WheelState.Stopped;
  }

  /**
   * Checks if the wheel is idle.
   */
  get isIdle(): boolean {
    return this.state === WheelState.Idle;
  }
}

/**
 * Physics-based spinning wheel implementation of SelectionMethod.
 *
 * Features:
 * - Deterministic physics simulation
 * - Peg-pointer interaction for natural stopping
 * - Influence actions (speed up/slow down/brake)
 * - Configurable physics parameters
 *
 * @example
 * const wheel = new Wheel(slices);
 * wheel.startRound('round-1', Date.now());
 * wheel.tick(16); // 16ms elapsed
 * if (wheel.isComplete()) {
 *   const result = wheel.resolveRound(Date.now());
 * }
 */
export class Wheel implements SelectionMethod<WheelSnapshot> {
  readonly methodType = 'WHEEL';

  private readonly config: WheelConfig;
  private readonly sliceCollection: SliceCollection;

  private state: WheelState = WheelState.Idle;
  private theta: number = 0;
  private omega: number = 0;
  private roundId: string | null = null;
  private roundStartTime: number = 0;
  private influences: InfluenceAction[] = [];
  private peakOmega: number = 0;

  constructor(
    slices: readonly WheelSlice[],
    config: WheelConfig = WheelConfig.createDefault()
  ) {
    if (slices.length < 2) {
      throw new Error('Wheel requires at least 2 slices');
    }

    this.sliceCollection = new SliceCollection(slices);
    this.config = config;
  }

  /**
   * Starts a new spin round.
   */
  startRound(roundId: string, timestamp: number): boolean {
    if (!canStart(this.state)) {
      return false;
    }

    if (!roundId || roundId.trim().length === 0) {
      return false;
    }

    this.roundId = roundId;
    this.roundStartTime = timestamp;
    this.influences = [];
    this.omega = this.config.initialSpinImpulse / this.config.momentOfInertia;
    this.peakOmega = this.omega;
    this.transitionTo(WheelState.Spinning);

    return true;
  }

  /**
   * Applies an influence action to the wheel.
   */
  applyInfluence(action: InfluenceAction): boolean {
    if (!canApplyInfluence(this.state)) {
      return false;
    }

    if (action.roundId !== this.roundId) {
      return false;
    }

    const impulse = action.calculateImpulse();
    this.omega += impulse / this.config.momentOfInertia;
    this.influences.push(action);

    if (Math.abs(this.omega) > Math.abs(this.peakOmega)) {
      this.peakOmega = this.omega;
    }

    if (this.state === WheelState.Stopping && this.omega > this.peakOmega * 0.5) {
      this.transitionTo(WheelState.Spinning);
    }

    return true;
  }

  /**
   * Advances the physics simulation.
   */
  tick(deltaTimeMs: number): void {
    if (this.state === WheelState.Idle || this.state === WheelState.Stopped) {
      return;
    }

    const dt = deltaTimeMs / 1000;
    const torque = this.computeTorque();
    const alpha = torque / this.config.momentOfInertia;

    this.omega += alpha * dt;
    this.theta += this.omega * dt;
    this.theta = this.normalizeAngle(this.theta);

    this.updateState();
  }

  /**
   * Checks if the wheel has stopped.
   */
  isComplete(): boolean {
    return isComplete(this.state);
  }

  /**
   * Resolves the round and returns the selection result.
   */
  resolveRound(timestamp: number): Selection | null {
    if (!this.isComplete() || !this.roundId) {
      return null;
    }

    const selectedSlice = this.getSelectedSlice();
    if (!selectedSlice) {
      return null;
    }

    const durationMs = timestamp - this.roundStartTime;

    return new Selection(
      this.generateId(),
      this.roundId,
      selectedSlice,
      this.theta,
      durationMs,
      this.influences,
      timestamp
    );
  }

  /**
   * Resets the wheel to idle state.
   */
  reset(): void {
    this.state = WheelState.Idle;
    this.theta = 0;
    this.omega = 0;
    this.roundId = null;
    this.roundStartTime = 0;
    this.influences = [];
    this.peakOmega = 0;
  }

  /**
   * Returns the current wheel state for rendering.
   */
  getState(): WheelSnapshot {
    return new WheelSnapshot(
      this.state,
      this.theta,
      this.omega,
      this.roundId,
      this.sliceCollection.getSlices(),
      this.getSelectedSlice()?.id ?? null,
      this.computeProgress()
    );
  }

  /**
   * Returns the slice geometry for rendering.
   */
  getSliceGeometry(): readonly SliceGeometry[] {
    return this.sliceCollection.getGeometries();
  }

  /**
   * Returns the slice collection.
   */
  getSliceCollection(): SliceCollection {
    return this.sliceCollection;
  }

  /**
   * Returns the current angular velocity.
   */
  getAngularVelocity(): number {
    return this.omega;
  }

  /**
   * Returns the current rotation angle.
   */
  getRotationAngle(): number {
    return this.theta;
  }

  // ============ Private Methods ============

  private computeTorque(): number {
    let torque = -this.config.baseDamping * this.omega;

    for (const pegAngle of this.sliceCollection.getPegAngles()) {
      torque += this.computePegTorque(pegAngle);
    }

    return torque;
  }

  private computePegTorque(pegAngle: number): number {
    const pegWorld = this.normalizeAngle(this.theta + pegAngle);
    const diff = this.angleDifference(pegWorld, this.config.pointerAngle);

    const isApproaching =
      (this.omega > 0 && diff < 0 && diff > -this.config.contactWindow) ||
      (this.omega < 0 && diff > 0 && diff < this.config.contactWindow);

    if (!isApproaching) {
      return 0;
    }

    const penetration = Math.abs(diff);
    const direction = Math.sign(this.omega);

    const springForce = -direction * this.config.pointerStiffness * penetration;
    const dampingForce = -direction * this.config.pointerDamping * Math.abs(this.omega);

    return springForce + dampingForce;
  }

  private updateState(): void {
    const absOmega = Math.abs(this.omega);

    if (this.state === WheelState.Spinning) {
      if (absOmega < Math.abs(this.peakOmega) * 0.3) {
        this.transitionTo(WheelState.Stopping);
      }
    } else if (this.state === WheelState.Stopping) {
      if (absOmega < this.config.velocityThreshold) {
        this.omega = 0;
        this.transitionTo(WheelState.Stopped);
      }
    }
  }

  private transitionTo(newState: WheelState): void {
    if (canTransition(this.state, newState)) {
      this.state = newState;
    }
  }

  private getSelectedSlice(): WheelSlice | null {
    const effectiveAngle = this.normalizeAngle(this.config.pointerAngle - this.theta);
    return this.sliceCollection.findSliceAtAngle(effectiveAngle);
  }

  private computeProgress(): number {
    if (this.state === WheelState.Idle) {
      return 0;
    }
    if (this.state === WheelState.Stopped) {
      return 100;
    }

    const velocityRatio = Math.abs(this.omega) / Math.abs(this.peakOmega);
    return Math.round((1 - velocityRatio) * 100);
  }

  private normalizeAngle(angle: number): number {
    const TWO_PI = Math.PI * 2;
    let normalized = angle % TWO_PI;
    if (normalized < 0) {
      normalized += TWO_PI;
    }
    return normalized;
  }

  private angleDifference(a: number, b: number): number {
    let diff = a - b;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  private generateId(): string {
    return `sel_${this.roundStartTime}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
