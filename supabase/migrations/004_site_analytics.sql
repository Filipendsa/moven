-- ==============================================================================
-- MOVEN · Migration 004: Anti-Bot Site Analytics (Visits & Interested People)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.site_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_hash TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('VISIT', 'INTEREST')),
  source TEXT,
  locale TEXT DEFAULT 'pt',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deduplicate per unique anonymous visitor hash and event type
CREATE UNIQUE INDEX IF NOT EXISTS site_analytics_visitor_event_uidx
  ON public.site_analytics (visitor_hash, event_type);

CREATE INDEX IF NOT EXISTS site_analytics_event_type_idx
  ON public.site_analytics (event_type);

-- Enable RLS (accessed exclusively via server-side secret key in /api/analytics)
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;
