import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "email e password são obrigatórios" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Get app-level profile
    const { data: profile } = await supabase
      .from("User")
      .select("id, email, name, role")
      .eq("id", data.user.id)
      .single();

    return NextResponse.json({
      accessToken: data.session.access_token,
      user: profile ?? { id: data.user.id, email, name: email, role: "DOCTOR" },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
