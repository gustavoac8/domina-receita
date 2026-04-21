import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get()
  list(@Query('clinicId') clinicId: string) {
    return this.service.list(clinicId);
  }

  @Get('stats')
  stats(@Query('clinicId') clinicId: string) {
    return this.service.stats(clinicId);
  }

  @Post('sync')
  sync(@Body('clinicId') clinicId: string) {
    return this.service.syncFromGoogle(clinicId);
  }

  @Post(':id/reply-draft')
  draft(@Param('id') id: string) {
    return this.service.generateReplyDraft(id);
  }

  @Post(':id/reply')
  reply(@Param('id') id: string, @Body('text') text: string) {
    return this.service.postReply(id, text);
  }
}
