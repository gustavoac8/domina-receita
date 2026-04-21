import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlansService } from './plans.service';

@ApiTags('plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Post('generate')
  generate(@Req() req: any, @Query('clinicId') clinicId?: string) {
    return this.service.generate(req.user.sub, clinicId);
  }

  @Get()
  list(@Query('clinicId') clinicId: string) {
    return this.service.list(clinicId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
