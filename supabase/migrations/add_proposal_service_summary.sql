-- Resumo editável do serviço exibido nos cards internos da proposta.
-- O PDF continua usando a lista detalhada de serviços; este campo preserva
-- o texto resumido editado pelo usuário na aba Propostas.

alter table if exists public.proposals
  add column if not exists proposal_service_summary text;

