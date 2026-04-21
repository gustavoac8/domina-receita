import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GoogleAdsService } from './google-ads.service';
import { GoogleBusinessService } from './google-business.service';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations/google')
export class GoogleController {
  constructor(
    private readonly ads: GoogleAdsService,
    private readonly gmb: GoogleBusinessService,
  ) {}

  @Get('keywords')
  keywords(@Query('seed') seed: string, @Query('location') location: string) {
    return this.ads.keywordIdeas(seed || '', location || '');
  }

  @Post('reviews/sync')
  syncReviews(@Query('clinicId') clinicId: string) {
    return this.gmb.syncReviews(clinicId);
  }

  @Get('status')
  status() {
    return {
      ads: this.ads.isConfigured() ? 'CONNECTED' : 'STUB',
      gmb: this.gmb.isConfigured() ? 'CONNECTED' : 'STUB',
    };
  }
}
