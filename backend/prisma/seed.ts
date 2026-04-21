import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ---- Usuário demo + clínica ----
  const email = 'demo@dominareceita.com';
  const password = await bcrypt.hash('Demo@1234', 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password, name: 'Dr. Demo', role: 'DOCTOR' },
  });

  const clinic = await prisma.clinic.upsert({
    where: { id: 'demo-clinic' },
    update: {},
    create: {
      id: 'demo-clinic',
      name: 'Clínica Demo',
      specialty: 'Dermatologia',
      city: 'Florianópolis',
      district: 'Centro',
      state: 'SC',
      ownerId: user.id,
    },
  });

  await prisma.lead.createMany({
    data: [
      { clinicId: clinic.id, name: 'Maria Silva', phone: '+55 48 99999-0001', source: 'meta', procedure: 'Botox', value: 1200, stage: 'NEW', tags: ['botox'] },
      { clinicId: clinic.id, name: 'João Souza', phone: '+55 48 99999-0002', source: 'google', procedure: 'Preenchimento', value: 2500, stage: 'QUALIFIED', tags: ['preenchimento'] },
      { clinicId: clinic.id, name: 'Ana Costa', phone: '+55 48 99999-0003', source: 'organic', procedure: 'Consulta', value: 350, stage: 'SCHEDULED', tags: ['consulta'] },
    ],
    skipDuplicates: true,
  });

  // ---- Follow-up templates padrão (testados e aprovados no mercado) ----
  const templates = [
    { code: 'D0',           name: 'Boas-vindas',        channel: 'WHATSAPP', delayDays: 0,
      body: 'Olá {{nome}}! Obrigado pelo interesse em {{clinica}}. Aqui é {{medico}}. Para agilizar seu agendamento, me conta qual procedimento você gostaria de fazer?' },
    { code: 'D2',           name: 'Lembrete de valor',  channel: 'WHATSAPP', delayDays: 2,
      body: 'Oi {{nome}}, tudo bem? Passando para ver se consigo te ajudar com alguma dúvida sobre {{procedimento}}. Temos horários essa semana ainda. 💙' },
    { code: 'D5',           name: 'Prova social',       channel: 'WHATSAPP', delayDays: 5,
      body: 'Oi {{nome}}! Compartilho com você alguns depoimentos de pacientes que fizeram {{procedimento}} com a gente: {{link_depoimentos}}. Posso te reservar um horário?' },
    { code: 'D10',          name: 'Oferta limitada',    channel: 'WHATSAPP', delayDays: 10,
      body: 'Oi {{nome}}! Temos uma condição especial para primeira consulta esta semana. Posso te enviar mais detalhes?' },
    { code: 'POS_CONSULTA', name: 'Pós-consulta (NPS)', channel: 'WHATSAPP', delayDays: 1,
      body: 'Oi {{nome}}! Como foi sua experiência conosco? De 0 a 10, qual a chance de você indicar a clínica a um amigo? Se puder, deixe uma avaliação no Google: {{link_google}}' },
    { code: 'RETORNO_6M',   name: 'Retorno 6 meses',    channel: 'WHATSAPP', delayDays: 180,
      body: 'Oi {{nome}}! Já se passaram 6 meses desde seu último procedimento. Que tal agendar sua manutenção? Respondo por aqui mesmo.' },
    { code: 'RETORNO_12M',  name: 'Retorno 12 meses',   channel: 'WHATSAPP', delayDays: 365,
      body: 'Oi {{nome}}! Faz 1 ano que cuidamos de você. Bora renovar o resultado? Temos um pacote anual com condição especial.' },
  ];

  for (const t of templates) {
    await prisma.followupTemplate.upsert({
      where: { code: t.code },
      update: {},
      create: t as any,
    });
  }

  // ---- Indicação demo ----
  await prisma.referral.upsert({
    where: { code: 'DEMO-MARIA' },
    update: {},
    create: {
      clinicId: clinic.id,
      code: 'DEMO-MARIA',
      referrerName: 'Maria Silva',
      referrerPhone: '+55 48 99999-0001',
      rewardValue: 150,
    },
  });

  // ---- SUPER ADMIN (Gustavo) ----
  const superEmail = 'gustavoac8@gmail.com';
  const superPass = await bcrypt.hash('Domina@2026', 10);
  await prisma.user.upsert({
    where: { email: superEmail },
    update: { role: 'SUPER_ADMIN' },
    create: { email: superEmail, password: superPass, name: 'Gustavo (DominaReceita)', role: 'SUPER_ADMIN' },
  });

  // ---- Marketing leads (CRM interno do Gustavo) ----
  const marketingLeads = [
    { name: 'Dra. Carolina Mendes', email: 'carolina@clinicaderm.com.br', phone: '+55 11 98877-1001', specialty: 'Dermatologia',    city: 'São Paulo',      state: 'SP', source: 'google-ads',  stage: 'NEW',             estimatedValue: 997,  notes: 'Baixou o ebook de faturamento.' },
    { name: 'Dr. Rafael Torres',    email: 'rafael@ortoclin.com.br',      phone: '+55 21 98877-1002', specialty: 'Ortopedia',       city: 'Rio de Janeiro', state: 'RJ', source: 'meta-ads',    stage: 'QUALIFIED',       estimatedValue: 1997, notes: 'Clínica com 3 ortopedistas, quer escalar.' },
    { name: 'Dra. Luísa Prado',     email: 'luisa@plasticabh.com.br',     phone: '+55 31 98877-1003', specialty: 'Cirurgia Plástica', city: 'Belo Horizonte', state: 'MG', source: 'indicacao',   stage: 'DEMO_SCHEDULED',  estimatedValue: 1997, notes: 'Demo agendada 25/04 às 14h.' },
    { name: 'Dr. Felipe Oliveira',  email: 'felipe@cardiosp.com.br',      phone: '+55 11 98877-1004', specialty: 'Cardiologia',     city: 'Campinas',       state: 'SP', source: 'organic',     stage: 'TRIAL',           estimatedValue: 997,  notes: 'Trial 7 dias, dia 3.' },
    { name: 'Dra. Beatriz Costa',   email: 'bia@estetica.com.br',         phone: '+55 48 98877-1005', specialty: 'Estética',        city: 'Florianópolis',  state: 'SC', source: 'webinar',     stage: 'WON',             estimatedValue: 1997, notes: 'Cliente pagante desde mar/26.' },
    { name: 'Dr. Marcos Vieira',    email: 'marcos@uroclin.com.br',       phone: '+55 41 98877-1006', specialty: 'Urologia',        city: 'Curitiba',       state: 'PR', source: 'google-ads',  stage: 'LOST',            estimatedValue: 497,  notes: 'Achou caro, fez MedlinkPro.' },
  ];
  for (const lead of marketingLeads) {
    await prisma.marketingLead.create({ data: lead as any });
  }

  console.log('Seed ok.');
  console.log('  Médico demo:  ', email, '/ Demo@1234');
  console.log('  Super admin:  ', superEmail, '/ Domina@2026');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
