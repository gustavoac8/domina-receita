import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService, private jwt: JwtService) {}

  @Get('overview')
  overview() { return this.admin.overview(); }

  @Get('clinics')
  clinics(@Query('q') q?: string, @Query('specialty') specialty?: string) {
    return this.admin.listClinics({ q, specialty });
  }

  // ---- Meu CRM (MarketingLead) ----
  @Get('leads')
  leads(@Query('stage') stage?: string) { return this.admin.listMarketingLeads(stage); }

  @Post('leads')
  createLead(@Body() body: any) { return this.admin.createMarketingLead(body); }

  @Patch('leads/:id')
  updateLead(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateMarketingLead(id, body);
  }

  @Delete('leads/:id')
  deleteLead(@Param('id') id: string) { return this.admin.deleteMarketingLead(id); }

  // ---- Audit log ----
  @Get('logs')
  logs(@Query('limit') limit?: string) {
    return this.admin.listAuditLogs(limit ? parseInt(limit, 10) : 100);
  }

  // ---- Impersonation ----
  @Post('impersonate/:userId')
  async impersonate(@Param('userId') userId: string, @Req() req: any) {
    const payload = await this.admin.impersonate(req.user.email, userId);
    const token = this.jwt.sign(payload, { expiresIn: '1h' });
    return { token, expiresIn: 3600 };
  }
}

/** Endpoint público — captura leads do formulário do site institucional. Sem auth. */
@ApiTags('public')
@Controller('public/leads')
export class PublicLeadsController {
  constructor(private admin: AdminService) {}

  @Post()
  capture(@Body() body: any, @Req() req: any) {
    return this.admin.captureFromSite({
      ...body,
      utm: { ...body.utm, ip: req.ip, ua: req.headers['user-agent'] },
    });
  }
}
