import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FollowupsService } from './followups.service';

@ApiTags('followups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('followups')
export class FollowupsController {
  constructor(private readonly service: FollowupsService) {}

  @Get('templates')
  listTemplates() {
    return this.service.listTemplates();
  }

  @Put('templates')
  upsertTemplate(@Body() body: any) {
    return this.service.upsertTemplate(body);
  }

  @Post('leads/:id/schedule')
  scheduleForLead(
    @Param('id') leadId: string,
    @Body() body: { templateCode: string; when?: string },
  ) {
    return this.service.scheduleForLead(
      leadId,
      body.templateCode,
      body.when ? new Date(body.when) : undefined,
    );
  }

  @Post('leads/:id/enqueue-default')
  enqueueDefault(@Param('id') leadId: string) {
    return this.service.enqueueDefaultSequence(leadId);
  }

  @Get('jobs')
  listJobs(@Query('clinicId') clinicId: string) {
    return this.service.listJobs(clinicId);
  }

  @Delete('jobs/:id')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
