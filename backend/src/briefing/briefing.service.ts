import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicsService } from '../clinics/clinics.service';
import { CreateBriefingDto } from './dto/briefing.dto';

@Injectable()
export class BriefingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clinics: ClinicsService,
  ) {}

  async create(userId: string, dto: CreateBriefingDto) {
    const clinic = dto.clinicId
      ? await this.clinics.findOne(dto.clinicId)
      : await this.clinics.getOrCreateDefault(userId);

    return this.prisma.briefing.create({
      data: {
        clinicId: clinic.id,
        doctor: dto.doctor,
        services: dto.services,
        differentials: dto.differentials,
        media: dto.media,
        tone: dto.tone,
        goals: dto.goals,
        audience: dto.audience,
      },
    });
  }

  async findOne(id: string) {
    const b = await this.prisma.briefing.findUnique({ where: { id } });
    if (!b) throw new NotFoundException('Briefing não encontrado');
    return b;
  }

  listByClinic(clinicId: string) {
    return this.prisma.briefing.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
