import { Body, Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { WhatsappService } from './whatsapp.service';

@ApiTags('integrations')
@Controller('integrations/whatsapp')
export class WhatsappController {
  constructor(private readonly wa: WhatsappService) {}

  @Get('webhook')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && token === this.wa.getVerifyToken()) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('forbidden');
  }

  @Post('webhook')
  @HttpCode(200)
  receive(@Body() body: any) {
    return this.wa.handleIncoming(body);
  }

  @Post('send')
  send(@Body() body: { to: string; message: string }) {
    return this.wa.sendText(body.to, body.message);
  }
}
