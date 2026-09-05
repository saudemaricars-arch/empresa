import { useState, useEffect } from 'react';
import { Company, ApoioSaude } from '../../types';
import {
  Loader2, Stethoscope, Clock, CheckCircle, RefreshCw, MessageCircle, Download,
  User, Hash, ChevronDown, CornerDownRight, Send, Check, MessageSquare
} from 'lucide-react';
import { onApoioSaudeSnapshot, updateApoioSaudeStatus, salvarTratativaDemanda } from '../../lib/firestoreService';
import { exportToCsv } from '../../utils/exportCsv';
import { motion } from 'motion/react';

interface ApoioSaudeTabProps {
  company: Company;
}

const STATUS_CONFIG: Record<ApoioSaude['status'], { label: string; color: string; dot: string }> = {
  pendente:       { label: 'Pendente',       color: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
  em_atendimento: { label: 'Em Atendimento', color: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-500' },
  concluido:      { label: 'Concluído',      color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
};

type FiltroStatus = 'todos' | ApoioSaude['status'];

export function ApoioSaudeTab({ company }: ApoioSaudeTabProps) {
  const [solicitacoes, setSolicitacoes] = useState<ApoioSaude[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FiltroStatus>('todos');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Devolutiva / Tratativa
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respostaTexto, setRespostaTexto] = useState<Record<string, string>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onApoioSaudeSnapshot(company.id, (data) => {
      setSolicitacoes(data);
      setLoading(false);
    });
    return () => unsub();
  }, [company.id]);

  const handleStatusChange = async (id: string, novoStatus: ApoioSaude['status']) => {
    setUpdatingId(id);
    try {
      await updateApoioSaudeStatus(company.id, id, novoStatus);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSalvarDevolutiva = async (req: ApoioSaude) => {
    const texto = (respostaTexto[req.id] ?? req.resposta ?? '').trim();
    if (!texto) {
      alert('Por favor, escreva o retorno ou agendamento antes de salvar.');
      return;
    }

    setSalvandoId(req.id);
    try {
      await salvarTratativaDemanda(company.id, 'apoioSaude', req.id, {
        status: req.status,
        resposta: texto,
        respondidoEm: new Date().toISOString(),
        respondidoPor: 'Equipe de Atendimento em Saúde',
      });
      setRespondingId(null);
    } catch (err) {
      console.error('Erro ao salvar devolutiva:', err);
      alert('Erro ao salvar retorno.');
    } finally {
      setSalvandoId(null);
    }
  };

  const filtered = solicitacoes.filter((a) => {
    if (filter !== 'todos' && a.status !== filter) return false;
    if (dataInicio && new Date(a.criadoEm) < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && new Date(a.criadoEm) > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });

  const pendentesCount = solicitacoes.filter(a => a.status === 'pendente').length;
  const atendimentoCount = solicitacoes.filter(a => a.status === 'em_atendimento').length;

  const handleExport = () => {
    const data = filtered.map(a => ({
      ID: a.id,
      Funcionário: a.nomeFuncionario,
      'WhatsApp / Telefone': a.telefone || 'Não informado',
      Matrícula: a.matricula || 'N/A',
      Setor: a.setor || 'N/A',
      Status: STATUS_CONFIG[a.status]?.label || a.status,
      'Especialidade / Consulta': a.tipoConsulta,
      Motivo: a.motivo || 'Não informado',
      'Data Solicitação': new Date(a.criadoEm).toLocaleDateString('pt-BR'),
      'Devolutiva': a.resposta || 'Sem devolutiva'
    }));
    exportToCsv('apoio_saude.csv', data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Apoio à Saúde</h2>
              <p className="text-sm text-slate-500">
                {solicitacoes.length} solicitaç{solicitacoes.length === 1 ? 'ão' : 'ões'} total
                {pendentesCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-bold">
                    {pendentesCount} pendente{pendentesCount > 1 ? 's' : ''}
                  </span>
                )}
                {atendimentoCount > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-bold">
                    {atendimentoCount} em atendimento
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
            {/* Período */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="text-xs bg-transparent rounded px-2 py-1 text-slate-600 outline-none"
              />
              <span className="text-slate-400 text-xs">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="text-xs bg-transparent rounded px-2 py-1 text-slate-600 outline-none"
              />
            </div>

            {/* Dropdown de Filtro */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FiltroStatus)}
                className="appearance-none bg-white border border-teal-500/80 hover:border-teal-600 text-slate-800 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
              >
                <option value="todos">Qualquer Status</option>
                <option value="pendente">Pendentes</option>
                <option value="em_atendimento">Em Atendimento</option>
                <option value="concluido">Concluídos</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Exportar */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors border border-emerald-200"
            >
              <Download className="w-3.5 h-3.5" /> Exportar
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-200">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">Nenhuma solicitação encontrada</h3>
          <p className="text-slate-500 text-sm">
            {filter === 'todos' ? 'Nenhuma solicitação de consulta médica recebida até o momento.' : `Nenhuma solicitação com status "${STATUS_CONFIG[filter as ApoioSaude['status']]?.label}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(req => {
            const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG['pendente'];
            const waDigits = req.telefone ? req.telefone.replace(/\D/g, '') : '';
            const waLink = waDigits
              ? `https://wa.me/55${waDigits}?text=${encodeURIComponent(
                  `Olá ${req.nomeFuncionario}, recebemos sua solicitação de consulta com ${req.tipoConsulta} com desconto no portal da empresa e gostaríamos de realizar o agendamento.`
                )}`
              : null;

            const isEditingFeedback = respondingId === req.id;
            const currentFeedback = respostaTexto[req.id] ?? req.resposta ?? '';

            return (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:border-slate-300 transition-all">
                {/* Barra superior colorida */}
                <div className={`h-1.5 w-full ${statusInfo.dot}`} />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Topo do Card: Nome, Matrícula, Status Selector */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 font-bold text-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{req.nomeFuncionario}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                          {req.matricula && (
                            <span className="flex items-center gap-0.5">
                              <Hash className="w-3 h-3 text-slate-400" /> CPF: {req.matricula}
                            </span>
                          )}
                          {req.setor && <span>• Setor: {req.setor}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Seletor de Status Direto no Card */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                      <select
                        value={req.status}
                        disabled={updatingId === req.id}
                        onChange={(e) => handleStatusChange(req.id, e.target.value as ApoioSaude['status'])}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
                        title="Alterar status da consulta"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_atendimento">Em Atendimento</option>
                        <option value="concluido">Concluído</option>
                      </select>
                    </div>
                  </div>

                  {/* Contato via WhatsApp / Telefone */}
                  <div className="flex items-center gap-2 mb-3.5 flex-wrap">
                    {req.telefone ? (
                      <a
                        href={waLink || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors shadow-sm"
                        title="Chamar colaborador no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chamar no WhatsApp: {req.telefone}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Telefone não informado</span>
                    )}
                  </div>

                  {/* Informações detalhadas da Consulta */}
                  <div className="space-y-2.5 mb-3.5">
                    <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-100">
                      <div className="text-[11px] font-semibold text-teal-700 mb-0.5 uppercase tracking-wider">Especialidade / Consulta Desejada</div>
                      <div className="text-sm font-semibold text-teal-950 flex items-center gap-2">
                        🩺 {req.tipoConsulta}
                      </div>
                    </div>

                    {req.motivo && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Motivo Informado pelo Colaborador</div>
                        <p className="text-xs text-slate-800 italic whitespace-pre-wrap">"{req.motivo}"</p>
                      </div>
                    )}
                  </div>

                  {/* Exibição da Devolutiva Salva */}
                  {req.resposta && !isEditingFeedback && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 mb-3 text-xs text-slate-800">
                      <div className="flex items-center justify-between font-semibold text-emerald-900 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Retorno / Agendamento da Consulta:
                        </span>
                        {req.respondidoEm && (
                          <span className="text-[11px] text-emerald-700 font-normal">
                            {new Date(req.respondidoEm).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-line text-slate-800 mt-1">{req.resposta}</p>
                    </div>
                  )}

                  {/* Formulário de Devolutiva / Tratativa */}
                  {isEditingFeedback && (
                    <div className="bg-slate-50 border border-teal-200 rounded-lg p-3 mb-3 space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-teal-600" />
                        Escreva o Retorno / Agendamento para o Colaborador:
                      </label>
                      <textarea
                        rows={3}
                        value={currentFeedback}
                        onChange={(e) => setRespostaTexto((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        placeholder="Ex: Consulta agendada para 12/08 às 15:30 na Clínica Parceira, encaminhado voucher de desconto..."
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRespondingId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={salvandoId === req.id}
                          onClick={() => handleSalvarDevolutiva(req)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          {salvandoId === req.id ? 'Salvando...' : 'Salvar Retorno'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rodapé do Card */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto text-xs text-slate-500">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.criadoEm).toLocaleDateString('pt-BR')} às {new Date(req.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-2">
                      {!isEditingFeedback && (
                        <button
                          type="button"
                          onClick={() => {
                            setRespondingId(req.id);
                            if (!respostaTexto[req.id] && req.resposta) {
                              setRespostaTexto(p => ({ ...p, [req.id]: req.resposta || '' }));
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors flex items-center gap-1 border border-teal-200"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {req.resposta ? 'Editar Retorno' : 'Dar Retorno'}
                        </button>
                      )}

                      {req.status !== 'concluido' && (
                        <button
                          onClick={() => handleStatusChange(req.id, 'concluido')}
                          disabled={updatingId === req.id}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1 border border-emerald-200"
                          title="Marcar como Concluído"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Concluir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
