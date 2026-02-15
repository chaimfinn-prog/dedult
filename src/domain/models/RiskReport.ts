import { RiskFactor } from './RiskFactor';

export interface RiskReport {
  overallScore: number;
  factors: RiskFactor[];
}
