import { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

type ServiceKey = 'backend' | 'ai';

type ServiceState =
  | { status: 'ready' }
  | { status: 'connecting' }
  | { status: 'error'; message: string };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

function deriveBackendOrigin(): string {
  const api = import.meta.env.VITE_API_URL;

  // Relative API path → assume same-origin backend (dev/proxy setups)
  if (!api || api.startsWith('/')) return window.location.origin;

  return api.replace(/\/api\/?$/, '');
}

function getHealthUrls() {
  const backendOrigin = deriveBackendOrigin();
  const backendHealth = `${backendOrigin}/health`;

  const aiOrigin = import.meta.env.VITE_AI_SERVICE_URL;
  const aiHealth = aiOrigin ? `${aiOrigin.replace(/\/$/, '')}/health` : '';

  return { backendHealth, aiHealth };
}

async function checkHealth(url: string, expectedService?: string) {
  const res = await withTimeout(fetch(url, { cache: 'no-store' }), 8000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = (await res.json()) as unknown;
  if (expectedService && typeof data === 'object' && data) {
    const svc = (data as { service?: unknown }).service;
    if (svc && svc !== expectedService) throw new Error('Unexpected service');
  }
}

export function StartupGate({ children }: { children: React.ReactNode }) {
  const { backendHealth, aiHealth } = useMemo(getHealthUrls, []);

  const [showGate, setShowGate] = useState(false);
  const [services, setServices] = useState<Record<ServiceKey, ServiceState>>({
    backend: { status: 'connecting' },
    ai: { status: 'connecting' },
  });

  const pollRef = useRef<number | null>(null);

  const setService = (key: ServiceKey, next: ServiceState) => {
    setServices((prev) => ({ ...prev, [key]: next }));
  };

  const bothReady = services.backend.status === 'ready' && services.ai.status === 'ready';

  useEffect(() => {
    let cancelled = false;

    async function initialProbe() {
      try {
        // If AI URL isn't configured, we treat it as an error (so it’s visible early)
        if (!aiHealth) {
          setService('ai', { status: 'error', message: 'AI Service URL not configured' });
          setShowGate(true);
          return;
        }

        await Promise.all([
          checkHealth(backendHealth, 'backend'),
          checkHealth(aiHealth, 'ai-service'),
        ]);

        if (!cancelled) {
          setService('backend', { status: 'ready' });
          setService('ai', { status: 'ready' });
          setShowGate(false);
        }
      } catch {
        if (!cancelled) {
          setShowGate(true);
        }
      }
    }

    initialProbe();

    return () => {
      cancelled = true;
    };
  }, [backendHealth, aiHealth]);

  useEffect(() => {
    if (!showGate || bothReady) return;

    const tick = async () => {
      // Backend
      try {
        setService('backend', { status: 'connecting' });
        await checkHealth(backendHealth, 'backend');
        setService('backend', { status: 'ready' });
      } catch (e) {
        setService('backend', {
          status: 'error',
          message: e instanceof Error ? e.message : 'Unavailable',
        });
      }

      // AI
      if (!aiHealth) return;
      try {
        setService('ai', { status: 'connecting' });
        await checkHealth(aiHealth, 'ai-service');
        setService('ai', { status: 'ready' });
      } catch (e) {
        setService('ai', {
          status: 'error',
          message: e instanceof Error ? e.message : 'Unavailable',
        });
      }
    };

    void tick();
    pollRef.current = window.setInterval(tick, 4000);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [showGate, bothReady, backendHealth, aiHealth]);

  useEffect(() => {
    if (!showGate) return;
    if (!bothReady) return;
    setShowGate(false);
  }, [showGate, bothReady]);

  if (!showGate) return <>{children}</>;

  const row = (label: string, state: ServiceState) => {
    const text =
      state.status === 'ready'
        ? '[Ready]'
        : state.status === 'connecting'
          ? '[Connecting...]'
          : '[Connecting...]';

    return (
      <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
        <div className="text-sm font-medium">{label}</div>
        <div className="flex items-center gap-3">
          {state.status !== 'ready' ? <Spinner size="sm" /> : null}
          <div className="text-sm text-[var(--color-muted-foreground)]">{text}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-background)]">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-10">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Starting LawMittr Services</h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Please wait. Free Render services may take up to 60 seconds to wake up.
          </p>

          <div className="mt-5 space-y-3">
            {row('Backend', services.backend)}
            {row('AI Service', services.ai)}
          </div>
        </div>
      </div>
    </div>
  );
}

