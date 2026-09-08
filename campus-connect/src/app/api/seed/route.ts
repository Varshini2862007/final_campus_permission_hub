import { NextResponse } from 'next/server';
import { seedInitialDataIfEmpty } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await seedInitialDataIfEmpty();
    return NextResponse.json({
      message: result.seeded ? 'Database seeded successfully from data.json' : 'Seed skipped: ' + result.reason,
      ...result
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Seed failed', message: err.message }, { status: 500 });
  }
}
