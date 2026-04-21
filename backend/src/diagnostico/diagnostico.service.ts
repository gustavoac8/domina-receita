import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { ClinicsService } from '../clinics/clinics.service';
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
    const prompt = this.buildPrompt(dto);
    const system =
      'Você é um consultor sênior de marketing médico. ' +
      'Analise o mercado de especialidade médica pedido e retorne um JSON ' +
      'com { competitors[], weaknesses[], attackPlan, score(0-100), summary }.';

    const raw = await this.ai.complete(prompt, system);

    // Tenta extrair JSON da resposta. Se falhar, usa o heurístico.
    const parsed = this.safeParseJson(raw);
    if (parsed && this.looksLikeAnalysis(parsed)) {
      return this.normalize(parsed);
    }
    return this.heuristicAnalysis(dto);
  }

  private buildPrompt(dto: CreateDiagnosticoDto) {
    const { specialty, city, district } = dto;
    return [
      `Especialidade: ${specialty}`,
      `Cidade: ${city}`,
      district ? `Bairro: ${district}` : '',
      '',
      'Analise os top 10 concorrentes prováveis neste mercado.',
      'Para cada concorrente: nome fictício plausível, site/IG hipotéticos, posicionamento, preço aparente, força de SEO (baixa/média/alta), anúncios ativos estimados (meta/google).',
      'Liste 5 fraquezas exploráveis do mercado.',
      'Monte plano de ataque em 4 pilares (SEO, Tráfego Pago, Conteúdo, Prova Social) com ações concretas de 90 dias.',
      'Atribua score 0-100 de oportunidade (100 = muito fácil dominar).',
      'Retorne SOMENTE JSON válido com as chaves: competitors, weaknesses, attackPlan, score, summary.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private safeParseJson(raw: string): any | null {
    if (!raw) return null;
    // Acha o primeiro { e o último } para isolar o JSON.
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end < 0) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  private looksLikeAnalysis(p: any) {
    return (
      p && Array.isArray(p.competitors) && typeof p.score === 'number'
    );
  }

  private normalize(p: any) {
    return {
      competitors: p.competitors ?? [],
      weaknesses: p.weaknesses ?? [],
      attackPlan: p.attackPlan ?? {},
      score: Math.max(0, Math.min(100, Math.round(p.score ?? 50))),
      summary: (p.summary ?? '').toString().slice(0, 4000),
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
