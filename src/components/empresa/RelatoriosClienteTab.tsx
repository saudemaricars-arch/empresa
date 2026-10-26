import { useState, useMemo } from 'react';
import {
  FileSpreadsheet, Download, Calendar, Filter, Search,
  AlertTriangle, FileText, Heart, Stethoscope, HardHat,
  MessageSquare, RefreshCw
} from 'lucide-react';
import {
  Company, Sugestao, Denuncia, Atestado, AuxilioSaudeMental,
  ApoioSaude, SegurancaTrabalho
} from '../../types';
import { exportToCsv } from '../../utils/exportCsv';

interface RelatoriosClienteTabProps {
  company: Company;
  atestados: Atestado[];
  denuncias: Denuncia[];
  sugestoes: Sugestao[];
  auxilios: AuxilioSaudeMental[];
  apoioSaude: ApoioSaude[];
  seguranca: SegurancaTrabalho[];
}

type ModuloRelatorio =
  | 'consolidado'
  | 'atestados'
  | 'denuncias'
  | 'sugestoes'
  | 'auxilios'
  | 'apoioSaude'
  | 'seguranca';

type PeriodoPreset = 'todos' | 'mes_atual' | 'ultimos_30' | 'ultimos_90' | 'ano_atual' | 'custom';
type StatusFiltro = 'todos' | 'pendentes' | 'concluidos' | 'rejeitados';

