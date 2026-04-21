import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Adapter Meta (Facebook/Instagram) Ads + Leadgen.
 *
 * Modo stub (default): simula chamadas sem tocar na API real.
 * Modo real: se META_ACCESS_TOKEN + META_AD_ACCOUNT_ID estiverem setados.
 */
@Injectable()
export class MetaService {
  private readonly logger = new Logger(MetaService.name);
  private readonly token: string;
  private readonly accountId: string;
  private readonly pageId: string;
  private readonly appSecret: string;
  private readonly verifyToken: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.token = config.get('META_ACCESS_TOKEN') || '';
    this.accountId = config.get('META_AD_ACCOUNT_ID') || '';
    this.pageId = config.get('META_PAGE_ID') || '';
    this.appSecret = config.get('META_APP_SECRET') || '';
    this.verifyToken = config.get('META_WEBHOOK_VERIFY_TOKEN') || 'dev';
  }

  isConfigured() {
    return Boolean(this.token && this.accountId);
  }

  getVerifyToken() {
    return this.verifyToken;
  }

  async createCampaign(params: {
    name: string;
    dailyBudget: number;
    objective: string;
    targeting: any;
    copy: any;
  }): Promise<{ externalId: string; mode: 'real' | 'stub' }> {
    if (!this.isConfigured()) {
      this.logger.warn('Meta stub: criando campanha simulada');
      return { externalId: `stub_${Date.now()}`, mode: 'stub' };
    }
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${this.accountId}/campaigns`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: params.name,
            objective: this.mapObjective(params.objective),
            daily_budget: Math.round(params.dailyBudget * 100),
            status: 'PAUSED',
            special_ad_categories: [],
            access_token: this.token,
          }),
        },
      );
      const data: any = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      return { externalId: data.id, mode: 'real' };
    } catch (err: any) {
      this.logger.error('Meta createCampaign falhou', err);
      return { externalId: `fallback_${Date.now()}`, mode: 'stub' };
    }
  }

  /** Recebe um payload de webhook leadgen e persiste um Lead. */
  async handleLeadgenWebhook(payload: any) {
    await this.prisma.webhookEvent.create({
      data: { provider: 'meta', kind: 'leadgen', payload },
    });

    // O payload real do Meta tem estrutura aninhada: entry[].changes[].value
    const entries = payload?.entry ?? [];
    const created: any[] = [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const v = change.value;
        if (!v?.leadgen_id) continue;
        // Em produção, faria GET /v19.0/{leadgen_id}?access_token=... para
        // recuperar os field_data. Aqui fazemos best-effort com o que veio:
        const fields = v.field_data ?? [];
        const getField = (k: string) =>
          fields.find((f: any) => f.name === k)?.values?.[0];

        // Precisa haver uma clínica-alvo; usamos a primeira ativa (MVP).
        const clinic = await this.prisma.clinic.findFirst();
        if (!clinic) continue;

        const lead = await this.prisma.lead.create({
          data: {
            clinicId: clinic.id,
            name: getField('full_name') ?? 'Lead Meta',
            phone: getField('phone_number') ?? '',
            email: getField('email') ?? null,
            source: 'meta',
            procedure: getField('procedure') ?? null,
            tags: ['meta_leadgen'],
          },
        });
        created.push(lead);
      }
    }
    return { received: created.length };
  }

  private mapObjective(o: string): string {
    const map: Record<string, string> = {
      leads: 'OUTCOME_LEADS',
      traffic: 'OUTCOME_TRAFFIC',
      conversions: 'OUTCOME_SALES',
      awareness: 'OUTCOME_AWARENESS',
    };
    return map[o] ?? 'OUTCOME_LEADS';
  }
}
