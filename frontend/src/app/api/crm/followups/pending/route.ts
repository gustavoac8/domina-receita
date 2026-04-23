import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const STEPS = [
  { step: "D0", days: 0, template: "boas-vindas" },
  { step: "D2", days: 2, template: "lembrete-valor" },
  { step: "D5", days: 5, template: "prova-social" },
  { step: "D10", days: 10, template: "oferta-limitada" },
];

export async function GET(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  if (!clinicId) return NextResponse.json({ error: "clinicId obrigatório" }, { status: 400 });

  const { data: leads } = await supabase
    .from("Lead")
    .select("*, LeadActivity(*)")
    .eq("clinicId", clinicId);

  const now = Date.now();
  const pending: any[] = [];

  for (const lead of leads ?? []) {
    const createdAt = new Date(lead.createdAt).getTime();
    for (const s of STEPS) {
      const due = createdAt + s.days * 24 * 3600 * 1000;
      if (due > now) continue;
      const already = (lead.LeadActivity ?? []).some(
        (a: any) => a.kind === "auto_followup" && a.payload?.step === s.step && a.payload?.sent === true
      );
      if (!already) {
        pending.push({
          leadId: lead.id,
          leadName: lead.name,
          phone: lead.phone,
          step: s.step,
          template: s.template,
          dueAt: new Date(due).toISOString(),
        });
      }
    }
  }
  return NextResponse.json(pending);
}