export function RelatoriosClienteTab({
  company,
  atestados,
  denuncias,
  sugestoes,
  auxilios,
  apoioSaude,
  seguranca,
}: RelatoriosClienteTabProps) {
  // Filtros de estado
  const [moduloAtivo, setModuloAtivo] = useState<ModuloRelatorio>('consolidado');
  const [periodoPreset, setPeriodoPreset] = useState<PeriodoPreset>('todos');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('todos');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [exportando, setExportando] = useState(false);

  // Aplica o preset de datas
  const handleSelecionarPreset = (preset: PeriodoPreset) => {
    setPeriodoPreset(preset);
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    if (preset === 'todos') {
      setDataInicio('');
      setDataFim('');
    } else if (preset === 'mes_atual') {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      setDataInicio(primeiroDia.toISOString().split('T')[0]);
      setDataFim(hojeStr);
    } else if (preset === 'ultimos_30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setDataInicio(d.toISOString().split('T')[0]);
      setDataFim(hojeStr);
    } else if (preset === 'ultimos_90') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      setDataInicio(d.toISOString().split('T')[0]);
      setDataFim(hojeStr);
    } else if (preset === 'ano_atual') {
      const primeiroDiaAno = new Date(hoje.getFullYear(), 0, 1);
      setDataInicio(primeiroDiaAno.toISOString().split('T')[0]);
      setDataFim(hojeStr);
    }
  };

  // Helper de filtragem por data
  const itemInDateRange = (itemDateStr?: string) => {
    if (!itemDateStr) return false;
    if (periodoPreset === 'todos' && !dataInicio && !dataFim) return true;

    try {
      const itemDate = new Date(itemDateStr);
      if (isNaN(itemDate.getTime())) return false;
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

      if (dataInicio) {
        const [anoI, mesI, diaI] = dataInicio.split('-').map(Number);
        const inicio = new Date(anoI, mesI - 1, diaI);
        if (itemDateOnly < inicio) return false;
      }
      if (dataFim) {
        const [anoF, mesF, diaF] = dataFim.split('-').map(Number);
        const fim = new Date(anoF, mesF - 1, diaF, 23, 59, 59);
        if (itemDateOnly > fim) return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  // Helper de filtro por status
  const itemMatchesStatus = (statusStr: string) => {
    if (statusFiltro === 'todos') return true;
    const s = (statusStr || '').toLowerCase();
    if (statusFiltro === 'pendentes') {
      return ['nova', 'pendente', 'em_analise', 'em_atendimento'].includes(s);
    }
    if (statusFiltro === 'concluidos') {
      return ['aprovado', 'resolvida', 'concluido', 'respondida', 'lida'].includes(s);
    }
    if (statusFiltro === 'rejeitados') {
      return ['rejeitado', 'arquivada'].includes(s);
    }
    return true;
  };

  // Helper de busca por texto
  const itemMatchesSearch = (haystack: (string | number | undefined | null)[]) => {
    const q = buscaTexto.trim().toLowerCase();
    if (!q) return true;
    const full = haystack.filter(Boolean).join(' ').toLowerCase();
    return full.includes(q);
  };

  // ─── Coleções Filtradas Individuais ──────────────────────────────────────────

  const atestadosFiltrados = useMemo(() => {
    return atestados.filter(a =>
      itemInDateRange(a.criadoEm || a.dataAfastamento) &&
      itemMatchesStatus(a.status) &&
      itemMatchesSearch([a.nomeFuncionario, a.matricula, a.setor, a.nomeMedico, a.crmMedico, a.motivoCid, a.id])
    );
  }, [atestados, dataInicio, dataFim, periodoPreset, statusFiltro, buscaTexto]);

  const denunciasFiltradas = useMemo(() => {
    return denuncias.filter(d =>
      itemInDateRange(d.criadoEm) &&
      itemMatchesStatus(d.status) &&
      itemMatchesSearch([d.nome, d.tipo, d.descricao, d.resposta, d.id])
    );
  }, [denuncias, dataInicio, dataFim, periodoPreset, statusFiltro, buscaTexto]);

  const sugestoesFiltradas = useMemo(() => {
    return sugestoes.filter(s =>
      itemInDateRange(s.criadoEm) &&
      itemMatchesStatus(s.status) &&
      itemMatchesSearch([s.nome, s.categoria, s.mensagem, s.resposta, s.id])
    );
  }, [sugestoes, dataInicio, dataFim, periodoPreset, statusFiltro, buscaTexto]);

  const auxiliosFiltrados = useMemo(() => {
    return auxilios.filter(a =>
      itemInDateRange(a.criadoEm) &&
      itemMatchesStatus(a.status) &&
      itemMatchesSearch([a.nomeFuncionario, a.matricula, a.setor, a.tipoAuxilio, a.motivoSolicitacao, a.id])
    );
  }, [auxilios, dataInicio, dataFim, periodoPreset, statusFiltro, buscaTexto]);

  const apoioSaudeFiltrados = useMemo(() => {
    return apoioSaude.filter(a =>
      itemInDateRange(a.criadoEm) &&
      itemMatchesStatus(a.status) &&
      itemMatchesSearch([a.nomeFuncionario, a.matricula, a.setor, a.tipoConsulta, a.motivo, a.id])
    );
  }, [apoioSaude, dataInicio, dataFim, periodoPreset, statusFiltro, buscaTexto]);

  const segurancaFiltrados = useMemo(() => {
    return seguranca.filter(s =>
      itemInDateRange(s.criadoEm) &&
      itemMatchesStatus(s.status) &&
      itemMatchesSearch([s.nome, s.email, s.telefone, s.categoria, s.mensagem, s.id])
    );
  }, [seguranca, dataInicio, dataFim, periodoPreset, statusFiltro, buscaTexto]);

  // Lista unificada consolidada (Relatório Geral)
  const consolidadoFiltrado = useMemo(() => {
    const list: Array<{
      modulo: string;
      id: string;
      data: string;
      solicitante: string;
      setor: string;
      contato: string;
      titulo: string;
      detalhes: string;
      diasAfastamento?: number;
      status: string;
      resposta: string;
      dataResposta?: string;
      responsavel?: string;
      anexoUrl?: string;
    }> = [];

    atestadosFiltrados.forEach(a => {
      list.push({
        modulo: 'Atestados Médicos',
        id: a.id,
        data: a.criadoEm,
        solicitante: a.nomeFuncionario,
        setor: a.setor || 'Não informado',
        contato: a.telefone || 'Não informado',
        titulo: `Atestado Dr(a). ${a.nomeMedico || 'Não informado'} (CRM: ${a.crmMedico || 'N/A'})`,
        detalhes: `CID: ${a.motivoCid || 'Não informado'} | Início: ${a.dataAfastamento ? new Date(a.dataAfastamento + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}`,
        diasAfastamento: a.diasAfastamento || 1,
        status: a.status,
        resposta: a.resposta || 'Não informado',
        dataResposta: a.respondidoEm,
        responsavel: a.respondidoPor,
        anexoUrl: a.arquivoUrl,
      });
    });

    denunciasFiltradas.forEach(d => {
      list.push({
        modulo: 'Canal de Denúncias',
        id: d.id,
        data: d.criadoEm,
        solicitante: d.nome || 'Anônimo',
        setor: 'Geral',
        contato: d.telefone || d.email || 'Não informado',
        titulo: `Denúncia: ${d.tipo.toUpperCase()}`,
        detalhes: d.descricao || 'Sem descrição',
        status: d.status,
        resposta: d.resposta || 'Não informado',
        dataResposta: d.respondidoEm,
        responsavel: d.respondidoPor,
        anexoUrl: d.provas,
      });
    });

    sugestoesFiltradas.forEach(s => {
      list.push({
        modulo: 'Caixa de Sugestões',
        id: s.id,
        data: s.criadoEm,
        solicitante: s.nome || 'Anônimo',
        setor: 'Geral',
        contato: s.telefone || s.email || 'Não informado',
        titulo: `Sugestão: ${s.categoria}`,
        detalhes: s.mensagem,
        status: s.status,
        resposta: s.resposta || 'Não informado',
        dataResposta: s.respondidoEm,
        responsavel: s.respondidoPor,
        anexoUrl: s.anexo,
      });
    });

    auxiliosFiltrados.forEach(aux => {
      list.push({
        modulo: 'Saúde Mental',
        id: aux.id,
        data: aux.criadoEm,
        solicitante: aux.nomeFuncionario,
        setor: aux.setor || 'Não informado',
        contato: aux.telefone || 'Não informado',
        titulo: `Auxílio ${aux.tipoAuxilio === 'psicologico' ? 'Psicológico' : 'Psiquiátrico'}`,
        detalhes: aux.motivoSolicitacao || aux.descricao || 'Sem detalhes',
        status: aux.status,
        resposta: aux.resposta || 'Não informado',
        dataResposta: aux.respondidoEm,
        responsavel: aux.respondidoPor,
      });
    });

    apoioSaudeFiltrados.forEach(ap => {
      list.push({
        modulo: 'Apoio à Saúde',
        id: ap.id,
        data: ap.criadoEm,
        solicitante: ap.nomeFuncionario,
        setor: ap.setor || 'Não informado',
        contato: ap.telefone || 'Não informado',
        titulo: `Telemedicina: ${ap.tipoConsulta}`,
        detalhes: ap.motivo || 'Sem queixa informada',
        status: ap.status,
        resposta: ap.resposta || 'Não informado',
        dataResposta: ap.respondidoEm,
        responsavel: ap.respondidoPor,
      });
    });

    segurancaFiltrados.forEach(seg => {
      list.push({
        modulo: 'Segurança do Trabalho',
        id: seg.id,
        data: seg.criadoEm,
        solicitante: seg.nome || 'Anônimo',
        setor: 'Geral',
        contato: seg.telefone || seg.email || 'Não informado',
        titulo: `Alerta: ${seg.categoria}`,
        detalhes: seg.mensagem,
        status: seg.status,
        resposta: seg.resposta || 'Não informado',
        dataResposta: seg.respondidoEm,
        responsavel: seg.respondidoPor,
        anexoUrl: seg.anexo,
      });
    });

    // Ordena do mais recente para o mais antigo
    return list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [
    atestadosFiltrados, denunciasFiltradas, sugestoesFiltradas,
    auxiliosFiltrados, apoioSaudeFiltrados, segurancaFiltrados
  ]);

  // Contadores e KPIs rápidos
  const totalRegistrosFiltrados = useMemo(() => {
    switch (moduloAtivo) {
      case 'consolidado': return consolidadoFiltrado.length;
      case 'atestados':   return atestadosFiltrados.length;
      case 'denuncias':   return denunciasFiltradas.length;
      case 'sugestoes':   return sugestoesFiltradas.length;
      case 'auxilios':    return auxiliosFiltrados.length;
      case 'apoioSaude':  return apoioSaudeFiltrados.length;
      case 'seguranca':   return segurancaFiltrados.length;
    }
  }, [
    moduloAtivo, consolidadoFiltrado, atestadosFiltrados,
    denunciasFiltradas, sugestoesFiltradas, auxiliosFiltrados, apoioSaudeFiltrados, segurancaFiltrados
  ]);

  const totalDiasAfastamento = useMemo(() => {
    return atestadosFiltrados.reduce((acc, a) => acc + (Number(a.diasAfastamento) || 0), 0);
  }, [atestadosFiltrados]);

  const totalResolvidos = useMemo(() => {
    return consolidadoFiltrado.filter(item =>
      ['aprovado', 'resolvida', 'concluido', 'respondida', 'lida'].includes((item.status || '').toLowerCase())
    ).length;
  }, [consolidadoFiltrado]);

  const taxaResolucao = useMemo(() => {
    if (consolidadoFiltrado.length === 0) return 100;
    return Math.round((totalResolvidos / consolidadoFiltrado.length) * 100);
  }, [consolidadoFiltrado, totalResolvidos]);

  // ─── Exportação em Excel Completo (.csv nativo) ─────────────────────────────

  const handleExportarExcelCompleto = () => {
    setExportando(true);
    try {
      const dataStr = new Date().toISOString().split('T')[0];
      const nomeEmpresaSlug = (company.nomeFantasia || company.razaoSocial).toLowerCase().replace(/[^a-z0-9]/g, '_');

      if (moduloAtivo === 'consolidado') {
        if (!consolidadoFiltrado.length) {
          alert('Não há dados consolidados no período selecionado.');
          return;
        }

        const rows = consolidadoFiltrado.map(item => ({
          'Módulo / Área': item.modulo,
          'Protocolo ID': item.id,
          'Data do Registro': item.data ? new Date(item.data).toLocaleString('pt-BR') : 'Não informado',
          'Colaborador / Solicitante': item.solicitante,
          'Setor': item.setor,
          'Telefone / E-mail': item.contato,
          'Assunto / Título': item.titulo,
          'Detalhes / Descrição': item.detalhes,
          'Dias de Afastamento': item.diasAfastamento || 0,
          'Status': item.status.toUpperCase(),
          'Parecer / Devolutiva': item.resposta,
          'Data Resposta': item.dataResposta ? new Date(item.dataResposta).toLocaleString('pt-BR') : 'Não informado',
          'Responsável Multimed': item.responsavel || 'Não informado',
          'Link Anexo': item.anexoUrl || 'Não informado',
        }));

        exportToCsv(`relatorio_consolidado_${nomeEmpresaSlug}_${dataStr}`, rows);

      } else if (moduloAtivo === 'atestados') {
        if (!atestadosFiltrados.length) {
          alert('Não há atestados no período selecionado.');
          return;
        }

        const rows = atestadosFiltrados.map(a => ({
          'Código do Atestado': a.id,
          'Colaborador': a.nomeFuncionario,
          'Matrícula': a.matricula || 'Não informado',
          'Setor': a.setor || 'Não informado',
          'Telefone / WhatsApp': a.telefone || 'Não informado',
          'Médico Emitente': a.nomeMedico || 'Não informado',
          'CRM': a.crmMedico || 'Não informado',
          'Data de Afastamento': a.dataAfastamento ? new Date(a.dataAfastamento + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informado',
          'Dias de Afastamento': a.diasAfastamento || 1,
          'CID / Diagnóstico': a.motivoCid || 'Não informado',
          'Status': a.status.toUpperCase(),
          'Data de Envio': a.criadoEm ? new Date(a.criadoEm).toLocaleString('pt-BR') : 'Não informado',
          'Devolutiva / Parecer': a.resposta || 'Não informado',
          'Data da Resposta': a.respondidoEm ? new Date(a.respondidoEm).toLocaleString('pt-BR') : 'Não informado',
          'Respondido Por': a.respondidoPor || 'Não informado',
          'Link do Atestado Anexo': a.arquivoUrl || 'Não informado',
        }));

        exportToCsv(`relatorio_atestados_${nomeEmpresaSlug}_${dataStr}`, rows);

      } else if (moduloAtivo === 'denuncias') {
        if (!denunciasFiltradas.length) {
          alert('Não há denúncias no período selecionado.');
          return;
        }

        const rows = denunciasFiltradas.map(d => ({
          'Protocolo Ético': d.id,
          'Remetente': d.nome || 'Anônimo',
          'Telefone / E-mail': d.telefone || d.email || 'Não informado',
          'Tipo de Ocorrência': d.tipo.toUpperCase(),
          'Descrição dos Fatos': d.descricao,
          'Status Atual': d.status.toUpperCase(),
          'Data de Envio': d.criadoEm ? new Date(d.criadoEm).toLocaleString('pt-BR') : 'Não informado',
          'Parecer da Comissão': d.resposta || 'Não informado',
          'Data do Parecer': d.respondidoEm ? new Date(d.respondidoEm).toLocaleString('pt-BR') : 'Não informado',
          'Responsável pelo Parecer': d.respondidoPor || 'Não informado',
          'Link de Provas': d.provas || 'Não informado',
        }));

        exportToCsv(`relatorio_canal_denuncias_${nomeEmpresaSlug}_${dataStr}`, rows);

      } else if (moduloAtivo === 'sugestoes') {
        if (!sugestoesFiltradas.length) {
          alert('Não há sugestões no período selecionado.');
          return;
        }

        const rows = sugestoesFiltradas.map(s => ({
          'Protocolo ID': s.id,
          'Colaborador': s.nome || 'Anônimo',
          'Contato': s.telefone || s.email || 'Não informado',
          'Categoria': s.categoria,
          'Mensagem / Sugestão': s.mensagem,
          'Status': s.status.toUpperCase(),
          'Data do Registro': s.criadoEm ? new Date(s.criadoEm).toLocaleString('pt-BR') : 'Não informado',
          'Resposta da Multimed': s.resposta || 'Não informado',
          'Data da Resposta': s.respondidoEm ? new Date(s.respondidoEm).toLocaleString('pt-BR') : 'Não informado',
          'Responsável pela Resposta': s.respondidoPor || 'Não informado',
          'Link de Anexo': s.anexo || 'Não informado',
        }));

        exportToCsv(`relatorio_ouvidoria_sugestoes_${nomeEmpresaSlug}_${dataStr}`, rows);

      } else if (moduloAtivo === 'auxilios') {
        if (!auxiliosFiltrados.length) {
          alert('Não há solicitações de auxílio mental no período selecionado.');
          return;
        }

        const rows = auxiliosFiltrados.map(a => ({
          'Protocolo ID': a.id,
          'Colaborador': a.nomeFuncionario,
          'Matrícula': a.matricula || 'Não informado',
          'Setor': a.setor || 'Não informado',
          'Telefone': a.telefone || 'Não informado',
          'Modalidade': a.tipoAuxilio === 'psicologico' ? 'Psicologia' : 'Psiquiatria',
          'Motivo': a.motivoSolicitacao || 'Não informado',
          'Observações': a.descricao || 'Não informado',
          'Status': a.status.toUpperCase(),
          'Data do Pedido': a.criadoEm ? new Date(a.criadoEm).toLocaleString('pt-BR') : 'Não informado',
          'Devolutiva Clínica': a.resposta || 'Não informado',
          'Data da Devolutiva': a.respondidoEm ? new Date(a.respondidoEm).toLocaleString('pt-BR') : 'Não informado',
        }));

        exportToCsv(`relatorio_saude_mental_${nomeEmpresaSlug}_${dataStr}`, rows);

      } else if (moduloAtivo === 'apoioSaude') {
        if (!apoioSaudeFiltrados.length) {
          alert('Não há atendimentos de apoio à saúde no período selecionado.');
          return;
        }

        const rows = apoioSaudeFiltrados.map(a => ({
          'Protocolo ID': a.id,
          'Colaborador': a.nomeFuncionario,
          'Matrícula': a.matricula || 'Não informado',
          'Setor': a.setor || 'Não informado',
          'Telefone': a.telefone || 'Não informado',
          'Tipo de Consulta': a.tipoConsulta,
          'Queixa / Motivo': a.motivo || 'Não informado',
          'Status': a.status.toUpperCase(),
          'Data de Solicitação': a.criadoEm ? new Date(a.criadoEm).toLocaleString('pt-BR') : 'Não informado',
          'Parecer Médico': a.resposta || 'Não informado',
          'Data do Parecer': a.respondidoEm ? new Date(a.respondidoEm).toLocaleString('pt-BR') : 'Não informado',
        }));

        exportToCsv(`relatorio_telemedicina_apoio_${nomeEmpresaSlug}_${dataStr}`, rows);

      } else if (moduloAtivo === 'seguranca') {
        if (!segurancaFiltrados.length) {
          alert('Não há chamados de segurança do trabalho no período selecionado.');
          return;
        }

        const rows = segurancaFiltrados.map(s => ({
          'Protocolo ID': s.id,
          'Solicitante': s.nome || 'Anônimo',
          'E-mail': s.email || 'Não informado',
          'Telefone': s.telefone || 'Não informado',
          'Categoria de Risco': s.categoria,
          'Descrição da Ocorrência': s.mensagem,
          'Termo de Ciência': s.ciente ? 'Sim' : 'Não',
          'Status': s.status.toUpperCase(),
          'Data de Abertura': s.criadoEm ? new Date(s.criadoEm).toLocaleString('pt-BR') : 'Não informado',
          'Parecer da Segurança': s.resposta || 'Não informado',
          'Data do Parecer': s.respondidoEm ? new Date(s.respondidoEm).toLocaleString('pt-BR') : 'Não informado',
          'Link Evidência': s.anexo || 'Não informado',
        }));

        exportToCsv(`relatorio_seguranca_trabalho_${nomeEmpresaSlug}_${dataStr}`, rows);
      }
    } finally {
      setTimeout(() => setExportando(false), 500);
    }
  };

  const modulosList: Array<{ id: ModuloRelatorio; label: string; icon: any; count: number }> = [
    { id: 'consolidado', label: 'Visão Consolidada Geral', icon: FileSpreadsheet, count: consolidadoFiltrado.length },
    { id: 'atestados',   label: 'Atestados & Absenteísmo', icon: FileText,        count: atestadosFiltrados.length },
    { id: 'denuncias',   label: 'Canal de Denúncias',     icon: AlertTriangle,    count: denunciasFiltradas.length },
    { id: 'sugestoes',   label: 'Caixa de Sugestões',     icon: MessageSquare,    count: sugestoesFiltradas.length },
    { id: 'auxilios',    label: 'Saúde Mental',           icon: Heart,            count: auxiliosFiltrados.length },
    { id: 'apoioSaude',  label: 'Apoio à Saúde / Telemedicina', icon: Stethoscope,count: apoioSaudeFiltrados.length },
    { id: 'seguranca',   label: 'Segurança do Trabalho',  icon: HardHat,          count: segurancaFiltrados.length },
  ];

  return (
    <div className="space-y-6">

      {/* ─── TOPO DO MÓDULO: CABEÇALHO & BOTÃO DE EXPORTAÇÃO EXCEL ───────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Central de Relatórios & Extração Excel
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Filtre por período personalizado e extraia relatórios operacionais completos em formato Microsoft Excel (.csv).
                </p>
              </div>
            </div>
          </div>

          {/* Botão de Exportação Excel */}
          <button
            onClick={handleExportarExcelCompleto}
            disabled={exportando || totalRegistrosFiltrados === 0}
            className="flex items-center justify-center gap-3 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {exportando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Gerando Planilha...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Relatório em Excel (.csv)</span>
              </>
            )}
          </button>
        </div>

        {/* ─── CARDS DE KPIS / INDICADORES DO PERÍODO ──────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block">Registros no Período</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalRegistrosFiltrados}</span>
            <span className="text-[11px] text-slate-400">Total filtrado</span>
          </div>

          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80">
            <span className="text-xs font-semibold text-amber-700 block">Absenteísmo (Atestados)</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">{totalDiasAfastamento} dias</span>
            <span className="text-[11px] text-amber-600">{atestadosFiltrados.length} atestados registrados</span>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
            <span className="text-xs font-semibold text-emerald-700 block">Taxa de Resolução</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{taxaResolucao}%</span>
            <span className="text-[11px] text-emerald-600">{totalResolvidos} demandas tratadas</span>
          </div>

          <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200/80">
            <span className="text-xs font-semibold text-purple-700 block">Demandas em Aberto</span>
            <span className="text-2xl font-bold text-purple-700 mt-1 block">
              {consolidadoFiltrado.length - totalResolvidos}
            </span>
            <span className="text-[11px] text-purple-600">Aguardando devolutiva</span>
          </div>
        </div>
      </div>

      {/* ─── PAINEL DE FILTROS AVANÇADOS ────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">Filtros de Período e Seleção de Dados</h3>
        </div>

        {/* 1. Seleção de Módulo / Área */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Selecione o Módulo para Extração:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {modulosList.map(m => {
              const ativo = moduloAtivo === m.id;
              const Icone = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModuloAtivo(m.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    ativo
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Icone className={`w-4 h-4 ${ativo ? 'text-white' : 'text-slate-400'}`} />
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {m.count}
                    </span>
                  </div>
                  <span className="text-xs font-bold leading-tight truncate">
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Filtro de Datas com Presets Rápidos */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Intervalo de Datas:
          </label>
          
          {/* Botões de Presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'todos', label: 'Todo o Histórico' },
              { id: 'mes_atual', label: 'Este Mês' },
              { id: 'ultimos_30', label: 'Últimos 30 Dias' },
              { id: 'ultimos_90', label: 'Últimos 90 Dias' },
              { id: 'ano_atual', label: 'Ano Vigente' },
              { id: 'custom', label: 'Personalizado' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelecionarPreset(p.id as PeriodoPreset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodoPreset === p.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Seletores de Data Início / Fim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-1">Data Início:</span>
              <input
                type="date"
                value={dataInicio}
                onChange={e => {
                  setDataInicio(e.target.value);
                  setPeriodoPreset('custom');
                }}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-1">Data Fim:</span>
              <input
                type="date"
                value={dataFim}
                onChange={e => {
                  setDataFim(e.target.value);
                  setPeriodoPreset('custom');
                }}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-1">Status da Demanda:</span>
              <select
                value={statusFiltro}
                onChange={e => setStatusFiltro(e.target.value as StatusFiltro)}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendentes">Apenas Pendentes / Em Análise</option>
                <option value="concluidos">Apenas Concluídos / Aprovados</option>
                <option value="rejeitados">Apenas Rejeitados / Arquivados</option>
              </select>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-1">Busca por Palavra-Chave:</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buscaTexto}
                  onChange={e => setBuscaTexto(e.target.value)}
                  placeholder="Nome, CRM, CID, setor..."
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PRÉ-VISUALIZAÇÃO DOS DADOS FILTRADOS (TABELA) ───────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">
              Pré-visualização dos Registros Filtrados ({totalRegistrosFiltrados})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {dataInicio && dataFim ? `Período: ${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}` : 'Todo o histórico'}
            </span>
            <button
              onClick={handleExportarExcelCompleto}
              disabled={exportando || totalRegistrosFiltrados === 0}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Baixar planilha com os dados filtrados"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {totalRegistrosFiltrados === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-900 text-base">Nenhum registro encontrado no período</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Ajuste as datas de início e fim ou limpe os termos de busca para expandir a consulta.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Módulo / Origem</th>
                  <th className="px-4 py-3">Colaborador / Solicitante</th>
                  <th className="px-4 py-3">Assunto / Descrição</th>
                  <th className="px-4 py-3">Setor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {moduloAtivo === 'consolidado' ? (
                  consolidadoFiltrado.slice(0, 50).map(item => (
                    <tr key={`${item.modulo}-${item.id}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-mono text-[11px]">
                        {item.data ? new Date(item.data).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {item.modulo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-semibold max-w-[180px] truncate">
                        {item.solicitante}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" title={item.detalhes}>
                        <span className="font-semibold text-slate-800">{item.titulo}</span>
                        {item.diasAfastamento ? ` · ${item.diasAfastamento}d afastamento` : ''}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {item.setor}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ['aprovado', 'resolvida', 'concluido', 'respondida'].includes(item.status)
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : ['rejeitado', 'arquivada'].includes(item.status)
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : moduloAtivo === 'atestados' ? (
                  atestadosFiltrados.slice(0, 50).map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-mono text-[11px]">
                        {a.criadoEm ? new Date(a.criadoEm).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          Atestado Médico
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-semibold">
                        {a.nomeFuncionario}
                      </td>
                      <td className="px-4 py-3">
                        Dr. {a.nomeMedico} · CID: {a.motivoCid || 'Não informado'} ({a.diasAfastamento} dias)
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {a.setor || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'aprovado'
                            ? 'bg-emerald-50 text-emerald-700'
                            : a.status === 'rejeitado'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {a.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  consolidadoFiltrado.slice(0, 50).map(item => (
                    <tr key={`${item.modulo}-${item.id}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-mono text-[11px]">
                        {item.data ? new Date(item.data).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.modulo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-semibold">
                        {item.solicitante}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">
                        {item.titulo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {item.setor}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalRegistrosFiltrados > 50 && (
              <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 border-t border-slate-100">
                Mostrando os primeiros 50 registros na tabela. Para visualizar todos os {totalRegistrosFiltrados} registros, clique em <strong>"Baixar Relatório em Excel (.csv)"</strong>.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
