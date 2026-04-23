import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;

  const { data } = await supabase.from("FollowupTemplate").select("*").order("code", { ascending: true });
  return NextResponse.json(data ?? []);
}

export async function PUT(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const body = await req.json();

  const { data, error } = await supabase
    .from("FollowupTemplate")
    .upsert(body, { onConflict: "code" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
