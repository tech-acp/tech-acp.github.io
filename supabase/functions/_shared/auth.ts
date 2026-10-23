// Autorise le service role (appels internes / cron) ou le mot de passe admin envoyé dans le header x-admin-password.
// Le mot de passe n'existe que dans les secrets Supabase (ADMIN_PASSWORD), jamais dans le code du front.
async function sha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function isAuthorized(req: Request): Promise<boolean> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (token && token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) return true;

  const expected = Deno.env.get('ADMIN_PASSWORD');
  const given = req.headers.get('x-admin-password');
  if (!expected || !given) return false;
  // Comparaison des hash pour ne pas exposer le mot de passe via le temps de réponse
  return (await sha256(given)) === (await sha256(expected));
}
