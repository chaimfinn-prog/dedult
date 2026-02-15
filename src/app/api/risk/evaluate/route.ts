import { toRiskReportView } from '@/application/mappers/riskReportViewMapper';
import { buildRiskReport } from '@/domain/services/riskEngine';
import { parseInvestmentProfile, parseIsraelTaxContext } from '@/api/validation/riskSchemas';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const profileResult = parseInvestmentProfile(body.profile);
  if (profileResult.error || !profileResult.data) {
    return NextResponse.json({ error: profileResult.error ?? 'Invalid profile' }, { status: 400 });
  }

  const taxResult = parseIsraelTaxContext(body.israelTax);
  if (taxResult.error) {
    return NextResponse.json({ error: taxResult.error }, { status: 400 });
  }

  const localeQuery = req.nextUrl.searchParams.get('locale');
  const localeBody = typeof body.locale === 'string' ? body.locale : undefined;
  const locale = (localeQuery ?? localeBody ?? 'he').toLowerCase() === 'en' ? 'en' : 'he';

  const report = buildRiskReport(profileResult.data, { israelTax: taxResult.data });
  const view = toRiskReportView(report, locale);

  return NextResponse.json({
    ...view,
    warnings: taxResult.warning ? [taxResult.warning] : undefined,
  });
}
