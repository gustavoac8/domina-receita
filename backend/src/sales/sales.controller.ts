import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesService } from './sales.service';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Get('scripts')
  scripts() {
    return this.service.scripts();
  }

  @Post('appointments')
  schedule(@Req() req: any, @Body() body: any) {
    return this.service.schedule(req.user.sub, body);
  }

  @Get('appointments')
  list(@Query('clinicId') clinicId: string) {
    return this.service.list(clinicId);
  }

  @Patch('appointments/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: AppointmentStatus) {
    return this.service.updateStatus(id, status);
  }
}
