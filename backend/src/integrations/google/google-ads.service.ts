import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Google Ads adapter.
 *
 * Google Ads API exige OAuth2 + developer_token. O fluxo real envolve
 * várias chamadas (getAccessToken via refresh, AdsClient, MutateJob).
 * Aqui expomos a superfície mínima (create/estimate) em modo stub com
 * stub/real toggle por env.
 */
@Injectable()
export class GoogleAdsService {
  private readonly logger = new Logger(GoogleAdsService.name);
  private readonly developerToken: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private readonly customerId: string;

  constructor(private readonly config: ConfigService) {
    this.developerToken = config.get('GOOGLE_ADS_DEVELOPER_TOKEN') || '';
    this.clientId = config.get('GOOGLE_ADS_CLIENT_ID') || '';
    this.clientSecret = config.get('GOOGLE_ADS_CLIENT_SECRET') || '';
    this.refreshToken = config.get('GOOGLE_ADS_REFRESH_TOKEN') || '';
    this.customerId = config.get('GOOGLE_ADS_CUSTOMER_ID') || '';
  }

  isConfigured() {
    return Boolean(
      this.developerToken &&
        this.clientId &&
        this.clientSecret &&
        this.refreshToken &&
        this.customerId,
    );
  }

  async createCampaign(params: {
    name: string;
    dailyBudget: number;
    copy: any;
  }): Promise<{ externalId: string; mode: 'real' | 'stub' }> {
    if (!this.isConfigured()) {
      this.logger.warn('Google Ads stub: criando campanha simulada');
      return { externalId: `gads_stub_${Date.now()}`, mode: 'stub' };
    }
    // Implementação real usaria googleapis/google-ads-node. Mantemos stub aqui
    // e registramos o TODO para o sprint de integração.
    this.logger.log(
      `Google Ads real-mode placeholder; integração via SDK oficial.`,
    );
    return { externalId: `gads_pending_${Date.now()}`, mode: 'stub' };
  }

  /** Estimativa de palavras-chave: retorna sugestões com volume aproximado. */
  async keywordIdeas(seed: string, location: string) {
    // Modo stub: retorna sugestões heurísticas coerentes.
    const base = [
      `${seed} em ${location}`,
      `melhor ${seed} ${location}`,
      `${seed} preço ${location}`,
      `${seed} antes e depois`,
      `${seed} como funciona`,
      `clínica de ${seed} ${location}`,
      `${seed} dá certo`,
      `${seed} quanto custa`,
    ];
    return base.map((kw, i) => ({
      keyword: kw,
      avgMonthlySearches: 1500 - i * 120,
      competition: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
      estimatedCpc: Number((0.5 + i * 0.2).toFixed(2)),
    }));
  }
}
