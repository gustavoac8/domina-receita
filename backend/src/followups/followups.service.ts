import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowupChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Módulo 8: Follow-ups.
 *  - CRUD de templates
 *  - Agendar manualmente um follow-up para um lead
 *  - Agendar pacote completo (D0/D2/D5/D10) para um lead
 */
@Injectable()
export class FollowupsService {
  constructor(private readonly prisma: PrismaService) {}

  listTemplates() {
    return this.prisma.followupTemplate.findMany({ orderBy: { code: 'asc' } });
  }

  upsertTemplate(dto: {
    code: string;
    name: string;
    channel: FollowupChannel;
    body: string;
    subject?: string;
    delayDays?: number;
    enabled?: boolean;
  }) {
    return this.prisma.followupTemplate.upsert({
      where: { code: dto.code },
      update: { ...dto },
      create: {
        code: dto.code,
        name: dto.name,
        channel: dto.channel,
        body: dto.body,
        subject: dto.subject,
        delayDays: dto.delayDays ?? 0,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async scheduleForLead(leadId: string, templateCode: string, when?: Date) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    const tpl = await this.prisma.followupTemplate.findUnique({
      where: { code: templateCode },
    });
    if (!tpl) throw new NotFoundException('Template não encontrado');

    return this.prisma.followupJob.create({
      data: {
        leadId,
        clinicId: lead.clinicId,
        templateCode,
        channel: tpl.channel,
        scheduledFor: when ?? new Date(Date.now() + tpl.delayDays * 86400000),
      },
    });
  }

  /** Agenda o pacote padrão D0/D2/D5/D10 baseando-se na data de criação do lead. */
  async enqueueDefaultSequence(leadId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const codes = ['D0', 'D2', 'D5', 'D10'];
    const base = new Date(lead.createdAt).getTime();
    const created: any[] = [];
    for (const code of codes) {
      const tpl = await this.prisma.followupTemplate.findUnique({
        where: { code },
      });
      if (!tpl || !tpl.enabled) continue;
      // Evita duplicar: se já existe um job pendente com esse template, pula.
      const exists = await this.prisma.followupJob.findFirst({
        where: { leadId, templateCode: code, status: { in: ['PENDING', 'SENT'] } },
      });
      if (exists) continue;
      const job = await this.prisma.followupJob.create({
        data: {
          leadId,
          clinicId: lead.clinicId,
          templateCode: code,
          channel: tpl.channel,
          scheduledFor: new Date(base + tpl.delayDays * 86400000),
        },
      });
      created.push(job);
    }
    return created;
  }

  listJobs(clinicId: string) {
    return this.prisma.followupJob.findMany({
      where: { clinicId },
      orderBy: { scheduledFor: 'asc' },
      include: { lead: { select: { name: true, phone: true } } },
      take: 200,
    });
  }

  cancel(jobId: string) {
    return this.prisma.followupJob.update({
      where: { id: jobId },
      data: { status: 'CANCELED' },
    });
  }
}
