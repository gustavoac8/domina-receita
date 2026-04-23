import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const STAGES = ["NEW", "QUALIFIED", "SCHEDULED", "ATTENDED", "RECURRING", "LOST"];

export async function GET(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  if (!clinicId) return NextResponse.json({ error: "clinicId obrigatório" }, { status: 400 });

  const { data: leads, error } = await supabase
    .from("Lead")
    .select("*")
    .eq("clinicId", clinicId)
    .order("updatedAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const board = Object.fromEntries(
    STAGES.map((s) => [s, (leads ?? []).filter((l: any) => l.stage === s)])
  );
  return NextResponse.json(board);
}
