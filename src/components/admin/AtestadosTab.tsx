import { useState, useEffect } from 'react';
import { Atestado } from '../../types';
import { updateAtestadoStatus, onAtestadosSnapshot, salvarTratativaDemanda } from '../../lib/firestoreService';
import {
  FilePlus, User, Calendar, FileText, CheckCircle, XCircle, Clock,
  Search, Activity, Image as ImageIcon, Download, MessageCircle,
  ExternalLink, ChevronDown, Stethoscope, Hash, Phone, CornerDownRight,
  Send, Check, MessageSquare
} from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';
import { motion } from 'motion/react';

interface AtestadosTabProps {
  atestados: Atestado[];
  empresaId: string;
}

const STATUS_CONFIG: Record<Atestado['status'], { label: string; color: string; dot: string; border: string }> = {
  pendente:   { label: 'Pendente',   color: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-500',    border: 'border-blue-200' },
  aprovado:   { label: 'Aprovado',   color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  rejeitado:  { label: 'Rejeitado',  color: 'bg-red-50 text-red-700',       dot: 'bg-red-500',     border: 'border-red-200' },
};

type FiltroStatus = 'todos' | Atestado['status'];

export function AtestadosTab({ atestados: initialAtestados, empresaId }: AtestadosTabProps) {
  const [filtro, setFiltro] = useState<FiltroStatus>('todos');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [atestados, setAtestados] = useState<Atestado[]>(initialAtestados);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Tratativa / Devolutiva
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respostaTexto, setRespostaTexto] = useState<Record<string, string>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAtestadosSnapshot(empresaId, (data) => {
      setAtestados(data);
    });
    return () => unsubscribe();
  }, [empresaId]);

  const filtered = atestados.filter(a => {
    if (filtro !== 'todos' && a.status !== filtro) return false;
    if (dataInicio && new Date(a.criadoEm) < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && new Date(a.criadoEm) > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });

  const pendentesCount = atestados.filter(a => a.status === 'pendente').length;
  const emAnaliseCount = atestados.filter(a => a.status === 'em_analise').length;

  const handleExport = () => {
    const data = filtered.map(a => ({
      ID: a.id,
      Funcionário: a.nomeFuncionario,
      'WhatsApp / Telefone': a.telefone || 'Não informado',
      Matrícula: a.matricula || 'N/A',
      Setor: a.setor || 'N/A',
      Médico: a.nomeMedico,
      CRM: a.crmMedico,
      Status: STATUS_CONFIG[a.status]?.label || a.status,
      'Data Afastamento': new Date(a.dataAfastamento + 'T12:00:00').toLocaleDateString('pt-BR'),
      'Dias Afastamento': a.diasAfastamento,
      'CID / Motivo': a.motivoCid || 'Não informado',
      'Data Envio': new Date(a.criadoEm).toLocaleDateString('pt-BR'),
      'Devolutiva': a.resposta || 'Sem devolutiva'
    }));
    exportToCsv('atestados.csv', data);
  };

  const handleStatusChange = async (id: string, status: Atestado['status']) => {
    setUpdatingId(id);
    try {
      await updateAtestadoStatus(empresaId, id, status);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSalvarDevolutiva = async (a: Atestado) => {
    const texto = (respostaTexto[a.id] ?? a.resposta ?? '').trim();
    if (!texto) {
      alert('Por favor, escreva a devolutiva antes de salvar.');
      return;
    }

    setSalvandoId(a.id);
    try {
      await salvarTratativaDemanda(empresaId, 'atestados', a.id, {
        status: a.status,
        resposta: texto,
        respondidoEm: new Date().toISOString(),
        respondidoPor: 'Equipe de Gestão / RH',
      });
      setRespondingId(null);
    } catch (err) {
      console.error('Erro ao salvar devolutiva:', err);
      alert('Erro ao salvar devolutiva.');
    } finally {
      setSalvandoId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FilePlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Atestados Médicos</h2>
              <p className="text-sm text-slate-500">
                {atestados.length} total
                {pendentesCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-bold">
                    {pendentesCount} pendente{pendentesCount > 1 ? 's' : ''}
                  </span>
                )}
                {emAnaliseCount > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-bold">
                    {emAnaliseCount} em análise
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
                value={filtro}
                onChange={(e) => setFiltro(e.target.value as FiltroStatus)}
                className="appearance-none bg-white border border-blue-500/80 hover:border-blue-600 text-slate-800 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="todos">Qualquer Status</option>
                <option value="pendente">Pendentes</option>
                <option value="em_analise">Em Análise</option>
                <option value="aprovado">Aprovados</option>
                <option value="rejeitado">Rejeitados</option>
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
          <FilePlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {filtro === 'todos' ? 'Nenhum atestado recebido.' : `Nenhum atestado com status "${STATUS_CONFIG[filtro as Atestado['status']]?.label}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(a => {
            const statusInfo = STATUS_CONFIG[a.status] || STATUS_CONFIG['pendente'];
            const waDigits = a.telefone ? a.telefone.replace(/\D/g, '') : '';
            const waLink = waDigits
              ? `https://wa.me/55${waDigits}?text=${encodeURIComponent(
                  `Olá ${a.nomeFuncionario}, estamos entrando em contato referente ao atestado médico enviado no portal da empresa.`
                )}`
              : null;

            const isEditingFeedback = respondingId === a.id;
            const currentFeedback = respostaTexto[a.id] ?? a.resposta ?? '';

            return (
              <div key={a.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:border-slate-300 transition-all">
                {/* Barra superior colorida */}
                <div className={`h-1.5 w-full ${statusInfo.dot}`} />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Topo do Card: Nome, Matrícula, Status Selector */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{a.nomeFuncionario}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                          {a.matricula && (
                            <span className="flex items-center gap-0.5">
                              <Hash className="w-3 h-3 text-slate-400" /> CPF/Matrícula: {a.matricula}
                            </span>
                          )}
                          {a.setor && <span>• Setor: {a.setor}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Seletor de Status Direto no Card */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                      <select
                        value={a.status}
                        disabled={updatingId === a.id}
                        onChange={(e) => handleStatusChange(a.id, e.target.value as Atestado['status'])}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
                        title="Alterar status do atestado"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_analise">Em Análise</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="rejeitado">Rejeitado</option>
                      </select>
                    </div>
                  </div>

                  {/* Contato via WhatsApp / Telefone */}
                  <div className="flex items-center gap-2 mb-3.5 flex-wrap">
                    {a.telefone ? (
                      <a
                        href={waLink || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors shadow-sm"
                        title="Chamar colaborador no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chamar no WhatsApp: {a.telefone}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Telefone não informado</span>
                    )}
                  </div>

                  {/* Todas as Informações do Portal em Grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" /> Início do Afastamento
                      </span>
                      <span className="font-semibold text-slate-800">
                        {new Date(a.dataAfastamento + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> Duração
                      </span>
                      <span className="font-semibold text-slate-800">
                        {a.diasAfastamento} dia{a.diasAfastamento > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-blue-500" /> Médico Responsável
                      </span>
                      <span className="font-semibold text-slate-800 truncate block" title={a.nomeMedico}>
                        {a.nomeMedico || 'Não informado'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-blue-500" /> CRM
                      </span>
                      <span className="font-semibold text-slate-800">
                        {a.crmMedico || 'Não informado'}
                      </span>
                    </div>

                    {a.motivoCid && (
                      <div className="col-span-2 pt-2 border-t border-slate-200">
                        <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-amber-500" /> CID / Motivo do Afastamento
                        </span>
                        <span className="font-medium text-slate-800">
                          {a.motivoCid}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Ação: Ver Documento */}
                  {a.arquivoUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(a.arquivoUrl)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors border border-blue-200 mb-3"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Visualizar Documento Anexado
                    </button>
                  ) : (
                    <div className="text-xs text-slate-400 italic mb-3 text-center py-1">Sem documento anexado</div>
                  )}

                  {/* Exibição da Devolutiva Salva */}
                  {a.resposta && !isEditingFeedback && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 mb-3 text-xs text-slate-800">
                      <div className="flex items-center justify-between font-semibold text-emerald-900 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Devolutiva / Parecer ao Colaborador:
                        </span>
                        {a.respondidoEm && (
                          <span className="text-[11px] text-emerald-700 font-normal">
                            {new Date(a.respondidoEm).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-line text-slate-800 mt-1">{a.resposta}</p>
                    </div>
                  )}

                  {/* Formulário de Devolutiva / Parecer */}
                  {isEditingFeedback && (
                    <div className="bg-slate-50 border border-blue-200 rounded-lg p-3 mb-3 space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-blue-600" />
                        Escreva a Devolutiva / Parecer para o Colaborador:
                      </label>
                      <textarea
                        rows={3}
                        value={currentFeedback}
                        onChange={(e) => setRespostaTexto((prev) => ({ ...prev, [a.id]: e.target.value }))}
                        placeholder="Ex: Atestado homologado com sucesso pelo RH, afastamento válido a partir de..."
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
                          disabled={salvandoId === a.id}
                          onClick={() => handleSalvarDevolutiva(a)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          {salvandoId === a.id ? 'Salvando...' : 'Salvar Devolutiva'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer (Ações e Data) */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto text-xs text-slate-500">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Enviado em {new Date(a.criadoEm).toLocaleDateString('pt-BR')} às {new Date(a.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-2">
                      {!isEditingFeedback && (
                        <button
                          type="button"
                          onClick={() => {
                            setRespondingId(a.id);
                            if (!respostaTexto[a.id] && a.resposta) {
                              setRespostaTexto(p => ({ ...p, [a.id]: a.resposta || '' }));
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1 border border-blue-200"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {a.resposta ? 'Editar Devolutiva' : 'Dar Devolutiva'}
                        </button>
                      )}

                      {/* Botões rápidos se pendente ou em análise */}
                      {(a.status === 'pendente' || a.status === 'em_analise') && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStatusChange(a.id, 'rejeitado')}
                            disabled={updatingId === a.id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Rejeitar Atestado"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(a.id, 'aprovado')}
                            disabled={updatingId === a.id}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Aprovar Atestado"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Preview de Imagem / Documento */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Documento do Atestado
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir Original
                </a>
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-100 flex items-center justify-center min-h-[300px]">
              <img 
                src={previewImage} 
                alt="Documento do Atestado" 
                className="max-w-full h-auto object-contain rounded border border-slate-200 shadow-sm"
                style={{ maxHeight: 'calc(90vh - 120px)' }}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
