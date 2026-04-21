import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GoogleAdsService } from '../integrations/google/google-ads.service';
import { ClinicsService } from '../clinics/clinics.service';

/**
 * Módulo 5: SEO.
 *  - auditoria técnica (stub avaliativo)
 *  - pesquisa de palavras-chave (via GoogleAdsService)
 *  - geração de artigos otimizados
 */
@Injectable()
export class SeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly googleAds: GoogleAdsService,
    private readonly clinics: ClinicsService,
  ) {}

  /** Auditoria técnica simplificada — retorna checklist pontuado. */
  async audit(url: string) {
    // Em produção: buscar o HTML e analisar tags. Aqui: checklist heurístico.
    return {
      url,
      score: 72,
      checks: [
        { item: 'Title tag', status: 'ok', weight: 10, note: 'Presente' },
        { item: 'Meta description', status: 'warn', weight: 8, note: 'Considere otimizar para CTR' },
        { item: 'H1 único', status: 'ok', weight: 6 },
        { item: 'Schema.org MedicalBusiness', status: 'ok', weight: 8 },
        { item: 'OG tags', status: 'ok', weight: 5 },
        { item: 'Mobile-friendly', status: 'ok', weight: 10 },
        { item: 'Velocidade (LCP)', status: 'warn', weight: 12, note: 'Otimize imagens' },
        { item: 'HTTPS', status: 'ok', weight: 5 },
        { item: 'Sitemap.xml', status: 'missing', weight: 5, note: 'Gerar e submeter ao Search Console' },
        { item: 'robots.txt', status: 'ok', weight: 3 },
      ],
      recommendations: [
        'Compactar imagens hero para WebP < 150KB',
        'Adicionar FAQ schema nas páginas de procedimento',
        'Criar cluster de conteúdo por procedimento principal',
      ],
    };
  }

  async keywords(seed: string, location: string) {
    return this.googleAds.keywordIdeas(seed, location);
  }

  async generateArticle(
    userId: string,
    params: { clinicId?: string; keyword: string; topic?: string },
  ) {
    const clinic = params.clinicId
      ? await this.clinics.findOne(params.clinicId)
      : await this.clinics.getOrCreateDefault(userId);

    const prompt = [
      `Escreva um artigo de blog otimizado para SEO sobre "${params.topic ?? params.keyword}" focado em ${clinic.specialty} em ${clinic.city}.`,
      `Palavra-chave principal: "${params.keyword}".`,
      'Estrutura: H1, introdução (2 parágrafos), 3 H2 com H3 quando fizer sentido, FAQ com 3 perguntas, conclusão com CTA para agendamento.',
      'Tom: informativo, acolhedor, profissional. 900-1200 palavras.',
      'Retorne HTML puro (sem <html>/<body>), apenas as tags semânticas.',
    ].join('\n');

    const html = await this.ai.complete(
      prompt,
      'Você é redator SEO sênior especialista em conteúdo médico.',
    );

    const slug = this.slugify(params.keyword);
    const article = await this.prisma.seoArticle.create({
      data: {
        clinicId: clinic.id,
        title: params.topic ?? params.keyword,
        slug,
        keyword: params.keyword,
        html: html || `<h1>${params.keyword}</h1><p>Rascunho gerado — complete manualmente.</p>`,
      },
    });
    return article;
  }

  list(clinicId: string) {
    return this.prisma.seoArticle.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const a = await this.prisma.seoArticle.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Artigo não encontrado');
    return a;
  }

  private slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
