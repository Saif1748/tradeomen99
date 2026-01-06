import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';

export default function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.PROD) {
        posthog.capture('$pageview');
    }
  }, [location]);

  return null;
}