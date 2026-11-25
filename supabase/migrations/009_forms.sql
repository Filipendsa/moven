-- ==============================================================================
-- MOVEN · Migration 009: Google Forms-style Dynamic Forms & Responses
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_count INTEGER NOT NULL DEFAULT 0 CHECK (response_count >= 0),
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS forms_slug_idx ON public.forms (slug);
CREATE INDEX IF NOT EXISTS forms_status_idx ON public.forms (status);

CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  device_hash TEXT,
  locale TEXT DEFAULT 'pt',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS form_responses_form_id_idx
  ON public.form_responses (form_id);

-- Enforce 1 response per device when device_hash is stored
CREATE UNIQUE INDEX IF NOT EXISTS form_responses_form_device_uidx
  ON public.form_responses (form_id, device_hash)
  WHERE device_hash IS NOT NULL;

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Atomic response submission + counter increment + auto-close when maxResponses reached
CREATE OR REPLACE FUNCTION public.submit_form_response(
  p_form_id UUID,
  p_answers JSONB,
  p_device_hash TEXT,
  p_locale TEXT DEFAULT 'pt'
)
RETURNS TABLE(response_id UUID, new_status TEXT, new_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_form public.forms%ROWTYPE;
  v_max INTEGER;
  v_closes_at TIMESTAMPTZ;
  v_resp_id UUID;
  v_next_count INTEGER;
  v_next_status TEXT;
BEGIN
  SELECT * INTO v_form
  FROM public.forms
  WHERE id = p_form_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FORM_NOT_FOUND';
  END IF;

  IF v_form.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'FORM_NOT_ACTIVE';
  END IF;

  v_closes_at := NULLIF(v_form.settings->>'closesAt', '')::TIMESTAMPTZ;
  IF v_closes_at IS NOT NULL AND v_closes_at <= NOW() THEN
    UPDATE public.forms
    SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW()
    WHERE id = p_form_id;
    RAISE EXCEPTION 'FORM_CLOSED';
  END IF;

  v_max := NULLIF(v_form.settings->>'maxResponses', '')::INTEGER;
  IF v_max IS NOT NULL AND v_form.response_count >= v_max THEN
    UPDATE public.forms
    SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW()
    WHERE id = p_form_id;
    RAISE EXCEPTION 'FORM_LIMIT_REACHED';
  END IF;

  INSERT INTO public.form_responses (form_id, answers, device_hash, locale)
  VALUES (p_form_id, p_answers, p_device_hash, COALESCE(p_locale, 'pt'))
  RETURNING id INTO v_resp_id;

  v_next_count := v_form.response_count + 1;
  v_next_status := CASE
    WHEN v_max IS NOT NULL AND v_next_count >= v_max THEN 'CLOSED'
    ELSE 'ACTIVE'
  END;

  UPDATE public.forms
  SET
    response_count = v_next_count,
    status = v_next_status,
    closed_at = CASE WHEN v_next_status = 'CLOSED' THEN NOW() ELSE closed_at END,
    updated_at = NOW()
  WHERE id = p_form_id;

  RETURN QUERY SELECT v_resp_id, v_next_status, v_next_count;
END;
$$;
