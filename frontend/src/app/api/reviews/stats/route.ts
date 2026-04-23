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

  const { data, count } = await supabase.from("Review").select("rating", { count: "exact" }).eq("clinicId", clinicId);
  const ratings = (data ?? []).map((r: any) => r.rating);
  const avg = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

  return NextResponse.json({ _avg: { rating: +avg.toFixed(2) }, _count: count ?? 0 });
}
