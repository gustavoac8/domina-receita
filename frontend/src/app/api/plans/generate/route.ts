import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const WEEKS = [
  { week: 1, focus: "Setup & Diagnóstico", tasks: ["Rodar diagnóstico IA","Auditar GMB","Ajustar perfis Instagram/Facebook","Instalar pixels Meta/Google"] },
  { week: 2, focus: "Site + Funil", tasks: ["Gerar site otimizado","Publicar","Configurar agendamento online","Integrar WhatsApp Business"] },
  { week: 3, focus: "Conteúdo base", tasks: ["Produzir 3 Reels","Publicar 2 artigos SEO","Coletar depoimentos em vídeo"] },
  { week: 4, focus: "Lançar ADS — fase 1", tasks: ["Campanha Meta Leads","Campanha Google Search","Orçamento R$100/dia cada"] },
  { week: 5, focus: "Otimização ADS", tasks: ["Pausar criativos com CTR < 1%","Dobrar orçamento do top set","Testar novos ângulos de copy"] },
  { week: 6, focus: "CRM Operacional", tasks: ["Treinar recepção em script","Ativar follow-ups D0/D2/D5/D10","Revisar taxas de qualificação"] },
  { week: 7, focus: "Prova social escala", tasks: ["Campanha de coleta de reviews Google","Responder todas as avaliações","Editar reel de depoimentos"] },
  { week: 8, focus: "Remarketing", tasks: ["Audiência de visitantes 30d","Lookalike 1% de pagantes","Anúncio de 'por que adiar?'"] },
  { week: 9, focus: "Upsell + Retornos", tasks: ["Campanha de pacote anual","Ativar lembretes de retorno 6m","Script de upsell"] },
  { week: 10, focus: "Conteúdo premium", tasks: ["Webinar gratuito","Lead magnet (ebook)","Nutrição por email"] },
  { week: 11, focus: "Indicações", tasks: ["Lançar programa Indique e Ganhe","Campanha WhatsApp para base","Gerar códigos únicos"] },
  { week: 12, focus: "Revisão & Escala", tasks: ["Análise de ROAS por canal","Expandir orçamento em canais lucrativos","Planejar próximos 90 dias"] },
  { week: 13, focus: "Consolidação", tasks: ["Relatório executivo","Ajuste de posicionamento","Meta de faturamento atualizada"] },
];

export async function POST(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { user, supabase } = result;
  const body = await req.json();

  let clinicId = body.clinicId;
  if (!clinicId) {
    let { data: clinic } = await supabase.from("Clinic").select("*").eq("ownerId", user.id).limit(1).single();
    if (!clinic) {
      const { data: created } = await supabase.from("Clinic").insert({ name: "Minha Clínica", specialty: "Geral", city: "Não informada", ownerId: user.id }).select().single();
      clinic = created;
    }
    clinicId = clinic?.id;
  }

  const { data: clinic } = await supabase.from("Clinic").select("specialty, city").eq("id", clinicId).single();

  const { data, error } = await supabase
    .from("ActionPlan")
    .insert({
      clinicId,
      title: `Plano 90 dias — ${clinic?.specialty ?? "Geral"} em ${clinic?.city ?? ""}`,
      weeks: WEEKS,
      budgetSuggested: 12000,
      kpis: { leadsEsperados: 300, agendamentosEsperados: 120, conversaoLeadParaAgenda: 0.4, conversaoAgendaParaCompareceu: 0.7, ticketMedio: 1200, receitaProjetada: 100800, roas: 8.4 },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
