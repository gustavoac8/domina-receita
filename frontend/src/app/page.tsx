import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-primary">
            DominaReceita <span className="text-slate-400 font-normal">Médica</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-primary">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary-700"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-primary to-primary-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl">
            Aumente o faturamento da sua clínica em 3x–5x em 90–120 dias.
          </h1>
          <p className="mt-6 text-lg max-w-2xl opacity-90">
            Diagnóstico de concorrentes, geração de site, CRM e campanhas — tudo
            integrado em uma plataforma feita para médicos.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/register"
              className="rounded-full bg-accent text-slate-900 px-6 py-3 font-bold hover:brightness-95"
            >
              Quero aumentar meu faturamento
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/40 text-white px-6 py-3 font-bold hover:bg-white/10"
            >
              Já sou cadastrado
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold">Como funciona</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            {
              n: '01',
              t: 'Diagnóstico IA',
              d: 'Analisamos seus concorrentes em minutos.',
            },
            {
              n: '02',
              t: 'Briefing + Site',
              d: 'Você preenche um formulário e recebe um site pronto.',
            },
            {
              n: '03',
              t: 'Tráfego + CRM',
              d: 'Captura leads e acompanha em um funil claro.',
            },
            {
              n: '04',
              t: 'Faturamento 3x',
              d: 'Follow-up automático fecha mais consultas.',
            },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-accent font-bold">{s.n}</div>
              <div className="mt-2 font-semibold">{s.t}</div>
              <p className="mt-1 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 text-center text-sm text-slate-500 py-8">
        © {new Date().getFullYear()} DominaReceita Médica
      </footer>
    </div>
  );
}
