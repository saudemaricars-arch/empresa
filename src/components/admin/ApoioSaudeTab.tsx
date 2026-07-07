import { useState, useEffect } from 'react';
import { Company, ApoioSaude } from '../../types';
import { Loader2, Heart, Clock, CheckCircle, RefreshCw, MessageCircle, Download } from 'lucide-react';
import { onApoioSaudeSnapshot, updateApoioSaudeStatus } from '../../lib/firestoreService';
import { exportToCsv } from '../../utils/exportCsv';

interface ApoioSaudeTabProps {
  company: Company;
}

export function ApoioSaudeTab({ company }: ApoioSaudeTabProps) {
  const [solicitacoes, setSolicitacoes] = useState<ApoioSaude[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'em_atendimento' | 'concluido'>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    const unsub = onApoioSaudeSnapshot(company.id, (data) => {
      setSolicitacoes(data);
      setLoading(false);
    });
    return () => unsub();
  }, [company.id]);

  const handleStatusChange = async (id: string, novoStatus: ApoioSaude['status']) => {
    try {
      await updateApoioSaudeStatus(company.id, id, novoStatus);
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  const filtered = solicitacoes.filter((a) => {
    if (filter !== 'todos' && a.status !== filter) return false;
    if (dataInicio && new Date(a.criadoEm) < new Date(dataInicio + 'T00:00:00')) return false;
    if (dataFim && new Date(a.criadoEm) > new Date(dataFim + 'T23:59:59')) return false;
    return true;
  });

  const handleExport = () => {
    const data = filtered.map(a => ({
      ID: a.id,
      Funcionário: a.nomeFuncionario,
      Matrícula: a.matricula || 'N/A',
      Status: a.status,
      Telefone: a.telefone,
      'Tipo Consulta': a.tipoConsulta,
      'Data Solicitação': new Date(a.criadoEm).toLocaleDateString('pt-BR'),
      Motivo: a.motivo || 'Não informado'
    }));
    exportToCsv('apoio_saude.csv', data);
  };

  const getStatusBadge = (status: ApoioSaude['status']) => {
    switch (status) {
      case 'pendente': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-md flex items-center gap-1"><Clock className="w-3 h-3"/> Pendente</span>;
      case 'em_atendimento': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin-slow"/> Em Atendimento</span>;
      case 'concluido': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-md flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Concluído</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Heart className="w-6 h-6 text-blue-600" /> Apoio à Saúde
          </h2>
          <p className="text-sm text-slate-500">Gerencie as solicitações de consultas e apoio à saúde.</p>
        </div>

        <div className="flex flex-col xl:flex-row items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-2">
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 outline-none focus:border-blue-400" />
            <span className="text-slate-400 text-xs">até</span>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 outline-none focus:border-blue-400" />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['todos', 'pendente', 'em_atendimento', 'concluido'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap capitalize transition-colors ${
                  filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhuma solicitação</h3>
          <p className="text-slate-500">Você não tem solicitações nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(req => (
            <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">{req.nomeFuncionario}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <span>{new Date(req.criadoEm).toLocaleDateString('pt-BR')}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-600">{req.telefone}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-600">CPF: {req.matricula}</span>
                  </div>
                </div>
                {getStatusBadge(req.status)}
              </div>

              <div className="flex flex-col gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wider">Especialidade / Consulta</div>
                  <div className="text-sm font-medium text-slate-800 capitalize flex items-center gap-2">
                    {req.tipoConsulta}
                  </div>
                </div>

                {req.motivo && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Motivo</div>
                    <p className="text-sm text-slate-700 italic">"{req.motivo}"</p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2 items-center justify-between pt-4 border-t border-slate-100">
                <select
                  value={req.status}
                  onChange={(e) => handleStatusChange(req.id, e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="pendente">Marcar Pendente</option>
                  <option value="em_atendimento">Em Atendimento</option>
                  <option value="concluido">Concluir</option>
                </select>

                <a
                  href={`https://wa.me/55${req.telefone.replace(/\D/g, '')}?text=Olá ${req.nomeFuncionario}, recebemos sua solicitação de consulta com ${req.tipoConsulta} no sistema da empresa.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-bold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chamar no WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
