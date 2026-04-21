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
import { DiagnosticoService } from './diagnostico.service';
import { CreateDiagnosticoDto } from './dto/diagnostico.dto';

@ApiTags('diagnostico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('diagnostico')
export class DiagnosticoController {
  constructor(private readonly service: DiagnosticoService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateDiagnosticoDto) {
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
