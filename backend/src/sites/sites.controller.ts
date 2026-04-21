import {
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SitesService } from './sites.service';

@ApiTags('sites')
@Controller('sites')
export class SitesController {
  constructor(private readonly service: SitesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('generate/:briefingId')
  generate(@Param('briefingId') briefingId: string) {
    return this.service.generate(briefingId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  listByClinic(@Query('clinicId') clinicId: string) {
    return this.service.listByClinic(clinicId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  /** Preview público por ID — retorna o HTML renderizado. */
  @Get(':id/preview')
  @Header('Content-Type', 'text/html; charset=utf-8')
  preview(@Param('id') id: string) {
    return this.service.preview(id);
  }

  /** Export ZIP (index.html + robots + sitemap) para upload em qualquer host. */
  @Get(':id/export')
  async exportZip(@Param('id') id: string, @Res() res: Response) {
    const buf = await this.service.exportZip(id);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="site-${id}.zip"`,
    );
    res.send(buf);
  }
}
