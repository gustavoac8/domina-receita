import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicDto } from './dto/clinic.dto';

@Injectable()
export class ClinicsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.clinic.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const clinic = await this.prisma.clinic.findUnique({ where: { id } });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');
    return clinic;
  }

  create(userId: string, dto: CreateClinicDto) {
    return this.prisma.clinic.create({
      data: { ...dto, ownerId: userId },
    });
  }

  /** Helper: pega a primeira clínica do usuário (ou cria uma default). */
  async getOrCreateDefault(userId: string) {
    let clinic = await this.prisma.clinic.findFirst({
      where: { ownerId: userId },
    });
    if (!clinic) {
      clinic = await this.prisma.clinic.create({
        data: {
          name: 'Minha Clínica',
          specialty: 'Geral',
          city: 'Não informada',
          ownerId: userId,
        },
      });
    }
    return clinic;
  }
}
