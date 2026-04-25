import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { ClinicsService } from '../clinics/clinics.service';
import {
  PlacesService,
  RealCompetitor,
} from '../integrations/google/places.service';
import { CreateDiagnosticoDto } from './dto/diagnostico.dto';

/**
 * Módulo 1: Diagnóstico IA dos Concorrentes.
 *
 * Fluxo:
 *   1. Usuário envia (especialidade, cidade, bairro).
 *   2. Service chama IA para gerar análise estruturada.
 *   3. Normaliza em { competitors[], weaknesses[], attackPlan, score, summary }.
 *   4. Persiste em Diagnosis e retorna.
 */
@Injectable()
export class DiagnosticoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly clinics: ClinicsService,
    private readonly places: PlacesService,
  ) {}

  async create(userId: string, dto: CreateDiagnosticoDto) {
    const clinic = dto.clinicId
      ? await this.clinics.findOne(dto.clinicId)
      : await this.clinics.getOrCreateDefault(userId);

    const analysis = await this.runAnalysis(dto);

    return this.prisma.diagnosis.create({
      data: {
        clinicId: clinic.id,
        specialty: dto.specialty,
        city: dto.city,
        district: dto.district,
        score: analysis.score,
        competitors: analysis.competitors,
        weaknesses: analysis.weaknesses,
        attackPlan: analysis.attackPlan,
        summary: analysis.summary,
      },
    });
  }

  async findOne(id: string) {
    const d = await this.prisma.diagnosis.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Diagnóstico não encontrado');
    return d;
  }

  async listByClinic(clinicId: string) {
    return this.prisma.diagnosis.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------- IA ----------
  private async runAnalysis(dto: CreateDiagnosticoDto) {
    // 1. Busca concorrentes REAIS via Google Places (ground truth)
    const realCompetitors = await this.places.findCompetitors(
      dto.specialty,
      dto.city,
      dto.district,
      10,
    );

    // 2. Monta prompt com lista real (Claude analisa em vez de inventar)
    const prompt = this.buildPrompt(dto, realCompetitors);
    const system =
      'You are a senior medical marketing consultant. ' +
      'Output ONLY a single valid JSON object — no prose, no code fences, no commentary. ' +
      'Use EXACTLY these English keys: competitors, weaknesses, attackPlan, score, summary. ' +
      'The response will be parsed by a strict JSON parser.';

    const raw = await this.ai.complete(prompt, system);

    // Log para debug em produção (não loga conteúdo sensível, apenas tamanho e prefixo)
    // eslint-disable-next-line no-console
    console.log(
      `[Diagnostico] AI raw response length=${raw?.length ?? 0}, head=${(raw ?? '').slice(0, 300).replace(/\n/g, ' ')}, tail=${(raw ?? '').slice(-200).replace(/\n/g, ' ')}`,
    );

    // Tenta extrair JSON da resposta. Se falhar, usa o heurístico.
    const parsed = this.safeParseJson(raw);
    if (parsed && this.looksLikeAnalysis(parsed)) {
      // eslint-disable-next-line no-console
      console.log(`[Diagnostico] AI response parsed OK, using AI analysis`);
      return this.normalize(parsed);
    }
    // eslint-disable-next-line no-console
    console.warn(
      `[Diagnostico] AI response NOT parseable as expected schema, falling back to heuristic. parsed=${!!parsed}`,
    );
    return this.heuristicAnalysis(dto);
  }

  private buildPrompt(
    dto: CreateDiagnosticoDto,
    realCompetitors: RealCompetitor[] = [],
  ) {
    const { specialty, city, district } = dto;
    const location = district ? `${city} (${district})` : city;

    // Bloco com concorrentes REAIS encontrados via Google Places (ground truth).
    // Quando não houver dados (API key não configurada ou zero resultados), o
    // Claude faz fallback inventando, mas com aviso claro no prompt.
    const realCompetitorsBlock =
      realCompetitors.length > 0
        ? `CONCORRENTES REAIS encontrados via Google Places na localidade (USE ESTES nomes; NÃO invente):
${realCompetitors
  .map(
    (c, i) =>
      `${i + 1}. "${c.name}"${c.rating ? ` — rating ${c.rating} (${c.reviewCount ?? 0} reviews)` : ''}${
        c.website ? ` — site: ${c.website}` : ''
      }${c.phone ? ` — tel: ${c.phone}` : ''}${
        c.address ? ` — ${c.address}` : ''
      }`,
  )
  .join('\n')}

Use EXATAMENTE esses nomes no campo "name" de cada competitor. Mantenha o site real quando existir. Para os outros campos (positioning, seoStrength, estimatedAds*, averagePrice), use o seu julgamento baseado em rating, número de reviews e site (se tiver website forte e muitos reviews → premium/alta; se não tem site → popular/baixa).`
        : `AVISO: Não foi possível buscar concorrentes reais via Google Places (API indisponível ou zero resultados). Invente 10 nomes fictícios plausíveis para a localidade.`;

    return `Analise o mercado de "${specialty}" em ${location}.

${realCompetitorsBlock}

Você DEVE retornar APENAS um objeto JSON válido (sem markdown, sem prosa antes ou depois).
Use EXATAMENTE este formato (chaves em INGLÊS):

{
  "competitors": [
    {
      "rank": 1,
      "name": "Nome do concorrente (use os nomes REAIS da lista acima quando houver)",
      "site": "https://site-real-ou-vazio.com.br",
      "instagram": "@perfil_estimado",
      "positioning": "premium" ou "intermediário" ou "popular",
      "seoStrength": "alta" ou "média" ou "baixa",
      "estimatedAdsMeta": 5,
      "estimatedAdsGoogle": 3,
      "averagePrice": 500,
      "rating": 4.7,
      "reviewCount": 120
    }
  ],
  "weaknesses": ["fraqueza 1", "fraqueza 2", "fraqueza 3", "fraqueza 4", "fraqueza 5"],
  "attackPlan": {
    "seo": ["ação 1", "ação 2"],
    "trafegoPago": ["ação 1", "ação 2"],
    "conteudo": ["ação 1", "ação 2"],
    "provaSocial": ["ação 1", "ação 2"]
  },
  "score": 75,
  "summary": "Resumo executivo de 2-3 frases sobre o mercado e a oportunidade."
}

Regras:
- Liste exatamente ${realCompetitors.length > 0 ? Math.min(realCompetitors.length, 10) : 10} concorrentes em "competitors" (rank por relevância: 1 = principal).
- Liste exatamente 5 fraquezas em "weaknesses".
- Cada pilar do "attackPlan" deve ter 2-3 ações concretas de 90 dias.
- "score" é número inteiro 0-100 (100 = muito fácil dominar).
- "summary" tem no máximo 600 caracteres.
- Inclua "rating" e "reviewCount" quando os dados reais estiverem disponíveis.
- Use português nas strings de conteúdo, mas mantenha os NOMES DAS CHAVES em inglês exatamente como acima.
- Não inclua texto fora do JSON. Não use \`\`\`json. Apenas o objeto JSON.`;
  }

  private safeParseJson(raw: string): any | null {
    if (!raw) return null;
    // Remove markdown code fences (```json ... ``` ou ``` ... ```), inclusive em qualquer posição.
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/```(?:json)?/gi, '');
    cleaned = cleaned.trim();

    // Procura o primeiro `{` e usa bracket-counting para achar seu `}` correspondente.
    // Isso é mais robusto que lastIndexOf('}'), pois ignora `}` em comentários após o JSON.
    const start = cleaned.indexOf('{');
    if (start < 0) return null;

    let depth = 0;
    let end = -1;
    let inString = false;
    let escape = false;
    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end < 0) {
      // Fallback: tenta com lastIndexOf
      end = cleaned.lastIndexOf('}');
      if (end < 0) return null;
    }

    const candidate = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.warn(
        `[Diagnostico] JSON.parse failed: ${err?.message?.slice(0, 200)}. candidate_length=${candidate.length}, candidate_head=${candidate.slice(0, 200).replace(/\n/g, ' ')}, candidate_tail=${candidate.slice(-200).replace(/\n/g, ' ')}`,
      );
      return null;
    }
  }

  private looksLikeAnalysis(p: any) {
    if (!p) return false;
    // Aceita chaves em inglês (esperado) OU português (caso o modelo traduza).
    const competitors = p.competitors ?? p.concorrentes;
    const score = p.score ?? p.pontuacao ?? p.pontuação;
    const scoreNum = typeof score === 'string' ? Number(score) : score;
    return Array.isArray(competitors) && typeof scoreNum === 'number' && !isNaN(scoreNum);
  }

  private normalize(p: any) {
    // Aceita chaves em inglês ou português; normaliza para inglês.
    const competitors = p.competitors ?? p.concorrentes ?? [];
    const weaknesses = p.weaknesses ?? p.fraquezas ?? [];
    const attackPlan = p.attackPlan ?? p.planoDeAtaque ?? p.plano_de_ataque ?? {};
    const rawScore = p.score ?? p.pontuacao ?? p.pontuação ?? 50;
    const scoreNum = typeof rawScore === 'string' ? Number(rawScore) : rawScore;
    const summary = p.summary ?? p.resumo ?? '';
    return {
      competitors,
      weaknesses,
      attackPlan,
      score: Math.max(0, Math.min(100, Math.round(scoreNum || 50))),
      summary: (summary ?? '').toString().slice(0, 4000),
    };
  }

  /**
   * Fallback determinístico. É bem útil para:
   *  - dev sem chave de IA
   *  - garantir que o fluxo end-to-end sempre retorna algo coerente
   */
  private heuristicAnalysis(dto: CreateDiagnosticoDto) {
    const { specialty, city, district } = dto;
    const base = `${specialty} em ${city}${district ? ` (${district})` : ''}`;

    const competitors = Array.from({ length: 10 }).map((_, i) => ({
      rank: i + 1,
      name: `${specialty.split(' ')[0]} ${this.fictitiousName(i)}`,
      site: `https://clinica${i + 1}.${city.toLowerCase().replace(/\s/g, '')}.com.br`,
      instagram: `@clinica.${i + 1}.${specialty.toLowerCase().replace(/\s/g, '')}`,
      positioning: i < 3 ? 'premium' : i < 7 ? 'intermediário' : 'popular',
      seoStrength: i < 3 ? 'alta' : i < 7 ? 'média' : 'baixa',
      estimatedAdsMeta: Math.max(0, 8 - i),
      estimatedAdsGoogle: Math.max(0, 5 - Math.floor(i / 2)),
      averagePrice: 200 + i * 50,
    }));

    const weaknesses = [
      'Sites lentos e não otimizados para mobile',
      'Pouca produção de conteúdo educativo em vídeo',
      'Ausência de prova social estruturada (antes/depois com consentimento)',
      'Funis de WhatsApp sem qualificação automática',
      'Remarketing quase inexistente nos canais pagos',
    ];

    const attackPlan = {
      seo: [
        `Publicar 2 artigos/semana sobre ${specialty} em ${city}`,
        'Implementar schema.org médico + Google My Business otimizado',
      ],
      trafegoPago: [
        'Meta Ads: campanha de leads com copy focada em dor específica',
        'Google Ads: rede de pesquisa + termos de intenção transacional',
        'Lookalike 1% de pacientes pagantes após 60 dias',
      ],
      conteudo: [
        'Reels semanais respondendo dúvidas comuns',
        'Webinar gratuito mensal para captação premium',
      ],
      provaSocial: [
        'Programa de coleta de avaliações Google pós-consulta',
        'Depoimentos em vídeo com consentimento LGPD',
      ],
    };

    const score = 72; // oportunidade "alta"

    return {
      competitors,
      weaknesses,
      attackPlan,
      score,
      summary:
        `Mercado de ${base} apresenta concorrência concentrada no posicionamento intermediário, ` +
        `com fraquezas claras em SEO técnico, conteúdo em vídeo e funil de WhatsApp. ` +
        `Score de oportunidade ${score}/100 — viável dominar em 90 dias com execução consistente.`,
    };
  }

  private fictitiousName(i: number) {
    const names = [
      'Aurora',
      'Bellavita',
      'CoraVita',
      'Derma Nova',
      'Elegance',
      'Florescer',
      'Harmony',
      'Ilhas',
      'Lumière',
      'Mediplus',
    ];
    return names[i % names.length];
  }
}
