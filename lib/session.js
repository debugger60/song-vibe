import { cookies } from 'next/headers';

export async function getSession() {
  const jar = await cookies();
  let id = jar.get('bside_session')?.value;
  let isNew = false;
  if (!id || !/^[a-f0-9-]{20,50}$/i.test(id)) {
    id = crypto.randomUUID();
    isNew = true;
  }
  return { id, isNew };
}

export function attachSession(response, session) {
  if (session.isNew) {
    response.cookies.set('bside_session', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
  }
  return response;
}
