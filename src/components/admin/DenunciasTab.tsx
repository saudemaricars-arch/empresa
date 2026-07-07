import { useState, useEffect } from 'react';
import { Denuncia } from '../../types';
import { updateDenunciaStatus, onDenunciasSnapshot } from '../../lib/firestoreService';
import { ShieldAlert, User, Mail, Clock, Link, AlertTriangle, CheckCircle, Archive, Search, Download } from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';
import { motion } from 'motion/react';

interface DenunciasTabProps {
  denuncias: Denuncia[];
  empresaId: string;
}

const STATUS_CONFIG = {
  nova:       { label: 'Nova',        color: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  em_analise: { label: 'Em Análise',  color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  resolvida:  { label: 'Resolvida',   color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  arquivada:  { label: 'Arquivada',   color: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400' },
};

const TIPO_CONFIG: Record<Denuncia['tipo'], { label: string; icon: string }> = {
  assedio:       { label: 'Assédio',               icon: '🚫' },
  fraude:        { label: 'Fraude',                icon: '💰' },
  corrupcao:     { label: 'Corrupção',             icon: '⚖️' },
  descumprimento:{ label: 'Descumprimento',        icon: '📋' },
  outro:         { label: 'Outro',                 icon: '📌' },
};

type Filtro = 'todas' | Denuncia['status'];

export function DenunciasTab({ denuncias: initialDenuncias, empresaId }: DenunciasTabProps) {
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [updating, setUpdating] = useState<string | null>(null);
  const [denuncias, setDenuncias] = useState<Denuncia[]>(initialDenuncias);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    const unsubscribe = onDenunciasSnapshot(empresaId, (data) => {
      setDenuncias(data);
    });
    return () => unsubscribe();
  }, [empresaId]);

  const filtered = denuncias.filter(d => {
    if (filtro !== 'todas' && d.status !== filtro) return false;
    if (dataInicio && new Date(d.criadoEm) < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && new Date(d.criadoEm) > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });
  const novas = denuncias.filter(d => d.status === 'nova').length;

  const handleExport = () => {
    const data = filtered.map(d => ({
      ID: d.id,
      Nome: d.nome,
      Email: d.email || 'Não informado',
      Tipo: TIPO_CONFIG[d.tipo].label,
      Status: STATUS_CONFIG[d.status].label,
      Data: new Date(d.criadoEm).toLocaleDateString('pt-BR'),
      Descrição: d.descricao
    }));
    exportToCsv('denuncias.csv', data);
  };

  const handleStatus = async (id: string, status: Denuncia['status']) => {
    setUpdating(id);
    try { await updateDenunciaStatus(empresaId, id, status); }
    finally { setUpdating(null); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Denúncias recebidas</h2>
              <p className="text-sm text-slate-500">
                {denuncias.length} total
                {novas > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-bold">
                    {novas} nova{novas > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col xl:flex-row items-center gap-3">
            {/* Período */}
            <div className="flex items-center gap-2">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 outline-none focus:border-red-400" />
              <span className="text-slate-400 text-xs">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 outline-none focus:border-red-400" />
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg flex-wrap">
              {(['todas', 'nova', 'em_analise', 'resolvida', 'arquivada'] as Filtro[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filtro === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {f === 'todas' ? 'Todas' : STATUS_CONFIG[f as Denuncia['status']].label}
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
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {filtro === 'todas' ? 'Nenhuma denúncia recebida.' : `Nenhuma denúncia "${STATUS_CONFIG[filtro as Denuncia['status']].label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <div key={d.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Barra superior colorida por status */}
              <div className={`h-1 w-full ${STATUS_CONFIG[d.status].dot.replace('bg-', 'bg-')}`} />
              <div className="p-5">
                {/* Cabeçalho */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-sm">
                      {TIPO_CONFIG[d.tipo].icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 text-sm">{d.nome}</div>
                      {d.email && <div className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" />{d.email}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${STATUS_CONFIG[d.status].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[d.status].dot}`} />
                      {STATUS_CONFIG[d.status].label}
                    </span>
                    <span className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">
                      {TIPO_CONFIG[d.tipo].icon} {TIPO_CONFIG[d.tipo].label}
                    </span>
                  </div>
                </div>

                {/* Descrição */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-3">
                  <p className="text-sm text-slate-800 leading-relaxed">{d.descricao}</p>
                </div>

                {/* Provas */}
                {d.provas && (
                  <a
                    href={d.provas}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-3"
                  >
                    <Link className="w-3 h-3" />
                    Ver evidências / provas
                  </a>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(d.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex gap-2">
                    {d.status === 'nova' && (
                      <button
                        onClick={() => handleStatus(d.id, 'em_analise')}
                        disabled={updating === d.id}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5" /> Em Análise
                      </button>
                    )}
                    {(d.status === 'nova' || d.status === 'em_analise') && (
                      <button
                        onClick={() => handleStatus(d.id, 'resolvida')}
                        disabled={updating === d.id}
                        className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Resolvida
                      </button>
                    )}
                    {d.status !== 'arquivada' && (
                      <button
                        onClick={() => handleStatus(d.id, 'arquivada')}
                        disabled={updating === d.id}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Archive className="w-3.5 h-3.5" /> Arquivar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
