import { NextResponse } from "next/server";
import { aiComplete } from "@/lib/ai-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { prompt, system } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "prompt é obrigatório" }, { status: 400 });
    }

    const result = await aiComplete(prompt, system);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ error: "Erro ao chamar IA" }, { status: 500 });
  }
}
