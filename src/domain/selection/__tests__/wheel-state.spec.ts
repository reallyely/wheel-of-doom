import { describe, it, expect } from 'vitest';
import {
  WheelState,
  canTransition,
  getValidTransitions,
  canApplyInfluence,
  canStart,
  isComplete,
} from '../wheel-state';

describe('WheelState', () => {
  describe('enum values', () => {
    it('should have correct string values', () => {
      expect(WheelState.Idle).toBe('IDLE');
      expect(WheelState.Spinning).toBe('SPINNING');
      expect(WheelState.Stopping).toBe('STOPPING');
      expect(WheelState.Stopped).toBe('STOPPED');
    });
  });
});

describe('canTransition', () => {
  describe('from Idle', () => {
    it('should allow transition to Spinning', () => {
      expect(canTransition(WheelState.Idle, WheelState.Spinning)).toBe(true);
    });

    it('should not allow transition to Stopping', () => {
      expect(canTransition(WheelState.Idle, WheelState.Stopping)).toBe(false);
    });

    it('should not allow transition to Stopped', () => {
      expect(canTransition(WheelState.Idle, WheelState.Stopped)).toBe(false);
    });

    it('should not allow transition to Idle', () => {
      expect(canTransition(WheelState.Idle, WheelState.Idle)).toBe(false);
    });
  });

  describe('from Spinning', () => {
    it('should allow transition to Stopping', () => {
      expect(canTransition(WheelState.Spinning, WheelState.Stopping)).toBe(true);
    });

    it('should not allow transition to Idle', () => {
      expect(canTransition(WheelState.Spinning, WheelState.Idle)).toBe(false);
    });

    it('should not allow transition to Stopped', () => {
      expect(canTransition(WheelState.Spinning, WheelState.Stopped)).toBe(false);
    });

    it('should not allow transition to Spinning', () => {
      expect(canTransition(WheelState.Spinning, WheelState.Spinning)).toBe(false);
    });
  });

  describe('from Stopping', () => {
    it('should allow transition to Stopped', () => {
      expect(canTransition(WheelState.Stopping, WheelState.Stopped)).toBe(true);
    });

    it('should allow transition to Spinning (re-acceleration)', () => {
      expect(canTransition(WheelState.Stopping, WheelState.Spinning)).toBe(true);
    });

    it('should not allow transition to Idle', () => {
      expect(canTransition(WheelState.Stopping, WheelState.Idle)).toBe(false);
    });

    it('should not allow transition to Stopping', () => {
      expect(canTransition(WheelState.Stopping, WheelState.Stopping)).toBe(false);
    });
  });

  describe('from Stopped', () => {
    it('should allow transition to Idle', () => {
      expect(canTransition(WheelState.Stopped, WheelState.Idle)).toBe(true);
    });

    it('should not allow transition to Spinning', () => {
      expect(canTransition(WheelState.Stopped, WheelState.Spinning)).toBe(false);
    });

    it('should not allow transition to Stopping', () => {
      expect(canTransition(WheelState.Stopped, WheelState.Stopping)).toBe(false);
    });

    it('should not allow transition to Stopped', () => {
      expect(canTransition(WheelState.Stopped, WheelState.Stopped)).toBe(false);
    });
  });
});

describe('getValidTransitions', () => {
  it('should return [Spinning] for Idle', () => {
    const transitions = getValidTransitions(WheelState.Idle);

    expect(transitions).toEqual([WheelState.Spinning]);
  });

  it('should return [Stopping] for Spinning', () => {
    const transitions = getValidTransitions(WheelState.Spinning);

    expect(transitions).toEqual([WheelState.Stopping]);
  });

  it('should return [Stopped, Spinning] for Stopping', () => {
    const transitions = getValidTransitions(WheelState.Stopping);

    expect(transitions).toContain(WheelState.Stopped);
    expect(transitions).toContain(WheelState.Spinning);
    expect(transitions).toHaveLength(2);
  });

  it('should return [Idle] for Stopped', () => {
    const transitions = getValidTransitions(WheelState.Stopped);

    expect(transitions).toEqual([WheelState.Idle]);
  });

  it('should return a new array each time', () => {
    const transitions1 = getValidTransitions(WheelState.Idle);
    const transitions2 = getValidTransitions(WheelState.Idle);

    expect(transitions1).not.toBe(transitions2);
    expect(transitions1).toEqual(transitions2);
  });
});

describe('canApplyInfluence', () => {
  it('should return false for Idle', () => {
    expect(canApplyInfluence(WheelState.Idle)).toBe(false);
  });

  it('should return true for Spinning', () => {
    expect(canApplyInfluence(WheelState.Spinning)).toBe(true);
  });

  it('should return true for Stopping', () => {
    expect(canApplyInfluence(WheelState.Stopping)).toBe(true);
  });

  it('should return false for Stopped', () => {
    expect(canApplyInfluence(WheelState.Stopped)).toBe(false);
  });
});

describe('canStart', () => {
  it('should return true for Idle', () => {
    expect(canStart(WheelState.Idle)).toBe(true);
  });

  it('should return false for Spinning', () => {
    expect(canStart(WheelState.Spinning)).toBe(false);
  });

  it('should return false for Stopping', () => {
    expect(canStart(WheelState.Stopping)).toBe(false);
  });

  it('should return false for Stopped', () => {
    expect(canStart(WheelState.Stopped)).toBe(false);
  });
});

describe('isComplete', () => {
  it('should return false for Idle', () => {
    expect(isComplete(WheelState.Idle)).toBe(false);
  });

  it('should return false for Spinning', () => {
    expect(isComplete(WheelState.Spinning)).toBe(false);
  });

  it('should return false for Stopping', () => {
    expect(isComplete(WheelState.Stopping)).toBe(false);
  });

  it('should return true for Stopped', () => {
    expect(isComplete(WheelState.Stopped)).toBe(true);
  });
});
