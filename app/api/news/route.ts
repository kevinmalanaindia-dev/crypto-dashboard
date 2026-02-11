import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN', {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
