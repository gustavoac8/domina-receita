import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id } = await params;
  const { status } = await req.json();

  const { data, error } = await supabase.from("Campaign").update({ status }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
