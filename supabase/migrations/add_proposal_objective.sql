alter table if exists public.proposals
  add column if not exists proposal_objective text;
