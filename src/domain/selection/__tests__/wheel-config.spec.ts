import { describe, it, expect } from 'vitest';
import { WheelConfig, WheelConfigBuilder } from '../wheel-config';

describe('WheelConfig', () => {
  describe('createDefault', () => {
    it('should create config with default values', () => {
      const config = WheelConfig.createDefault();

      expect(config.momentOfInertia).toBe(1);
      expect(config.baseDamping).toBe(0.2);
      expect(config.pointerStiffness).toBe(4);
      expect(config.pointerDamping).toBe(1);
      expect(config.contactWindow).toBe(0.12);
      expect(config.velocityThreshold).toBe(0.0005);
      expect(config.pointerAngle).toBe(-Math.PI / 2);
      expect(config.initialSpinImpulse).toBe(22);
    });
  });

  describe('create', () => {
    it('should create config with partial overrides', () => {
      const config = WheelConfig.create({
        baseDamping: 0.5,
        pointerStiffness: 6,
      });

      expect(config.baseDamping).toBe(0.5);
      expect(config.pointerStiffness).toBe(6);
      // Defaults preserved
      expect(config.momentOfInertia).toBe(1);
      expect(config.pointerDamping).toBe(1);
    });

    it('should create config with all overrides', () => {
      const config = WheelConfig.create({
        momentOfInertia: 2,
        baseDamping: 0.3,
        pointerStiffness: 5,
        pointerDamping: 1.5,
        contactWindow: 0.15,
        velocityThreshold: 0.001,
        pointerAngle: 0,
        initialSpinImpulse: 30,
      });

      expect(config.momentOfInertia).toBe(2);
      expect(config.baseDamping).toBe(0.3);
      expect(config.pointerStiffness).toBe(5);
      expect(config.pointerDamping).toBe(1.5);
      expect(config.contactWindow).toBe(0.15);
      expect(config.velocityThreshold).toBe(0.001);
      expect(config.pointerAngle).toBe(0);
      expect(config.initialSpinImpulse).toBe(30);
    });
  });

  describe('builder', () => {
    it('should return a WheelConfigBuilder', () => {
      const builder = WheelConfig.builder();

      expect(builder).toBeInstanceOf(WheelConfigBuilder);
    });
  });

  describe('with', () => {
    it('should create a new config with overrides', () => {
      const original = WheelConfig.createDefault();
      const modified = original.with({ baseDamping: 0.5 });

      expect(modified.baseDamping).toBe(0.5);
      expect(original.baseDamping).toBe(0.2); // Original unchanged
    });

    it('should preserve other values', () => {
      const original = WheelConfig.create({
        momentOfInertia: 2,
        baseDamping: 0.3,
      });
      const modified = original.with({ pointerStiffness: 8 });

      expect(modified.momentOfInertia).toBe(2);
      expect(modified.baseDamping).toBe(0.3);
      expect(modified.pointerStiffness).toBe(8);
    });
  });

  describe('isValid', () => {
    it('should return true for default config', () => {
      const config = WheelConfig.createDefault();

      expect(config.isValid()).toBe(true);
    });

    it('should return true for valid custom config', () => {
      const config = WheelConfig.create({
        momentOfInertia: 2,
        baseDamping: 0.5,
      });

      expect(config.isValid()).toBe(true);
    });
  });
});

