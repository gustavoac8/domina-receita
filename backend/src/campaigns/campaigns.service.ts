import { Injectable, NotFoundException } from '@nestjs/common';
import { AdChannel, CampaignStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { ClinicsService } from '../clinics/clinics.service';
import { MetaService } from '../integrations/meta/meta.service';
import { GoogleAdsService } from '../integrations/google/google-ads.service';
import {
  CreateCampaignDto,
  UpdateCampaignStatusDto,
} from './dto/campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly clinics: ClinicsService,
    private readonly meta: MetaService,
    private readonly googleAds: GoogleAdsService,
  ) {}

  async create(userId: string, dto: CreateCampaignDto) {
    const clinic = dto.clinicId
      ? await this.clinics.findOne(dto.clinicId)
      : await this.clinics.getOrCreateDefault(userId);

    const copy = dto.copy ?? (await this.generateCopy(clinic, dto));
    const targeting = dto.targeting ?? this.suggestTargeting(clinic);

    // Publica na plataforma correspondente (modo stub por default).
    let externalId: string | null = null;
    if (dto.channel === 'META') {
      const r = await this.meta.createCampaign({
        name: dto.name,
        dailyBudget: dto.dailyBudget,
        objective: dto.objective,
        targeting,
        copy,
      });
      externalId = r.externalId;
    } else if (dto.channel === 'GOOGLE') {
      const r = await this.googleAds.createCampaign({
        name: dto.name,
        dailyBudget: dto.dailyBudget,
        copy,
      });
      externalId = r.externalId;
    }

    return this.prisma.campaign.create({
      data: {
        clinicId: clinic.id,
        name: dto.name,
        channel: dto.channel as AdChannel,
        objective: dto.objective,
        dailyBudget: dto.dailyBudget,
        copy,
        targeting,
        externalId,
      },
    });
  }

  list(clinicId: string) {
    return this.prisma.campaign.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Campanha não encontrada');
    return c;
  }

  updateStatus(id: string, dto: UpdateCampaignStatusDto) {
    return this.prisma.campaign.update({
      where: { id },
      data: { status: dto.status as CampaignStatus },
    });
  }

  // -------- helpers --------
  private async generateCopy(
    clinic: { name: string; specialty: string; city: string },
    dto: CreateCampaignDto,
  ) {
    const prompt = [
      `Gere copy para anúncio ${dto.channel} de uma clínica de ${clinic.specialty} em ${clinic.city}.`,
      `Objetivo: ${dto.objective}.`,
      `Nome da campanha: ${dto.name}.`,
      'Retorne JSON com headline (máx 30 chars), body (máx 120 chars), cta (máx 20 chars) e creativeIdea.',
    ].join('\n');
    const raw = await this.ai.complete(
      prompt,
      'Você é copywriter sênior de performance médica.',
    );
    const parsed = this.safeParse(raw);
    if (parsed?.headline) return parsed;
    return {
      headline: `${clinic.specialty} em ${clinic.city}`,
      body: `Agende sua consulta com especialista reconhecido. Atendimento humanizado.`,
      cta: 'Agendar agora',
      creativeIdea: 'Antes/depois com consentimento + depoimento em vídeo',
    };
  }

  private suggestTargeting(clinic: { city: string }) {
    return {
      geo: [clinic.city],
      radiusKm: 20,
      ageMin: 25,
      ageMax: 55,
      interests: ['estetica', 'saude', 'autocuidado'],
      audiencesWarm: ['pixel_visitors_30d'],
      lookalike: { source: 'purchasers_1y', percent: 1 },
    };
  }

  private safeParse(raw: string) {
    try {
      const s = raw.indexOf('{');
      const e = raw.lastIndexOf('}');
      if (s < 0 || e < 0) return null;
      return JSON.parse(raw.slice(s, e + 1));
    } catch {
      return null;
    }
  }
}
