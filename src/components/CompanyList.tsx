import React, { useState, useMemo } from 'react';
import { Company, TipoGestao, TIPOS_GESTAO } from '../types';
import { Building2, Plus, ArrowRight, BarChart, Tag, Search, Filter, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface CompanyListProps {
  companies: Company[];
  onViewCompany: (id: string) => void;
  onCreateCompany: () => void;
}

export function CompanyList({ companies, onViewCompany, onCreateCompany }: CompanyListProps) {
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Contadores para as tags
  const countGerenciadas = useMemo(
    () => companies.filter((c) => c.tipoGestao === 'gerenciada_multimed').length,
    [companies]
  );
  const countClientes = useMemo(
    () => companies.filter((c) => c.tipoGestao === 'cliente_nao_gerenciada').length,
    [companies]
  );
  const countPropria = useMemo(
    () => companies.filter((c) => c.tipoGestao === 'plataforma_propria').length,
    [companies]
  );
  const countSemTag = useMemo(
    () => companies.filter((c) => !c.tipoGestao).length,
    [companies]
  );

  // Filtro de empresas
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (filterTag !== 'all') {
        if (filterTag === 'sem_tag' && c.tipoGestao) return false;
        if (filterTag !== 'sem_tag' && c.tipoGestao !== filterTag) return false;
      }
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        const razao = c.razaoSocial.toLowerCase();
        const fantasia = (c.nomeFantasia || '').toLowerCase();
        const cnpj = c.cnpj;
        const setor = (c.setor || '').toLowerCase();
        if (!razao.includes(lower) && !fantasia.includes(lower) && !cnpj.includes(lower) && !setor.includes(lower)) {
          return false;
        }
      }
      return true;
    });
  }, [companies, filterTag, searchTerm]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Empresas</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie seu diretório corporativo e modelo de gestão</p>
        </div>
        <button
          onClick={onCreateCompany}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {companies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Nenhuma empresa cadastrada</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Comece adicionando a primeira empresa ao seu diretório para gerenciar informações, publicações e dados corporativos.
          </p>
          <button
            onClick={onCreateCompany}
            className="mt-6 inline-flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Empresa
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Pills de filtro por TAG */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setFilterTag('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterTag === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({companies.length})
              </button>

              <button
                onClick={() => setFilterTag('gerenciada_multimed')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  filterTag === 'gerenciada_multimed'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Gestão Multimed ({countGerenciadas})
              </button>

              <button
                onClick={() => setFilterTag('cliente_nao_gerenciada')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  filterTag === 'cliente_nao_gerenciada'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Cliente Multimed ({countClientes})
              </button>

              <button
                onClick={() => setFilterTag('plataforma_propria')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  filterTag === 'plataforma_propria'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Plataforma Própria ({countPropria})
              </button>

              {countSemTag > 0 && (
                <button
                  onClick={() => setFilterTag('sem_tag')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    filterTag === 'sem_tag'
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Sem Tag ({countSemTag})
                </button>
              )}
            </div>

            {/* Busca rápida */}
            <div className="relative min-w-[240px] shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Tabela de Empresas */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Razão Social / Nome Fantasia
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Gestão (TAG)
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Setor
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Tamanho
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                        Nenhuma empresa encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company) => {
                      const tagInfo = company.tipoGestao ? TIPOS_GESTAO[company.tipoGestao] : null;

                      return (
                        <tr key={company.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100"
                                style={{
                                  backgroundColor: `${company.corPrimaria || '#2563EB'}15`,
                                  color: company.corPrimaria || '#2563EB',
                                }}
                              >
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">{company.razaoSocial}</div>
                                {company.nomeFantasia && (
                                  <div className="text-xs text-slate-500">{company.nomeFantasia}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 font-mono">
                              {company.cnpj}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tagInfo ? (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${tagInfo.bgClass} ${tagInfo.textClass} ${tagInfo.borderClass}`}
                                title={tagInfo.descricao}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${tagInfo.dotClass}`} />
                                {tagInfo.badgeLabel}
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200"
                                title="Tipo de gestão não definido ainda"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                Não definida
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-600 font-medium">
                              {company.setor || 'Não informado'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                              <BarChart className="w-3.5 h-3.5 text-slate-400" />
                              {company.numeroFuncionarios} funcs.
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => onViewCompany(company.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all px-3 py-1.5 rounded-lg hover:bg-blue-50"
                            >
                              Ver painel
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
