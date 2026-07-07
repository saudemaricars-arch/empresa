import { useState, useEffect } from 'react';
import { Atestado } from '../../types';
import { updateAtestadoStatus, onAtestadosSnapshot } from '../../lib/firestoreService';
import { FilePlus, User, Calendar, FileText, CheckCircle, XCircle, Clock, Link, Search, Activity, Image as ImageIcon, Download } from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';
import { motion } from 'motion/react';

interface AtestadosTabProps {
  atestados: Atestado[];
  empresaId: string;
}

const STATUS_CONFIG = {
  pendente:  { label: 'Pendente',  color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  aprovado:  { label: 'Aprovado',  color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
};

type Filtro = 'todos' | Atestado['status'];

export function AtestadosTab({ atestados: initialAtestados, empresaId }: AtestadosTabProps) {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [updating, setUpdating] = useState<string | null>(null);
  const [atestados, setAtestados] = useState<Atestado[]>(initialAtestados);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

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
  const pendentes = atestados.filter(a => a.status === 'pendente').length;

  const handleExport = () => {
    const data = filtered.map(a => ({
      ID: a.id,
      Funcionário: a.nomeFuncionario,
      Setor: a.setor,
      Matrícula: a.matricula || 'N/A',
      Status: STATUS_CONFIG[a.status].label,
      'Data Afastamento': new Date(a.dataAfastamento + 'T12:00:00').toLocaleDateString('pt-BR'),
      'Dias Afastamento': a.diasAfastamento,
      'CID / Motivo': a.motivoCid || 'Não informado',
      'Data Envio': new Date(a.criadoEm).toLocaleDateString('pt-BR')
    }));
    exportToCsv('atestados.csv', data);
  };

  const handleStatus = async (id: string, status: Atestado['status']) => {
    setUpdating(id);
    try { await updateAtestadoStatus(empresaId, id, status); }
    finally { setUpdating(null); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FilePlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Atestados Médicos</h2>
              <p className="text-sm text-slate-500">
                {atestados.length} total
                {pendentes > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-bold">
                    {pendentes} pendente{pendentes > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col xl:flex-row items-center gap-3">
            {/* Período */}
            <div className="flex items-center gap-2">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 outline-none focus:border-amber-400" />
              <span className="text-slate-400 text-xs">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 outline-none focus:border-amber-400" />
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg flex-wrap">
              {(['todos', 'pendente', 'aprovado', 'rejeitado'] as Filtro[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filtro === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {f === 'todos' ? 'Todos' : STATUS_CONFIG[f as Atestado['status']].label}
                </button>
              ))}
            </div>

            {/* Exportar */}
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-semibold transition-colors">
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <FilePlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {filtro === 'todos' ? 'Nenhum atestado recebido.' : `Nenhum atestado "${STATUS_CONFIG[filtro as Atestado['status']].label}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(a => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              {/* Barra superior colorida por status */}
              <div className={`h-1 w-full ${STATUS_CONFIG[a.status].dot.replace('bg-', 'bg-')}`} />
              
              <div className="p-5 flex-1 flex flex-col">
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{a.nomeFuncionario}</div>
                      <div className="text-xs text-slate-500">{a.setor} {a.matricula && `• Matrícula: ${a.matricula}`}</div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 shrink-0 ${STATUS_CONFIG[a.status].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[a.status].dot}`} />
                    {STATUS_CONFIG[a.status].label}
                  </span>
                </div>

                {/* Detalhes do Afastamento */}
                <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Início</div>
                    <div className="text-sm font-medium text-slate-700">
                      {new Date(a.dataAfastamento + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Duração</div>
                    <div className="text-sm font-medium text-slate-700">{a.diasAfastamento} dia{a.diasAfastamento > 1 ? 's' : ''}</div>
                  </div>
                  {a.motivoCid && (
                    <div className="col-span-2 pt-2 mt-1 border-t border-slate-200/60">
                      <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> CID / Motivo</div>
                      <div className="text-sm font-medium text-slate-700">{a.motivoCid}</div>
                    </div>
                  )}
                </div>

                {/* Ação: Ver Documento */}
                <button
                  onClick={() => setPreviewImage(a.arquivoUrl)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition-colors mb-4 mt-auto"
                >
                  <ImageIcon className="w-4 h-4" /> Visualizar Documento
                </button>

                {/* Footer (Ações e Data) */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <span className="text-[10px] sm:text-xs text-slate-400">
                    Enviado em {new Date(a.criadoEm).toLocaleDateString('pt-BR')} às {new Date(a.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {a.status === 'pendente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatus(a.id, 'rejeitado')}
                        disabled={updating === a.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Rejeitar"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStatus(a.id, 'aprovado')}
                        disabled={updating === a.id}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Aprovar"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Preview de Imagem */}
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
              <button 
                onClick={() => setPreviewImage(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-50 flex items-center justify-center">
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
