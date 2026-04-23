import { NextResponse } from "next/server";
import { createServiceClient } from "./supabase-server";

/**
 * Extracts and validates the authenticated user from a Supabase JWT in the
 * Authorization header.  Returns the user profile from the `User` table
 * (id, email, name, role) or a 401 NextResponse.
 */
export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Token ausente" }, { status: 401 }) };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createServiceClient();

  // Validate the JWT with Supabase Auth
  const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
  if (error || !authUser) {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }

  // Get app-level profile
  const { data: profile } = await supabase
    .from("User")
    .select("id, email, name, role")
    .eq("id", authUser.id)
    .single();

  if (!profile) {
    return { error: NextResponse.json({ error: "Perfil não encontrado" }, { status: 401 }) };
  }

  return { user: profile, supabase };
}

/**
 * Require the user to be SUPER_ADMIN. Returns 403 if not.
 */
export async function requireSuperAdmin(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result;
  if (result.user.role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }) };
  }
  return result;
}
