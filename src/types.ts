export interface Noticia {
  id: string;
  titulo: string;
  resumo?: string;       // texto curto para o card público
  conteudo: string;
  data: string;
  imagemUrl?: string;
  categoria?: string;
  autor?: string;
}

export interface Sugestao {
  id: string;
  nome: string;          // "Anônimo" ou nome real
  email?: string;
  telefone?: string;
  categoria: string;
  mensagem: string;
  anexo?: string;
  status: 'nova' | 'lida' | 'respondida';
  criadoEm: string;
}

export interface Denuncia {
  id: string;
  nome: string;          // "Anônimo" ou nome real
  email?: string;
  telefone?: string;
  tipo: 'assedio' | 'fraude' | 'corrupcao' | 'ameaca' | 'bullying' | 'outro';
  descricao: string;
  provas?: string;
  status: 'nova' | 'em_analise' | 'resolvida' | 'arquivada';
  criadoEm: string;
}

export interface Atestado {
  id: string;
  nomeFuncionario: string;
  telefone: string;
  nomeMedico: string;
  crmMedico: string;
  matricula?: string;
  dataAfastamento: string;
  diasAfastamento: number;
  motivoCid?: string;
  arquivoUrl: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  criadoEm: string;
}

export interface AuxilioSaudeMental {
  id: string;
  nomeFuncionario: string;
  matricula?: string;
  telefone: string;
  tipoAuxilio: 'psicologico' | 'psiquiatrico';
  motivoSolicitacao: string;
  descricao?: string;
  status: 'pendente' | 'em_atendimento' | 'concluido';
  criadoEm: string;
}

export interface ApoioSaude {
  id: string;
  nomeFuncionario: string;
  matricula: string;
  telefone: string;
  tipoConsulta: string;
  motivo?: string;
  status: 'pendente' | 'em_atendimento' | 'concluido';
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
  criadoEm: string;
}

export interface Company {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
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
