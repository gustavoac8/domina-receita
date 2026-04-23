import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { aiComplete } from "@/lib/ai-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  if (!clinicId) return NextResponse.json({ error: "clinicId obrigatório" }, { status: 400 });

  const { data } = await supabase.from("Diagnosis").select("*").eq("clinicId", clinicId).order("createdAt", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const result = await getAuthUser(req);
  if ("error" in result) return result.error;
  const { user, supabase } = result;
  const body = await req.json();

  // Get or create clinic
  let clinicId = body.clinicId;
  if (!clinicId) {
    let { data: clinic } = await supabase.from("Clinic").select("id").eq("ownerId", user.id).limit(1).single();
    if (!clinic) {
      const { data: created } = await supabase
        .from("Clinic")
        .insert({ name: "Minha Clínica", specialty: body.specialty || "Geral", city: body.city || "Não informada", ownerId: user.id })
        .select("id")
        .single();
      clinic = created;
    }
    clinicId = clinic?.id;
  }

  const analysis = await runAnalysis(body);

  const { data, error } = await supabase
    .from("Diagnosis")
    .insert({
      clinicId,
      specialty: body.specialty,
      city: body.city,
      district: body.district,
      score: analysis.score,
      competitors: analysis.competitors,
      weaknesses: analysis.weaknesses,
      attackPlan: analysis.attackPlan,
      summary: analysis.summary,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

async function runAnalysis(dto: { specialty: string; city: string; district?: string }) {
  const prompt = [
    `Especialidade: ${dto.specialty}`,
    `Cidade: ${dto.city}`,
    dto.district ? `Bairro: ${dto.district}` : "",
    "",
    "Analise os top 10 concorrentes prováveis neste mercado.",
    "Para cada concorrente: nome fictício plausível, site/IG hipotéticos, posicionamento, preço aparente, força de SEO, anúncios ativos estimados.",
    "Liste 5 fraquezas exploráveis do mercado.",
    "Monte plano de ataque em 4 pilares (SEO, Tráfego Pago, Conteúdo, Prova Social) com ações concretas de 90 dias.",
    "Atribua score 0-100 de oportunidade.",
    "Retorne SOMENTE JSON válido com as chaves: competitors, weaknesses, attackPlan, score, summary.",
  ].filter(Boolean).join("\n");

  const system = "Você é um consultor sênior de marketing médico. Analise o mercado e retorne JSON com { competitors[], weaknesses[], attackPlan, score(0-100), summary }.";

  const raw = await aiComplete(prompt, system);
  const parsed = safeParseJson(raw);
  if (parsed && Array.isArray(parsed.competitors) && typeof parsed.score === "number") {
    return normalize(parsed);
  }
  return heuristicAnalysis(dto);
}

function safeParseJson(raw: string): any | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try { return JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
}

function normalize(p: any) {
  return {
    competitors: p.competitors ?? [],
    weaknesses: p.weaknesses ?? [],
    attackPlan: p.attackPlan ?? {},
    score: Math.max(0, Math.min(100, Math.round(p.score ?? 50))),
    summary: (p.summary ?? "").toString().slice(0, 4000),
  };
}

function heuristicAnalysis(dto: { specialty: string; city: string; district?: string }) {
  const { specialty, city, district } = dto;
  const base = `${specialty} em ${city}${district ? ` (${district})` : ""}`;
  const names = ["Aurora","Bellavita","CoraVita","Derma Nova","Elegance","Florescer","Harmony","Ilhas","Lumière","Mediplus"];
  const competitors = names.map((n, i) => ({
    rank: i + 1, name: `${specialty.split(" ")[0]} ${n}`,
    site: `https://clinica${i+1}.${city.toLowerCase().replace(/\s/g,"")}.com.br`,
    positioning: i < 3 ? "premium" : i < 7 ? "intermediário" : "popular",
    seoStrength: i < 3 ? "alta" : i < 7 ? "média" : "baixa",
    averagePrice: 200 + i * 50,
  }));
  return {
    competitors, score: 72,
    weaknesses: ["Sites lentos e não otimizados para mobile","Pouca produção de conteúdo em vídeo","Ausência de prova social estruturada","Funis de WhatsApp sem qualificação","Remarketing quase inexistente"],
    attackPlan: { seo: ["Publicar 2 artigos/semana","Implementar schema.org médico"], trafegoPago: ["Meta Ads: campanha de leads","Google Ads: rede de pesquisa"], conteudo: ["Reels semanais","Webinar mensal"], provaSocial: ["Coleta de avaliações Google","Depoimentos em vídeo"] },
    summary: `Mercado de ${base} com score 72/100 — viável dominar em 90 dias.`,
  };
}
