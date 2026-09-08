import {
  bad,
  clean,
  contentColumns,
  database,
  payload,
  profileId,
} from '@/lib/cms-server';

const statuses = ['Idea', 'Borrador', 'Revisión', 'Programado', 'Publicado'];
function fields(body: Record<string, unknown>) {
  const profile = profileId(body.profileId);
  const title = clean(body.title, 280, true);
  const excerpt = clean(body.excerpt ?? '', 20000);
  if (body.platform !== 'X' && body.platform !== 'LinkedIn')
    throw new Error('Plataforma inválida.');
  const status = body.status ?? 'Idea';
  if (typeof status !== 'string' || !statuses.includes(status))
    throw new Error('Estado inválido.');
  const scheduledAt = body.scheduledAt ? clean(body.scheduledAt, 40) : null;
  if (scheduledAt && !Number.isFinite(Date.parse(scheduledAt)))
    throw new Error('Fecha inválida.');
  if (
    status === 'Programado' &&
    (!scheduledAt || Date.parse(scheduledAt) <= Date.now())
  )
    throw new Error('Elegí una fecha futura para programar.');
  if (status !== 'Idea' && !excerpt)
    throw new Error('Agregá el texto de la publicación.');
  return {
    profile,
    title,
    excerpt,
    platform: body.platform,
    status,
    scheduledAt,
  };
}
export async function GET(request: Request) {
  try {
    const profile = profileId(new URL(request.url).searchParams.get('profile'));
    const { results: items } = await database()
      .prepare(
        `SELECT ${contentColumns} FROM content_items WHERE profile_id = ? ORDER BY created_at DESC`,
      )
      .bind(profile)
      .all();
    return Response.json({ items });
  } catch (error) {
    return bad(error);
  }
}
export async function POST(request: Request) {
  try {
    const body = await payload(request);
    const f = fields(body);
    const now = Date.now();
    const key = body.generationKey
      ? clean(body.generationKey, 200, true)
      : null;
    const item = await database()
      .prepare(
        `INSERT INTO content_items (profile_id,title,excerpt,platform,status,scheduled_at,generation_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING RETURNING ${contentColumns}`,
      )
      .bind(
        f.profile,
        f.title,
        f.excerpt,
        f.platform,
        f.status,
        f.scheduledAt,
        key,
        now,
        now,
      )
      .first();
    const existing =
      !item && key
        ? await database()
            .prepare(
              `SELECT ${contentColumns} FROM content_items WHERE profile_id=? AND generation_key=?`,
            )
            .bind(f.profile, key)
            .first()
        : null;
    return Response.json(
      { item: item ?? existing },
      { status: item ? 201 : 200 },
    );
  } catch (error) {
    return bad(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const body = await payload(request);
    const f = fields(body);
    if (!Number.isInteger(body.id)) throw new Error('Contenido inválido.');
    const item = await database()
      .prepare(
        `UPDATE content_items SET title=?,excerpt=?,platform=?,status=?,scheduled_at=?,updated_at=? WHERE id=? AND profile_id=? RETURNING ${contentColumns}`,
      )
      .bind(
        f.title,
        f.excerpt,
        f.platform,
        f.status,
        f.scheduledAt,
        Date.now(),
        body.id,
        f.profile,
      )
      .first();
    if (!item)
      return Response.json(
        { error: 'La publicación ya no existe en este perfil.' },
        { status: 404 },
      );
    return Response.json({ item });
  } catch (error) {
    return bad(error);
  }
}
export async function DELETE(request: Request) {
  try {
    const body = await payload(request);
    const profile = profileId(body.profileId);
    if (!Number.isInteger(body.id)) throw new Error('Contenido inválido.');
    const item = await database()
      .prepare(
        'DELETE FROM content_items WHERE id=? AND profile_id=? RETURNING id',
      )
      .bind(body.id, profile)
      .first();
    return item
      ? Response.json({ deleted: true })
      : Response.json(
          { error: 'No se encontró el contenido.' },
          { status: 404 },
        );
  } catch (error) {
    return bad(error);
  }
}
