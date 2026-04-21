/**
 * Template de geração de site HTML a partir do briefing.
 *
 * É uma landing page médica focada em conversão:
 *  - Hero com CTA WhatsApp
 *  - Seção de procedimentos
 *  - Diferenciais
 *  - Prova social
 *  - Formulário de agendamento
 *  - SEO técnico + schema.org médico
 *  - Google Analytics placeholder
 */
type Clinic = {
  name: string;
  specialty: string;
  city: string;
  district?: string | null;
  phone?: string | null;
  instagram?: string | null;
  website?: string | null;
};

type Briefing = {
  doctor: any;
  services: any;
  differentials: any;
  media: any;
  tone: any;
  goals: any;
  audience: any;
};

export function buildSiteHtml({
  briefing,
  clinic,
}: {
  briefing: Briefing;
  clinic: Clinic;
}): string {
  const { doctor, services, differentials } = briefing;
  const procedimentos = services?.procedimentosPrincipais ?? [];
  const diferenciais = differentials?.diferenciais ?? [];
  const whatsapp =
    (doctor?.whatsapp ?? clinic.phone ?? '').toString().replace(/\D/g, '') ||
    '5500000000000';

  const title = `${clinic.name} — ${clinic.specialty} em ${clinic.city}`;
  const description = `${clinic.specialty} em ${clinic.city}${clinic.district ? `, ${clinic.district}` : ''}. Atendimento humanizado com Dr(a). ${doctor?.nomeMedico ?? ''}. Agende sua consulta.`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: clinic.name,
    medicalSpecialty: clinic.specialty,
    address: {
      '@type': 'PostalAddress',
      addressLocality: clinic.city,
      addressRegion: clinic.district ?? '',
    },
    telephone: doctor?.telefone ?? clinic.phone ?? '',
    url: clinic.website ?? '',
  };

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(description)}"/>
<meta property="og:type" content="website"/>
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<!-- Google Analytics 4 (substituir GA_ID) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','GA_ID');</script>
<style>
:root{--primary:#0B6E99;--accent:#E8C547;--dark:#0A2540;--light:#F5F7FA;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter','Helvetica Neue',sans-serif;color:var(--dark);line-height:1.6;}
.container{max-width:1100px;margin:0 auto;padding:0 24px;}
header{background:var(--primary);color:#fff;padding:16px 0;position:sticky;top:0;z-index:10;}
header .container{display:flex;justify-content:space-between;align-items:center;}
header h1{font-size:20px;font-weight:600;}
header a.cta{background:var(--accent);color:var(--dark);padding:8px 16px;border-radius:999px;font-weight:600;text-decoration:none;}
.hero{background:linear-gradient(135deg,#0B6E99,#083D5C);color:#fff;padding:80px 0;}
.hero h2{font-size:clamp(28px,4vw,44px);max-width:700px;margin-bottom:16px;}
.hero p{font-size:18px;max-width:600px;margin-bottom:32px;opacity:.92;}
.hero a{display:inline-block;background:var(--accent);color:var(--dark);padding:14px 28px;border-radius:999px;font-weight:700;text-decoration:none;}
section{padding:60px 0;}
section.alt{background:var(--light);}
section h3{font-size:28px;margin-bottom:24px;}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;}
.card{background:#fff;border-radius:12px;padding:24px;box-shadow:0 4px 20px rgba(10,37,64,.06);}
.card h4{color:var(--primary);margin-bottom:8px;}
.whatsapp-float{position:fixed;bottom:24px;right:24px;background:#25D366;color:#fff;width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:100;}
footer{background:var(--dark);color:#fff;padding:40px 0;text-align:center;font-size:14px;}
form{display:grid;gap:12px;max-width:520px;margin:0 auto;}
form input,form select,form textarea{padding:12px;border:1px solid #d1d5db;border-radius:8px;font:inherit;}
form button{background:var(--primary);color:#fff;padding:14px;border:0;border-radius:8px;font-weight:700;cursor:pointer;}
</style>
</head>
<body>
<header>
  <div class="container">
    <h1>${escapeHtml(clinic.name)}</h1>
    <a class="cta" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener">Agendar via WhatsApp</a>
  </div>
</header>

<section class="hero">
  <div class="container">
    <h2>${escapeHtml(doctor?.nomeMedico ?? 'Dr(a).')} — ${escapeHtml(clinic.specialty)} em ${escapeHtml(clinic.city)}</h2>
    <p>${escapeHtml(description)}</p>
    <a href="#agendar">Agendar minha consulta</a>
  </div>
</section>

<section class="alt">
  <div class="container">
    <h3>Principais procedimentos</h3>
    <div class="grid">
      ${procedimentos
        .slice(0, 8)
        .map(
          (p: string) => `
        <div class="card">
          <h4>${escapeHtml(p)}</h4>
          <p>Atendimento individualizado com foco em resultado e segurança.</p>
        </div>`,
        )
        .join('')}
    </div>
  </div>
</section>

<section>
  <div class="container">
    <h3>Por que escolher ${escapeHtml(clinic.name)}?</h3>
    <div class="grid">
      ${diferenciais
        .slice(0, 6)
        .map(
          (d: string) => `
        <div class="card">
          <h4>★</h4>
          <p>${escapeHtml(d)}</p>
        </div>`,
        )
        .join('')}
    </div>
  </div>
</section>

<section class="alt" id="agendar">
  <div class="container">
    <h3>Agende sua consulta</h3>
    <form onsubmit="event.preventDefault();alert('Obrigado! Entraremos em contato em breve.');">
      <input required placeholder="Nome completo" name="name"/>
      <input required type="tel" placeholder="WhatsApp" name="phone"/>
      <input type="email" placeholder="E-mail" name="email"/>
      <select name="procedimento">
        <option value="">Procedimento de interesse</option>
        ${procedimentos.map((p: string) => `<option>${escapeHtml(p)}</option>`).join('')}
      </select>
      <textarea placeholder="Como podemos ajudar?" name="message" rows="3"></textarea>
      <button type="submit">Quero agendar</button>
    </form>
  </div>
</section>

<footer>
  <div class="container">
    <p>${escapeHtml(clinic.name)} — ${escapeHtml(clinic.city)}${clinic.district ? `, ${escapeHtml(clinic.district)}` : ''}</p>
    <p>${escapeHtml(doctor?.crm ?? '')}</p>
  </div>
</footer>

<a class="whatsapp-float" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">💬</a>
</body>
</html>`;
}

function escapeHtml(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
