import { describe, it, expect } from 'vitest';
import { WheelSlice, SliceGeometry, SliceCollection } from '../wheel-slice';

describe('WheelSlice', () => {
  describe('constructor', () => {
    it('should create a slice with valid parameters', () => {
      const slice = new WheelSlice('1', 'Option A');

      expect(slice.id).toBe('1');
      expect(slice.label).toBe('Option A');
      expect(slice.weight).toBe(1);
      expect(slice.optionId).toBeUndefined();
    });

    it('should create a slice with custom weight', () => {
      const slice = new WheelSlice('1', 'Option A', undefined, 2);

      expect(slice.weight).toBe(2);
    });

    it('should create a slice with optionId', () => {
      const slice = new WheelSlice('1', 'Option A', 'opt-123');

      expect(slice.optionId).toBe('opt-123');
    });

    it('should trim the label', () => {
      const slice = new WheelSlice('1', '  Option A  ');

      expect(slice.label).toBe('Option A');
    });

    it('should throw error for empty id', () => {
      expect(() => new WheelSlice('', 'Option A')).toThrow('Slice id cannot be empty');
    });

    it('should throw error for whitespace-only id', () => {
      expect(() => new WheelSlice('   ', 'Option A')).toThrow('Slice id cannot be empty');
    });

    it('should throw error for empty label', () => {
      expect(() => new WheelSlice('1', '')).toThrow('Slice label cannot be empty');
    });

    it('should throw error for whitespace-only label', () => {
      expect(() => new WheelSlice('1', '   ')).toThrow('Slice label cannot be empty');
    });

    it('should throw error for zero weight', () => {
      expect(() => new WheelSlice('1', 'Option A', undefined, 0)).toThrow(
        'Slice weight must be positive'
      );
    });

    it('should throw error for negative weight', () => {
      expect(() => new WheelSlice('1', 'Option A', undefined, -1)).toThrow(
        'Slice weight must be positive'
      );
    });
  });

  describe('withWeight', () => {
    it('should create a new slice with updated weight', () => {
      const original = new WheelSlice('1', 'Option A', 'opt-1', 1);
      const updated = original.withWeight(3);

      expect(updated.weight).toBe(3);
      expect(updated.id).toBe('1');
      expect(updated.label).toBe('Option A');
      expect(updated.optionId).toBe('opt-1');
      expect(original.weight).toBe(1); // Original unchanged
    });
  });

  describe('withLabel', () => {
    it('should create a new slice with updated label', () => {
      const original = new WheelSlice('1', 'Option A', 'opt-1', 2);
      const updated = original.withLabel('Option B');

      expect(updated.label).toBe('Option B');
      expect(updated.id).toBe('1');
      expect(updated.weight).toBe(2);
      expect(original.label).toBe('Option A'); // Original unchanged
    });
  });

  describe('equals', () => {
    it('should return true for slices with same id', () => {
      const slice1 = new WheelSlice('1', 'Option A');
      const slice2 = new WheelSlice('1', 'Option B', 'opt-1', 5);

      expect(slice1.equals(slice2)).toBe(true);
    });

    it('should return false for slices with different ids', () => {
      const slice1 = new WheelSlice('1', 'Option A');
      const slice2 = new WheelSlice('2', 'Option A');

      expect(slice1.equals(slice2)).toBe(false);
    });
  });
});

describe('SliceGeometry', () => {
  const slice = new WheelSlice('1', 'Option A');

  describe('constructor', () => {
    it('should create geometry with start and end angles', () => {
      const geo = new SliceGeometry(slice, 0, Math.PI / 2);

      expect(geo.slice).toBe(slice);
      expect(geo.startAngle).toBe(0);
      expect(geo.endAngle).toBe(Math.PI / 2);
    });
  });

  describe('midAngle', () => {
    it('should calculate the midpoint angle', () => {
      const geo = new SliceGeometry(slice, 0, Math.PI);

      expect(geo.midAngle).toBe(Math.PI / 2);
    });

    it('should calculate midpoint for non-zero start', () => {
      const geo = new SliceGeometry(slice, Math.PI / 2, Math.PI);

      expect(geo.midAngle).toBe((3 * Math.PI) / 4);
    });
  });

  describe('angularSize', () => {
    it('should calculate the angular size', () => {
      const geo = new SliceGeometry(slice, 0, Math.PI / 2);

      expect(geo.angularSize).toBe(Math.PI / 2);
    });
  });

  describe('containsAngle', () => {
    const geo = new SliceGeometry(slice, Math.PI / 4, Math.PI / 2);

    it('should return true for angle within range', () => {
      expect(geo.containsAngle(Math.PI / 3)).toBe(true);
    });

    it('should return true for angle at start', () => {
      expect(geo.containsAngle(Math.PI / 4)).toBe(true);
    });

    it('should return false for angle at end (exclusive)', () => {
      expect(geo.containsAngle(Math.PI / 2)).toBe(false);
    });

    it('should return false for angle outside range', () => {
      expect(geo.containsAngle(0)).toBe(false);
      expect(geo.containsAngle(Math.PI)).toBe(false);
    });

    it('should normalize negative angles', () => {
      const geoAtZero = new SliceGeometry(slice, 0, Math.PI / 4);
      // -π/8 normalized = 2π - π/8 ≈ 5.89, which is outside [0, π/4]
      expect(geoAtZero.containsAngle(-Math.PI / 8)).toBe(false);
    });
  });
});

