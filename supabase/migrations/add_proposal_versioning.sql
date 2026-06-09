-- Versionamento seguro de propostas comerciais.
-- Execute este arquivo no Supabase SQL Editor antes de usar "Gerar nova versão"
-- para persistir qual proposta está ativa e quais ficaram como histórico.

alter table if exists public.proposals
  add column if not exists is_active boolean not null default true,
  add column if not exists version_number integer not null default 1,
  add column if not exists replaced_by_proposal_id uuid null references public.proposals(id) on delete set null,
  add column if not exists replaced_at timestamp with time zone null;

with ranked as (
  select
    id,
    row_number() over (
      partition by process_id
      order by coalesce(generated_at, proposal_date, created_at) desc, created_at desc
    ) as active_rank,
    row_number() over (
      partition by process_id
      order by coalesce(generated_at, proposal_date, created_at), created_at, proposal_number
    ) as version_rank
  from public.proposals
)
update public.proposals proposal
set
  is_active = ranked.active_rank = 1,
  version_number = ranked.version_rank
from ranked
where proposal.id = ranked.id;

create index if not exists idx_proposals_process_active
  on public.proposals(process_id, is_active);

