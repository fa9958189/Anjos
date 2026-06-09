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
      'Araguaína',
      'TO',
      'Teste interno',
      'Comercial',
      'Teste de fluxo completo para proposta comercial.',
      'Cliente criado para validar o fluxo manual de proposta, contrato, financeiro e execução.',
      'com_processo_ativo'
    )
    returning id into v_client_id;
  else
    update public.clients
       set name = 'CLIENTE TESTE FLUXO PROPOSTA',
           type = 'pessoa_juridica',
           phone = '+55 63 99999-0000',
           email = 'teste@anjosambiental.com.br',
           city = 'Araguaína',
           state = 'TO',
           responsible = 'Comercial',
           demand = 'Teste de fluxo completo para proposta comercial.',
           status = 'com_processo_ativo'
     where id = v_client_id;
  end if;

  select id
    into v_property_id
    from public.properties
   where client_id = v_client_id
     and name = 'Propriedade Teste Fluxo Proposta'
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
      environmental_notes
    )
    values (
      gen_random_uuid(),
      v_client_id,
      'Propriedade Teste Fluxo Proposta',
      'Rural',
      'Araguaína',
      'TO',
      'Área teste para validação de fluxo comercial',
      'Propriedade criada para teste de proposta comercial.'
    )
    returning id into v_property_id;
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
      due_date,
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
      current_date + interval '15 days',
      'Etapa 03 - Proposta comercial',
      'Processo teste aprovado para proposta comercial.'
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
           current_stage = 'Etapa 03 - Proposta comercial',
           notes = 'Processo teste aprovado para proposta comercial.'
     where id = v_process_id;
  end if;

  if exists (select 1 from public.technical_analyses where process_id = v_process_id) then
    update public.technical_analyses
       set status = 'aprovado',
           result = 'pode_gerar_proposta',
           area_situation = 'Processo teste com documentação suficiente para validação comercial.',
           pending_issues = '',
           additional_needs = '',
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
      'Processo teste com documentação suficiente para validação comercial.',
      '',
      '',
      'Processo teste aprovado para geração de proposta comercial.',
      'Técnico escritório',
      current_date
    );
  end if;
end $$;

-- Execute este arquivo no Supabase SQL Editor para criar/atualizar um cliente teste
-- pronto para validar o fluxo: Clientes -> Processos -> Propostas -> Contratos -> Financeiro -> Execução.
