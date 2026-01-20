/**
 * Value object representing a single slice on the wheel.
 * Immutable - all properties are readonly.
 */
export class WheelSlice {
  readonly id: string;
  readonly label: string;
  readonly optionId: string | undefined;
  readonly weight: number;

  constructor(
    id: string,
    label: string,
    optionId?: string,
    weight: number = 1
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Slice id cannot be empty');
    }
    if (!label || label.trim().length === 0) {
      throw new Error('Slice label cannot be empty');
    }
    if (weight <= 0) {
      throw new Error('Slice weight must be positive');
    }

    this.id = id;
    this.label = label.trim();
    this.optionId = optionId;
    this.weight = weight;
  }

  /**
   * Creates a copy with updated weight.
   */
  withWeight(newWeight: number): WheelSlice {
    return new WheelSlice(this.id, this.label, this.optionId, newWeight);
  }

  /**
   * Creates a copy with updated label.
   */
  withLabel(newLabel: string): WheelSlice {
    return new WheelSlice(this.id, newLabel, this.optionId, this.weight);
  }

  /**
   * Checks equality based on id.
   */
  equals(other: WheelSlice): boolean {
    return this.id === other.id;
  }
}

/**
 * Represents the geometric position of a slice on the wheel.
 */
export class SliceGeometry {
  constructor(
    readonly slice: WheelSlice,
    readonly startAngle: number,
    readonly endAngle: number
  ) {}

  /**
   * The midpoint angle of this slice.
   */
  get midAngle(): number {
    return this.startAngle + (this.endAngle - this.startAngle) / 2;
  }

  /**
   * The angular size of this slice in radians.
   */
  get angularSize(): number {
    return this.endAngle - this.startAngle;
  }

  /**
   * Checks if a given angle falls within this slice.
   */
  containsAngle(angle: number): boolean {
    const normalized = SliceGeometry.normalizeAngle(angle);
    return normalized >= this.startAngle && normalized < this.endAngle;
  }

  private static normalizeAngle(angle: number): number {
    const TWO_PI = Math.PI * 2;
    let normalized = angle % TWO_PI;
    if (normalized < 0) {
      normalized += TWO_PI;
    }
    return normalized;
  }
}

/**
 * Collection of slices with computed geometry.
 * Handles the mathematical distribution of slices around the wheel.
 */
export class SliceCollection {
  private readonly geometries: readonly SliceGeometry[];

  constructor(private readonly slices: readonly WheelSlice[]) {
    this.geometries = this.computeGeometry();
  }

  /**
   * Returns all slice geometries.
   */
  getGeometries(): readonly SliceGeometry[] {
    return this.geometries;
  }

  /**
   * Returns all slices.
   */
  getSlices(): readonly WheelSlice[] {
    return this.slices;
  }

  /**
   * Returns the number of slices.
   */
  get count(): number {
    return this.slices.length;
  }

  /**
   * Finds the slice at a given angle.
   */
  findSliceAtAngle(angle: number): WheelSlice | null {
    for (const geo of this.geometries) {
      if (geo.containsAngle(angle)) {
        return geo.slice;
      }
    }

    // Handle edge case at 2π wrapping to first slice
    if (this.geometries.length > 0) {
      const lastGeo = this.geometries[this.geometries.length - 1];
      const normalized = this.normalizeAngle(angle);
      if (normalized >= lastGeo.endAngle) {
        return this.geometries[0].slice;
      }
    }

    return null;
  }

  /**
   * Returns the peg angles (at slice boundaries).
   */
  getPegAngles(): readonly number[] {
    return this.geometries.map((geo) => geo.startAngle);
  }

  private computeGeometry(): SliceGeometry[] {
    if (this.slices.length === 0) {
      return [];
    }

    const totalWeight = this.slices.reduce((sum, s) => sum + s.weight, 0);
    const TWO_PI = Math.PI * 2;

    let currentAngle = 0;
    return this.slices.map((slice) => {
      const angleSize = (slice.weight / totalWeight) * TWO_PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSize;
      currentAngle = endAngle;

      return new SliceGeometry(slice, startAngle, endAngle);
    });
  }

  private normalizeAngle(angle: number): number {
    const TWO_PI = Math.PI * 2;
    let normalized = angle % TWO_PI;
    if (normalized < 0) {
      normalized += TWO_PI;
    }
    return normalized;
  }
}
