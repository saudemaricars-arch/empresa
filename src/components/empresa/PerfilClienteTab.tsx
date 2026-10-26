import React, { useState } from 'react';
import {
  User, Building2, ShieldCheck, Mail, Phone, MapPin, Users,
  Palette, Globe, Save, Loader2, ExternalLink, Lock, Check,
  AlertCircle, CheckCircle2, Copy, KeyRound
} from 'lucide-react';
import { Company } from '../../types';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface PerfilClienteTabProps {
  company: Company;
  userEmail?: string;
  onUpdateCompany: (updates: Partial<Company>) => Promise<void>;
  onLogout: () => void;
}

export function PerfilClienteTab({
  company,
  userEmail,
  onUpdateCompany,
  onLogout,
}: PerfilClienteTabProps) {
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [resetEmailEnviado, setResetEmailEnviado] = useState(false);
  const [resetEnviando, setResetEnviando] = useState(false);

  // Formulário editável de dados da empresa
  const [form, setForm] = useState({
    nomeFantasia: company.nomeFantasia || '',
    razaoSocial: company.razaoSocial || '',
    email: company.email || '',
    telefone: company.telefone || '',
    numeroFuncionarios: company.numeroFuncionarios || 0,
    endereco: company.endereco || '',
    setor: company.setor || '',
  });

  const formatCnpj = (v: string) => {
    if (!v) return 'Não informado';
    return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const publicUrl = `${window.location.origin}${window.location.pathname}#/empresa/${company.slug}`;

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      alert('Link: ' + publicUrl);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagemSucesso(null);
    setErro(null);

    try {
      await onUpdateCompany({
        nomeFantasia: form.nomeFantasia.trim() || undefined,
        email: form.email.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        numeroFuncionarios: Number(form.numeroFuncionarios) || 0,
        endereco: form.endereco.trim() || undefined,
        setor: form.setor.trim() || undefined,
      });

      setMensagemSucesso('Dados do perfil atualizados com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setErro('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleSolicitarResetSenha = async () => {
    if (!userEmail) return;
    setResetEnviando(true);
    try {
      await sendPasswordResetEmail(auth, userEmail);
      setResetEmailEnviado(true);
      setTimeout(() => setResetEmailEnviado(false), 6000);
    } catch (err) {
      console.error('Erro ao solicitar redefinição de senha:', err);
      alert('Não foi possível enviar o e-mail de redefinição. Contate o suporte.');
    } finally {
      setResetEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Avatar / Logo Grande */}
            <div className="relative">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.nomeFantasia || company.razaoSocial}
                  className="w-16 h-16 rounded-2xl object-contain border border-slate-200 p-1 bg-white shadow-sm"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-sm"
                  style={{ background: company.corPrimaria || '#2563EB' }}
                >
                  <Building2 className="w-8 h-8" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {company.nomeFantasia || company.razaoSocial}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Conta PJ Homologada
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                CNPJ: <span className="font-mono font-semibold text-slate-700">{formatCnpj(company.cnpj)}</span>
                {company.razaoSocial !== company.nomeFantasia && ` · ${company.razaoSocial}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sessão Conectada (SSL)
            </span>
          </div>
        </div>
      </div>

      {/* Feedback de sucesso ou erro */}
      {mensagemSucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-emerald-800 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-red-800 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Grid de Configurações do Perfil */}
      <form onSubmit={handleSalvar} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Dados Institucionais da Empresa */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Dados Institucionais da Empresa
            </h3>
            <p className="text-xs text-slate-500">
              Informações utilizadas nos relatórios, atestados e laudos ocupacionais.
            </p>

            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={form.nomeFantasia}
                  onChange={e => setForm({ ...form, nomeFantasia: e.target.value })}
                  placeholder="Nome Fantasia da Empresa"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Razão Social (Registro Oficial)
                </label>
                <input
                  type="text"
                  disabled
                  value={form.razaoSocial}
                  className="w-full text-sm bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-500 font-medium cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Para alterar a Razão Social ou CNPJ, solicite à equipe técnica da Multimed.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail do DP / RH
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="dp@empresa.com.br"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp / Telefone RH
                  </label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={e => setForm({ ...form, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Colaboradores / Vidas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.numeroFuncionarios}
                    onChange={e => setForm({ ...form, numeroFuncionarios: Number(e.target.value) })}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Setor / Atividade
                  </label>
                  <input
                    type="text"
                    value={form.setor}
                    onChange={e => setForm({ ...form, setor: e.target.value })}
                    placeholder="Ex: Tecnologia, Indústria..."
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Endereço / Matriz
                </label>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={e => setForm({ ...form, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Página Pública dos Colaboradores */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Página Pública dos Colaboradores
            </h3>
            <p className="text-xs text-slate-500">
              Endereço exclusivo que seus colaboradores acessam para envio de atestados médicos, denúncias anônimas e solicitações de saúde.
            </p>

            <div className="pt-2">
              {/* Link de Compartilhamento com o Colaborador */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
                <span className="text-xs font-bold text-blue-900 block mb-1.5">
                  Link Direto dos Colaboradores:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="w-full text-xs font-mono bg-white border border-blue-200 rounded-xl px-3 py-2 text-slate-700 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopiarLink}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Copiar link para a área de transferência"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-blue-200 transition-colors shrink-0 shadow-sm"
                    title="Abrir página em nova aba"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </a>
                </div>
                <p className="text-[11px] text-blue-700/80 mt-2">
                  Divulgue este link no mural interno, WhatsApp ou onboarding dos seus colaboradores.
                </p>
              </div>
            </div>

            {/* Aviso informativo corporativo */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Identidade visual e marca configuradas pela gestão Multimed</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Padrão Homologado</span>
            </div>
          </div>
        </div>

        {/* Card 3: Segurança & Credenciais da Conta */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Segurança & Credenciais de Acesso
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Você está autenticado com o e-mail: <strong className="text-slate-800 font-mono">{userEmail}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSolicitarResetSenha}
                disabled={resetEnviando || resetEmailEnviado}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors disabled:opacity-50"
              >
                {resetEnviando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : resetEmailEnviado ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>
                  {resetEmailEnviado ? 'E-mail de Redefinição Enviado!' : 'Redefinir Minha Senha'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Ação Inferior */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando Alterações...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Dados do Perfil
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
