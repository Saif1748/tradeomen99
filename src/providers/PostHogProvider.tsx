import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY as string, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      // Disable capturing automatically in development to not clutter data
      capture_pageview: false, // We handle this manually for React Router
      loaded: (posthog) => {
        if (import.meta.env.DEV) posthog.opt_out_capturing();
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}