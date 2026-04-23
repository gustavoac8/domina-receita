import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const result = await requireSuperAdmin(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const specialty = searchParams.get("specialty");

  let query = supabase.from("Clinic").select("*, User(id, email, name)").order("createdAt", { ascending: false });
  if (specialty) query = query.eq("specialty", specialty);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}
