'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken, setClinicId } from '@/lib/api';
import { Button, Input, Label, Card, CardTitle } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@dominareceita.com');
  const [password, setPassword] = useState('Demo@1234');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const { accessToken } = await api.login(email, password);
      setToken(accessToken);
      // Carrega primeira clínica e fixa como "atual"
      const me = await api.me();
      const clinic = me?.clinics?.[0];
      if (clinic) setClinicId(clinic.id);
      router.push('/dashboard');
    } catch (e: any) {
      setErr(e.message || 'Falha ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-6">
      <Card className="w-full max-w-md">
        <CardTitle className="text-2xl text-center">Entrar</CardTitle>
        <p className="text-center text-sm text-slate-500 mt-1">
          Acesse o painel DominaReceita
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label>E-mail</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Senha</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button disabled={loading} className="w-full" type="submit">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Não tem conta?{' '}
          <Link href="/register" className="text-primary font-semibold">
            Cadastre-se
          </Link>
        </p>
      </Card>
    </div>
  );
}
