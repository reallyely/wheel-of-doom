import { describe, it, expect } from 'vitest';
import { Selection, SelectionStats } from '../selection';
import { WheelSlice } from '../wheel-slice';
import { InfluenceAction, InfluenceType } from '../../influence/influence-action';

describe('Selection', () => {
  const slice = new WheelSlice('slice-1', 'Option A');
  const createInfluence = (id: string, participantId: string, type: InfluenceType) =>
    new InfluenceAction(id, participantId, type, 'round-1', 1000);

  describe('constructor', () => {
    it('should create a selection with valid parameters', () => {
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, [], 6000);

      expect(selection.id).toBe('sel-1');
      expect(selection.roundId).toBe('round-1');
      expect(selection.selectedSlice).toBe(slice);
      expect(selection.finalAngle).toBe(Math.PI);
      expect(selection.durationMs).toBe(5000);
      expect(selection.influences).toHaveLength(0);
      expect(selection.resolvedAt).toBe(6000);
    });

    it('should freeze the influences array', () => {
      const influences = [createInfluence('inf-1', 'user-1', InfluenceType.SpeedUp)];
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, influences, 6000);

      expect(Object.isFrozen(selection.influences)).toBe(true);
    });

    it('should not be affected by mutations to original influences array', () => {
      const influences = [createInfluence('inf-1', 'user-1', InfluenceType.SpeedUp)];
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, influences, 6000);

      influences.push(createInfluence('inf-2', 'user-2', InfluenceType.Brake));

      expect(selection.influences).toHaveLength(1);
    });

    it('should throw error for empty id', () => {
      expect(() => new Selection('', 'round-1', slice, Math.PI, 5000, [], 6000)).toThrow(
        'Selection id cannot be empty'
      );
    });

    it('should throw error for empty roundId', () => {
      expect(() => new Selection('sel-1', '', slice, Math.PI, 5000, [], 6000)).toThrow(
        'Round id cannot be empty'
      );
    });

    it('should throw error for negative duration', () => {
      expect(() => new Selection('sel-1', 'round-1', slice, Math.PI, -100, [], 6000)).toThrow(
        'Duration cannot be negative'
      );
    });

    it('should allow zero duration', () => {
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 0, [], 6000);
      expect(selection.durationMs).toBe(0);
    });
  });

  describe('durationSeconds', () => {
    it('should convert milliseconds to seconds', () => {
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, [], 6000);

      expect(selection.durationSeconds).toBe(5);
    });

    it('should handle fractional seconds', () => {
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 1500, [], 6000);

      expect(selection.durationSeconds).toBe(1.5);
    });
  });

  describe('totalInfluences', () => {
    it('should return 0 for no influences', () => {
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, [], 6000);

      expect(selection.totalInfluences).toBe(0);
    });

    it('should count all influences', () => {
      const influences = [
        createInfluence('inf-1', 'user-1', InfluenceType.SpeedUp),
        createInfluence('inf-2', 'user-1', InfluenceType.SpeedUp),
        createInfluence('inf-3', 'user-2', InfluenceType.Brake),
      ];
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, influences, 6000);

      expect(selection.totalInfluences).toBe(3);
    });
  });

  describe('uniqueParticipantCount', () => {
    it('should return 0 for no influences', () => {
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, [], 6000);

      expect(selection.uniqueParticipantCount).toBe(0);
    });

    it('should count unique participants', () => {
      const influences = [
        createInfluence('inf-1', 'user-1', InfluenceType.SpeedUp),
        createInfluence('inf-2', 'user-1', InfluenceType.SpeedUp),
        createInfluence('inf-3', 'user-2', InfluenceType.Brake),
        createInfluence('inf-4', 'user-3', InfluenceType.SlowDown),
      ];
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, influences, 6000);

      expect(selection.uniqueParticipantCount).toBe(3);
    });
  });

  describe('netImpulse', () => {
    it('should return 0 for no influences', () => {
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, [], 6000);

      expect(selection.netImpulse).toBe(0);
    });

    it('should sum positive impulses', () => {
      const influences = [
        createInfluence('inf-1', 'user-1', InfluenceType.SpeedUp), // +4
        createInfluence('inf-2', 'user-2', InfluenceType.SpeedUp), // +4
      ];
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, influences, 6000);

      expect(selection.netImpulse).toBe(8);
    });

    it('should calculate net of mixed impulses', () => {
      const influences = [
        createInfluence('inf-1', 'user-1', InfluenceType.SpeedUp), // +4
        createInfluence('inf-2', 'user-2', InfluenceType.SlowDown), // -2
        createInfluence('inf-3', 'user-3', InfluenceType.Brake), // -6
      ];
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, influences, 6000);

      expect(selection.netImpulse).toBe(-4); // 4 - 2 - 6
    });
  });

  describe('hadInfluence', () => {
    it('should return false for no influences', () => {
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, [], 6000);

      expect(selection.hadInfluence()).toBe(false);
    });

    it('should return true when influences exist', () => {
      const influences = [createInfluence('inf-1', 'user-1', InfluenceType.SpeedUp)];
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, influences, 6000);

      expect(selection.hadInfluence()).toBe(true);
    });
  });

  describe('getInfluencesByParticipant', () => {
    it('should return empty array for unknown participant', () => {
      const influences = [createInfluence('inf-1', 'user-1', InfluenceType.SpeedUp)];
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, influences, 6000);

      expect(selection.getInfluencesByParticipant('unknown')).toHaveLength(0);
    });

    it('should return all influences for a participant', () => {
      const influences = [
        createInfluence('inf-1', 'user-1', InfluenceType.SpeedUp),
        createInfluence('inf-2', 'user-1', InfluenceType.Brake),
        createInfluence('inf-3', 'user-2', InfluenceType.SlowDown),
      ];
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, influences, 6000);

      const user1Influences = selection.getInfluencesByParticipant('user-1');
      expect(user1Influences).toHaveLength(2);
      expect(user1Influences[0].id).toBe('inf-1');
      expect(user1Influences[1].id).toBe('inf-2');
    });
  });

  describe('getStats', () => {
    it('should return SelectionStats object', () => {
      const influences = [
        createInfluence('inf-1', 'user-1', InfluenceType.SpeedUp),
        createInfluence('inf-2', 'user-2', InfluenceType.Brake),
      ];
      const selection = new Selection('sel-1', 'round-1', slice, Math.PI, 5000, influences, 6000);

      const stats = selection.getStats();

      expect(stats).toBeInstanceOf(SelectionStats);
      expect(stats.totalInfluences).toBe(2);
      expect(stats.uniqueParticipants).toBe(2);
      expect(stats.durationSeconds).toBe(5);
    });
  });
});

