import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

interface RightsEngineRequest {
  parcel_id: string;
  geometry_wkt?: string;
  city: string;
  submission_date: string;
  project_type: 'demolish_rebuild' | 'addition_existing';
  existing_built_sqm_reported: number;
  existing_units: number;
  as_of?: string;
}

export async function POST(request: NextRequest) {
  let tmpFile = '';
  try {
    const body = (await request.json()) as RightsEngineRequest;

    // Validate required fields
    if (!body.city || !body.submission_date || !body.project_type) {
      return NextResponse.json(
        { error: 'Missing required fields: city, submission_date, project_type' },
        { status: 400 }
      );
    }

    if (!body.existing_built_sqm_reported || !body.existing_units) {
      return NextResponse.json(
        { error: 'Missing required fields: existing_built_sqm_reported, existing_units' },
        { status: 400 }
      );
    }

    const projectRoot = path.resolve(process.cwd());

    // Write request JSON to temp file (safe — no shell injection)
    const requestPayload = {
      parcel_id: body.parcel_id || `${body.city}-AUTO`,
      geometry_wkt: body.geometry_wkt || '',
      city: body.city,
      submission_date: body.submission_date,
      project_type: body.project_type,
      existing_built_sqm_reported: body.existing_built_sqm_reported,
      existing_units: body.existing_units,
      ...(body.as_of && { as_of: body.as_of }),
    };

    tmpFile = path.join(os.tmpdir(), `rights-engine-${Date.now()}.json`);
    await writeFile(tmpFile, JSON.stringify(requestPayload), 'utf-8');

    // Run Python with the temp file path as argument
    const pythonCode = [
      'import sys, json',
      `sys.path.insert(0, ${JSON.stringify(projectRoot)})`,
      'from rights_engine.api.evaluate import evaluate_parcel',
      `with open(sys.argv[1], "r") as f: request = json.load(f)`,
      'result = evaluate_parcel(request)',
      'print(json.dumps(result, ensure_ascii=False))',
    ].join('; ');

    const { stdout, stderr } = await execFileAsync(
      'python3',
      ['-c', pythonCode, tmpFile],
      {
        timeout: 30000,
        env: {
          ...process.env,
          PYTHONPATH: projectRoot,
        },
      }
    );

    if (stderr && !stdout.trim()) {
      console.error('Python engine stderr:', stderr);
      return NextResponse.json(
        { error: 'Rights engine error', details: stderr.slice(0, 500) },
        { status: 500 }
      );
    }

    const result = JSON.parse(stdout.trim());
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Rights engine route error:', message);
    return NextResponse.json(
      { error: 'Failed to evaluate parcel', details: message.slice(0, 500) },
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    if (tmpFile) {
      await unlink(tmpFile).catch(() => {});
    }
  }
}
