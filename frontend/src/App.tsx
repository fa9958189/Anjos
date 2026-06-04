import {
  AlertCircle,
  ArrowRight,
  BadgeDollarSign,
  Bell,
  Download,
  Eye,
  EyeOff,
  FileText,
  FilePlus,
  FolderOpen,
  FolderKanban,
  Home,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquareText,
  Menu,
  MapPin,
  Pencil,
  Printer,
  Scale,
  Search,
  ShieldCheck,
  ClipboardCheck,
  Trash2,
  UploadCloud,
  UserPlus,
  UsersRound,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from './lib/supabase';

type DashboardStatus = 'loading' | 'empty' | 'error' | 'success';

type DashboardSummary = {
  activeProcesses: number;
  openProposals: number;
  generatedContracts: number;
  pendingTasks: number;
  monthlyRevenue: number;
  contractedValue: number;
  delayedProcesses: number;
};

type DashboardChartItem = {
  label: string;
  value: number;
  color: string;
};

type DashboardActivity = {
  id: string;
  title: string;
  meta: string;
  status: string;
  date: string;
};

type DashboardData = {
  summary: DashboardSummary;
  stageData: DashboardChartItem[];
  statusData: DashboardChartItem[];
  monthlyRevenueData: DashboardChartItem[];
  healthData: DashboardChartItem[];
  recentActivities: DashboardActivity[];
  lastUpdated: string;
};

type DashboardState = {
  status: DashboardStatus;
  data: DashboardData | null;
  error?: string;
};

type ViewKey = 'Dashboard' | 'Usuários' | 'Clientes' | 'Processos' | 'Propostas' | 'Acompanhamento' | 'Execução' | 'Financeiro' | 'Contratos';

type SystemUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Comercial' | 'Técnico' | 'Financeiro' | 'Jurídico';
  status: 'Ativo' | 'Inativo';
  lastAccess: string;
};

type UserFormState = Pick<SystemUser, 'name' | 'email' | 'password' | 'role'>;

type LoginFormState = {
  email: string;
  password: string;
};

type Client = {
  id: string;
  type: 'Pessoa física' | 'Pessoa jurídica';
  name: string;
  document: string;
  rgStateRegistration: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  source: string;
  owner: string;
  demand: string;
  notes: string;
  status: 'Novo' | 'Em atendimento' | 'Com processo ativo' | 'Inativo';
  properties: number;
  processes: number;
  pendingDocuments: number;
};

type ClientFormState = Omit<Client, 'id' | 'status' | 'properties' | 'processes' | 'pendingDocuments'>;

type DbClient = {
  id: string;
  type: 'pessoa_fisica' | 'pessoa_juridica';
  name: string;
  document: string;
  rg_state_registration: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  responsible: string | null;
  demand: string | null;
  notes: string | null;
  status: 'novo' | 'em_atendimento' | 'com_processo_ativo' | 'inativo';
};

type TechnicalAnalysis = {
  status: 'Em análise' | 'Aprovado' | 'Reprovado' | 'Necessita complementação';
  areaSituation: string;
  pendingIssues: string;
  additionalNeeds: string;
  technicalOpinion: string;
  result: 'Pode gerar proposta' | 'Precisa complementar informações' | 'Serviço inviável';
  responsible: string;
  analysisDate: string;
};

type DbTechnicalAnalysis = {
  id: string;
  process_id: string;
  status: 'em_analise' | 'aprovado' | 'reprovado' | 'necessita_complementacao';
  result: 'pode_gerar_proposta' | 'precisa_complementar_informacoes' | 'servico_inviavel';
  area_situation: string | null;
  pending_issues: string | null;
  additional_needs: string | null;
  technical_opinion: string | null;
  responsible: string | null;
  analysis_date: string | null;
};

type DbProcess = {
  id: string;
  process_number: string;
  client_id: string;
  property_id: string | null;
  service: string;
  demand: string | null;
  status: string;
  priority: 'normal' | 'alta' | 'urgente';
  responsible: string | null;
  opened_at: string | null;
  due_date: string | null;
  current_stage: string | null;
  notes: string | null;
  clients?: DbClient | null;
  properties?: DbProperty | null;
  technical_analyses?: DbTechnicalAnalysis | null;
};

type DbProperty = {
  id: string;
  client_id: string;
  name: string;
  type: string;
  city: string | null;
  state: string | null;
  address: string | null;
  total_area: string | null;
  productive_area: string | null;
  registration: string | null;
  registry_office: string | null;
  car: string | null;
  ccir: string | null;
  itr: string | null;
  coordinates: string | null;
  environmental_notes: string | null;
};

type EnvironmentalProcess = {
  dbId?: string;
  clientId?: string;
  propertyId?: string;
  id: string;
  client: string;
  clientPhone: string;
  property: string;
  service: string;
  status: string;
  priority: 'Normal' | 'Alta' | 'Urgente';
  owner: string;
  dueDate: string;
  openedAt: string;
  currentStage: string;
  demand: string;
  analysis: TechnicalAnalysis;
  history: string[];
};

type ProposalStatus = 'Gerar proposta' | 'Proposta gerada' | 'Proposta aprovada' | 'Proposta recusada';

type ProposalServiceItem = {
  description: string;
  value: string;
};

type PaymentMethod = 'Pix' | 'Boleto' | 'Transferência bancária';

type CommercialContact = {
  date: string;
  channel: 'WhatsApp' | 'Ligação' | 'E-mail' | 'Presencial';
  note: string;
  nextAction: string;
  responsible: string;
};

type Proposal = {
  dbId?: string;
  id: string;
  processId: string;
  client: string;
  clientPhone: string;
  property: string;
  service: string;
  services: ProposalServiceItem[];
  value: string;
  deadline: string;
  paymentTerms: string;
  paymentMethods: PaymentMethod[];
  entryPercentage: number;
  entryValue: string;
  remainingValue: string;
  validity: string;
  responsible: string;
  technicalNotes: string;
  observations: string;
  status: ProposalStatus;
  createdAt: string;
  approvedAt?: string;
  contacts: CommercialContact[];
};

type DbProposalService = {
  id: string;
  proposal_id: string;
  description: string;
  value: number | null;
  sort_order: number | null;
};

type DbProposal = {
  id: string;
  proposal_number: string;
  process_id: string;
  client_id: string;
  property_id: string | null;
  status: 'gerar_proposta' | 'proposta_gerada' | 'proposta_aprovada' | 'proposta_recusada';
  client_name: string;
  client_phone: string | null;
  property_name: string | null;
  city_state: string | null;
  responsible: string | null;
  proposal_date: string | null;
  total_value: number | null;
  entry_percentage: number | null;
  entry_value: number | null;
  remaining_value: number | null;
  payment_methods: string[] | null;
  payment_terms: string | null;
  deadline: string | null;
  validity: string | null;
  technical_notes: string | null;
  observations: string | null;
  generated_at: string | null;
  approved_at: string | null;
  refused_at: string | null;
  proposal_services?: DbProposalService[];
  processes?: { process_number: string; service: string } | null;
};

type ProposalFormState = {
  id: string;
  date: string;
  client: string;
  property: string;
  responsible: string;
  phone: string;
  cityState: string;
  services: ProposalServiceItem[];
  technicalNotes: string;
  entryPercentage: number;
  paymentMethods: PaymentMethod[];
  paymentTerms: string;
  deadline: string;
  validity: string;
  observations: string;
};

type ContractStatus = 'Aguardando contrato' | 'Contrato gerado' | 'Vigente' | 'Cancelado';

type ContractRecord = {
  dbId?: string;
  proposalDbId?: string;
  processDbId?: string;
  clientDbId?: string;
  propertyDbId?: string;
  id: string;
  proposalId: string;
  processId: string;
  client: string;
  property: string;
  phone: string;
  city: string;
  service: string;
  value: string;
  paymentTerms: string;
  deadline: string;
  responsible: string;
  status: ContractStatus;
  contractDate: string;
  approvalDate: string;
  expirationDate: string;
  contractorDocument: string;
  contractorAddress: string;
  contractorCity: string;
  contractorState: string;
  contractedCompany: string;
  contractedCnpj: string;
  contractedAddress: string;
  contractedPhone: string;
  objectClause: string;
  contractedObligations: string;
  contractorObligations: string;
  paymentClause: string;
  deadlineClause: string;
  terminationClause: string;
  jurisdictionClause: string;
  observations: string;
  signedFileName: string;
  generatedAt?: string;
  activatedAt?: string;
};

type DbContract = {
  id: string;
  contract_number: string;
  proposal_id: string;
  process_id: string;
  client_id: string;
  property_id: string | null;
  status: 'aguardando_contrato' | 'contrato_gerado' | 'vigente' | 'cancelado';
  client_name: string;
  client_document: string | null;
  client_address: string | null;
  client_city: string | null;
  client_state: string | null;
  client_phone: string | null;
  property_name: string | null;
  service_description: string;
  total_value: number | null;
  entry_percentage: number | null;
  entry_value: number | null;
  remaining_value: number | null;
  payment_terms: string | null;
  execution_deadline: string | null;
  contract_date: string | null;
  expiration_date: string | null;
  company_name: string | null;
  company_cnpj: string | null;
  company_address: string | null;
  company_phone: string | null;
  signed_file_name: string | null;
  generated_at: string | null;
  activated_at: string | null;
  proposals?: { proposal_number: string; approved_at: string | null } | null;
  processes?: { process_number: string } | null;
};

type OfficeAction = {
  id?: string;
  type: string;
  agency: string;
  protocol: string;
  date: string;
  responsible: string;
  description: string;
  status: 'Pendente' | 'Em andamento' | 'Concluído';
};

type FieldVisit = {
  id?: string;
  date: string;
  responsible: string;
  location: string;
  coordinates: string;
  notes: string;
  checklist: string;
  status: 'Agendada' | 'Realizada' | 'Pendente';
};

type ExecutionTaskStatus =
  | 'Não iniciado'
  | 'Em andamento'
  | 'Aguardando aprovação'
  | 'Aprovado'
  | 'Concluído'
  | 'Pendente documentação'
  | 'Rejeitado'
  | 'Cliente já possui'
  | 'Não se aplica';

type ExecutionTask = {
  id: string;
  title: string;
  status: ExecutionTaskStatus;
  responsible: string;
  updatedAt: string;
  protocol: string;
  login: string;
  password: string;
  observation: string;
  attachments: string[];
  suggestedDocuments: string[];
};

type ExecutionHistoryItem = {
  id: string;
  date: string;
  action: string;
  responsible: string;
  observation: string;
};

type FieldChecklistItem = {
  dbId?: string;
  id: string;
  title: string;
  status: 'Não iniciado' | 'Em andamento' | 'Concluído' | 'Pendente';
  observation: string;
  attachments: string[];
};

type ExecutionRecord = {
  dbId?: string;
  processDbId?: string;
  processId: string;
  officeActions: OfficeAction[];
  fieldVisits: FieldVisit[];
  tasks?: ExecutionTask[];
  fieldChecklist?: FieldChecklistItem[];
  history?: ExecutionHistoryItem[];
  internalNotes?: string;
};


type DbDocument = {
  id: string;
  client_id: string | null;
  property_id: string | null;
  process_id: string | null;
  category: string;
  name: string | null;
  file_name: string;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  clients?: { name: string } | null;
  properties?: { name: string } | null;
  processes?: { process_number: string } | null;
};

type DbExecution = {
  id: string;
  process_id: string;
  status: string | null;
  department: string | null;
  responsible: string | null;
  started_at: string | null;
  expected_delivery_date: string | null;
  progress: number | null;
  execution_tasks?: DbExecutionTask[];
  field_visits?: DbFieldVisit[];
  field_checklist_items?: DbFieldChecklistItem[];
  execution_history?: DbExecutionHistoryItem[];
  execution_notes?: DbExecutionNote[];
};

type DbExecutionTask = {
  id: string;
  execution_id: string;
  process_id: string | null;
  task_key: string | null;
  title: string;
  status: string | null;
  responsible: string | null;
  updated_at: string | null;
  protocol: string | null;
  login: string | null;
  password_ref: string | null;
  observation: string | null;
  attachments: string[] | null;
  suggested_documents: string[] | null;
};

type DbFieldVisit = {
  id: string;
  execution_id: string;
  process_id: string | null;
  visit_date: string | null;
  responsible: string | null;
  location: string | null;
  coordinates: string | null;
  notes: string | null;
  checklist: string | null;
  status: string | null;
};

type DbFieldChecklistItem = {
  id: string;
  execution_id: string;
  process_id: string | null;
  item_key: string | null;
  title: string;
  status: string | null;
  observation: string | null;
  attachments: string[] | null;
};

type DbExecutionHistoryItem = {
  id: string;
  execution_id: string;
  process_id: string | null;
  action_date: string | null;
  action: string;
  responsible: string | null;
  observation: string | null;
};

type DbExecutionNote = {
  id: string;
  execution_id: string;
  process_id: string | null;
  notes: string | null;
};

type FinancialRecord = {
  id: string;
  contractDbId?: string;
  proposalDbId?: string;
  processDbId?: string;
  clientDbId?: string;
  contractId: string;
  proposalId: string;
  processId: string;
  client: string;
  service: string;
  amount: number;
  entryPercentage: number;
  entryAmount: number;
  remainingAmount: number;
  dueDate: string;
  paymentStatus: 'Aberto' | 'Pago' | 'Vencido' | 'Parcial';
  financialStatus: 'Aguardando entrada' | 'Entrada confirmada' | 'Liberado para execução' | 'Pendente/erro';
  receivedAmount: number;
  paymentMethod: string;
  paidAt: string;
  releasedAt: string;
  invoiceNumber: string;
  invoiceStatus: 'Não emitida' | 'Emitida' | 'Cancelada';
  notes: string;
};

type DbFinancialRecord = {
  id: string;
  contract_id: string | null;
  proposal_id: string | null;
  process_id: string | null;
  client_id: string | null;
  status: 'aguardando_entrada' | 'entrada_confirmada' | 'liberado_execucao' | 'pendente_erro';
  client_name: string;
  service_description: string;
  total_value: number | null;
  entry_percentage: number | null;
  entry_value: number | null;
  remaining_value: number | null;
  expected_payment_date: string | null;
  received_amount: number | null;
  payment_date: string | null;
  payment_method: string | null;
  payment_notes: string | null;
  released_for_execution: boolean | null;
  released_at: string | null;
  invoice_number: string | null;
  invoice_status: 'nao_emitida' | 'emitida' | 'cancelada' | null;
  contracts?: { contract_number: string; contract_date: string | null } | null;
  proposals?: { proposal_number: string } | null;
  processes?: { process_number: string } | null;
};

type ServiceTracking = {
  processId: string;
  client: string;
  service: string;
  responsible: string;
  status: 'Não iniciado' | 'Em andamento' | 'Pendente' | 'Concluído';
  progress: number;
  pendingIssue: string;
  nextAction: string;
  expectedDelivery: string;
  deliveredAt: string;
  deliveryMethod: 'WhatsApp' | 'E-mail' | 'Presencial' | 'Sistema' | '';
  deliveryNotes: string;
  postServiceDate: string;
  renewalDeadline: string;
  postServiceNotes: string;
};

type PropertyRecord = {
  id: string;
  client: string;
  name: string;
  type: 'Rural' | 'Urbano' | 'Empreendimento' | 'Empresa';
  city: string;
  state: string;
  address: string;
  totalArea: string;
  productiveArea: string;
  registration: string;
  registryOffice: string;
  car: string;
  ccir: string;
  itr: string;
  coordinates: string;
  environmentalNotes: string;
  processIds: string[];
};

type DocumentUploadItem = string | File;

type DocumentRecord = {
  dbId?: string;
  bucket?: string;
  storagePath?: string;
  mimeType?: string;
  fileSize?: number;
  id: string;
  name: string;
  category: string;
  client: string;
  propertyId: string;
  propertyName: string;
  processId: string;
  uploadedAt: string;
  uploadedBy: string;
  fileName: string;
};

const initialClients: Client[] = [
  {
    id: 'CLI-001',
    type: 'Pessoa física',
    name: 'João Pereira da Silva',
    document: '123.456.789-00',
    rgStateRegistration: 'MG-12.345.678',
    phone: '(38) 99999-1000',
    email: 'joao@email.com',
    address: 'Comunidade Boa Vista, zona rural',
    city: 'Montes Claros',
    state: 'MG',
    source: 'Indicação',
    owner: 'Comercial',
    demand: 'Licenciamento ambiental rural com análise documental da propriedade.',
    notes: 'Cliente já enviou CAR e escritura para conferência inicial.',
    status: 'Com processo ativo',
    properties: 1,
    processes: 2,
    pendingDocuments: 2
  },
  {
    id: 'CLI-002',
    type: 'Pessoa jurídica',
    name: 'Agro Veredas LTDA',
    document: '12.345.678/0001-90',
    rgStateRegistration: '003.245.998.00-11',
    phone: '(38) 98888-2200',
    email: 'ambiental@agroveredas.com.br',
    address: 'Rodovia BR-251, km 42',
    city: 'Grão Mogol',
    state: 'MG',
    source: 'Site',
    owner: 'Técnico escritório',
    demand: 'Regularização documental, visita técnica e relatório fotográfico.',
    notes: 'Aguardar retorno sobre matrícula atualizada.',
    status: 'Em atendimento',
    properties: 2,
    processes: 1,
    pendingDocuments: 4
  },
  {
    id: 'CLI-003',
    type: 'Pessoa física',
    name: 'Mariana Costa Almeida',
    document: '987.654.321-00',
    rgStateRegistration: 'MG-98.765.432',
    phone: '(38) 97777-3300',
    email: 'mariana.costa@email.com',
    address: 'Fazenda Lagoa Serena, zona rural',
    city: 'Janaúba',
    state: 'MG',
    source: 'WhatsApp',
    owner: 'Comercial',
    demand: 'Outorga de uso de água e organização documental da propriedade.',
    notes: 'Cliente pediu retorno rápido por causa de prazo com órgão ambiental.',
    status: 'Com processo ativo',
    properties: 1,
    processes: 1,
    pendingDocuments: 1
  },
  {
    id: 'CLI-004',
    type: 'Pessoa jurídica',
    name: 'Mineral Norte Serviços LTDA',
    document: '22.456.789/0001-44',
    rgStateRegistration: '004.889.112.00-15',
    phone: '(38) 96666-4400',
    email: 'ambiental@mineralnorte.com.br',
    address: 'Distrito Industrial, lote 18',
    city: 'Bocaiúva',
    state: 'MG',
    source: 'Indicação',
    owner: 'Comercial',
    demand: 'Renovação de licença ambiental e acompanhamento técnico do processo.',
    notes: 'Empresa já possui licença anterior e precisa renovar antes do vencimento.',
    status: 'Com processo ativo',
    properties: 1,
    processes: 1,
    pendingDocuments: 3
  }
];

const emptyClientForm: ClientFormState = {
  type: 'Pessoa física',
  name: '',
  document: '',
  rgStateRegistration: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: 'MG',
  source: '',
  owner: '',
  demand: '',
  notes: ''
};

const initialProcesses: EnvironmentalProcess[] = [
  {
    id: 'AMB-001/2026',
    client: 'João Pereira da Silva',
    clientPhone: '38999991000',
    property: 'Fazenda Boa Vista',
    service: 'Licenciamento Ambiental Rural',
    status: 'Em análise técnica',
    priority: 'Alta',
    owner: 'Técnico escritório',
    dueDate: '28/05/2026',
    openedAt: '21/05/2026',
    currentStage: 'Etapa 02 - Análise técnica',
    demand: 'Avaliar viabilidade do licenciamento ambiental rural e identificar pendências documentais da propriedade.',
    analysis: {
      status: 'Em análise',
      areaSituation: 'Área rural com documentação inicial enviada pelo cliente. A matrícula precisa ser conferida com o CAR apresentado.',
      pendingIssues: 'Conferir certidão de inteiro teor atualizada e validar dados do CAR.',
      additionalNeeds: 'Solicitar mapa ou croqui da área caso o técnico de campo confirme divergência nas informações.',
      technicalOpinion: '',
      result: 'Precisa complementar informações',
      responsible: 'Técnico escritório',
      analysisDate: '21/05/2026'
    },
    history: ['Cliente cadastrado', 'Documentos iniciais recebidos', 'Processo enviado para análise técnica']
  },
  {
    id: 'AMB-002/2026',
    client: 'Agro Veredas LTDA',
    clientPhone: '38988882200',
    property: 'Unidade Agro Veredas',
    service: 'CAR e regularização documental',
    status: 'Aguardando proposta',
    priority: 'Normal',
    owner: 'Técnico escritório',
    dueDate: '31/05/2026',
    openedAt: '20/05/2026',
    currentStage: 'Etapa 02 - Análise técnica',
    demand: 'Regularização documental com conferência de dados rurais e preparação para protocolo.',
    analysis: {
      status: 'Aprovado',
      areaSituation: 'Dados cadastrais recebidos, mas a inscrição estadual e a matrícula atualizada ainda não foram anexadas.',
      pendingIssues: 'Matrícula atualizada, CCIR e comprovante de ITR.',
      additionalNeeds: 'Contato com o cliente para complementar documentos antes da proposta final.',
      technicalOpinion: 'O serviço é tecnicamente possível, mas depende da complementação documental para precificação correta.',
      result: 'Pode gerar proposta',
      responsible: 'Técnico escritório',
      analysisDate: '20/05/2026'
    },
    history: ['Demanda aberta pelo comercial', 'Análise técnica iniciada', 'Complementação solicitada']
  },
  {
    id: 'AMB-003/2026',
    client: 'Mariana Costa Almeida',
    clientPhone: '38977773300',
    property: 'Fazenda Lagoa Serena',
    service: 'Outorga de uso de água',
    status: 'Aguardando proposta',
    priority: 'Urgente',
    owner: 'Técnico escritório',
    dueDate: '04/06/2026',
    openedAt: '21/05/2026',
    currentStage: 'Etapa 03 - Proposta comercial',
    demand: 'Preparar proposta para outorga de uso de água com análise documental e apoio no protocolo.',
    analysis: {
      status: 'Aprovado',
      areaSituation: 'Área possui documentação principal e necessidade clara de regularização do uso hídrico.',
      pendingIssues: 'Ajustar coordenadas do ponto de captação.',
      additionalNeeds: 'Pode exigir visita técnica de campo para conferência de coordenadas.',
      technicalOpinion: 'Serviço tecnicamente viável, com escopo comercial definido.',
      result: 'Pode gerar proposta',
      responsible: 'Técnico escritório',
      analysisDate: '21/05/2026'
    },
    history: ['Cliente cadastrado', 'Análise técnica aprovada', 'Processo encaminhado ao comercial']
  },
  {
    id: 'AMB-004/2026',
    client: 'Mineral Norte Serviços LTDA',
    clientPhone: '38966664400',
    property: 'Unidade Industrial Bocaiúva',
    service: 'Renovação de licença ambiental',
    status: 'Aguardando proposta',
    priority: 'Alta',
    owner: 'Técnico escritório',
    dueDate: '07/06/2026',
    openedAt: '21/05/2026',
    currentStage: 'Etapa 03 - Proposta comercial',
    demand: 'Elaborar proposta para renovação de licença ambiental com acompanhamento técnico e documental.',
    analysis: {
      status: 'Aprovado',
      areaSituation: 'Empresa possui licença anterior e precisa atualizar documentos para renovação.',
      pendingIssues: 'Solicitar última licença emitida e comprovantes de condicionantes.',
      additionalNeeds: 'Verificar se houve alteração de atividade ou ampliação da operação.',
      technicalOpinion: 'Serviço viável. Proposta deve contemplar análise documental, protocolo e acompanhamento.',
      result: 'Pode gerar proposta',
      responsible: 'Técnico escritório',
      analysisDate: '21/05/2026'
    },
    history: ['Demanda cadastrada', 'Análise técnica aprovada', 'Encaminhado para proposta']
  }
];

const initialProposals: Proposal[] = [
  {
    id: 'PROP001/2026',
    processId: 'AMB-002/2026',
    client: 'Agro Veredas LTDA',
    clientPhone: '38988882200',
    property: 'Unidade Agro Veredas',
    service: 'CAR e regularização documental',
    services: [{ description: 'CAR e regularização documental', value: '3.800,00' }],
    value: '3.800,00',
    deadline: '20 dias',
    paymentTerms: '50% na assinatura e 50% na entrega.',
    paymentMethods: ['Pix', 'Transferência bancária'],
    entryPercentage: 50,
    entryValue: '1.900,00',
    remainingValue: '1.900,00',
    validity: '15 dias',
    responsible: 'Comercial',
    technicalNotes: 'Conferência documental e preparação para protocolo.',
    observations: 'Proposta contempla conferência documental e preparação para protocolo.',
    status: 'Proposta gerada',
    createdAt: '21/05/2026',
    contacts: [
      {
        date: '21/05/2026',
        channel: 'WhatsApp',
        note: 'Proposta enviada ao responsável financeiro para avaliação.',
        nextAction: 'Retornar em dois dias úteis.',
        responsible: 'Comercial'
      }
    ]
  },
  {
    id: 'PROP002/2026',
    processId: 'AMB-003/2026',
    client: 'Mariana Costa Almeida',
    clientPhone: '38977773300',
    property: 'Fazenda Lagoa Serena',
    service: 'Outorga de uso de água',
    services: [{ description: 'Outorga de uso de água', value: '4.500,00' }],
    value: '4.500,00',
    deadline: '30 dias',
    paymentTerms: 'Entrada de 40% e saldo na entrega do protocolo.',
    paymentMethods: ['Pix', 'Boleto'],
    entryPercentage: 40,
    entryValue: '1.800,00',
    remainingValue: '2.700,00',
    validity: '10 dias',
    responsible: 'Comercial',
    technicalNotes: 'Atendimento prioritário para protocolo de outorga.',
    observations: 'Cliente solicitou prioridade no atendimento.',
    status: 'Proposta aprovada',
    createdAt: '21/05/2026',
    approvedAt: '21/05/2026',
    contacts: [
      {
        date: '21/05/2026',
        channel: 'Ligação',
        note: 'Cliente aprovou proposta e pediu envio do contrato.',
        nextAction: 'Encaminhar para jurídico.',
        responsible: 'Comercial'
      }
    ]
  }
];

const initialContracts: ContractRecord[] = [
  {
    id: 'CONT001/2026',
    proposalId: 'PROP002/2026',
    processId: 'AMB-003/2026',
    client: 'Mariana Costa Almeida',
    property: 'Fazenda Lagoa Serena',
    phone: '38977773300',
    city: 'Janaúba/MG',
    service: 'Outorga de uso de água',
    value: '4.500,00',
    paymentTerms: 'Entrada de 40% e saldo na entrega do protocolo.',
    deadline: '30 dias',
    responsible: 'Jurídico',
    status: 'Vigente',
    contractDate: '22/05/2026',
    approvalDate: '21/05/2026',
    expirationDate: '22/06/2026',
    contractorDocument: '987.654.321-00',
    contractorAddress: 'Fazenda Lagoa Serena, zona rural',
    contractorCity: 'Janaúba',
    contractorState: 'MG',
    contractedCompany: 'ANJOS AMBIENTAL CONSULTORIA LTDA',
    contractedCnpj: '52.723.882/0001-17',
    contractedAddress: 'Rua Dr. Francisco Ludovico de Almeida, nº 87, Quadra 17, Lote 7, Vila Santa Maria - Conjunto Caiçara, Goiânia/GO, CEP 74.775-011',
    contractedPhone: '(62) 00000-0000',
    objectClause: 'O presente contrato tem por objeto a prestação de serviços técnicos especializados de outorga de uso de água, incluindo organização documental, acompanhamento técnico e protocolo junto ao órgão competente, a serem executados pela CONTRATADA em área indicada pela CONTRATANTE.',
    contractedObligations: 'São obrigações da CONTRATADA executar os serviços contratados com observância das normas técnicas aplicáveis, disponibilizar equipe técnica, ferramentas e materiais necessários à execução dos serviços, entregar os serviços dentro dos padrões técnicos exigidos e informar à CONTRATANTE qualquer fato que possa comprometer o andamento dos trabalhos.',
    contractorObligations: 'São obrigações da CONTRATANTE disponibilizar acesso à área objeto dos serviços, fornecer informações e documentos necessários à execução dos trabalhos, prestar esclarecimentos quando solicitado e efetuar os pagamentos nos prazos estabelecidos neste contrato.',
    paymentClause: 'Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor total de R$ 4.500,00, sendo 50% na assinatura deste contrato e 50% na conclusão dos serviços.',
    deadlineClause: 'O prazo para execução dos serviços será de 30 dias, ou conforme disponibilidade de acesso à área, entrega integral dos documentos necessários e condições técnicas adequadas à realização dos trabalhos.',
    terminationClause: 'O presente contrato poderá ser rescindido por qualquer das partes em caso de descumprimento de quaisquer cláusulas aqui estabelecidas, mediante comunicação formal.',
    jurisdictionClause: 'Fica eleito o foro da comarca de Goiânia/GO para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
    observations: 'Contrato gerado a partir da proposta fechada e liberado para execução técnica.',
    signedFileName: 'contrato-mariana-costa-outorga.pdf',
    generatedAt: '22/05/2026',
    activatedAt: '22/05/2026'
  }
];

const executionTaskStatuses: ExecutionTaskStatus[] = [
  'Não iniciado',
  'Em andamento',
  'Aguardando aprovação',
  'Aprovado',
  'Concluído',
  'Pendente documentação',
  'Rejeitado',
  'Cliente já possui',
  'Não se aplica'
];

const executionTaskTemplates: Array<Pick<ExecutionTask, 'id' | 'title' | 'suggestedDocuments'>> = [
  { id: 'naturatins', title: 'Cadastro Naturatins', suggestedDocuments: ['CPF', 'RG', 'CAR', 'CCIR', 'ITR', 'Comprovante de endereço'] },
  { id: 'ctf-app', title: 'Cadastro CTF/APP', suggestedDocuments: ['CPF', 'CNPJ', 'Dados do imóvel', 'Atividade', 'Comprovante de endereço'] },
  { id: 'ibama', title: 'Certificado IBAMA', suggestedDocuments: ['CPF', 'CNPJ', 'Comprovante de endereço', 'Contrato social'] },
  { id: 'requerimento-licenca', title: 'Requerimento de licença', suggestedDocuments: ['CAR', 'Certidão de inteiro teor', 'Mapa', 'Croqui', 'ART'] },
  { id: 'cft-pessoa-fisica', title: 'Cadastro pessoa física no CFT', suggestedDocuments: ['CPF', 'RG', 'Comprovante de endereço'] },
  { id: 'ana', title: 'Cadastro ANA', suggestedDocuments: ['CPF', 'CAR', 'Coordenadas', 'Mapa', 'Croqui'] },
  { id: 'licenca-pastagem', title: 'Licença Pastagem', suggestedDocuments: ['CAR', 'CCIR', 'ITR', 'Certidão de inteiro teor', 'ART', 'Mapa'] },
  { id: 'licenca-outorga', title: 'Licença Outorga', suggestedDocuments: ['CAR', 'Mapa', 'Croqui', 'CCIR', 'ITR', 'Documentos do proprietário'] },
  { id: 'outros-cadastros', title: 'Outros cadastros/consultas', suggestedDocuments: ['Outros documentos', 'Relatórios', 'Protocolos'] }
];

const defaultFieldChecklist: FieldChecklistItem[] = [
  { id: 'visit', title: 'Visita realizada', status: 'Não iniciado', observation: '', attachments: [] },
  { id: 'photos', title: 'Fotos anexadas', status: 'Não iniciado', observation: '', attachments: [] },
  { id: 'coordinates', title: 'Coordenadas coletadas', status: 'Não iniciado', observation: '', attachments: [] },
  { id: 'sketch', title: 'Croqui feito', status: 'Não iniciado', observation: '', attachments: [] },
  { id: 'signature', title: 'Assinatura do cliente coletada', status: 'Não iniciado', observation: '', attachments: [] },
  { id: 'report', title: 'Relatório de campo preenchido', status: 'Não iniciado', observation: '', attachments: [] }
];

const initialExecutionRecords: ExecutionRecord[] = [
  {
    processId: 'AMB-003/2026',
    officeActions: [
      {
        type: 'Cadastro em órgão ambiental',
        agency: 'IGAM',
        protocol: 'Em preparação',
        date: '21/05/2026',
        responsible: 'Técnico escritório',
        description: 'Conferência documental para cadastro e preparação do protocolo de outorga.',
        status: 'Em andamento'
      }
    ],
    fieldVisits: [
      {
        date: '24/05/2026',
        responsible: 'Técnico campo',
        location: 'Fazenda Lagoa Serena',
        coordinates: '-15.8021, -43.3089',
        notes: 'Visita agendada para conferência do ponto de captação e registro fotográfico.',
        checklist: 'Fotos, coordenadas, acesso ao ponto de captação, croqui da área',
        status: 'Agendada'
      }
    ],
    tasks: [
      {
        ...executionTaskTemplates[0],
        status: 'Aguardando aprovação',
        responsible: 'Técnico escritório',
        updatedAt: '22/05/2026',
        protocol: 'NAT-2026-001',
        login: 'Mariana.987',
        password: '********',
        observation: 'Cadastro enviado e aguardando validação do órgão.',
        attachments: ['protocolo-naturatins-mariana.pdf']
      },
      {
        ...executionTaskTemplates[1],
        status: 'Em andamento',
        responsible: 'Técnico escritório',
        updatedAt: '22/05/2026',
        protocol: 'CTF em preenchimento',
        login: 'Mariana.987',
        password: '********',
        observation: 'Conferir dados do imóvel e atividade declarada.',
        attachments: []
      },
      ...executionTaskTemplates.slice(2).map((template) => ({
        ...template,
        status: 'Não iniciado' as ExecutionTaskStatus,
        responsible: 'Técnico escritório',
        updatedAt: '21/05/2026',
        protocol: '',
        login: '',
        password: '',
        observation: '',
        attachments: []
      }))
    ],
    fieldChecklist: defaultFieldChecklist.map((item) => item.id === 'visit' ? { ...item, status: 'Em andamento', observation: 'Visita agendada para conferência do ponto de captação.' } : item),
    history: [
      {
        id: 'HIST-AMB-003-001',
        date: '22/05/2026',
        action: 'Cadastro Naturatins enviado',
        responsible: 'Técnico escritório',
        observation: 'Aguardando retorno do órgão ambiental.'
      },
      {
        id: 'HIST-AMB-003-002',
        date: '21/05/2026',
        action: 'Processo liberado para execução',
        responsible: 'Financeiro',
        observation: 'Entrada confirmada via Pix.'
      }
    ],
    internalNotes: 'Cliente possui documentação inicial, mas o CAR precisa ser conferido antes da licença.'
  }
];

const initialFinancialRecords: FinancialRecord[] = [
  {
    id: 'REC-001/2026',
    contractId: 'CONT001/2026',
    proposalId: 'PROP002/2026',
    processId: 'AMB-003/2026',
    client: 'Mariana Costa Almeida',
    service: 'Outorga de uso de água',
    amount: 4500,
    entryPercentage: 50,
    entryAmount: 2250,
    remainingAmount: 2250,
    dueDate: '28/05/2026',
    paymentStatus: 'Parcial',
    financialStatus: 'Entrada confirmada',
    receivedAmount: 2250,
    paymentMethod: 'Pix',
    paidAt: '21/05/2026',
    releasedAt: '21/05/2026',
    invoiceNumber: '',
    invoiceStatus: 'Não emitida',
    notes: 'Entrada recebida. Saldo previsto na entrega do protocolo.'
  }
];

const initialServiceTrackings: ServiceTracking[] = [
  {
    processId: 'AMB-003/2026',
    client: 'Mariana Costa Almeida',
    service: 'Outorga de uso de água',
    responsible: 'Técnico escritório',
    status: 'Em andamento',
    progress: 45,
    pendingIssue: 'Aguardando visita de campo para confirmar coordenadas do ponto de captação.',
    nextAction: 'Realizar visita técnica e anexar fotos do ponto de captação.',
    expectedDelivery: '20/06/2026',
    deliveredAt: '',
    deliveryMethod: '',
    deliveryNotes: '',
    postServiceDate: '20/12/2026',
    renewalDeadline: '20/05/2027',
    postServiceNotes: 'Monitorar validade da outorga e retorno semestral com a cliente.'
  }
];

