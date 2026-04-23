import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id: leadId } = await params;

  const { data: lead } = await supabase.from("Lead").select("clinicId, createdAt").eq("id", leadId).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  const codes = ["D0", "D2", "D5", "D10"];
  const base = new Date(lead.createdAt).getTime();
  const created: any[] = [];

  for (const code of codes) {
    const { data: tpl } = await supabase.from("FollowupTemplate").select("*").eq("code", code).single();
    if (!tpl || !tpl.enabled) continue;

    // Skip if already exists
    const { data: existing } = await supabase
      .from("FollowupJob")
      .select("id")
      .eq("leadId", leadId)
      .eq("templateCode", code)
      .in("status", ["PENDING", "SENT"])
      .limit(1);
    if (existing && existing.length > 0) continue;

    const { data: job } = await supabase
      .from("FollowupJob")
      .insert({
        leadId,
        clinicId: lead.clinicId,
        templateCode: code,
        channel: tpl.channel,
        scheduledFor: new Date(base + (tpl.delayDays ?? 0) * 86400000).toISOString(),
      })
      .select()
      .single();
    if (job) created.push(job);
  }

  return NextResponse.json(created, { status: 201 });
}
