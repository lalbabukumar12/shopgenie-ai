import { NextResponse } from 'next/server';
import { extractRequirements } from '@/lib/extractRequirements';

/**
 * POST /api/extract
 * Accepts a JSON body `{ query: string }` and parses the query to return structured requirements.
 * Reuses the extractRequirements helper logic.
 */
export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (typeof query !== 'string') {
      throw new Error('Invalid request payload: "query" must be a string');
    }

    const { criteria } = await extractRequirements(query);
    return NextResponse.json(criteria);
  } catch (error: unknown) {
    console.error('extract API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
