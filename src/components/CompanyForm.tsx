import React, { useState } from 'react';
import { Company, TipoGestao, TIPOS_GESTAO } from '../types';
import {
  ArrowLeft, Building2, Save, AlertCircle, Globe, FileText, Tag, ShieldCheck, UserCheck, Sparkles,
  Upload, Image as ImageIcon, Loader2, RefreshCw, Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { uploadImage } from '../lib/storageService';

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
    tipoGestao: (initialData?.tipoGestao || 'gerenciada_multimed') as TipoGestao,
    numeroFuncionarios: initialData?.numeroFuncionarios?.toString() || '',
    dataFundacao: initialData?.dataFundacao ? initialData.dataFundacao.split('T')[0] : '',
    email: initialData?.email || '',
    telefone: initialData?.telefone || '',
    endereco: initialData?.endereco || '',
    setor: initialData?.setor || '',
    descricao: initialData?.descricao || '',
    website: initialData?.website || '',
    corPrimaria: initialData?.corPrimaria || '#2563EB',
    logoUrl: initialData?.logoUrl || '',
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);

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
        logoUrl: formData.logoUrl.trim() || undefined,
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

          {/* SEÇÃO: Logo da Empresa & Identidade Visual */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Logo da Empresa & Identidade
              </h2>
              <span className="text-xs font-medium text-slate-400">Exibida no cabeçalho e na página pública</span>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Atualize a logomarca da empresa ou sincronize diretamente com a logo definida na aba de criação da página.
            </p>

            <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Preview Box */}
              <div className="w-24 h-24 bg-white rounded-2xl border-2 border-slate-200 border-dashed flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo da Empresa"
                    className="w-full h-full object-contain p-1.5"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Building2 className="w-8 h-8" />
                    <span className="text-[10px] mt-1 font-medium">Sem Logo</span>
                  </div>
                )}
              </div>

              {/* Controles */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-wrap items-center gap-3">
                  <label className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 shadow-sm transition-colors ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Upload className="w-4 h-4 text-blue-600" />}
                    {uploadingLogo ? 'Enviando...' : (formData.logoUrl ? 'Trocar Imagem' : 'Fazer Upload do Logo')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingLogo(true);
                          const ext = file.name.split('.').pop() || 'png';
                          const path = `empresas/${initialData?.id || 'temp'}/logo_${Date.now()}.${ext}`;
                          const url = await uploadImage(path, file);
                          setFormData((prev) => ({ ...prev, logoUrl: url }));
                        } catch (error) {
                          console.error('Erro ao fazer upload da logo:', error);
                          alert('Erro ao enviar imagem da logo.');
                        } finally {
                          setUploadingLogo(false);
                        }
                      }}
                    />
                  </label>

                  {initialData?.logoUrl && initialData.logoUrl !== formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: initialData.logoUrl || '' }))}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                      title="Restaurar a logo configurada anteriormente"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Puxar logo da Página Pública
                    </button>
                  )}

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor="logoUrl" className="block text-xs font-medium text-slate-500 mb-1">
                    Ou informe o link direto da Logo (URL da imagem):
                  </label>
                  <input
                    type="url"
                    id="logoUrl"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    placeholder="https://exemplo.com/logo.png"
                    className="block w-full rounded-md shadow-sm sm:text-xs px-3 py-2 border border-slate-300 focus:ring-blue-500 focus:border-blue-500 font-mono text-slate-700 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Classificação & Gestão (TAG Multimed) */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                Classificação & Gestão (TAG Multimed)
              </h2>
              <span className="text-xs font-medium text-slate-400">Utilizado para identificação e filtros</span>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Indique como a empresa se relaciona com a Multimed para facilitar a organização e relatórios futuros.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Opção 1: Gerenciada pela Multimed */}
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, tipoGestao: 'gerenciada_multimed' }))}
                className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all relative ${
                  formData.tipoGestao === 'gerenciada_multimed'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Gestão Multimed
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      formData.tipoGestao === 'gerenciada_multimed'
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {formData.tipoGestao === 'gerenciada_multimed' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="font-semibold text-sm text-slate-900 mb-1">
                  Gerenciada pela Multimed
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  A equipe Multimed realiza a gestão ativa da empresa, atendimentos e demandas.
                </div>
              </button>

              {/* Opção 2: Cliente Multimed (Não Gerenciada) */}
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, tipoGestao: 'cliente_nao_gerenciada' }))}
                className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all relative ${
                  formData.tipoGestao === 'cliente_nao_gerenciada'
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    <UserCheck className="w-3.5 h-3.5" />
                    Cliente Multimed
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      formData.tipoGestao === 'cliente_nao_gerenciada'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {formData.tipoGestao === 'cliente_nao_gerenciada' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="font-semibold text-sm text-slate-900 mb-1">
                  Cliente Multimed (Não Gerenciada)
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Empresa é cliente da Multimed, mas a gestão do portal é realizada por ela mesma.
                </div>
              </button>

              {/* Opção 3: Plataforma Própria */}
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, tipoGestao: 'plataforma_propria' }))}
                className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all relative ${
                  formData.tipoGestao === 'plataforma_propria'
                    ? 'border-purple-500 bg-purple-50/50 shadow-sm ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    Plataforma Própria
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      formData.tipoGestao === 'plataforma_propria'
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {formData.tipoGestao === 'plataforma_propria' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="font-semibold text-sm text-slate-900 mb-1">
                  Plataforma Própria
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Cliente adquiriu a plataforma por conta própria para gerenciar seus colaboradores.
                </div>
              </button>
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
