/**
 * Immutable configuration for the physics-based wheel simulation.
 * Use WheelConfig.builder() to create instances with custom values.
 */
export class WheelConfig {
  /** Default physics values derived from the reference implementation. */
  private static readonly DEFAULTS = {
    momentOfInertia: 1,
    baseDamping: 0.2,
    pointerStiffness: 4,
    pointerDamping: 1,
    contactWindow: 0.12,
    velocityThreshold: 0.0005,
    pointerAngle: -Math.PI / 2,
    initialSpinImpulse: 22,
  } as const;

  private constructor(
    /** Moment of inertia - resistance to angular acceleration */
    readonly momentOfInertia: number,
    /** Base friction coefficient applied continuously */
    readonly baseDamping: number,
    /** Spring constant for peg-pointer collision */
    readonly pointerStiffness: number,
    /** Damping coefficient for peg-pointer collision */
    readonly pointerDamping: number,
    /** Angular range (radians) within which peg-pointer interaction occurs */
    readonly contactWindow: number,
    /** Minimum angular velocity threshold - below this, wheel stops */
    readonly velocityThreshold: number,
    /** Fixed angle of the pointer (radians) - typically -π/2 (top) */
    readonly pointerAngle: number,
    /** Initial spin impulse magnitude */
    readonly initialSpinImpulse: number
  ) {}

  /**
   * Creates a new builder for customizing wheel configuration.
   */
  static builder(): WheelConfigBuilder {
    return new WheelConfigBuilder();
  }

  /**
   * Creates a default wheel configuration.
   */
  static createDefault(): WheelConfig {
    return WheelConfig.builder().build();
  }

  /**
   * Creates a configuration with custom values, using defaults for unspecified fields.
   */
  static create(overrides: Partial<WheelConfigValues>): WheelConfig {
    const values = { ...WheelConfig.DEFAULTS, ...overrides };
    return new WheelConfig(
      values.momentOfInertia,
      values.baseDamping,
      values.pointerStiffness,
      values.pointerDamping,
      values.contactWindow,
      values.velocityThreshold,
      values.pointerAngle,
      values.initialSpinImpulse
    );
  }

  /**
   * Creates a copy with modified values.
   */
  with(overrides: Partial<WheelConfigValues>): WheelConfig {
    return WheelConfig.create({
      momentOfInertia: this.momentOfInertia,
      baseDamping: this.baseDamping,
      pointerStiffness: this.pointerStiffness,
      pointerDamping: this.pointerDamping,
      contactWindow: this.contactWindow,
      velocityThreshold: this.velocityThreshold,
      pointerAngle: this.pointerAngle,
      initialSpinImpulse: this.initialSpinImpulse,
      ...overrides,
    });
  }

  /**
   * Validates that all physics parameters are reasonable.
   */
  isValid(): boolean {
    return (
      this.momentOfInertia > 0 &&
      this.baseDamping > 0 &&
      this.pointerStiffness > 0 &&
      this.pointerDamping > 0 &&
      this.contactWindow > 0 &&
      this.velocityThreshold > 0 &&
      this.initialSpinImpulse > 0
    );
  }
}

/**
 * Configuration values interface for partial updates.
 */
export interface WheelConfigValues {
  momentOfInertia: number;
  baseDamping: number;
  pointerStiffness: number;
  pointerDamping: number;
  contactWindow: number;
  velocityThreshold: number;
  pointerAngle: number;
  initialSpinImpulse: number;
}

/**
 * Builder pattern for creating WheelConfig instances.
 * Provides a fluent API with validation.
 *
 * @example
 * const config = WheelConfig.builder()
 *   .withBaseDamping(0.3)
 *   .withPointerStiffness(5)
 *   .build();
 */
export class WheelConfigBuilder {
  private values: WheelConfigValues = {
    momentOfInertia: 1,
    baseDamping: 0.2,
    pointerStiffness: 4,
    pointerDamping: 1,
    contactWindow: 0.12,
    velocityThreshold: 0.0005,
    pointerAngle: -Math.PI / 2,
    initialSpinImpulse: 22,
  };

  withMomentOfInertia(value: number): this {
    this.validatePositive(value, 'momentOfInertia');
    this.values.momentOfInertia = value;
    return this;
  }

  withBaseDamping(value: number): this {
    this.validatePositive(value, 'baseDamping');
    this.values.baseDamping = value;
    return this;
  }

  withPointerStiffness(value: number): this {
    this.validatePositive(value, 'pointerStiffness');
    this.values.pointerStiffness = value;
    return this;
  }

  withPointerDamping(value: number): this {
    this.validatePositive(value, 'pointerDamping');
    this.values.pointerDamping = value;
    return this;
  }

  withContactWindow(value: number): this {
    this.validatePositive(value, 'contactWindow');
    this.values.contactWindow = value;
    return this;
  }

  withVelocityThreshold(value: number): this {
    this.validatePositive(value, 'velocityThreshold');
    this.values.velocityThreshold = value;
    return this;
  }

  withPointerAngle(value: number): this {
    this.values.pointerAngle = value;
    return this;
  }

  withInitialSpinImpulse(value: number): this {
    this.validatePositive(value, 'initialSpinImpulse');
    this.values.initialSpinImpulse = value;
    return this;
  }

  /**
   * Creates an immutable WheelConfig instance.
   */
  build(): WheelConfig {
    return WheelConfig.create(this.values);
  }

  private validatePositive(value: number, name: string): void {
    if (value <= 0) {
      throw new Error(`${name} must be a positive number`);
    }
  }
}
