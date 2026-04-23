import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "email, password e name são obrigatórios" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) {
      if (authError.message.includes("already")) {
        return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Create app-level profile in User table
    const { error: profileError } = await supabase.from("User").insert({
      id: authData.user.id,
      email,
      password: "managed-by-supabase-auth",
      name,
      role: "DOCTOR",
    });
    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // 3. Sign in to get a session token
    const { data: session } = await supabase.auth.signInWithPassword({ email, password });

    return NextResponse.json({
      accessToken: session?.session?.access_token,
      user: { id: authData.user.id, email, name, role: "DOCTOR" },
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
