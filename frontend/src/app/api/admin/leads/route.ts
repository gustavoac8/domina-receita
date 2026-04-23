import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const result = await requireSuperAdmin(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");

  let query = supabase.from("MarketingLead").select("*").order("createdAt", { ascending: false });
  if (stage) query = query.eq("stage", stage);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const result = await requireSuperAdmin(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const body = await req.json();

  const { data, error } = await supabase.from("MarketingLead").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
