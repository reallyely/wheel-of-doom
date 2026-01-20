import { describe, it, expect, beforeEach } from 'vitest';
import { Wheel, WheelSnapshot } from '../wheel';
import { WheelSlice } from '../wheel-slice';
import { WheelConfig } from '../wheel-config';
import { WheelState } from '../wheel-state';
import { InfluenceAction, InfluenceType } from '../../influence/influence-action';

describe('Wheel', () => {
  const createSlices = (count: number): WheelSlice[] => {
    return Array.from({ length: count }, (_, i) => new WheelSlice(`slice-${i + 1}`, `Option ${i + 1}`));
  };

  let slices: WheelSlice[];
  let wheel: Wheel;

  beforeEach(() => {
    slices = createSlices(4);
    wheel = new Wheel(slices);
  });

  describe('constructor', () => {
    it('should create a wheel with valid slices', () => {
      expect(wheel.methodType).toBe('WHEEL');
      expect(wheel.getSliceCollection().count).toBe(4);
    });

    it('should throw error for less than 2 slices', () => {
      expect(() => new Wheel([new WheelSlice('1', 'A')])).toThrow('Wheel requires at least 2 slices');
    });

    it('should throw error for empty slices', () => {
      expect(() => new Wheel([])).toThrow('Wheel requires at least 2 slices');
    });

    it('should accept custom config', () => {
      const config = WheelConfig.builder().withBaseDamping(0.5).build();
      const customWheel = new Wheel(slices, config);

      expect(customWheel).toBeDefined();
    });
  });

  describe('getState', () => {
    it('should return initial idle state', () => {
      const state = wheel.getState();

      expect(state).toBeInstanceOf(WheelSnapshot);
      expect(state.state).toBe(WheelState.Idle);
      expect(state.theta).toBe(0);
      expect(state.omega).toBe(0);
      expect(state.roundId).toBeNull();
      expect(state.progress).toBe(0);
    });

    it('should return spinning state after start', () => {
      wheel.startRound('round-1', 1000);
      const state = wheel.getState();

      expect(state.state).toBe(WheelState.Spinning);
      expect(state.omega).toBeGreaterThan(0);
      expect(state.roundId).toBe('round-1');
    });
  });

  describe('startRound', () => {
    it('should start a round from idle state', () => {
      const result = wheel.startRound('round-1', 1000);

      expect(result).toBe(true);
      expect(wheel.getState().state).toBe(WheelState.Spinning);
    });

    it('should set initial angular velocity', () => {
      wheel.startRound('round-1', 1000);

      expect(wheel.getAngularVelocity()).toBeGreaterThan(0);
    });

    it('should return false for empty roundId', () => {
      const result = wheel.startRound('', 1000);

      expect(result).toBe(false);
      expect(wheel.getState().state).toBe(WheelState.Idle);
    });

    it('should return false for whitespace roundId', () => {
      const result = wheel.startRound('   ', 1000);

      expect(result).toBe(false);
    });

    it('should return false when already spinning', () => {
      wheel.startRound('round-1', 1000);
      const result = wheel.startRound('round-2', 2000);

      expect(result).toBe(false);
    });
  });

  describe('tick', () => {
    it('should not change state when idle', () => {
      wheel.tick(16);

      expect(wheel.getState().state).toBe(WheelState.Idle);
      expect(wheel.getRotationAngle()).toBe(0);
    });

    it('should advance rotation when spinning', () => {
      wheel.startRound('round-1', 1000);
      const initialOmega = wheel.getAngularVelocity();

      wheel.tick(100);

      expect(wheel.getRotationAngle()).toBeGreaterThan(0);
      // Velocity should decrease due to damping
      expect(wheel.getAngularVelocity()).toBeLessThan(initialOmega);
    });

    it('should eventually stop the wheel', () => {
      wheel.startRound('round-1', 1000);

      // Simulate many ticks
      for (let i = 0; i < 10000; i++) {
        wheel.tick(16);
        if (wheel.isComplete()) break;
      }

      expect(wheel.isComplete()).toBe(true);
      expect(wheel.getState().state).toBe(WheelState.Stopped);
    });

    it('should transition through Stopping state', () => {
      wheel.startRound('round-1', 1000);

      let sawStopping = false;
      for (let i = 0; i < 10000; i++) {
        wheel.tick(16);
        if (wheel.getState().state === WheelState.Stopping) {
          sawStopping = true;
        }
        if (wheel.isComplete()) break;
      }

      expect(sawStopping).toBe(true);
    });
  });

  describe('applyInfluence', () => {
    it('should return false when idle', () => {
      const action = new InfluenceAction('inf-1', 'user-1', InfluenceType.SpeedUp, 'round-1', 1000);

      const result = wheel.applyInfluence(action);

      expect(result).toBe(false);
    });

    it('should accept influence when spinning', () => {
      wheel.startRound('round-1', 1000);
      const action = new InfluenceAction('inf-1', 'user-1', InfluenceType.SpeedUp, 'round-1', 1100);

      const result = wheel.applyInfluence(action);

      expect(result).toBe(true);
    });

    it('should reject influence with wrong roundId', () => {
      wheel.startRound('round-1', 1000);
      const action = new InfluenceAction('inf-1', 'user-1', InfluenceType.SpeedUp, 'round-2', 1100);

      const result = wheel.applyInfluence(action);

      expect(result).toBe(false);
    });

    it('should increase velocity with SpeedUp', () => {
      wheel.startRound('round-1', 1000);
      wheel.tick(500); // Let it slow down a bit
      const velocityBefore = wheel.getAngularVelocity();

      const action = new InfluenceAction('inf-1', 'user-1', InfluenceType.SpeedUp, 'round-1', 1500, 10);
      wheel.applyInfluence(action);

      expect(wheel.getAngularVelocity()).toBeGreaterThan(velocityBefore);
    });

    it('should decrease velocity with SlowDown', () => {
      wheel.startRound('round-1', 1000);
      const velocityBefore = wheel.getAngularVelocity();

      const action = new InfluenceAction('inf-1', 'user-1', InfluenceType.SlowDown, 'round-1', 1100, 5);
      wheel.applyInfluence(action);

      expect(wheel.getAngularVelocity()).toBeLessThan(velocityBefore);
    });

    it('should apply stronger braking with Brake', () => {
      wheel.startRound('round-1', 1000);
      const velocityBefore = wheel.getAngularVelocity();

      const action = new InfluenceAction('inf-1', 'user-1', InfluenceType.Brake, 'round-1', 1100);
      wheel.applyInfluence(action);

      // Brake has higher default magnitude (6) than SlowDown (2)
      expect(wheel.getAngularVelocity()).toBeLessThan(velocityBefore - 5);
    });
  });

  describe('isComplete', () => {
    it('should return false when idle', () => {
      expect(wheel.isComplete()).toBe(false);
    });

    it('should return false when spinning', () => {
      wheel.startRound('round-1', 1000);

      expect(wheel.isComplete()).toBe(false);
    });

    it('should return true when stopped', () => {
      wheel.startRound('round-1', 1000);

      for (let i = 0; i < 10000; i++) {
        wheel.tick(16);
        if (wheel.isComplete()) break;
      }

      expect(wheel.isComplete()).toBe(true);
    });
  });

  describe('resolveRound', () => {
    it('should return null when not complete', () => {
      wheel.startRound('round-1', 1000);

      const result = wheel.resolveRound(2000);

      expect(result).toBeNull();
    });

    it('should return null when idle', () => {
      const result = wheel.resolveRound(1000);

      expect(result).toBeNull();
    });

    it('should return Selection when complete', () => {
      wheel.startRound('round-1', 1000);

      for (let i = 0; i < 10000; i++) {
        wheel.tick(16);
        if (wheel.isComplete()) break;
      }

      const result = wheel.resolveRound(20000);

      expect(result).not.toBeNull();
      expect(result!.roundId).toBe('round-1');
      expect(result!.selectedSlice).toBeDefined();
      expect(result!.durationMs).toBeGreaterThan(0);
    });

    it('should include influences in selection', () => {
      wheel.startRound('round-1', 1000);

      const action1 = new InfluenceAction('inf-1', 'user-1', InfluenceType.SpeedUp, 'round-1', 1100);
      const action2 = new InfluenceAction('inf-2', 'user-2', InfluenceType.Brake, 'round-1', 1200);
      wheel.applyInfluence(action1);
      wheel.applyInfluence(action2);

      for (let i = 0; i < 10000; i++) {
        wheel.tick(16);
        if (wheel.isComplete()) break;
      }

      const result = wheel.resolveRound(20000);

      expect(result!.influences).toHaveLength(2);
    });
  });

  describe('reset', () => {
    it('should reset wheel to idle state', () => {
      wheel.startRound('round-1', 1000);
      wheel.tick(100);

      wheel.reset();

      const state = wheel.getState();
      expect(state.state).toBe(WheelState.Idle);
      expect(state.theta).toBe(0);
      expect(state.omega).toBe(0);
      expect(state.roundId).toBeNull();
    });

    it('should allow starting new round after reset', () => {
      wheel.startRound('round-1', 1000);
      wheel.tick(100);
      wheel.reset();

      const result = wheel.startRound('round-2', 2000);

      expect(result).toBe(true);
      expect(wheel.getState().roundId).toBe('round-2');
    });
  });

  describe('getSliceGeometry', () => {
    it('should return geometry for all slices', () => {
      const geometry = wheel.getSliceGeometry();

      expect(geometry).toHaveLength(4);
      expect(geometry[0].slice.id).toBe('slice-1');
    });
  });

  describe('getAngularVelocity', () => {
    it('should return 0 when idle', () => {
      expect(wheel.getAngularVelocity()).toBe(0);
    });

    it('should return positive value when spinning', () => {
      wheel.startRound('round-1', 1000);

      expect(wheel.getAngularVelocity()).toBeGreaterThan(0);
    });
  });

  describe('getRotationAngle', () => {
    it('should return 0 when idle', () => {
      expect(wheel.getRotationAngle()).toBe(0);
    });

    it('should increase during spinning', () => {
      wheel.startRound('round-1', 1000);
      wheel.tick(100);

      expect(wheel.getRotationAngle()).toBeGreaterThan(0);
    });

    it('should be normalized to [0, 2π)', () => {
      wheel.startRound('round-1', 1000);

      // Spin for a while to accumulate rotations
      for (let i = 0; i < 1000; i++) {
        wheel.tick(16);
      }

      const angle = wheel.getRotationAngle();
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(Math.PI * 2);
    });
  });

  describe('determinism', () => {
    it('should produce same result with same inputs', () => {
      const wheel1 = new Wheel(slices);
      const wheel2 = new Wheel(slices);

      wheel1.startRound('round-1', 1000);
      wheel2.startRound('round-1', 1000);

      for (let i = 0; i < 5000; i++) {
        wheel1.tick(16);
        wheel2.tick(16);
      }

      expect(wheel1.getRotationAngle()).toBe(wheel2.getRotationAngle());
      expect(wheel1.getAngularVelocity()).toBe(wheel2.getAngularVelocity());
    });

    it('should produce different results with different influences', () => {
      const wheel1 = new Wheel(slices);
      const wheel2 = new Wheel(slices);

      wheel1.startRound('round-1', 1000);
      wheel2.startRound('round-1', 1000);

      // Apply influence to only wheel1
      const action = new InfluenceAction('inf-1', 'user-1', InfluenceType.SpeedUp, 'round-1', 1100, 10);
      wheel1.applyInfluence(action);

      for (let i = 0; i < 1000; i++) {
        wheel1.tick(16);
        wheel2.tick(16);
      }

      expect(wheel1.getRotationAngle()).not.toBe(wheel2.getRotationAngle());
    });
  });
});

