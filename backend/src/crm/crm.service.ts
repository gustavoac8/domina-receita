import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicsService } from '../clinics/clinics.service';
import {
  AddLeadActivityDto,
  CreateLeadDto,
  UpdateLeadStageDto,
} from './dto/lead.dto';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clinics: ClinicsService,
  ) {}

  async create(userId: string, dto: CreateLeadDto) {
    const clinic = dto.clinicId
      ? await this.clinics.findOne(dto.clinicId)
      : await this.clinics.getOrCreateDefault(userId);

    const lead = await this.prisma.lead.create({
      data: {
        clinicId: clinic.id,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        source: dto.source,
        procedure: dto.procedure,
        value: dto.value,
        tags: dto.tags ?? [],
        notes: dto.notes,
      },
    });

    // Dispara follow-up "Dia 0" (boas-vindas). Aqui só registra a atividade;
    // integração real com WhatsApp/Email é um job externo.
    await this.addActivity(lead.id, {
      kind: 'auto_followup',
      payload: {
        step: 'D0',
        template: 'boas-vindas',
        scheduledFor: new Date().toISOString(),
      },
    });

    return lead;
  }

  list(clinicId: string, stage?: LeadStage) {
    return this.prisma.lead.findMany({
      where: {
        clinicId,
        ...(stage ? { stage } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async board(clinicId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { clinicId },
      orderBy: { updatedAt: 'desc' },
    });
    const stages: LeadStage[] = [
      'NEW',
      'QUALIFIED',
      'SCHEDULED',
      'ATTENDED',
      'RECURRING',
      'LOST',
    ];
    return Object.fromEntries(
      stages.map((s) => [s, leads.filter((l) => l.stage === s)]),
    );
  }

  async updateStage(id: string, dto: UpdateLeadStageDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { stage: dto.stage as LeadStage },
    });
    await this.addActivity(id, {
      kind: 'stage_change',
      payload: { from: lead.stage, to: dto.stage },
    });
    return updated;
  }

  async addActivity(leadId: string, dto: AddLeadActivityDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return this.prisma.leadActivity.create({
      data: { leadId, kind: dto.kind, payload: dto.payload },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { activities: { orderBy: { createdAt: 'desc' } } },
    });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return lead;
  }

  /**
   * Pequeno motor de follow-up padrão (dia 0/2/5/10).
   * Retorna próximos passos pendentes por lead — útil para UI mostrar "o que fazer hoje".
   */
  async pendingFollowups(clinicId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { clinicId },
      include: { activities: true },
    });

    const steps = [
      { step: 'D0', days: 0, template: 'boas-vindas' },
      { step: 'D2', days: 2, template: 'lembrete-valor' },
      { step: 'D5', days: 5, template: 'prova-social' },
      { step: 'D10', days: 10, template: 'oferta-limitada' },
    ];

    const now = Date.now();
    const pending: any[] = [];

    for (const lead of leads) {
      const createdAt = new Date(lead.createdAt).getTime();
      for (const s of steps) {
        const due = createdAt + s.days * 24 * 3600 * 1000;
        if (due > now) continue;
        const already = lead.activities.some(
          (a) =>
            a.kind === 'auto_followup' &&
            (a.payload as any)?.step === s.step &&
            (a.payload as any)?.sent === true,
        );
        if (!already) {
          pending.push({
            leadId: lead.id,
            leadName: lead.name,
            phone: lead.phone,
            step: s.step,
            template: s.template,
            dueAt: new Date(due).toISOString(),
          });
        }
      }
    }
    return pending;
  }
}
