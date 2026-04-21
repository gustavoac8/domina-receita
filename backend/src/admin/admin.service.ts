import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * AdminService — painel do super admin (você):
 *  - Visão da plataforma (clínicas, MRR, churn)
 *  - CRM interno de leads comerciais
 *  - Impersonation (gerar JWT de um médico específico)
 *  - Audit log
 */
@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ---------- PLATFORM OVERVIEW ----------
  async overview() {
    const [clinics, leads, trialCount] = await Promise.all([
      this.prisma.clinic.count(),
      this.prisma.marketingLead.groupBy({ by: ['stage'], _count: { _all: true } }),
      this.prisma.marketingLead.count({ where: { stage: 'TRIAL' } }),
    ]);
    return {
      clinicasAtivas: clinics,
      leadsPorEstagio: leads.reduce((acc, l) => ({ ...acc, [l.stage]: l._count._all }), {}),
      trialsAtivos: trialCount,
      mrrEstimado: await this.calculateMrr(),
    };
  }

  private async calculateMrr() {
    // Placeholder: MRR = clinicas * ticket medio do plano.
    // Em produção, somar subscriptions ativas do Stripe.
    const clinics = await this.prisma.clinic.count();
    return clinics * 742; // ARPU estimado R$ 742
  }

  // ---------- CLINICS ----------
  async listClinics(filter?: { specialty?: string; q?: string }) {
    return this.prisma.clinic.findMany({
      where: {
        ...(filter?.specialty && { specialty: filter.specialty }),
        ...(filter?.q && { name: { contains: filter.q, mode: 'insensitive' } }),
      },
      include: { owner: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------- MARKETING LEADS (seu CRM interno) ----------
  async listMarketingLeads(stage?: string) {
    return this.prisma.marketingLead.findMany({
      where: stage ? { stage: stage as any } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMarketingLead(data: any) {
    return this.prisma.marketingLead.create({ data });
  }

  async updateMarketingLead(id: string, data: any) {
    const lead = await this.prisma.marketingLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return this.prisma.marketingLead.update({ where: { id }, data });
  }

  async deleteMarketingLead(id: string) {
    return this.prisma.marketingLead.delete({ where: { id } });
  }

  // Importa lead vindo do formulário público do site institucional
  async captureFromSite(payload: { name: string; email?: string; phone?: string; specialty?: string; city?: string; utm?: any }) {
    return this.prisma.marketingLead.create({
      data: {
        ...payload,
        source: payload.utm?.source || 'organic',
        utm: payload.utm ?? null,
        stage: 'NEW',
      },
    });
  }

  // ---------- AUDIT LOG ----------
  async log(actorEmail: string, action: string, meta: any = {}) {
    return this.prisma.auditLog.create({
      data: {
        actorEmail,
        action,
        targetType: meta.targetType ?? null,
        targetId: meta.targetId ?? null,
        meta,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      },
    });
  }

  async listAuditLogs(limit = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ---------- IMPERSONATION ----------
  /** Retorna dados para gerar JWT em nome de outro usuário. O controller cuida da assinatura. */
  async impersonate(actorEmail: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('Usuário alvo não encontrado');
    await this.log(actorEmail, 'IMPERSONATE_START', { targetType: 'User', targetId: target.id, targetEmail: target.email });
    return { sub: target.id, email: target.email, role: target.role, impersonatedBy: actorEmail };
  }
}
