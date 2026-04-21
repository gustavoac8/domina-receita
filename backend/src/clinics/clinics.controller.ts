import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/clinic.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('clinics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly service: ClinicsService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.sub);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateClinicDto) {
    return this.service.create(req.user.sub, dto);
  }
}
