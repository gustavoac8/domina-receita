import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** Public endpoint — captures leads from the marketing site form. No auth required. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("MarketingLead")
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        specialty: body.specialty,
        city: body.city,
        source: body.utm?.source || "organic",
        utm: body.utm ?? null,
        stage: "NEW",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("Public lead capture error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
