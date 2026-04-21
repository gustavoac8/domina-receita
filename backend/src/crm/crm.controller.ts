import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CrmService } from './crm.service';
import {
  AddLeadActivityDto,
  CreateLeadDto,
  LeadStageDto,
  UpdateLeadStageDto,
} from './dto/lead.dto';

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly service: CrmService) {}

  @Post('leads')
  create(@Req() req: any, @Body() dto: CreateLeadDto) {
    return this.service.create(req.user.sub, dto);
  }

  @Get('leads')
  list(
    @Query('clinicId') clinicId: string,
    @Query('stage') stage?: LeadStageDto,
  ) {
    return this.service.list(clinicId, stage as any);
  }

  @Get('board')
  board(@Query('clinicId') clinicId: string) {
    return this.service.board(clinicId);
  }

  @Get('followups/pending')
  pending(@Query('clinicId') clinicId: string) {
    return this.service.pendingFollowups(clinicId);
  }

  @Get('leads/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('leads/:id/stage')
  updateStage(@Param('id') id: string, @Body() dto: UpdateLeadStageDto) {
    return this.service.updateStage(id, dto);
  }

  @Post('leads/:id/activities')
  addActivity(@Param('id') id: string, @Body() dto: AddLeadActivityDto) {
    return this.service.addActivity(id, dto);
  }
}