describe('SliceCollection', () => {
  describe('constructor', () => {
    it('should create collection with slices', () => {
      const slices = [new WheelSlice('1', 'A'), new WheelSlice('2', 'B')];
      const collection = new SliceCollection(slices);

      expect(collection.count).toBe(2);
    });

    it('should handle empty slices array', () => {
      const collection = new SliceCollection([]);

      expect(collection.count).toBe(0);
      expect(collection.getGeometries()).toEqual([]);
    });
  });

  describe('getSlices', () => {
    it('should return all slices', () => {
      const slices = [new WheelSlice('1', 'A'), new WheelSlice('2', 'B')];
      const collection = new SliceCollection(slices);

      expect(collection.getSlices()).toHaveLength(2);
      expect(collection.getSlices()[0].id).toBe('1');
    });
  });

  describe('getGeometries', () => {
    it('should compute equal angles for equal weights', () => {
      const slices = [
        new WheelSlice('1', 'A'),
        new WheelSlice('2', 'B'),
        new WheelSlice('3', 'C'),
        new WheelSlice('4', 'D'),
      ];
      const collection = new SliceCollection(slices);
      const geometries = collection.getGeometries();

      expect(geometries).toHaveLength(4);

      const expectedAngle = Math.PI / 2; // 2π / 4
      geometries.forEach((geo) => {
        expect(geo.angularSize).toBeCloseTo(expectedAngle, 10);
      });
    });

    it('should compute proportional angles for different weights', () => {
      const slices = [
        new WheelSlice('1', 'A', undefined, 1),
        new WheelSlice('2', 'B', undefined, 3),
      ];
      const collection = new SliceCollection(slices);
      const geometries = collection.getGeometries();

      // Total weight = 4, so A gets 1/4, B gets 3/4
      expect(geometries[0].angularSize).toBeCloseTo(Math.PI / 2, 10); // 2π * 1/4
      expect(geometries[1].angularSize).toBeCloseTo((3 * Math.PI) / 2, 10); // 2π * 3/4
    });

    it('should have continuous angles', () => {
      const slices = [
        new WheelSlice('1', 'A'),
        new WheelSlice('2', 'B'),
        new WheelSlice('3', 'C'),
      ];
      const collection = new SliceCollection(slices);
      const geometries = collection.getGeometries();

      expect(geometries[0].startAngle).toBe(0);
      expect(geometries[0].endAngle).toBeCloseTo(geometries[1].startAngle, 10);
      expect(geometries[1].endAngle).toBeCloseTo(geometries[2].startAngle, 10);
      expect(geometries[2].endAngle).toBeCloseTo(Math.PI * 2, 10);
    });
  });

  describe('findSliceAtAngle', () => {
    const slices = [
      new WheelSlice('1', 'A'),
      new WheelSlice('2', 'B'),
      new WheelSlice('3', 'C'),
      new WheelSlice('4', 'D'),
    ];
    const collection = new SliceCollection(slices);

    it('should find slice at angle 0', () => {
      const slice = collection.findSliceAtAngle(0);
      expect(slice?.id).toBe('1');
    });

    it('should find correct slice for middle angles', () => {
      // Each slice is π/2 wide
      expect(collection.findSliceAtAngle(Math.PI / 4)?.id).toBe('1'); // 0 to π/2
      expect(collection.findSliceAtAngle((3 * Math.PI) / 4)?.id).toBe('2'); // π/2 to π
      expect(collection.findSliceAtAngle((5 * Math.PI) / 4)?.id).toBe('3'); // π to 3π/2
      expect(collection.findSliceAtAngle((7 * Math.PI) / 4)?.id).toBe('4'); // 3π/2 to 2π
    });

    it('should handle angle wrapping at 2π', () => {
      const slice = collection.findSliceAtAngle(Math.PI * 2);
      expect(slice?.id).toBe('1');
    });

    it('should handle negative angles', () => {
      // -π/4 normalized = 7π/4, which should be in slice 4
      const slice = collection.findSliceAtAngle(-Math.PI / 4);
      expect(slice?.id).toBe('4');
    });

    it('should return null for empty collection', () => {
      const emptyCollection = new SliceCollection([]);
      expect(emptyCollection.findSliceAtAngle(0)).toBeNull();
    });
  });

  describe('getPegAngles', () => {
    it('should return start angles of all slices', () => {
      const slices = [
        new WheelSlice('1', 'A'),
        new WheelSlice('2', 'B'),
        new WheelSlice('3', 'C'),
      ];
      const collection = new SliceCollection(slices);
      const pegAngles = collection.getPegAngles();

      expect(pegAngles).toHaveLength(3);
      expect(pegAngles[0]).toBe(0);
      expect(pegAngles[1]).toBeCloseTo((2 * Math.PI) / 3, 10);
      expect(pegAngles[2]).toBeCloseTo((4 * Math.PI) / 3, 10);
    });
  });
});
