import { TRANSIT_UPLIFT_BUCKETS } from './constants';

export function calcTransitUplift(distanceMeters: number) {
  const bucket = TRANSIT_UPLIFT_BUCKETS.find((b) => distanceMeters <= b.maxMeters) || TRANSIT_UPLIFT_BUCKETS[TRANSIT_UPLIFT_BUCKETS.length - 1];
  return (bucket.minPct + bucket.maxPct) / 2;
}