const initialProperties: PropertyRecord[] = [
  {
    id: 'PROP-RURAL-001',
    client: 'João Pereira da Silva',
    name: 'Fazenda Boa Vista',
    type: 'Rural',
    city: 'Montes Claros',
    state: 'MG',
    address: 'Comunidade Boa Vista, zona rural',
    totalArea: '82 ha',
    productiveArea: '54 ha',
    registration: 'Matrícula 12.458',
    registryOffice: 'Cartório de Registro de Imóveis de Montes Claros',
    car: 'MG-3143302-9F12.44B3.88C1',
    ccir: '950.123.456.789-0',
    itr: '3.145.998-2',
    coordinates: '-16.7282, -43.8578',
    environmentalNotes: 'Área com reserva legal declarada no CAR e necessidade de conferência documental.',
    processIds: ['AMB-001/2026']
  },
  {
    id: 'PROP-RURAL-002',
    client: 'Mariana Costa Almeida',
    name: 'Fazenda Lagoa Serena',
    type: 'Rural',
    city: 'Janaúba',
    state: 'MG',
    address: 'Estrada rural da Lagoa Serena, km 12',
    totalArea: '120 ha',
    productiveArea: '76 ha',
    registration: 'Matrícula 8.771',
    registryOffice: 'Cartório de Registro de Imóveis de Janaúba',
    car: 'MG-3135100-AA21.77D9.45E0',
    ccir: '742.889.120.340-8',
    itr: '7.221.008-4',
    coordinates: '-15.8021, -43.3089',
    environmentalNotes: 'Ponto de captação pendente de conferência em campo para outorga.',
    processIds: ['AMB-003/2026']
  },
  {
    id: 'PROP-EMP-003',
    client: 'Mineral Norte Serviços LTDA',
    name: 'Unidade Industrial Bocaiúva',
    type: 'Empresa',
    city: 'Bocaiúva',
    state: 'MG',
    address: 'Distrito Industrial, lote 18',
    totalArea: '18.000 m²',
    productiveArea: '9.500 m²',
    registration: 'Matrícula 22.904',
    registryOffice: 'Cartório de Registro de Imóveis de Bocaiúva',
    car: 'Não se aplica',
    ccir: 'Não se aplica',
    itr: 'Não se aplica',
    coordinates: '-17.1072, -43.8151',
    environmentalNotes: 'Empreendimento com licença anterior e necessidade de comprovar condicionantes.',
    processIds: ['AMB-004/2026']
  }
];

const initialDocuments: DocumentRecord[] = [
  {
    id: 'DOC-001',
    name: 'RG do cliente',
    category: 'RG',
    client: 'João Pereira da Silva',
    propertyId: 'PROP-RURAL-001',
    propertyName: 'Fazenda Boa Vista',
    processId: 'AMB-001/2026',
    uploadedAt: '21/05/2026',
    uploadedBy: 'Comercial',
    fileName: 'joao-pereira-rg.pdf'
  },
  {
    id: 'DOC-002',
    name: 'CAR Fazenda Boa Vista',
    category: 'CAR',
    client: 'João Pereira da Silva',
    propertyId: 'PROP-RURAL-001',
    propertyName: 'Fazenda Boa Vista',
    processId: 'AMB-001/2026',
    uploadedAt: '21/05/2026',
    uploadedBy: 'Técnico escritório',
    fileName: 'car-fazenda-boa-vista.pdf'
  },
  {
    id: 'DOC-003',
    name: 'Certidão de inteiro teor',
    category: 'Certidão de inteiro teor',
    client: 'Mariana Costa Almeida',
    propertyId: 'PROP-RURAL-002',
    propertyName: 'Fazenda Lagoa Serena',
    processId: 'AMB-003/2026',
    uploadedAt: '21/05/2026',
    uploadedBy: 'Comercial',
    fileName: 'certidao-lagoa-serena.pdf'
  },
  {
    id: 'DOC-004',
    name: 'Licença ambiental anterior',
    category: 'Licença',
    client: 'Mineral Norte Serviços LTDA',
    propertyId: 'PROP-EMP-003',
    propertyName: 'Unidade Industrial Bocaiúva',
    processId: 'AMB-004/2026',
    uploadedAt: '21/05/2026',
    uploadedBy: 'Jurídico',
    fileName: 'licenca-anterior-mineral-norte.pdf'
  },
  {
    id: 'DOC-005',
    name: 'Protocolo Naturatins',
    category: 'Protocolos',
    client: 'Mariana Costa Almeida',
    propertyId: 'PROP-RURAL-002',
    propertyName: 'Fazenda Lagoa Serena',
    processId: 'AMB-003/2026',
    uploadedAt: '22/05/2026',
    uploadedBy: 'Técnico escritório',
    fileName: 'protocolo-naturatins-mariana.pdf'
  }
];

const emptyProposalForm: ProposalFormState = {
  id: '',
  date: '',
  client: '',
  property: '',
  responsible: '',
  phone: '',
  cityState: '',
  services: [{ description: '', value: '' }],
  technicalNotes: '',
  entryPercentage: 50,
  paymentMethods: ['Pix'],
  paymentTerms: 'Sinal de 50% e o valor restante após a conclusão.',
  deadline: '',
  validity: '15 dias',
  observations: ''
};

const initialUsers: SystemUser[] = [
  { id: 'USR-001', name: 'Administrador Anjos', email: 'admin@anjosambiental.com.br', password: '••••••••', role: 'Admin', status: 'Ativo', lastAccess: '22/05/2026' },
  { id: 'USR-002', name: 'Equipe Comercial', email: 'comercial@anjosambiental.com.br', password: '••••••••', role: 'Comercial', status: 'Ativo', lastAccess: '21/05/2026' },
  { id: 'USR-003', name: 'Técnico Escritório', email: 'tecnico@anjosambiental.com.br', password: '••••••••', role: 'Técnico', status: 'Ativo', lastAccess: 'Primeiro acesso pendente' }
];

const emptyUserForm: UserFormState = {
  name: '',
  email: '',
  password: '',
  role: 'Comercial'
};

const navItems: Array<{ label: ViewKey; icon: typeof Home }> = [
  { label: 'Dashboard', icon: Home },
  { label: 'Usuários', icon: UsersRound },
  { label: 'Clientes', icon: UsersRound },
  { label: 'Processos', icon: FolderKanban },
  { label: 'Propostas', icon: FileText },
  { label: 'Contratos', icon: Scale },
  { label: 'Financeiro', icon: BadgeDollarSign },
  { label: 'Execução', icon: ClipboardCheck },
  { label: 'Acompanhamento', icon: MessageSquareText }
];

const documentChecklist = ['RG', 'CPF', 'Comprovante de endereço', 'Certidão de inteiro teor', 'Escritura', 'Contrato de compra e venda', 'CCIR', 'ITR', 'CAR', 'Outros documentos'];

const executionDocumentSections = [
  { title: 'Documentos do cliente', categories: ['RG', 'CPF', 'Comprovante de endereço', 'Procuração', 'Contrato social', 'Outros documentos'] },
  { title: 'Documentos da propriedade', categories: ['Escritura', 'Contrato de compra e venda', 'Certidão de inteiro teor', 'CCIR', 'ITR', 'CAR', 'GEO', 'Mapa', 'Croqui', 'Outros da propriedade'] },
  { title: 'Documentos comerciais', categories: ['Proposta comercial', 'Contrato', 'Comprovante financeiro', 'Nota fiscal'] },
  { title: 'Documentos técnicos', categories: ['Licenças', 'Laudos', 'Relatórios', 'ART', 'Estudos ambientais', 'Protocolos', 'Certificados'] }
];

