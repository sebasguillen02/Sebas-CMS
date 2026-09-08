import {
  bad,
  clean,
  database,
  payload,
  profileColumns,
  profileId,
} from '@/lib/cms-server';
const profileSeeds = [
  {
    id: 'hype',
    name: 'Hype',
    kind: 'Empresa',
    initials: 'HY',
    audience:
      'Fundadores, inversores y personas interesadas en startups y tecnología.',
    goals: 'Construir autoridad, generar comunidad y aumentar el alcance.',
    voiceSummary:
      'Directa, ambiciosa y clara. Frases breves, ideas contundentes y foco en construir compañías reales junto a creadores. Sin lenguaje corporativo vacío.',
    referenceAccounts:
      'https://x.com/hypeco0\nhttps://www.linkedin.com/company/hype-c0/posts/',
    linkedinFrequency: 3,
    xFrequency: 5,
    requireApproval: true,
  },
  {
    id: 'sebastian',
    name: 'Sebastián',
    kind: 'Marca personal',
    initials: 'SM',
    audience:
      'Fundadores, inversores y personas del ecosistema startup y tecnología.',
    goals:
      'Construir autoridad personal, generar comunidad y aumentar el alcance.',
    voiceSummary:
      'Perfil listo para definir con ejemplos personales. Debe sentirse humano, específico y basado en experiencia propia.',
    referenceAccounts: '',
    linkedinFrequency: 0,
    xFrequency: 0,
    requireApproval: true,
  },
];

export async function GET() {
  try {
    const now = Date.now();
    await database().batch(
      profileSeeds.map((p) =>
        database()
          .prepare(
            'INSERT OR IGNORE INTO editorial_profiles (id,name,kind,initials,audience,goals,voice_summary,reference_accounts,linkedin_frequency,x_frequency,require_approval,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
          )
          .bind(
            p.id,
            p.name,
            p.kind,
            p.initials,
            p.audience,
            p.goals,
            p.voiceSummary,
            p.referenceAccounts,
            p.linkedinFrequency,
            p.xFrequency,
            1,
            now,
            now,
          ),
      ),
    );
    const { results: profiles } = await database()
      .prepare(`SELECT ${profileColumns} FROM editorial_profiles`)
      .all();
    return Response.json({ profiles });
  } catch (error) {
    return bad(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const body = await payload(request);
    const id = profileId(body.id);
    const frequency = (value: unknown) => {
      if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 21
      )
        throw new Error('La frecuencia debe estar entre 0 y 21.');
      return value;
    };
    const refs = clean(body.referenceAccounts, 4000);
    for (const ref of refs
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)) {
      let url: URL;
      try {
        url = new URL(ref);
      } catch {
        throw new Error('Ingresá una URL completa por cuenta.');
      }
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
        throw new Error(
          'Las referencias deben ser enlaces HTTPS de X o LinkedIn.',
        );
    }
    const profile = await database()
      .prepare(
        `UPDATE editorial_profiles SET audience=?,goals=?,voice_summary=?,reference_accounts=?,linkedin_frequency=?,x_frequency=?,updated_at=? WHERE id=? RETURNING ${profileColumns}`,
      )
      .bind(
        clean(body.audience, 500),
        clean(body.goals, 500),
        clean(body.voiceSummary, 2000),
        refs,
        frequency(body.linkedinFrequency),
        frequency(body.xFrequency),
        Date.now(),
        id,
      )
      .first();
    if (!profile)
      return Response.json(
        { error: 'Perfil no encontrado. Recargá la página.' },
        { status: 404 },
      );
    return Response.json({ profile });
  } catch (error) {
    return bad(error);
  }
}
