import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { Building2, Plus, ArrowRight, BarChart } from 'lucide-react';
import { motion } from 'motion/react';

interface CompanyListProps {
  companies: Company[];
  onViewCompany: (id: string) => void;
  onCreateCompany: () => void;
}

export function CompanyList({ companies, onViewCompany, onCreateCompany }: CompanyListProps) {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Empresas</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie seu diretório corporativo</p>
        </div>
        <button
          onClick={onCreateCompany}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {companies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center"
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Razão Social / Nome Fantasia</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">CNPJ</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Setor</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Tamanho</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{company.razaoSocial}</div>
                          {company.nomeFantasia && (
                            <div className="text-sm text-slate-500">{company.nomeFantasia}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-slate-100 text-slate-700">
                        {company.cnpj}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {company.setor || 'Não informado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <BarChart className="w-4 h-4 text-slate-400" />
                        {company.numeroFuncionarios} funcs.
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewCompany(company.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Ver página
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
