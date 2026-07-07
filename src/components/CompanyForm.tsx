import React, { useState } from 'react';
import { Company } from '../types';
import { ArrowLeft, Building2, Save, AlertCircle, Globe, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface CompanyFormProps {
  onSave: (company: Omit<Company, 'id' | 'noticias' | 'slug'>) => void;
  onCancel: () => void;
  existingCnpjs: string[];
  initialData?: Company;
}

export function CompanyForm({ onSave, onCancel, existingCnpjs, initialData }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    cnpj: initialData?.cnpj || '',
    razaoSocial: initialData?.razaoSocial || '',
    nomeFantasia: initialData?.nomeFantasia || '',
    numeroFuncionarios: initialData?.numeroFuncionarios?.toString() || '',
    dataFundacao: initialData?.dataFundacao ? initialData.dataFundacao.split('T')[0] : '',
    email: initialData?.email || '',
    telefone: initialData?.telefone || '',
    endereco: initialData?.endereco || '',
    setor: initialData?.setor || '',
    descricao: initialData?.descricao || '',
    website: initialData?.website || '',
    corPrimaria: initialData?.corPrimaria || '#2563EB',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = numbers;
    if (numbers.length > 2) formatted = numbers.slice(0, 2) + '.' + numbers.slice(2);
    if (numbers.length > 5) formatted = formatted.slice(0, 6) + '.' + numbers.slice(5);
    if (numbers.length > 8) formatted = formatted.slice(0, 10) + '/' + numbers.slice(8);
    if (numbers.length > 12) formatted = formatted.slice(0, 15) + '-' + numbers.slice(12, 14);
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'cnpj') {
      newValue = formatCnpj(value);
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const numbersOnlyCnpj = formData.cnpj.replace(/\D/g, '');

    if (!formData.cnpj) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (numbersOnlyCnpj.length !== 14) {
      newErrors.cnpj = 'CNPJ inválido (14 dígitos obrigatórios)';
    } else if (existingCnpjs.includes(numbersOnlyCnpj)) {
      newErrors.cnpj = 'Este CNPJ já está cadastrado no sistema';
    }

    if (!formData.razaoSocial.trim()) {
      newErrors.razaoSocial = 'Razão Social é obrigatória';
    }

    if (!formData.numeroFuncionarios) {
      newErrors.numeroFuncionarios = 'Número de funcionários é obrigatório';
    } else if (parseInt(formData.numeroFuncionarios, 10) <= 0) {
      newErrors.numeroFuncionarios = 'Número de funcionários deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        numeroFuncionarios: parseInt(formData.numeroFuncionarios, 10),
      });
    }
  };

  const PRESET_COLORS = [
    '#2563EB', '#4F46E5', '#7C3AED', '#DB2777',
    '#DC2626', '#EA580C', '#D97706', '#16A34A',
    '#0D9488', '#0891B2', '#374151', '#111827',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
    >
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para listagem
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{initialData ? 'Editar Empresa' : 'Cadastro de Empresa'}</h1>
            <p className="text-sm text-slate-500 mt-1">{initialData ? 'Atualize os dados da corporação' : 'Preencha os dados da nova corporação'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* SEÇÃO: Dados Principais */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Dados Principais
            </h2>
            <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700">CNPJ *</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="cnpj"
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={`block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border ${
                      errors.cnpj ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.cnpj && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />{errors.cnpj}
                  </p>
                )}
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="razaoSocial" className="block text-sm font-medium text-slate-700">Razão Social *</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="razaoSocial"
                    id="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border ${
                      errors.razaoSocial ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.razaoSocial && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />{errors.razaoSocial}
                  </p>
                )}
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="nomeFantasia" className="block text-sm font-medium text-slate-700">Nome Fantasia</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="nomeFantasia"
                    id="nomeFantasia"
                    value={formData.nomeFantasia}
                    onChange={handleChange}
                    className="block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="numeroFuncionarios" className="block text-sm font-medium text-slate-700">Número de Funcionários *</label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="numeroFuncionarios"
                    id="numeroFuncionarios"
                    min="1"
                    value={formData.numeroFuncionarios}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border ${
                      errors.numeroFuncionarios ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.numeroFuncionarios && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />{errors.numeroFuncionarios}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="setor" className="block text-sm font-medium text-slate-700">Setor / Atividade</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="setor"
                    id="setor"
                    value={formData.setor}
                    onChange={handleChange}
                    placeholder="ex: Tecnologia, Saúde, Varejo"
                    className="block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="dataFundacao" className="block text-sm font-medium text-slate-700">Data de Fundação</label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="dataFundacao"
                    id="dataFundacao"
                    value={formData.dataFundacao}
                    onChange={handleChange}
                    className="block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Contato */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Contato & Localização
            </h2>
            <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="telefone" className="block text-sm font-medium text-slate-700">Telefone</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="telefone"
                    id="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">E-mail Corporativo</label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="website" className="block text-sm font-medium text-slate-700">Website</label>
                <div className="mt-1">
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.suaempresa.com.br"
                    className="block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="endereco" className="block text-sm font-medium text-slate-700">Endereço Completo</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="endereco"
                    id="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    className="block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Página Pública */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Página Pública
            </h2>
            <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="descricao" className="block text-sm font-medium text-slate-700">
                  Descrição da Empresa
                  <span className="ml-2 font-normal text-slate-400 text-xs">(aparece na seção "Sobre Nós")</span>
                </label>
                <div className="mt-1">
                  <textarea
                    name="descricao"
                    id="descricao"
                    rows={3}
                    value={formData.descricao}
                    onChange={handleChange}
                    placeholder="Missão, valores, história, produtos ou serviços..."
                    className="block w-full rounded-md shadow-sm sm:text-sm px-4 py-2 border border-slate-300 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cor da Marca
                  <span className="ml-2 font-normal text-slate-400 text-xs">(personaliza o visual da página pública)</span>
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-white shadow-sm"
                    style={{ background: formData.corPrimaria }}
                  />
                  <input
                    type="color"
                    name="corPrimaria"
                    id="corPrimaria"
                    value={formData.corPrimaria}
                    onChange={handleChange}
                    className="h-10 w-16 rounded cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.corPrimaria}
                    onChange={(e) => {
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                        setFormData((prev) => ({ ...prev, corPrimaria: e.target.value }));
                      }
                    }}
                    className="w-28 rounded-md shadow-sm sm:text-sm px-3 py-2 border border-slate-300 font-mono"
                    maxLength={7}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, corPrimaria: c }))}
                      className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                        formData.corPrimaria === c ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              {initialData ? 'Salvar Alterações' : 'Salvar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
