import type { CityPlanConfig } from './types';
import raanana from './raanana-416-1060052.json';

export const CITY_PLANS: Record<string, CityPlanConfig> = {
  raanana: raanana as CityPlanConfig,
};

export function getCityPlan(slug: string): CityPlanConfig | undefined {
  return CITY_PLANS[slug];
}

export function getAllCityPlanSlugs(): string[] {
  return Object.keys(CITY_PLANS);
}