describe('WheelSnapshot', () => {
  describe('isSpinning', () => {
    it('should return false for Idle', () => {
      const snapshot = new WheelSnapshot(WheelState.Idle, 0, 0, null, [], null, 0);

      expect(snapshot.isSpinning).toBe(false);
    });

    it('should return true for Spinning', () => {
      const snapshot = new WheelSnapshot(WheelState.Spinning, 0, 10, 'r1', [], null, 50);

      expect(snapshot.isSpinning).toBe(true);
    });

    it('should return true for Stopping', () => {
      const snapshot = new WheelSnapshot(WheelState.Stopping, 0, 2, 'r1', [], null, 80);

      expect(snapshot.isSpinning).toBe(true);
    });

    it('should return false for Stopped', () => {
      const snapshot = new WheelSnapshot(WheelState.Stopped, 0, 0, 'r1', [], 'slice-1', 100);

      expect(snapshot.isSpinning).toBe(false);
    });
  });

  describe('isStopped', () => {
    it('should return true only for Stopped state', () => {
      expect(new WheelSnapshot(WheelState.Idle, 0, 0, null, [], null, 0).isStopped).toBe(false);
      expect(new WheelSnapshot(WheelState.Spinning, 0, 10, 'r1', [], null, 50).isStopped).toBe(false);
      expect(new WheelSnapshot(WheelState.Stopping, 0, 2, 'r1', [], null, 80).isStopped).toBe(false);
      expect(new WheelSnapshot(WheelState.Stopped, 0, 0, 'r1', [], 'slice-1', 100).isStopped).toBe(true);
    });
  });

  describe('isIdle', () => {
    it('should return true only for Idle state', () => {
      expect(new WheelSnapshot(WheelState.Idle, 0, 0, null, [], null, 0).isIdle).toBe(true);
      expect(new WheelSnapshot(WheelState.Spinning, 0, 10, 'r1', [], null, 50).isIdle).toBe(false);
      expect(new WheelSnapshot(WheelState.Stopping, 0, 2, 'r1', [], null, 80).isIdle).toBe(false);
      expect(new WheelSnapshot(WheelState.Stopped, 0, 0, 'r1', [], 'slice-1', 100).isIdle).toBe(false);
    });
  });
});
