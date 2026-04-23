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

  const { data } = await supabase
    .from("FollowupJob")
    .select("*, Lead(name, phone)")
    .eq("clinicId", clinicId)
    .order("scheduledFor", { ascending: true })
    .limit(200);

  return NextResponse.json(data ?? []);
}
