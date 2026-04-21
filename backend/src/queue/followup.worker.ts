import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../integrations/whatsapp/whatsapp.service';

/**
 * Worker que roda a cada minuto e despacha FollowupJobs pendentes
 * cujo `scheduledFor <= now`.
 */
@Injectable()
export class FollowupWorker {
  private readonly logger = new Logger(FollowupWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    const now = new Date();
    const jobs = await this.prisma.followupJob.findMany({
      where: { status: 'PENDING', scheduledFor: { lte: now } },
      take: 20,
      include: { lead: true },
    });
    if (jobs.length === 0) return;

    this.logger.log(`Processando ${jobs.length} follow-ups...`);

    for (const job of jobs) {
      try {
        const tpl = await this.prisma.followupTemplate.findUnique({
          where: { code: job.templateCode },
        });
        if (!tpl) throw new Error(`Template ${job.templateCode} não encontrado`);

        const body = this.render(tpl.body, {
          nome: job.lead.name,
          procedimento: job.lead.procedure ?? 'sua consulta',
          clinica: 'nossa clínica',
          medico: 'nossa equipe',
          link_google: '',
          link_depoimentos: '',
        });

        if (job.channel === 'WHATSAPP') {
          await this.whatsapp.sendText(job.lead.phone, body);
        }
        // (email/sms ficam como stub neste sprint)

        await this.prisma.followupJob.update({
          where: { id: job.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        await this.prisma.leadActivity.create({
          data: {
            leadId: job.leadId,
            kind: 'followup_sent',
            payload: { code: job.templateCode, body },
          },
        });
      } catch (err: any) {
        this.logger.error(`Falha job ${job.id}: ${err.message}`);
        await this.prisma.followupJob.update({
          where: { id: job.id },
          data: { status: 'FAILED', error: err.message },
        });
      }
    }
  }

  private render(tpl: string, vars: Record<string, string>): string {
    return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
  }
}
