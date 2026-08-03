-- Cláusulas adicionais específicas de cada contrato.
-- Contratos existentes recebem um array vazio sem perda de dados.

alter table if exists public.contracts
  add column if not exists custom_clauses jsonb not null default '[]'::jsonb;
