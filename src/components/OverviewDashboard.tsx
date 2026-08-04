import React from 'react';
import { Company } from '../types';
import { Building2, Users, Briefcase, FileText, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

interface OverviewDashboardProps {
  companies: Company[];
  onViewCompany: (id: string) => void;
}

export function OverviewDashboard({ companies, onViewCompany }: OverviewDashboardProps) {
  // Calculate KPIs
  const totalCompanies = companies.length;
  const totalEmployees = companies.reduce((acc, c) => acc + c.numeroFuncionarios, 0);
  const totalNews = companies.reduce((acc, c) => acc + (c.noticias?.length || 0), 0);

  // Unique Sectors count
  const sectorsMap: Record<string, number> = {};
  companies.forEach(c => {
    const setor = c.setor || 'Não informado';
    sectorsMap[setor] = (sectorsMap[setor] || 0) + 1;
  });
  const uniqueSectors = Object.keys(sectorsMap).filter(s => s !== 'Não informado').length;

  const chartData = Object.keys(sectorsMap)
    .map(s => ({
      name: s,
      quantidade: sectorsMap[s]
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5); // top 5

  const recentCompanies = [...companies].reverse().slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">Painel Geral</h1>
        <p className="text-sm text-slate-500">Visão global dos indicadores do sistema</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Empresas" value={totalCompanies} icon={Building2} color="bg-blue-500" />
        <KpiCard title="Total de Funcionários" value={totalEmployees} icon={Users} color="bg-emerald-500" />
        <KpiCard title="Setores de Atuação" value={uniqueSectors} icon={Briefcase} color="bg-amber-500" />
        <KpiCard title="Publicações" value={totalNews} icon={FileText} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-medium text-slate-900">Empresas por Setor</h3>
          </div>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                  />
                  <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">Sem dados suficientes para o gráfico</p>
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-6">Adicionadas Recentemente</h3>
          <div className="space-y-4">
            {recentCompanies.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Nenhuma empresa no diretório.</p>
            ) : (
              recentCompanies.map(c => (
                <div 
                  key={c.id} 
                  className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors" 
                  onClick={() => onViewCompany(c.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                      <Building2 className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                        {c.nomeFantasia || c.razaoSocial}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">
                        {c.setor || 'Setor não informado'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-sm font-medium text-slate-500">{title}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </div>
    </motion.div>
  );
}
