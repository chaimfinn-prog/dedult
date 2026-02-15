import { RiskCategory } from '../enums/RiskCategory';

export interface RiskFactor {
  id: string;
  category: RiskCategory;
  severity: 1 | 2 | 3 | 4 | 5;
  titleKey: string;
  descriptionKey: string;
  details: Record<string, unknown>;
}
