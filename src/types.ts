export interface Noticia {
  id: string;
  universalPostId?: string; // Vínculo com o post universal (quando criado em lote)
  titulo: string;
  resumo?: string;       // texto curto para o card público
  conteudo: string;
  data: string;
  imagemUrl?: string;
  categoria?: string;
  autor?: string;
}

export interface PostUniversalDestinatario {
  id: string;
  nome: string;
  tag?: TipoGestao;
}

export interface PostUniversal {
  id: string;
  titulo: string;
  resumo?: string;
  conteudo: string;
  data: string;
  imagemUrl?: string;
  categoria?: string;
  autor?: string;
  empresaIds: string[];
  destinatarios: PostUniversalDestinatario[];
  criadoEm: string;
  atualizadoEm?: string;
}

export interface Sugestao {
  id: string;
  nome: string;          // "Anônimo" ou nome real
  email?: string;
  telefone?: string;
  categoria: string;
  mensagem: string;
  anexo?: string;
  status: 'nova' | 'em_atendimento' | 'respondida' | 'arquivada' | 'lida' | 'pendente';
  resposta?: string;
  respondidoEm?: string;
  observacaoInterna?: string;
  respondidoPor?: string;
  criadoEm: string;
}

export interface Denuncia {
  id: string;
  nome: string;          // "Anônimo" ou nome real
  email?: string;
  telefone?: string;
  tipo: 'assedio' | 'fraude' | 'corrupcao' | 'ameaca' | 'bullying' | 'descumprimento' | 'outro';
  descricao: string;
  provas?: string;
  status: 'nova' | 'em_analise' | 'resolvida' | 'arquivada' | 'em_atendimento' | 'pendente';
  resposta?: string;
  respondidoEm?: string;
  observacaoInterna?: string;
  respondidoPor?: string;
  criadoEm: string;
}

export interface Atestado {
  id: string;
  nomeFuncionario: string;
  telefone: string;
  nomeMedico: string;
  crmMedico: string;
  matricula?: string;
  setor?: string;
  dataAfastamento: string;
  diasAfastamento: number;
  motivoCid?: string;
  arquivoUrl: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  resposta?: string;
  respondidoEm?: string;
  observacaoInterna?: string;
  respondidoPor?: string;
  criadoEm: string;
}

export interface AuxilioSaudeMental {
  id: string;
  nomeFuncionario: string;
  matricula?: string;
  setor?: string;
  telefone: string;
  tipoAuxilio: 'psicologico' | 'psiquiatrico';
  motivoSolicitacao: string;
  descricao?: string;
  status: 'pendente' | 'em_atendimento' | 'concluido';
  resposta?: string;
  respondidoEm?: string;
  observacaoInterna?: string;
  respondidoPor?: string;
  criadoEm: string;
}

export interface ApoioSaude {
  id: string;
  nomeFuncionario: string;
  matricula: string;
  setor?: string;
  telefone: string;
  tipoConsulta: string;
  motivo?: string;
  status: 'pendente' | 'em_atendimento' | 'concluido';
  resposta?: string;
  respondidoEm?: string;
  observacaoInterna?: string;
  respondidoPor?: string;
  criadoEm: string;
}

export interface SegurancaTrabalho {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  categoria: string;
  mensagem: string;
  anexo?: string;
  ciente: boolean;
  status: 'nova' | 'em_analise' | 'resolvida';
  resposta?: string;
  respondidoEm?: string;
  observacaoInterna?: string;
  respondidoPor?: string;
  criadoEm: string;
}

// ─── Classificação / Gestão Multimed ──────────────────────────────────────────
export type TipoGestao = 'gerenciada_multimed' | 'cliente_nao_gerenciada' | 'plataforma_propria';

export interface TipoGestaoInfo {
  id: TipoGestao;
  label: string;
  badgeLabel: string;
  descricao: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export const TIPOS_GESTAO: Record<TipoGestao, TipoGestaoInfo> = {
  gerenciada_multimed: {
    id: 'gerenciada_multimed',
    label: 'Gerenciada pela Multimed',
    badgeLabel: 'Gestão Multimed',
    descricao: 'A Multimed realiza a gestão ativa da empresa e de suas demandas.',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  cliente_nao_gerenciada: {
    id: 'cliente_nao_gerenciada',
    label: 'Cliente Multimed (Não Gerenciada)',
    badgeLabel: 'Cliente Multimed',
    descricao: 'Cliente da carteira Multimed, com gestão interna própria da empresa.',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200',
    dotClass: 'bg-blue-500',
  },
  plataforma_propria: {
    id: 'plataforma_propria',
    label: 'Plataforma Própria (Conta Própria)',
    badgeLabel: 'Plataforma Própria',
    descricao: 'Cliente que adquiriu a plataforma diretamente por conta própria.',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-200',
    dotClass: 'bg-purple-500',
  },
};

export interface Company {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  tipoGestao?: TipoGestao;
  numeroFuncionarios: number;
  dataFundacao?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  setor?: string;
  noticias: Noticia[];
  sugestoes?: Sugestao[];
  denuncias?: Denuncia[];
  atestados?: Atestado[];
  auxilios?: AuxilioSaudeMental[];
  apoioSaude?: ApoioSaude[];
  segurancaTrabalho?: SegurancaTrabalho[];
  // Campos da página pública
  slug: string;
  descricao?: string;
  website?: string;
  corPrimaria?: string;
  logoUrl?: string;
  fundoUrl?: string;
  enableSugestoes?: boolean;
  enableDenuncias?: boolean;
  enableAtestados?: boolean;
  enableAuxilios?: boolean;
  enableApoioSaude?: boolean;
  enableSegurancaTrabalho?: boolean;
  showHeaderTexts?: boolean;
  // Controle de acesso multi-tenant
  temUsuario?: boolean;
  usuarioEmail?: string;
}

// ─── Multi-tenant: usuário vinculado a uma empresa ───────────────────────────

export interface EmpresaUsuario {
  uid: string;
  email: string;
  empresaId: string;
  role: 'empresa';
  criadoEm: string;
  criadoPorAdmin: string;
}

export type UserRole = 'admin' | 'empresa' | null;
