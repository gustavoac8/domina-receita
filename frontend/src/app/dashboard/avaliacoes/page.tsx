'use client';
import { useEffect, useState } from 'react';
import { api, getClinicId } from '@/lib/api';

export default function AvaliacoesPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState('');

  async function reload() {
    const cid = getClinicId();
    if (!cid) return;
    const [list, s] = await Promise.all([
      api.listReviews(cid),
      api.reviewStats(cid),
    ]);
    setReviews(list);
    setStats(s);
  }

  useEffect(() => {
    reload();
  }, []);

  async function sync() {
    const cid = getClinicId();
    if (!cid) return;
    setLoading('sync');
    try {
      await api.syncReviews(cid);
      await reload();
    } finally {
      setLoading('');
    }
  }

  async function draft(id: string) {
    setLoading('draft:' + id);
    try {
      await api.draftReply(id);
      await reload();
    } finally {
      setLoading('');
    }
  }

  async function post(id: string, text: string) {
    if (!text) return;
    setLoading('post:' + id);
    try {
      await api.postReply(id, text);
      await reload();
    } finally {
      setLoading('');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Avaliações</h1>
          <p className="text-slate-500">
            Gestão de reputação no Google Business Profile.
          </p>
        </div>
        <button
          onClick={sync}
          disabled={loading === 'sync'}
          className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50"
        >
          {loading === 'sync' ? 'Sincronizando...' : 'Sincronizar Google'}
        </button>
      </header>

      {stats && (
        <section className="bg-white rounded-xl border p-6 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-500">Média</div>
            <div className="text-3xl font-bold">
              {(stats._avg?.rating ?? 0).toFixed?.(1) ?? 0} ⭐
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Total de reviews</div>
            <div className="text-3xl font-bold">{stats._count ?? 0}</div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma avaliação sincronizada ainda.
          </p>
        ) : (
          reviews.map((r) => (
            <ReviewCard
              key={r.id}
              r={r}
              loading={loading}
              onDraft={() => draft(r.id)}
              onPost={(txt) => post(r.id, txt)}
            />
          ))
        )}
      </section>
    </div>
  );
}

function ReviewCard({
  r,
  loading,
  onDraft,
  onPost,
}: {
  r: any;
  loading: string;
  onDraft: () => void;
  onPost: (txt: string) => void;
}) {
  const [text, setText] = useState(r.reply ?? r.replyDraft ?? '');
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">
          {r.authorName ?? 'Anônimo'} — {r.rating} ⭐
        </div>
        <div className="text-xs text-slate-400">
          {r.postedAt && new Date(r.postedAt).toLocaleDateString('pt-BR')}
        </div>
      </div>
      <p className="text-sm text-slate-700 mt-1">{r.comment}</p>
      <div className="mt-3">
        <textarea
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Resposta..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={onDraft}
            disabled={loading === 'draft:' + r.id}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
          >
            {loading === 'draft:' + r.id ? 'Gerando...' : 'Rascunho com IA'}
          </button>
          <button
            onClick={() => onPost(text)}
            disabled={loading === 'post:' + r.id}
            className="rounded-lg bg-primary px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {r.reply ? 'Atualizar resposta' : 'Publicar resposta'}
          </button>
        </div>
      </div>
    </div>
  );
}
