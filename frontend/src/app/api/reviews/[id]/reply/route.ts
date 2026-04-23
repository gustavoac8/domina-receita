import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id } = await params;
  const { text } = await req.json();

  const { data: review } = await supabase.from("Review").select("*").eq("id", id).single();
  if (!review) return NextResponse.json({ error: "Review não encontrada" }, { status: 404 });

  const { data, error } = await supabase
    .from("Review")
    .update({ reply: text, repliedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
