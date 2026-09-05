import React, { useState, useEffect } from 'react';
import { Sugestao } from '../../types';
import { updateSugestaoStatus, onSugestoesSnapshot, salvarTratativaDemanda } from '../../lib/firestoreService';
import {
  Lightbulb, User, Mail, Tag, Clock, CheckCircle, MessageSquare, Download,
  MessageCircle, ExternalLink, Send, ChevronDown, UserX, FileText, Phone,
  CornerDownRight, Check
} from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';
import { motion } from 'motion/react';

interface SugestoesTabProps {
  sugestoes: Sugestao[];
  empresaId: string;
  primaryColor: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; border: string }> = {
  nova:           { label: 'Nova / Pendente',        color: 'bg-blue-50 text-blue-700',   dot: 'bg-blue-500',   border: 'border-blue-200' },
  pendente:       { label: 'Nova / Pendente',        color: 'bg-blue-50 text-blue-700',   dot: 'bg-blue-500',   border: 'border-blue-200' },
  em_atendimento: { label: 'Em Atendimento',         color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  em_analise:     { label: 'Em Atendimento',         color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  lida:           { label: 'Em Atendimento / Lida',  color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  respondida:     { label: 'Resolvida / Concluída', color: 'bg-green-50 text-green-700', dot: 'bg-green-500', border: 'border-green-200' },
  resolvida:      { label: 'Resolvida / Concluída', color: 'bg-green-50 text-green-700', dot: 'bg-green-500', border: 'border-green-200' },
  arquivada:      { label: 'Arquivada',              color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' },
};

type FiltroStatus = 'todas' | 'pendentes' | 'atendimento' | 'concluidas' | 'arquivadas';

export function SugestoesTab({ sugestoes: initialSugestoes, empresaId, primaryColor }: SugestoesTabProps) {
  const [filtro, setFiltro] = useState<FiltroStatus>('todas');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>(initialSugestoes);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Controle de resposta / feedback por card
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respostaTexto, setRespostaTexto] = useState<Record<string, string>>({});
  const [salvandoRespostaId, setSalvandoRespostaId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSugestoesSnapshot(empresaId, (data) => {
      setSugestoes(data);
    });
    return () => unsubscribe();
  }, [empresaId]);

  const filtered = sugestoes.filter(s => {
    if (filtro === 'pendentes' && s.status !== 'nova' && s.status !== 'pendente') return false;
    if (filtro === 'atendimento' && s.status !== 'em_atendimento' && s.status !== 'lida' && s.status !== 'em_analise') return false;
    if (filtro === 'concluidas' && s.status !== 'respondida' && s.status !== 'resolvida') return false;
    if (filtro === 'arquivadas' && s.status !== 'arquivada') return false;

    if (dataInicio && new Date(s.criadoEm) < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && new Date(s.criadoEm) > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });

  const novasCount = sugestoes.filter(s => s.status === 'nova' || s.status === 'pendente').length;

  const handleExport = () => {
    const data = filtered.map(s => ({
      ID: s.id,
      Nome: s.nome,
      Email: s.email || 'Não informado',
      Telefone: s.telefone || 'Não informado',
      Categoria: s.categoria,
      Status: STATUS_CONFIG[s.status]?.label || s.status,
      Data: new Date(s.criadoEm).toLocaleDateString('pt-BR'),
      Mensagem: s.mensagem,
      Anexo: s.anexo || 'Sem anexo',
      Resposta: s.resposta || 'Sem resposta',
    }));
    exportToCsv('sugestoes.csv', data);
  };

  const handleStatusChange = async (sugestaoId: string, novoStatus: Sugestao['status']) => {
    setUpdatingId(sugestaoId);
    try {
      await updateSugestaoStatus(empresaId, sugestaoId, novoStatus);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Não foi possível atualizar o status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSalvarResposta = async (sugestao: Sugestao) => {
    const texto = (respostaTexto[sugestao.id] ?? sugestao.resposta ?? '').trim();
    if (!texto) {
      alert('Por favor, escreva a resposta ou feedback antes de salvar.');
      return;
    }

    setSalvandoRespostaId(sugestao.id);
    try {
      await salvarTratativaDemanda(empresaId, 'sugestoes', sugestao.id, {
        status: 'respondida',
        resposta: texto,
        respondidoEm: new Date().toISOString(),
        respondidoPor: 'Equipe de Gestão',
      });
      setRespondingId(null);
    } catch (err) {
      console.error('Erro ao salvar resposta:', err);
      alert('Erro ao salvar resposta.');
    } finally {
      setSalvandoRespostaId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${primaryColor}15` }}>
              <Lightbulb className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Sugestões recebidas</h2>
              <p className="text-sm text-slate-500">
                {sugestoes.length} total
                {novasCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-bold">
                    {novasCount} nova{novasCount > 1 ? 's' : ''}
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

            {/* Dropdown de Filtro conforme Anexo 2 */}
            <div className="relative">
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value as FiltroStatus)}
                className="appearance-none bg-white border border-blue-500/80 hover:border-blue-600 text-slate-800 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="todas">Qualquer Status</option>
                <option value="pendentes">Novas / Pendentes</option>
                <option value="atendimento">Em Análise / Atendimento</option>
                <option value="concluidas">Resolvidas / Concluídas</option>
                <option value="arquivadas">Arquivadas</option>
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

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {filtro !== 'todas' ? 'Nenhuma sugestão encontrada para o filtro selecionado.' : 'Nenhuma sugestão recebida ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(s => {
            const isAnonimo = !s.nome || s.nome.toLowerCase() === 'anônimo';
            const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG['nova'];
            const waDigits = s.telefone ? s.telefone.replace(/\D/g, '') : '';
            const waLink = waDigits
              ? `https://wa.me/55${waDigits}?text=${encodeURIComponent(
                  `Olá ${!isAnonimo ? s.nome : ''}, estamos entrando em contato sobre a sua sugestão ("${s.categoria}") enviada no portal da empresa.`
                )}`
              : null;
            const mailLink = s.email
              ? `mailto:${s.email}?subject=${encodeURIComponent(`Retorno sobre sua sugestão - ${s.categoria}`)}&body=${encodeURIComponent(
                  `Olá ${!isAnonimo ? s.nome : ''},\n\nRecebemos sua sugestão no portal sobre "${s.categoria}" e gostaríamos de compartilhar nosso retorno:\n\n`
                )}`
              : null;

            const isEditingFeedback = respondingId === s.id;
            const currentFeedback = respostaTexto[s.id] ?? s.resposta ?? '';

            return (
              <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all hover:border-slate-300">
                {/* Cabeçalho do Card */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAnonimo ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700 font-bold text-sm'}`}>
                      {isAnonimo ? <UserX className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">
                          {isAnonimo ? 'Anônimo' : s.nome}
                        </span>
                        {isAnonimo ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Não identificado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Identificado
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-medium flex items-center gap-1 border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-500" /> {s.categoria}
                        </span>
                      </div>

                      {/* Dados de Contato e Ações Rápidas de Feedback */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {s.email && (
                          <a
                            href={mailLink || undefined}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                            title="Enviar e-mail para dar feedback"
                          >
                            <Mail className="w-3 h-3 text-blue-600" />
                            <span>{s.email}</span>
                          </a>
                        )}

                        {s.telefone && (
                          <a
                            href={waLink || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                            title="Chamar no WhatsApp para dar feedback"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp: {s.telefone}</span>
                          </a>
                        )}

                        {!s.email && !s.telefone && !isAnonimo && (
                          <span className="text-xs text-slate-400 italic">Sem contato cadastrado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seletor de Status Direto no Card (Anexo 1 & 2) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                      <select
                        value={s.status === 'lida' ? 'em_atendimento' : (s.status === 'pendente' ? 'nova' : s.status)}
                        disabled={updatingId === s.id}
                        onChange={(e) => handleStatusChange(s.id, e.target.value as Sugestao['status'])}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
                        title="Alterar status da sugestão"
                      >
                        <option value="nova">Nova / Pendente</option>
                        <option value="em_atendimento">Em Atendimento</option>
                        <option value="respondida">Respondida / Concluída</option>
                        <option value="arquivada">Arquivada</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mensagem da Sugestão (Todas as Informações) */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 mb-3 text-sm text-slate-800 leading-relaxed">
                  <p className="whitespace-pre-line">{s.mensagem}</p>
                </div>

                {/* Anexo enviado pelo colaborador */}
                {s.anexo && (
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs text-blue-900 mb-3">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium truncate">Anexo enviado no formulário</span>
                    <a
                      href={s.anexo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-300 rounded text-blue-700 hover:bg-blue-50 font-medium transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Ver / Baixar
                    </a>
                  </div>
                )}

                {/* Exibição da Resposta / Devolutiva Salva */}
                {s.resposta && !isEditingFeedback && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3.5 mb-3 text-xs text-slate-800">
                    <div className="flex items-center justify-between font-semibold text-emerald-900 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Devolutiva / Resposta ao Solicitante:
                      </span>
                      {s.respondidoEm && (
                        <span className="text-[11px] text-emerald-700 font-normal">
                          {new Date(s.respondidoEm).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-line text-slate-800 mt-1">{s.resposta}</p>
                  </div>
                )}

                {/* Formulário de Resposta / Feedback ao Solicitante */}
                {isEditingFeedback && (
                  <div className="bg-slate-50 border border-blue-200 rounded-lg p-3.5 mb-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-blue-600" />
                      Escreva a Resposta / Devolutiva para o Solicitante:
                    </label>
                    <textarea
                      rows={3}
                      value={currentFeedback}
                      onChange={(e) => setRespostaTexto((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      placeholder="Descreva o retorno dado ao colaborador ou tratativa interna..."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        disabled={salvandoRespostaId === s.id}
                        onClick={() => handleSalvarResposta(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        {salvandoRespostaId === s.id ? 'Salvando...' : 'Salvar Devolutiva'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Rodapé do Card */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    {new Date(s.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Botão de feedback / devolutiva */}
                    {!isEditingFeedback && (
                      <button
                        onClick={() => {
                          setRespondingId(s.id);
                          if (!respostaTexto[s.id] && s.resposta) {
                            setRespostaTexto(p => ({ ...p, [s.id]: s.resposta || '' }));
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1 border border-blue-200"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {s.resposta ? 'Editar Devolutiva' : 'Dar Feedback / Devolutiva'}
                      </button>
                    )}

                    {/* Botão rápido para marcar como respondida se ainda pendente */}
                    {s.status !== 'respondida' && s.status !== 'resolvida' && (
                      <button
                        onClick={() => handleStatusChange(s.id, 'respondida')}
                        disabled={updatingId === s.id}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1 border border-emerald-200"
                        title="Marcar como respondida"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Concluir
                      </button>
                    )}
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
