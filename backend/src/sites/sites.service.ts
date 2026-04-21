import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import JSZip from 'jszip';
import { PrismaService } from '../prisma/prisma.service';
import { BriefingService } from '../briefing/briefing.service';
import { buildSiteHtml } from './site-template';

@Injectable()
export class SitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly briefings: BriefingService,
    private readonly config: ConfigService,
  ) {}

  async generate(briefingId: string) {
    const briefing = await this.briefings.findOne(briefingId);
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: briefing.clinicId },
    });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');

    const html = buildSiteHtml({ briefing, clinic });
    const slug = this.makeSlug(clinic.name);

    return this.prisma.site.create({
      data: {
        briefingId: briefing.id,
        clinicId: clinic.id,
        slug: `${slug}-${Date.now().toString(36)}`,
        html,
        status: 'DRAFT',
      },
    });
  }

  async findOne(id: string) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) throw new NotFoundException('Site não encontrado');
    return site;
  }

  async preview(id: string) {
    const site = await this.findOne(id);
    return site.html;
  }

  async publish(id: string) {
    const site = await this.findOne(id);
    const base = this.config.get<string>('PUBLIC_BASE_URL') || '';
    const publishedUrl = `${base.replace(/\/$/, '')}/sites/${site.id}/preview`;
    return this.prisma.site.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedUrl },
    });
  }

  listByClinic(clinicId: string) {
    return this.prisma.site.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Gera um ZIP estático (index.html + robots.txt + sitemap.xml) pronto para upload em Vercel/Netlify/host tradicional. */
  async exportZip(id: string): Promise<Buffer> {
    const site = await this.findOne(id);
    const base =
      site.publishedUrl ||
      `${(this.config.get<string>('PUBLIC_BASE_URL') || '').replace(/\/$/, '')}/sites/${site.id}/preview`;

    const zip = new JSZip();
    zip.file('index.html', site.html);
    zip.file(
      'robots.txt',
      `User-agent: *\nAllow: /\nSitemap: ${base.replace(/\/$/, '')}/sitemap.xml\n`,
    );
    zip.file(
      'sitemap.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
    );
    zip.file(
      'README.txt',
      `Site gerado automaticamente pela DominaReceita Médica.
Faça upload deste conteúdo em qualquer host estático (Vercel, Netlify, AWS S3, Hostgator).
Lembre-se de apontar o DNS do seu domínio para o endereço do host escolhido.
`,
    );
    return zip.generateAsync({ type: 'nodebuffer' });
  }

  private makeSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
