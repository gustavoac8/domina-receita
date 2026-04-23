import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { aiComplete } from "@/lib/ai-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { id } = await params;

  const { data: review } = await supabase.from("Review").select("*").eq("id", id).single();
  if (!review) return NextResponse.json({ error: "Review não encontrada" }, { status: 404 });

  const tone = review.rating >= 4
    ? "agradecimento caloroso e convite para retornar"
    : review.rating === 3
      ? "empatia, pedido de desculpas leve e convite para falar pelo WhatsApp"
      : "empatia profunda, responsabilidade sem expor dados clínicos, convite para resolver pelo WhatsApp";

  const prompt = `Você é gerente de reputação de uma clínica médica.
Escreva UMA resposta curta (até 350 caracteres), em português do Brasil, tom ${tone},
sem nomear procedimentos clínicos nem expor dados sensíveis, assinando como "Equipe da clínica".
Avaliação (${review.rating} estrelas) de ${review.authorName ?? "paciente"}:
"""${review.comment ?? ""}"""`;

  const draft = await aiComplete(prompt);
  await supabase.from("Review").update({ replyDraft: draft }).eq("id", id);

  return NextResponse.json({ draft });
}
