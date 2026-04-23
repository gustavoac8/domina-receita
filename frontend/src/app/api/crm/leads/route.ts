import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** Helper: get or create default clinic for a user */
async function getOrCreateClinic(supabase: ReturnType<typeof createServiceClient>, userId: string, clinicId?: string) {
  if (clinicId) {
    const { data } = await supabase.from("Clinic").select("*").eq("id", clinicId).single();
    if (!data) return null;
    return data;
  }
  let { data: clinic } = await supabase.from("Clinic").select("*").eq("ownerId", userId).limit(1).single();
  if (!clinic) {
    const { data: created } = await supabase
      .from("Clinic")
      .insert({ name: "Minha Clínica", specialty: "Geral", city: "Não informada", ownerId: userId })
      .select()
      .single();
    clinic = created;
  }
  return clinic;
}

export async function GET(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  const stage = searchParams.get("stage");

  if (!clinicId) return NextResponse.json({ error: "clinicId obrigatório" }, { status: 400 });

  let query = supabase.from("Lead").select("*, LeadActivity(*)").eq("clinicId", clinicId).order("updatedAt", { ascending: false });
  if (stage) query = query.eq("stage", stage);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { user, supabase } = result;

  const body = await req.json();
  const clinic = await getOrCreateClinic(supabase, user.id, body.clinicId);
  if (!clinic) return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });

  const { data: lead, error } = await supabase
    .from("Lead")
    .insert({
      clinicId: clinic.id,
      name: body.name,
      phone: body.phone,
      email: body.email,
      source: body.source,
      procedure: body.procedure,
      value: body.value,
      tags: body.tags ?? [],
      notes: body.notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Register D0 activity
  await supabase.from("LeadActivity").insert({
    leadId: lead.id,
    kind: "auto_followup",
    payload: { step: "D0", template: "boas-vindas", scheduledFor: new Date().toISOString() },
  });

  return NextResponse.json(lead, { status: 201 });
}
