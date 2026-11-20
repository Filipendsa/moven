-- Migration 005: Add shirt_size column and enforce unique CPF per registration

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS shirt_size TEXT NOT NULL DEFAULT 'M'
  CHECK (shirt_size IN ('PP', 'P', 'M', 'G', 'GG', 'XG'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_unique_cpf ON registrations(cpf);
