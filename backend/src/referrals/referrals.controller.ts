import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReferralsService } from './referrals.service';

@ApiTags('referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly service: ReferralsService) {}

  @Get()
  list(@Query('clinicId') clinicId: string) {
    return this.service.list(clinicId);
  }

  @Get('stats')
  stats(@Query('clinicId') clinicId: string) {
    return this.service.stats(clinicId);
  }

  @Post()
  create(
    @Body()
    body: {
      clinicId: string;
      referrerName: string;
      referrerPhone?: string;
      rewardType?: string;
      rewardValue?: number;
    },
  ) {
    return this.service.generateCode(body);
  }

  @Post(':code/track')
  track(@Param('code') code: string, @Body('leadId') leadId: string) {
    return this.service.trackUsage(code, leadId);
  }

  @Post(':code/pay')
  pay(@Param('code') code: string, @Body('amount') amount: number) {
    return this.service.payReward(code, amount);
  }
}
