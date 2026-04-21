import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SeoService } from './seo.service';

@ApiTags('seo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('seo')
export class SeoController {
  constructor(private readonly service: SeoService) {}

  @Get('audit')
  audit(@Query('url') url: string) {
    return this.service.audit(url);
  }

  @Get('keywords')
  keywords(@Query('seed') seed: string, @Query('location') location: string) {
    return this.service.keywords(seed, location);
  }

  @Post('articles')
  generateArticle(@Req() req: any, @Body() body: { clinicId?: string; keyword: string; topic?: string }) {
    return this.service.generateArticle(req.user.sub, body);
  }

  @Get('articles')
  list(@Query('clinicId') clinicId: string) {
    return this.service.list(clinicId);
  }

  @Get('articles/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