describe('SelectionStats', () => {
  describe('constructor', () => {
    it('should create stats with provided values', () => {
      const stats = new SelectionStats(10, 5, 8, 12.5);

      expect(stats.totalInfluences).toBe(10);
      expect(stats.uniqueParticipants).toBe(5);
      expect(stats.netImpulse).toBe(8);
      expect(stats.durationSeconds).toBe(12.5);
    });
  });

  describe('averageInfluencesPerParticipant', () => {
    it('should calculate average', () => {
      const stats = new SelectionStats(10, 5, 0, 10);

      expect(stats.averageInfluencesPerParticipant).toBe(2);
    });

    it('should return 0 when no participants', () => {
      const stats = new SelectionStats(0, 0, 0, 10);

      expect(stats.averageInfluencesPerParticipant).toBe(0);
    });

    it('should handle fractional averages', () => {
      const stats = new SelectionStats(7, 3, 0, 10);

      expect(stats.averageInfluencesPerParticipant).toBeCloseTo(2.333, 2);
    });
  });

  describe('wasSpedUp', () => {
    it('should return true for positive net impulse', () => {
      const stats = new SelectionStats(5, 3, 10, 10);

      expect(stats.wasSpedUp).toBe(true);
    });

    it('should return false for zero net impulse', () => {
      const stats = new SelectionStats(5, 3, 0, 10);

      expect(stats.wasSpedUp).toBe(false);
    });

    it('should return false for negative net impulse', () => {
      const stats = new SelectionStats(5, 3, -5, 10);

      expect(stats.wasSpedUp).toBe(false);
    });
  });

  describe('wasSlowedDown', () => {
    it('should return true for negative net impulse', () => {
      const stats = new SelectionStats(5, 3, -10, 10);

      expect(stats.wasSlowedDown).toBe(true);
    });

    it('should return false for zero net impulse', () => {
      const stats = new SelectionStats(5, 3, 0, 10);

      expect(stats.wasSlowedDown).toBe(false);
    });

    it('should return false for positive net impulse', () => {
      const stats = new SelectionStats(5, 3, 5, 10);

      expect(stats.wasSlowedDown).toBe(false);
    });
  });
});
