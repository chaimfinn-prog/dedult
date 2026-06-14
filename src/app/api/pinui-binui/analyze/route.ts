import { NextRequest, NextResponse } from 'next/server';
import { buildBusinessPlan } from '@/lib/pinui-binui';
import { calcCompetitiveOffer, estimateReplacementDeveloperValue } from '@/lib/pinui-binui';
import type { PinuiBinuiInput } from '@/lib/pinui-binui';
import { getProject, updateProject, addNote } from '@/lib/pinui-binui/pipeline';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, input } = body as {
      projectId?: string;
      input: PinuiBinuiInput;
    };

    if (!input || !input.existingBuildings || !input.zoningRights) {
      return NextResponse.json(
        { error: 'Missing required input fields' },
        { status: 400 },
      );
    }

    const plan = buildBusinessPlan(input);
    const competitiveOffer = calcCompetitiveOffer(input);
    const replacementValue = estimateReplacementDeveloperValue(plan);

    if (projectId) {
      try {
        const project = await getProject(projectId);
        if (project) {
          await updateProject(projectId, {
            status: 'business_plan_ready',
            stage: plan.stage,
            businessPlanId: `bp_${Date.now()}`,
          });
          await addNote(
            projectId,
            `Business plan generated: ${plan.feasibility} (score: ${plan.feasibilityScore.toFixed(0)})`,
          );
        }
      } catch {
        // Firebase not configured — continue without persistence
      }
    }

    return NextResponse.json({
      plan,
      competitiveOffer,
      replacementValue,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Analysis failed', detail: String(err) },
      { status: 500 },
    );
  }
}
