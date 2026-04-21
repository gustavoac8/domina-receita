import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../integrations/whatsapp/whatsapp.service';

/**
 * Roda de hora em hora e envia lembretes de retorno cujo `nextDueAt <= now`.
 */
@Injectable()
export class RemindersWorker {
  private readonly logger = new Logger(RemindersWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async tick() {
    const now = new Date();
    const due = await this.prisma.returnReminder.findMany({
      where: { status: 'PENDING', nextDueAt: { lte: now } },
      include: { lead: true },
      take: 50,
    });
    if (due.length === 0) return;

    this.logger.log(`Enviando ${due.length} lembretes de retorno...`);
    for (const r of due) {
      try {
        if (!r.lead?.phone) {
          this.logger.warn(`Lembrete ${r.id} sem telefone — pulando`);
          continue;
        }
        const msg = (r.message ?? '')
          .replace(/\{\{nome\}\}/g, r.lead?.name ?? '')
          .replace(/\{\{procedimento\}\}/g, r.lead?.procedure ?? 'seu procedimento');
        await this.whatsapp.sendText(r.lead.phone, msg);
        await this.prisma.returnReminder.update({
          where: { id: r.id },
          data: { status: 'CONTACTED' },
        });
      } catch (err: any) {
        this.logger.error(`Falha lembrete ${r.id}: ${err.message}`);
      }
    }
  }
}
