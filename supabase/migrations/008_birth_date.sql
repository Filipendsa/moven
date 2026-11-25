-- ==============================================================================
-- MOVEN · Migration 008: Participant Birth Date (for age calculation)
-- ==============================================================================

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS birth_date DATE;
