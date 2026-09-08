import { bad, clean, database, payload, profileId } from '@/lib/cms-server';
const insightColumns =
  'id,profile_id AS profileId,category,conclusion,evidence,source_url AS sourceUrl,status,created_at AS createdAt';
const jobColumns =
  'id,profile_id AS profileId,kind,status,message,created_at AS createdAt,updated_at AS updatedAt';
export async function GET(request: Request) {
  try {
    const profile = profileId(new URL(request.url).searchParams.get('profile'));
    const results = await database().batch([
      database()
        .prepare(
          `SELECT ${insightColumns} FROM insights WHERE profile_id=? ORDER BY created_at DESC`,
        )
        .bind(profile),
      database()
        .prepare(
          `SELECT ${jobColumns} FROM editorial_jobs WHERE profile_id=? ORDER BY created_at DESC LIMIT 50`,
        )
        .bind(profile),
    ]);
    return Response.json({
      insights: results[0].results,
      jobs: results[1].results,
    });
  } catch (error) {
    return bad(error);
  }
}
export async function POST(request: Request) {
  try {
    const body = await payload(request);
    const profile = profileId(body.profileId);
    const now = Date.now();
    if (body.type === 'insight') {
      const category = clean(body.category, 30, true);
      if (!['Tendencia', 'Hook', 'Estructura', 'Voz'].includes(category))
        throw new Error('Categoría inválida.');
      const conclusion = clean(body.conclusion, 2000, true),
        evidence = clean(body.evidence, 4000, true),
        source = clean(body.sourceUrl, 2000, true);
      const url = new URL(source);
      if (
        url.protocol !== 'https:' ||
        ![
          'x.com',
          'www.x.com',
          'twitter.com',
          'www.twitter.com',
          'linkedin.com',
          'www.linkedin.com',
        ].includes(url.hostname)
      )
        throw new Error('Usá una fuente de X o LinkedIn.');
      const existing = await database()
        .prepare(
          `SELECT ${insightColumns} FROM insights WHERE profile_id=? AND conclusion=? AND source_url=?`,
        )
        .bind(profile, conclusion, source)
        .first();
      if (existing) return Response.json({ insight: existing });
      const insight = await database()
        .prepare(
          `INSERT INTO insights (profile_id,category,conclusion,evidence,source_url,status,created_at) VALUES (?,?,?,?,?,'Pendiente',?) RETURNING ${insightColumns}`,
        )
        .bind(profile, category, conclusion, evidence, source, now)
        .first();
      return Response.json({ insight }, { status: 201 });
    }
    if (
      body.type !== 'job' ||
      !['Generación', 'Análisis'].includes(String(body.kind))
    )
      throw new Error('Solicitud inválida.');
    const job = await database()
      .prepare(
        `INSERT INTO editorial_jobs (profile_id,kind,status,message,created_at,updated_at) SELECT ?,?,'Pendiente','Se procesará en la próxima revisión de Astra.',?,? WHERE NOT EXISTS (SELECT 1 FROM editorial_jobs WHERE profile_id=? AND kind=? AND status='Pendiente') RETURNING ${jobColumns}`,
      )
      .bind(profile, body.kind, now, now, profile, body.kind)
      .first();
    return Response.json({ job, queued: true });
  } catch (error) {
    return bad(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const body = await payload(request);
    const profile = profileId(body.profileId);
    if (!Number.isInteger(body.id)) throw new Error('Registro inválido.');
    if (body.type === 'insight') {
      if (
        !['Pendiente', 'Aceptada', 'Descartada'].includes(String(body.status))
      )
        throw new Error('Estado inválido.');
      const insight = await database()
        .prepare(
          `UPDATE insights SET status=? WHERE id=? AND profile_id=? RETURNING ${insightColumns}`,
        )
        .bind(body.status, body.id, profile)
        .first();
      if (!insight)
        return Response.json(
          { error: 'Conclusión no encontrada.' },
          { status: 404 },
        );
      return Response.json({ insight });
    }
    if (
      body.type !== 'job' ||
      !['Completado', 'Error', 'Cancelado'].includes(String(body.status))
    )
      throw new Error('Estado inválido.');
    const job = await database()
      .prepare(
        `UPDATE editorial_jobs SET status=?,message=?,updated_at=? WHERE id=? AND profile_id=? RETURNING ${jobColumns}`,
      )
      .bind(
        body.status,
        clean(body.message ?? '', 2000),
        Date.now(),
        body.id,
        profile,
      )
      .first();
    if (!job)
      return Response.json(
        { error: 'Solicitud no encontrada.' },
        { status: 404 },
      );
    return Response.json({ job });
  } catch (error) {
    return bad(error);
  }
}
