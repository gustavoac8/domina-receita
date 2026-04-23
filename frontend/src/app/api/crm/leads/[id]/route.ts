import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id } = await params;

  const { data, error } = await supabase
    .from("Lead")
    .select("*, LeadActivity(*)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  return NextResponse.json(data);
}
