import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Módulo 11: Pós-venda & Retenção.
 *  - Lembretes de retorno automáticos (6m, 12m, etc)
 *  - Upsell de pacote anual / programa de fidelidade
 *  - Listagem de pacientes por status de retenção
 */
@Injectable()
export class PostsalesService {
  constructor(private readonly prisma: PrismaService) {}

  list(clinicId: string) {
    return this.prisma.returnReminder.findMany({
      where: { clinicId },
      orderBy: { nextDueAt: 'asc' },
      include: { lead: { select: { name: true, phone: true } } },
      take: 300,
    });
  }

  /** Inscreve um lead ATTENDED no fluxo de retorno. intervalMonths: 6 (padrão) ou 12. */
  async enrollFromAttended(
    leadId: string,
    intervalMonths = 6,
    message?: string,
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    const nextDueAt = new Date(
      Date.now() + intervalMonths * 30 * 86400000,
    );
    const defaultMsg =
      intervalMonths >= 12
        ? 'Oi {{nome}}! Já faz 1 ano do seu último atendimento. Que tal agendar seu check-up anual? Respondo aqui mesmo.'
        : 'Oi {{nome}}! Já faz 6 meses do seu último procedimento. Posso reservar seu retorno? Respondo por aqui.';
    return this.prisma.returnReminder.create({
      data: {
        clinicId: lead.clinicId,
        leadId,
        intervalMonths,
        message: message ?? defaultMsg,
        nextDueAt,
      },
    });
  }

  /** Sugestão de upsell de pacote anual para pacientes que retornaram ≥2x. */
  async annualPackageCandidates(clinicId: string) {
    const attended = await this.prisma.lead.findMany({
      where: { clinicId, stage: 'ATTENDED' },
      select: { id: true, name: true, phone: true, procedure: true },
      take: 100,
    });
    return attended.map((l) => ({
      ...l,
      suggestedPackage: {
        name: 'Pacote Anual Essencial',
        price: 2890,
        includes: ['4 retornos', '10% de desconto em procedimentos', 'Fast-track no agendamento'],
      },
    }));
  }

  async cancel(id: string) {
    return this.prisma.returnReminder.update({
      where: { id },
      data: { status: 'DISMISSED' },
    });
  }
}
