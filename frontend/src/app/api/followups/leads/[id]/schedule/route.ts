import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id: leadId } = await params;
  const { templateCode, when } = await req.json();

  const { data: lead } = await supabase.from("Lead").select("clinicId").eq("id", leadId).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  const { data: tpl } = await supabase.from("FollowupTemplate").select("*").eq("code", templateCode).single();
  if (!tpl) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });

  const scheduledFor = when ?? new Date(Date.now() + (tpl.delayDays ?? 0) * 86400000).toISOString();

  const { data, error } = await supabase
    .from("FollowupJob")
    .insert({ leadId, clinicId: lead.clinicId, templateCode, channel: tpl.channel, scheduledFor })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
