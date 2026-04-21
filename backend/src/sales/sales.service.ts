import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicsService } from '../clinics/clinics.service';

/**
 * Módulo 9: Conversão em Vendas.
 *  - Scripts prontos (WhatsApp e Recepção)
 *  - Página/endpoint de agendamento
 */
@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clinics: ClinicsService,
  ) {}

  scripts() {
    return {
      whatsapp: [
        {
          momento: 'Primeiro contato (D0)',
          script:
            'Olá {{nome}}! Aqui é {{atendente}} da {{clinica}}. Você se interessou por {{procedimento}}, certo? Posso te explicar rapidinho como funciona e te reservar um horário ainda esta semana?',
        },
        {
          momento: 'Objeção de preço',
          script:
            'Entendo perfeitamente! Muitos pacientes pensam assim antes. Posso te enviar o comparativo de resultado x investimento x durabilidade? Isso costuma ajudar a decidir com clareza.',
        },
        {
          momento: 'Fechamento',
          script:
            'Temos dois horários: {{horario1}} ou {{horario2}}. Qual fica melhor pra você? Reservo agora mesmo.',
        },
      ],
      recepcao: [
        {
          momento: 'Atendimento telefônico',
          script:
            'Clínica {{clinica}}, {{atendente}} falando, boa tarde! Em que posso ajudar? (Escutar atentamente e perguntar: você já é paciente? Qual procedimento te interessa? Posso te agendar com o Dr(a) {{medico}}?)',
        },
        {
          momento: 'Agendamento presencial',
          script:
            'Perfeito! Para confirmar, você prefere {{horario1}} ou {{horario2}}? Vou te enviar o endereço por WhatsApp. Qualquer imprevisto é só avisar — pedimos aviso mínimo de 24h.',
        },
      ],
    };
  }

  async schedule(
    userId: string,
    dto: {
      clinicId?: string;
      leadId?: string;
      name: string;
      phone: string;
      procedure?: string;
      scheduledFor: string;
      notes?: string;
    },
  ) {
    const clinic = dto.clinicId
      ? await this.clinics.findOne(dto.clinicId)
      : await this.clinics.getOrCreateDefault(userId);

    const appt = await this.prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        leadId: dto.leadId,
        name: dto.name,
        phone: dto.phone,
        procedure: dto.procedure,
        scheduledFor: new Date(dto.scheduledFor),
        notes: dto.notes,
      },
    });

    if (dto.leadId) {
      await this.prisma.lead.update({
        where: { id: dto.leadId },
        data: { stage: 'SCHEDULED' },
      });
    }
    return appt;
  }

  list(clinicId: string) {
    return this.prisma.appointment.findMany({
      where: { clinicId },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException();
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
    // Se compareceu e tem lead associado, move para ATTENDED
    if (status === 'ATTENDED' && appt.leadId) {
      await this.prisma.lead.update({
        where: { id: appt.leadId },
        data: { stage: 'ATTENDED' },
      });
    }
    return updated;
  }
}
