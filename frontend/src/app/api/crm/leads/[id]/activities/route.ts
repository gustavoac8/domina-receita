import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id } = await params;
  const { kind, payload } = await req.json();

  const { data: lead } = await supabase.from("Lead").select("id").eq("id", id).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  const { data, error } = await supabase
    .from("LeadActivity")
    .insert({ leadId: id, kind, payload })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
