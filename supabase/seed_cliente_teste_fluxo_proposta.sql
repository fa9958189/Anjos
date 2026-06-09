do $$
declare
  v_client_id uuid;
  v_property_id uuid;
  v_process_id uuid;
begin
  select id
    into v_client_id
    from public.clients
   where document = '00.000.000/0001-99'
   limit 1;

  if v_client_id is null then
    insert into public.clients (
      id,
      type,
      name,
      document,
      phone,
      email,
      address,
      city,
      state,
      source,
      responsible,
      demand,
      notes,
      status
    )
    values (
      gen_random_uuid(),
      'pessoa_juridica',
      'CLIENTE TESTE FLUXO PROPOSTA',
      '00.000.000/0001-99',
      '+55 63 99999-0000',
      'teste@anjosambiental.com.br',
      'Fazenda Teste, Zona Rural',
      'Araguaína',
      'TO',
      'Teste interno',
      'Comercial',
      'Teste de fluxo completo para geração de proposta comercial.',
      'Cliente criado apenas para validação do sistema.',
      'com_processo_ativo'
    )
    returning id into v_client_id;
  else
    update public.clients
       set type = 'pessoa_juridica',
           name = 'CLIENTE TESTE FLUXO PROPOSTA',
           phone = '+55 63 99999-0000',
           email = 'teste@anjosambiental.com.br',
           address = 'Fazenda Teste, Zona Rural',
           city = 'Araguaína',
           state = 'TO',
           source = 'Teste interno',
           responsible = 'Comercial',
           demand = 'Teste de fluxo completo para geração de proposta comercial.',
           notes = 'Cliente criado apenas para validação do sistema.',
           status = 'com_processo_ativo'
     where id = v_client_id;
  end if;

  select id
    into v_property_id
    from public.properties
   where client_id = v_client_id
     and name = 'Fazenda Teste'
   limit 1;

  if v_property_id is null then
    insert into public.properties (
      id,
      client_id,
      name,
      type,
      city,
      state,
      address,
      total_area,
      productive_area,
      environmental_notes
    )
    values (
      gen_random_uuid(),
      v_client_id,
      'Fazenda Teste',
      'Rural',
      'Araguaína',
      'TO',
      'Zona Rural de Araguaína/TO',
      '100 hectares',
      '80 hectares',
      'Propriedade criada para teste de fluxo.'
    )
    returning id into v_property_id;
  else
    update public.properties
       set type = 'Rural',
           city = 'Araguaína',
           state = 'TO',
           address = 'Zona Rural de Araguaína/TO',
           total_area = '100 hectares',
           productive_area = '80 hectares',
           environmental_notes = 'Propriedade criada para teste de fluxo.'
     where id = v_property_id;
  end if;

  select id
    into v_process_id
    from public.processes
   where process_number = 'TESTE-PROP-001/2026'
   limit 1;

  if v_process_id is null then
    insert into public.processes (
      id,
      process_number,
      client_id,
      property_id,
      service,
      demand,
      status,
      priority,
      responsible,
      opened_at,
      current_stage,
      notes
    )
    values (
      gen_random_uuid(),
      'TESTE-PROP-001/2026',
      v_client_id,
      v_property_id,
      'Licenciamento Ambiental Teste',
      'Processo criado para testar geração, visualização e download de proposta.',
      'aguardando_proposta',
      'normal',
      'Comercial',
      current_date,
      'Etapa 03 - Proposta comercial',
      'Processo criado para testar geração, visualização e download de proposta.'
    )
    returning id into v_process_id;
  else
    update public.processes
       set client_id = v_client_id,
           property_id = v_property_id,
           service = 'Licenciamento Ambiental Teste',
           demand = 'Processo criado para testar geração, visualização e download de proposta.',
           status = 'aguardando_proposta',
           priority = 'normal',
           responsible = 'Comercial',
           opened_at = coalesce(opened_at, current_date),
           current_stage = 'Etapa 03 - Proposta comercial',
           notes = 'Processo criado para testar geração, visualização e download de proposta.'
     where id = v_process_id;
  end if;

  if exists (select 1 from public.technical_analyses where process_id = v_process_id) then
    update public.technical_analyses
       set status = 'aprovado',
           result = 'pode_gerar_proposta',
           area_situation = 'Área teste cadastrada para validação do fluxo comercial.',
           pending_issues = 'Nenhuma pendência para este teste.',
           additional_needs = 'Nenhuma.',
           technical_opinion = 'Processo teste aprovado para geração de proposta comercial.',
           responsible = 'Técnico escritório',
           analysis_date = current_date
     where process_id = v_process_id;
  else
    insert into public.technical_analyses (
      id,
      process_id,
      status,
      result,
      area_situation,
      pending_issues,
      additional_needs,
      technical_opinion,
      responsible,
      analysis_date
    )
    values (
      gen_random_uuid(),
      v_process_id,
      'aprovado',
      'pode_gerar_proposta',
      'Área teste cadastrada para validação do fluxo comercial.',
      'Nenhuma pendência para este teste.',
      'Nenhuma.',
      'Processo teste aprovado para geração de proposta comercial.',
      'Técnico escritório',
      current_date
    );
  end if;
end $$;

-- Execute este arquivo no Supabase SQL Editor para criar/atualizar o cliente teste.
-- O script é idempotente: usa o documento 00.000.000/0001-99 e o processo
-- TESTE-PROP-001/2026 para evitar duplicidade.
-- Fluxo esperado: Clientes -> Processos -> Propostas -> Contratos -> Financeiro -> Execução.
