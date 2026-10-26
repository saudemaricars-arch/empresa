import React, { useState } from 'react';
import { X, Upload, FileText, Shield, Loader2, AlertCircle } from 'lucide-react';
import { TipoDocumentoOcupacional, DocumentoOcupacional } from '../../types';
import { addDocumento } from '../../lib/firestoreService';

interface AdicionarDocumentoModalProps {
  empresaId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TIPOS_DOC: { id: TipoDocumentoOcupacional; label: string; sigla: string }[] = [
  { id: 'pgr', label: 'PGR — Programa de Gerenciamento de Riscos (NR-01)', sigla: 'PGR' },
  { id: 'pcmso', label: 'PCMSO — Programa de Controle Médico (NR-07)', sigla: 'PCMSO' },
  { id: 'ltcat', label: 'LTCAT — Laudo Técnico das Condições Ambientais', sigla: 'LTCAT' },
  { id: 'ergonomia', label: 'AEP — Análise Ergonômica Preliminar (NR-17)', sigla: 'AEP' },
  { id: 'aso', label: 'ASO Coletivo / Prontuário Consolidado', sigla: 'ASO' },
  { id: 'relatorio_anual', label: 'Relatório Analítico Anual do PCMSO', sigla: 'Relatório' },
  { id: 'ordem_servico', label: 'Ordem de Serviço de Segurança (NR-01)', sigla: 'OS' },
  { id: 'outro', label: 'Outro Documento / Política Ocupacional', sigla: 'Outro' },
];

export function AdicionarDocumentoModal({
  empresaId,
  isOpen,
  onClose,
  onSuccess,
}: AdicionarDocumentoModalProps) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    titulo: '',
    tipo: 'pgr' as TipoDocumentoOcupacional,
    arquivoUrl: '',
    dataEmissao: new Date().toISOString().slice(0, 10),
    dataValidade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 1 ano de vigência padrão
    versao: 'Rev. 2026.1',
    responsavelTecnico: '',
    descricao: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!form.titulo.trim()) {
      setErro('Informe o título do documento.');
      return;
    }
    if (!form.arquivoUrl.trim()) {
      setErro('Informe o link/URL do arquivo do laudo em PDF.');
      return;
    }

    setSalvando(true);
    try {
      await addDocumento(empresaId, {
        titulo: form.titulo.trim(),
        tipo: form.tipo,
        arquivoUrl: form.arquivoUrl.trim(),
        dataEmissao: form.dataEmissao,
        dataValidade: form.dataValidade || undefined,
        versao: form.versao.trim() || undefined,
        responsavelTecnico: form.responsavelTecnico.trim() || undefined,
        descricao: form.descricao.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar laudo:', err);
      setErro('Não foi possível registrar o documento. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Novo Laudo / Documento Ocupacional</h3>
              <p className="text-xs text-slate-500">Adicione PGR, PCMSO, LTCAT ou ASO ao acervo da empresa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{erro}</span>
            </div>
          )}

          {/* Tipo de Documento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Documento Normativo
            </label>
            <select
              value={form.tipo}
              onChange={(e) => {
                const tipoSel = e.target.value as TipoDocumentoOcupacional;
                const opt = TIPOS_DOC.find((t) => t.id === tipoSel);
                setForm((prev) => ({
                  ...prev,
                  tipo: tipoSel,
                  titulo: prev.titulo ? prev.titulo : opt ? `${opt.sigla} ${new Date().getFullYear()}` : '',
                }));
              }}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {TIPOS_DOC.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Título do Documento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Título Oficial do Laudo / Documento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: PGR — Programa de Gerenciamento de Riscos 2026/2027"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Link / URL do Arquivo PDF */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Link / URL do Arquivo em PDF *
            </label>
            <input
              type="url"
              required
              placeholder="https://storage... ou link seguro do laudo em PDF"
              value={form.arquivoUrl}
              onChange={(e) => setForm({ ...form, arquivoUrl: e.target.value })}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Cole o link direto do documento em PDF no Firebase Storage ou repositório seguro da Multimed.
            </p>
          </div>

          {/* Datas de Emissão e Validade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Data de Emissão
              </label>
              <input
                type="date"
                required
                value={form.dataEmissao}
                onChange={(e) => setForm({ ...form, dataEmissao: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vigência / Validade (Renovação)
              </label>
              <input
                type="date"
                value={form.dataValidade}
                onChange={(e) => setForm({ ...form, dataValidade: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Responsável Técnico e Versão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Responsável Técnico / Registro
              </label>
              <input
                type="text"
                placeholder="Ex: Dr. Roberto Neves - CRM 45210"
                value={form.responsavelTecnico}
                onChange={(e) => setForm({ ...form, responsavelTecnico: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Versão / Revisão
              </label>
              <input
                type="text"
                placeholder="Ex: Rev. 2026.1"
                value={form.versao}
                onChange={(e) => setForm({ ...form, versao: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Descrição Adicional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações / Escopo (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Abrange matriz e filiais operacionais, conforme inventário de riscos da NR-01."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Botões */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando Laudo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Registrar Documento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
