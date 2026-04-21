import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { MetaService } from './meta.service';

@ApiTags('integrations')
@Controller('integrations/meta')
export class MetaController {
  constructor(private readonly meta: MetaService) {}

  /** Verificação do webhook (hub.challenge). */
  @Get('webhook')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && token === this.meta.getVerifyToken()) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('forbidden');
  }

  /** Recebimento de eventos (leadgen, feed, etc). */
  @Post('webhook')
  @HttpCode(200)
  async receive(@Body() body: any) {
    if (body.object === 'page') {
      return this.meta.handleLeadgenWebhook(body);
    }
    return { ok: true, ignored: true };
  }

  @Get('status')
  status() {
    return {
      meta: this.meta.isConfigured() ? 'CONNECTED' : 'STUB',
    };
  }
}
