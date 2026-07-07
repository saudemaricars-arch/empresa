import { useState, useEffect } from 'react';
import { SegurancaTrabalho } from '../../types';
import { Loader2, ShieldAlert, Clock, CheckCircle, RefreshCw, Paperclip, Download } from 'lucide-react';
import { onSegurancaTrabalhoSnapshot, updateSegurancaTrabalhoStatus } from '../../lib/firestoreService';
import { exportToCsv } from '../../utils/exportCsv';

interface SegurancaTrabalhoTabProps {
  empresaId: string;
}

export function SegurancaTrabalhoTab({ empresaId }: SegurancaTrabalhoTabProps) {
  const [solicitacoes, setSolicitacoes] = useState<SegurancaTrabalho[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'nova' | 'em_analise' | 'resolvida'>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    const unsub = onSegurancaTrabalhoSnapshot(empresaId, (data) => {
      setSolicitacoes(data);
      setLoading(false);
    });
    return () => unsub();
  }, [empresaId]);

  const handleStatusChange = async (id: string, novoStatus: SegurancaTrabalho['status']) => {
    try {
      await updateSegurancaTrabalhoStatus(empresaId, id, novoStatus);
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  const filtered = solicitacoes.filter((s) => {
    if (filter !== 'todos' && s.status !== filter) return false;
    if (dataInicio && new Date(s.criadoEm) < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && new Date(s.criadoEm) > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });

  const handleExport = () => {
    const data = filtered.map(s => ({
      ID: s.id,
      Autor: s.nome,
      Email: s.email || '',
      Telefone: s.telefone || '',
      Categoria: s.categoria,
      Status: s.status,
      'Data Envio': new Date(s.criadoEm).toLocaleDateString('pt-BR'),
      Mensagem: s.mensagem,
      'Possui Anexo': s.anexo ? 'Sim' : 'Não',
      'Termo Aceito': s.ciente ? 'Sim' : 'Não'
    }));
    exportToCsv('seguranca_trabalho.csv', data);
  };

  const getStatusBadge = (status: SegurancaTrabalho['status']) => {
    switch (status) {
      case 'nova': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-md flex items-center gap-1"><Clock className="w-3 h-3"/> Nova</span>;
      case 'em_analise': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin-slow"/> Em Análise</span>;
      case 'resolvida': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-md flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Resolvida</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-yellow-600" /> Segurança do Trabalho
          </h2>
          <p className="text-sm text-slate-500">Gerencie reportes de incidentes, condições inseguras e sugestões.</p>
        </div>

        <div className="flex flex-col xl:flex-row items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-2">
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 outline-none focus:border-yellow-400" />
            <span className="text-slate-400 text-xs">até</span>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 outline-none focus:border-yellow-400" />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['todos', 'nova', 'em_analise', 'resolvida'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap capitalize transition-colors ${
                  filter === f ? 'bg-white text-yellow-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-semibold transition-colors">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum chamado</h3>
          <p className="text-slate-500">Você não tem solicitações nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(req => (
            <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {req.nome === 'Anônimo' ? '👤 Anônimo' : `🪪 ${req.nome}`}
                  </h3>
                  <div className="text-xs text-slate-500 flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2">
                      <span>{new Date(req.criadoEm).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-600 truncate">{req.categoria}</span>
                    </div>
                    {(req.email || req.telefone) && (
                      <div className="flex flex-col gap-0.5 mt-1 text-slate-600">
                        {req.email && <span>📧 {req.email}</span>}
                        {req.telefone && <span>📞 {req.telefone}</span>}
                      </div>
                    )}
                  </div>
                </div>
                {getStatusBadge(req.status)}
              </div>

              <div className="flex flex-col gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Descrição do Chamado</div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">"{req.mensagem}"</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 items-center justify-between pt-4 border-t border-slate-100">
                <select
                  value={req.status}
                  onChange={(e) => handleStatusChange(req.id, e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-yellow-500"
                >
                  <option value="nova">Marcar como Nova</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="resolvida">Resolvida</option>
                </select>

                {req.anexo && (
                  <a
                    href={req.anexo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    Ver Anexo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
