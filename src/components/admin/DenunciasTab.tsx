import React, { useState, useEffect } from 'react';
import { Denuncia } from '../../types';
import { updateDenunciaStatus, onDenunciasSnapshot, salvarTratativaDemanda } from '../../lib/firestoreService';
import {
  ShieldAlert, User, Mail, Clock, Download, ChevronDown, UserX, FileText,
  ExternalLink, MessageCircle, Send, Check, CornerDownRight, CheckCircle,
  AlertTriangle, Shield
} from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';
import { motion } from 'motion/react';

interface DenunciasTabProps {
  denuncias: Denuncia[];
  empresaId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; border: string }> = {
  nova:           { label: 'Nova / Pendente',        color: 'bg-red-50 text-red-700',     dot: 'bg-red-500',   border: 'border-red-200' },
  pendente:       { label: 'Nova / Pendente',        color: 'bg-red-50 text-red-700',     dot: 'bg-red-500',   border: 'border-red-200' },
  em_analise:     { label: 'Em Análise / Atendimento',color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  em_atendimento: { label: 'Em Análise / Atendimento',color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  resolvida:      { label: 'Resolvida / Concluída',  color: 'bg-green-50 text-green-700', dot: 'bg-green-500', border: 'border-green-200' },
  concluida:      { label: 'Resolvida / Concluída',  color: 'bg-green-50 text-green-700', dot: 'bg-green-500', border: 'border-green-200' },
  arquivada:      { label: 'Arquivada',              color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' },
};

const TIPO_CONFIG: Record<Denuncia['tipo'], { label: string; icon: string }> = {
  assedio:        { label: 'Assédio',               icon: '🚫' },
  fraude:         { label: 'Fraude',                icon: '💰' },
  corrupcao:      { label: 'Corrupção',             icon: '⚖️' },
  ameaca:         { label: 'Ameaça',                icon: '⚠️' },
  bullying:       { label: 'Bullying',              icon: '🛑' },
  descumprimento: { label: 'Descumprimento',        icon: '📋' },
  outro:          { label: 'Outro',                 icon: '📌' },
};

type FiltroStatus = 'todas' | 'pendentes' | 'atendimento' | 'concluidas' | 'arquivadas';

export function DenunciasTab({ denuncias: initialDenuncias, empresaId }: DenunciasTabProps) {
  const [filtro, setFiltro] = useState<FiltroStatus>('todas');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [denuncias, setDenuncias] = useState<Denuncia[]>(initialDenuncias);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Controle de resposta / parecer por card
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respostaTexto, setRespostaTexto] = useState<Record<string, string>>({});
  const [salvandoRespostaId, setSalvandoRespostaId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onDenunciasSnapshot(empresaId, (data) => {
      setDenuncias(data);
    });
    return () => unsubscribe();
  }, [empresaId]);

  const filtered = denuncias.filter(d => {
    if (filtro === 'pendentes' && d.status !== 'nova' && d.status !== 'pendente') return false;
    if (filtro === 'atendimento' && d.status !== 'em_analise' && d.status !== 'em_atendimento') return false;
    if (filtro === 'concluidas' && d.status !== 'resolvida') return false;
    if (filtro === 'arquivadas' && d.status !== 'arquivada') return false;

    if (dataInicio && new Date(d.criadoEm) < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && new Date(d.criadoEm) > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });

  const novasCount = denuncias.filter(d => d.status === 'nova' || d.status === 'pendente').length;

  const handleExport = () => {
    const data = filtered.map(d => ({
      ID: d.id,
      Nome: d.nome,
      Email: d.email || 'Não informado',
      Telefone: d.telefone || 'Não informado',
      Tipo: TIPO_CONFIG[d.tipo]?.label || d.tipo,
      Status: STATUS_CONFIG[d.status]?.label || d.status,
      Data: new Date(d.criadoEm).toLocaleDateString('pt-BR'),
      Descrição: d.descricao,
      Provas: d.provas || 'Sem anexos',
      Parecer: d.resposta || 'Sem parecer',
    }));
    exportToCsv('denuncias.csv', data);
  };

  const handleStatusChange = async (id: string, status: Denuncia['status']) => {
    setUpdatingId(id);
    try {
      await updateDenunciaStatus(empresaId, id, status);
    } catch (err) {
      console.error('Erro ao atualizar status da denúncia:', err);
      alert('Não foi possível atualizar o status da denúncia.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSalvarParecer = async (denuncia: Denuncia) => {
    const texto = (respostaTexto[denuncia.id] ?? denuncia.resposta ?? '').trim();
    if (!texto) {
      alert('Por favor, informe a resposta ou parecer antes de salvar.');
      return;
    }

    setSalvandoRespostaId(denuncia.id);
    try {
      await salvarTratativaDemanda(empresaId, 'denuncias', denuncia.id, {
        status: 'resolvida',
        resposta: texto,
        respondidoEm: new Date().toISOString(),
        respondidoPor: 'Equipe de Ética & Compliance',
      });
      setRespondingId(null);
    } catch (err) {
      console.error('Erro ao salvar parecer:', err);
      alert('Erro ao salvar parecer.');
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
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Denúncias recebidas</h2>
              <p className="text-sm text-slate-500">
                {denuncias.length} total
                {novasCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-bold">
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
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {filtro !== 'todas' ? 'Nenhuma denúncia encontrada para o filtro selecionado.' : 'Nenhuma denúncia recebida ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(d => {
            const isAnonimo = !d.nome || d.nome.toLowerCase() === 'anônimo';
            const statusInfo = STATUS_CONFIG[d.status] || STATUS_CONFIG['nova'];
            const tipoInfo = TIPO_CONFIG[d.tipo] || { label: d.tipo || 'Outro', icon: '📌' };
            const waDigits = d.telefone ? d.telefone.replace(/\D/g, '') : '';
            const waLink = waDigits
              ? `https://wa.me/55${waDigits}?text=${encodeURIComponent(
                  `Olá ${!isAnonimo ? d.nome : ''}, estamos entrando em contato sobre a sua manifestação no canal sigiloso da empresa.`
                )}`
              : null;
            const mailLink = d.email
              ? `mailto:${d.email}?subject=${encodeURIComponent(`Retorno sigiloso sobre sua manifestação`)}&body=${encodeURIComponent(
                  `Olá ${!isAnonimo ? d.nome : ''},\n\nRecebemos sua manifestação no canal sigiloso e gostaríamos de apresentar o retorno:\n\n`
                )}`
              : null;

            const isEditingFeedback = respondingId === d.id;
            const currentFeedback = respostaTexto[d.id] ?? d.resposta ?? '';

            return (
              <div key={d.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:border-slate-300">
                <div className={`h-1 w-full ${statusInfo.dot}`} />
                <div className="p-5">
                  {/* Cabeçalho do Card */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAnonimo ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-700 font-bold text-sm'}`}>
                        {isAnonimo ? <UserX className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">
                            {isAnonimo ? 'Denúncia Anônima' : d.nome}
                          </span>
                          {isAnonimo ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Identidade protegida
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              Identificado
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-medium flex items-center gap-1 border border-slate-200">
                            {tipoInfo.icon} {tipoInfo.label}
                          </span>
                        </div>

                        {/* Dados de Contato e Ações Rápidas de Feedback */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {d.email && (
                            <a
                              href={mailLink || undefined}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                              title="Enviar e-mail para dar feedback sigiloso"
                            >
                              <Mail className="w-3 h-3 text-blue-600" />
                              <span>{d.email}</span>
                            </a>
                          )}

                          {d.telefone && (
                            <a
                              href={waLink || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                              title="Chamar no WhatsApp para dar feedback sigiloso"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp: {d.telefone}</span>
                            </a>
                          )}

                          {!d.email && !d.telefone && !isAnonimo && (
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
                          value={d.status === 'pendente' ? 'nova' : (d.status === 'em_atendimento' ? 'em_analise' : d.status)}
                          disabled={updatingId === d.id}
                          onChange={(e) => handleStatusChange(d.id, e.target.value as Denuncia['status'])}
                          className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
                          title="Alterar status da denúncia"
                        >
                          <option value="nova">Nova / Pendente</option>
                          <option value="em_analise">Em Análise / Atendimento</option>
                          <option value="resolvida">Resolvida / Concluída</option>
                          <option value="arquivada">Arquivada</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Descrição Completa (Todas as Informações) */}
                  <div className="bg-red-50/50 border border-red-100 rounded-lg p-3.5 mb-3 text-sm text-slate-800 leading-relaxed">
                    <p className="whitespace-pre-line">{d.descricao}</p>
                  </div>

                  {/* Provas / Evidências / Anexos */}
                  {d.provas && (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900 mb-3">
                      <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="font-medium truncate">Evidências / Provas anexadas pelo denunciante</span>
                      <a
                        href={d.provas}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded text-amber-800 hover:bg-amber-50 font-medium transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver / Baixar Provas
                      </a>
                    </div>
                  )}

                  {/* Exibição do Parecer / Devolutiva Salvo */}
                  {d.resposta && !isEditingFeedback && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3.5 mb-3 text-xs text-slate-800">
                      <div className="flex items-center justify-between font-semibold text-emerald-900 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Parecer Técnico / Devolutiva Registrada:
                        </span>
                        {d.respondidoEm && (
                          <span className="text-[11px] text-emerald-700 font-normal">
                            {new Date(d.respondidoEm).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-line text-slate-800 mt-1">{d.resposta}</p>
                    </div>
                  )}

                  {/* Formulário de Parecer / Devolutiva */}
                  {isEditingFeedback && (
                    <div className="bg-slate-50 border border-blue-200 rounded-lg p-3.5 mb-3 space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-blue-600" />
                        Escreva o Parecer Técnico / Devolutiva ao Denunciante:
                      </label>
                      <textarea
                        rows={3}
                        value={currentFeedback}
                        onChange={(e) => setRespostaTexto((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        placeholder="Descreva as medidas de apuração, parecer técnico ou conclusão da averiguação..."
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
                          disabled={salvandoRespostaId === d.id}
                          onClick={() => handleSalvarParecer(d)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          {salvandoRespostaId === d.id ? 'Salvando...' : 'Salvar Parecer'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rodapé do Card */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(d.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Botão de parecer / devolutiva */}
                      {!isEditingFeedback && (
                        <button
                          onClick={() => {
                            setRespondingId(d.id);
                            if (!respostaTexto[d.id] && d.resposta) {
                              setRespostaTexto(p => ({ ...p, [d.id]: d.resposta || '' }));
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1 border border-blue-200"
                        >
                          <Shield className="w-3 h-3" />
                          {d.resposta ? 'Editar Parecer' : 'Dar Parecer / Devolutiva'}
                        </button>
                      )}

                      {/* Botão rápido para resolver */}
                      {d.status !== 'resolvida' && (
                        <button
                          onClick={() => handleStatusChange(d.id, 'resolvida')}
                          disabled={updatingId === d.id}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1 border border-emerald-200"
                          title="Marcar como resolvida"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Resolver
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
