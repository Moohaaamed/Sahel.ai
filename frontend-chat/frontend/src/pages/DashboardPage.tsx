import { useEffect, useState, useCallback } from 'react';
import { getOwner, clearAuth, fetchAnalytics, fetchInquiries, updateInquiryStatus, fetchOwnerBusinesses, authHeaders } from '../lib/auth';

interface Analytics {
  total_messages: number;
  total_conversations: number;
  language_counts: Record<string, number>;
  top_questions: Array<{ question: string; count: number }>;
  recent_messages: Array<{ question: string; answer: string; created_at: string }>;
}

interface Inquiry {
  id: string;
  name: string;
  contact: string;
  message: string;
  status: string;
  created_at: string;
}

interface Business {
  id: string;
  slug: string;
  name: string;
  business_type: string;
}

interface DashboardPageProps {
  onLogout: () => void;
}

export function DashboardPage({ onLogout }: DashboardPageProps) {
  const owner = getOwner();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<'analytics' | 'inquiries'>('analytics');

  useEffect(() => {
    if (!owner) return;
    fetchOwnerBusinesses(owner.id)
      .then((list) => {
        setBusinesses(list);
        if (list.length > 0) setActiveSlug(list[0].slug);
      })
      .catch((e) => setError(e.message));
  }, [owner]);

  useEffect(() => {
    if (!activeSlug) return;
    fetchAnalytics(activeSlug)
      .then(setAnalytics)
      .catch((e) => setError(e.message));
    fetchInquiries(activeSlug)
      .then((data) => setInquiries(data.inquiries ?? []))
      .catch((e) => setError(e.message));
  }, [activeSlug]);

  const handleStatusUpdate = useCallback(async (inquiryId: string, status: string) => {
    try {
      await updateInquiryStatus(activeSlug, inquiryId, status);
      setInquiries((prev) =>
        prev.map((i) => (i.id === inquiryId ? { ...i, status } : i))
      );
      setSuccess(`Inquiry marked as ${status}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update inquiry');
    }
  }, [activeSlug]);

  const handleLogout = () => {
    clearAuth();
    onLogout();
  };

  const statusColor = (s: string) =>
    s === 'new' ? 'bg-yellow-100 text-yellow-800' :
    s === 'contacted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';

  const langLabels: Record<string, string> = { ar: 'Arabic', fr: 'French', en: 'English' };

  if (!owner) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Sahel.ai Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{owner.full_name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
            {success}
          </div>
        )}

        {businesses.length > 1 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            {businesses.map((b) => (
              <button
                key={b.slug}
                onClick={() => setActiveSlug(b.slug)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  activeSlug === b.slug
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-surface text-foreground border-border hover:border-primary/50'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}

        <div className="mb-6 flex gap-4 border-b border-border">
          <button
            onClick={() => setTab('analytics')}
            className={`pb-2 text-sm font-medium transition border-b-2 ${
              tab === 'analytics' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setTab('inquiries')}
            className={`pb-2 text-sm font-medium transition border-b-2 ${
              tab === 'inquiries' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'
            }`}
          >
            Inquiries ({inquiries.length})
          </button>
        </div>

        {tab === 'analytics' && analytics && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface border border-border rounded-xl p-5">
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-3xl font-bold text-foreground mt-1">{analytics.total_messages}</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-5">
                <p className="text-sm text-muted-foreground">Conversations</p>
                <p className="text-3xl font-bold text-foreground mt-1">{analytics.total_conversations}</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-5">
                <p className="text-sm text-muted-foreground">Languages</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {Object.entries(analytics.language_counts).map(([lang, count]) =>
                    count > 0 ? (
                      <span key={lang} className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-foreground">
                        {langLabels[lang] ?? lang}: {count}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            </div>

            {analytics.top_questions.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Top Questions</h3>
                <div className="space-y-2">
                  {analytics.top_questions.map((q, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm text-foreground">{q.question}</span>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{q.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.recent_messages.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Messages</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {analytics.recent_messages.map((m, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary/50 text-sm">
                      <p className="font-medium text-foreground">Q: {m.question}</p>
                      <p className="text-muted-foreground mt-1 line-clamp-2">A: {m.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'inquiries' && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {inquiries.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No inquiries yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground text-sm">{inq.name}</span>
                          <span className="text-xs text-muted-foreground">{inq.contact}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inq.status)}`}>
                            {inq.status}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{inq.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(inq.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {inq.status !== 'contacted' && (
                          <button
                            onClick={() => handleStatusUpdate(inq.id, 'contacted')}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                          >
                            Contacted
                          </button>
                        )}
                        {inq.status !== 'closed' && (
                          <button
                            onClick={() => handleStatusUpdate(inq.id, 'closed')}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
