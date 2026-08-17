import { NextResponse } from 'next/server';
import { addRequest } from '../../../lib/store';
import { getSession, attachSession } from '../../../lib/session';
import { tracks } from '../../../lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const session = await getSession();
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const track = tracks.find(item => item.id === body.trackId);
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 180) : '';
  if (!track) return NextResponse.json({ error: 'That record is not in the archive.' }, { status: 422 });

  try {
    const queued = await addRequest(session.id, { trackId: track.id, note });
    return attachSession(NextResponse.json({
      ok: true,
      requestId: queued.id,
      message: `${track.title} has been placed beside the turntable.`
    }, { status: 201 }), session);
  } catch (error) {
    if (error.code === 'RATE_LIMIT') return NextResponse.json({ error: error.message }, { status: 429 });
    console.error(error);
    return NextResponse.json({ error: 'The request desk is temporarily closed.' }, { status: 500 });
  }
}
