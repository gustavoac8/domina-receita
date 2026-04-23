import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id } = await params;

  const { data } = await supabase.from("ActionPlan").select("*").eq("id", id).single();
  if (!data) return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  return NextResponse.json(data);
}
