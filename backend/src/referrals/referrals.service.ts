import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Módulo 12: Indique-e-Ganhe.
 *  - Gera código único por paciente indicador
 *  - Rastreia uso (Lead.referralCode)
 *  - Calcula recompensas pagas
 */
@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  list(clinicId: string) {
    return this.prisma.referral.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async stats(clinicId: string) {
    const referrals = await this.prisma.referral.findMany({ where: { clinicId } });
    const totalIndicadores = referrals.length;
    const totalUsos = referrals.reduce((s, r) => s + r.usedCount, 0);
    const totalRecompensas = referrals.reduce((s, r) => s + Number(r.rewardsPaid ?? 0), 0);
    const taxaConversao =
      totalIndicadores > 0 ? totalUsos / totalIndicadores : 0;
    return {
      totalIndicadores,
      totalUsos,
      totalRecompensas,
      taxaConversao: Math.round(taxaConversao * 100) / 100,
    };
  }

  async generateCode(dto: {
    clinicId: string;
    referrerName: string;
    referrerPhone?: string;
    rewardType?: string;
    rewardValue?: number;
  }) {
    const prefix = dto.referrerName.split(' ')[0].toUpperCase().slice(0, 8);
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const code = `${prefix}-${rand}`;
    return this.prisma.referral.create({
      data: {
        clinicId: dto.clinicId,
        code,
        referrerName: dto.referrerName,
        referrerPhone: dto.referrerPhone,
        rewardType: dto.rewardType ?? 'CASHBACK',
        rewardValue: dto.rewardValue ?? 100,
      },
    });
  }

  /** Registra uso de código por um novo lead. */
  async trackUsage(code: string, leadId: string) {
    const ref = await this.prisma.referral.findUnique({ where: { code } });
    if (!ref) throw new NotFoundException('Código não encontrado');
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { referralCode: code },
    });
    return this.prisma.referral.update({
      where: { code },
      data: {
        usedCount: { increment: 1 },
      },
    });
  }

  /** Marca pagamento da recompensa ao indicador. */
  async payReward(code: string, amount: number) {
    return this.prisma.referral.update({
      where: { code },
      data: { rewardsPaid: { increment: amount } },
    });
  }
}
