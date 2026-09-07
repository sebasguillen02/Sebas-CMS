import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { editorialProfiles } from '@/db/schema';

const profileSeeds = [
  {
    id: 'hype', name: 'Hype', kind: 'Empresa', initials: 'HY',
    audience: 'Fundadores, inversores y personas interesadas en startups y tecnología.',
    goals: 'Construir autoridad, generar comunidad y aumentar el alcance.',
    voiceSummary: 'Directa, ambiciosa y clara. Frases breves, ideas contundentes y foco en construir compañías reales junto a creadores. Sin lenguaje corporativo vacío.',
    referenceAccounts: 'https://x.com/hypeco0\nhttps://www.linkedin.com/company/hype-c0/posts/',
    linkedinFrequency: 3, xFrequency: 5, requireApproval: true,
  },
  {
    id: 'sebastian', name: 'Sebastián', kind: 'Marca personal', initials: 'SM',
    audience: 'Fundadores, inversores y personas del ecosistema startup y tecnología.',
    goals: 'Construir autoridad personal, generar comunidad y aumentar el alcance.',
    voiceSummary: 'Perfil listo para definir con ejemplos personales. Debe sentirse humano, específico y basado en experiencia propia.',
    referenceAccounts: '', linkedinFrequency: 0, xFrequency: 0, requireApproval: true,
  },
];

export async function GET() {
  const db = getDb();
  const now = new Date();
  await db.insert(editorialProfiles).values(profileSeeds.map((profile) => ({ ...profile, createdAt: now, updatedAt: now }))).onConflictDoNothing();
  return Response.json({ profiles: await db.select().from(editorialProfiles) });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const id = body.id === 'hype' || body.id === 'sebastian' ? body.id : null;
  if (!id) return Response.json({ error: 'Perfil inválido.' }, { status: 400 });
  const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const [profile] = await getDb().update(editorialProfiles).set({
    audience: clean(body.audience, 500), goals: clean(body.goals, 500),
    voiceSummary: clean(body.voiceSummary, 2000), referenceAccounts: clean(body.referenceAccounts, 4000),
    updatedAt: new Date(),
  }).where(eq(editorialProfiles.id, id)).returning();
  return Response.json({ profile });
}
