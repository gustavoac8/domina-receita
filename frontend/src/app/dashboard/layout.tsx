'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { api, getClinicId, setClinicId, setToken } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Visão geral', icon: '📊' },
  { href: '/dashboard/diagnostico', label: 'Diagnóstico IA', icon: '🔎' },
  { href: '/dashboard/briefing', label: 'Briefing & Site', icon: '🧩' },
  { href: '/dashboard/plano-90d', label: 'Plano 90 dias', icon: '🗺️' },
  { href: '/dashboard/crm', label: 'CRM', icon: '👥' },
  { href: '/dashboard/campanhas', label: 'Tráfego & ADS', icon: '🚀' },
  { href: '/dashboard/seo', label: 'SEO & Conteúdo', icon: '📝' },
  { href: '/dashboard/follow-ups', label: 'Follow-ups', icon: '⏱️' },
  { href: '/dashboard/vendas', label: 'Vendas', icon: '💬' },
  { href: '/dashboard/avaliacoes', label: 'Avaliações', icon: '⭐' },
  { href: '/dashboard/pos-venda', label: 'Pós-venda', icon: '🔄' },
  { href: '/dashboard/indicacoes', label: 'Indicações', icon: '🎁' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let data = await api.me();
        // Auto-cria uma clínica default se usuário novo ainda não tem
        if (!data?.clinics?.length) {
          await api.createClinic({
            name: `${data?.name ?? 'Minha'} — Clínica`,
            specialty: 'Geral',
            city: 'A definir',
          });
          data = await api.me();
        }
        setMe(data);
        if (!getClinicId() && data?.clinics?.[0]) {
          setClinicId(data.clinics[0].id);
        }
      } catch {
        router.push('/login');
        return;
      }
      setReady(true);
    })();
  }, [router]);

  function logout() {
    setToken(null);
    setClinicId(null);
    router.push('/login');
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="font-bold text-lg">DominaReceita</div>
          <div className="text-xs text-slate-400">{me?.name}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const active =
              pathname === n.href || pathname.startsWith(n.href + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                  active
                    ? 'bg-primary text-white'
                    : 'text-slate-300 hover:bg-slate-800',
                )}
              >
                <span>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="m-3 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Sair
        </button>
      </aside>
      <main className="flex-1 bg-slate-50 p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
