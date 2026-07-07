import { useState, useEffect } from 'react';
import { Sugestao } from '../../types';
import { updateSugestaoStatus, onSugestoesSnapshot } from '../../lib/firestoreService';
import { Lightbulb, User, Mail, Tag, Clock, CheckCircle, MessageSquare, Filter, Link, Download } from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';
import { motion } from 'motion/react';

interface SugestoesTabProps {
  sugestoes: Sugestao[];
  empresaId: string;
  primaryColor: string;
}

const STATUS_CONFIG = {
  nova:        { label: 'Nova',        color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  lida:        { label: 'Lida',        color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  respondida:  { label: 'Respondida',  color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
};

type Filtro = 'todas' | Sugestao['status'];

export function SugestoesTab({ sugestoes: initialSugestoes, empresaId, primaryColor }: SugestoesTabProps) {
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [updating, setUpdating] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>(initialSugestoes);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    const unsubscribe = onSugestoesSnapshot(empresaId, (data) => {
      setSugestoes(data);
    });
    return () => unsubscribe();
  }, [empresaId]);

  const filtered = sugestoes.filter(s => {
    if (filtro !== 'todas' && s.status !== filtro) return false;
    if (dataInicio && new Date(s.criadoEm) < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && new Date(s.criadoEm) > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });
  const novas = sugestoes.filter(s => s.status === 'nova').length;

  const handleExport = () => {
    const data = filtered.map(s => ({
      ID: s.id,
      Nome: s.nome,
      Email: s.email || 'Não informado',
      Categoria: s.categoria,
      Status: STATUS_CONFIG[s.status].label,
      Data: new Date(s.criadoEm).toLocaleDateString('pt-BR'),
      Mensagem: s.mensagem
    }));
    exportToCsv('sugestoes.csv', data);
  };

  const handleStatus = async (sugestaoId: string, status: Sugestao['status']) => {
    setUpdating(sugestaoId);
    try { await updateSugestaoStatus(empresaId, sugestaoId, status); }
    finally { setUpdating(null); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${primaryColor}15` }}>
              <Lightbulb className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Sugestões recebidas</h2>
              <p className="text-sm text-slate-500">
                {sugestoes.length} total
                {novas > 0 && <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-bold">{novas} nova{novas > 1 ? 's' : ''}</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-col xl:flex-row items-center gap-3">
            {/* Período */}
            <div className="flex items-center gap-2">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 outline-none focus:border-blue-400" />
              <span className="text-slate-400 text-xs">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 outline-none focus:border-blue-400" />
            </div>
            
            {/* Filtros */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              {(['todas', 'nova', 'lida', 'respondida'] as Filtro[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${filtro === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {f === 'todas' ? 'Todas' : STATUS_CONFIG[f].label}
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
          <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Nenhuma sugestão {filtro !== 'todas' ? `com status "${STATUS_CONFIG[filtro as Sugestao['status']].label}"` : 'recebida ainda'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 text-sm">{s.nome}</div>
                    {s.email && <div className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${STATUS_CONFIG[s.status].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s.status].dot}`} />
                    {STATUS_CONFIG[s.status].label}
                  </span>
                  <span className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                    <Tag className="w-3 h-3" />{s.categoria}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 mb-3">
                {s.mensagem}
              </p>

              {s.anexo && (
                <a
                  href={s.anexo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-3"
                >
                  <Link className="w-3 h-3" />
                  Ver anexo
                </a>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(s.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex gap-2">
                  {s.status === 'nova' && (
                    <button
                      onClick={() => handleStatus(s.id, 'lida')}
                      disabled={updating === s.id}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Marcar como lida
                    </button>
                  )}
                  {s.status !== 'respondida' && (
                    <button
                      onClick={() => handleStatus(s.id, 'respondida')}
                      disabled={updating === s.id}
                      className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Respondida
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
