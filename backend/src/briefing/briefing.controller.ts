import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BriefingService } from './briefing.service';
import { CreateBriefingDto } from './dto/briefing.dto';

@ApiTags('briefing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('briefing')
export class BriefingController {
  constructor(private readonly service: BriefingService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateBriefingDto) {
    return this.service.create(req.user.sub, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get()
  listByClinic(@Query('clinicId') clinicId: string) {
    return this.service.listByClinic(clinicId);
  }
}
