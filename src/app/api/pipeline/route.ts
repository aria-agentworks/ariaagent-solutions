import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BOB_DIR = process.cwd() + '/bob';

// ─── GET /api/pipeline — Pipeline Status ─────────────────────────────────

export async function GET() {
  try {
    const pipeline = existsSync(join(BOB_DIR,'data','pipeline.json'))
      ? JSON.parse(readFileSync(join(BOB_DIR,'data','pipeline.json'), 'utf-8'))
      : null;
    const concepts = existsSync(join(BOB_DIR,'data','concepts.json'));
    const deployment = existsSync(join(BOB_DIR,'data','deployment.json'));
    const monitor = existsSync(join(BOB_DIR,'data','monitor.json'));

    return NextResponse.json({
      pipeline,
      hasConcepts: !!concepts,
      hasDeployment: !!deployment,
      hasMonitorData: !!monitor,
      conceptsCount: pipeline?.brain?.concepts_count || 0,
      adsDeployed: pipeline?.hands?.ads_deployed || 0,
      alertsFound: pipeline?.mouth?.alerts_found || 0,
    });
  } catch {
    return NextResponse.json({ pipeline: null, hasConcepts: false, hasDeployment: false, hasMonitorData: false });
  }
}
