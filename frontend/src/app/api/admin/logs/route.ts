import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const result = await requireSuperAdmin(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);

  const { data } = await supabase
    .from("AuditLog")
    .select("*")
    .order("createdAt", { ascending: false })
    .limit(limit);

  return NextResponse.json(data ?? []);
}
