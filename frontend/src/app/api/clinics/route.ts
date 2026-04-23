import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { user, supabase } = result;

  const { data, error } = await supabase
    .from("Clinic")
    .select("*")
    .eq("ownerId", user.id)
    .order("createdAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { user, supabase } = result;

  const body = await req.json();
  const { data, error } = await supabase
    .from("Clinic")
    .insert({ ...body, ownerId: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
