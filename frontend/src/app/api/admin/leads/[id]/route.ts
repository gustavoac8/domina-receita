import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireSuperAdmin(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabase.from("MarketingLead").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireSuperAdmin(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id } = await params;

  const { error } = await supabase.from("MarketingLead").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
