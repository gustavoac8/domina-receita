import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;

  const { user, supabase } = result;

  // Include clinics
  const { data: clinics } = await supabase
    .from("Clinic")
    .select("id, name, specialty, city")
    .eq("ownerId", user.id);

  return NextResponse.json({ ...user, clinics: clinics ?? [] });
}
