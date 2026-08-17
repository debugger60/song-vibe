import fs from 'node:fs/promises';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
let writeQueue = Promise.resolve();

async function readDatabase() {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Database read failed:', error);
    return { favorites: {}, requests: [] };
  }
}

async function writeDatabase(db) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const temporary = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(db, null, 2));
  await fs.rename(temporary, DB_PATH);
}

export async function getFavorites(sessionId) {
  const db = await readDatabase();
  return db.favorites?.[sessionId] ?? [];
}

export function toggleFavorite(sessionId, trackId) {
  writeQueue = writeQueue.then(async () => {
    const db = await readDatabase();
    db.favorites ||= {};
    const set = new Set(db.favorites[sessionId] ?? []);
    set.has(trackId) ? set.delete(trackId) : set.add(trackId);
    db.favorites[sessionId] = [...set];
    await writeDatabase(db);
    return db.favorites[sessionId];
  });
  return writeQueue;
}

export function addRequest(sessionId, payload) {
  writeQueue = writeQueue.then(async () => {
    const db = await readDatabase();
    db.requests ||= [];
    const now = Date.now();
    const recent = db.requests.filter(r => r.sessionId === sessionId && now - new Date(r.createdAt).getTime() < 10 * 60 * 1000);
    if (recent.length >= 5) {
      const error = new Error('Too many requests. Let a few records play first.');
      error.code = 'RATE_LIMIT';
      throw error;
    }
    const request = {
      id: crypto.randomUUID(),
      sessionId,
      trackId: payload.trackId,
      note: payload.note,
      createdAt: new Date().toISOString(),
      status: 'queued'
    };
    db.requests.push(request);
    db.requests = db.requests.slice(-500);
    await writeDatabase(db);
    return request;
  });
  return writeQueue;
}
