import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function publicApiKey(): string | undefined {
  const directKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (directKey) return directKey;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}") as Record<string, string>;
    return Object.values(keys)[0];
  } catch {
    return undefined;
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Método no permitido." }, 405);

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonResponse({ error: "Se requiere iniciar sesión." }, 401);

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const apiKey = publicApiKey();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !apiKey || !serviceRoleKey) return jsonResponse({ error: "La función no está configurada." }, 500);

  const authClient = createClient(projectUrl, apiKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return jsonResponse({ error: "La sesión no es válida." }, 401);
  if (authData.user.app_metadata?.role !== "admin") return jsonResponse({ error: "No tienes permiso para consultar este dato." }, 403);

  const adminClient = createClient(projectUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  let count = 0;
  let page = 1;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) return jsonResponse({ error: "No se pudo consultar el total de usuarios." }, 502);
    count += data.users.length;
    if (data.users.length < pageSize) break;
    page += 1;
  }

  return jsonResponse({ count });
});
