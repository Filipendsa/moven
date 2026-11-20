-- Migration 006: Track automated welcome and 7-day payment reminder notifications

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_registrations_pending_reminder
  ON registrations(payment_status, created_at)
  WHERE payment_reminder_sent_at IS NULL;