describe('WheelConfigBuilder', () => {
  describe('build', () => {
    it('should create config with defaults when no methods called', () => {
      const config = new WheelConfigBuilder().build();

      expect(config.momentOfInertia).toBe(1);
      expect(config.baseDamping).toBe(0.2);
    });
  });

  describe('withMomentOfInertia', () => {
    it('should set moment of inertia', () => {
      const config = new WheelConfigBuilder().withMomentOfInertia(2.5).build();

      expect(config.momentOfInertia).toBe(2.5);
    });

    it('should throw for zero value', () => {
      expect(() => new WheelConfigBuilder().withMomentOfInertia(0)).toThrow(
        'momentOfInertia must be a positive number'
      );
    });

    it('should throw for negative value', () => {
      expect(() => new WheelConfigBuilder().withMomentOfInertia(-1)).toThrow(
        'momentOfInertia must be a positive number'
      );
    });
  });

  describe('withBaseDamping', () => {
    it('should set base damping', () => {
      const config = new WheelConfigBuilder().withBaseDamping(0.5).build();

      expect(config.baseDamping).toBe(0.5);
    });

    it('should throw for zero value', () => {
      expect(() => new WheelConfigBuilder().withBaseDamping(0)).toThrow(
        'baseDamping must be a positive number'
      );
    });
  });

  describe('withPointerStiffness', () => {
    it('should set pointer stiffness', () => {
      const config = new WheelConfigBuilder().withPointerStiffness(8).build();

      expect(config.pointerStiffness).toBe(8);
    });

    it('should throw for zero value', () => {
      expect(() => new WheelConfigBuilder().withPointerStiffness(0)).toThrow(
        'pointerStiffness must be a positive number'
      );
    });
  });

  describe('withPointerDamping', () => {
    it('should set pointer damping', () => {
      const config = new WheelConfigBuilder().withPointerDamping(2).build();

      expect(config.pointerDamping).toBe(2);
    });

    it('should throw for zero value', () => {
      expect(() => new WheelConfigBuilder().withPointerDamping(0)).toThrow(
        'pointerDamping must be a positive number'
      );
    });
  });

  describe('withContactWindow', () => {
    it('should set contact window', () => {
      const config = new WheelConfigBuilder().withContactWindow(0.2).build();

      expect(config.contactWindow).toBe(0.2);
    });

    it('should throw for zero value', () => {
      expect(() => new WheelConfigBuilder().withContactWindow(0)).toThrow(
        'contactWindow must be a positive number'
      );
    });
  });

  describe('withVelocityThreshold', () => {
    it('should set velocity threshold', () => {
      const config = new WheelConfigBuilder().withVelocityThreshold(0.001).build();

      expect(config.velocityThreshold).toBe(0.001);
    });

    it('should throw for zero value', () => {
      expect(() => new WheelConfigBuilder().withVelocityThreshold(0)).toThrow(
        'velocityThreshold must be a positive number'
      );
    });
  });

  describe('withPointerAngle', () => {
    it('should set pointer angle', () => {
      const config = new WheelConfigBuilder().withPointerAngle(Math.PI).build();

      expect(config.pointerAngle).toBe(Math.PI);
    });

    it('should allow zero angle', () => {
      const config = new WheelConfigBuilder().withPointerAngle(0).build();

      expect(config.pointerAngle).toBe(0);
    });

    it('should allow negative angle', () => {
      const config = new WheelConfigBuilder().withPointerAngle(-Math.PI).build();

      expect(config.pointerAngle).toBe(-Math.PI);
    });
  });

  describe('withInitialSpinImpulse', () => {
    it('should set initial spin impulse', () => {
      const config = new WheelConfigBuilder().withInitialSpinImpulse(30).build();

      expect(config.initialSpinImpulse).toBe(30);
    });

    it('should throw for zero value', () => {
      expect(() => new WheelConfigBuilder().withInitialSpinImpulse(0)).toThrow(
        'initialSpinImpulse must be a positive number'
      );
    });
  });

  describe('fluent API', () => {
    it('should allow chaining multiple methods', () => {
      const config = new WheelConfigBuilder()
        .withMomentOfInertia(2)
        .withBaseDamping(0.3)
        .withPointerStiffness(5)
        .withPointerDamping(1.5)
        .withContactWindow(0.15)
        .withVelocityThreshold(0.001)
        .withPointerAngle(0)
        .withInitialSpinImpulse(25)
        .build();

      expect(config.momentOfInertia).toBe(2);
      expect(config.baseDamping).toBe(0.3);
      expect(config.pointerStiffness).toBe(5);
      expect(config.pointerDamping).toBe(1.5);
      expect(config.contactWindow).toBe(0.15);
      expect(config.velocityThreshold).toBe(0.001);
      expect(config.pointerAngle).toBe(0);
      expect(config.initialSpinImpulse).toBe(25);
    });

    it('should allow overwriting previous values', () => {
      const config = new WheelConfigBuilder()
        .withBaseDamping(0.3)
        .withBaseDamping(0.5) // Overwrite
        .build();

      expect(config.baseDamping).toBe(0.5);
    });
  });
});
