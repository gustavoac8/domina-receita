import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * WhatsApp Cloud API (Meta). Uso: enviar templates / mensagens texto.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly token: string;
  private readonly phoneNumberId: string;
  private readonly verifyToken: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.token = config.get('WHATSAPP_ACCESS_TOKEN') || '';
    this.phoneNumberId = config.get('WHATSAPP_PHONE_NUMBER_ID') || '';
    this.verifyToken = config.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || 'dev';
  }

  isConfigured() {
    return Boolean(this.token && this.phoneNumberId);
  }

  getVerifyToken() {
    return this.verifyToken;
  }

  async sendText(to: string, message: string) {
    const clean = to.replace(/\D/g, '');
    if (!this.isConfigured()) {
      this.logger.log(`WA stub → ${clean}: ${message.slice(0, 60)}...`);
      return { mode: 'stub', to: clean };
    }
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: clean,
            type: 'text',
            text: { body: message },
          }),
        },
      );
      const data: any = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      return { mode: 'real', id: data?.messages?.[0]?.id };
    } catch (err: any) {
      this.logger.error(`WA sendText falhou: ${err.message}`);
      throw err;
    }
  }

  /** Recebe mensagem inbound do webhook e registra como atividade do lead. */
  async handleIncoming(payload: any) {
    await this.prisma.webhookEvent.create({
      data: { provider: 'whatsapp', kind: 'inbound', payload },
    });
    try {
      const entry = payload?.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const msg = change?.messages?.[0];
      const from = msg?.from;
      const text = msg?.text?.body;
      if (!from || !text) return { ok: true, ignored: true };

      const lead = await this.prisma.lead.findFirst({
        where: { phone: { contains: from.slice(-9) } },
        orderBy: { createdAt: 'desc' },
      });
      if (lead) {
        await this.prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            kind: 'whatsapp_inbound',
            payload: { text, from },
          },
        });
      }
      return { ok: true };
    } catch (err: any) {
      this.logger.error(`WA handleIncoming falhou: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }
}
