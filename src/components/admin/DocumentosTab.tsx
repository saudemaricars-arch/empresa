import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderCheck, Plus, Download, Eye, Trash2, Search,
  FileText, ShieldCheck, Loader2, AlertCircle, X, ExternalLink
} from 'lucide-react';
import { DocumentoOcupacional, Company } from '../../types';
import { onDocumentosSnapshot, deleteDocumento, addDocumento } from '../../lib/firestoreService';
import { AdicionarDocumentoModal } from '../empresa/AdicionarDocumentoModal';
import { exportToCsv } from '../../utils/exportCsv';

interface DocumentosTabProps {
  company: Company;
}

function getValidadeInfo(dataValidade?: string) {
  if (!dataValidade) {
    return { label: 'Vigência Indeterminada', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', status: 'indeterminada' };
  }
  const hoje = new Date();
  const [ano, mes, dia] = dataValidade.split('-').map(Number);
  const val = new Date(ano, (mes || 1) - 1, dia || 1, 23, 59, 59);
  const diffDias = Math.ceil((val.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

  if (diffDias < 0) {
    return { label: `Vencido há ${Math.abs(diffDias)} d`, color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', status: 'vencido' };
  }
  if (diffDias <= 60) {
    return { label: `Vence em ${diffDias} dias`, color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', status: 'alerta' };
  }
  return { label: `Vigente até ${val.toLocaleDateString('pt-BR')}`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', status: 'vigente' };
}

export function DocumentosTab({ company }: DocumentosTabProps) {
  const [documentos, setDocumentos] = useState<DocumentoOcupacional[]>([]);
  const [busca, setBusca] = useState('');
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onDocumentosSnapshot(company.id, (docs) => {
      setDocumentos(docs);
    });
    return () => unsub();
  }, [company.id]);

  const pgrDoc = useMemo(() => documentos.find(d => d.tipo === 'pgr'), [documentos]);
  const pcmsoDoc = useMemo(() => documentos.find(d => d.tipo === 'pcmso'), [documentos]);

  const filtered = documentos.filter(d => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      d.titulo.toLowerCase().includes(q) ||
      d.tipo.toLowerCase().includes(q) ||
      (d.responsavelTecnico && d.responsavelTecnico.toLowerCase().includes(q)) ||
      (d.versao && d.versao.toLowerCase().includes(q))
    );
  });

  const handleCarregarModelos = async () => {
    setSeedLoading(true);
    try {
      const ano = new Date().getFullYear();
      const docsModelo: Omit<DocumentoOcupacional, 'id' | 'criadoEm'>[] = [
        {
          titulo: `PGR — Programa de Gerenciamento de Riscos ${ano}/${ano + 1}`,
          tipo: 'pgr',
          arquivoUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          dataEmissao: `${ano}-01-15`,
          dataValidade: `${ano + 1}-01-14`,
          versao: `Rev. ${ano}.1`,
          responsavelTecnico: 'Eng. Marcelo Antunes — CREA/SP 506981',
          descricao: 'Inventário de riscos da empresa conforme NR-01.',
        },
        {
          titulo: `PCMSO — Programa de Controle Médico de Saúde Ocupacional ${ano}`,
          tipo: 'pcmso',
          arquivoUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          dataEmissao: `${ano}-02-01`,
          dataValidade: `${ano + 1}-01-31`,
          versao: `Rev. ${ano}.0`,
          responsavelTecnico: 'Dr. Roberto Neves — CRM/SP 84210',
          descricao: 'Planejamento de exames periódicos e monitoramento da NR-07.',
        },
        {
          titulo: `LTCAT — Laudo Técnico das Condições Ambientais do Trabalho`,
          tipo: 'ltcat',
          arquivoUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          dataEmissao: `${ano}-01-20`,
          dataValidade: `${ano + 2}-01-20`,
          versao: `Versão Oficial`,
          responsavelTecnico: 'Eng. Seg. Patrícia Mendes — CREA/RJ 21045',
          descricao: 'Caracterização de aposentadoria especial do INSS.',
        },
      ];

      for (const d of docsModelo) {
        await addDocumento(company.id, d);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar modelos.');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleExcluir = async (id: string, titulo: string) => {
    if (!window.confirm(`Deseja remover o laudo "${titulo}"?`)) return;
    try {
      await deleteDocumento(company.id, id);
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir laudo.');
    }
  };

  const handleExportCsv = () => {
    const data = filtered.map(d => ({
      ID: d.id,
      Título: d.titulo,
      Tipo: d.tipo.toUpperCase(),
      Emissão: d.dataEmissao ? new Date(d.dataEmissao + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A',
      Validade: d.dataValidade ? new Date(d.dataValidade + 'T12:00:00').toLocaleDateString('pt-BR') : 'Indeterminada',
      'Responsável Técnico': d.responsavelTecnico || 'Multimed Conecta',
      'Versão': d.versao || 'Padrão',
      Link: d.arquivoUrl,
    }));
    exportToCsv(`laudos_${company.slug || company.id}.csv`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderCheck className="w-5 h-5 text-blue-600" />
            Laudos & Documentos Ocupacionais da Empresa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Documentos disponibilizados para o cliente baixar no portal e apresentar à fiscalização do trabalho.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            title="Exportar lista de laudos em CSV"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => setModalNovoOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Anexar Novo Laudo
          </button>
        </div>
      </div>

      {/* Resumo de Vigências */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card PGR */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                PGR · NR-01
              </span>
              {pgrDoc ? (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${getValidadeInfo(pgrDoc.dataValidade).color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getValidadeInfo(pgrDoc.dataValidade).dot}`} />
                  {getValidadeInfo(pgrDoc.dataValidade).label}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Pendente de Anexo
                </span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 text-base">
              {pgrDoc ? pgrDoc.titulo : 'Programa de Gerenciamento de Riscos'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {pgrDoc?.responsavelTecnico || 'Responsável técnico não informado'}
            </p>
          </div>
          {pgrDoc && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{pgrDoc.versao || 'Vigente'}</span>
              <button
                onClick={() => setPreviewUrl(pgrDoc.arquivoUrl)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Ver PDF
              </button>
            </div>
          )}
        </div>

        {/* Card PCMSO */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                PCMSO · NR-07
              </span>
              {pcmsoDoc ? (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${getValidadeInfo(pcmsoDoc.dataValidade).color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getValidadeInfo(pcmsoDoc.dataValidade).dot}`} />
                  {getValidadeInfo(pcmsoDoc.dataValidade).label}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Pendente de Anexo
                </span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 text-base">
              {pcmsoDoc ? pcmsoDoc.titulo : 'Programa de Controle Médico Ocupacional'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {pcmsoDoc?.responsavelTecnico || 'Médico coordenador não informado'}
            </p>
          </div>
          {pcmsoDoc && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{pcmsoDoc.versao || 'Vigente'}</span>
              <button
                onClick={() => setPreviewUrl(pcmsoDoc.arquivoUrl)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Ver PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filtrar por nome do laudo, versão ou responsável..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lista de Documentos */}
      {documentos.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <FolderCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum laudo anexado para esta empresa</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Anexe os laudos em PDF para que o cliente possa consultá-los a qualquer momento pelo portal dele.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setModalNovoOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              + Anexar Laudo
            </button>
            <button
              onClick={handleCarregarModelos}
              disabled={seedLoading}
              className="px-4 py-2 bg-white border border-slate-300 hover:border-slate-800 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {seedLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
              Carregar Laudos Modelo (Demonstração)
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((docItem) => {
            const val = getValidadeInfo(docItem.dataValidade);
            return (
              <div
                key={docItem.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">
                      {docItem.tipo.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${val.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${val.dot}`} />
                      {val.label}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{docItem.titulo}</h4>
                  {docItem.descricao && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{docItem.descricao}</p>
                  )}

                  <div className="mt-3 space-y-0.5 text-xs text-slate-500">
                    {docItem.responsavelTecnico && (
                      <p><span className="text-slate-400">Responsável:</span> {docItem.responsavelTecnico}</p>
                    )}
                    <p className="text-slate-400 text-[11px]">
                      Emissão: {docItem.dataEmissao ? new Date(docItem.dataEmissao + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'} {docItem.versao ? `· ${docItem.versao}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewUrl(docItem.arquivoUrl)}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Ver
                    </button>
                    <a
                      href={docItem.arquivoUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Baixar
                    </a>
                  </div>

                  <button
                    onClick={() => handleExcluir(docItem.id, docItem.titulo)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Novo Documento */}
      <AdicionarDocumentoModal
        empresaId={company.id}
        isOpen={modalNovoOpen}
        onClose={() => setModalNovoOpen(false)}
        onSuccess={() => {}}
      />

      {/* Modal Preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-blue-600" />
                Visualizar Laudo
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-50 flex items-center justify-center min-h-[300px]">
              <iframe
                src={previewUrl}
                title="Laudo"
                className="w-full rounded border border-slate-200"
                style={{ height: 'calc(90vh - 130px)' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
