import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RealCompetitor {
  name: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  website?: string;
  phone?: string;
  placeId?: string;
}

/**
 * Google Places API (New) integration.
 *
 * Usa Text Search pra achar concorrentes REAIS de uma especialidade
 * em uma cidade/bairro. Substitui a invenção de nomes pelo Claude.
 *
 * Doc: https://developers.google.com/maps/documentation/places/web-service/text-search
 *
 * Custo aproximado por chamada (Text Search Pro fields):
 *   - Basic data: $0.017 por 1k chars retornados
 *   - Atmosphere data: extra
 * Para 10 lugares com fields básicos + telefone + site: ~$0.03-0.05 por busca.
 */
@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_PLACES_API_KEY') || '';
  }

  /**
   * Busca concorrentes reais via Google Places Text Search.
   * Retorna [] se a API key não estiver configurada ou se houver erro,
   * pra não quebrar o fluxo do diagnóstico.
   */
  async findCompetitors(
    specialty: string,
    city: string,
    district?: string,
    maxResults = 10,
  ): Promise<RealCompetitor[]> {
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_PLACES_API_KEY not set; skipping Places lookup');
      return [];
    }

    const query = district
      ? `${specialty} em ${city} ${district}`
      : `${specialty} em ${city}`;

    try {
      const res = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber',
          },
          body: JSON.stringify({
            textQuery: query,
            languageCode: 'pt-BR',
            regionCode: 'BR',
            maxResultCount: Math.min(maxResults, 20),
          }),
        },
      );

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(
          `Places API error ${res.status}: ${body.slice(0, 200)}`,
        );
        return [];
      }

      const data: any = await res.json();
      const places = Array.isArray(data?.places) ? data.places : [];

      const competitors: RealCompetitor[] = places.map((p: any) => ({
        name: p?.displayName?.text || 'Sem nome',
        address: p?.formattedAddress,
        rating: typeof p?.rating === 'number' ? p.rating : undefined,
        reviewCount:
          typeof p?.userRatingCount === 'number'
            ? p.userRatingCount
            : undefined,
        website: p?.websiteUri,
        phone: p?.nationalPhoneNumber,
        placeId: p?.id,
      }));

      // eslint-disable-next-line no-console
      console.log(
        `[Places] query="${query}" → found ${competitors.length} real competitors`,
      );

      return competitors;
    } catch (err: any) {
      this.logger.error(
        `Places lookup failed: ${err?.message?.slice(0, 200)}`,
      );
      return [];
    }
  }
}
