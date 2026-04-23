import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const result = await requireSuperAdmin(req);
  if ("error" in result) return result.error;
  const { supabase } = result;

  const [clinicsRes, leadsRes, trialRes] = await Promise.all([
    supabase.from("Clinic").select("id", { count: "exact", head: true }),
    supabase.from("MarketingLead").select("stage"),
    supabase.from("MarketingLead").select("id", { count: "exact", head: true }).eq("stage", "TRIAL"),
  ]);

  const leadsPorEstagio = (leadsRes.data ?? []).reduce<Record<string, number>>((acc, l: any) => {
    acc[l.stage] = (acc[l.stage] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    clinicasAtivas: clinicsRes.count ?? 0,
    leadsPorEstagio,
    trialsAtivos: trialRes.count ?? 0,
    mrrEstimado: (clinicsRes.count ?? 0) * 742,
  });
}
