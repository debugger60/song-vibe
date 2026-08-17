import { NextResponse } from 'next/server';
import { getFavorites, toggleFavorite } from '../../../lib/store';
import { getSession, attachSession } from '../../../lib/session';
import { tracks } from '../../../lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  const favorites = await getFavorites(session.id);
  return attachSession(NextResponse.json({ favorites }), session);
}

export async function POST(request) {
  const session = await getSession();
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  if (typeof body.trackId !== 'string' || !tracks.some(track => track.id === body.trackId)) {
    return NextResponse.json({ error: 'Choose a valid track.' }, { status: 422 });
  }
  const favorites = await toggleFavorite(session.id, body.trackId);
  return attachSession(NextResponse.json({ favorites }), session);
}