type DocumentAttachmentMap = Record<string, string[]>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const parseCurrency = (value: string) => {
  const parsedValue = Number(value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const formatCurrencyInput = (value: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatDateBR = (value?: string | null) => {
  if (!value) return '';
  if (value.includes('/')) return value;
  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const formatDateToDb = (value: string) => {
  if (!value) return null;
  if (value.includes('-')) return value.split('T')[0];
  const [day, month, year] = value.split('/');
  return day && month && year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : null;
};

const normalizeText = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const createCustomExecutionTaskId = (title: string) => {
  const slug = normalizeText(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `custom-${slug || Date.now()}`;
};

const createDefaultExecutionTasks = (): ExecutionTask[] =>
  executionTaskTemplates.map((template, index) => ({
    ...template,
    status: index === 0 ? 'Em andamento' : 'Não iniciado',
    responsible: 'Técnico escritório',
    updatedAt: new Date().toLocaleDateString('pt-BR'),
    protocol: index === 0 ? 'Em preparação' : '',
    login: '',
    password: '',
    observation: index === 0 ? 'Cadastro em preparação com base nos documentos já recebidos.' : '',
    attachments: []
  }));

const createDefaultExecutionRecord = (processId: string): ExecutionRecord => ({
  processId,
  officeActions: [],
  fieldVisits: [],
  tasks: createDefaultExecutionTasks(),
  fieldChecklist: defaultFieldChecklist.map((item) => ({ ...item, attachments: [...item.attachments] })),
  history: [
    {
      id: `HIST-${processId}-001`,
      date: new Date().toLocaleDateString('pt-BR'),
      action: 'Processo liberado para execução',
      responsible: 'Sistema',
      observation: 'Contrato com entrada confirmada pelo financeiro.'
    }
  ],
  internalNotes: 'Conferir documentos obrigatórios antes de iniciar cadastros externos.'
});

const getExecutionStatusClass = (status: ExecutionTaskStatus | FieldChecklistItem['status']) =>
  normalizeText(status).replace(/\s+/g, '-').replace('/', '-');

const calculateProposalTotal = (services: ProposalServiceItem[]) =>
  services.reduce((total, service) => total + parseCurrency(service.value), 0);

const buildProposalId = (count: number) => 'PROP' + String(count + 1).padStart(3, '0') + '/' + new Date().getFullYear();

const createProposalForm = (process: EnvironmentalProcess | null, proposalsCount: number): ProposalFormState => ({
  ...emptyProposalForm,
  id: buildProposalId(proposalsCount),
  date: new Date().toLocaleDateString('pt-BR'),
  client: process?.client ?? '',
  property: process?.property ?? '',
  phone: process?.clientPhone ?? '',
  cityState: 'Montes Claros/MG',
  services: [{ description: process?.service ?? '', value: '' }],
  technicalNotes: process?.analysis.technicalOpinion ?? '',
  responsible: 'Comercial'
});

const getAnalysisDisplay = (status: TechnicalAnalysis['status']) => (status === 'Em análise' ? 'Analisar' : status);

const getAnalysisStatusClass = (status: TechnicalAnalysis['status']) =>
  'analysis-status-' + normalizeText(status).replace(/\s/g, '-');

const getProposalStatusClass = (status: ProposalStatus) =>
  'proposal-status-' + normalizeText(status).replace(/\s/g, '-');

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function buildProposalHtml(proposal: Proposal) {
  const serviceRows = proposal.services.map((service) => `
    <tr>
      <td>${escapeHtml(service.description)}</td>
      <td>${formatCurrency(parseCurrency(service.value))}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(proposal.id)} - ${escapeHtml(proposal.client)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #17291c; font-family: Arial, Helvetica, sans-serif; background: #eef5ea; }
    .proposal-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm; background: #fff; }
    .proposal-header { display: grid; grid-template-columns: 1fr 1.15fr; gap: 18px; align-items: start; padding-bottom: 18px; border-bottom: 3px solid #1e4d2b; }
    .brand { display: flex; gap: 12px; align-items: center; }
    .brand-logo { width: 136px; height: auto; display: block; object-fit: contain; }
    h1, h2, h3, p { margin: 0; }
    h1 { margin-top: 22px; color: #1e4d2b; font-size: 28px; text-align: center; letter-spacing: 0; }
    h2 { color: #14261a; font-size: 17px; }
    h3 { color: #1e4d2b; font-size: 13px; text-transform: uppercase; margin: 24px 0 10px; }
    .company strong { display: block; color: #14261a; font-size: 20px; }
    .company span, .contact span, .meta span { display: block; margin-top: 4px; color: #566557; font-size: 11px; line-height: 1.35; }
    .contact { text-align: right; }
    .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 20px; }
    .meta div, .client-box, .payment-box, .signature { border: 1px solid #dce8d6; border-radius: 10px; padding: 12px; background: #fbfdf8; }
    .meta small, .client-grid small { display: block; color: #6b8b69; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .meta strong, .client-grid strong { display: block; margin-top: 5px; color: #14261a; font-size: 12px; }
    .client-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 10px; }
    th { background: #1e4d2b; color: #fff; font-size: 12px; text-align: left; padding: 11px; }
    td { border: 1px solid #dce8d6; padding: 11px; color: #314436; font-size: 12px; vertical-align: top; line-height: 1.45; }
    td:last-child, th:last-child { width: 34%; text-align: right; }
    .total { display: flex; justify-content: flex-end; margin-top: 12px; }
    .total div { min-width: 260px; padding: 14px; border-radius: 10px; background: #1e4d2b; color: #fff; text-align: right; }
    .total span { display: block; font-size: 11px; text-transform: uppercase; opacity: .85; }
    .total strong { display: block; margin-top: 4px; font-size: 24px; }
    .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .payment-box p { color: #314436; font-size: 12px; line-height: 1.55; }
    .payment-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .payment-list span { padding: 7px 10px; border-radius: 999px; background: #e8f6df; color: #246526; font-size: 11px; font-weight: 800; }
    .notes { color: #314436; font-size: 12px; line-height: 1.6; white-space: pre-wrap; }
    .signature { margin-top: 32px; text-align: center; }
    .signature-line { width: 70%; height: 1px; margin: 42px auto 10px; background: #314436; }
    .signature strong { display: block; color: #14261a; }
    @media print { body { background: #fff; } .proposal-page { width: auto; min-height: auto; margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <main class="proposal-page">
    <header class="proposal-header">
      <div class="brand company">
        <img class="brand-logo" src="/assets/LogotipoEscura.png" alt="Anjos Soluções Ambientais" />
        <div>
          <strong>ANJOS AMBIENTAL</strong>
          <span>Consultoria e Licenciamento Ambiental</span>
          <span>CNPJ: 00.000.000/0001-00</span>
        </div>
      </div>
      <div class="contact">
        <span>Endereço: Montes Claros/MG</span>
        <span>Telefone: (38) 99999-0000</span>
        <span>E-mail: contato@anjosambiental.com.br</span>
        <span>Instagram: @anjosambiental</span>
      </div>
    </header>
    <h1>PROPOSTA COMERCIAL Nº ${escapeHtml(proposal.id.replace('PROP', ''))}</h1>
    <section class="meta">
      <div><small>Data</small><strong>${escapeHtml(proposal.createdAt)}</strong></div>
      <div><small>Validade</small><strong>${escapeHtml(proposal.validity)}</strong></div>
      <div><small>Prazo</small><strong>${escapeHtml(proposal.deadline)}</strong></div>
      <div><small>Responsável</small><strong>${escapeHtml(proposal.responsible)}</strong></div>
    </section>
    <h3>Cliente</h3>
    <section class="client-box client-grid">
      <div><small>Nome</small><strong>${escapeHtml(proposal.client)}</strong></div>
      <div><small>Telefone</small><strong>${escapeHtml(proposal.clientPhone)}</strong></div>
      <div><small>Propriedade</small><strong>${escapeHtml(proposal.property)}</strong></div>
      <div><small>Município</small><strong>Montes Claros/MG</strong></div>
    </section>
    <h3>Serviços</h3>
    <table>
      <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
      <tbody>${serviceRows}</tbody>
    </table>
    <div class="total"><div><span>Valor total</span><strong>${formatCurrency(parseCurrency(proposal.value))}</strong></div></div>
    <h3>Pagamento</h3>
    <section class="payment-grid">
      <div class="payment-box">
        <h2>Meios selecionados</h2>
        <div class="payment-list">${proposal.paymentMethods.map((method) => `<span>${escapeHtml(method)}</span>`).join('')}</div>
      </div>
      <div class="payment-box">
        <h2>Resumo financeiro</h2>
        <p>Entrada de ${proposal.entryPercentage}%: <strong>${formatCurrency(parseCurrency(proposal.entryValue))}</strong></p>
        <p>Valor restante: <strong>${formatCurrency(parseCurrency(proposal.remainingValue))}</strong></p>
      </div>
    </section>
    <h3>Condições de pagamento</h3>
    <section class="payment-box"><p>${escapeHtml(proposal.paymentTerms)}</p></section>
    <h3>Observações técnicas</h3>
    <p class="notes">${escapeHtml(proposal.technicalNotes || proposal.observations || 'Sem observações adicionais.')}</p>
    <section class="signature">
      <div class="signature-line"></div>
      <strong>ANJOS AMBIENTAL CONSULTORIA LTDA</strong>
    </section>
  </main>
</body>
</html>`;
}

function openProposalPdf(proposal: Proposal, print = false) {
  const proposalWindow = window.open('', '_blank');
  if (!proposalWindow) return;
  proposalWindow.document.open();
  proposalWindow.document.write(buildProposalHtml(proposal));
  proposalWindow.document.close();
  if (print) {
    proposalWindow.setTimeout(() => {
      proposalWindow.focus();
      proposalWindow.print();
    }, 350);
  }
}

const defaultContractedCompany = {
  name: 'ANJOS AMBIENTAL CONSULTORIA LTDA',
  cnpj: '52.723.882/0001-17',
  address: 'Rua Dr. Francisco Ludovico de Almeida, nº 87, Quadra 17, Lote 7, Vila Santa Maria - Conjunto Caiçara, Goiânia/GO, CEP 74.775-011',
  phone: '(62) 00000-0000'
};

function buildContractNumber(count: number) {
  return 'CONT' + String(count + 1).padStart(3, '0') + '/' + new Date().getFullYear();
}

function formatContractStatus(status: ContractStatus) {
  if (status === 'Vigente') return 'Contrato vigente';
  return status;
}

function getContractStatusClass(status: ContractStatus) {
  return status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

function createContractDraft(proposal: Proposal, contractsCount: number): ContractRecord {
  const today = new Date().toLocaleDateString('pt-BR');
  const halfValue = formatCurrency(parseCurrency(proposal.value) / 2);
  const totalValue = formatCurrency(parseCurrency(proposal.value));
  return {
    id: buildContractNumber(contractsCount),
    proposalId: proposal.id,
    processId: proposal.processId,
    client: proposal.client,
    property: proposal.property,
    phone: proposal.clientPhone,
    city: 'Montes Claros/MG',
    service: proposal.service,
    value: proposal.value,
    paymentTerms: proposal.paymentTerms,
    deadline: proposal.deadline,
    responsible: 'Jurídico',
    status: 'Contrato gerado',
    contractDate: today,
    approvalDate: proposal.approvedAt ?? today,
    expirationDate: '',
    contractorDocument: '',
    contractorAddress: proposal.property,
    contractorCity: 'Montes Claros',
    contractorState: 'MG',
    contractedCompany: defaultContractedCompany.name,
    contractedCnpj: defaultContractedCompany.cnpj,
    contractedAddress: defaultContractedCompany.address,
    contractedPhone: defaultContractedCompany.phone,
    objectClause: `O presente contrato tem por objeto a prestação de serviços técnicos especializados de ${proposal.service}, a serem executados pela CONTRATADA em área indicada pela CONTRATANTE, referente à propriedade ${proposal.property}, vinculada ao processo ${proposal.processId} e à proposta comercial ${proposal.id}.`,
    contractedObligations: 'São obrigações da CONTRATADA executar os serviços contratados com observância das normas técnicas aplicáveis, disponibilizar equipe técnica, ferramentas e materiais necessários à execução dos serviços, entregar os serviços dentro dos padrões técnicos exigidos e informar à CONTRATANTE qualquer fato que possa comprometer o andamento dos trabalhos.',
    contractorObligations: 'São obrigações da CONTRATANTE disponibilizar acesso à área objeto dos serviços, fornecer informações e documentos necessários à execução dos trabalhos, prestar esclarecimentos quando solicitado e efetuar os pagamentos nos prazos estabelecidos neste contrato.',
    paymentClause: `Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor total de ${totalValue}, sendo 50% na assinatura deste contrato (${halfValue}) e 50% na conclusão dos serviços (${halfValue}), salvo condição diversa expressamente ajustada entre as partes.`,
    deadlineClause: `O prazo para execução dos serviços será de ${proposal.deadline}, ou conforme disponibilidade de acesso à área, entrega integral dos documentos necessários e condições técnicas adequadas à realização dos trabalhos.`,
    terminationClause: 'O presente contrato poderá ser rescindido por qualquer das partes em caso de descumprimento de quaisquer cláusulas aqui estabelecidas, mediante comunicação formal, preservando-se os valores proporcionais aos serviços já executados.',
    jurisdictionClause: 'Fica eleito o foro da comarca de Goiânia/GO para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
    observations: proposal.observations,
    signedFileName: '',
    generatedAt: today
  };
}

function buildContractHtml(contract: ContractRecord) {
  const signingCity = contract.contractorCity || 'Goiânia';
  const signingState = contract.contractorState || 'GO';
  const clauses = [
    ['CLÁUSULA PRIMEIRA - DO OBJETO', contract.objectClause],
    ['CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DA CONTRATADA', contract.contractedObligations],
    ['CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DA CONTRATANTE', contract.contractorObligations],
    ['CLÁUSULA QUARTA - DO VALOR E PAGAMENTO', contract.paymentClause],
    ['CLÁUSULA QUINTA - DO PRAZO', contract.deadlineClause],
    ['CLÁUSULA SEXTA - DA RESCISÃO', contract.terminationClause],
    ['CLÁUSULA SÉTIMA - DO FORO', contract.jurisdictionClause]
  ];

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(contract.id)} - ${escapeHtml(contract.client)}</title>
  <style>
    @page { size: A4; margin: 17mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #17291c; font-family: Arial, Helvetica, sans-serif; background: #eef5ea; }
    .contract-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm; background: #fff; }
    .contract-header { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; padding-bottom: 16px; border-bottom: 3px solid #1e4d2b; }
    .brand { display: flex; gap: 12px; align-items: center; }
    .brand-logo { width: 136px; height: auto; display: block; object-fit: contain; }
    h1, h2, h3, p { margin: 0; }
    h1 { margin: 24px 0 18px; color: #1e4d2b; font-size: 25px; text-align: center; letter-spacing: 0; }
    h2 { color: #14261a; font-size: 15px; margin: 20px 0 8px; }
    .company strong { display: block; color: #14261a; font-size: 19px; }
    .company span, .contact span { display: block; margin-top: 4px; color: #566557; font-size: 11px; line-height: 1.35; }
    .contact { text-align: right; }
    .meta-grid, .party-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; }
    .meta-grid { grid-template-columns: repeat(4, 1fr); margin-bottom: 16px; }
    .box { border: 1px solid #dce8d6; border-radius: 9px; padding: 11px; background: #fbfdf8; }
    .box small { display: block; color: #6b8b69; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .box strong { display: block; margin-top: 5px; color: #14261a; font-size: 12px; line-height: 1.35; }
    .intro, .party-text, .clause p { color: #314436; font-size: 12px; line-height: 1.65; text-align: justify; }
    .party-text { margin-top: 10px; }
    .party-text strong { color: #14261a; }
    .clause { margin-top: 14px; }
    .clause h3 { color: #1e4d2b; font-size: 12px; margin-bottom: 6px; text-transform: uppercase; }
    .signing-place { margin-top: 26px; color: #314436; font-size: 12px; text-align: right; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 28px; }
    .signature { text-align: center; color: #14261a; font-size: 12px; }
    .signature-line { height: 1px; margin: 42px 0 10px; background: #314436; }
    .footer-note { margin-top: 22px; color: #566557; font-size: 10px; text-align: center; }
    @media print { body { background: #fff; } .contract-page { width: auto; min-height: auto; margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <main class="contract-page">
    <header class="contract-header">
      <div class="brand company">
        <img class="brand-logo" src="/assets/LogotipoEscura.png" alt="Anjos Soluções Ambientais" />
        <div>
          <strong>ANJOS AMBIENTAL</strong>
          <span>Consultoria e Licenciamento Ambiental</span>
          <span>CNPJ: ${escapeHtml(contract.contractedCnpj)}</span>
        </div>
      </div>
      <div class="contact">
        <span>Endereço: ${escapeHtml(contract.contractedAddress)}</span>
        <span>Telefone: ${escapeHtml(contract.contractedPhone)}</span>
        <span>E-mail: contato@anjosambiental.com.br</span>
        <span>Instagram: @anjosambiental</span>
      </div>
    </header>
    <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS AMBIENTAIS Nº ${escapeHtml(contract.id.replace('CONT', ''))}</h1>
    <section class="meta-grid">
      <div class="box"><small>Data</small><strong>${escapeHtml(contract.contractDate)}</strong></div>
      <div class="box"><small>Proposta</small><strong>${escapeHtml(contract.proposalId)}</strong></div>
      <div class="box"><small>Processo</small><strong>${escapeHtml(contract.processId)}</strong></div>
      <div class="box"><small>Valor</small><strong>${formatCurrency(parseCurrency(contract.value))}</strong></div>
    </section>
    <p class="intro">Pelo presente instrumento particular, as partes abaixo qualificadas ajustam a prestação de serviços ambientais conforme condições, obrigações e cláusulas descritas neste contrato.</p>
    <p class="party-text"><strong>CONTRATANTE:</strong> ${escapeHtml(contract.client)}, inscrito(a) no CPF/CNPJ sob nº ${escapeHtml(contract.contractorDocument || 'não informado')}, com endereço em ${escapeHtml(contract.contractorAddress || contract.property || 'não informado')}, ${escapeHtml(`${contract.contractorCity || 'município não informado'}/${contract.contractorState || 'UF'}`)}, telefone ${escapeHtml(contract.phone || 'não informado')}, doravante denominado(a) simplesmente CONTRATANTE.</p>
    <p class="party-text"><strong>CONTRATADA:</strong> ${escapeHtml(contract.contractedCompany)}, inscrita no CNPJ sob nº ${escapeHtml(contract.contractedCnpj)}, com sede na ${escapeHtml(contract.contractedAddress)}, doravante denominada simplesmente CONTRATADA.</p>
    ${clauses.map(([title, text]) => `<section class="clause"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></section>`).join('')}
    <p class="signing-place">${escapeHtml(`${signingCity}/${signingState}`)}, ${escapeHtml(contract.contractDate)}.</p>
    <section class="signature-grid">
      <div class="signature"><div class="signature-line"></div><strong>CONTRATANTE</strong><br />${escapeHtml(contract.client)}</div>
      <div class="signature"><div class="signature-line"></div><strong>CONTRATADA</strong><br />${escapeHtml(contract.contractedCompany)}</div>
    </section>
    <p class="footer-note">Contrato gerado pelo sistema Anjos Ambiental em ${escapeHtml(contract.generatedAt ?? contract.contractDate)}.</p>
  </main>
</body>
</html>`;
}

function openContractPdf(contract: ContractRecord, print = false) {
  const contractWindow = window.open('', '_blank');
  if (!contractWindow) return;
  contractWindow.document.open();
  contractWindow.document.write(buildContractHtml(contract));
  contractWindow.document.close();
  if (print) {
    contractWindow.setTimeout(() => {
      contractWindow.focus();
      contractWindow.print();
    }, 350);
  }
}

async function previewDocument(document: DocumentRecord) {
  console.info('[Documentos] Visualizar documento - dados', {
    fileName: document.fileName,
    bucket: document.bucket,
    storagePath: document.storagePath
  });

  if (!document.bucket || !document.storagePath) {
    console.error('[Documentos] Visualizar documento - arquivo sem caminho do Storage', document);
    window.alert('Este documento não possui caminho válido no Supabase Storage. Envie o arquivo novamente.');
    return;
  }

  const { data, error } = await supabase.storage.from(document.bucket).createSignedUrl(document.storagePath, 300);
  if (!error && data?.signedUrl) {
    console.info('[Documentos] Visualizar documento - URL gerada', {
      fileName: document.fileName,
      bucket: document.bucket,
      storagePath: document.storagePath,
      url: data.signedUrl
    });
    window.open(data.signedUrl, '_blank');
    return;
  }

  const publicUrl = supabase.storage.from(document.bucket).getPublicUrl(document.storagePath).data.publicUrl;
  console.error('[Documentos] Visualizar documento - erro ao gerar signed URL', {
    fileName: document.fileName,
    bucket: document.bucket,
    storagePath: document.storagePath,
    publicUrl,
    error
  });
  if (publicUrl) {
    window.open(publicUrl, '_blank');
    return;
  }
  window.alert(`Não foi possível abrir o arquivo no Supabase Storage.\n\n${error?.message ?? 'URL indisponível.'}`);
}

async function downloadDocument(document: DocumentRecord) {
  console.info('[Documentos] Baixar documento - dados', {
    fileName: document.fileName,
    bucket: document.bucket,
    storagePath: document.storagePath
  });

  if (!document.bucket || !document.storagePath) {
    console.error('[Documentos] Baixar documento - arquivo sem caminho do Storage', document);
    window.alert('Este documento não possui caminho válido no Supabase Storage. Envie o arquivo novamente.');
    return;
  }

  const { data, error } = await supabase.storage.from(document.bucket).download(document.storagePath);
  if (error || !data) {
    console.error('[Documentos] Baixar documento - erro Supabase Storage', {
      fileName: document.fileName,
      bucket: document.bucket,
      storagePath: document.storagePath,
      error
    });
    window.alert(`Não foi possível baixar o arquivo no Supabase Storage.\n\n${error?.message ?? 'Arquivo indisponível.'}`);
    return;
  }

  console.info('[Documentos] Baixar documento - blob recebido', {
    fileName: document.fileName,
    bucket: document.bucket,
    storagePath: document.storagePath,
    size: data.size,
    type: data.type
  });
  const url = URL.createObjectURL(data);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = document.fileName || `${document.id}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function mapDbClientToClient(client: DbClient): Client {
  const statusMap: Record<DbClient['status'], Client['status']> = {
    novo: 'Novo',
    em_atendimento: 'Em atendimento',
    com_processo_ativo: 'Com processo ativo',
    inativo: 'Inativo'
  };

  return {
    id: client.id,
    type: client.type === 'pessoa_juridica' ? 'Pessoa jurídica' : 'Pessoa física',
    name: client.name,
    document: client.document,
    rgStateRegistration: client.rg_state_registration ?? '',
    phone: client.phone ?? '',
    email: client.email ?? '',
    address: client.address ?? '',
    city: client.city ?? '',
    state: client.state ?? '',
    source: client.source ?? '',
    owner: client.responsible ?? '',
    demand: client.demand ?? '',
    notes: client.notes ?? '',
    status: statusMap[client.status] ?? 'Novo',
    properties: 0,
    processes: 0,
    pendingDocuments: documentChecklist.length
  };
}

function mapClientFormToDbClient(form: ClientFormState) {
  return {
    type: form.type === 'Pessoa jurídica' ? 'pessoa_juridica' : 'pessoa_fisica',
    name: form.name,
    document: form.document,
    rg_state_registration: form.rgStateRegistration || null,
    phone: form.phone || null,
    email: form.email || null,
    address: form.address || null,
    city: form.city || null,
    state: form.state || null,
    source: form.source || null,
    responsible: form.owner || null,
    demand: form.demand || null,
    notes: form.notes || null,
    status: 'novo'
  };
}

function mapDbAnalysisToAnalysis(analysis?: DbTechnicalAnalysis | null): TechnicalAnalysis {
  const statusMap: Record<DbTechnicalAnalysis['status'], TechnicalAnalysis['status']> = {
    em_analise: 'Em análise',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
    necessita_complementacao: 'Necessita complementação'
  };
  const resultMap: Record<DbTechnicalAnalysis['result'], TechnicalAnalysis['result']> = {
    pode_gerar_proposta: 'Pode gerar proposta',
    precisa_complementar_informacoes: 'Precisa complementar informações',
    servico_inviavel: 'Serviço inviável'
  };

  return {
    status: analysis ? statusMap[analysis.status] : 'Em análise',
    areaSituation: analysis?.area_situation ?? '',
    pendingIssues: analysis?.pending_issues ?? '',
    additionalNeeds: analysis?.additional_needs ?? '',
    technicalOpinion: analysis?.technical_opinion ?? '',
    result: analysis ? resultMap[analysis.result] : 'Precisa complementar informações',
    responsible: analysis?.responsible ?? 'Técnico escritório',
    analysisDate: formatDateBR(analysis?.analysis_date) || new Date().toLocaleDateString('pt-BR')
  };
}

function mapAnalysisToDb(analysis: TechnicalAnalysis) {
  const statusMap: Record<TechnicalAnalysis['status'], DbTechnicalAnalysis['status']> = {
    'Em análise': 'em_analise',
    Aprovado: 'aprovado',
    Reprovado: 'reprovado',
    'Necessita complementação': 'necessita_complementacao'
  };
  const resultMap: Record<TechnicalAnalysis['result'], DbTechnicalAnalysis['result']> = {
    'Pode gerar proposta': 'pode_gerar_proposta',
    'Precisa complementar informações': 'precisa_complementar_informacoes',
    'Serviço inviável': 'servico_inviavel'
  };

  return {
    status: statusMap[analysis.status],
    result: resultMap[analysis.result],
    area_situation: analysis.areaSituation || null,
    pending_issues: analysis.pendingIssues || null,
    additional_needs: analysis.additionalNeeds || null,
    technical_opinion: analysis.technicalOpinion || null,
    responsible: analysis.responsible || null,
    analysis_date: formatDateToDb(analysis.analysisDate)
  };
}

function mapDbProcessToProcess(process: DbProcess): EnvironmentalProcess {
  const analysis = mapDbAnalysisToAnalysis(process.technical_analyses);
  const statusByAnalysis: Record<TechnicalAnalysis['status'], string> = {
    'Em análise': 'Em análise técnica',
    Aprovado: 'Aguardando proposta',
    Reprovado: 'Reprovado',
    'Necessita complementação': 'Necessita complementação'
  };
  const priorityMap: Record<DbProcess['priority'], EnvironmentalProcess['priority']> = {
    normal: 'Normal',
    alta: 'Alta',
    urgente: 'Urgente'
  };

  return {
    dbId: process.id,
    clientId: process.client_id,
    propertyId: process.property_id ?? undefined,
    id: process.process_number,
    client: process.clients?.name ?? 'Cliente não vinculado',
    clientPhone: process.clients?.phone ?? '',
    property: process.properties?.name ?? 'Propriedade não vinculada',
    service: process.service,
    status: statusByAnalysis[analysis.status] ?? process.status,
    priority: priorityMap[process.priority] ?? 'Normal',
    owner: process.responsible ?? analysis.responsible,
    dueDate: formatDateBR(process.due_date),
    openedAt: formatDateBR(process.opened_at),
    currentStage: process.current_stage ?? 'Etapa 02 - Análise técnica',
    demand: process.demand ?? '',
    analysis,
    history: ['Processo carregado do Supabase']
  };
}

function mapDbPaymentMethod(method: string): PaymentMethod {
  const methodMap: Record<string, PaymentMethod> = {
    pix: 'Pix',
    boleto: 'Boleto',
    transferencia_bancaria: 'Transferência bancária',
    'transferência bancária': 'Transferência bancária'
  };
  return methodMap[method] ?? 'Pix';
}

function mapPaymentMethodToDb(method: PaymentMethod) {
  const methodMap: Record<PaymentMethod, string> = {
    Pix: 'pix',
    Boleto: 'boleto',
    'Transferência bancária': 'transferencia_bancaria'
  };
  return methodMap[method];
}

function mapFinancialPaymentMethodToDb(method?: string | null) {
  if (!method) return null;
  const normalized = normalizeText(method);
  if (normalized === 'pix') return 'pix';
  if (normalized === 'boleto') return 'boleto';
  if (normalized.includes('transferencia')) return 'transferencia_bancaria';
  return method;
}

function mapDbProposalStatus(status: DbProposal['status']): ProposalStatus {
  const statusMap: Record<DbProposal['status'], ProposalStatus> = {
    gerar_proposta: 'Gerar proposta',
    proposta_gerada: 'Proposta gerada',
    proposta_aprovada: 'Proposta aprovada',
    proposta_recusada: 'Proposta recusada'
  };
  return statusMap[status] ?? 'Proposta gerada';
}

function mapProposalStatusToDb(status: ProposalStatus): DbProposal['status'] {
  const statusMap: Record<ProposalStatus, DbProposal['status']> = {
    'Gerar proposta': 'gerar_proposta',
    'Proposta gerada': 'proposta_gerada',
    'Proposta aprovada': 'proposta_aprovada',
    'Proposta recusada': 'proposta_recusada'
  };
  return statusMap[status];
}

function mapDbProposalToProposal(proposal: DbProposal): Proposal {
  const services = [...(proposal.proposal_services ?? [])]
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
    .map((service) => ({
      description: service.description,
      value: formatCurrencyInput(Number(service.value ?? 0))
    }));
  const totalValue = Number(proposal.total_value ?? services.reduce((total, service) => total + parseCurrency(service.value), 0));
  const entryValue = Number(proposal.entry_value ?? 0);
  const remainingValue = Number(proposal.remaining_value ?? Math.max(totalValue - entryValue, 0));

  return {
    dbId: proposal.id,
    id: proposal.proposal_number,
    processId: proposal.processes?.process_number ?? proposal.process_id,
    client: proposal.client_name,
    clientPhone: proposal.client_phone ?? '',
    property: proposal.property_name ?? '',
    service: services.map((service) => service.description).filter(Boolean).join(' + ') || proposal.processes?.service || 'Serviço ambiental',
    services,
    value: formatCurrencyInput(totalValue),
    deadline: proposal.deadline ?? '',
    paymentTerms: proposal.payment_terms ?? '',
    paymentMethods: (proposal.payment_methods ?? []).map(mapDbPaymentMethod),
    entryPercentage: Number(proposal.entry_percentage ?? 50),
    entryValue: formatCurrencyInput(entryValue),
    remainingValue: formatCurrencyInput(remainingValue),
    validity: proposal.validity ?? '',
    responsible: proposal.responsible ?? 'Comercial',
    technicalNotes: proposal.technical_notes ?? '',
    observations: proposal.observations ?? '',
    status: mapDbProposalStatus(proposal.status),
    createdAt: formatDateBR(proposal.proposal_date ?? proposal.generated_at),
    approvedAt: proposal.approved_at ? formatDateBR(proposal.approved_at) : undefined,
    contacts: []
  };
}

function mapDbContractStatus(status: DbContract['status']): ContractStatus {
  const statusMap: Record<DbContract['status'], ContractStatus> = {
    aguardando_contrato: 'Aguardando contrato',
    contrato_gerado: 'Contrato gerado',
    vigente: 'Vigente',
    cancelado: 'Cancelado'
  };
  return statusMap[status] ?? 'Contrato gerado';
}

function mapContractStatusToDb(status: ContractStatus): DbContract['status'] {
  const statusMap: Record<ContractStatus, DbContract['status']> = {
    'Aguardando contrato': 'aguardando_contrato',
    'Contrato gerado': 'contrato_gerado',
    Vigente: 'vigente',
    Cancelado: 'cancelado'
  };
  return statusMap[status];
}

function mapDbContractToContract(contract: DbContract): ContractRecord {
  const totalValue = Number(contract.total_value ?? 0);
  const entryValue = Number(contract.entry_value ?? totalValue / 2);
  const remainingValue = Number(contract.remaining_value ?? Math.max(totalValue - entryValue, 0));

  return {
    dbId: contract.id,
    proposalDbId: contract.proposal_id,
    processDbId: contract.process_id,
    clientDbId: contract.client_id,
    propertyDbId: contract.property_id ?? undefined,
    id: contract.contract_number,
    proposalId: contract.proposals?.proposal_number ?? contract.proposal_id,
    processId: contract.processes?.process_number ?? contract.process_id,
    client: contract.client_name,
    property: contract.property_name ?? '',
    phone: contract.client_phone ?? '',
    city: [contract.client_city, contract.client_state].filter(Boolean).join('/'),
    service: contract.service_description,
    value: formatCurrencyInput(totalValue),
    paymentTerms: contract.payment_terms ?? '',
    deadline: contract.execution_deadline ?? '',
    responsible: 'Jurídico',
    status: mapDbContractStatus(contract.status),
    contractDate: formatDateBR(contract.contract_date),
    approvalDate: formatDateBR(contract.proposals?.approved_at) || formatDateBR(contract.generated_at),
    expirationDate: formatDateBR(contract.expiration_date),
    contractorDocument: contract.client_document ?? '',
    contractorAddress: contract.client_address ?? contract.property_name ?? '',
    contractorCity: contract.client_city ?? '',
    contractorState: contract.client_state ?? '',
    contractedCompany: contract.company_name ?? defaultContractedCompany.name,
    contractedCnpj: contract.company_cnpj ?? defaultContractedCompany.cnpj,
    contractedAddress: contract.company_address ?? defaultContractedCompany.address,
    contractedPhone: contract.company_phone ?? defaultContractedCompany.phone,
    objectClause: `O presente contrato tem por objeto a prestação de serviços técnicos especializados de ${contract.service_description}, a serem executados pela CONTRATADA em área indicada pela CONTRATANTE, referente à propriedade ${contract.property_name ?? 'não informada'}, vinculada ao processo ${contract.processes?.process_number ?? contract.process_id} e à proposta comercial ${contract.proposals?.proposal_number ?? contract.proposal_id}.`,
    contractedObligations: 'São obrigações da CONTRATADA executar os serviços contratados com observância das normas técnicas aplicáveis, disponibilizar equipe técnica, ferramentas e materiais necessários à execução dos serviços, entregar os serviços dentro dos padrões técnicos exigidos e informar à CONTRATANTE qualquer fato que possa comprometer o andamento dos trabalhos.',
    contractorObligations: 'São obrigações da CONTRATANTE disponibilizar acesso à área objeto dos serviços, fornecer informações e documentos necessários à execução dos trabalhos, prestar esclarecimentos quando solicitado e efetuar os pagamentos nos prazos estabelecidos neste contrato.',
    paymentClause: `Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor total de ${formatCurrency(totalValue)}, sendo 50% na assinatura deste contrato (${formatCurrency(entryValue)}) e 50% na conclusão dos serviços (${formatCurrency(remainingValue)}), salvo condição diversa expressamente ajustada entre as partes.`,
    deadlineClause: `O prazo para execução dos serviços será de ${contract.execution_deadline ?? 'acordo entre as partes'}, ou conforme disponibilidade de acesso à área, entrega integral dos documentos necessários e condições técnicas adequadas à realização dos trabalhos.`,
    terminationClause: 'O presente contrato poderá ser rescindido por qualquer das partes em caso de descumprimento de quaisquer cláusulas aqui estabelecidas, mediante comunicação formal, preservando-se os valores proporcionais aos serviços já executados.',
    jurisdictionClause: 'Fica eleito o foro da comarca de Goiânia/GO para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
    observations: '',
    signedFileName: contract.signed_file_name ?? '',
    generatedAt: formatDateBR(contract.generated_at),
    activatedAt: formatDateBR(contract.activated_at)
  };
}

function mapContractToDb(contract: ContractRecord, proposal?: Proposal) {
  const totalValue = parseCurrency(contract.value);
  const entryPercentage = proposal?.entryPercentage ?? 50;
  const entryValue = totalValue * (entryPercentage / 100);

  return {
    contract_number: contract.id,
    proposal_id: contract.proposalDbId ?? proposal?.dbId,
    process_id: contract.processDbId,
    client_id: contract.clientDbId,
    property_id: contract.propertyDbId ?? null,
    status: mapContractStatusToDb(contract.status),
    client_name: contract.client,
    client_document: contract.contractorDocument || null,
    client_address: contract.contractorAddress || null,
    client_city: contract.contractorCity || null,
    client_state: contract.contractorState || null,
    client_phone: contract.phone || null,
    property_name: contract.property || null,
    service_description: contract.service,
    total_value: totalValue,
    entry_percentage: entryPercentage,
    entry_value: entryValue,
    remaining_value: Math.max(totalValue - entryValue, 0),
    payment_terms: contract.paymentTerms || contract.paymentClause || null,
    execution_deadline: contract.deadline || null,
    contract_date: formatDateToDb(contract.contractDate),
    expiration_date: formatDateToDb(contract.expirationDate),
    company_name: contract.contractedCompany,
    company_cnpj: contract.contractedCnpj,
    company_address: contract.contractedAddress,
    company_phone: contract.contractedPhone || null,
    signed_file_name: contract.signedFileName || null
  };
}


function mapExecutionTaskStatusToDb(status: ExecutionTaskStatus) {
  const statusMap: Record<ExecutionTaskStatus, string> = {
    'Não iniciado': 'nao_iniciado',
    'Em andamento': 'em_andamento',
    'Aguardando aprovação': 'aguardando_aprovacao',
    Aprovado: 'aprovado',
    Concluído: 'concluido',
    'Pendente documentação': 'pendente_documentacao',
    Rejeitado: 'rejeitado',
    'Cliente já possui': 'cliente_ja_possui',
    'Não se aplica': 'nao_se_aplica'
  };
  return statusMap[status];
}

function mapDbExecutionTaskStatus(status: string | null): ExecutionTaskStatus {
  const statusMap: Record<string, ExecutionTaskStatus> = {
    nao_iniciado: 'Não iniciado',
    em_andamento: 'Em andamento',
    aguardando_aprovacao: 'Aguardando aprovação',
    aprovado: 'Aprovado',
    concluido: 'Concluído',
    pendente_documentacao: 'Pendente documentação',
    rejeitado: 'Rejeitado',
    cliente_ja_possui: 'Cliente já possui',
    nao_se_aplica: 'Não se aplica'
  };
  return status ? statusMap[status] ?? 'Não iniciado' : 'Não iniciado';
}

function mapFieldChecklistStatusToDb(status: FieldChecklistItem['status']) {
  const statusMap: Record<FieldChecklistItem['status'], string> = {
    'Não iniciado': 'nao_iniciado',
    'Em andamento': 'em_andamento',
    Concluído: 'concluido',
    Pendente: 'pendente'
  };
  return statusMap[status];
}

function mapDbFieldChecklistStatus(status: string | null): FieldChecklistItem['status'] {
  const statusMap: Record<string, FieldChecklistItem['status']> = {
    nao_iniciado: 'Não iniciado',
    em_andamento: 'Em andamento',
    concluido: 'Concluído',
    pendente: 'Pendente'
  };
  return status ? statusMap[status] ?? 'Não iniciado' : 'Não iniciado';
}

function mapOfficeActionStatusToDb(status: OfficeAction['status']) {
  const statusMap: Record<OfficeAction['status'], string> = {
    Pendente: 'pendente',
    'Em andamento': 'em_andamento',
    Concluído: 'concluido'
  };
  return statusMap[status];
}

function mapFieldVisitStatusToDb(status: FieldVisit['status']) {
  const statusMap: Record<FieldVisit['status'], string> = {
    Agendada: 'agendada',
    Realizada: 'realizada',
    Pendente: 'pendente'
  };
  return statusMap[status];
}

function mapDbFieldVisitStatus(status: string | null): FieldVisit['status'] {
  const statusMap: Record<string, FieldVisit['status']> = { agendada: 'Agendada', realizada: 'Realizada', pendente: 'Pendente' };
  return status ? statusMap[status] ?? 'Agendada' : 'Agendada';
}

const knownDocumentBuckets = ['client-documents', 'process-documents', 'execution-files'];

function buildStoredDocumentPath(bucket: string, storagePath: string) {
  return `${bucket}/${storagePath}`;
}

function parseStoredDocumentPath(filePath?: string | null) {
  if (!filePath) return { bucket: undefined, storagePath: undefined };
  const normalizedPath = filePath.replace(/^\/+/, '');
  const bucket = knownDocumentBuckets.find((item) => normalizedPath === item || normalizedPath.startsWith(`${item}/`));
  if (bucket) {
    return {
      bucket,
      storagePath: normalizedPath.slice(bucket.length + 1)
    };
  }
  return { bucket: undefined, storagePath: normalizedPath };
}

function mapDbDocumentToDocument(document: DbDocument, processes: EnvironmentalProcess[]): DocumentRecord {
  const linkedProcess = processes.find((process) => process.dbId === document.process_id || process.id === document.processes?.process_number);
  const storageLocation = parseStoredDocumentPath(document.file_path);
  return {
    dbId: document.id,
    bucket: storageLocation.bucket,
    storagePath: storageLocation.storagePath,
    mimeType: document.file_type ?? undefined,
    fileSize: document.file_size ?? undefined,
    id: document.id,
    name: document.name ?? document.category,
    category: document.category,
    client: document.clients?.name ?? linkedProcess?.client ?? '',
    propertyId: document.property_id ?? linkedProcess?.propertyId ?? '',
    propertyName: document.properties?.name ?? linkedProcess?.property ?? '',
    processId: document.processes?.process_number ?? linkedProcess?.id ?? document.process_id ?? '',
    uploadedAt: formatDateBR(document.uploaded_at),
    uploadedBy: document.uploaded_by ?? 'Sistema',
    fileName: document.file_name
  };
}

function mapDbExecutionToExecutionRecord(execution: DbExecution, process: EnvironmentalProcess | undefined): ExecutionRecord {
  const defaultRecord = createDefaultExecutionRecord(process?.id ?? execution.process_id);
  const taskRows = execution.execution_tasks ?? [];
  const checklistRows = execution.field_checklist_items ?? [];
  const tasks = createDefaultExecutionTasks().map((template) => {
    const row = taskRows.find((item) => item.task_key === template.id || item.title === template.title);
    return row ? {
      id: row.task_key ?? template.id,
      title: row.title ?? template.title,
      status: mapDbExecutionTaskStatus(row.status),
      responsible: row.responsible ?? '',
      updatedAt: formatDateBR(row.updated_at),
      protocol: row.protocol ?? '',
      login: row.login ?? '',
      password: row.password_ref ?? '',
      observation: row.observation ?? '',
      attachments: row.attachments ?? [],
      suggestedDocuments: row.suggested_documents ?? template.suggestedDocuments
    } : template;
  });
  const defaultTaskKeys = new Set(executionTaskTemplates.map((template) => template.id));
  const defaultTaskTitles = new Set(executionTaskTemplates.map((template) => normalizeText(template.title)));
  const customTasks = taskRows
    .filter((row) => {
      const taskKey = row.task_key ?? '';
      const title = row.title ?? '';
      return !defaultTaskKeys.has(taskKey) && !defaultTaskTitles.has(normalizeText(title));
    })
    .map((row) => ({
      id: row.task_key ?? `custom-${row.id}`,
      title: row.title,
      status: mapDbExecutionTaskStatus(row.status),
      responsible: row.responsible ?? '',
      updatedAt: formatDateBR(row.updated_at),
      protocol: row.protocol ?? '',
      login: row.login ?? '',
      password: row.password_ref ?? '',
      observation: row.observation ?? '',
      attachments: row.attachments ?? [],
      suggestedDocuments: row.suggested_documents ?? []
    }));

  const fieldChecklist = defaultFieldChecklist.map((template) => {
    const row = checklistRows.find((item) => item.item_key === template.id || item.title === template.title);
    return row ? {
      dbId: row.id,
      id: row.item_key ?? template.id,
      title: row.title ?? template.title,
      status: mapDbFieldChecklistStatus(row.status),
      observation: row.observation ?? '',
      attachments: row.attachments ?? []
    } : template;
  });

  return {
    ...defaultRecord,
    dbId: execution.id,
    processDbId: execution.process_id,
    processId: process?.id ?? execution.process_id,
    tasks: [...tasks, ...customTasks],
    fieldChecklist,
    officeActions: [],
    fieldVisits: (execution.field_visits ?? []).map((visit) => ({
      id: visit.id,
      date: formatDateBR(visit.visit_date),
      responsible: visit.responsible ?? '',
      location: visit.location ?? '',
      coordinates: visit.coordinates ?? '',
      notes: visit.notes ?? '',
      checklist: visit.checklist ?? '',
      status: mapDbFieldVisitStatus(visit.status)
    })),
    history: (execution.execution_history ?? []).map((item) => ({
      id: item.id,
      date: formatDateBR(item.action_date),
      action: item.action,
      responsible: item.responsible ?? 'Sistema',
      observation: item.observation ?? ''
    })),
    internalNotes: execution.execution_notes?.[0]?.notes ?? defaultRecord.internalNotes
  };
}

function getUploadFileName(item: DocumentUploadItem) {
  return typeof item === 'string' ? item : item.name;
}

function chooseDocumentBucket(category: string) {
  const normalized = normalizeText(category);
  if (normalized.includes('protocolo') || normalized.includes('anexos') || normalized.includes('certificado') || normalized.includes('relatorio')) return 'execution-files';
  return 'process-documents';
}

function mapDbFinancialStatus(status: DbFinancialRecord['status'], released: boolean | null): FinancialRecord['financialStatus'] {
  if (released || status === 'liberado_execucao') return 'Liberado para execução';
  const statusMap: Record<DbFinancialRecord['status'], FinancialRecord['financialStatus']> = {
    aguardando_entrada: 'Aguardando entrada',
    entrada_confirmada: 'Entrada confirmada',
    liberado_execucao: 'Liberado para execução',
    pendente_erro: 'Pendente/erro'
  };
  return statusMap[status] ?? 'Aguardando entrada';
}

function mapFinancialStatusToDb(status: FinancialRecord['financialStatus']) {
  const statusMap: Record<FinancialRecord['financialStatus'], DbFinancialRecord['status']> = {
    'Aguardando entrada': 'aguardando_entrada',
    'Entrada confirmada': 'entrada_confirmada',
    'Liberado para execução': 'liberado_execucao',
    'Pendente/erro': 'pendente_erro'
  };
  return statusMap[status];
}

function mapDbPaymentStatus(status: DbFinancialRecord['status']): FinancialRecord['paymentStatus'] {
  if (status === 'liberado_execucao' || status === 'entrada_confirmada') return 'Parcial';
  if (status === 'pendente_erro') return 'Vencido';
  return 'Aberto';
}

function mapInvoiceStatusFromDb(status: DbFinancialRecord['invoice_status']): FinancialRecord['invoiceStatus'] {
  const statusMap: Record<NonNullable<DbFinancialRecord['invoice_status']>, FinancialRecord['invoiceStatus']> = {
    nao_emitida: 'Não emitida',
    emitida: 'Emitida',
    cancelada: 'Cancelada'
  };
  return status ? statusMap[status] : 'Não emitida';
}

function isUuid(value: string | undefined) {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i));
}

function mapDbFinancialRecordToFinancialRecord(record: DbFinancialRecord): FinancialRecord {
  return {
    id: record.id,
    contractDbId: record.contract_id ?? undefined,
    proposalDbId: record.proposal_id ?? undefined,
    processDbId: record.process_id ?? undefined,
    clientDbId: record.client_id ?? undefined,
    contractId: record.contracts?.contract_number ?? record.contract_id ?? 'Contrato não informado',
    proposalId: record.proposals?.proposal_number ?? record.proposal_id ?? 'Proposta não informada',
    processId: record.processes?.process_number ?? record.process_id ?? '',
    client: record.client_name,
    service: record.service_description,
    amount: Number(record.total_value ?? 0),
    entryPercentage: Number(record.entry_percentage ?? 50),
    entryAmount: Number(record.entry_value ?? 0),
    remainingAmount: Number(record.remaining_value ?? 0),
    dueDate: formatDateBR(record.expected_payment_date),
    paymentStatus: mapDbPaymentStatus(record.status),
    financialStatus: mapDbFinancialStatus(record.status, record.released_for_execution),
    receivedAmount: Number(record.received_amount ?? 0),
    paymentMethod: record.payment_method ?? '',
    paidAt: formatDateBR(record.payment_date),
    releasedAt: formatDateBR(record.released_at),
    invoiceNumber: record.invoice_number ?? '',
    invoiceStatus: mapInvoiceStatusFromDb(record.invoice_status),
    notes: record.payment_notes ?? ''
  };
}

type DashboardProcessRow = Pick<DbProcess, 'id' | 'process_number' | 'service' | 'status' | 'responsible' | 'due_date' | 'current_stage'> & {
  clients?: { name: string } | { name: string }[] | null;
};

type DashboardProposalRow = Pick<DbProposal, 'id' | 'proposal_number' | 'status' | 'total_value' | 'generated_at' | 'approved_at'>;
type DashboardContractRow = Pick<DbContract, 'id' | 'contract_number' | 'status' | 'total_value' | 'expiration_date' | 'generated_at' | 'activated_at'>;
type DashboardFinancialRow = Pick<DbFinancialRecord, 'id' | 'status' | 'total_value' | 'received_amount' | 'expected_payment_date' | 'payment_date'>;
type DashboardExecutionTaskRow = Pick<DbExecutionTask, 'id' | 'title' | 'status' | 'updated_at'>;

function isClosedProcess(status: string | null | undefined) {
  return normalizeText(status ?? '').match(/concluido|cancelado|encerrado|finalizado/) !== null;
}

function isOpenProposal(status: DbProposal['status']) {
  return status === 'gerar_proposta' || status === 'proposta_gerada';
}

function isPendingTask(status: string | null | undefined) {
  return !['aprovado', 'concluido', 'cliente ja possui', 'nao se aplica'].includes(normalizeText(status ?? ''));
}

function isDateBeforeToday(value: string | null | undefined, today: Date) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date < current;
}

function isDateWithinDays(value: string | null | undefined, today: Date, days: number) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const limit = new Date(current);
  limit.setDate(limit.getDate() + days);
  return date >= current && date <= limit;
}

function groupRowsByLabel(rows: string[], palette: string[]) {
  const groups = rows.reduce<Record<string, number>>((acc, label) => {
    if (!label) return acc;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(groups)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([label, value], index) => ({ label, value, color: palette[index % palette.length] }));
}

function buildMonthlyRevenueData(records: DashboardFinancialRow[]) {
  const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
  const now = new Date();
  const months = Array.from({ length: 6 }, (_item, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      key,
      label: monthFormatter.format(date).replace('.', ''),
      value: 0,
      color: '#72b043'
    };
  });

  const monthMap = new Map(months.map((month) => [month.key, month]));

  records.forEach((record) => {
    const dateValue = record.payment_date ?? record.expected_payment_date;
    if (!dateValue) return;
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const month = monthMap.get(key);
    if (!month) return;
    month.value += Number(record.received_amount ?? record.total_value ?? 0);
  });

  return months.filter((month) => month.value > 0);
}

function getDashboardClientName(clients: DashboardProcessRow['clients']) {
  if (Array.isArray(clients)) return clients[0]?.name ?? '';
  return clients?.name ?? '';
}

async function loadDashboardFromSupabase(): Promise<DashboardData> {
  const [
    processesResult,
    proposalsResult,
    contractsResult,
    financialResult,
    tasksResult
  ] = await Promise.all([
    supabase.from('processes').select('id, process_number, service, status, responsible, due_date, current_stage, clients(name)').order('created_at', { ascending: false }),
    supabase.from('proposals').select('id, proposal_number, status, total_value, generated_at, approved_at').order('created_at', { ascending: false }),
    supabase.from('contracts').select('id, contract_number, status, total_value, expiration_date, generated_at, activated_at').order('created_at', { ascending: false }),
    supabase.from('financial_records').select('id, status, total_value, received_amount, expected_payment_date, payment_date').order('created_at', { ascending: false }),
    supabase.from('execution_tasks').select('id, title, status, updated_at').order('updated_at', { ascending: false })
  ]);

  const errors = [processesResult.error, proposalsResult.error, contractsResult.error, financialResult.error, tasksResult.error].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? 'Nao foi possivel carregar o dashboard.');
  }

  const today = new Date();
  const dashboardProcesses = (processesResult.data ?? []) as unknown as DashboardProcessRow[];
  const dashboardProposals = (proposalsResult.data ?? []) as DashboardProposalRow[];
  const dashboardContracts = (contractsResult.data ?? []) as DashboardContractRow[];
  const dashboardFinancial = (financialResult.data ?? []) as DashboardFinancialRow[];
  const dashboardTasks = (tasksResult.data ?? []) as DashboardExecutionTaskRow[];

  const activeProcesses = dashboardProcesses.filter((process) => !isClosedProcess(process.status)).length;
  const delayedProcesses = dashboardProcesses.filter((process) => !isClosedProcess(process.status) && isDateBeforeToday(process.due_date, today)).length;
  const openProposals = dashboardProposals.filter((proposal) => isOpenProposal(proposal.status)).length;
  const generatedContracts = dashboardContracts.filter((contract) => contract.status === 'contrato_gerado' || contract.status === 'vigente').length;
  const pendingTasks = dashboardTasks.filter((task) => isPendingTask(task.status)).length;
  const monthlyRevenue = dashboardFinancial.reduce((total, record) => total + Number(record.received_amount ?? 0), 0);
  const contractedValue = dashboardContracts.reduce((total, contract) => total + Number(contract.total_value ?? 0), 0);

  const stagePalette = ['#2f6b3a', '#72b043', '#1f6b5b', '#9fbf50', '#d9a441', '#5d8d4f'];
  const stageData = groupRowsByLabel(
    dashboardProcesses.map((process) => process.current_stage || process.status || 'Sem etapa'),
    stagePalette
  );
  const statusData = groupRowsByLabel(
    dashboardProcesses.map((process) => process.status || 'Sem status'),
    ['#2f6b3a', '#72b043', '#9fbf50', '#d9a441', '#5d8d4f', '#b75d4a']
  );
  const monthlyRevenueData = buildMonthlyRevenueData(dashboardFinancial);

  const healthData = [
    { label: 'Em dia', value: Math.max(0, activeProcesses - delayedProcesses), color: '#72b043' },
    { label: 'Pendências', value: pendingTasks, color: '#d9a441' },
    { label: 'Atrasados', value: delayedProcesses, color: '#b75d4a' }
  ].filter((item) => item.value > 0);

  const recentActivities = [
    ...dashboardProcesses.slice(0, 3).map((process) => ({
      id: process.id,
      title: process.process_number,
      meta: [getDashboardClientName(process.clients), process.service].filter(Boolean).join(' • '),
      status: process.status || process.current_stage || 'Processo',
      date: formatDateBR(process.due_date)
    })),
    ...dashboardProposals.slice(0, 2).map((proposal) => ({
      id: proposal.id,
      title: proposal.proposal_number,
      meta: proposal.total_value ? formatCurrency(Number(proposal.total_value)) : 'Proposta',
      status: proposal.status.replace(/_/g, ' '),
      date: formatDateBR(proposal.approved_at ?? proposal.generated_at)
    })),
    ...dashboardContracts.slice(0, 2).map((contract) => ({
      id: contract.id,
      title: contract.contract_number,
      meta: contract.total_value ? formatCurrency(Number(contract.total_value)) : 'Contrato',
      status: contract.status.replace(/_/g, ' '),
      date: formatDateBR(contract.activated_at ?? contract.generated_at ?? contract.expiration_date)
    })),
    ...dashboardTasks.slice(0, 3).map((task) => ({
      id: task.id,
      title: task.title,
      meta: 'Execução',
      status: task.status ?? 'Tarefa',
      date: formatDateBR(task.updated_at)
    }))
  ].filter((activity) => activity.title || activity.meta).slice(0, 6);

  return {
    summary: {
      activeProcesses,
      openProposals,
      generatedContracts,
      pendingTasks,
      monthlyRevenue,
      contractedValue,
      delayedProcesses
    },
    stageData,
    statusData,
    monthlyRevenueData,
    healthData,
    recentActivities,
    lastUpdated: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())
  };
}

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginFormState>({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [dashboardState, setDashboardState] = useState<DashboardState>({ status: 'loading', data: null });
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewKey>('Dashboard');
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [clientSearch, setClientSearch] = useState('');
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [clientForm, setClientForm] = useState<ClientFormState>(emptyClientForm);
  const [processes, setProcesses] = useState<EnvironmentalProcess[]>(initialProcesses);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [selectedProposalProcessId, setSelectedProposalProcessId] = useState<string | null>(null);
  const [proposalForm, setProposalForm] = useState<ProposalFormState>(emptyProposalForm);
  const [contracts, setContracts] = useState<ContractRecord[]>(initialContracts);
  const [selectedContractProposalId, setSelectedContractProposalId] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [executionRecords, setExecutionRecords] = useState<ExecutionRecord[]>(initialExecutionRecords);
  const [selectedExecutionProcessId, setSelectedExecutionProcessId] = useState<string | null>(null);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>(initialFinancialRecords);
  const [serviceTrackings, setServiceTrackings] = useState<ServiceTracking[]>(initialServiceTrackings);
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);

  useEffect(() => {
    const updateCurrentPath = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', updateCurrentPath);
    return () => window.removeEventListener('popstate', updateCurrentPath);
  }, []);

  const refreshDashboard = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setDashboardState({ status: 'loading', data: null });
    }

    try {
      const dashboardData = await loadDashboardFromSupabase();
      const hasAnyData = Object.values(dashboardData.summary).some((value) => value > 0) || dashboardData.recentActivities.length > 0;
      setDashboardState({ status: hasAnyData ? 'success' : 'empty', data: dashboardData });
    } catch (error: unknown) {
      setDashboardState({
        status: 'error',
        data: null,
        error: error instanceof Error ? error.message : 'Nao foi possivel carregar o dashboard.'
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!isMounted) return;
      setIsAuthenticated(Boolean(sessionData.session));
      setAuthUserId(sessionData.session?.user.id ?? null);
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setAuthUserId(session?.user.id ?? null);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    refreshDashboard(true);
  }, [isAuthenticated, refreshDashboard]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data: dbClients, error }) => {
        if (!isMounted || error || !dbClients || dbClients.length === 0) return;
        setClients(dbClients.map((client) => mapDbClientToClient(client as DbClient)));
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    supabase
      .from('processes')
      .select('*, clients(*), properties(*), technical_analyses(*)')
      .order('created_at', { ascending: false })
      .then(({ data: dbProcesses, error }) => {
        if (!isMounted || error || !dbProcesses || dbProcesses.length === 0) return;
        setProcesses(dbProcesses.map((process) => mapDbProcessToProcess(process as DbProcess)));
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    supabase
      .from('proposals')
      .select('*, proposal_services(*), processes(process_number, service)')
      .order('created_at', { ascending: false })
      .then(({ data: dbProposals, error }) => {
        if (!isMounted || error || !dbProposals || dbProposals.length === 0) return;
        setProposals(dbProposals.map((proposal) => mapDbProposalToProposal(proposal as DbProposal)));
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    supabase
      .from('contracts')
      .select('*, proposals(proposal_number, approved_at), processes(process_number)')
      .order('created_at', { ascending: false })
      .then(({ data: dbContracts, error }) => {
        if (!isMounted || error || !dbContracts || dbContracts.length === 0) return;
        setContracts(dbContracts.map((contract) => mapDbContractToContract(contract as DbContract)));
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    supabase
      .from('financial_records')
      .select('*, contracts(contract_number, contract_date), proposals(proposal_number), processes(process_number)')
      .order('created_at', { ascending: false })
      .then(({ data: dbFinancialRecords, error }) => {
        if (!isMounted || error) return;
        setFinancialRecords((dbFinancialRecords ?? []).map((record) => mapDbFinancialRecordToFinancialRecord(record as DbFinancialRecord)));
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const dashboardCards = useMemo(() => {
    const summary = dashboardState.data?.summary;
    if (!summary) return [];

    return [
      { label: 'Processos em andamento', value: summary.activeProcesses, display: String(summary.activeProcesses), icon: FolderKanban, tone: 'green' },
      { label: 'Propostas abertas', value: summary.openProposals, display: String(summary.openProposals), icon: FileText, tone: 'blue' },
      { label: 'Contratos gerados', value: summary.generatedContracts, display: String(summary.generatedContracts), icon: Scale, tone: 'amber' },
      { label: 'Pendências', value: summary.pendingTasks, display: String(summary.pendingTasks), icon: AlertCircle, tone: 'red' },
      { label: 'Receita recebida', value: summary.monthlyRevenue, display: formatCurrency(summary.monthlyRevenue), icon: BadgeDollarSign, tone: 'emerald' },
      { label: 'Valor contratado', value: summary.contractedValue, display: formatCurrency(summary.contractedValue), icon: ClipboardCheck, tone: 'green' },
      { label: 'Processos atrasados', value: summary.delayedProcesses, display: String(summary.delayedProcesses), icon: Bell, tone: 'orange' }
    ].filter((card) => card.value > 0);
  }, [dashboardState.data]);

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) =>
      [client.name, client.document, client.phone, client.email, client.city].some((value) => value.toLowerCase().includes(term))
    );
  }, [clientSearch, clients]);

  function selectView(view: ViewKey) {
    setActiveView(view);
    setMenuOpen(false);
  }

  function updateLoginField<K extends keyof LoginFormState>(field: K, value: LoginFormState[K]) {
    setLoginForm((current) => ({ ...current, [field]: value }));
    setLoginError('');
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setLoginError('Informe e-mail e senha para acessar o sistema.');
      return;
    }

    setLoginSubmitting(true);
    setLoginError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email.trim(),
      password: loginForm.password
    });

    setLoginSubmitting(false);

    if (error) {
      setLoginError('E-mail ou senha inválidos. Confira os dados e tente novamente.');
      return;
    }

    setIsAuthenticated(true);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setLoginForm({ email: '', password: '' });
    setActiveView('Dashboard');
    setMenuOpen(false);
  }

  function updateClientField<K extends keyof ClientFormState>(field: K, value: ClientFormState[K]) {
    setClientForm((current) => ({ ...current, [field]: value }));
  }

  function updateUserField<K extends keyof UserFormState>(field: K, value: UserFormState[K]) {
    setUserForm((current) => ({ ...current, [field]: value }));
  }

  function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUser: SystemUser = {
      ...userForm,
      id: 'USR-' + String(users.length + 1).padStart(3, '0'),
      status: 'Ativo',
      lastAccess: 'Criado agora'
    };
    setUsers((current) => [nextUser, ...current]);
    setUserForm(emptyUserForm);
    setIsUserFormOpen(false);
  }

  async function handleClientSubmit(event: FormEvent<HTMLFormElement>, initialDocuments: DocumentAttachmentMap = {}) {
    event.preventDefault();
    const attachedCategories = Object.values(initialDocuments).filter((files) => files.length > 0).length;
    const today = new Date();
    const openedAt = today.toISOString().split('T')[0];
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 15);
    const dueDateDb = dueDate.toISOString().split('T')[0];

    const { data: insertedClient, error: insertError } = await supabase
      .from('clients')
      .insert(mapClientFormToDbClient(clientForm))
      .select('*')
      .single();

    let insertedProperty: DbProperty | null = null;
    let insertedProcess: DbProcess | null = null;
    let insertedAnalysis: DbTechnicalAnalysis | null = null;

    if (insertedClient && !insertError) {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .insert({
          client_id: insertedClient.id,
          name: clientForm.address ? `Propriedade inicial - ${clientForm.name}` : 'Propriedade inicial',
          type: 'Rural',
          city: clientForm.city || null,
          state: clientForm.state || null,
          address: clientForm.address || null,
          environmental_notes: clientForm.notes || null
        })
        .select('*')
        .single();

      if (!propertyError && propertyData) {
        insertedProperty = propertyData as DbProperty;
      }

      const { data: processData, error: processError } = await supabase
        .from('processes')
        .insert({
          client_id: insertedClient.id,
          property_id: insertedProperty?.id ?? null,
          service: clientForm.demand || 'Análise técnica inicial',
          demand: clientForm.demand || 'Demanda inicial cadastrada pelo comercial.',
          status: 'liberado_execucao',
          priority: 'normal',
          responsible: clientForm.owner || 'Técnico escritório',
          opened_at: openedAt,
          due_date: dueDateDb,
          current_stage: 'Etapa 02 - Análise técnica',
          notes: clientForm.notes || null
        })
        .select('*, clients(*), properties(*), technical_analyses(*)')
        .single();

      if (!processError && processData) {
        insertedProcess = processData as DbProcess;
        await supabase
          .from('clients')
          .update({ status: 'com_processo_ativo' })
          .eq('id', insertedClient.id);

        const { data: analysisData, error: analysisError } = await supabase
          .from('technical_analyses')
          .upsert({
            process_id: insertedProcess.id,
            status: 'em_analise',
            result: 'precisa_complementar_informacoes',
            area_situation: '',
            pending_issues: '',
            additional_needs: '',
            technical_opinion: '',
            responsible: clientForm.owner || 'Técnico escritório',
            analysis_date: openedAt
          }, { onConflict: 'process_id' })
          .select('*')
          .single();

        if (!analysisError && analysisData) {
          insertedAnalysis = analysisData as DbTechnicalAnalysis;
          insertedProcess = {
            ...insertedProcess,
            technical_analyses: insertedAnalysis
          };
        }
      }
    }

    const nextClient: Client = insertedClient && !insertError ? {
      ...mapDbClientToClient(insertedClient as DbClient),
      status: insertedProcess ? 'Com processo ativo' : 'Novo',
      properties: insertedProperty ? 1 : 0,
      processes: insertedProcess ? 1 : 0,
      pendingDocuments: Math.max(documentChecklist.length - attachedCategories, 0)
    } : {
      ...clientForm,
      id: 'CLI-' + String(clients.length + 1).padStart(3, '0'),
      status: 'Novo',
      properties: 0,
      processes: 0,
      pendingDocuments: Math.max(documentChecklist.length - attachedCategories, 0)
    };

    const newDocuments = Object.entries(initialDocuments).flatMap(([category, fileNames]) => fileNames.map((fileName) => ({ category, fileName })))
      .map(({ category, fileName }, index) => ({
        id: 'DOC-' + String(documents.length + index + 1).padStart(3, '0'),
        name: category,
        category,
        client: nextClient.name,
        propertyId: insertedProperty?.id ?? '',
        propertyName: insertedProperty?.name ?? 'Cadastro do cliente',
        processId: insertedProcess?.process_number ?? '',
        uploadedAt: new Date().toLocaleDateString('pt-BR'),
        uploadedBy: 'Comercial',
        fileName
      }));

    if (insertedProcess) {
      setProcesses((current) => [mapDbProcessToProcess(insertedProcess as DbProcess), ...current]);
    }

    setClients((current) => [nextClient, ...current]);
    if (newDocuments.length > 0) {
      setDocuments((current) => [...newDocuments, ...current]);
    }
    setClientForm(emptyClientForm);
    setIsClientFormOpen(false);
    if (insertedProcess) {
      await refreshDashboard();
    }
  }

  async function updateClient(clientId: string, updates: ClientFormState) {
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update(mapClientFormToDbClient(updates))
      .eq('id', clientId)
      .select('*')
      .single();

    setClients((current) => current.map((client) => {
      if (client.id !== clientId) return client;
      return updatedClient && !updateError ? mapDbClientToClient(updatedClient as DbClient) : { ...client, ...updates };
    }));
  }

  async function attachClientDocuments(client: Client, fileItems: DocumentUploadItem[], category: string) {
    if (fileItems.length === 0) return;
    const relatedProcess = processes.find((process) => process.client === client.name);
    const savedDocuments: DocumentRecord[] = [];

    for (const item of fileItems) {
      if (typeof item === 'string') continue;
      const bucket = 'client-documents';
      const storagePath = `clients/${client.id}/${Date.now()}-${item.name}`;
      console.info('[Documentos] Upload cliente - arquivo selecionado', {
        file: item,
        fileName: item.name,
        size: item.size,
        type: item.type,
        bucket,
        storagePath
      });

      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, item, {
        upsert: true,
        contentType: item.type || undefined
      });

      if (uploadError) {
        console.error('[Documentos] Upload cliente - erro Supabase Storage', {
          fileName: item.name,
          bucket,
          storagePath,
          error: uploadError
        });
        window.alert(`Não foi possível enviar ${item.name} para o Supabase Storage.\n\n${uploadError.message}`);
        continue;
      }

      console.info('[Documentos] Upload cliente - arquivo salvo no Storage', {
        fileName: item.name,
        bucket,
        storagePath
      });

      const documentPayload = {
        client_id: client.id,
        property_id: relatedProcess?.propertyId ?? null,
        process_id: relatedProcess?.dbId ?? null,
        category,
        name: category,
        file_name: item.name,
        file_path: buildStoredDocumentPath(bucket, storagePath),
        file_type: item.type || null,
        file_size: item.size,
        uploaded_by: authUserId
      };

      console.info('[Documentos] Upload cliente - payload enviado', {
        table: 'documents',
        payload: documentPayload,
        uploadedByLabel: 'Comercial'
      });

      const { data: insertedDocument, error: insertError } = await supabase.from('documents').insert(documentPayload).select('*').single();

      if (insertError || !insertedDocument) {
        console.error('[Documentos] Upload cliente - erro ao salvar metadados', {
          table: 'documents',
          fileName: item.name,
          bucket,
          storagePath,
          payload: documentPayload,
          error: insertError
        });
        window.alert(`O arquivo ${item.name} foi enviado, mas os dados não foram salvos no banco.\n\n${insertError?.message ?? 'Erro desconhecido.'}`);
        continue;
      }

      console.info('[Documentos] Upload cliente - metadados salvos', {
        table: 'documents',
        fileName: item.name,
        bucket,
        storagePath,
        document: insertedDocument
      });

      savedDocuments.push({
        ...mapDbDocumentToDocument(insertedDocument as DbDocument, processes),
        client: client.name,
        propertyId: relatedProcess?.propertyId ?? '',
        propertyName: relatedProcess?.property ?? 'Cadastro do cliente',
        processId: relatedProcess?.id ?? ''
      });
    }

    if (savedDocuments.length > 0) {
      setDocuments((current) => [...savedDocuments, ...current]);
    }
  }

  async function attachProcessDocuments(process: EnvironmentalProcess, fileItems: DocumentUploadItem[], category: string) {
    if (fileItems.length === 0) return;
    const bucket = chooseDocumentBucket(category);
    const newDocuments: DocumentRecord[] = [];

    for (const [index, item] of fileItems.entries()) {
      const fileName = getUploadFileName(item);
      let storagePath = '';
      let dbId = '';
      let mimeType = '';
      let fileSize = 0;

      if (typeof item !== 'string' && process.dbId) {
        storagePath = `processes/${process.dbId}/${normalizeText(category).replace(/\s+/g, '-')}/${Date.now()}-${item.name}`;
        console.info('[Documentos] Upload processo - arquivo selecionado', {
          file: item,
          fileName: item.name,
          size: item.size,
          type: item.type,
          bucket,
          storagePath
        });
        const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, item, {
          upsert: true,
          contentType: item.type || undefined
        });
        if (uploadError) {
          console.error('[Documentos] Upload processo - erro Supabase Storage', {
            fileName: item.name,
            bucket,
            storagePath,
            error: uploadError
          });
          window.alert(`Não foi possível enviar o arquivo para o Supabase Storage.\n\n${uploadError.message}`);
          continue;
        }
        console.info('[Documentos] Upload processo - arquivo salvo no Storage', {
          fileName: item.name,
          bucket,
          storagePath
        });
        mimeType = item.type;
        fileSize = item.size;
      }

      if (process.dbId) {
        const documentPayload = {
          client_id: process.clientId ?? null,
          property_id: process.propertyId ?? null,
          process_id: process.dbId,
          category,
          name: category,
          file_name: fileName,
          file_path: storagePath ? buildStoredDocumentPath(bucket, storagePath) : null,
          file_type: mimeType || null,
          file_size: fileSize || null,
          uploaded_by: authUserId
        };
        console.info('[Documentos] Upload processo - payload enviado', {
          table: 'documents',
          payload: documentPayload,
          uploadedByLabel: 'Técnico escritório'
        });

        const { data: insertedDocument, error: documentError } = await supabase
          .from('documents')
          .insert(documentPayload)
          .select('*')
          .single();

        if (!documentError && insertedDocument) {
          dbId = (insertedDocument as DbDocument).id;
          console.info('[Documentos] Upload processo - metadados salvos', {
            table: 'documents',
            fileName,
            bucket,
            storagePath,
            document: insertedDocument
          });
        } else if (documentError) {
          console.error('[Documentos] Upload processo - erro ao salvar metadados', {
            table: 'documents',
            fileName,
            bucket,
            storagePath,
            payload: documentPayload,
            error: documentError
          });
          window.alert(`O arquivo ${fileName} foi enviado, mas os dados não foram salvos no banco.\n\n${documentError.message}`);
          continue;
        }
      }

      newDocuments.push({
        dbId: dbId || undefined,
        bucket: storagePath ? bucket : undefined,
        storagePath: storagePath || undefined,
        mimeType: mimeType || undefined,
        fileSize: fileSize || undefined,
        id: dbId || 'DOC-' + String(documents.length + index + 1).padStart(3, '0'),
        name: category,
        category,
        client: process.client,
        propertyId: process.propertyId ?? '',
        propertyName: process.property,
        processId: process.id,
        uploadedAt: new Date().toLocaleDateString('pt-BR'),
        uploadedBy: 'Técnico escritório',
        fileName
      });
    }

    if (newDocuments.length > 0) setDocuments((current) => [...newDocuments, ...current]);
  }

  async function deleteDocument(documentId: string) {
    const shouldDelete = window.confirm('Deseja excluir este documento?');
    if (!shouldDelete) return false;
    const selectedDocument = documents.find((document) => document.id === documentId);

    if (selectedDocument?.storagePath && selectedDocument.bucket) {
      await supabase.storage.from(selectedDocument.bucket).remove([selectedDocument.storagePath]);
    }

    if (selectedDocument?.dbId) {
      await supabase.from('documents').delete().eq('id', selectedDocument.dbId);
    }

    setDocuments((current) => current.filter((document) => document.id !== documentId));
    return true;
  }

  async function updateProcessAnalysis(processId: string, analysis: TechnicalAnalysis) {
    const selectedProcess = processes.find((process) => process.id === processId);
    if (selectedProcess?.dbId) {
      const nextStage = analysis.status === 'Aprovado' ? 'Etapa 03 - Proposta comercial' : 'Etapa 02 - Análise técnica';

      await supabase
        .from('technical_analyses')
        .upsert({ process_id: selectedProcess.dbId, ...mapAnalysisToDb(analysis) }, { onConflict: 'process_id' });

      await supabase
        .from('processes')
        .update({
          current_stage: nextStage,
          responsible: analysis.responsible || selectedProcess.owner
        })
        .eq('id', selectedProcess.dbId);
    }

    setProcesses((current) =>
      current.map((process) =>
        process.id === processId
          ? {
              ...process,
              status: analysis.status === 'Aprovado' ? 'Aguardando proposta' : analysis.status,
              currentStage: analysis.status === 'Aprovado' ? 'Etapa 03 - Proposta comercial' : 'Etapa 02 - Análise técnica',
              owner: analysis.responsible || process.owner,
              analysis,
              history: [...process.history, 'Parecer técnico atualizado em ' + analysis.analysisDate]
            }
          : process
      )
    );
    if (selectedProcess?.dbId) {
      await refreshDashboard();
    }
  }

  function openProposalForm(processId: string) {
    const process = processes.find((item) => item.id === processId) ?? null;
    setSelectedProposalProcessId(processId);
    setProposalForm(createProposalForm(process, proposals.length));
  }

  function closeProposalForm() {
    setSelectedProposalProcessId(null);
    setProposalForm(emptyProposalForm);
  }

  function updateProposalField<K extends keyof ProposalFormState>(field: K, value: ProposalFormState[K]) {
    setProposalForm((current) => ({ ...current, [field]: value }));
  }

  async function handleProposalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const process = processes.find((item) => item.id === selectedProposalProcessId);
    if (!process) return;

    const totalValue = calculateProposalTotal(proposalForm.services);
    const entryValue = totalValue * (proposalForm.entryPercentage / 100);
    const remainingValue = totalValue - entryValue;
    const proposal: Proposal = {
      id: proposalForm.id || buildProposalId(proposals.length),
      processId: process.id,
      client: proposalForm.client || process.client,
      clientPhone: proposalForm.phone || process.clientPhone,
      property: proposalForm.property || process.property,
      service: proposalForm.services.map((service) => service.description).filter(Boolean).join(' + ') || process.service,
      services: proposalForm.services.filter((service) => service.description.trim() || service.value.trim()),
      value: formatCurrencyInput(totalValue),
      deadline: proposalForm.deadline,
      paymentTerms: proposalForm.paymentTerms,
      paymentMethods: proposalForm.paymentMethods,
      entryPercentage: proposalForm.entryPercentage,
      entryValue: formatCurrencyInput(entryValue),
      remainingValue: formatCurrencyInput(remainingValue),
      validity: proposalForm.validity,
      responsible: proposalForm.responsible,
      technicalNotes: proposalForm.technicalNotes,
      observations: proposalForm.observations,
      status: 'Proposta gerada',
      createdAt: proposalForm.date || new Date().toLocaleDateString('pt-BR'),
      contacts: []
    };

    if (process.dbId && process.clientId) {
      const { data: insertedProposal, error: proposalError } = await supabase
        .from('proposals')
        .insert({
          proposal_number: proposal.id,
          process_id: process.dbId,
          client_id: process.clientId,
          property_id: process.propertyId ?? null,
          status: mapProposalStatusToDb(proposal.status),
          client_name: proposal.client,
          client_phone: proposal.clientPhone || null,
          property_name: proposal.property || null,
          city_state: proposalForm.cityState || null,
          responsible: proposal.responsible || null,
          proposal_date: formatDateToDb(proposal.createdAt),
          total_value: totalValue,
          entry_percentage: proposal.entryPercentage,
          entry_value: entryValue,
          remaining_value: remainingValue,
          payment_methods: proposal.paymentMethods.map(mapPaymentMethodToDb),
          payment_terms: proposal.paymentTerms || null,
          deadline: proposal.deadline || null,
          validity: proposal.validity || null,
          technical_notes: proposal.technicalNotes || null,
          observations: proposal.observations || null
        })
        .select('*')
        .single();

      if (!proposalError && insertedProposal) {
        const servicePayload = proposal.services.map((service, index) => ({
          proposal_id: insertedProposal.id,
          description: service.description,
          value: parseCurrency(service.value),
          sort_order: index + 1
        }));

        if (servicePayload.length > 0) {
          await supabase.from('proposal_services').insert(servicePayload);
        }

        await supabase
          .from('processes')
          .update({
            current_stage: 'Etapa 03 - Proposta comercial',
            responsible: proposal.responsible || process.owner
          })
          .eq('id', process.dbId);

        proposal.dbId = insertedProposal.id;
      }
    }

    setProposals((current) => [proposal, ...current]);
    openProposalPdf(proposal, true);
    closeProposalForm();
    if (proposal.dbId) {
      await refreshDashboard();
    }
  }

  async function approveProposal(proposalId: string) {
    const shouldApprove = window.confirm('Deseja aprovar esta proposta?');
    if (!shouldApprove) return;
    const approvalDate = new Date().toLocaleDateString('pt-BR');
    const proposalToApprove = proposals.find((proposal) => proposal.id === proposalId);

    if (proposalToApprove?.dbId) {
      await supabase
        .from('proposals')
        .update({
          status: 'proposta_aprovada',
          approved_at: new Date().toISOString()
        })
        .eq('id', proposalToApprove.dbId);

      await supabase
        .from('commercial_followups')
        .insert({
          proposal_id: proposalToApprove.dbId,
          process_id: processes.find((process) => process.id === proposalToApprove.processId)?.dbId ?? null,
          client_id: processes.find((process) => process.id === proposalToApprove.processId)?.clientId ?? null,
          contact_date: new Date().toISOString().split('T')[0],
          channel: 'whatsapp',
          note: 'Proposta aprovada pelo comercial após retorno do cliente.',
          next_action: 'Encaminhar para elaboração do contrato.',
          responsible: proposalToApprove.responsible || 'Comercial'
        });
    }

    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === proposalId
          ? {
              ...proposal,
              status: 'Proposta aprovada',
              approvedAt: approvalDate,
              contacts: [
                {
                  date: approvalDate,
                  channel: 'WhatsApp',
                  note: 'Proposta aprovada pelo comercial após retorno do cliente.',
                  nextAction: 'Encaminhar para elaboração do contrato.',
                  responsible: proposal.responsible || 'Comercial'
                },
                ...proposal.contacts
              ]
            }
          : proposal
      )
    );
    if (proposalToApprove?.dbId) {
      await refreshDashboard();
    }
  }

  async function saveContract(contract: ContractRecord) {
    const linkedProposal = proposals.find((proposal) => proposal.id === contract.proposalId);
    const linkedProcess = processes.find((process) => process.id === contract.processId);
    const contractWithRelations: ContractRecord = {
      ...contract,
      proposalDbId: contract.proposalDbId ?? linkedProposal?.dbId,
      processDbId: contract.processDbId ?? linkedProcess?.dbId,
      clientDbId: contract.clientDbId ?? linkedProcess?.clientId,
      propertyDbId: contract.propertyDbId ?? linkedProcess?.propertyId
    };

    if (contractWithRelations.proposalDbId && contractWithRelations.processDbId && contractWithRelations.clientDbId) {
      const contractPayload = mapContractToDb(contractWithRelations, linkedProposal);
      const { data: savedContract, error: contractError } = contractWithRelations.dbId
        ? await supabase
          .from('contracts')
          .update(contractPayload)
          .eq('id', contractWithRelations.dbId)
          .select('*, proposals(proposal_number, approved_at), processes(process_number)')
          .single()
        : await supabase
          .from('contracts')
          .insert(contractPayload)
          .select('*, proposals(proposal_number, approved_at), processes(process_number)')
          .single();

      if (contractError) {
        window.alert('Não foi possível salvar o contrato no Supabase. Tente novamente.');
        return;
      }

      if (savedContract) {
        const dbContract = savedContract as DbContract;
        contractWithRelations.dbId = dbContract.id;

        if (!contract.dbId) {
          const totalValue = parseCurrency(contractWithRelations.value);
          const entryPercentage = linkedProposal?.entryPercentage ?? 50;
          const entryValue = totalValue * (entryPercentage / 100);

          const financialPayload = {
            contract_id: dbContract.id,
            proposal_id: contractWithRelations.proposalDbId,
            process_id: contractWithRelations.processDbId,
            client_id: contractWithRelations.clientDbId,
            status: 'aguardando_entrada',
            client_name: contractWithRelations.client,
            service_description: contractWithRelations.service,
            total_value: totalValue,
            entry_percentage: entryPercentage,
            entry_value: entryValue,
            remaining_value: Math.max(totalValue - entryValue, 0),
            expected_payment_date: formatDateToDb(contractWithRelations.contractDate)
          };

          const { data: existingFinancial } = await supabase
            .from('financial_records')
            .select('id')
            .eq('contract_id', dbContract.id)
            .maybeSingle();

          if (existingFinancial?.id) {
            await supabase.from('financial_records').update(financialPayload).eq('id', existingFinancial.id);
          } else {
            await supabase.from('financial_records').insert(financialPayload);
          }
        }

        await supabase
          .from('processes')
          .update({
            current_stage: 'Etapa 05 - Jurídico e contratos',
            responsible: contractWithRelations.responsible || 'Jurídico'
          })
          .eq('id', contractWithRelations.processDbId);
      }
    }

    setContracts((current) => {
      const exists = current.some((item) => item.id === contractWithRelations.id);
      return exists ? current.map((item) => item.id === contractWithRelations.id ? contractWithRelations : item) : [contractWithRelations, ...current];
    });
    setSelectedContractProposalId(null);
    setSelectedContractId(null);
    if (contractWithRelations.dbId) {
      await refreshDashboard();
    }
  }

  async function activateContract(contractId: string) {
    const shouldActivate = window.confirm('Deseja ativar este contrato e liberar o processo para execução?');
    if (!shouldActivate) return;
    const activationDate = new Date().toLocaleDateString('pt-BR');
    const selectedContract = contracts.find((contract) => contract.id === contractId);

    if (selectedContract?.dbId) {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'vigente',
          activated_at: new Date().toISOString()
        })
        .eq('id', selectedContract.dbId);

      if (error) {
        window.alert('Não foi possível ativar o contrato no Supabase. Tente novamente.');
        return;
      }

      await supabase
        .from('processes')
        .update({
          current_stage: 'Etapa 05 - Financeiro',
          responsible: 'Financeiro'
        })
        .eq('id', selectedContract.processDbId);
    }

    setContracts((current) =>
      current.map((contract) =>
        contract.id === contractId
          ? { ...contract, status: 'Vigente', activatedAt: activationDate }
          : contract
      )
    );
    if (selectedContract?.dbId) {
      await refreshDashboard();
    }
  }


  useEffect(() => {
    if (!isAuthenticated || processes.length === 0) return;

    let isMounted = true;

    supabase
      .from('documents')
      .select('*, clients(name), properties(name), processes(process_number)')
      .order('uploaded_at', { ascending: false })
      .then(({ data: dbDocuments, error }) => {
        if (!isMounted || error) return;
        setDocuments((dbDocuments ?? []).map((document) => mapDbDocumentToDocument(document as DbDocument, processes)));
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, processes]);

  useEffect(() => {
    if (!isAuthenticated || processes.length === 0) return;

    let isMounted = true;

    supabase
      .from('executions')
      .select('*, execution_tasks(*), field_visits(*), field_checklist_items(*), execution_history(*), execution_notes(*)')
      .order('created_at', { ascending: false })
      .then(({ data: dbExecutions, error }) => {
        if (!isMounted || error) return;
        setExecutionRecords((dbExecutions ?? []).map((execution) => {
          const dbExecution = execution as DbExecution;
          const process = processes.find((item) => item.dbId === dbExecution.process_id);
          return mapDbExecutionToExecutionRecord(dbExecution, process);
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, processes]);

  async function ensureExecutionRecord(processId: string) {
    const process = processes.find((item) => item.id === processId);
    if (!process?.dbId) return null;

    const localRecord = executionRecords.find((record) => record.processId === processId);
    if (localRecord?.dbId) return { ...localRecord, processDbId: process.dbId };

    const { data: existingExecution } = await supabase
      .from('executions')
      .select('*')
      .eq('process_id', process.dbId)
      .maybeSingle();

    if (existingExecution?.id) {
      return { ...createDefaultExecutionRecord(processId), dbId: existingExecution.id, processDbId: process.dbId };
    }

    const { data: insertedExecution, error } = await supabase
      .from('executions')
      .insert({
        process_id: process.dbId,
        status: 'nao_iniciado',
        department: 'tecnico_escritorio',
        responsible: process.owner || 'Técnico escritório',
        started_at: new Date().toISOString(),
        expected_delivery_date: formatDateToDb(process.dueDate),
        progress: 0
      })
      .select('*')
      .single();

    if (error || !insertedExecution) return null;

    const nextRecord = { ...createDefaultExecutionRecord(processId), dbId: insertedExecution.id, processDbId: process.dbId };
    setExecutionRecords((current) => current.some((record) => record.processId === processId)
      ? current.map((record) => record.processId === processId ? { ...record, dbId: insertedExecution.id, processDbId: process.dbId } : record)
      : [nextRecord, ...current]);
    return nextRecord;
  }

  async function saveExecutionHistory(processId: string, item: ExecutionHistoryItem, executionRecord?: ExecutionRecord | null) {
    const process = processes.find((processItem) => processItem.id === processId);
    const execution = executionRecord ?? await ensureExecutionRecord(processId);
    if (!process?.dbId || !execution?.dbId) return;

    await supabase.from('execution_history').insert({
      execution_id: execution.dbId,
      process_id: process.dbId,
      action_date: formatDateToDb(item.date) ?? new Date().toISOString().split('T')[0],
      action: item.action,
      responsible: item.responsible || 'Sistema',
      observation: item.observation || null
    });
  }

  async function addOfficeAction(processId: string, action: OfficeAction) {
    const execution = await ensureExecutionRecord(processId);
    const process = processes.find((item) => item.id === processId);

    if (execution?.dbId && process?.dbId) {
      await supabase.from('execution_history').insert({
        execution_id: execution.dbId,
        process_id: process.dbId,
        action_date: formatDateToDb(action.date) ?? new Date().toISOString().split('T')[0],
        action: action.type || 'Ação técnica avulsa',
        responsible: action.responsible || 'Técnico escritório',
        observation: [action.agency, action.protocol, action.description, action.status].filter(Boolean).join(' - ')
      });
    }

    setExecutionRecords((current) => {
      const existing = current.find((record) => record.processId === processId);
      if (existing) {
        return current.map((record) => record.processId === processId ? { ...record, officeActions: [action, ...record.officeActions] } : record);
      }
      return [{ ...createDefaultExecutionRecord(processId), dbId: execution?.dbId, processDbId: process?.dbId, officeActions: [action] }, ...current];
    });
  }

  async function addFieldVisit(processId: string, visit: FieldVisit) {
    const execution = await ensureExecutionRecord(processId);
    const process = processes.find((item) => item.id === processId);
    let savedVisitId = visit.id;

    if (execution?.dbId && process?.dbId) {
      const { data: savedVisit } = await supabase
        .from('field_visits')
        .insert({
          execution_id: execution.dbId,
          process_id: process.dbId,
          visit_date: formatDateToDb(visit.date),
          responsible: visit.responsible || null,
          location: visit.location || null,
          coordinates: visit.coordinates || null,
          notes: visit.notes || null,
          checklist: visit.checklist || null,
          status: mapFieldVisitStatusToDb(visit.status)
        })
        .select('id')
        .single();
      savedVisitId = savedVisit?.id ?? savedVisitId;
    }

    const nextVisit = { ...visit, id: savedVisitId };
    setExecutionRecords((current) => {
      const existing = current.find((record) => record.processId === processId);
      if (existing) {
        return current.map((record) => record.processId === processId ? { ...record, fieldVisits: [nextVisit, ...record.fieldVisits] } : record);
      }
      return [{ ...createDefaultExecutionRecord(processId), dbId: execution?.dbId, processDbId: process?.dbId, fieldVisits: [nextVisit] }, ...current];
    });
  }

  async function updateExecutionTask(processId: string, task: ExecutionTask) {
    const execution = await ensureExecutionRecord(processId);
    const process = processes.find((item) => item.id === processId);
    const historyItem: ExecutionHistoryItem = {
      id: `HIST-${processId}-${Date.now()}`,
      date: task.updatedAt || new Date().toLocaleDateString('pt-BR'),
      action: `${task.title} alterado para "${task.status}"`,
      responsible: task.responsible || 'Técnico escritório',
      observation: task.observation || 'Etapa atualizada na central de execução.'
    };

    if (execution?.dbId && process?.dbId) {
      const payload = {
        execution_id: execution.dbId,
        process_id: process.dbId,
        task_key: task.id,
        title: task.title,
        status: mapExecutionTaskStatusToDb(task.status),
        responsible: task.responsible || null,
        updated_at: formatDateToDb(task.updatedAt),
        protocol: task.protocol || null,
        login: task.login || null,
        password_ref: task.password || null,
        observation: task.observation || null,
        attachments: task.attachments,
        suggested_documents: task.suggestedDocuments
      };
      const { data: existingTask } = await supabase
        .from('execution_tasks')
        .select('id')
        .eq('execution_id', execution.dbId)
        .eq('task_key', task.id)
        .maybeSingle();

      if (existingTask?.id) {
        await supabase.from('execution_tasks').update(payload).eq('id', existingTask.id);
      } else {
        await supabase.from('execution_tasks').insert(payload);
      }

      await saveExecutionHistory(processId, historyItem, execution);
    }

    setExecutionRecords((current) => {
      const baseRecord = current.find((record) => record.processId === processId) ?? { ...createDefaultExecutionRecord(processId), dbId: execution?.dbId, processDbId: process?.dbId };
      const currentTasks = baseRecord.tasks ?? createDefaultExecutionTasks();
      const updatedTasks = currentTasks.some((item) => item.id === task.id)
        ? currentTasks.map((item) => item.id === task.id ? task : item)
        : [...currentTasks, task];
      const updatedRecord = { ...baseRecord, tasks: updatedTasks, history: [historyItem, ...(baseRecord.history ?? [])] };
      return current.some((record) => record.processId === processId)
        ? current.map((record) => record.processId === processId ? updatedRecord : record)
        : [updatedRecord, ...current];
    });
    if (execution?.dbId && process?.dbId) {
      await refreshDashboard();
    }
  }

  async function addCustomExecutionTask(processId: string, task: ExecutionTask) {
    const execution = await ensureExecutionRecord(processId);
    const process = processes.find((item) => item.id === processId);
    const existingRecord = executionRecords.find((record) => record.processId === processId);
    const existingTasks = existingRecord?.tasks ?? createDefaultExecutionTasks();
    const hasDuplicate = existingTasks.some((item) => item.id === task.id || normalizeText(item.title) === normalizeText(task.title));

    if (hasDuplicate) {
      window.alert('Já existe uma etapa com esse nome neste processo.');
      return;
    }

    const historyItem: ExecutionHistoryItem = {
      id: `HIST-${processId}-${Date.now()}`,
      date: task.updatedAt,
      action: `Nova etapa criada: ${task.title}`,
      responsible: task.responsible || 'Técnico escritório',
      observation: 'Formulário personalizado adicionado à execução.'
    };

    if (execution?.dbId && process?.dbId) {
      const payload = {
        execution_id: execution.dbId,
        process_id: process.dbId,
        task_key: task.id,
        title: task.title,
        status: mapExecutionTaskStatusToDb(task.status),
        responsible: task.responsible || null,
        updated_at: formatDateToDb(task.updatedAt),
        protocol: task.protocol || null,
        login: task.login || null,
        password_ref: task.password || null,
        observation: task.observation || null,
        attachments: task.attachments,
        suggested_documents: task.suggestedDocuments
      };

      const { error } = await supabase.from('execution_tasks').insert(payload);
      if (error) {
        console.error('[Execução] Erro ao criar etapa personalizada no Supabase', {
          table: 'execution_tasks',
          processId,
          payload,
          error
        });
        window.alert(`Não foi possível criar a etapa no Supabase.\n\n${error.message}`);
        return;
      }

      await saveExecutionHistory(processId, historyItem, execution);
    }

    setExecutionRecords((current) => {
      const baseRecord = current.find((record) => record.processId === processId) ?? { ...createDefaultExecutionRecord(processId), dbId: execution?.dbId, processDbId: process?.dbId };
      const updatedRecord = {
        ...baseRecord,
        tasks: [...(baseRecord.tasks ?? createDefaultExecutionTasks()), task],
        history: [historyItem, ...(baseRecord.history ?? [])]
      };
      return current.some((record) => record.processId === processId)
        ? current.map((record) => record.processId === processId ? updatedRecord : record)
        : [updatedRecord, ...current];
    });
    if (execution?.dbId && process?.dbId) {
      await refreshDashboard();
    }
  }

  async function updateExecutionNotes(processId: string, notes: string) {
    const execution = await ensureExecutionRecord(processId);
    const process = processes.find((item) => item.id === processId);

    if (execution?.dbId && process?.dbId) {
      const { data: existingNote } = await supabase
        .from('execution_notes')
        .select('id')
        .eq('execution_id', execution.dbId)
        .maybeSingle();
      const payload = { execution_id: execution.dbId, process_id: process.dbId, notes };
      if (existingNote?.id) {
        await supabase.from('execution_notes').update(payload).eq('id', existingNote.id);
      } else {
        await supabase.from('execution_notes').insert(payload);
      }
    }

    setExecutionRecords((current) => {
      const baseRecord = current.find((record) => record.processId === processId) ?? { ...createDefaultExecutionRecord(processId), dbId: execution?.dbId, processDbId: process?.dbId };
      const updatedRecord = { ...baseRecord, internalNotes: notes };
      return current.some((record) => record.processId === processId)
        ? current.map((record) => record.processId === processId ? updatedRecord : record)
        : [updatedRecord, ...current];
    });
  }

  async function updateExecutionFieldChecklist(processId: string, item: FieldChecklistItem) {
    const execution = await ensureExecutionRecord(processId);
    const process = processes.find((processItem) => processItem.id === processId);

    if (execution?.dbId && process?.dbId) {
      const payload = {
        execution_id: execution.dbId,
        process_id: process.dbId,
        item_key: item.id,
        title: item.title,
        status: mapFieldChecklistStatusToDb(item.status),
        observation: item.observation || null,
        attachments: item.attachments
      };
      const { data: existingItem } = await supabase
        .from('field_checklist_items')
        .select('id')
        .eq('execution_id', execution.dbId)
        .eq('item_key', item.id)
        .maybeSingle();

      if (existingItem?.id) {
        await supabase.from('field_checklist_items').update(payload).eq('id', existingItem.id);
      } else {
        await supabase.from('field_checklist_items').insert(payload);
      }
    }

    setExecutionRecords((current) => {
      const baseRecord = current.find((record) => record.processId === processId) ?? { ...createDefaultExecutionRecord(processId), dbId: execution?.dbId, processDbId: process?.dbId };
      const checklist = baseRecord.fieldChecklist ?? defaultFieldChecklist;
      const updatedRecord = { ...baseRecord, fieldChecklist: checklist.map((currentItem) => currentItem.id === item.id ? item : currentItem) };
      return current.some((record) => record.processId === processId)
        ? current.map((record) => record.processId === processId ? updatedRecord : record)
        : [updatedRecord, ...current];
    });
  }

  async function updateFinancialRecord(recordId: string, updates: Partial<FinancialRecord>) {
    const updatedStatus = updates.financialStatus ?? 'Liberado para execução';
    const paymentDate = formatDateToDb(updates.paidAt ?? new Date().toLocaleDateString('pt-BR'));
    const relatedContract = contracts.find((contract) => contract.id === updates.contractId || contract.dbId === updates.contractDbId);
    const relatedProposal = proposals.find((proposal) => proposal.id === updates.proposalId || proposal.dbId === updates.proposalDbId || proposal.id === relatedContract?.proposalId);
    const relatedProcess = processes.find((process) =>
      process.id === updates.processId ||
      process.dbId === updates.processDbId ||
      process.id === relatedContract?.processId
    );
    const relationIds = {
      contract_id: updates.contractDbId ?? relatedContract?.dbId,
      proposal_id: updates.proposalDbId ?? relatedProposal?.dbId ?? relatedContract?.proposalDbId,
      process_id: updates.processDbId ?? relatedProcess?.dbId ?? relatedContract?.processDbId,
      client_id: updates.clientDbId ?? relatedProcess?.clientId ?? relatedContract?.clientDbId
    };
    const financialPayload = {
      status: updatedStatus === 'Liberado para execução' ? 'entrada_confirmada' : mapFinancialStatusToDb(updatedStatus),
      received_amount: updates.receivedAmount ?? 0,
      payment_date: paymentDate,
      payment_method: mapFinancialPaymentMethodToDb(updates.paymentMethod),
      payment_notes: updates.notes || null,
      released_for_execution: true,
      released_at: new Date().toISOString()
    };
    const hasPersistedFinancialRecord = isUuid(recordId);

    console.info('[Financeiro] Confirmar pagamento - dados enviados', {
      table: 'financial_records',
      operation: hasPersistedFinancialRecord ? 'update' : 'insert',
      recordId,
      payload: financialPayload,
      relationIds
    });

    const { data: savedRecord, error } = hasPersistedFinancialRecord
      ? await supabase
        .from('financial_records')
        .update(financialPayload)
        .eq('id', recordId)
        .select('*')
        .single()
      : await supabase
        .from('financial_records')
        .insert({
          ...financialPayload,
          contract_id: relationIds.contract_id ?? null,
          proposal_id: relationIds.proposal_id ?? null,
          process_id: relationIds.process_id ?? null,
          client_id: relationIds.client_id ?? null,
          client_name: updates.client ?? '',
          service_description: updates.service ?? '',
          total_value: updates.amount ?? 0,
          entry_percentage: updates.entryPercentage ?? 0,
          entry_value: updates.entryAmount ?? updates.receivedAmount ?? 0,
          remaining_value: updates.remainingAmount ?? 0,
          expected_payment_date: formatDateToDb(updates.dueDate ?? '')
        })
        .select('*')
        .single();

    console.info('[Financeiro] Confirmar pagamento - resposta Supabase', {
      table: 'financial_records',
      data: savedRecord,
      error
    });

    if (error) {
      console.error('[Financeiro] Erro ao confirmar pagamento no Supabase', {
        table: 'financial_records',
        recordId,
        operation: hasPersistedFinancialRecord ? 'update' : 'insert',
        payload: financialPayload,
        relationIds,
        error
      });
      window.alert(`Não foi possível confirmar o pagamento no Supabase.\n\n${error.message}`);
      return;
    }

    const nextRecord = savedRecord
      ? {
          ...mapDbFinancialRecordToFinancialRecord(savedRecord as DbFinancialRecord),
          contractId: updates.contractId ?? relatedContract?.id ?? mapDbFinancialRecordToFinancialRecord(savedRecord as DbFinancialRecord).contractId,
          proposalId: updates.proposalId ?? relatedProposal?.id ?? mapDbFinancialRecordToFinancialRecord(savedRecord as DbFinancialRecord).proposalId,
          processId: updates.processId ?? relatedProcess?.id ?? mapDbFinancialRecordToFinancialRecord(savedRecord as DbFinancialRecord).processId,
          contractDbId: relationIds.contract_id,
          proposalDbId: relationIds.proposal_id,
          processDbId: relationIds.process_id,
          clientDbId: relationIds.client_id
        }
      : ({ ...(updates as FinancialRecord), id: recordId });

    const processDbId = isUuid(nextRecord.processDbId) ? nextRecord.processDbId : relatedProcess?.dbId;

    if (processDbId) {
      const processUpdatePayload = {
        current_stage: 'Etapa 06 - Execução dos serviços',
        responsible: 'Técnico escritório'
      };
      console.info('[Financeiro] Atualizando processo após pagamento', {
        table: 'processes',
        process_id: processDbId,
        payload: processUpdatePayload
      });
      const { error: processUpdateError } = await supabase
        .from('processes')
        .update(processUpdatePayload)
        .eq('id', processDbId);

      console.info('[Financeiro] Resposta atualização do processo', {
        table: 'processes',
        error: processUpdateError
      });
    }

    setFinancialRecords((current) => {
      const exists = current.some((record) => record.id === recordId);
      if (exists) return current.map((record) => record.id === recordId ? nextRecord : record);
      return [nextRecord, ...current];
    });
    await refreshDashboard();
  }

  if (currentPath !== '/login') {
    return <LandingPage />;
  }

  if (authLoading) {
    return (
      <main className="login-page">
        <div className="login-bg-glow login-bg-glow-one" />
        <div className="login-bg-glow login-bg-glow-two" />
        <div className="login-leaf login-leaf-left" />
        <div className="login-leaf login-leaf-right" />
        <section className="login-shell login-loading-shell">
          <img className="login-main-logo" src="/assets/logo-login.png" alt="Anjos Soluções Ambientais" />
          <div className="login-card login-loading-card">
            <div className="login-card-icon logo-icon-frame">
              <img src="/assets/logo-icon.png" alt="Anjos Ambiental" />
            </div>
            <p className="eyebrow">Anjos Ambiental</p>
            <h2>Carregando acesso</h2>
            <p className="login-card-copy">Verificando sessão segura do sistema.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <><LoginView form={loginForm} error={loginError} isSubmitting={loginSubmitting} onFieldChange={updateLoginField} onSubmit={handleLogin} /><WhatsAppFloatingButton /></>;
  }

  return (
    <div className="app-shell">
      <aside className={menuOpen ? 'sidebar sidebar-open' : 'sidebar'}>
        <div className="brand">
          <img className="sidebar-brand-logo" src="/assets/logo-login.png" alt="Anjos Soluções Ambientais" />
        </div>

        <nav className="nav-list" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className={activeView === item.label ? 'nav-item active' : 'nav-item'} key={item.label} type="button" onClick={() => selectView(item.label)}>
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-only" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir menu">
            <Menu size={22} />
          </button>
          <div className="search-box">
            <Search size={18} />
            <input placeholder="Buscar cliente, processo, CPF, proposta ou protocolo" />
          </div>
          <button className="logout-button" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            Sair
          </button>
        </header>

        {activeView === 'Dashboard' ? (
          <DashboardView state={dashboardState} cards={dashboardCards} />
        ) : activeView === 'Usuários' ? (
          <UsersView
            users={users}
            form={userForm}
            isFormOpen={isUserFormOpen}
            onOpenForm={() => setIsUserFormOpen(true)}
            onCloseForm={() => setIsUserFormOpen(false)}
            onFieldChange={updateUserField}
            onSubmit={handleUserSubmit}
          />
        ) : activeView === 'Clientes' ? (
          <ClientsView
            clients={filteredClients}
            totalClients={clients.length}
            search={clientSearch}
            form={clientForm}
            isFormOpen={isClientFormOpen}
            documents={documents}
            onSearchChange={setClientSearch}
            onOpenForm={() => setIsClientFormOpen(true)}
            onCloseForm={() => setIsClientFormOpen(false)}
            onFieldChange={updateClientField}
            onSubmit={handleClientSubmit}
            onAttachDocuments={attachClientDocuments}
            onDeleteDocument={deleteDocument}
            onUpdateClient={updateClient}
          />
        ) : activeView === 'Processos' ? (
          <ProcessesView
            processes={processes}
            documents={documents}
            selectedProcessId={selectedProcessId}
            onSelectProcess={setSelectedProcessId}
            onCloseProcess={() => setSelectedProcessId(null)}
            onSaveAnalysis={updateProcessAnalysis}
            onAttachDocuments={attachProcessDocuments}
            onDeleteDocument={deleteDocument}
          />
        ) : activeView === 'Propostas' ? (
          <ProposalsView
            processes={processes}
            proposals={proposals}
            selectedProcessId={selectedProposalProcessId}
            form={proposalForm}
            onOpenProposal={openProposalForm}
            onCloseProposal={closeProposalForm}
            onFieldChange={updateProposalField}
            onSubmit={handleProposalSubmit}
            onApproveProposal={approveProposal}
          />
        ) : activeView === 'Acompanhamento' ? (
          <OperationalFollowUpView
            clients={clients}
            processes={processes}
            proposals={proposals}
            contracts={contracts}
            financialRecords={financialRecords}
            executionRecords={executionRecords}
            services={serviceTrackings}
            documents={documents}
          />
        ) : activeView === 'Execução' ? (
          <ExecutionView
            clients={clients}
            processes={processes}
            contracts={contracts}
            financialRecords={financialRecords}
            records={executionRecords}
            documents={documents}
            selectedProcessId={selectedExecutionProcessId}
            onSelectProcess={setSelectedExecutionProcessId}
            onClose={() => setSelectedExecutionProcessId(null)}
            onAddOfficeAction={addOfficeAction}
            onAddFieldVisit={addFieldVisit}
            onAddCustomTask={addCustomExecutionTask}
            onUpdateTask={updateExecutionTask}
            onUpdateNotes={updateExecutionNotes}
            onUpdateFieldChecklist={updateExecutionFieldChecklist}
            onAttachDocuments={attachProcessDocuments}
            onDeleteDocument={deleteDocument}
          />
        ) : activeView === 'Financeiro' ? (
          <FinancialView records={financialRecords} contracts={contracts} proposals={proposals} onUpdateRecord={updateFinancialRecord} />
        ) : activeView === 'Contratos' ? (
          <ContractsView
            proposals={proposals}
            contracts={contracts}
            selectedProposalId={selectedContractProposalId}
            selectedContractId={selectedContractId}
            onSelectProposal={setSelectedContractProposalId}
            onSelectContract={setSelectedContractId}
            onClose={() => {
              setSelectedContractProposalId(null);
              setSelectedContractId(null);
            }}
            onSave={saveContract}
            onActivateContract={activateContract}
          />
        ) : null}
      </main>
      <WhatsAppFloatingButton />
    </div>
  );
}

const institutionalServices = [
  {
    title: 'Licenciamento Ambiental',
    description: 'Condução técnica para viabilizar atividades com segurança jurídica e ambiental.'
  },
  {
    title: 'Cadastro Ambiental Rural (CAR)',
    description: 'Regularização e organização das informações ambientais do imóvel rural.'
  },
  {
    title: 'Outorga de Uso da Água',
    description: 'Apoio técnico para autorizações de uso hídrico junto aos órgãos competentes.'
  },
  {
    title: 'PRAD',
    description: 'Planejamento de recuperação de áreas degradadas com critérios ambientais.'
  },
  {
    title: 'Georreferenciamento',
    description: 'Levantamentos e dados territoriais para apoiar decisões e protocolos.'
  },
  {
    title: 'Gestão Documental Ambiental',
    description: 'Documentos, prazos e protocolos organizados para reduzir riscos operacionais.'
  },
  {
    title: 'Relatórios Técnicos',
    description: 'Peças técnicas claras para licenciamento, regularização e acompanhamento.'
  },
  {
    title: 'Acompanhamento de Processos',
    description: 'Monitoramento de etapas e exigências até a conclusão dos procedimentos.'
  }
];

type LandingService = (typeof institutionalServices)[number];

const fallingLeaves = [
  { start: '6vw', drift: '26px', final: '-34px', size: '9px', scale: '0.86', duration: '18s', delay: '-3s', opacity: '0.42', color: 'rgba(48, 193, 117, 0.62)' },
  { start: '13vw', drift: '-18px', final: '44px', size: '12px', scale: '0.92', duration: '22s', delay: '-11s', opacity: '0.5', color: 'rgba(4, 135, 57, 0.58)' },
  { start: '21vw', drift: '42px', final: '8px', size: '8px', scale: '0.78', duration: '16s', delay: '-7s', opacity: '0.38', color: 'rgba(48, 193, 117, 0.48)' },
  { start: '29vw', drift: '-34px', final: '-70px', size: '14px', scale: '0.88', duration: '24s', delay: '-15s', opacity: '0.44', color: 'rgba(4, 135, 57, 0.52)' },
  { start: '37vw', drift: '18px', final: '58px', size: '10px', scale: '1', duration: '19s', delay: '-5s', opacity: '0.48', color: 'rgba(48, 193, 117, 0.58)' },
  { start: '45vw', drift: '-46px', final: '-10px', size: '11px', scale: '0.82', duration: '21s', delay: '-13s', opacity: '0.36', color: 'rgba(4, 135, 57, 0.48)' },
  { start: '53vw', drift: '52px', final: '82px', size: '13px', scale: '0.96', duration: '25s', delay: '-20s', opacity: '0.45', color: 'rgba(48, 193, 117, 0.54)' },
  { start: '61vw', drift: '-22px', final: '-54px', size: '7px', scale: '0.74', duration: '17s', delay: '-9s', opacity: '0.32', color: 'rgba(48, 193, 117, 0.45)' },
  { start: '68vw', drift: '34px', final: '18px', size: '15px', scale: '0.9', duration: '23s', delay: '-16s', opacity: '0.4', color: 'rgba(4, 135, 57, 0.55)' },
  { start: '74vw', drift: '-58px', final: '-26px', size: '10px', scale: '0.84', duration: '20s', delay: '-2s', opacity: '0.36', color: 'rgba(48, 193, 117, 0.5)' },
  { start: '80vw', drift: '24px', final: '66px', size: '12px', scale: '0.98', duration: '26s', delay: '-18s', opacity: '0.46', color: 'rgba(4, 135, 57, 0.5)' },
  { start: '87vw', drift: '-30px', final: '-74px', size: '9px', scale: '0.8', duration: '18s', delay: '-12s', opacity: '0.34', color: 'rgba(48, 193, 117, 0.44)' },
  { start: '92vw', drift: '20px', final: '-16px', size: '11px', scale: '0.9', duration: '22s', delay: '-6s', opacity: '0.38', color: 'rgba(4, 135, 57, 0.46)' },
  { start: '96vw', drift: '-42px', final: '-88px', size: '8px', scale: '0.72', duration: '19s', delay: '-14s', opacity: '0.3', color: 'rgba(48, 193, 117, 0.4)' }
];

function AnimatedServiceCard({ service }: { service: LandingService }) {
  return (
    <article className="landing-service-card landing-reveal">
      <span className="landing-service-icon"><FileText size={22} /></span>
      <div>
        <strong>{service.title}</strong>
        <p>{service.description}</p>
      </div>
    </article>
  );
}

function ForestFallingLeaves() {
  return (
    <div className="falling-leaves" aria-hidden="true">
      {fallingLeaves.map((leaf, index) => (
        <span
          className="leaf"
          key={`${leaf.start}-${index}`}
          style={{
            '--start-x': leaf.start,
            '--drift-x': leaf.drift,
            '--drift-x-final': leaf.final,
            '--size': leaf.size,
            '--scale': leaf.scale,
            '--duration': leaf.duration,
            '--delay': leaf.delay,
            '--opacity': leaf.opacity,
            '--leaf-color': leaf.color
          } as Record<string, string>}
        />
      ))}
    </div>
  );
}

function WhatsAppFloatingButton() {
  return (
    <a className="whatsapp-floating-button" href="https://wa.me/5563992036652" target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">
      <MessageCircle size={24} />
    </a>
  );
}

function LandingPage() {
  const landingRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = landingRef.current;
    if (!root) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.9
    });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const anchorLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    const handleAnchorClick = (event: Event) => {
      const target = event.currentTarget as HTMLAnchorElement;
      const href = target.getAttribute('href');
      if (!href || href === '#') return;
      event.preventDefault();
      lenis.scrollTo(href, { offset: -110 });
    };
    anchorLinks.forEach((link) => link.addEventListener('click', handleAnchorClick));

    const ctx = gsap.context(() => {
      gsap.from('.landing-hero-content > *', {
        y: 28,
        opacity: 0,
        duration: 0.86,
        stagger: 0.12,
        ease: 'power3.out'
      });
      gsap.from('.landing-hero-panel div', {
        y: 24,
        opacity: 0,
        duration: 0.78,
        delay: 0.35,
        stagger: 0.11,
        ease: 'power3.out'
      });
      gsap.utils.toArray<HTMLElement>('.landing-reveal').forEach((element) => {
        gsap.from(element, {
          scrollTrigger: {
            trigger: element,
            start: 'top 84%'
          },
          y: 34,
          opacity: 0,
          duration: 0.78,
          ease: 'power2.out'
        });
      });
    }, root);

    return () => {
      ctx.revert();
      anchorLinks.forEach((link) => link.removeEventListener('click', handleAnchorClick));
      cancelAnimationFrame(rafId);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <main className="landing-page" ref={landingRef}>
      <nav className="landing-nav" aria-label="Navegação institucional">
        <a className="landing-logo-link" href="/" aria-label="Anjos Ambiental">
          <img src="/assets/Logotipo-Anjos-sem-tag-V3.png" alt="Anjos Soluções Ambientais" />
        </a>
        <div>
          <a href="#quem-somos">Quem Somos</a>
          <a href="#servicos">Serviços</a>
          <a href="#contato">Contato</a>
          <a className="landing-nav-login" href="/login">Acessar Sistema</a>
        </div>
      </nav>

      <section className="landing-hero hero-image-1">
        <ForestFallingLeaves />
        <div className="landing-hero-content">
          <p className="landing-eyebrow">Tecnologia ambiental e regularização</p>
          <h1>Regularização Ambiental com Segurança e Agilidade</h1>
          <p>Licenciamentos, CAR, Outorgas, PRAD, Georreferenciamento e Gestão Ambiental para propriedades rurais e empresas.</p>
          <div className="landing-actions">
            <a className="landing-primary-button" href="https://wa.me/5563992036652" target="_blank" rel="noreferrer">Solicitar Atendimento</a>
            <a className="landing-secondary-button" href="/login">Acessar Sistema</a>
          </div>
        </div>
        <div className="landing-hero-panel" aria-hidden="true">
          <div>
            <span>Licenciamento</span>
            <strong>Processos conduzidos com método técnico</strong>
          </div>
          <div>
            <span>Gestão</span>
            <strong>Documentos, etapas e protocolos organizados</strong>
          </div>
          <div>
            <span>Campo</span>
            <strong>Atuação ambiental para imóveis e empresas</strong>
          </div>
        </div>
      </section>
      <section className="forest-panel forest-image-2" aria-label="Paisagem ambiental em sequência">
        <ForestFallingLeaves />
      </section>

      <section className="landing-section landing-about landing-reveal" id="quem-somos">
        <div className="landing-about-media" aria-hidden="true">
          <img src="/assets/Capa Reels.png" alt="" />
        </div>
        <div className="landing-about-copy">
          <p className="landing-eyebrow">Quem Somos</p>
          <h2>Quem Somos</h2>
          <p>A Anjos Ambiental é especializada em consultoria e gestão ambiental, auxiliando produtores rurais, empresas e empreendedores na regularização de seus projetos e no cumprimento das exigências ambientais.</p>
          <p>Nossa missão é conduzir cada processo com transparência, agilidade e compromisso ambiental, reduzindo riscos e trazendo clareza para decisões importantes.</p>
          <div className="landing-about-highlights">
            <span>Organização</span>
            <span>Transparência</span>
            <span>Agilidade</span>
            <span>Acompanhamento técnico</span>
          </div>
        </div>
      </section>

      <section className="landing-section landing-reveal" id="servicos">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">Serviços</p>
          <h2>Soluções ambientais para cada etapa do processo</h2>
        </div>
        <div className="landing-services-grid">
          {institutionalServices.map((service) => <AnimatedServiceCard service={service} key={service.title} />)}
        </div>
      </section>

      <section className="landing-section landing-contact landing-reveal" id="contato">
        <div>
          <p className="landing-eyebrow">Contato</p>
          <h2>Fale com a Anjos Ambiental</h2>
          <p>Precisa regularizar sua propriedade, empresa ou empreendimento? Nossa equipe pode orientar você.</p>
          <strong>WhatsApp: (63) 99203-6652</strong>
        </div>
        <a className="landing-primary-button" href="https://wa.me/5563992036652" target="_blank" rel="noreferrer">
          <MessageCircle size={19} /> Falar no WhatsApp
        </a>
      </section>

      <footer className="landing-footer">
        <img src="/assets/Logotipo-Anjos-sem-tag-V3.png" alt="Anjos Soluções Ambientais" />
        <div>
          <strong>Anjos Ambiental</strong>
          <span>Soluções Ambientais e Gestão de Processos</span>
          <span>WhatsApp: (63) 99203-6652</span>
          <small>© Todos os direitos reservados.</small>
        </div>
      </footer>
      <WhatsAppFloatingButton />
    </main>
  );
}

function LoginView({
  form,
  error,
  isSubmitting,
  onFieldChange,
  onSubmit
}: {
  form: LoginFormState;
  error: string;
  isSubmitting: boolean;
  onFieldChange: <K extends keyof LoginFormState>(field: K, value: LoginFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="login-page">
      <div className="login-bg-glow login-bg-glow-one" />
      <div className="login-bg-glow login-bg-glow-two" />
      <div className="login-leaf login-leaf-left" />
      <div className="login-leaf login-leaf-right" />
      <div className="login-leaf login-leaf-bottom" />
      <div className="login-particles" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <section className="login-shell" aria-label="Acesso ao sistema Anjos Ambiental">
        <div className="login-identity">
          <img className="login-main-logo" src="/assets/logo-login.png" alt="Anjos Soluções Ambientais" />
          <p className="login-tagline">
            Tecnologia e gestão ambiental para um <span>futuro sustentável.</span>
          </p>
        </div>

        <form className="login-card" onSubmit={onSubmit} aria-label="Formulário de login">
          <div className="login-card-heading">
            <div className="login-card-icon logo-icon-frame">
              <img src="/assets/logo-icon.png" alt="" />
            </div>
            <div>
              <h1>Acesse sua conta</h1>
              <p>Informe seu e-mail e senha para entrar.</p>
            </div>
          </div>

          <label className="login-field">
            E-mail
            <div className="login-input-shell">
              <Mail size={21} />
              <input
                type="email"
                value={form.email}
                onChange={(event) => onFieldChange('email', event.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="login-field">
            Senha
            <div className="login-input-shell">
              <Lock size={21} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => onFieldChange('password', event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
              </button>
            </div>
          </label>

          <div className="login-options">
            <label className="remember-access">
              <input type="checkbox" defaultChecked />
              <span>Lembrar meu acesso</span>
            </label>
            <button type="button" className="forgot-password">Esqueci minha senha</button>
          </div>

          {error ? <div className="login-error">{error}</div> : null}

          <button className="login-submit" type="submit" disabled={isSubmitting}>
            <span>{isSubmitting ? 'Entrando...' : 'Entrar no sistema'}</span>
            <ArrowRight size={23} />
          </button>
        </form>

        <div className="login-trust">
          <ShieldCheck size={19} />
          <span>Sistema seguro e confiável</span>
        </div>
      </section>
    </main>
  );
}

function DashboardView({
  state,
  cards
}: {
  state: DashboardState;
  cards: Array<{ label: string; value: number; display: string; icon: LucideIcon; tone: string }>;
}) {
  const dashboard = state.data;
  const revenueValue = dashboard?.summary.monthlyRevenue && dashboard.summary.monthlyRevenue > 0
    ? dashboard.summary.monthlyRevenue
    : dashboard?.summary.contractedValue ?? 0;
  const revenueLabel = dashboard?.summary.monthlyRevenue && dashboard.summary.monthlyRevenue > 0 ? 'Receita recebida' : 'Valor contratado';
  const hasRevenue = revenueValue > 0;
  const hasStageData = Boolean(dashboard?.stageData.length);
  const hasStatusData = Boolean(dashboard?.statusData.length);
  const hasMonthlyRevenueData = Boolean(dashboard?.monthlyRevenueData.length);
  const hasHealthData = Boolean(dashboard?.healthData.length);
  const attentionTotal = dashboard?.healthData.reduce((total, item) => item.label === 'Em dia' ? total : total + item.value, 0) ?? 0;

  return (
    <section className="module-view dashboard-view w-full">
      <div className="module-header">
        <div>
          <p className="eyebrow">Painel executivo</p>
          <h1>Dashboard</h1>
          <p>Indicadores reais do Supabase para acompanhar operação, gargalos e desempenho geral da Anjos Ambiental.</p>
        </div>
        {dashboard?.lastUpdated ? <span className="dashboard-updated">Dados sincronizados</span> : null}
      </div>

      <AnimatePresence mode="wait">
        {state.status === 'loading' ? (
          <motion.div className="dashboard-state-panel dashboard-loading-panel" key="loading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="dashboard-loader" />
            <strong>Carregando dados reais</strong>
            <span>Buscando processos, propostas, contratos e financeiro no Supabase.</span>
          </motion.div>
        ) : state.status === 'error' ? (
          <motion.div className="dashboard-state-panel dashboard-error-panel" key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AlertCircle size={24} />
            <strong>Não foi possível carregar o dashboard</strong>
            <span>{state.error}</span>
          </motion.div>
        ) : state.status === 'empty' ? (
          <motion.div className="dashboard-state-panel" key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <FolderKanban size={24} />
            <strong>Nenhum dado encontrado</strong>
            <span>Quando houver registros no Supabase, os indicadores aparecem automaticamente aqui.</span>
          </motion.div>
        ) : (
          <motion.div className="dashboard-success-stack grid gap-[18px]" key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {cards.length > 0 ? (
              <section className="metrics-grid" aria-label="Resumo operacional">
                {cards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <motion.article
                      className={'metric-card ' + card.tone}
                      key={card.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={{ y: -3 }}
                    >
                      <div className="metric-icon"><Icon size={20} /></div>
                      <span>{card.label}</span>
                      <strong>{card.display}</strong>
                    </motion.article>
                  );
                })}
              </section>
            ) : null}

            <section className="dashboard-analytics-grid">
              {hasRevenue ? (
                <motion.article className="panel revenue-panel" whileHover={{ y: -2 }}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Resultado financeiro</p>
                      <h2>{revenueLabel}</h2>
                    </div>
                  </div>
                  <div className="revenue-value">{formatCurrency(revenueValue)}</div>
                  <div className="revenue-track"><motion.span initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8, ease: 'easeOut' }} /></div>
                  <div className="revenue-footer">
                    <span>Origem</span>
                    <strong>{dashboard?.summary.monthlyRevenue ? 'Registros financeiros' : 'Contratos'}</strong>
                  </div>
                </motion.article>
              ) : null}

              {hasMonthlyRevenueData ? (
                <motion.article className="panel dashboard-chart-panel dashboard-wide-panel" whileHover={{ y: -2 }}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Faturamento</p>
                      <h2>Evolução mensal</h2>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={dashboard?.monthlyRevenueData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#72b043" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="#72b043" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e5eddf" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#627063', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Faturamento']} />
                      <Area type="monotone" dataKey="value" stroke="#2f6b3a" strokeWidth={3} fill="url(#revenueGradient)" animationDuration={800} />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.article>
              ) : null}

              {hasStatusData ? (
                <motion.article className="panel dashboard-chart-panel" whileHover={{ y: -2 }}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Processos</p>
                      <h2>Processos por status</h2>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dashboard?.statusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fill: '#627063', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis hide allowDecimals={false} />
                      <Tooltip cursor={{ fill: 'rgba(114, 176, 67, 0.08)' }} formatter={(value) => [value, 'Processos']} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={800}>
                        {dashboard?.statusData.map((entry) => <Cell key={entry.label} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.article>
              ) : null}

              {hasStageData ? (
                <motion.article className="panel dashboard-chart-panel" whileHover={{ y: -2 }}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Funil operacional</p>
                      <h2>Volume por etapa</h2>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dashboard?.stageData} layout="vertical" margin={{ top: 4, right: 20, left: 12, bottom: 4 }}>
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis type="category" dataKey="label" width={116} tick={{ fill: '#627063', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(114, 176, 67, 0.08)' }} formatter={(value) => [value, 'Registros']} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={800}>
                        {dashboard?.stageData.map((entry) => <Cell key={entry.label} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.article>
              ) : null}

              {hasHealthData ? (
                <motion.article className="panel dashboard-chart-panel" whileHover={{ y: -2 }}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Saúde da operação</p>
                      <h2>Pendências e atrasos</h2>
                    </div>
                  </div>
                  <div className="dashboard-pie-wrap">
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie data={dashboard?.healthData} dataKey="value" nameKey="label" innerRadius={58} outerRadius={84} paddingAngle={3} animationDuration={800}>
                          {dashboard?.healthData.map((entry) => <Cell key={entry.label} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Registros']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="dashboard-pie-center"><strong>{attentionTotal}</strong><span>atenção</span></div>
                  </div>
                  <div className="chart-legend">
                    {dashboard?.healthData.map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}: {item.value}</span>)}
                  </div>
                </motion.article>
              ) : null}
            </section>

            {dashboard?.recentActivities.length ? (
              <section className="panel dashboard-activity-panel">
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">Movimentação</p>
                    <h2>Últimas movimentações</h2>
                  </div>
                </div>
                <div className="dashboard-activity-list">
                  {dashboard.recentActivities.map((activity) => (
                    <div className="dashboard-activity-row" key={`${activity.id}-${activity.title}`}>
                      <div>
                        <strong>{activity.title}</strong>
                        <span>{activity.meta}</span>
                      </div>
                      <small>{activity.status}{activity.date ? ` • ${activity.date}` : ''}</small>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function UsersView({
  users,
  form,
  isFormOpen,
  onOpenForm,
  onCloseForm,
  onFieldChange,
  onSubmit
}: {
  users: SystemUser[];
  form: UserFormState;
  isFormOpen: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onFieldChange: <K extends keyof UserFormState>(field: K, value: UserFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, documents?: DocumentAttachmentMap) => void | Promise<void>;
}) {
  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Acesso ao sistema</p>
          <h1>Usuários</h1>
          <p>Cadastre novos usuários e defina o perfil de acesso de cada área da operação.</p>
        </div>
        <button type="button" className="primary-button dark" onClick={onOpenForm}>
          <UserPlus size={18} /> Novo usuário
        </button>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Total de usuários</span><strong>{users.length}</strong></article>
        <article className="mini-stat"><span>Usuários ativos</span><strong>{users.filter((user) => user.status === 'Ativo').length}</strong></article>
        <article className="mini-stat"><span>Perfis cadastrados</span><strong>{new Set(users.map((user) => user.role)).size}</strong></article>
      </div>

      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Permissões</p>
            <h2>Equipe com acesso</h2>
          </div>
        </div>
        <div className="user-list">
          {users.map((user) => (
            <div className="user-card" key={user.id}>
              <div className="avatar-mark">{user.name.slice(0, 1)}</div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <span className="status-chip">{user.role}</span>
              <div>
                <strong>{user.status}</strong>
                <span>{user.lastAccess}</span>
              </div>
            </div>
          ))}
        </div>
      </article>

      {isFormOpen ? (
        <div className="modal-backdrop">
          <form className="panel modal-card user-modal" onSubmit={onSubmit}>
            <div className="form-heading">
              <div>
                <p className="eyebrow">Novo acesso</p>
                <h2>Cadastrar usuário</h2>
              </div>
              <button type="button" className="icon-button" onClick={onCloseForm} aria-label="Fechar cadastro de usuário"><X size={18} /></button>
            </div>
            <div className="form-grid">
              <label>Nome completo<input value={form.name} onChange={(event) => onFieldChange('name', event.target.value)} placeholder="Nome do usuário" /></label>
              <label>E-mail<input type="email" value={form.email} onChange={(event) => onFieldChange('email', event.target.value)} placeholder="usuario@email.com" /></label>
              <label>Senha<input type="password" value={form.password} onChange={(event) => onFieldChange('password', event.target.value)} placeholder="Senha de acesso" /></label>
              <label>Perfil de acesso
                <select value={form.role} onChange={(event) => onFieldChange('role', event.target.value as SystemUser['role'])}>
                  <option>Admin</option>
                  <option>Comercial</option>
                  <option>Técnico</option>
                  <option>Financeiro</option>
                  <option>Jurídico</option>
                </select>
              </label>
            </div>
            <div className="analysis-footer">
              <div>
                <strong>Usuário criado diretamente</strong>
                <span>O usuário já poderá acessar o sistema com o e-mail e senha cadastrados.</span>
              </div>
              <button className="primary-button dark" type="submit" disabled={!form.name.trim() || !form.email.trim() || !form.password.trim()}>Salvar usuário</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function ClientsView({
  clients,
  totalClients,
  search,
  form,
  isFormOpen,
  documents,
  onSearchChange,
  onOpenForm,
  onCloseForm,
  onFieldChange,
  onSubmit,
  onAttachDocuments,
  onDeleteDocument,
  onUpdateClient
}: {
  clients: Client[];
  totalClients: number;
  search: string;
  form: ClientFormState;
  isFormOpen: boolean;
  documents: DocumentRecord[];
  onSearchChange: (value: string) => void;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onFieldChange: <K extends keyof ClientFormState>(field: K, value: ClientFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, documents?: DocumentAttachmentMap) => void;
  onAttachDocuments: (client: Client, fileItems: DocumentUploadItem[], category: string) => void | Promise<void>;
  onDeleteDocument: (documentId: string) => void;
  onUpdateClient: (clientId: string, updates: ClientFormState) => void | Promise<void>;
}) {
  const [selectedDocumentClient, setSelectedDocumentClient] = useState<Client | null>(null);
  const [selectedEditClient, setSelectedEditClient] = useState<Client | null>(null);
  const activeClients = clients.filter((client) => client.status !== 'Inativo').length;
  const pendingDocs = clients.reduce((total, client) => total + client.pendingDocuments, 0);

  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Etapa 01 - Cadastro</p>
          <h1>Clientes</h1>
          <p>Cadastre o cliente, registre a demanda inicial e organize os documentos que vão abrir o processo ambiental.</p>
        </div>
        <button type="button" className="primary-button dark" onClick={onOpenForm}>
          <UserPlus size={18} /> Novo cliente
        </button>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Total de clientes</span><strong>{totalClients}</strong></article>
        <article className="mini-stat"><span>Clientes ativos</span><strong>{activeClients}</strong></article>
        <article className="mini-stat"><span>Documentos pendentes</span><strong>{pendingDocs}</strong></article>
      </div>

      <div className="client-toolbar">
        <div className="search-box compact-search">
          <Search size={18} />
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por nome, CPF/CNPJ, telefone, e-mail ou cidade" />
        </div>
      </div>

      {isFormOpen ? (
        <div className="modal-backdrop">
          <ClientForm form={form} onFieldChange={onFieldChange} onSubmit={onSubmit} onClose={onCloseForm} />
        </div>
      ) : null}

      <div className="client-layout-grid single-column">
        <article className="panel client-list-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Carteira comercial</p>
              <h2>Clientes cadastrados</h2>
            </div>
          </div>
          <div className="client-list">
            {clients.map((client) => (
              <div className="client-card" key={client.id}>
                <div className="client-main">
                  <div className="avatar-mark">{client.name.slice(0, 1)}</div>
                  <div>
                    <strong>{client.name}</strong>
                    <span>{client.type} - {client.document}</span>
                  </div>
                </div>
                <div className="client-contact">
                  <span>{client.phone}</span>
                  <span>{client.email}</span>
                  <span>{client.city}/{client.state}</span>
                </div>
                <div className="client-summary-row">
                  <span className="status-chip">{client.status}</span>
                  <small>{client.properties} propriedade(s)</small>
                  <small>{client.processes} processo(s)</small>
                  <small>{client.pendingDocuments} doc. pendente(s)</small>
                </div>
                <p>{client.demand}</p>
                <div className="client-card-actions">
                  <button className="icon-action-button" type="button" onClick={() => setSelectedEditClient(client)} aria-label={`Editar ${client.name}`}>
                    <Pencil size={17} />
                  </button>
                  <button className="secondary-light-button" type="button" onClick={() => setSelectedDocumentClient(client)}>
                    <UploadCloud size={17} /> Anexar mais documentos
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

      </div>

      {selectedDocumentClient ? (
        <div className="modal-backdrop">
          <ClientDocumentsModal
            client={selectedDocumentClient}
            documents={documents.filter((document) => document.client === selectedDocumentClient.name)}
            onClose={() => setSelectedDocumentClient(null)}
            onAttach={(fileItems, category) => onAttachDocuments(selectedDocumentClient, fileItems, category)}
            onDeleteDocument={onDeleteDocument}
          />
        </div>
      ) : null}

      {selectedEditClient ? (
        <div className="modal-backdrop">
          <ClientEditModal
            client={selectedEditClient}
            onClose={() => setSelectedEditClient(null)}
            onSave={async (updates) => {
              await onUpdateClient(selectedEditClient.id, updates);
              setSelectedEditClient(null);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}

function DocumentFolderCard({
  category,
  context,
  documents,
  onFileChange,
  onDeleteDocument,
  readOnly = false
}: {
  category: string;
  context: string;
  documents: DocumentRecord[];
  onFileChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onDeleteDocument?: (documentId: string) => void;
  readOnly?: boolean;
}) {
  const hasDocuments = documents.length > 0;
  const visibleDocuments = readOnly ? documents : documents.slice(0, 2);

  return (
    <div className={hasDocuments ? 'document-folder-card filled' : 'document-folder-card'}>
      <div className="document-folder-main">
        <span className="folder-icon"><FolderOpen size={22} /></span>
        <div>
          <strong>{category}</strong>
          <small>{context}</small>
        </div>
      </div>
      <div className="document-folder-status">
        <span>{hasDocuments ? `${documents.length} arquivo(s)` : 'Pendente'}</span>
      </div>
      {hasDocuments ? (
        <div className="document-folder-files">
          {visibleDocuments.map((document) => (
            <div className="folder-file-row" key={document.id}>
              <FileText size={14} />
              <span>{document.fileName}</span>
              <div className="folder-file-actions">
                <button type="button" onClick={() => previewDocument(document)} aria-label={`Visualizar ${document.fileName}`}>
                  <Eye size={14} />
                </button>
                <button type="button" onClick={() => downloadDocument(document)} aria-label={`Baixar ${document.fileName}`}>
                  <Download size={14} />
                </button>
                {!readOnly && onDeleteDocument ? (
                  <button type="button" className="danger" onClick={() => onDeleteDocument(document.id)} aria-label={`Excluir ${document.fileName}`}>
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {!readOnly && documents.length > 2 ? <small>+ {documents.length - 2} arquivo(s)</small> : null}
        </div>
      ) : null}
      {!readOnly && onFileChange ? (
        <label className="folder-upload-button">
          <UploadCloud size={16} />
          {hasDocuments ? 'Adicionar arquivo' : `Anexar ${category}`}
          <input multiple type="file" onChange={onFileChange} />
        </label>
      ) : null}
    </div>
  );
}

function ClientDocumentsModal({
  client,
  documents,
  onClose,
  onAttach,
  onDeleteDocument
}: {
  client: Client;
  documents: DocumentRecord[];
  onClose: () => void;
  onAttach: (fileItems: DocumentUploadItem[], category: string) => void;
  onDeleteDocument: (documentId: string) => void;
}) {
  const groupedDocuments = documentChecklist.reduce<Record<string, DocumentRecord[]>>((groups, item) => {
    groups[item] = documents.filter((document) => document.category === item || document.name === item);
    return groups;
  }, {});

  function handleFileChange(category: string, event: ChangeEvent<HTMLInputElement>) {
    const fileItems = Array.from(event.target.files ?? []);
    onAttach(fileItems, category);
    event.target.value = '';
  }

  return (
    <article className="panel modal-card client-documents-modal">
      <div className="form-heading">
        <div>
          <p className="eyebrow">Documentação do cliente</p>
          <h2>{client.name}</h2>
          <span>{client.type} - {client.document}</span>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar documentos do cliente"><X size={18} /></button>
      </div>

      <div className="document-folder-grid">
        {documentChecklist.map((category, index) => (
          <DocumentFolderCard
            category={category}
            context={index < 3 ? 'Cliente' : 'Propriedade'}
            documents={groupedDocuments[category] ?? []}
            key={category}
            onFileChange={(event) => handleFileChange(category, event)}
            onDeleteDocument={onDeleteDocument}
          />
        ))}
      </div>
    </article>
  );
}

function ClientEditModal({
  client,
  onClose,
  onSave
}: {
  client: Client;
  onClose: () => void;
  onSave: (updates: ClientFormState) => void | Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ClientFormState>({
    type: client.type,
    name: client.name,
    document: client.document,
    rgStateRegistration: client.rgStateRegistration,
    phone: client.phone,
    email: client.email,
    address: client.address,
    city: client.city,
    state: client.state,
    source: client.source,
    owner: client.owner,
    demand: client.demand,
    notes: client.notes
  });

  function updateField<K extends keyof ClientFormState>(field: K, value: ClientFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    await onSave(form);
    setIsSaving(false);
  }

  return (
    <form className="panel modal-card client-edit-modal" onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Editar cliente</p>
          <h2>{client.name}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar edição do cliente"><X size={18} /></button>
      </div>

      <div className="form-grid">
        <label>
          Tipo de cliente
          <select value={form.type} onChange={(event) => updateField('type', event.target.value as ClientFormState['type'])}>
            <option>Pessoa física</option>
            <option>Pessoa jurídica</option>
          </select>
        </label>
        <label>
          Nome completo / Razão social
          <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
        </label>
        <label>
          CPF / CNPJ
          <input value={form.document} onChange={(event) => updateField('document', event.target.value)} />
        </label>
        <label>
          RG / Inscrição estadual
          <input value={form.rgStateRegistration} onChange={(event) => updateField('rgStateRegistration', event.target.value)} />
        </label>
        <label>
          Telefone / WhatsApp
          <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
        </label>
        <label>
          E-mail
          <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
        </label>
        <label className="wide-field">
          Endereço completo
          <input value={form.address} onChange={(event) => updateField('address', event.target.value)} />
        </label>
        <label>
          Cidade
          <input value={form.city} onChange={(event) => updateField('city', event.target.value)} />
        </label>
        <label>
          Estado
          <input value={form.state} onChange={(event) => updateField('state', event.target.value)} />
        </label>
        <label>
          Origem do cliente
          <input value={form.source} onChange={(event) => updateField('source', event.target.value)} />
        </label>
        <label>
          Responsável interno
          <input value={form.owner} onChange={(event) => updateField('owner', event.target.value)} />
        </label>
        <label className="wide-field">
          Demanda apresentada
          <textarea value={form.demand} onChange={(event) => updateField('demand', event.target.value)} />
        </label>
        <label className="wide-field">
          Observações internas
          <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-light-button" onClick={onClose}>Cancelar</button>
        <button type="submit" className="primary-button dark" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}

function ClientForm({
  form,
  onFieldChange,
  onSubmit,
  onClose
}: {
  form: ClientFormState;
  onFieldChange: <K extends keyof ClientFormState>(field: K, value: ClientFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, documents?: DocumentAttachmentMap) => void;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDocumentNames, setSelectedDocumentNames] = useState<DocumentAttachmentMap>({});
  const steps = [
    { title: 'Dados principais', description: 'Identificação do cliente e documento principal.' },
    { title: 'Contato e endereço', description: 'Informações para atendimento e localização.' },
    { title: 'Demanda inicial', description: 'Necessidade apresentada e observações internas.' },
    { title: 'Documentos', description: 'Checklist inicial para abertura do processo.' }
  ];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canAdvance =
    (currentStep === 0 && Boolean(form.name.trim()) && Boolean(form.document.trim())) ||
    (currentStep === 1 && Boolean(form.phone.trim())) ||
    (currentStep === 2 && Boolean(form.demand.trim())) ||
    currentStep === 3;
  const canSave = Boolean(form.name.trim() && form.document.trim() && form.phone.trim() && form.demand.trim());

  function goNext() {
    if (!isLastStep && canAdvance) {
      setCurrentStep((step) => step + 1);
    }
  }

  function handleDocumentSelect(category: string, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setSelectedDocumentNames((current) => ({ ...current, [category]: files.map((file) => file.name) }));
  }

  return (
    <form className="panel client-form modal-card" onSubmit={(event) => onSubmit(event, selectedDocumentNames)}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Novo atendimento</p>
          <h2>Cadastro inicial do cliente</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar cadastro"><X size={18} /></button>
      </div>

      <div className="stepper" aria-label="Etapas do cadastro">
        {steps.map((step, index) => (
          <button
            className={index === currentStep ? 'step-tab active' : index < currentStep ? 'step-tab complete' : 'step-tab'}
            key={step.title}
            type="button"
            onClick={() => setCurrentStep(index)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step.title}</strong>
          </button>
        ))}
      </div>

      <div className="step-panel">
        <div>
          <div className="form-section-title">Etapa {String(currentStep + 1).padStart(2, '0')}</div>
          <h3>{steps[currentStep].title}</h3>
          <p>{steps[currentStep].description}</p>
        </div>
      </div>

      {currentStep === 0 ? (
        <div className="form-grid">
          <label>
            Tipo de cliente
            <select value={form.type} onChange={(event) => onFieldChange('type', event.target.value as ClientFormState['type'])}>
              <option>Pessoa física</option>
              <option>Pessoa jurídica</option>
            </select>
          </label>
          <label>
            Nome completo / Razão social
            <input value={form.name} onChange={(event) => onFieldChange('name', event.target.value)} placeholder="Ex: Fazenda Boa Vista" />
          </label>
          <label>
            CPF / CNPJ
            <input value={form.document} onChange={(event) => onFieldChange('document', event.target.value)} placeholder="000.000.000-00" />
          </label>
          <label>
            RG / Inscrição estadual
            <input value={form.rgStateRegistration} onChange={(event) => onFieldChange('rgStateRegistration', event.target.value)} placeholder="Documento complementar" />
          </label>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="form-grid">
          <label>
            Telefone / WhatsApp
            <input value={form.phone} onChange={(event) => onFieldChange('phone', event.target.value)} placeholder="(00) 00000-0000" />
          </label>
          <label>
            E-mail
            <input type="email" value={form.email} onChange={(event) => onFieldChange('email', event.target.value)} placeholder="cliente@email.com" />
          </label>
          <label className="wide-field">
            Endereço completo
            <input value={form.address} onChange={(event) => onFieldChange('address', event.target.value)} placeholder="Rua, comunidade, fazenda, número ou referência" />
          </label>
          <label>
            Cidade
            <input value={form.city} onChange={(event) => onFieldChange('city', event.target.value)} placeholder="Cidade" />
          </label>
          <label>
            Estado
            <input value={form.state} onChange={(event) => onFieldChange('state', event.target.value)} placeholder="UF" />
          </label>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="form-grid">
          <label>
            Origem do cliente
            <input value={form.source} onChange={(event) => onFieldChange('source', event.target.value)} placeholder="Indicação, site, Instagram..." />
          </label>
          <label>
            Responsável interno
            <input value={form.owner} onChange={(event) => onFieldChange('owner', event.target.value)} placeholder="Comercial, técnico..." />
          </label>
          <label className="wide-field">
            Demanda apresentada
            <textarea value={form.demand} onChange={(event) => onFieldChange('demand', event.target.value)} placeholder="Descreva a necessidade do cliente e o serviço solicitado" />
          </label>
          <label className="wide-field">
            Observações internas
            <textarea value={form.notes} onChange={(event) => onFieldChange('notes', event.target.value)} placeholder="Pendências, detalhes de contato ou informação técnica inicial" />
          </label>
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="wizard-documents">
          <div className="document-folder-grid">
            {documentChecklist.map((category, index) => (
              <DocumentFolderCard
                category={category}
                context={index < 3 ? 'Cliente' : 'Propriedade'}
                documents={(selectedDocumentNames[category] ?? []).map((fileName, fileIndex) => ({
                  id: `${category}-${fileIndex}`,
                  name: category,
                  category,
                  client: form.name || 'Novo cliente',
                  propertyId: '',
                  propertyName: 'Cadastro do cliente',
                  processId: '',
                  uploadedAt: 'Selecionado agora',
                  uploadedBy: 'Comercial',
                  fileName
                }))}
                key={category}
                onFileChange={(event) => handleDocumentSelect(category, event)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="form-actions">
        <button type="button" className="secondary-light-button" onClick={onClose}>Cancelar</button>
        <div className="wizard-actions">
          <button type="button" className="secondary-light-button" onClick={() => setCurrentStep((step) => step - 1)} disabled={isFirstStep}>Voltar</button>
          {!isLastStep ? (
            <button type="button" className="primary-button dark" onClick={goNext} disabled={!canAdvance}>Próximo</button>
          ) : (
            <button type="submit" className="primary-button dark" disabled={!canSave}>Salvar cliente</button>
          )}
        </div>
      </div>
    </form>
  );
}

function ProcessesView({
  processes,
  documents,
  selectedProcessId,
  onSelectProcess,
  onCloseProcess,
  onSaveAnalysis,
  onAttachDocuments,
  onDeleteDocument
}: {
  processes: EnvironmentalProcess[];
  documents: DocumentRecord[];
  selectedProcessId: string | null;
  onSelectProcess: (processId: string | null) => void;
  onCloseProcess: () => void;
  onSaveAnalysis: (processId: string, analysis: TechnicalAnalysis) => void | Promise<void>;
  onAttachDocuments: (process: EnvironmentalProcess, fileItems: DocumentUploadItem[], category: string) => void | Promise<void>;
  onDeleteDocument: (documentId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Analisar' | 'Aprovados' | 'Reprovados' | 'Complementação'>('Todos');
  const selectedProcess = processes.find((process) => process.id === selectedProcessId) ?? null;
  const technicalQueue = processes.filter((process) => process.currentStage.includes('Análise técnica')).length;
  const approved = processes.filter((process) => process.analysis.status === 'Aprovado').length;
  const complement = processes.filter((process) => process.analysis.status === 'Necessita complementação').length;
  const filteredProcesses = processes.filter((process) => {
    const term = normalizeText(search.trim());
    const matchesSearch = !term || [process.id, process.client, process.property, process.service, process.owner, process.analysis.status].some((value) => normalizeText(value).includes(term));
    const matchesFilter =
      statusFilter === 'Todos' ||
      (statusFilter === 'Analisar' && process.analysis.status === 'Em análise') ||
      (statusFilter === 'Aprovados' && process.analysis.status === 'Aprovado') ||
      (statusFilter === 'Reprovados' && process.analysis.status === 'Reprovado') ||
      (statusFilter === 'Complementação' && process.analysis.status === 'Necessita complementação');
    return matchesSearch && matchesFilter;
  });

  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Etapa 02 - Análise técnica</p>
          <h1>Processos</h1>
          <p>Analise a viabilidade do serviço solicitado, registre pendências e defina se o processo pode seguir para proposta comercial.</p>
        </div>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Para analisar</span><strong>{technicalQueue}</strong></article>
        <article className="mini-stat"><span>Aprovados</span><strong>{approved}</strong></article>
        <article className="mini-stat"><span>Com complementação</span><strong>{complement}</strong></article>
      </div>

      <div className="queue-toolbar">
        <div className="search-box compact-search">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por processo, cliente, propriedade, serviço ou responsável" />
        </div>
        <div className="followup-filters" aria-label="Filtros de processos">
          {(['Todos', 'Analisar', 'Aprovados', 'Reprovados', 'Complementação'] as const).map((item) => (
            <button className={statusFilter === item ? 'filter-chip active' : 'filter-chip'} key={item} type="button" onClick={() => setStatusFilter(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="processes-layout full-list">
        <article className="panel process-list-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Fila técnica</p>
              <h2>Processos ambientais</h2>
            </div>
          </div>
          <div className="technical-process-list">
            {filteredProcesses.map((process) => (
              <button
                className={(process.id === selectedProcess?.id ? 'technical-process-card active ' : 'technical-process-card ') + 'status-card-' + normalizeText(process.analysis.status).replace(/\s/g, '-')}
                key={process.id}
                type="button"
                onClick={() => onSelectProcess(process.id)}
              >
                <div>
                  <strong>{process.id}</strong>
                  <span>{process.client} - {process.property}</span>
                </div>
                <p>{process.service}</p>
                <div className="process-card-grid">
                  <small>Responsável: {process.owner}</small>
                  <small>Prazo: {process.dueDate}</small>
                </div>
                <div className="process-meta-row">
                  <span className={'status-chip analysis-status-chip ' + getAnalysisStatusClass(process.analysis.status)}>{getAnalysisDisplay(process.analysis.status)}</span>
                  <small>{process.priority}</small>
                </div>
                <div className="open-analysis-hint">Abrir análise técnica</div>
              </button>
            ))}
            {filteredProcesses.length === 0 ? <div className="empty-state">Nenhum processo encontrado neste filtro.</div> : null}
          </div>
        </article>

      </div>

      {selectedProcess ? (
        <div className="modal-backdrop">
          <article className="panel process-detail-panel modal-card process-modal-card">
            <div className="process-detail-header">
              <div>
                <p className="eyebrow">{selectedProcess.currentStage}</p>
                <h2>{selectedProcess.id}</h2>
                <span>{selectedProcess.client} - {selectedProcess.property}</span>
              </div>
              <button type="button" className="icon-button" onClick={onCloseProcess} aria-label="Fechar análise técnica"><X size={18} /></button>
            </div>

            <div className="process-summary-grid">
              <div><span>Serviço</span><strong>{selectedProcess.service}</strong></div>
              <div><span>Responsável</span><strong>{selectedProcess.owner}</strong></div>
              <div><span>Abertura</span><strong>{selectedProcess.openedAt}</strong></div>
              <div><span>Prazo</span><strong>{selectedProcess.dueDate}</strong></div>
            </div>

            <div className="process-demand-box">
              <p className="eyebrow">Demanda apresentada</p>
              <p>{selectedProcess.demand}</p>
            </div>

            <TechnicalAnalysisForm
              process={selectedProcess}
              documents={documents.filter((document) => document.processId === selectedProcess.id || document.client === selectedProcess.client || document.propertyName === selectedProcess.property)}
              onSave={onSaveAnalysis}
              onClose={onCloseProcess}
              onAttachDocuments={onAttachDocuments}
              onDeleteDocument={onDeleteDocument}
            />
          </article>
        </div>
      ) : null}
    </section>
  );
}

function TechnicalAnalysisForm({
  process,
  documents,
  onSave,
  onClose,
  onAttachDocuments,
  onDeleteDocument
}: {
  process: EnvironmentalProcess;
  documents: DocumentRecord[];
  onSave: (processId: string, analysis: TechnicalAnalysis) => void | Promise<void>;
  onClose: () => void;
  onAttachDocuments: (process: EnvironmentalProcess, fileItems: DocumentUploadItem[], category: string) => void | Promise<void>;
  onDeleteDocument: (documentId: string) => void;
}) {
  const [analysis, setAnalysis] = useState<TechnicalAnalysis>(process.analysis);
  const [documentCategory, setDocumentCategory] = useState('Outros documentos');
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState<DocumentUploadItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAnalysis(process.analysis);
  }, [process]);

  function updateField<K extends keyof TechnicalAnalysis>(field: K, value: TechnicalAnalysis[K]) {
    setAnalysis((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    await onSave(process.id, analysis);
    setIsSaving(false);
    onClose();
  }

  function handleDocumentSelect(event: ChangeEvent<HTMLInputElement>) {
    const fileItems = Array.from(event.target.files ?? []);
    setSelectedDocumentFiles(fileItems);
  }

  function handleAttachDocuments() {
    onAttachDocuments(process, selectedDocumentFiles, documentCategory);
    setSelectedDocumentFiles([]);
  }

  return (
    <form className="technical-analysis-form" onSubmit={handleSubmit}>
      <div className="analysis-heading">
        <div>
          <p className="eyebrow">Parecer técnico</p>
          <h3>Análise do serviço solicitado</h3>
        </div>
        <ClipboardCheck size={24} />
      </div>

      <div className="form-grid">
        <label>
          Status da análise
          <select value={analysis.status} onChange={(event) => updateField('status', event.target.value as TechnicalAnalysis['status'])}>
            <option>Em análise</option>
            <option>Aprovado</option>
            <option>Reprovado</option>
            <option>Necessita complementação</option>
          </select>
        </label>
        <label>
          Resultado operacional
          <select value={analysis.result} onChange={(event) => updateField('result', event.target.value as TechnicalAnalysis['result'])}>
            <option>Pode gerar proposta</option>
            <option>Precisa complementar informações</option>
            <option>Serviço inviável</option>
          </select>
        </label>
        <label>
          Responsável técnico
          <input value={analysis.responsible} onChange={(event) => updateField('responsible', event.target.value)} placeholder="Nome ou setor responsável" />
        </label>
        <label>
          Data da análise
          <input value={analysis.analysisDate} onChange={(event) => updateField('analysisDate', event.target.value)} placeholder="DD/MM/AAAA" />
        </label>
        <label className="wide-field">
          Situação da propriedade / área
          <textarea value={analysis.areaSituation} onChange={(event) => updateField('areaSituation', event.target.value)} placeholder="Descreva a situação técnica inicial da área" />
        </label>
        <label className="wide-field">
          Pendências encontradas
          <textarea value={analysis.pendingIssues} onChange={(event) => updateField('pendingIssues', event.target.value)} placeholder="Informe documentos faltantes, inconsistências ou impeditivos" />
        </label>
        <label className="wide-field">
          Necessidades adicionais
          <textarea value={analysis.additionalNeeds} onChange={(event) => updateField('additionalNeeds', event.target.value)} placeholder="Ex: visita de campo, fotos, coordenadas, mapa, complementação documental" />
        </label>
        <label className="wide-field">
          Parecer técnico
          <textarea value={analysis.technicalOpinion} onChange={(event) => updateField('technicalOpinion', event.target.value)} placeholder="Registre o parecer técnico final da análise" />
        </label>
      </div>

      <div className="analysis-footer">
        <div>
          <strong>{analysis.result}</strong>
          <span>Essa decisão orienta a próxima etapa do processo.</span>
        </div>
        <button className="primary-button dark" type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar parecer técnico'}
        </button>
      </div>

      <div className="process-documents-area">
        <div className="analysis-heading">
          <div>
            <p className="eyebrow">Documentos complementares</p>
            <h3>Anexos do processo</h3>
          </div>
          <UploadCloud size={24} />
        </div>
        <div className="form-grid">
          <label>
            Categoria do documento
            <select value={documentCategory} onChange={(event) => setDocumentCategory(event.target.value)}>
              {documentChecklist.map((document) => <option key={document}>{document}</option>)}
            </select>
          </label>
        </div>
        <div className="upload-dropzone compact real-upload">
          <UploadCloud size={22} />
          <strong>Anexar mais documentos</strong>
          <span>Adicione documentos recebidos durante a análise técnica deste processo.</span>
          <label className="file-upload-button">Selecionar arquivos<input multiple type="file" onChange={handleDocumentSelect} /></label>
        </div>
        {selectedDocumentFiles.length > 0 ? (
          <div className="selected-files">
            {selectedDocumentFiles.map((fileItem) => {
              const fileName = getUploadFileName(fileItem);
              return (
                <div className="selected-file" key={fileName}>
                  <FileText size={17} />
                  <span>{fileName}</span>
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="analysis-footer">
          <div>
            <strong>{documents.length} documento(s) vinculado(s)</strong>
            <span>Esses anexos ficam disponíveis em Acompanhamento, no botão Ver documentos.</span>
          </div>
          <button type="button" className="primary-button dark" disabled={selectedDocumentFiles.length === 0} onClick={handleAttachDocuments}>
            Salvar anexos
          </button>
        </div>
        <ProcessDocumentSummary documents={documents} onDeleteDocument={onDeleteDocument} />
      </div>
    </form>
  );
}

function ProcessDocumentSummary({ documents, onDeleteDocument }: { documents: DocumentRecord[]; onDeleteDocument: (documentId: string) => void }) {
  return (
    <div className="process-document-summary-list">
      {documents.map((document) => (
        <div className="process-document-summary-card" key={document.id}>
          <div>
            <strong>{document.name}</strong>
            <span>{document.fileName}</span>
          </div>
          <div className="document-meta-grid">
            <span>Categoria <strong>{document.category}</strong></span>
            <span>Cliente <strong>{document.client}</strong></span>
            <span>Propriedade <strong>{document.propertyName}</strong></span>
            <span>Processo <strong>{document.processId || 'Cadastro do cliente'}</strong></span>
          </div>
          <div className="document-card-actions">
            <button className="secondary-light-button danger-button" type="button" onClick={() => onDeleteDocument(document.id)}><Trash2 size={16} /> Excluir</button>
          </div>
        </div>
      ))}
      {documents.length === 0 ? <div className="empty-state">Nenhum documento vinculado a este processo.</div> : null}
    </div>
  );
}

function ProposalsView({
  processes,
  proposals,
  selectedProcessId,
  form,
  onOpenProposal,
  onCloseProposal,
  onFieldChange,
  onSubmit,
  onApproveProposal
}: {
  processes: EnvironmentalProcess[];
  proposals: Proposal[];
  selectedProcessId: string | null;
  form: ProposalFormState;
  onOpenProposal: (processId: string) => void;
  onCloseProposal: () => void;
  onFieldChange: <K extends keyof ProposalFormState>(field: K, value: ProposalFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onApproveProposal: (proposalId: string) => void | Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [proposalFilter, setProposalFilter] = useState<ProposalStatus | 'Todos'>('Gerar proposta');
  const proposalRows = processes
    .filter((process) => process.status === 'Aguardando proposta' || process.analysis.status === 'Aprovado')
    .map((process) => ({ process, proposal: proposals.find((proposal) => proposal.processId === process.id) ?? null }));
  const readyProcesses = proposalRows.filter((row) => !row.proposal).map((row) => row.process);
  const selectedProcess = readyProcesses.find((process) => process.id === selectedProcessId) ?? null;
  const filteredProposalRows = proposalRows.filter(({ process, proposal }) => {
    const term = normalizeText(search.trim());
    const rowStatus: ProposalStatus = proposal?.status ?? 'Gerar proposta';
    const matchesSearch = !term || [process.id, process.client, process.property, process.service, proposal?.id ?? '', rowStatus].some((value) => normalizeText(value).includes(term));
    const matchesFilter =
      proposalFilter === 'Todos' ||
      (proposalFilter === 'Gerar proposta' && !proposal) ||
      proposal?.status === proposalFilter;
    return matchesSearch && matchesFilter;
  });
  const totalValue = proposals.reduce((total, proposal) => {
    const parsedValue = Number(proposal.value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''));
    return Number.isNaN(parsedValue) ? total : total + parsedValue;
  }, 0);

  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Etapa 03 - Proposta comercial</p>
          <h1>Propostas</h1>
          <p>Central comercial para gerar propostas em PDF a partir dos processos aprovados, controlar valores e preparar o envio ao cliente.</p>
        </div>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Gerar proposta</span><strong>{readyProcesses.length}</strong></article>
        <article className="mini-stat"><span>Propostas geradas</span><strong>{proposals.length}</strong></article>
        <article className="mini-stat"><span>Aprovadas</span><strong>{proposals.filter((proposal) => proposal.status === 'Proposta aprovada').length}</strong></article>
        <article className="mini-stat"><span>Total proposto</span><strong>{formatCurrency(totalValue)}</strong></article>
      </div>

      <div className="queue-toolbar">
        <div className="search-box compact-search">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por processo, cliente, serviço, propriedade ou proposta" />
        </div>
        <div className="followup-filters" aria-label="Filtros de propostas">
          {(['Todos', 'Gerar proposta', 'Proposta gerada', 'Proposta aprovada', 'Proposta recusada'] as const).map((item) => (
            <button className={proposalFilter === item ? 'filter-chip active' : 'filter-chip'} key={item} type="button" onClick={() => setProposalFilter(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="proposal-layout single-column">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Fila comercial</p>
              <h2>Processos prontos para proposta</h2>
            </div>
          </div>
          <div className="proposal-ready-list">
            {filteredProposalRows.map(({ process, proposal }) => (
              <div className={'proposal-ready-card ' + (proposal ? 'proposal-state-' + normalizeText(proposal.status).replace(/\s/g, '-') : 'proposal-state-gerar-proposta')} key={process.id}>
                <div>
                  <strong>{process.id}</strong>
                  <span>{process.client} - {process.property}</span>
                </div>
                <p>{process.service}</p>
                <div className="process-meta-row">
                  <span className={'status-chip proposal-status-chip ' + getProposalStatusClass(proposal?.status ?? 'Gerar proposta')}>
                    {proposal ? proposal.status : 'Gerar proposta'}
                  </span>
                  {proposal ? (
                    <small>{proposal.id} - {formatCurrency(parseCurrency(proposal.value))}</small>
                  ) : (
                    <button className="primary-button dark" type="button" onClick={() => onOpenProposal(process.id)}>
                      <FilePlus size={18} /> Gerar proposta
                    </button>
                  )}
                </div>
                {proposal ? (
                  <div className="proposal-generated-summary">
                    <span>Número <strong>{proposal.id}</strong></span>
                    <span>Valor <strong>{formatCurrency(parseCurrency(proposal.value))}</strong></span>
                    <span>Data <strong>{proposal.createdAt}</strong></span>
                    {proposal.approvedAt ? <span>Aprovação <strong>{proposal.approvedAt}</strong></span> : null}
                    <div className="proposal-actions">
                      <button type="button" className="secondary-light-button" onClick={() => openProposalPdf(proposal)}>
                        <Eye size={17} /> Visualizar PDF
                      </button>
                      <button type="button" className="primary-button dark" onClick={() => openProposalPdf(proposal, true)}>
                        <Download size={17} /> Baixar PDF
                      </button>
                      {proposal.status === 'Proposta gerada' ? (
                        <button type="button" className="primary-button approve-proposal-button" onClick={() => onApproveProposal(proposal.id)}>
                          <ClipboardCheck size={17} /> Aprovar proposta
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            {filteredProposalRows.length === 0 ? (
              <div className="empty-state">Nenhum processo encontrado neste filtro.</div>
            ) : null}
          </div>
        </article>
      </div>

      {selectedProcess ? (
        <div className="modal-backdrop">
          <ProposalFormModal process={selectedProcess} form={form} onFieldChange={onFieldChange} onSubmit={onSubmit} onClose={onCloseProposal} />
        </div>
      ) : null}
    </section>
  );
}

function ProposalFormModal({
  process,
  form,
  onFieldChange,
  onSubmit,
  onClose
}: {
  process: EnvironmentalProcess;
  form: ProposalFormState;
  onFieldChange: <K extends keyof ProposalFormState>(field: K, value: ProposalFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onClose: () => void;
}) {
  const totalValue = calculateProposalTotal(form.services);
  const entryValue = totalValue * (form.entryPercentage / 100);
  const remainingValue = totalValue - entryValue;
  const canSave = Boolean(
    form.id.trim() &&
    form.client.trim() &&
    form.property.trim() &&
    form.responsible.trim() &&
    form.services.some((service) => service.description.trim() && parseCurrency(service.value) > 0) &&
    form.paymentMethods.length > 0
  );

  function updateService(index: number, field: keyof ProposalServiceItem, value: string) {
    const services = form.services.map((service, serviceIndex) => (serviceIndex === index ? { ...service, [field]: value } : service));
    onFieldChange('services', services);
  }

  function addService() {
    onFieldChange('services', [...form.services, { description: '', value: '' }]);
  }

  function removeService(index: number) {
    if (form.services.length === 1) return;
    onFieldChange('services', form.services.filter((_, serviceIndex) => serviceIndex !== index));
  }

  function togglePaymentMethod(method: PaymentMethod) {
    const exists = form.paymentMethods.includes(method);
    onFieldChange('paymentMethods', exists ? form.paymentMethods.filter((item) => item !== method) : [...form.paymentMethods, method]);
  }

  return (
    <form className="panel modal-card proposal-form-modal commercial-proposal-modal" onSubmit={onSubmit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Geração automática de proposta</p>
          <h2>{form.id}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar proposta"><X size={18} /></button>
      </div>

      <div className="proposal-process-summary">
        <div><span>Cliente</span><strong>{process.client}</strong></div>
        <div><span>Processo</span><strong>{process.id}</strong></div>
        <div><span>Serviço</span><strong>{process.service}</strong></div>
        <div><span>Propriedade</span><strong>{process.property}</strong></div>
      </div>

      <div className="form-section-title">Informações da proposta</div>
      <div className="form-grid">
        <label>
          Número da proposta
          <input value={form.id} onChange={(event) => onFieldChange('id', event.target.value)} />
        </label>
        <label>
          Data
          <input value={form.date} onChange={(event) => onFieldChange('date', event.target.value)} />
        </label>
        <label>
          Nome do cliente
          <input value={form.client} onChange={(event) => onFieldChange('client', event.target.value)} />
        </label>
        <label>
          Propriedade / Fazenda
          <input value={form.property} onChange={(event) => onFieldChange('property', event.target.value)} />
        </label>
        <label>
          Responsável
          <input value={form.responsible} onChange={(event) => onFieldChange('responsible', event.target.value)} />
        </label>
        <label>
          Telefone
          <input value={form.phone} onChange={(event) => onFieldChange('phone', event.target.value)} />
        </label>
        <label>
          Cidade / Estado
          <input value={form.cityState} onChange={(event) => onFieldChange('cityState', event.target.value)} />
        </label>
        <label>
          Validade
          <input value={form.validity} onChange={(event) => onFieldChange('validity', event.target.value)} />
        </label>
        <label>
          Prazo de execução
          <input value={form.deadline} onChange={(event) => onFieldChange('deadline', event.target.value)} placeholder="Ex: 30 dias após contrato" />
        </label>
      </div>

      <div className="form-section-title">Serviços</div>
      <div className="proposal-services-editor">
        {form.services.map((service, index) => (
          <div className="proposal-service-row" key={index}>
            <label>
              Descrição
              <textarea value={service.description} onChange={(event) => updateService(index, 'description', event.target.value)} placeholder="Descreva o serviço ambiental" />
            </label>
            <label>
              Valor
              <input value={service.value} onChange={(event) => updateService(index, 'value', event.target.value)} placeholder="Ex: 4.500,00" />
            </label>
            <button type="button" className="icon-action-button" onClick={() => removeService(index)} aria-label="Remover serviço" disabled={form.services.length === 1}>
              <X size={16} />
            </button>
          </div>
        ))}
        <button type="button" className="secondary-light-button add-service-button" onClick={addService}>
          <FilePlus size={17} /> Adicionar serviço
        </button>
      </div>

      <div className="form-grid">
        <label className="wide-field">
          Observações técnicas
          <textarea value={form.technicalNotes} onChange={(event) => onFieldChange('technicalNotes', event.target.value)} placeholder="Informe detalhes técnicos, escopo e pontos importantes da análise" />
        </label>
      </div>

      <div className="form-section-title">Financeiro da proposta</div>
      <div className="proposal-financial-grid">
        <div><span>Valor total automático</span><strong>{formatCurrency(totalValue)}</strong></div>
        <label>
          Entrada (%)
          <input type="number" min="0" max="100" value={form.entryPercentage} onChange={(event) => onFieldChange('entryPercentage', Number(event.target.value))} />
        </label>
        <div><span>Valor de entrada</span><strong>{formatCurrency(entryValue)}</strong></div>
        <div><span>Valor restante</span><strong>{formatCurrency(remainingValue)}</strong></div>
      </div>

      <div className="form-section-title">Meios e condições de pagamento</div>
      <div className="payment-method-grid">
        {(['Pix', 'Boleto', 'Transferência bancária'] as PaymentMethod[]).map((method) => (
          <label className="checkbox-card" key={method}>
            <input type="checkbox" checked={form.paymentMethods.includes(method)} onChange={() => togglePaymentMethod(method)} />
            <span>{method}</span>
          </label>
        ))}
      </div>

      <div className="form-grid">
        <label className="wide-field">
          Condições de pagamento
          <textarea value={form.paymentTerms} onChange={(event) => onFieldChange('paymentTerms', event.target.value)} />
        </label>
        <label className="wide-field">
          Observações
          <textarea value={form.observations} onChange={(event) => onFieldChange('observations', event.target.value)} placeholder="Informações adicionais, escopo ou itens não inclusos" />
        </label>
      </div>

      <div className="proposal-preview">
        <p className="eyebrow">Preview comercial</p>
        <strong>{form.id} - {form.client}</strong>
        <span>{form.services.length} serviço(s) | Total: {formatCurrency(totalValue)} | Entrada: {formatCurrency(entryValue)}</span>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-light-button" onClick={onClose}>Cancelar</button>
        <button type="submit" className="primary-button dark" disabled={!canSave}>Gerar proposta PDF</button>
      </div>
    </form>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const message = `Olá, ${proposal.client}. Segue a proposta ${proposal.id} referente ao serviço de ${proposal.service} da Anjos Ambiental. Valor: R$ ${proposal.value}. Prazo: ${proposal.deadline}.`;
  const whatsappUrl = `https://wa.me/55${proposal.clientPhone}?text=${encodeURIComponent(message)}`;

  return (
    <div className="proposal-card">
      <div className="proposal-card-header">
        <div>
          <strong>{proposal.id}</strong>
          <span>{proposal.client}</span>
        </div>
        <span className="status-chip">{proposal.status}</span>
      </div>
      <div className="proposal-card-body">
        <p>{proposal.service}</p>
        <div className="proposal-info-grid">
          <span>Valor: <strong>R$ {proposal.value}</strong></span>
          <span>Prazo: <strong>{proposal.deadline}</strong></span>
          <span>Validade: <strong>{proposal.validity}</strong></span>
          <span>Responsável: <strong>{proposal.responsible}</strong></span>
        </div>
      </div>
      <div className="proposal-actions">
        <button type="button" className="secondary-light-button" onClick={() => window.print()}>
          <Printer size={17} /> Imprimir / salvar PDF
        </button>
        <a className="primary-button dark" href={whatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle size={17} /> Enviar WhatsApp
        </a>
      </div>
    </div>
  );
}

function OperationalFollowUpView({
  clients,
  processes,
  proposals,
  contracts,
  financialRecords,
  executionRecords,
  services,
  documents
}: {
  clients: Client[];
  processes: EnvironmentalProcess[];
  proposals: Proposal[];
  contracts: ContractRecord[];
  financialRecords: FinancialRecord[];
  executionRecords: ExecutionRecord[];
  services: ServiceTracking[];
  documents: DocumentRecord[];
}) {
  const [filter, setFilter] = useState<'Todos' | 'Atenção' | 'Comercial' | 'Jurídico' | 'Execução' | 'Financeiro' | 'Concluídos'>('Todos');
  const [selectedDocumentProcessId, setSelectedDocumentProcessId] = useState<string | null>(null);
  const rows = processes.map((process) => {
    const proposal = proposals.find((item) => item.processId === process.id);
    const contract = contracts.find((item) => item.processId === process.id);
    const financial = financialRecords.find((item) => item.processId === process.id);
    const execution = executionRecords.find((item) => item.processId === process.id);
    const service = services.find((item) => item.processId === process.id);

    let stage = 'Análise técnica';
    let department = 'Técnico escritório';
    let status: string = process.analysis.status;
    let blocker = process.analysis.pendingIssues || 'Aguardando conclusão do parecer técnico.';
    let nextAction = process.analysis.additionalNeeds || 'Atualizar parecer técnico.';
    let attention = process.analysis.status !== 'Aprovado';

    if (process.analysis.status === 'Aprovado') {
      stage = 'Proposta';
      department = 'Comercial';
      status = proposal?.status ?? 'Aguardando proposta';
      blocker = proposal ? 'Proposta gerada e aguardando decisão comercial.' : 'Análise aprovada, mas a proposta ainda não foi gerada.';
      nextAction = proposal ? 'Acompanhar aprovação ou recusa da proposta.' : 'Gerar proposta comercial.';
      attention = !proposal || proposal.status === 'Proposta recusada';
    }

    if (proposal && proposal.status === 'Proposta aprovada') {
      stage = 'Contratos';
      department = 'Jurídico';
      status = contract?.status ?? 'Aguardando contrato';
      blocker = contract ? 'Contrato criado e aguardando validação final.' : 'Proposta gerada, mas contrato ainda não foi finalizado pelo jurídico.';
      nextAction = contract ? 'Conferir assinatura e status contratual.' : 'Gerar contrato vinculado à proposta.';
      attention = !contract || contract.status === 'Cancelado';
    }

    if (contract && contract.status !== 'Cancelado') {
      stage = 'Financeiro';
      department = 'Financeiro';
      status = financial?.financialStatus ?? 'Aguardando entrada';
      blocker = financial?.releasedAt ? 'Entrada confirmada e serviço liberado para execução.' : 'Contrato criado, mas a entrada ainda não foi confirmada pelo financeiro.';
      nextAction = financial?.releasedAt ? 'Encaminhar para execução técnica.' : 'Confirmar pagamento inicial para liberar execução.';
      attention = !financial?.releasedAt;
    }

    if (contract && financial?.releasedAt) {
      stage = 'Execução';
      department = execution?.fieldVisits.length ? 'Técnico campo' : 'Técnico escritório';
      status = service?.status ?? 'Não iniciado';
      blocker = service?.pendingIssue || 'Contrato com entrada confirmada e liberado para execução.';
      nextAction = service?.nextAction || 'Registrar ações do técnico escritório e ficha de campo.';
      attention = service?.status === 'Pendente';
    }

    if (service?.status === 'Concluído') {
      stage = 'Pós-serviço';
      department = 'Gestão operacional';
      status = 'Concluído';
      blocker = service.renewalDeadline ? `Monitorar renovação em ${service.renewalDeadline}.` : 'Serviço entregue.';
      nextAction = service.postServiceNotes || 'Manter acompanhamento pós-serviço.';
      attention = false;
    }

    return {
      process,
      proposal,
      contract,
      financial,
      execution,
      service,
      stage,
      department,
      status,
      blocker,
      nextAction,
      attention
    };
  });

  const filteredRows = rows.filter((row) => {
    if (filter === 'Todos') return true;
    if (filter === 'Atenção') return row.attention;
    if (filter === 'Concluídos') return row.status === 'Concluído';
    return row.department === filter || row.stage === filter;
  });
  const selectedDocumentRow = rows.find((row) => row.process.id === selectedDocumentProcessId) ?? null;
  const selectedClient = selectedDocumentRow ? clients.find((client) => client.name === selectedDocumentRow.process.client) ?? null : null;
  const selectedDocuments = selectedDocumentRow
    ? documents.filter((document) =>
        document.processId === selectedDocumentRow.process.id ||
        document.client === selectedDocumentRow.process.client ||
        document.propertyName === selectedDocumentRow.process.property
      )
    : [];

  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Central gerencial</p>
          <h1>Acompanhamento</h1>
          <p>Visualize todos os processos em uma única tela, identificando etapa atual, departamento responsável, pendências e pontos travados da operação.</p>
        </div>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Processos monitorados</span><strong>{rows.length}</strong></article>
        <article className="mini-stat"><span>Precisam de atenção</span><strong>{rows.filter((row) => row.attention).length}</strong></article>
        <article className="mini-stat"><span>Em execução</span><strong>{rows.filter((row) => row.stage === 'Execução').length}</strong></article>
      </div>

      <div className="followup-filters" aria-label="Filtros do acompanhamento">
        {(['Todos', 'Atenção', 'Comercial', 'Jurídico', 'Execução', 'Financeiro', 'Concluídos'] as const).map((item) => (
          <button className={filter === item ? 'filter-chip active' : 'filter-chip'} key={item} type="button" onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>

      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Torre de controle</p>
            <h2>Visão geral dos processos</h2>
          </div>
        </div>

        <div className="followup-table">
          <div className="followup-table-head">
            <span>Processo</span>
            <span>Etapa atual</span>
            <span>Departamento</span>
            <span>Status</span>
            <span>Próxima ação</span>
          </div>
          {filteredRows.map((row) => (
            <div className={row.attention ? 'followup-row attention' : 'followup-row'} key={row.process.id}>
              <div>
                <strong>{row.process.id}</strong>
                <span>{row.process.client}</span>
                <small>{row.process.service}</small>
              </div>
              <div>
                <span className="status-chip">{row.stage}</span>
                <small>Prazo {row.process.dueDate}</small>
              </div>
              <div>
                <strong>{row.department}</strong>
                <small>{row.contract ? row.contract.id : row.proposal?.id ?? 'Sem vínculo comercial'}</small>
              </div>
              <div>
                <strong>{row.status}</strong>
                <small>{row.blocker}</small>
              </div>
              <div>
                <p>{row.nextAction}</p>
                <button className="secondary-light-button followup-doc-button" type="button" onClick={() => setSelectedDocumentProcessId(row.process.id)}>
                  <Eye size={17} /> Ver documentos
                </button>
              </div>
            </div>
          ))}
          {filteredRows.length === 0 ? <div className="empty-state">Nenhum processo encontrado neste filtro.</div> : null}
        </div>
      </article>

      {selectedDocumentRow ? (
        <div className="modal-backdrop">
          <FollowUpDocumentsModal
            row={selectedDocumentRow}
            client={selectedClient}
            documents={selectedDocuments}
            onClose={() => setSelectedDocumentProcessId(null)}
          />
        </div>
      ) : null}
    </section>
  );
}

type FollowUpRow = {
  process: EnvironmentalProcess;
  proposal: Proposal | undefined;
  contract: ContractRecord | undefined;
  financial: FinancialRecord | undefined;
  execution: ExecutionRecord | undefined;
  service: ServiceTracking | undefined;
  stage: string;
  department: string;
  status: string;
  blocker: string;
  nextAction: string;
  attention: boolean;
};

const followUpDocumentSections = [
  {
    title: 'Documentos do cliente',
    categories: ['RG', 'CPF', 'Comprovante de endereço', 'Procuração', 'Contrato social', 'Outros documentos']
  },
  {
    title: 'Documentos da propriedade',
    categories: ['Escritura', 'Contrato de compra e venda', 'Certidão de inteiro teor', 'CCIR', 'ITR', 'CAR', 'GEO', 'MAPA', 'CROQUI', 'Outros da propriedade']
  },
  {
    title: 'Documentos comerciais',
    categories: ['Proposta comercial', 'Contrato', 'Comprovantes financeiros', 'Nota fiscal']
  },
  {
    title: 'Documentos técnicos',
    categories: ['Licenças', 'Laudos', 'Relatórios', 'ART', 'Análises técnicas', 'Estudos ambientais', 'Protocolos', 'Certificados', 'Anexos do processo']
  }
];

function createVirtualDocument(
  id: string,
  category: string,
  process: EnvironmentalProcess,
  fileName: string,
  uploadedBy: string
): DocumentRecord {
  return {
    id,
    name: category,
    category,
    client: process.client,
    propertyId: '',
    propertyName: process.property,
    processId: process.id,
    uploadedAt: new Date().toLocaleDateString('pt-BR'),
    uploadedBy,
    fileName
  };
}

function FollowUpDocumentsModal({
  row,
  client,
  documents,
  onClose
}: {
  row: FollowUpRow;
  client: Client | null;
  documents: DocumentRecord[];
  onClose: () => void;
}) {
  const process = row.process;
  const virtualDocuments = [
    row.proposal ? createVirtualDocument(`VIRT-${row.proposal.id}`, 'Proposta comercial', process, `${row.proposal.id}.pdf`, 'Comercial') : null,
    row.contract ? createVirtualDocument(`VIRT-${row.contract.id}`, 'Contrato', process, `${row.contract.id}.pdf`, 'Jurídico') : null,
    row.financial?.receivedAmount ? createVirtualDocument(`VIRT-FIN-${row.financial.id}`, 'Comprovantes financeiros', process, `comprovante-entrada-${row.financial.contractId}.pdf`, 'Financeiro') : null,
    process.analysis.technicalOpinion ? createVirtualDocument(`VIRT-AN-${process.id}`, 'Análises técnicas', process, `parecer-tecnico-${process.id}.pdf`, 'Técnico escritório') : null
  ].filter(Boolean) as DocumentRecord[];
  const allDocuments = [...documents, ...virtualDocuments];

  function getCategoryDocuments(category: string) {
    if (category === 'Outros da propriedade') {
      return allDocuments.filter((document) => document.category === 'Outros documentos' && document.propertyName === process.property);
    }
    if (category === 'Anexos do processo') {
      return allDocuments.filter((document) => document.processId === process.id && !followUpDocumentSections.some((section) => section.categories.includes(document.category)));
    }
    if (category === 'Licenças') {
      return allDocuments.filter((document) => normalizeText(document.category).includes('licenca') || normalizeText(document.name).includes('licenca'));
    }
    return allDocuments.filter((document) => document.category === category || document.name === category);
  }

  function getContext(category: string) {
    if (['RG', 'CPF', 'Comprovante de endereço', 'Procuração', 'Contrato social', 'Outros documentos'].includes(category)) return 'Cliente';
    if (['Proposta comercial', 'Contrato', 'Comprovantes financeiros', 'Nota fiscal'].includes(category)) return 'Comercial';
    if (['Licenças', 'Laudos', 'Relatórios', 'ART', 'Análises técnicas', 'Estudos ambientais', 'Protocolos', 'Certificados', 'Anexos do processo'].includes(category)) return 'Técnico';
    return 'Propriedade';
  }

  const totalPending = followUpDocumentSections.reduce((total, section) => (
    total + section.categories.filter((category) => getCategoryDocuments(category).length === 0).length
  ), 0);

  return (
    <article className="panel modal-card followup-documents-modal">
      <div className="form-heading">
        <div>
          <p className="eyebrow">Central documental do processo</p>
          <h2>{process.id}</h2>
          <span>{process.client} - {process.property}</span>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar documentos"><X size={18} /></button>
      </div>

      <div className="followup-document-header-grid">
        <div><span>Cliente</span><strong>{process.client}</strong></div>
        <div><span>CPF/CNPJ</span><strong>{client?.document ?? 'Não informado'}</strong></div>
        <div><span>Processo</span><strong>{process.id}</strong></div>
        <div><span>Tipo do processo</span><strong>{process.service}</strong></div>
        <div><span>Propriedade</span><strong>{process.property}</strong></div>
        <div><span>Município</span><strong>{client ? `${client.city}/${client.state}` : 'Não informado'}</strong></div>
        <div><span>Etapa atual</span><strong>{row.stage}</strong></div>
        <div><span>Status geral</span><strong>{row.status}</strong></div>
      </div>

      <div className="document-folder-summary">
        <div>
          <strong>{allDocuments.length} arquivo(s) localizados</strong>
          <span>{totalPending} pasta(s) ainda sem documento vinculado.</span>
        </div>
        <span>{row.department}</span>
      </div>

      <div className="followup-document-sections">
        {followUpDocumentSections.map((section) => (
          <section className="followup-document-section" key={section.title}>
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">{section.title}</p>
                <h3>{section.categories.length} pasta(s)</h3>
              </div>
            </div>
            <div className="document-folder-grid">
              {section.categories.map((category) => (
                <DocumentFolderCard
                  category={category}
                  context={getContext(category)}
                  documents={getCategoryDocuments(category)}
                  key={`${section.title}-${category}`}
                  readOnly
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

function ContractsView({
  proposals,
  contracts,
  selectedProposalId,
  selectedContractId,
  onSelectProposal,
  onSelectContract,
  onClose,
  onSave,
  onActivateContract
}: {
  proposals: Proposal[];
  contracts: ContractRecord[];
  selectedProposalId: string | null;
  selectedContractId: string | null;
  onSelectProposal: (proposalId: string) => void;
  onSelectContract: (contractId: string) => void;
  onClose: () => void;
  onSave: (contract: ContractRecord) => void | Promise<void>;
  onActivateContract: (contractId: string) => void | Promise<void>;
}) {
  const contractQueueProposals = proposals.filter((proposal) => proposal.status === 'Proposta aprovada');
  const pendingContractProposals = contractQueueProposals.filter((proposal) => !contracts.some((contract) => contract.proposalId === proposal.id));
  const selectedProposal = contractQueueProposals.find((proposal) => proposal.id === selectedProposalId) ?? null;
  const selectedContract = contracts.find((contract) => contract.id === selectedContractId) ?? null;
  const totalContracted = contracts.reduce((total, contract) => total + parseCurrency(contract.value), 0);
  const generatedContracts = contracts.filter((contract) => contract.status === 'Contrato gerado');
  const activeContracts = contracts.filter((contract) => contract.status === 'Vigente');

  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Etapa 05 - Jurídico e contratos</p>
          <h1>Contratos</h1>
          <p>Receba propostas fechadas pelo comercial, gere o contrato, defina condições de pagamento e libere o processo para execução somente quando o contrato estiver vigente.</p>
        </div>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Aguardando contrato</span><strong>{pendingContractProposals.length}</strong></article>
        <article className="mini-stat"><span>Contratos gerados</span><strong>{generatedContracts.length}</strong></article>
        <article className="mini-stat"><span>Contratos vigentes</span><strong>{activeContracts.length}</strong></article>
        <article className="mini-stat"><span>Total contratado</span><strong>{formatCurrency(totalContracted)}</strong></article>
      </div>

      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fila jurídica</p>
            <h2>Propostas para contrato</h2>
          </div>
        </div>
        <div className="contract-list contract-list-wide">
          {pendingContractProposals.map((proposal) => (
            <div className="contract-card contract-state-aguardando-contrato" key={proposal.id}>
              <div className="proposal-card-header">
                <div>
                  <strong>{proposal.processId}</strong>
                  <span>{proposal.client} - {proposal.property}</span>
                </div>
                <span className="status-chip contract-status-chip contract-status-aguardando-contrato">Aguardando contrato</span>
              </div>
              <p>{proposal.service}</p>
              <div className="proposal-info-grid">
                <span>Proposta <strong>{proposal.id}</strong></span>
                <span>Valor <strong>R$ {proposal.value}</strong></span>
                <span>Data aprovação <strong>{proposal.approvedAt ?? 'Aprovada'}</strong></span>
                <span>Telefone <strong>{proposal.clientPhone}</strong></span>
              </div>
              <button className="primary-button dark" type="button" onClick={() => onSelectProposal(proposal.id)}>
                <Scale size={17} /> Criar contrato
              </button>
            </div>
          ))}
          {pendingContractProposals.length === 0 ? <div className="empty-state">Não há propostas aguardando contrato.</div> : null}
        </div>
      </article>

      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Controle contratual</p>
            <h2>Contratos criados</h2>
          </div>
        </div>
        <div className="contract-list contract-list-wide">
          {contracts.map((contract) => (
            <div className={`contract-card contract-state-${getContractStatusClass(contract.status)}`} key={contract.id}>
              <div className="proposal-card-header">
                <div>
                  <strong>{contract.id}</strong>
                  <span>{contract.client}</span>
                </div>
                <span className={`status-chip contract-status-chip contract-status-${getContractStatusClass(contract.status)}`}>
                  {formatContractStatus(contract.status)}
                </span>
              </div>
              <p>{contract.service}</p>
              <div className="proposal-info-grid">
                <span>Proposta <strong>{contract.proposalId}</strong></span>
                <span>Processo <strong>{contract.processId}</strong></span>
                <span>Valor <strong>R$ {contract.value}</strong></span>
                <span>Data <strong>{contract.contractDate}</strong></span>
              </div>
              <div className="contract-actions">
                <button className="secondary-light-button" type="button" onClick={() => openContractPdf(contract)}>
                  <Eye size={16} /> Visualizar PDF
                </button>
                <button className="secondary-light-button" type="button" onClick={() => openContractPdf(contract, true)}>
                  <Download size={16} /> Baixar PDF
                </button>
                {contract.status !== 'Vigente' && contract.status !== 'Cancelado' ? (
                  <button className="primary-button dark" type="button" onClick={() => onActivateContract(contract.id)}>
                    <ClipboardCheck size={17} /> Ativar contrato
                  </button>
                ) : null}
                <button className="secondary-light-button" type="button" onClick={() => onSelectContract(contract.id)}>
                  <Pencil size={16} /> Editar
                </button>
              </div>
            </div>
          ))}
          {contracts.length === 0 ? <div className="empty-state">Os contratos criados aparecerão aqui após a geração pelo jurídico.</div> : null}
        </div>
      </article>

      {selectedProposal || selectedContract ? (
        <div className="modal-backdrop">
          <ContractModal
            proposal={selectedProposal}
            contract={selectedContract}
            contractsCount={contracts.length}
            onClose={onClose}
            onSave={onSave}
          />
        </div>
      ) : null}
    </section>
  );
}

function ContractModal({
  proposal,
  contract,
  contractsCount,
  onClose,
  onSave
}: {
  proposal: Proposal | null;
  contract: ContractRecord | null;
  contractsCount: number;
  onClose: () => void;
  onSave: (contract: ContractRecord) => void | Promise<void>;
}) {
  const source = contract ?? proposal;
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ContractRecord>(() => {
    if (contract) return contract;
    if (!proposal) {
      return {
        id: buildContractNumber(contractsCount),
        proposalId: '',
        processId: '',
        client: '',
        property: '',
        phone: '',
        city: '',
        service: '',
        value: '',
        paymentTerms: '',
        deadline: '',
        responsible: 'Jurídico',
        status: 'Contrato gerado',
        contractDate: new Date().toLocaleDateString('pt-BR'),
        approvalDate: '',
        expirationDate: '',
        contractorDocument: '',
        contractorAddress: '',
        contractorCity: '',
        contractorState: '',
        contractedCompany: defaultContractedCompany.name,
        contractedCnpj: defaultContractedCompany.cnpj,
        contractedAddress: defaultContractedCompany.address,
        contractedPhone: defaultContractedCompany.phone,
        objectClause: '',
        contractedObligations: '',
        contractorObligations: '',
        paymentClause: '',
        deadlineClause: '',
        terminationClause: '',
        jurisdictionClause: '',
        observations: '',
        signedFileName: ''
      };
    }
    return createContractDraft(proposal, contractsCount);
  });

  function update<K extends keyof ContractRecord>(field: K, value: ContractRecord[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const fileName = event.target.files?.[0]?.name ?? '';
    update('signedFileName', fileName);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextStatus: ContractStatus = form.status === 'Vigente' ? 'Vigente' : 'Contrato gerado';
    const generatedContract: ContractRecord = {
      ...form,
      status: nextStatus,
      generatedAt: form.generatedAt ?? new Date().toLocaleDateString('pt-BR')
    };
    setIsSaving(true);
    await onSave(generatedContract);
    setIsSaving(false);
    openContractPdf(generatedContract, true);
  }

  return (
    <form className="panel modal-card contract-modal" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Contrato vinculado à proposta aprovada</p>
          <h2>{form.id}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar contrato"><X size={18} /></button>
      </div>

      {source ? (
        <div className="proposal-process-summary">
          <div><span>Cliente</span><strong>{source.client}</strong></div>
          <div><span>Processo</span><strong>{source.processId}</strong></div>
          <div><span>Serviço</span><strong>{source.service}</strong></div>
          <div><span>Valor</span><strong>R$ {source.value}</strong></div>
        </div>
      ) : null}

      <div className="form-grid">
        <label>Número do contrato<input value={form.id} onChange={(event) => update('id', event.target.value)} /></label>
        <label>Data do contrato<input value={form.contractDate} onChange={(event) => update('contractDate', event.target.value)} placeholder="DD/MM/AAAA" /></label>
        <label>Responsável jurídico<input value={form.responsible} onChange={(event) => update('responsible', event.target.value)} /></label>
        <label>Vencimento / prazo contratual<input value={form.expirationDate} onChange={(event) => update('expirationDate', event.target.value)} placeholder="DD/MM/AAAA" /></label>
        <label>Contratante<input value={form.client} onChange={(event) => update('client', event.target.value)} /></label>
        <label>CPF/CNPJ<input value={form.contractorDocument} onChange={(event) => update('contractorDocument', event.target.value)} placeholder="Documento do cliente" /></label>
        <label>Telefone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
        <label>Propriedade / fazenda<input value={form.property} onChange={(event) => update('property', event.target.value)} /></label>
        <label>Endereço<input value={form.contractorAddress} onChange={(event) => update('contractorAddress', event.target.value)} /></label>
        <label>Município<input value={form.contractorCity} onChange={(event) => update('contractorCity', event.target.value)} /></label>
        <label>Estado<input value={form.contractorState} onChange={(event) => update('contractorState', event.target.value)} /></label>
        <label>Prazo do serviço<input value={form.deadline} onChange={(event) => update('deadline', event.target.value)} /></label>
        <label>Valor contratado<input value={form.value} onChange={(event) => update('value', event.target.value)} /></label>
      </div>

      <div className="contract-company-box">
        <div>
          <p className="eyebrow">Contratada</p>
          <strong>{form.contractedCompany}</strong>
          <span>CNPJ: {form.contractedCnpj}</span>
          <span>{form.contractedAddress} - {form.contractedPhone}</span>
        </div>
      </div>

      <div className="contract-clauses">
        <label className="wide-field">Cláusula primeira - Do objeto<textarea value={form.objectClause} onChange={(event) => update('objectClause', event.target.value)} /></label>
        <label className="wide-field">Cláusula segunda - Obrigações da contratada<textarea value={form.contractedObligations} onChange={(event) => update('contractedObligations', event.target.value)} /></label>
        <label className="wide-field">Cláusula terceira - Obrigações da contratante<textarea value={form.contractorObligations} onChange={(event) => update('contractorObligations', event.target.value)} /></label>
        <label className="wide-field">Cláusula quarta - Valor e pagamento<textarea value={form.paymentClause} onChange={(event) => update('paymentClause', event.target.value)} /></label>
        <label className="wide-field">Cláusula quinta - Prazo<textarea value={form.deadlineClause} onChange={(event) => update('deadlineClause', event.target.value)} /></label>
        <label className="wide-field">Cláusula sexta - Rescisão<textarea value={form.terminationClause} onChange={(event) => update('terminationClause', event.target.value)} /></label>
        <label className="wide-field">Cláusula sétima - Foro<textarea value={form.jurisdictionClause} onChange={(event) => update('jurisdictionClause', event.target.value)} /></label>
        <label className="wide-field">Observações internas<textarea value={form.observations} onChange={(event) => update('observations', event.target.value)} placeholder="Observações jurídicas internas..." /></label>
      </div>

      <div className="upload-dropzone compact real-upload">
        <UploadCloud size={22} />
        <strong>Contrato assinado</strong>
        <span>{form.signedFileName || 'Campo preparado para anexar o PDF assinado futuramente.'}</span>
        <label className="file-upload-button">Selecionar PDF<input type="file" accept=".pdf" onChange={handleFileChange} /></label>
      </div>

      <div className="analysis-footer">
        <div>
          <strong>{form.status === 'Vigente' ? 'Contrato vigente' : 'Contrato gerado'}</strong>
          <span>Após gerar o PDF, ative o contrato para liberar o processo na aba Execução.</span>
        </div>
        <div className="wizard-actions">
          <button type="button" className="secondary-light-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button dark" disabled={isSaving}>
            <Printer size={17} /> {isSaving ? 'Salvando...' : 'Gerar contrato PDF'}
          </button>
        </div>
      </div>
    </form>
  );
}

function ExecutionView({
  clients,
  processes,
  contracts,
  financialRecords,
  records,
  documents,
  selectedProcessId,
  onSelectProcess,
  onClose,
  onAddOfficeAction,
  onAddFieldVisit,
  onAddCustomTask,
  onUpdateTask,
  onUpdateNotes,
  onUpdateFieldChecklist,
  onAttachDocuments,
  onDeleteDocument
}: {
  clients: Client[];
  processes: EnvironmentalProcess[];
  contracts: ContractRecord[];
  financialRecords: FinancialRecord[];
  records: ExecutionRecord[];
  documents: DocumentRecord[];
  selectedProcessId: string | null;
  onSelectProcess: (processId: string) => void;
  onClose: () => void;
  onAddOfficeAction: (processId: string, action: OfficeAction) => void;
  onAddFieldVisit: (processId: string, visit: FieldVisit) => void;
  onAddCustomTask: (processId: string, task: ExecutionTask) => void;
  onUpdateTask: (processId: string, task: ExecutionTask) => void;
  onUpdateNotes: (processId: string, notes: string) => void;
  onUpdateFieldChecklist: (processId: string, item: FieldChecklistItem) => void;
  onAttachDocuments: (process: EnvironmentalProcess, fileItems: DocumentUploadItem[], category: string) => void | Promise<void>;
  onDeleteDocument: (documentId: string) => boolean | void | Promise<boolean | void>;
}) {
  const releasedFinancialRecords = financialRecords.filter((record) => Boolean(record.releasedAt));
  const activeContractProcessIds = contracts
    .filter((contract) => contract.status !== 'Cancelado' && releasedFinancialRecords.some((record) => record.contractId === contract.id))
    .map((contract) => contract.processId);
  const executionProcesses = processes.filter((process) => activeContractProcessIds.includes(process.id));
  const executionFinanceByProcess = new Map(releasedFinancialRecords.map((record) => [record.processId, record]));
  const selectedProcess = executionProcesses.find((process) => process.id === selectedProcessId) ?? null;
  const selectedRecord = selectedProcess ? records.find((record) => record.processId === selectedProcess.id) ?? createDefaultExecutionRecord(selectedProcess.id) : null;
  const executionRecords = executionProcesses.map((process) => records.find((record) => record.processId === process.id) ?? createDefaultExecutionRecord(process.id));
  const allTasks = executionRecords.flatMap((record) => record.tasks ?? createDefaultExecutionTasks());
  const officeCount = allTasks.filter((task) => task.status !== 'Não iniciado' && task.status !== 'Não se aplica').length;
  const fieldCount = executionRecords.reduce((total, record) => total + (record.fieldChecklist ?? defaultFieldChecklist).filter((item) => item.status !== 'Não iniciado').length, 0);
  const waitingApprovalCount = allTasks.filter((task) => task.status === 'Aguardando aprovação').length;
  const pendingDocumentsCount = allTasks.filter((task) => task.status === 'Pendente documentação').length;
  const completedCount = allTasks.filter((task) => task.status === 'Concluído' || task.status === 'Aprovado' || task.status === 'Cliente já possui').length;

  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Etapa 05 - Execução dos serviços</p>
          <h1>Execução</h1>
          <p>Organize o trabalho do técnico escritório e do técnico campo somente depois que o contrato estiver vigente e o financeiro confirmar a entrada.</p>
        </div>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Processos em execução</span><strong>{executionProcesses.length}</strong></article>
        <article className="mini-stat"><span>Ações de escritório</span><strong>{officeCount}</strong></article>
        <article className="mini-stat"><span>Fichas de campo</span><strong>{fieldCount}</strong></article>
        <article className="mini-stat"><span>Aguardando aprovação</span><strong>{waitingApprovalCount}</strong></article>
        <article className="mini-stat"><span>Pendências documentais</span><strong>{pendingDocumentsCount}</strong></article>
        <article className="mini-stat"><span>Concluídos</span><strong>{completedCount}</strong></article>
      </div>

      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Operação técnica</p>
            <h2>Processos liberados para execução</h2>
          </div>
        </div>
        <div className="execution-process-grid">
          {executionProcesses.map((process) => (
            <button className="technical-process-card" key={process.id} type="button" onClick={() => onSelectProcess(process.id)}>
              <div>
                <strong>{process.id}</strong>
                <span>{process.client} - {process.property}</span>
              </div>
              <p>{process.service}</p>
              <div className="process-card-grid">
                <small>Responsável: {process.owner}</small>
                <small>Prazo: {process.dueDate}</small>
              </div>
              {executionFinanceByProcess.get(process.id) ? (
                <div className="execution-release-box">
                  <span>Liberado pelo financeiro em: <strong>{executionFinanceByProcess.get(process.id)?.releasedAt}</strong></span>
                  <span>Entrada confirmada: <strong>{formatCurrency(executionFinanceByProcess.get(process.id)?.receivedAmount ?? 0)}</strong></span>
                  <span>Forma de pagamento: <strong>{executionFinanceByProcess.get(process.id)?.paymentMethod}</strong></span>
                  <span>Status: <strong>Liberado para execução</strong></span>
                </div>
              ) : null}
              <div className="open-analysis-hint">Abrir execução</div>
            </button>
          ))}
          {executionProcesses.length === 0 ? (
            <div className="empty-state">Quando o financeiro confirmar a entrada de um contrato vigente, o processo aparecerá aqui.</div>
          ) : null}
        </div>
      </article>

      {selectedProcess && selectedRecord ? (
        <div className="modal-backdrop">
          <ExecutionModal
            process={selectedProcess}
            record={selectedRecord}
            client={clients.find((client) => client.name === selectedProcess.client) ?? null}
            finance={executionFinanceByProcess.get(selectedProcess.id) ?? null}
            documents={documents.filter((document) => document.processId === selectedProcess.id || document.client === selectedProcess.client)}
            onClose={onClose}
            onAddOfficeAction={onAddOfficeAction}
            onAddFieldVisit={onAddFieldVisit}
            onAddCustomTask={onAddCustomTask}
            onUpdateTask={onUpdateTask}
            onUpdateNotes={onUpdateNotes}
            onUpdateFieldChecklist={onUpdateFieldChecklist}
            onAttachDocuments={onAttachDocuments}
            onDeleteDocument={onDeleteDocument}
          />
        </div>
      ) : null}
    </section>
  );
}

function ExecutionModal({
  process,
  record,
  client,
  finance,
  documents,
  onClose,
  onAddOfficeAction,
  onAddFieldVisit,
  onAddCustomTask,
  onUpdateTask,
  onUpdateNotes,
  onUpdateFieldChecklist,
  onAttachDocuments,
  onDeleteDocument
}: {
  process: EnvironmentalProcess;
  record: ExecutionRecord;
  client: Client | null;
  finance: FinancialRecord | null;
  documents: DocumentRecord[];
  onClose: () => void;
  onAddOfficeAction: (processId: string, action: OfficeAction) => void;
  onAddFieldVisit: (processId: string, visit: FieldVisit) => void;
  onAddCustomTask: (processId: string, task: ExecutionTask) => void;
  onUpdateTask: (processId: string, task: ExecutionTask) => void;
  onUpdateNotes: (processId: string, notes: string) => void;
  onUpdateFieldChecklist: (processId: string, item: FieldChecklistItem) => void;
  onAttachDocuments: (process: EnvironmentalProcess, fileItems: DocumentUploadItem[], category: string) => void | Promise<void>;
  onDeleteDocument: (documentId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'office' | 'field'>('office');

  return (
    <article className="panel modal-card execution-modal">
      <div className="process-detail-header">
        <div>
          <p className="eyebrow">Execução dos serviços</p>
          <h2>{process.id}</h2>
          <span>{process.client} - {process.property}</span>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar execução"><X size={18} /></button>
      </div>

      <div className="execution-header-grid">
        <div><span>Cliente</span><strong>{process.client}</strong></div>
        <div><span>CPF/CNPJ</span><strong>{client?.document ?? 'Não informado'}</strong></div>
        <div><span>Propriedade</span><strong>{process.property}</strong></div>
        <div><span>Serviço</span><strong>{process.service}</strong></div>
        <div><span>Responsável</span><strong>{process.owner}</strong></div>
        <div><span>Status geral</span><strong>Liberado para execução</strong></div>
        <div><span>Liberado pelo financeiro em</span><strong>{finance?.releasedAt ?? 'Não informado'}</strong></div>
        <div><span>Entrada confirmada</span><strong>{formatCurrency(finance?.receivedAmount ?? 0)}</strong></div>
        <div><span>Prazo previsto</span><strong>{process.dueDate}</strong></div>
      </div>

      <div className="execution-tabs">
        <button className={activeTab === 'office' ? 'step-tab active' : 'step-tab'} type="button" onClick={() => setActiveTab('office')}>
          <span>01</span><strong>Técnico escritório</strong>
        </button>
        <button className={activeTab === 'field' ? 'step-tab active' : 'step-tab'} type="button" onClick={() => setActiveTab('field')}>
          <span>02</span><strong>Técnico campo</strong>
        </button>
      </div>

      {activeTab === 'office' ? (
        <OfficeExecutionPanel
          process={process}
          record={record}
          documents={documents}
          onAdd={onAddOfficeAction}
          onAddCustomTask={onAddCustomTask}
          onUpdateTask={onUpdateTask}
          onUpdateNotes={onUpdateNotes}
          onAttachDocuments={onAttachDocuments}
          onDeleteDocument={onDeleteDocument}
        />
      ) : (
        <FieldExecutionPanel
          process={process}
          record={record}
          documents={documents}
          onAdd={onAddFieldVisit}
          onUpdateFieldChecklist={onUpdateFieldChecklist}
          onAttachDocuments={onAttachDocuments}
          onDeleteDocument={onDeleteDocument}
        />
      )}
    </article>
  );
}

function OfficeExecutionPanel({
  process,
  record,
  documents,
  onAdd,
  onAddCustomTask,
  onUpdateTask,
  onUpdateNotes,
  onAttachDocuments,
  onDeleteDocument
}: {
  process: EnvironmentalProcess;
  record: ExecutionRecord;
  documents: DocumentRecord[];
  onAdd: (processId: string, action: OfficeAction) => void;
  onAddCustomTask: (processId: string, task: ExecutionTask) => void;
  onUpdateTask: (processId: string, task: ExecutionTask) => void;
  onUpdateNotes: (processId: string, notes: string) => void;
  onAttachDocuments: (process: EnvironmentalProcess, fileItems: DocumentUploadItem[], category: string) => void | Promise<void>;
  onDeleteDocument: (documentId: string) => boolean | void | Promise<boolean | void>;
}) {
  const tasks = record.tasks ?? createDefaultExecutionTasks();
  const [filter, setFilter] = useState<'Todos' | 'Pendentes' | 'Em andamento' | 'Aguardando aprovação' | 'Concluídos' | 'Rejeitados'>('Todos');
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? '');
  const [editingTask, setEditingTask] = useState<ExecutionTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [internalNotes, setInternalNotes] = useState(record.internalNotes ?? '');
  const [form, setForm] = useState<OfficeAction>({
    type: '',
    agency: '',
    protocol: '',
    date: new Date().toLocaleDateString('pt-BR'),
    responsible: '',
    description: '',
    status: 'Em andamento'
  });

  function update<K extends keyof OfficeAction>(field: K, value: OfficeAction[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd(process.id, form);
    setForm({ type: '', agency: '', protocol: '', date: new Date().toLocaleDateString('pt-BR'), responsible: '', description: '', status: 'Em andamento' });
  }

  const completedTasks = tasks.filter((task) => ['Concluído', 'Aprovado', 'Cliente já possui', 'Não se aplica'].includes(task.status)).length;
  const progress = Math.round((completedTasks / Math.max(tasks.length, 1)) * 100);
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'Todos') return true;
    if (filter === 'Pendentes') return task.status === 'Pendente documentação' || task.status === 'Não iniciado';
    if (filter === 'Concluídos') return task.status === 'Concluído' || task.status === 'Aprovado' || task.status === 'Cliente já possui';
    if (filter === 'Rejeitados') return task.status === 'Rejeitado';
    return task.status === filter;
  });
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];

  function saveNotes() {
    onUpdateNotes(process.id, internalNotes);
  }

  function removeTaskAttachment(task: ExecutionTask, fileName: string) {
    const relatedDocument = documents.find((document) => document.processId === process.id && document.fileName === fileName);
    if (relatedDocument) {
      const deleted = onDeleteDocument(relatedDocument.id);
      if (deleted === false) return;
    } else {
      const shouldDelete = window.confirm('Deseja excluir este anexo da etapa?');
      if (!shouldDelete) return;
    }
    onUpdateTask(process.id, {
      ...task,
      attachments: task.attachments.filter((attachment) => attachment !== fileName),
      updatedAt: new Date().toLocaleDateString('pt-BR')
    });
  }

  return (
    <div className="execution-workspace">
      <div className="execution-main-column">
        <section className="execution-progress-panel">
          <div>
            <p className="eyebrow">Controle documental e cadastros</p>
            <h3>Progresso documental: {progress}%</h3>
          </div>
          <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
          <div className="execution-progress-grid">
            <span>{tasks.length} etapas</span>
            <span>{completedTasks} concluídas</span>
            <span>{tasks.filter((task) => task.status === 'Em andamento').length} em andamento</span>
            <span>{tasks.filter((task) => task.status === 'Aguardando aprovação').length} aguardando aprovação</span>
            <span>{tasks.filter((task) => task.status === 'Pendente documentação').length} pendentes</span>
          </div>
        </section>

        <div className="followup-filters execution-filters">
          {(['Todos', 'Pendentes', 'Em andamento', 'Aguardando aprovação', 'Concluídos', 'Rejeitados'] as const).map((item) => (
            <button className={filter === item ? 'filter-chip active' : 'filter-chip'} type="button" onClick={() => setFilter(item)} key={item}>{item}</button>
          ))}
          <button className="filter-chip execution-add-task-button" type="button" onClick={() => setIsAddingTask(true)}>
            <FilePlus size={15} /> Nova etapa
          </button>
        </div>

        <div className="execution-task-grid">
          {filteredTasks.map((task) => (
            <article className={`execution-task-card status-${getExecutionStatusClass(task.status)}`} key={task.id} onClick={() => setSelectedTaskId(task.id)}>
              <div className="execution-task-header">
                <div>
                  <strong>{task.title}</strong>
                  <span className={`execution-status status-${getExecutionStatusClass(task.status)}`}>{task.status}</span>
                </div>
                <button type="button" className="secondary-light-button" onClick={(event) => { event.stopPropagation(); setEditingTask(task); }}><Pencil size={16} /> Atualizar etapa</button>
              </div>
              <div className="execution-task-details">
                <span>Responsável <strong>{task.responsible || 'Técnico escritório'}</strong></span>
                <span>Atualização <strong>{task.updatedAt || 'Sem data'}</strong></span>
                <span>Protocolo <strong>{task.protocol || 'Não informado'}</strong></span>
                <span>Login <strong>{task.login || 'Não informado'}</strong></span>
                <span>Senha <strong>{task.password ? '********' : 'Não informada'}</strong></span>
              </div>
              <p>{task.observation || 'Sem observações registradas.'}</p>
              {task.attachments.length > 0 ? (
                <div className="task-attachment-list">
                  {task.attachments.map((fileName) => (
                    <div className="task-attachment-row" key={`${task.id}-${fileName}`}>
                      <FileText size={14} />
                      <span>{fileName}</span>
                      <button type="button" className="danger" onClick={(event) => { event.stopPropagation(); removeTaskAttachment(task, fileName); }} aria-label={`Excluir ${fileName}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="execution-task-actions">
                <label className="secondary-light-button">
                  <UploadCloud size={16} /> Anexar arquivo
                  <input multiple type="file" onChange={(event) => {
                    const fileItems = Array.from(event.target.files ?? []);
                    const fileNames = fileItems.map((file) => file.name);
                    onAttachDocuments(process, fileItems, 'Protocolos');
                    if (fileNames.length) onUpdateTask(process.id, { ...task, attachments: [...task.attachments, ...fileNames], updatedAt: new Date().toLocaleDateString('pt-BR') });
                    event.target.value = '';
                  }} />
                </label>
                <span>{task.attachments.length} anexo(s)</span>
              </div>
            </article>
          ))}
        </div>

        <section className="execution-suggested-box">
          <p className="eyebrow">Documentos sugeridos</p>
          <h3>{selectedTask?.title ?? 'Etapa operacional'}</h3>
          <div className="suggested-document-list">
            {(selectedTask?.suggestedDocuments ?? []).map((documentName) => (
              <span key={documentName}>{documentName}</span>
            ))}
          </div>
          <div className="execution-alert-list">
            {(selectedTask?.suggestedDocuments ?? []).filter((category) => !documents.some((document) => normalizeText(document.category).includes(normalizeText(category)) || normalizeText(document.name).includes(normalizeText(category)))).slice(0, 4).map((category) => (
              <strong key={category}>Atenção: {category} não encontrado</strong>
            ))}
          </div>
        </section>

        <section className="execution-notes-panel">
          <p className="eyebrow">Observações internas</p>
          <textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} placeholder="Cliente já possui cadastro, senha divergente, aguardando documentação..." />
          <button type="button" className="primary-button dark" onClick={saveNotes}>Salvar observações</button>
        </section>

        <div className="execution-history-layout">
          <ExecutionList title="Histórico operacional" items={(record.history ?? []).map((item) => ({ title: item.action, meta: `${item.date} - ${item.responsible}`, description: item.observation }))} />
          <form className="technical-analysis-form compact-form" onSubmit={submit}>
            <div className="analysis-heading">
              <div>
                <p className="eyebrow">Registro livre</p>
                <h3>Ação técnica avulsa</h3>
              </div>
              <ClipboardCheck size={22} />
            </div>
            <div className="form-grid">
              <label>Tipo da ação<input value={form.type} onChange={(event) => update('type', event.target.value)} placeholder="Cadastro, protocolo, e-mail..." /></label>
              <label>Órgão / sistema<input value={form.agency} onChange={(event) => update('agency', event.target.value)} placeholder="Naturatins, IBAMA, ANA..." /></label>
              <label>Protocolo<input value={form.protocol} onChange={(event) => update('protocol', event.target.value)} placeholder="Número ou observação" /></label>
              <label>Data<input value={form.date} onChange={(event) => update('date', event.target.value)} /></label>
              <label>Responsável<input value={form.responsible} onChange={(event) => update('responsible', event.target.value)} placeholder="Técnico responsável" /></label>
              <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value as OfficeAction['status'])}><option>Pendente</option><option>Em andamento</option><option>Concluído</option></select></label>
              <label className="wide-field">Descrição<textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Descreva uma movimentação fora dos cards principais" /></label>
            </div>
            <div className="form-actions"><span /><button className="primary-button dark" type="submit">Salvar ação</button></div>
          </form>
        </div>
      </div>

      <ExecutionDocumentsCentral process={process} documents={documents} onAttachDocuments={onAttachDocuments} onDeleteDocument={onDeleteDocument} />

      {editingTask ? (
        <div className="modal-backdrop nested-modal">
          <ExecutionTaskModal
            task={editingTask}
            process={process}
            onAttachDocuments={onAttachDocuments}
            onClose={() => setEditingTask(null)}
            onSave={(task) => { onUpdateTask(process.id, task); setEditingTask(null); }}
          />
        </div>
      ) : null}
      {isAddingTask ? (
        <div className="modal-backdrop nested-modal">
          <CustomExecutionTaskModal
            existingTasks={tasks}
            onClose={() => setIsAddingTask(false)}
            onSave={(task) => {
              onAddCustomTask(process.id, task);
              setSelectedTaskId(task.id);
              setIsAddingTask(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function CustomExecutionTaskModal({
  existingTasks,
  onClose,
  onSave
}: {
  existingTasks: ExecutionTask[];
  onClose: () => void;
  onSave: (task: ExecutionTask) => void;
}) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Informe o nome da etapa.');
      return;
    }
    if (existingTasks.some((task) => normalizeText(task.title) === normalizeText(trimmedTitle))) {
      setError('Já existe uma etapa com esse nome neste processo.');
      return;
    }

    onSave({
      id: createCustomExecutionTaskId(trimmedTitle),
      title: trimmedTitle,
      status: 'Não iniciado',
      responsible: 'Técnico escritório',
      updatedAt: new Date().toLocaleDateString('pt-BR'),
      protocol: '',
      login: '',
      password: '',
      observation: '',
      attachments: [],
      suggestedDocuments: []
    });
  }

  return (
    <form className="panel modal-card custom-execution-task-modal" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Formulário personalizado</p>
          <h2>Nova etapa</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar nova etapa"><X size={18} /></button>
      </div>
      <label>Nome da etapa/formulário<input value={title} onChange={(event) => { setTitle(event.target.value); setError(''); }} placeholder="Licença de Operação" autoFocus /></label>
      {error ? <p className="form-error-text">{error}</p> : null}
      <div className="form-actions">
        <button className="secondary-light-button" type="button" onClick={onClose}>Cancelar</button>
        <button className="primary-button dark" type="submit">Salvar etapa</button>
      </div>
    </form>
  );
}

function FieldExecutionPanel({
  process,
  record,
  documents,
  onAdd,
  onUpdateFieldChecklist,
  onAttachDocuments,
  onDeleteDocument
}: {
  process: EnvironmentalProcess;
  record: ExecutionRecord;
  documents: DocumentRecord[];
  onAdd: (processId: string, visit: FieldVisit) => void;
  onUpdateFieldChecklist: (processId: string, item: FieldChecklistItem) => void;
  onAttachDocuments: (process: EnvironmentalProcess, fileItems: DocumentUploadItem[], category: string) => void | Promise<void>;
  onDeleteDocument: (documentId: string) => boolean | void | Promise<boolean | void>;
}) {
  const visits = record.fieldVisits;
  const checklist = record.fieldChecklist ?? defaultFieldChecklist;
  const [form, setForm] = useState<FieldVisit>({
    date: new Date().toLocaleDateString('pt-BR'),
    responsible: '',
    location: '',
    coordinates: '',
    notes: '',
    checklist: '',
    status: 'Agendada'
  });

  function update<K extends keyof FieldVisit>(field: K, value: FieldVisit[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd(process.id, form);
    setForm({ date: new Date().toLocaleDateString('pt-BR'), responsible: '', location: '', coordinates: '', notes: '', checklist: '', status: 'Agendada' });
  }

  function removeFieldAttachment(item: FieldChecklistItem, fileName: string) {
    const relatedDocument = documents.find((document) => document.processId === process.id && document.fileName === fileName);
    if (relatedDocument) {
      const deleted = onDeleteDocument(relatedDocument.id);
      if (deleted === false) return;
    } else {
      const shouldDelete = window.confirm('Deseja excluir este anexo de campo?');
      if (!shouldDelete) return;
    }
    onUpdateFieldChecklist(process.id, {
      ...item,
      attachments: item.attachments.filter((attachment) => attachment !== fileName)
    });
  }

  return (
    <div className="field-execution-layout">
      <section className="panel-soft">
        <p className="eyebrow">Checklist de campo</p>
        <h3>Controle rápido da visita</h3>
        <div className="field-checklist-grid">
          {checklist.map((item) => (
            <article className={`field-check-card status-${getExecutionStatusClass(item.status)}`} key={item.id}>
              <strong>{item.title}</strong>
              <select value={item.status} onChange={(event) => onUpdateFieldChecklist(process.id, { ...item, status: event.target.value as FieldChecklistItem['status'] })}>
                <option>Não iniciado</option>
                <option>Em andamento</option>
                <option>Concluído</option>
                <option>Pendente</option>
              </select>
              <textarea value={item.observation} onChange={(event) => onUpdateFieldChecklist(process.id, { ...item, observation: event.target.value })} placeholder="Observação do item..." />
              <label className="secondary-light-button">
                <UploadCloud size={15} /> Anexos
                <input multiple type="file" onChange={(event) => {
                  const fileItems = Array.from(event.target.files ?? []);
                  const fileNames = fileItems.map((file) => file.name);
                  if (fileNames.length) {
                    onAttachDocuments(process, fileItems, 'Anexos do processo');
                    onUpdateFieldChecklist(process.id, { ...item, attachments: [...item.attachments, ...fileNames] });
                  }
                  event.target.value = '';
                }} />
              </label>
              {item.attachments.length > 0 ? (
                <div className="task-attachment-list compact">
                  {item.attachments.map((fileName) => (
                    <div className="task-attachment-row" key={`${item.id}-${fileName}`}>
                      <FileText size={14} />
                      <span>{fileName}</span>
                      <button type="button" className="danger" onClick={() => removeFieldAttachment(item, fileName)} aria-label={`Excluir ${fileName}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <small>{item.attachments.length} anexo(s)</small>
            </article>
          ))}
        </div>
      </section>

      <form className="technical-analysis-form" onSubmit={submit}>
        <div className="analysis-heading">
          <div>
            <p className="eyebrow">Departamento técnico campo</p>
            <h3>Ficha de campo</h3>
          </div>
          <MapPin size={24} />
        </div>
        <div className="form-grid">
          <label>Data da visita<input value={form.date} onChange={(event) => update('date', event.target.value)} /></label>
          <label>Responsável campo<input value={form.responsible} onChange={(event) => update('responsible', event.target.value)} placeholder="Técnico de campo" /></label>
          <label>Local visitado<input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Propriedade ou referência" /></label>
          <label>Coordenadas<input value={form.coordinates} onChange={(event) => update('coordinates', event.target.value)} placeholder="-15.0000, -43.0000" /></label>
          <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value as FieldVisit['status'])}><option>Agendada</option><option>Realizada</option><option>Pendente</option></select></label>
          <label className="wide-field">Checklist<textarea value={form.checklist} onChange={(event) => update('checklist', event.target.value)} placeholder="Fotos, coordenadas, anotações, documentos coletados..." /></label>
          <label className="wide-field">Anotações<textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Registre informações coletadas in loco" /></label>
        </div>
        <div className="upload-dropzone compact real-upload">
          <UploadCloud size={22} />
          <strong>Anexar fotos e documentos de campo</strong>
          <span>Área preparada para fotos, documentos e registros da visita.</span>
          <label className="file-upload-button">Selecionar arquivos<input multiple type="file" accept="image/*,.pdf,.doc,.docx" /></label>
        </div>
        <div className="form-actions"><span /><button className="primary-button dark" type="submit">Salvar ficha de campo</button></div>
      </form>

      <ExecutionList title="Visitas registradas" items={visits.map((visit) => ({ title: visit.location || 'Visita técnica', meta: `${visit.date} - ${visit.status}`, description: `${visit.responsible} ${visit.coordinates ? '- ' + visit.coordinates : ''} ${visit.notes}` }))} />
    </div>
  );
}

function ExecutionTaskModal({
  task,
  process,
  onAttachDocuments,
  onClose,
  onSave
}: {
  task: ExecutionTask;
  process: EnvironmentalProcess;
  onAttachDocuments: (process: EnvironmentalProcess, fileItems: DocumentUploadItem[], category: string) => void | Promise<void>;
  onClose: () => void;
  onSave: (task: ExecutionTask) => void;
}) {
  const [form, setForm] = useState<ExecutionTask>({ ...task });

  function update<K extends keyof ExecutionTask>(field: K, value: ExecutionTask[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ ...form, updatedAt: form.updatedAt || new Date().toLocaleDateString('pt-BR') });
  }

  return (
    <form className="panel modal-card task-update-modal" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Atualizar etapa</p>
          <h2>{task.title}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar atualização"><X size={18} /></button>
      </div>
      <div className="form-grid">
        <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value as ExecutionTaskStatus)}>{executionTaskStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Login<input value={form.login} onChange={(event) => update('login', event.target.value)} placeholder="Login usado no órgão/sistema" /></label>
        <label>Senha<input value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="Senha ou referência segura" /></label>
        <label>Protocolo<input value={form.protocol} onChange={(event) => update('protocol', event.target.value)} placeholder="Número de protocolo" /></label>
        <label>Data da ação<input value={form.updatedAt} onChange={(event) => update('updatedAt', event.target.value)} /></label>
        <label>Responsável<input value={form.responsible} onChange={(event) => update('responsible', event.target.value)} /></label>
        <label className="wide-field">Observação<textarea value={form.observation} onChange={(event) => update('observation', event.target.value)} placeholder="Aguardando órgão, pendência documental, cliente já possui cadastro..." /></label>
      </div>
      <div className="upload-dropzone compact real-upload">
        <UploadCloud size={22} />
        <strong>Anexar arquivos da etapa</strong>
        <span>Os nomes ficam vinculados ao card até a conexão com o Storage.</span>
        <label className="file-upload-button">Selecionar arquivos<input multiple type="file" onChange={(event) => {
          const fileItems = Array.from(event.target.files ?? []);
          const fileNames = fileItems.map((file) => file.name);
          if (fileNames.length) {
            onAttachDocuments(process, fileItems, 'Protocolos');
            update('attachments', [...form.attachments, ...fileNames]);
          }
          event.target.value = '';
        }} /></label>
      </div>
      <div className="analysis-footer">
        <span>{form.attachments.length} anexo(s) nesta etapa</span>
        <div className="wizard-actions">
          <button type="button" className="secondary-light-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button dark">Salvar etapa</button>
        </div>
      </div>
    </form>
  );
}

function ExecutionDocumentsCentral({
  process,
  documents,
  onAttachDocuments,
  onDeleteDocument
}: {
  process: EnvironmentalProcess;
  documents: DocumentRecord[];
  onAttachDocuments: (process: EnvironmentalProcess, fileItems: DocumentUploadItem[], category: string) => void | Promise<void>;
  onDeleteDocument: (documentId: string) => void;
}) {
  function getCategoryDocuments(category: string) {
    if (category === 'Outros da propriedade') {
      return documents.filter((document) => document.category === 'Outros documentos' && document.propertyName === process.property);
    }
    if (category === 'Comprovante financeiro') {
      return documents.filter((document) => document.category === 'Comprovantes financeiros');
    }
    if (category === 'Licenças') {
      return documents.filter((document) => normalizeText(document.category).includes('licenca') || normalizeText(document.name).includes('licenca'));
    }
    return documents.filter((document) => normalizeText(document.category) === normalizeText(category) || normalizeText(document.name).includes(normalizeText(category)));
  }

  const totalDocuments = documents.length;
  const pendingCategories = executionDocumentSections.reduce((total, section) => total + section.categories.filter((category) => getCategoryDocuments(category).length === 0).length, 0);

  return (
    <aside className="execution-documents-central">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Central de documentos</p>
          <h3>{totalDocuments} arquivo(s)</h3>
          <span>{pendingCategories} pasta(s) sem documento.</span>
        </div>
      </div>
      {executionDocumentSections.map((section) => (
        <section className="execution-document-section" key={section.title}>
          <p className="eyebrow">{section.title}</p>
          <div className="execution-document-folder-list">
            {section.categories.map((category) => (
              <DocumentFolderCard
                category={category}
                context={section.title.replace('Documentos ', '')}
                documents={getCategoryDocuments(category)}
                key={`${section.title}-${category}`}
                onFileChange={(event) => {
                  const fileItems = Array.from(event.target.files ?? []);
                  onAttachDocuments(process, fileItems, category === 'Outros da propriedade' ? 'Outros documentos' : category);
                  event.target.value = '';
                }}
                onDeleteDocument={onDeleteDocument}
              />
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}

function ExecutionList({ title, items }: { title: string; items: Array<{ title: string; meta: string; description: string }> }) {
  return (
    <div className="execution-list">
      <p className="eyebrow">{title}</p>
      {items.map((item, index) => (
        <div className="execution-list-item" key={item.title + index}>
          <strong>{item.title}</strong>
          <span>{item.meta}</span>
          <p>{item.description}</p>
        </div>
      ))}
      {items.length === 0 ? <div className="empty-state">Nenhum registro ainda.</div> : null}
    </div>
  );
}

function FinancialView({
  records,
  contracts,
  proposals,
  onUpdateRecord
}: {
  records: FinancialRecord[];
  contracts: ContractRecord[];
  proposals: Proposal[];
  onUpdateRecord: (recordId: string, updates: Partial<FinancialRecord>) => Promise<void>;
}) {
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const contractRecords = contracts.filter((contract) => contract.status !== 'Cancelado').map((contract) => {
    const existing = records.find((record) => record.proposalId === contract.proposalId);
    const proposal = proposals.find((item) => item.id === contract.proposalId);
    const entryPercentage = proposal?.entryPercentage ?? 50;
    const entryAmount = parseCurrency(contract.value) * (entryPercentage / 100);
    const remainingAmount = parseCurrency(contract.value) - entryAmount;
    return existing ?? {
      id: 'REC-' + contract.id.replace('CONT', ''),
      contractDbId: contract.dbId,
      proposalDbId: contract.proposalDbId,
      processDbId: contract.processDbId,
      clientDbId: contract.clientDbId,
      contractId: contract.id,
      proposalId: contract.proposalId,
      processId: contract.processId,
      client: contract.client,
      service: contract.service,
      amount: parseCurrency(contract.value),
      entryPercentage,
      entryAmount,
      remainingAmount,
      dueDate: 'A definir',
      paymentStatus: 'Aberto' as FinancialRecord['paymentStatus'],
      financialStatus: 'Aguardando entrada' as FinancialRecord['financialStatus'],
      receivedAmount: 0,
      paymentMethod: '',
      paidAt: '',
      releasedAt: '',
      invoiceNumber: '',
      invoiceStatus: 'Não emitida' as FinancialRecord['invoiceStatus'],
      notes: ''
    };
  });
  const awaitingEntry = contractRecords.filter((record) => record.financialStatus === 'Aguardando entrada');
  const releasedRecords = contractRecords.filter((record) => Boolean(record.releasedAt));
  const expectedEntries = contractRecords
    .filter((record) => record.financialStatus === 'Aguardando entrada')
    .reduce((total, record) => total + record.entryAmount, 0);
  const confirmedEntries = contractRecords.reduce((total, record) => total + record.receivedAmount, 0);

  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Etapa 05 - Financeiro</p>
          <h1>Financeiro</h1>
          <p>Confirme a entrada inicial dos contratos criados pelo jurídico e libere os processos para execução somente após a validação financeira.</p>
        </div>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Aguardando entrada</span><strong>{awaitingEntry.length}</strong></article>
        <article className="mini-stat"><span>Liberados para execução</span><strong>{releasedRecords.length}</strong></article>
        <article className="mini-stat"><span>Entradas previstas</span><strong>{formatCurrency(expectedEntries)}</strong></article>
        <article className="mini-stat"><span>Entradas confirmadas</span><strong>{formatCurrency(confirmedEntries)}</strong></article>
      </div>

      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Validação financeira</p>
            <h2>Contratos aguardando confirmação</h2>
          </div>
        </div>
        <div className="finance-list finance-list-grid">
          {contractRecords.map((record) => (
            <div className={`finance-card finance-state-${getFinancialStatusClass(record.financialStatus)}`} key={record.id}>
              <div className="proposal-card-header">
                <div>
                  <strong>{record.client}</strong>
                  <span>{record.contractId} - {record.proposalId}</span>
                </div>
                <span className={`status-chip finance-status-chip finance-status-${getFinancialStatusClass(record.financialStatus)}`}>
                  {record.financialStatus}
                </span>
              </div>
              <p>{record.service}</p>
              <div className="finance-card-grid">
                <span>Valor total <strong>{formatCurrency(record.amount)}</strong></span>
                <span>Entrada {record.entryPercentage}% <strong>{formatCurrency(record.entryAmount)}</strong></span>
                <span>Restante <strong>{formatCurrency(record.remainingAmount)}</strong></span>
                <span>Data do contrato <strong>{contracts.find((contract) => contract.id === record.contractId)?.contractDate ?? 'A definir'}</strong></span>
              </div>
              {record.financialStatus === 'Aguardando entrada' ? (
                <button className="primary-button dark" type="button" onClick={() => setSelectedRecord(record)}>
                  <BadgeDollarSign size={17} /> Confirmar pagamento inicial
                </button>
              ) : (
                <div className="finance-release-summary">
                  <span>Liberado em: <strong>{record.releasedAt}</strong></span>
                  <span>Recebido: <strong>{formatCurrency(record.receivedAmount)}</strong></span>
                  <span>Forma: <strong>{record.paymentMethod}</strong></span>
                </div>
              )}
            </div>
          ))}
          {contractRecords.length === 0 ? <div className="empty-state">Quando o jurídico criar um contrato, a validação financeira aparecerá aqui.</div> : null}
        </div>
      </article>

      {selectedRecord ? (
        <div className="modal-backdrop">
          <PaymentConfirmationModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onConfirm={async (updates) => {
              await onUpdateRecord(selectedRecord.id, updates);
              setSelectedRecord(null);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}

function getFinancialStatusClass(status: FinancialRecord['financialStatus']) {
  return status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace('/', '-');
}

function PaymentConfirmationModal({
  record,
  onClose,
  onConfirm
}: {
  record: FinancialRecord;
  onClose: () => void;
  onConfirm: (updates: Partial<FinancialRecord>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    receivedAmount: record.entryAmount ? formatCurrencyInput(record.entryAmount) : '',
    paymentDate: new Date().toLocaleDateString('pt-BR'),
    paymentMethod: 'Pix',
    notes: '',
    confirmed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.confirmed) return;
    const releaseDate = new Date().toLocaleDateString('pt-BR');
    setIsSubmitting(true);
    await onConfirm({
      ...record,
      financialStatus: 'Liberado para execução',
      paymentStatus: 'Parcial',
      receivedAmount: parseCurrency(form.receivedAmount),
      paidAt: form.paymentDate,
      paymentMethod: form.paymentMethod,
      releasedAt: releaseDate,
      notes: form.notes || 'Pagamento inicial confirmado e serviço liberado para execução.'
    });
    setIsSubmitting(false);
  }

  return (
    <form className="panel modal-card payment-modal" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Confirmação financeira</p>
          <h2>Pagamento inicial</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar confirmação"><X size={18} /></button>
      </div>

      <div className="proposal-process-summary">
        <div><span>Cliente</span><strong>{record.client}</strong></div>
        <div><span>Contrato</span><strong>{record.contractId}</strong></div>
        <div><span>Valor total</span><strong>{formatCurrency(record.amount)}</strong></div>
        <div><span>Entrada esperada</span><strong>{formatCurrency(record.entryAmount)}</strong></div>
      </div>

      <div className="form-grid">
        <label>Valor recebido<input value={form.receivedAmount} onChange={(event) => setForm((current) => ({ ...current, receivedAmount: event.target.value }))} /></label>
        <label>Data do pagamento<input value={form.paymentDate} onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))} /></label>
        <label>Forma de pagamento
          <select value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}>
            <option>Pix</option>
            <option>Boleto</option>
            <option>Transferência bancária</option>
            <option>Dinheiro</option>
            <option>Outro</option>
          </select>
        </label>
        <label className="wide-field">Observação<textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Ex: comprovante conferido, pagamento identificado no extrato..." /></label>
      </div>

      <label className="confirmation-check">
        <input type="checkbox" checked={form.confirmed} onChange={(event) => setForm((current) => ({ ...current, confirmed: event.target.checked }))} />
        <span>Confirmo que o pagamento inicial foi identificado e o serviço pode ser liberado para execução.</span>
      </label>

      <div className="analysis-footer">
        <div>
          <strong>Liberação operacional</strong>
          <span>Após confirmar, este contrato aparecerá automaticamente na aba Execução.</span>
        </div>
        <div className="wizard-actions">
          <button type="button" className="secondary-light-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button dark" disabled={!form.confirmed || isSubmitting}>{isSubmitting ? 'Confirmando...' : 'Confirmar e liberar execução'}</button>
        </div>
      </div>
    </form>
  );
}

function ServicesView({
  services,
  selectedProcessId,
  onSelectService,
  onClose,
  onUpdateService
}: {
  services: ServiceTracking[];
  selectedProcessId: string | null;
  onSelectService: (processId: string) => void;
  onClose: () => void;
  onUpdateService: (processId: string, updates: Partial<ServiceTracking>) => void;
}) {
  const selectedService = services.find((service) => service.processId === selectedProcessId) ?? null;
  const columns: ServiceTracking['status'][] = ['Não iniciado', 'Em andamento', 'Pendente', 'Concluído'];

  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Etapa 06 - Acompanhamento de serviços</p>
          <h1>Serviços</h1>
          <p>Acompanhe o andamento, registre a entrega final e mantenha o controle pós-serviço para renovações e retornos futuros.</p>
        </div>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Em andamento</span><strong>{services.filter((service) => service.status === 'Em andamento').length}</strong></article>
        <article className="mini-stat"><span>Pendentes</span><strong>{services.filter((service) => service.status === 'Pendente').length}</strong></article>
        <article className="mini-stat"><span>Concluídos</span><strong>{services.filter((service) => service.status === 'Concluído').length}</strong></article>
      </div>

      <div className="service-board">
        {columns.map((status) => {
          const columnServices = services.filter((service) => service.status === status);
          return (
            <article className="panel commercial-column" key={status}>
              <div className="commercial-column-heading">
                <h2>{status}</h2>
                <span>{columnServices.length}</span>
              </div>
              <div className="commercial-card-list">
                {columnServices.map((service) => (
                  <button className="commercial-card" key={service.processId} type="button" onClick={() => onSelectService(service.processId)}>
                    <div>
                      <strong>{service.processId}</strong>
                      <span>{service.client}</span>
                    </div>
                    <p>{service.service}</p>
                    <div className="progress-track"><span style={{ width: service.progress + '%' }} /></div>
                    <small>{service.progress}% concluído</small>
                  </button>
                ))}
                {columnServices.length === 0 ? <div className="empty-state">Nenhum serviço nesta coluna.</div> : null}
              </div>
            </article>
          );
        })}
      </div>

      {selectedService ? (
        <div className="modal-backdrop">
          <ServiceModal service={selectedService} onClose={onClose} onUpdate={onUpdateService} />
        </div>
      ) : null}
    </section>
  );
}

function ServiceModal({
  service,
  onClose,
  onUpdate
}: {
  service: ServiceTracking;
  onClose: () => void;
  onUpdate: (processId: string, updates: Partial<ServiceTracking>) => void;
}) {
  const [form, setForm] = useState<ServiceTracking>(service);

  function update<K extends keyof ServiceTracking>(field: K, value: ServiceTracking[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onUpdate(service.processId, form);
    onClose();
  }

  return (
    <form className="panel modal-card service-modal" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Entrega e pós-serviço</p>
          <h2>{service.processId}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar serviço"><X size={18} /></button>
      </div>

      <div className="form-grid">
        <label>Status do serviço<select value={form.status} onChange={(event) => update('status', event.target.value as ServiceTracking['status'])}><option>Não iniciado</option><option>Em andamento</option><option>Pendente</option><option>Concluído</option></select></label>
        <label>Percentual<input type="number" value={form.progress} onChange={(event) => update('progress', Number(event.target.value))} /></label>
        <label>Responsável<input value={form.responsible} onChange={(event) => update('responsible', event.target.value)} /></label>
        <label>Previsão de entrega<input value={form.expectedDelivery} onChange={(event) => update('expectedDelivery', event.target.value)} /></label>
        <label className="wide-field">Pendência atual<textarea value={form.pendingIssue} onChange={(event) => update('pendingIssue', event.target.value)} /></label>
        <label className="wide-field">Próxima ação<textarea value={form.nextAction} onChange={(event) => update('nextAction', event.target.value)} /></label>
      </div>

      <div className="step-panel">
        <div>
          <div className="form-section-title">Entrega do serviço</div>
          <h3>Registro final</h3>
        </div>
      </div>
      <div className="form-grid">
        <label>Data da entrega<input value={form.deliveredAt} onChange={(event) => update('deliveredAt', event.target.value)} placeholder="DD/MM/AAAA" /></label>
        <label>Forma de entrega<select value={form.deliveryMethod} onChange={(event) => update('deliveryMethod', event.target.value as ServiceTracking['deliveryMethod'])}><option value="">Selecionar</option><option>WhatsApp</option><option>E-mail</option><option>Presencial</option><option>Sistema</option></select></label>
        <label className="wide-field">Observação da entrega<textarea value={form.deliveryNotes} onChange={(event) => update('deliveryNotes', event.target.value)} placeholder="Documentos entregues, responsável pelo recebimento, comprovantes..." /></label>
      </div>

      <div className="step-panel">
        <div>
          <div className="form-section-title">Controle pós-serviço</div>
          <h3>Monitoramento futuro</h3>
        </div>
      </div>
      <div className="form-grid">
        <label>Data de retorno<input value={form.postServiceDate} onChange={(event) => update('postServiceDate', event.target.value)} /></label>
        <label>Prazo de renovação/validade<input value={form.renewalDeadline} onChange={(event) => update('renewalDeadline', event.target.value)} /></label>
        <label className="wide-field">Observações pós-serviço<textarea value={form.postServiceNotes} onChange={(event) => update('postServiceNotes', event.target.value)} /></label>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-light-button" onClick={onClose}>Cancelar</button>
        <button type="submit" className="primary-button dark">Salvar acompanhamento</button>
      </div>
    </form>
  );
}

function PropertiesView({
  properties,
  documents,
  processes,
  search,
  selectedPropertyId,
  onSearchChange,
  onSelectProperty,
  onClose
}: {
  properties: PropertyRecord[];
  documents: DocumentRecord[];
  processes: EnvironmentalProcess[];
  search: string;
  selectedPropertyId: string | null;
  onSearchChange: (value: string) => void;
  onSelectProperty: (propertyId: string) => void;
  onClose: () => void;
}) {
  const term = search.trim().toLowerCase();
  const filteredProperties = term
    ? properties.filter((property) =>
        [property.name, property.client, property.car, property.registration, property.city].some((value) => value.toLowerCase().includes(term))
      )
    : properties;
  const selectedProperty = properties.find((property) => property.id === selectedPropertyId) ?? null;
  const pendingDocs = properties.reduce((total, property) => {
    const propertyDocuments = documents.filter((document) => document.propertyId === property.id);
    return total + Math.max(0, 4 - propertyDocuments.length);
  }, 0);

  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Cadastro técnico da área</p>
          <h1>Propriedades</h1>
          <p>Centralize os dados da propriedade, documentos ambientais e processos vinculados ao cliente.</p>
        </div>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Total de propriedades</span><strong>{properties.length}</strong></article>
        <article className="mini-stat"><span>Processos vinculados</span><strong>{properties.reduce((total, property) => total + property.processIds.length, 0)}</strong></article>
        <article className="mini-stat"><span>Documentos pendentes</span><strong>{pendingDocs}</strong></article>
      </div>

      <div className="client-toolbar">
        <div className="search-box compact-search">
          <Search size={18} />
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por propriedade, cliente, CAR, matrícula ou município" />
        </div>
      </div>

      <div className="properties-grid">
        {filteredProperties.map((property) => {
          const propertyDocuments = documents.filter((document) => document.propertyId === property.id);
          return (
            <button className="property-card" key={property.id} type="button" onClick={() => onSelectProperty(property.id)}>
              <div className="property-card-header">
                <div>
                  <strong>{property.name}</strong>
                  <span>{property.client}</span>
                </div>
                <span className="status-chip">{property.type}</span>
              </div>
              <div className="property-info-grid">
                <span>Município <strong>{property.city}/{property.state}</strong></span>
                <span>Área total <strong>{property.totalArea}</strong></span>
                <span>CAR <strong>{property.car}</strong></span>
                <span>Documentos <strong>{propertyDocuments.length}</strong></span>
              </div>
              <p>{property.environmentalNotes}</p>
            </button>
          );
        })}
      </div>

      {selectedProperty ? (
        <div className="modal-backdrop">
          <PropertyModal property={selectedProperty} documents={documents.filter((document) => document.propertyId === selectedProperty.id)} processes={processes.filter((process) => selectedProperty.processIds.includes(process.id))} onClose={onClose} />
        </div>
      ) : null}
    </section>
  );
}

function PropertyModal({
  property,
  documents,
  processes,
  onClose
}: {
  property: PropertyRecord;
  documents: DocumentRecord[];
  processes: EnvironmentalProcess[];
  onClose: () => void;
}) {
  return (
    <article className="panel modal-card property-modal">
      <div className="process-detail-header">
        <div>
          <p className="eyebrow">Ficha da propriedade</p>
          <h2>{property.name}</h2>
          <span>{property.client} - {property.city}/{property.state}</span>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar propriedade"><X size={18} /></button>
      </div>

      <div className="property-detail-grid">
        <div><span>Tipo</span><strong>{property.type}</strong></div>
        <div><span>Matrícula</span><strong>{property.registration}</strong></div>
        <div><span>Área total</span><strong>{property.totalArea}</strong></div>
        <div><span>Área útil</span><strong>{property.productiveArea}</strong></div>
        <div><span>CAR</span><strong>{property.car}</strong></div>
        <div><span>CCIR</span><strong>{property.ccir}</strong></div>
        <div><span>ITR</span><strong>{property.itr}</strong></div>
        <div><span>Coordenadas</span><strong>{property.coordinates}</strong></div>
      </div>

      <div className="process-demand-box">
        <p className="eyebrow">Observações ambientais</p>
        <p>{property.environmentalNotes}</p>
      </div>

      <div className="property-modal-grid">
        <article>
          <p className="eyebrow">Documentos anexados</p>
          <DocumentList documents={documents} />
        </article>
        <article>
          <p className="eyebrow">Processos vinculados</p>
          <div className="linked-process-list">
            {processes.map((process) => (
              <div className="linked-process" key={process.id}>
                <strong>{process.id}</strong>
                <span>{process.service}</span>
                <small>{process.status}</small>
              </div>
            ))}
            {processes.length === 0 ? <div className="empty-state">Nenhum processo vinculado.</div> : null}
          </div>
        </article>
      </div>
    </article>
  );
}

function DocumentsView({ documents, search, onSearchChange }: { documents: DocumentRecord[]; search: string; onSearchChange: (value: string) => void }) {
  const term = search.trim().toLowerCase();
  const filteredDocuments = term
    ? documents.filter((document) =>
        [document.name, document.category, document.client, document.propertyName, document.processId, document.fileName].some((value) => value.toLowerCase().includes(term))
      )
    : documents;

  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Biblioteca documental</p>
          <h1>Documentos</h1>
          <p>Consulte documentos anexados por cliente, propriedade, processo, categoria ou nome do arquivo.</p>
        </div>
      </div>

      <div className="module-stats-grid">
        <article className="mini-stat"><span>Total de documentos</span><strong>{documents.length}</strong></article>
        <article className="mini-stat"><span>Clientes com anexos</span><strong>{new Set(documents.map((document) => document.client)).size}</strong></article>
        <article className="mini-stat"><span>Processos vinculados</span><strong>{new Set(documents.map((document) => document.processId)).size}</strong></article>
      </div>

      <div className="client-toolbar">
        <div className="search-box compact-search">
          <Search size={18} />
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por cliente, propriedade, processo, CAR, RG, matrícula ou arquivo" />
        </div>
      </div>

      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Arquivos recuperáveis</p>
            <h2>Documentos do sistema</h2>
          </div>
        </div>
        <DocumentList documents={filteredDocuments} />
      </article>
    </section>
  );
}

function DocumentList({ documents }: { documents: DocumentRecord[] }) {
  return (
    <div className="document-library-list">
      {documents.map((document) => (
        <div className="document-library-card" key={document.id}>
          <div>
            <strong>{document.name}</strong>
            <span>{document.fileName}</span>
          </div>
          <div className="document-meta-grid">
            <span>Categoria <strong>{document.category}</strong></span>
            <span>Cliente <strong>{document.client}</strong></span>
            <span>Propriedade <strong>{document.propertyName}</strong></span>
            <span>Processo <strong>{document.processId}</strong></span>
          </div>
          <div className="proposal-actions">
            <button type="button" className="secondary-light-button"><Eye size={17} /> Visualizar</button>
            <button type="button" className="primary-button dark"><Download size={17} /> Baixar</button>
          </div>
        </div>
      ))}
      {documents.length === 0 ? <div className="empty-state">Nenhum documento encontrado.</div> : null}
    </div>
  );
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <section className="module-view">
      <div className="module-header">
        <div>
          <p className="eyebrow">Módulo em estruturação</p>
          <h1>{title}</h1>
          <p>Esta área já está reservada na navegação e será construída nas próximas etapas do sistema.</p>
        </div>
      </div>
    </section>
  );
}
