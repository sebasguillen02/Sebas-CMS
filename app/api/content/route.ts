import { desc } from 'drizzle-orm';
import { getDb } from '@/db';
import { contentItems } from '@/db/schema';

export async function GET() {
  const db = getDb();
  const items = await db.select().from(contentItems).orderBy(desc(contentItems.createdAt)).limit(100);
  return Response.json({ items });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { title?: unknown; platform?: unknown };
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const platform = body.platform === 'X' ? 'X' : 'LinkedIn';
  if (!title || title.length > 280) return Response.json({ error: 'La idea debe tener entre 1 y 280 caracteres.' }, { status: 400 });

  const now = new Date();
  const db = getDb();
  const [item] = await db.insert(contentItems).values({
    title,
    excerpt: 'Nueva idea lista para desarrollar con tu voz y experiencia.',
    platform,
    status: 'Idea',
    createdAt: now,
    updatedAt: now,
  }).returning();
  return Response.json({ item }, { status: 201 });
}
