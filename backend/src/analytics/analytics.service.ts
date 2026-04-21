import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(clinicId: string) {
    const [leads, campaigns] = await Promise.all([
      this.prisma.lead.findMany({ where: { clinicId } }),
      this.prisma.campaign.findMany({ where: { clinicId } }),
    ]);

    const leadsByStage = leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.stage] = (acc[l.stage] || 0) + 1;
      return acc;
    }, {});

    const totalRevenue = leads
      .filter((l) => l.stage === 'ATTENDED' || l.stage === 'RECURRING')
      .reduce((sum, l) => sum + Number(l.value ?? 0), 0);

    const totalSpent = campaigns.reduce(
      (sum, c) => sum + Number(c.spent ?? 0),
      0,
    );

    const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

    const byChannel = campaigns.reduce<Record<string, any>>((acc, c) => {
      const ch = c.channel;
      acc[ch] = acc[ch] || { spent: 0, leads: 0, revenue: 0 };
      acc[ch].spent += Number(c.spent ?? 0);
      acc[ch].leads += c.leadsCount ?? 0;
      acc[ch].revenue += Number(c.revenue ?? 0);
      return acc;
    }, {});

    const ticketMedio =
      leads.length > 0
        ? leads.reduce((s, l) => s + Number(l.value ?? 0), 0) / leads.length
        : 0;

    // Projeção simples: média móvel dos últimos 30 dias → extrapola 30/60/90
    const now = Date.now();
    const last30 = leads.filter(
      (l) =>
        now - new Date(l.createdAt).getTime() <= 30 * 24 * 3600 * 1000 &&
        (l.stage === 'ATTENDED' || l.stage === 'RECURRING'),
    );
    const revenueLast30 = last30.reduce(
      (s, l) => s + Number(l.value ?? 0),
      0,
    );

    return {
      kpis: {
        leadsTotal: leads.length,
        leadsByStage,
        totalRevenue,
        totalSpent,
        roas: Number(roas.toFixed(2)),
        ticketMedio: Number(ticketMedio.toFixed(2)),
      },
      byChannel,
      forecast: {
        revenue30d: revenueLast30,
        revenue60d: revenueLast30 * 2,
        revenue90d: revenueLast30 * 3,
      },
    };
  }
}
