import { describe, it, expect } from 'vitest';
import { InfluenceAction, InfluenceType } from '../influence-action';

describe('InfluenceAction', () => {
  const validParams = {
    id: 'action-1',
    participantId: 'user-1',
    type: InfluenceType.SpeedUp,
    roundId: 'round-1',
    timestamp: 1000,
  };

  describe('constructor', () => {
    it('should create an action with valid parameters', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        validParams.type,
        validParams.roundId,
        validParams.timestamp
      );

      expect(action.id).toBe('action-1');
      expect(action.participantId).toBe('user-1');
      expect(action.type).toBe(InfluenceType.SpeedUp);
      expect(action.roundId).toBe('round-1');
      expect(action.timestamp).toBe(1000);
    });

    it('should use default magnitude for SpeedUp', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.SpeedUp,
        validParams.roundId,
        validParams.timestamp
      );

      expect(action.magnitude).toBe(4); // Default for SpeedUp
    });

    it('should use default magnitude for SlowDown', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.SlowDown,
        validParams.roundId,
        validParams.timestamp
      );

      expect(action.magnitude).toBe(2); // Default for SlowDown
    });

    it('should use default magnitude for Brake', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.Brake,
        validParams.roundId,
        validParams.timestamp
      );

      expect(action.magnitude).toBe(6); // Default for Brake
    });

    it('should allow custom magnitude', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        validParams.type,
        validParams.roundId,
        validParams.timestamp,
        10
      );

      expect(action.magnitude).toBe(10);
    });

    it('should throw error for empty id', () => {
      expect(
        () =>
          new InfluenceAction(
            '',
            validParams.participantId,
            validParams.type,
            validParams.roundId,
            validParams.timestamp
          )
      ).toThrow('Action id cannot be empty');
    });

    it('should throw error for whitespace-only id', () => {
      expect(
        () =>
          new InfluenceAction(
            '   ',
            validParams.participantId,
            validParams.type,
            validParams.roundId,
            validParams.timestamp
          )
      ).toThrow('Action id cannot be empty');
    });

    it('should throw error for empty participantId', () => {
      expect(
        () =>
          new InfluenceAction(
            validParams.id,
            '',
            validParams.type,
            validParams.roundId,
            validParams.timestamp
          )
      ).toThrow('Participant id cannot be empty');
    });

    it('should throw error for empty roundId', () => {
      expect(
        () =>
          new InfluenceAction(
            validParams.id,
            validParams.participantId,
            validParams.type,
            '',
            validParams.timestamp
          )
      ).toThrow('Round id cannot be empty');
    });

    it('should throw error for zero timestamp', () => {
      expect(
        () =>
          new InfluenceAction(
            validParams.id,
            validParams.participantId,
            validParams.type,
            validParams.roundId,
            0
          )
      ).toThrow('Timestamp must be positive');
    });

    it('should throw error for negative timestamp', () => {
      expect(
        () =>
          new InfluenceAction(
            validParams.id,
            validParams.participantId,
            validParams.type,
            validParams.roundId,
            -100
          )
      ).toThrow('Timestamp must be positive');
    });

    it('should throw error for zero magnitude', () => {
      expect(
        () =>
          new InfluenceAction(
            validParams.id,
            validParams.participantId,
            validParams.type,
            validParams.roundId,
            validParams.timestamp,
            0
          )
      ).toThrow('Magnitude must be positive');
    });

    it('should throw error for negative magnitude', () => {
      expect(
        () =>
          new InfluenceAction(
            validParams.id,
            validParams.participantId,
            validParams.type,
            validParams.roundId,
            validParams.timestamp,
            -5
          )
      ).toThrow('Magnitude must be positive');
    });
  });

  describe('calculateImpulse', () => {
    it('should return positive impulse for SpeedUp', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.SpeedUp,
        validParams.roundId,
        validParams.timestamp,
        5
      );

      expect(action.calculateImpulse()).toBe(5);
    });

    it('should return negative impulse for SlowDown', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.SlowDown,
        validParams.roundId,
        validParams.timestamp,
        3
      );

      expect(action.calculateImpulse()).toBe(-3);
    });

    it('should return negative impulse for Brake', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.Brake,
        validParams.roundId,
        validParams.timestamp,
        8
      );

      expect(action.calculateImpulse()).toBe(-8);
    });
  });

  describe('isSpeedUp', () => {
    it('should return true for SpeedUp type', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.SpeedUp,
        validParams.roundId,
        validParams.timestamp
      );

      expect(action.isSpeedUp()).toBe(true);
    });

    it('should return false for SlowDown type', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.SlowDown,
        validParams.roundId,
        validParams.timestamp
      );

      expect(action.isSpeedUp()).toBe(false);
    });

    it('should return false for Brake type', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.Brake,
        validParams.roundId,
        validParams.timestamp
      );

      expect(action.isSpeedUp()).toBe(false);
    });
  });

  describe('isSlowDown', () => {
    it('should return false for SpeedUp type', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.SpeedUp,
        validParams.roundId,
        validParams.timestamp
      );

      expect(action.isSlowDown()).toBe(false);
    });

    it('should return true for SlowDown type', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.SlowDown,
        validParams.roundId,
        validParams.timestamp
      );

      expect(action.isSlowDown()).toBe(true);
    });

    it('should return true for Brake type', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        InfluenceType.Brake,
        validParams.roundId,
        validParams.timestamp
      );

      expect(action.isSlowDown()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for actions with same id', () => {
      const action1 = new InfluenceAction('same-id', 'user-1', InfluenceType.SpeedUp, 'r1', 1000);
      const action2 = new InfluenceAction('same-id', 'user-2', InfluenceType.Brake, 'r2', 2000);

      expect(action1.equals(action2)).toBe(true);
    });

    it('should return false for actions with different ids', () => {
      const action1 = new InfluenceAction('id-1', 'user-1', InfluenceType.SpeedUp, 'r1', 1000);
      const action2 = new InfluenceAction('id-2', 'user-1', InfluenceType.SpeedUp, 'r1', 1000);

      expect(action1.equals(action2)).toBe(false);
    });
  });

  describe('static factory methods', () => {
    describe('speedUp', () => {
      it('should create a SpeedUp action', () => {
        const action = InfluenceAction.speedUp('id-1', 'user-1', 'round-1', 1000);

        expect(action.type).toBe(InfluenceType.SpeedUp);
        expect(action.magnitude).toBe(4); // Default
      });
    });

    describe('slowDown', () => {
      it('should create a SlowDown action', () => {
        const action = InfluenceAction.slowDown('id-1', 'user-1', 'round-1', 1000);

        expect(action.type).toBe(InfluenceType.SlowDown);
        expect(action.magnitude).toBe(2); // Default
      });
    });

    describe('brake', () => {
      it('should create a Brake action', () => {
        const action = InfluenceAction.brake('id-1', 'user-1', 'round-1', 1000);

        expect(action.type).toBe(InfluenceType.Brake);
        expect(action.magnitude).toBe(6); // Default
      });
    });
  });

  describe('isInfluenceAction', () => {
    it('should return true for InfluenceAction instance', () => {
      const action = new InfluenceAction(
        validParams.id,
        validParams.participantId,
        validParams.type,
        validParams.roundId,
        validParams.timestamp
      );

      expect(InfluenceAction.isInfluenceAction(action)).toBe(true);
    });

    it('should return false for plain object', () => {
      const obj = {
        id: 'action-1',
        participantId: 'user-1',
        type: InfluenceType.SpeedUp,
        roundId: 'round-1',
        timestamp: 1000,
        magnitude: 4,
      };

      expect(InfluenceAction.isInfluenceAction(obj)).toBe(false);
    });

    it('should return false for null', () => {
      expect(InfluenceAction.isInfluenceAction(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(InfluenceAction.isInfluenceAction(undefined)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(InfluenceAction.isInfluenceAction('string')).toBe(false);
      expect(InfluenceAction.isInfluenceAction(123)).toBe(false);
    });
  });
});
