import { env } from 'cloudflare:workers';

export function database() {
  return env.DB;
}
export function profileId(value: unknown) {
  if (value !== 'hype' && value !== 'sebastian')
    throw new Error('Perfil inválido.');
  return value;
}
export function clean(value: unknown, max: number, required = false) {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new Error('Revisá los campos y su longitud.');
  return value.trim();
}
export async function payload(request: Request) {
  if (Number(request.headers.get('content-length')) > 100000)
    throw new Error('El contenido es demasiado largo.');
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    throw new Error('Origen no permitido.');
  const body = await request.json();
  if (!body || Array.isArray(body) || typeof body !== 'object')
    throw new Error('Datos inválidos.');
  return body as Record<string, unknown>;
}
export function bad(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof Error && !/D1|SQLITE|database/i.test(error.message)
          ? error.message
          : 'No se pudo guardar o cargar. Intentá nuevamente.',
    },
    { status: 400 },
  );
}
export const contentColumns =
  'id, profile_id AS profileId, title, excerpt, platform, status, scheduled_at AS scheduledAt, generation_key AS generationKey, created_at AS createdAt, updated_at AS updatedAt';
export const profileColumns =
  'id, name, kind, initials, audience, goals, voice_summary AS voiceSummary, reference_accounts AS referenceAccounts, linkedin_frequency AS linkedinFrequency, x_frequency AS xFrequency, require_approval AS requireApproval';
