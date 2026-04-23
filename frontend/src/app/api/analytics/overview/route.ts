import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  if (!clinicId) return NextResponse.json({ error: "clinicId obrigatório" }, { status: 400 });

  const [leadsRes, campaignsRes] = await Promise.all([
    supabase.from("Lead").select("*").eq("clinicId", clinicId),
    supabase.from("Campaign").select("*").eq("clinicId", clinicId),
  ]);

  const leads = leadsRes.data ?? [];
  const campaigns = campaignsRes.data ?? [];

  const leadsByStage = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.stage] = (acc[l.stage] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = leads
    .filter((l) => l.stage === "ATTENDED" || l.stage === "RECURRING")
    .reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.spent ?? 0), 0);
  const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

  const byChannel = campaigns.reduce<Record<string, any>>((acc, c) => {
    const ch = c.channel;
    acc[ch] = acc[ch] || { spent: 0, leads: 0, revenue: 0 };
    acc[ch].spent += Number(c.spent ?? 0);
    acc[ch].leads += c.leadsCount ?? 0;
    acc[ch].revenue += Number(c.revenue ?? 0);
    return acc;
  }, {});

  const ticketMedio = leads.length > 0
    ? leads.reduce((s, l) => s + Number(l.value ?? 0), 0) / leads.length
    : 0;

  const now = Date.now();
  const last30 = leads.filter(
    (l) => now - new Date(l.createdAt).getTime() <= 30 * 24 * 3600 * 1000 &&
      (l.stage === "ATTENDED" || l.stage === "RECURRING")
  );
  const revenueLast30 = last30.reduce((s, l) => s + Number(l.value ?? 0), 0);

  return NextResponse.json({
    kpis: { leadsTotal: leads.length, leadsByStage, totalRevenue, totalSpent, roas: +roas.toFixed(2), ticketMedio: +ticketMedio.toFixed(2) },
    byChannel,
    forecast: { revenue30d: revenueLast30, revenue60d: revenueLast30 * 2, revenue90d: revenueLast30 * 3 },
  });
}
