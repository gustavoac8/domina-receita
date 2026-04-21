'use client';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('drm_token');
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem('drm_token', token);
  else window.localStorage.removeItem('drm_token');
}

export function setClinicId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) window.localStorage.setItem('drm_clinic', id);
  else window.localStorage.removeItem('drm_clinic');
}

export function getClinicId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('drm_clinic');
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) headers['authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg = (body as any)?.message || res.statusText || 'Request failed';
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return body as T;
}

function safeJson(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return txt;
  }
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name: string) =>
    request<{ accessToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  me: () => request<any>('/auth/me'),

  // Clinics
  listClinics: () => request<any[]>('/clinics'),
  createClinic: (data: any) =>
    request<any>('/clinics', { method: 'POST', body: JSON.stringify(data) }),

  // Diagnóstico
  createDiagnosis: (data: any) =>
    request<any>('/diagnostico', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listDiagnoses: (clinicId: string) =>
    request<any[]>(`/diagnostico?clinicId=${clinicId}`),
  getDiagnosis: (id: string) => request<any>(`/diagnostico/${id}`),

  // Briefing
  createBriefing: (data: any) =>
    request<any>('/briefing', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listBriefings: (clinicId: string) =>
    request<any[]>(`/briefing?clinicId=${clinicId}`),

  // Sites
  generateSite: (briefingId: string) =>
    request<any>(`/sites/generate/${briefingId}`, { method: 'POST' }),
  listSites: (clinicId: string) =>
    request<any[]>(`/sites?clinicId=${clinicId}`),

  // CRM
  listLeads: (clinicId: string) =>
    request<any[]>(`/crm/leads?clinicId=${clinicId}`),
  board: (clinicId: string) =>
    request<Record<string, any[]>>(`/crm/board?clinicId=${clinicId}`),
  createLead: (data: any) =>
    request<any>('/crm/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  moveLead: (id: string, stage: string) =>
    request<any>(`/crm/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    }),
  pendingFollowups: (clinicId: string) =>
    request<any[]>(`/crm/followups/pending?clinicId=${clinicId}`),

  // Campaigns
  createCampaign: (data: any) =>
    request<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listCampaigns: (clinicId: string) =>
    request<any[]>(`/campaigns?clinicId=${clinicId}`),

  // Analytics
  overview: (clinicId: string) =>
    request<any>(`/analytics/overview?clinicId=${clinicId}`),

  // Sites extra
  publishSite: (id: string) =>
    request<any>(`/sites/${id}/publish`, { method: 'PATCH' }),
  siteExportUrl: (id: string) => `${API}/sites/${id}/export`,

  // Plano 90 dias
  generatePlan: (clinicId: string) =>
    request<any>('/plans/generate', {
      method: 'POST',
      body: JSON.stringify({ clinicId }),
    }),
  listPlans: (clinicId: string) =>
    request<any[]>(`/plans?clinicId=${clinicId}`),

  // SEO
  seoAudit: (url: string) =>
    request<any>(`/seo/audit?url=${encodeURIComponent(url)}`),
  seoKeywords: (seed: string, location = 'BR') =>
    request<any>(
      `/seo/keywords?seed=${encodeURIComponent(seed)}&location=${location}`,
    ),
  seoGenerateArticle: (clinicId: string, keyword: string) =>
    request<any>('/seo/articles', {
      method: 'POST',
      body: JSON.stringify({ clinicId, keyword }),
    }),
  listArticles: (clinicId: string) =>
    request<any[]>(`/seo/articles?clinicId=${clinicId}`),

  // Follow-ups
  listTemplates: () => request<any[]>('/followups/templates'),
  upsertTemplate: (data: any) =>
    request<any>('/followups/templates', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  scheduleForLead: (leadId: string, templateCode: string, when?: string) =>
    request<any>(`/followups/leads/${leadId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ templateCode, when }),
    }),
  enqueueDefault: (leadId: string) =>
    request<any>(`/followups/leads/${leadId}/enqueue-default`, {
      method: 'POST',
    }),
  listJobs: (clinicId: string) =>
    request<any[]>(`/followups/jobs?clinicId=${clinicId}`),
  cancelJob: (id: string) =>
    request<any>(`/followups/jobs/${id}`, { method: 'DELETE' }),

  // Sales / Agendamento
  salesScripts: () => request<any>('/sales/scripts'),
  listAppointments: (clinicId: string) =>
    request<any[]>(`/sales/appointments?clinicId=${clinicId}`),
  scheduleAppointment: (data: any) =>
    request<any>('/sales/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAppointmentStatus: (id: string, status: string) =>
    request<any>(`/sales/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Reviews
  listReviews: (clinicId: string) =>
    request<any[]>(`/reviews?clinicId=${clinicId}`),
  reviewStats: (clinicId: string) =>
    request<any>(`/reviews/stats?clinicId=${clinicId}`),
  syncReviews: (clinicId: string) =>
    request<any>('/reviews/sync', {
      method: 'POST',
      body: JSON.stringify({ clinicId }),
    }),
  draftReply: (id: string) =>
    request<any>(`/reviews/${id}/reply-draft`, { method: 'POST' }),
  postReply: (id: string, text: string) =>
    request<any>(`/reviews/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // Pós-venda
  listReminders: (clinicId: string) =>
    request<any[]>(`/postsales/reminders?clinicId=${clinicId}`),
  enrollReminder: (data: any) =>
    request<any>('/postsales/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancelReminder: (id: string) =>
    request<any>(`/postsales/reminders/${id}`, { method: 'DELETE' }),
  annualCandidates: (clinicId: string) =>
    request<any[]>(`/postsales/annual-package-candidates?clinicId=${clinicId}`),

  // Indicações
  listReferrals: (clinicId: string) =>
    request<any[]>(`/referrals?clinicId=${clinicId}`),
  referralStats: (clinicId: string) =>
    request<any>(`/referrals/stats?clinicId=${clinicId}`),
  generateReferralCode: (data: any) =>
    request<any>('/referrals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  trackReferral: (code: string, leadId: string) =>
    request<any>(`/referrals/${code}/track`, {
      method: 'POST',
      body: JSON.stringify({ leadId }),
    }),
  payReferralReward: (code: string, amount: number) =>
    request<any>(`/referrals/${code}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  // Integrações status
  googleStatus: () => request<any>('/integrations/google/status'),
  metaStatus: () => request<any>('/integrations/meta/status'),
};
