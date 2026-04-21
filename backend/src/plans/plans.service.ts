import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicsService } from '../clinics/clinics.service';

/**
 * Módulo 4: Plano de Ação Diagnóstico Padrão (90 dias).
 * Em um clique gera:
 *  - 13 semanas de execução
 *  - orçamento sugerido
 *  - KPIs esperados
 */
@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clinics: ClinicsService,
  ) {}

  async generate(userId: string, clinicId?: string) {
    const clinic = clinicId
      ? await this.clinics.findOne(clinicId)
      : await this.clinics.getOrCreateDefault(userId);

    const weeks = this.buildWeeks(clinic);
    const budget = this.suggestBudget(clinic);
    const kpis = this.expectedKpis();

    return this.prisma.actionPlan.create({
      data: {
        clinicId: clinic.id,
        title: `Plano 90 dias — ${clinic.specialty} em ${clinic.city}`,
        weeks,
        budgetSuggested: budget,
        kpis,
      },
    });
  }

  list(clinicId: string) {
    return this.prisma.actionPlan.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.actionPlan.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Plano não encontrado');
    return p;
  }

  // ---- builders ----
  private buildWeeks(clinic: { specialty: string; city: string }) {
    const owner = 'Equipe marketing';
    return [
      { week: 1, focus: 'Setup & Diagnóstico', tasks: ['Rodar diagnóstico IA', 'Auditar Google My Business', 'Ajustar perfis Instagram/Facebook', 'Instalar pixels Meta/Google'], owner },
      { week: 2, focus: 'Site + Funil', tasks: ['Gerar site otimizado', 'Publicar', 'Configurar agendamento online', 'Integrar WhatsApp Business'], owner },
      { week: 3, focus: 'Conteúdo base', tasks: ['Produzir 3 Reels', `Publicar 2 artigos SEO sobre ${clinic.specialty}`, 'Coletar depoimentos em vídeo'], owner },
      { week: 4, focus: 'Lançar ADS — fase 1', tasks: ['Campanha Meta Leads', 'Campanha Google Search', 'Orçamento inicial R$ 100/dia cada'], owner },
      { week: 5, focus: 'Otimização ADS', tasks: ['Pausar criativos com CTR < 1%', 'Dobrar orçamento do top set', 'Testar novos ângulos de copy'], owner },
      { week: 6, focus: 'CRM Operacional', tasks: ['Treinar recepção em script de fechamento', 'Ativar follow-ups D0/D2/D5/D10', 'Revisar taxas de qualificação'], owner },
      { week: 7, focus: 'Prova social escala', tasks: ['Campanha de coleta de reviews Google', 'Responder todas as avaliações', 'Editar reel de depoimentos'], owner },
      { week: 8, focus: 'Remarketing', tasks: ['Audiência de visitantes 30d', 'Lookalike 1% de pacientes pagantes', 'Anúncio de "por que adiar?"'], owner },
      { week: 9, focus: 'Upsell + Retornos', tasks: ['Campanha de pacote anual', 'Ativar lembretes de retorno 6m', 'Script de upsell procedimento complementar'], owner },
      { week: 10, focus: 'Conteúdo premium', tasks: ['Webinar gratuito para captar lead top-funnel', 'Lead magnet (ebook)', 'Nutrição por email'], owner },
      { week: 11, focus: 'Indicações', tasks: ['Lançar programa Indique e Ganhe', 'Campanha WhatsApp para base', 'Gerar códigos únicos por paciente'], owner },
      { week: 12, focus: 'Revisão & Escala', tasks: ['Análise de ROAS por canal', 'Expandir orçamento em canais lucrativos', 'Planejar próximos 90 dias'], owner },
      { week: 13, focus: 'Consolidação', tasks: ['Relatório executivo', 'Ajuste de posicionamento', 'Meta de faturamento atualizada'], owner },
    ];
  }

  private suggestBudget(_clinic: any) {
    return 12000; // R$ 4k/mês por 3 meses (estimativa base)
  }

  private expectedKpis() {
    return {
      leadsEsperados: 300,
      agendamentosEsperados: 120,
      conversaoLeadParaAgenda: 0.4,
      conversaoAgendaParaCompareceu: 0.7,
      ticketMedio: 1200,
      receitaProjetada: 100800,
      roas: 8.4,
    };
  }
}
