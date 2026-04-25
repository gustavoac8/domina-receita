import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AI adapter.
 *
 * Providers suportados:
 *  - "mock"      → respostas determinísticas (default, útil p/ dev)
 *  - "anthropic" → Claude (precisa AI_API_KEY)
 *  - "openai"    → GPT  (precisa AI_API_KEY)
 *
 * Para trocar de provider em produção é só mudar as envs.
 * Aqui a implementação real é stubada; a ideia é ter o contrato pronto.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.provider = this.config.get<string>('AI_PROVIDER') || 'mock';
    this.apiKey = this.config.get<string>('AI_API_KEY') || '';
    this.model =
      this.config.get<string>('AI_MODEL') || 'claude-3-5-sonnet-latest';
  }

  async complete(prompt: string, system?: string): Promise<string> {
    if (this.provider === 'mock' || !this.apiKey) {
      return this.mockComplete(prompt, system);
    }

    try {
      if (this.provider === 'anthropic') {
        return await this.anthropicComplete(prompt, system);
      }
      if (this.provider === 'openai') {
        return await this.openaiComplete(prompt, system);
      }
    } catch (err) {
      this.logger.error('AI provider error; falling back to mock', err as any);
    }
    return this.mockComplete(prompt, system);
  }

  // -------------- MOCK determinístico --------------
  private mockComplete(prompt: string, _system?: string): string {
    // Resposta genérica estruturada para dev.
    return JSON.stringify({
      _mock: true,
      echo: prompt.slice(0, 200),
      generatedAt: new Date().toISOString(),
    });
  }

  // -------------- Anthropic (Claude) --------------
  private async anthropicComplete(
    prompt: string,
    system?: string,
  ): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 8192,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data: any = await res.json();
    return data?.content?.[0]?.text ?? '';
  }

  // -------------- OpenAI --------------
  private async openaiComplete(
    prompt: string,
    system?: string,
  ): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data: any = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  }
}
