import { NextResponse } from 'next/server';
import { categories, editorial, tracks } from '../../../lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hour = new Date().getHours();
  const mood = hour < 10 ? 'morning' : hour < 16 ? 'monsoon' : hour < 21 ? 'twilight' : 'after-dark';
  const start = Math.max(0, tracks.findIndex(track => track.mood === mood));
  const nowPlaying = tracks[start] ?? tracks[0];
  return NextResponse.json({
    station: {
      name: 'The B-Side Archive',
      hindi: 'बिसरी हुई धुनें',
      tagline: 'Songs that remember you.',
      location: 'From the warm side of memory',
      live: true,
    },
    nowPlaying,
    tracks,
    categories,
    editorial,
    generatedAt: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    }
  });
}
