/**
 * Standard response pattern for all computations.
 * Every API response and UI component that renders a number must handle all four states.
 */
export type ComputeResult<T> =
  | { status: 'OK'; data: T; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; warnings: string[] }
  | { status: 'ESTIMATE_ONLY'; data: T; note: string }
  | { status: 'CANNOT_COMPUTE'; reason: string }
  | { status: 'NO_DATA'; message: string };
