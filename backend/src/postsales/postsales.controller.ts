import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsalesService } from './postsales.service';

@ApiTags('postsales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('postsales')
export class PostsalesController {
  constructor(private readonly service: PostsalesService) {}

  @Get('reminders')
  list(@Query('clinicId') clinicId: string) {
    return this.service.list(clinicId);
  }

  @Post('reminders')
  enroll(
    @Body() body: { leadId: string; intervalMonths?: number; message?: string },
  ) {
    return this.service.enrollFromAttended(
      body.leadId,
      body.intervalMonths,
      body.message,
    );
  }

  @Delete('reminders/:id')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Get('annual-package-candidates')
  candidates(@Query('clinicId') clinicId: string) {
    return this.service.annualPackageCandidates(clinicId);
  }
}
