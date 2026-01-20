// Selection domain module
// Provides the core selection mechanics including the physics-based wheel

export type { SelectionMethod, SelectionMethodState } from './selection-method';
export { Wheel, WheelSnapshot } from './wheel';
export { WheelConfig, WheelConfigBuilder } from './wheel-config';
export type { WheelConfigValues } from './wheel-config';
export { WheelSlice, SliceGeometry, SliceCollection } from './wheel-slice';
export {
  WheelState,
  canTransition,
  getValidTransitions,
  canApplyInfluence,
  canStart,
  isComplete,
} from './wheel-state';
export { Selection, SelectionStats } from './selection';
