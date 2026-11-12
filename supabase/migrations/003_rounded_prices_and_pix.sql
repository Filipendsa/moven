-- Migration 003: Rounded prices (hide interest) and Pix Direct payment provider

-- Update event offerings prices
UPDATE events_config SET price_cents = 17000, updated_at = now() WHERE modality = 'SCHOOL';
UPDATE events_config SET price_cents = 250000, updated_at = now() WHERE modality = 'MISSION';
UPDATE events_config SET price_cents = 267000, updated_at = now() WHERE modality = 'BOTH';

-- Update Amazon 2027 mission price
UPDATE missions SET price_cents = 250000, updated_at = now() WHERE slug = 'amazon-2027';

-- Allow PIX as a payment_provider in registrations
ALTER TABLE registrations
  DROP CONSTRAINT IF EXISTS registrations_payment_provider_check;

ALTER TABLE registrations
  ADD CONSTRAINT registrations_payment_provider_check
  CHECK (payment_provider IN ('EVEN3', 'INFINITEPAY', 'PIX'));

