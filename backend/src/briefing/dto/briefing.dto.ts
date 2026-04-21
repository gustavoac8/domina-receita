import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Briefing com 47 campos agrupados em 7 seções.
 * Recebemos como JSON por seção para manter flexibilidade.
 */
export class CreateBriefingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiProperty({
    description: 'Dados do médico/clínica',
    example: {
      nomeMedico: 'Dr. João Silva',
      crm: 'CRM/SC 12345',
      nomeClinica: 'Clínica Pele Clara',
      cnpj: '00.000.000/0001-00',
      endereco: 'Rua das Flores, 123 - Centro',
      telefone: '+55 48 99999-0000',
      email: 'contato@peleclara.com.br',
      whatsapp: '+55 48 99999-0000',
      instagram: '@drjoao',
      anosExperiencia: 10,
    },
  })
  @IsObject()
  doctor!: Record<string, any>;

  @ApiProperty({
    description: 'Especialidades e procedimentos',
    example: {
      especialidades: ['Dermatologia', 'Estética'],
      procedimentosPrincipais: ['Botox', 'Preenchimento', 'Laser'],
      procedimentosSecundarios: ['Limpeza de pele', 'Peeling'],
      procedimentoCarro_chefe: 'Botox',
      ticketMedio: 1500,
    },
  })
  @IsObject()
  services!: Record<string, any>;

  @ApiProperty({
    description: 'Diferenciais competitivos',
    example: {
      diferenciais: [
        'Tecnologia de ponta',
        'Atendimento humanizado',
        'Equipe especializada',
      ],
      premios: [],
      certificacoes: ['Título de Especialista SBD'],
      midias: [],
    },
  })
  @IsObject()
  differentials!: Record<string, any>;

  @ApiProperty({
    description: 'URLs de fotos/vídeos',
    example: { fotos: [], videos: [], logo: '' },
  })
  @IsObject()
  media!: Record<string, any>;

  @ApiProperty({
    description: 'Tom de voz desejado',
    example: {
      tomPrincipal: 'profissional',
      tomSecundario: 'acolhedor',
      palavrasEvitar: ['barato', 'promoção'],
      palavrasChave: ['cuidado', 'resultado', 'confiança'],
    },
  })
  @IsObject()
  tone!: Record<string, any>;

  @ApiProperty({
    description: 'Objetivos de faturamento',
    example: {
      faturamentoAtual: 50000,
      faturamentoMeta90d: 150000,
      faturamentoMeta180d: 250000,
      procedimentosPorMesMeta: 80,
    },
  })
  @IsObject()
  goals!: Record<string, any>;

  @ApiProperty({
    description: 'Público-alvo detalhado',
    example: {
      idadeMin: 25,
      idadeMax: 55,
      genero: 'predominantemente-feminino',
      classeSocial: 'A-B',
      bairrosAlvo: ['Centro', 'Trindade', 'Jurerê'],
      interesses: ['estética', 'autocuidado', 'fitness'],
    },
  })
  @IsObject()
  audience!: Record<string, any>;
}
