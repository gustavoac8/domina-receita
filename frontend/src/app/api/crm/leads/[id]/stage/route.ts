import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id } = await params;
  const { stage } = await req.json();

  // Get current lead for activity log
  const { data: lead } = await supabase.from("Lead").select("stage").eq("id", id).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  const { data, error } = await supabase.from("Lead").update({ stage }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log stage change activity
  await supabase.from("LeadActivity").insert({
    leadId: id,
    kind: "stage_change",
    payload: { from: lead.stage, to: stage },
  });

  return NextResponse.json(data);
}
