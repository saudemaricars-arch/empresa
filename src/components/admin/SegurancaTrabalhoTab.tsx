import { useState, useEffect } from 'react';
import { SegurancaTrabalho } from '../../types';
import {
  Loader2, ShieldAlert, Clock, CheckCircle, RefreshCw, Paperclip, Download,
  User, UserX, Tag, Mail, MessageCircle, ExternalLink, ChevronDown,
  CornerDownRight, Send, Check, MessageSquare, ShieldCheck
} from 'lucide-react';
import { onSegurancaTrabalhoSnapshot, updateSegurancaTrabalhoStatus, salvarTratativaDemanda } from '../../lib/firestoreService';
import { exportToCsv } from '../../utils/exportCsv';
import { motion } from 'motion/react';

interface SegurancaTrabalhoTabProps {
  empresaId: string;
}

const STATUS_CONFIG: Record<SegurancaTrabalho['status'], { label: string; color: string; dot: string }> = {
  nova:       { label: 'Nova',       color: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-500' },
  resolvida:  { label: 'Resolvida',  color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
};

type FiltroStatus = 'todos' | SegurancaTrabalho['status'];

export function SegurancaTrabalhoTab({ empresaId }: SegurancaTrabalhoTabProps) {
  const [solicitacoes, setSolicitacoes] = useState<SegurancaTrabalho[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FiltroStatus>('todos');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Devolutiva / Parecer Técnico
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respostaTexto, setRespostaTexto] = useState<Record<string, string>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSegurancaTrabalhoSnapshot(empresaId, (data) => {
      setSolicitacoes(data);
      setLoading(false);
    });
    return () => unsub();
  }, [empresaId]);

  const handleStatusChange = async (id: string, novoStatus: SegurancaTrabalho['status']) => {
    setUpdatingId(id);
    try {
      await updateSegurancaTrabalhoStatus(empresaId, id, novoStatus);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSalvarDevolutiva = async (req: SegurancaTrabalho) => {
    const texto = (respostaTexto[req.id] ?? req.resposta ?? '').trim();
    if (!texto) {
      alert('Por favor, escreva o parecer técnico ou retorno antes de salvar.');
      return;
    }

    setSalvandoId(req.id);
    try {
      await salvarTratativaDemanda(empresaId, 'segurancaTrabalho', req.id, {
        status: req.status,
        resposta: texto,
        respondidoEm: new Date().toISOString(),
        respondidoPor: 'Técnico de Segurança do Trabalho',
      });
      setRespondingId(null);
    } catch (err) {
      console.error('Erro ao salvar parecer:', err);
      alert('Erro ao salvar parecer.');
    } finally {
      setSalvandoId(null);
    }
  };

  const filtered = solicitacoes.filter((s) => {
    if (filter !== 'todos' && s.status !== filter) return false;
    if (dataInicio && new Date(s.criadoEm) < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && new Date(s.criadoEm) > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });

  const novasCount = solicitacoes.filter(s => s.status === 'nova').length;
  const analiseCount = solicitacoes.filter(s => s.status === 'em_analise').length;

  const handleExport = () => {
    const data = filtered.map(s => ({
      ID: s.id,
      Autor: s.nome,
      Email: s.email || 'Não informado',
      Telefone: s.telefone || 'Não informado',
      Categoria: s.categoria,
      Status: STATUS_CONFIG[s.status]?.label || s.status,
      'Data Envio': new Date(s.criadoEm).toLocaleDateString('pt-BR'),
      Mensagem: s.mensagem,
      'Possui Anexo': s.anexo ? 'Sim' : 'Não',
      'Termo Aceito': s.ciente ? 'Sim' : 'Não',
      'Parecer / Devolutiva': s.resposta || 'Sem parecer'
    }));
    exportToCsv('seguranca_trabalho.csv', data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Segurança do Trabalho</h2>
              <p className="text-sm text-slate-500">
                {solicitacoes.length} chamado{solicitacoes.length === 1 ? '' : 's'} total
                {novasCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-bold">
                    {novasCount} novo{novasCount > 1 ? 's' : ''}
                  </span>
                )}
                {analiseCount > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-bold">
                    {analiseCount} em análise
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
                className="appearance-none bg-white border border-amber-500/80 hover:border-amber-600 text-slate-800 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              >
                <option value="todos">Qualquer Status</option>
                <option value="nova">Novos</option>
                <option value="em_analise">Em Análise</option>
                <option value="resolvida">Resolvidos</option>
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
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">Nenhum chamado encontrado</h3>
          <p className="text-slate-500 text-sm">
            {filter === 'todos' ? 'Nenhum chamado de segurança do trabalho registrado até o momento.' : `Nenhum chamado com status "${STATUS_CONFIG[filter as SegurancaTrabalho['status']]?.label}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(req => {
            const isAnonimo = !req.nome || req.nome.toLowerCase() === 'anônimo';
            const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG['nova'];
            const waDigits = req.telefone ? req.telefone.replace(/\D/g, '') : '';
            const waLink = waDigits
              ? `https://wa.me/55${waDigits}?text=${encodeURIComponent(
                  `Olá ${!isAnonimo ? req.nome : ''}, estamos entrando em contato sobre o chamado de Segurança do Trabalho ("${req.categoria}") enviado no portal da empresa.`
                )}`
              : null;
            const mailLink = req.email
              ? `mailto:${req.email}?subject=${encodeURIComponent(`Retorno sobre Segurança do Trabalho - ${req.categoria}`)}&body=${encodeURIComponent(
                  `Olá ${!isAnonimo ? req.nome : ''},\n\nRecebemos seu relato no portal sobre "${req.categoria}" e gostaríamos de compartilhar nosso parecer:\n\n`
                )}`
              : null;

            const isEditingFeedback = respondingId === req.id;
            const currentFeedback = respostaTexto[req.id] ?? req.resposta ?? '';

            return (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:border-slate-300 transition-all">
                {/* Barra superior colorida */}
                <div className={`h-1.5 w-full ${statusInfo.dot}`} />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Topo do Card */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAnonimo ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700 font-bold text-sm'}`}>
                        {isAnonimo ? <UserX className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">
                            {isAnonimo ? 'Anônimo' : req.nome}
                          </span>
                          {isAnonimo ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Não identificado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Identificado
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span className="px-2.5 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-medium inline-flex items-center gap-1 border border-slate-200">
                            <Tag className="w-3 h-3 text-slate-500" /> {req.categoria}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Seletor de Status Direto no Card */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                      <select
                        value={req.status}
                        disabled={updatingId === req.id}
                        onChange={(e) => handleStatusChange(req.id, e.target.value as SegurancaTrabalho['status'])}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
                        title="Alterar status do chamado"
                      >
                        <option value="nova">Nova</option>
                        <option value="em_analise">Em Análise</option>
                        <option value="resolvida">Resolvida</option>
                      </select>
                    </div>
                  </div>

                  {/* Contato via WhatsApp e E-mail */}
                  <div className="flex items-center gap-2 mb-3.5 flex-wrap">
                    {req.telefone && (
                      <a
                        href={waLink || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors shadow-sm"
                        title="Chamar colaborador no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp: {req.telefone}</span>
                      </a>
                    )}

                    {req.email && (
                      <a
                        href={mailLink || undefined}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                        title="Enviar e-mail para dar retorno"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>{req.email}</span>
                      </a>
                    )}

                    {!req.telefone && !req.email && !isAnonimo && (
                      <span className="text-xs text-slate-400 italic">Sem contato informado</span>
                    )}
                  </div>

                  {/* Mensagem / Descrição do Chamado */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-3 text-xs text-slate-800 leading-relaxed">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1">Descrição da Solicitação / Ocorrência</div>
                    <p className="whitespace-pre-line text-slate-800">{req.mensagem}</p>
                  </div>

                  {/* Anexo enviado pelo colaborador */}
                  {req.anexo && (
                    <div className="flex items-center gap-2 p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs text-blue-900 mb-3">
                      <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium truncate">Evidência / Foto anexada</span>
                      <a
                        href={req.anexo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-300 rounded text-blue-700 hover:bg-blue-50 font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver Anexo
                      </a>
                    </div>
                  )}

                  {/* Termo aceito */}
                  {req.ciente && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mb-3">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Declaração de veracidade confirmada pelo solicitante
                    </div>
                  )}

                  {/* Exibição da Devolutiva Salva */}
                  {req.resposta && !isEditingFeedback && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 mb-3 text-xs text-slate-800">
                      <div className="flex items-center justify-between font-semibold text-emerald-900 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Parecer Técnico / Devolutiva ao Colaborador:
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

                  {/* Formulário de Devolutiva / Parecer */}
                  {isEditingFeedback && (
                    <div className="bg-slate-50 border border-amber-200 rounded-lg p-3 mb-3 space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-amber-600" />
                        Escreva o Parecer Técnico / Devolutiva:
                      </label>
                      <textarea
                        rows={3}
                        value={currentFeedback}
                        onChange={(e) => setRespostaTexto((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        placeholder="Ex: Condição inspecionada no local pela equipe de segurança. Foi providenciada a instalação de proteção..."
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-sm transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          {salvandoId === req.id ? 'Salvando...' : 'Salvar Parecer'}
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
                          className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors flex items-center gap-1 border border-amber-200"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {req.resposta ? 'Editar Parecer' : 'Dar Devolutiva'}
                        </button>
                      )}

                      {req.status !== 'resolvida' && (
                        <button
                          onClick={() => handleStatusChange(req.id, 'resolvida')}
                          disabled={updatingId === req.id}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1 border border-emerald-200"
                          title="Marcar como Resolvida"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Resolver
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
