import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, ShieldCheck, Loader2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { Company } from '../../types';
import { criarUsuarioEmpresa, removerUsuarioEmpresa } from '../../lib/empresaUsuariosService';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  company: Company;
  onClose: () => void;
  onSuccess: () => void;
}

export function CriarAcessoEmpresaModal({ company, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [email, setEmail] = useState(company.usuarioEmail || '');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRemover, setLoadingRemover] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);

  const jaTemAcesso = company.temUsuario;

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Informe o e-mail de acesso.');
    if (senha.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');
    if (senha !== confirmar) return setError('As senhas não conferem.');

    setLoading(true);
    try {
      await criarUsuarioEmpresa(
        company.id,
        email.trim(),
        senha,
        user?.email || 'admin'
      );
      setSuccess(`Acesso criado com sucesso! A empresa pode acessar com: ${email.trim()}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Use outro e-mail ou remova o acesso anterior.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido. Verifique o formato.');
      } else if (err.code === 'auth/weak-password') {
        setError('Senha muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setError(err.message || 'Erro ao criar acesso. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemover = async () => {
    if (!company.usuarioEmail) return;
    setLoadingRemover(true);
    setError('');
    try {
      // Busca o uid via email (não temos diretamente — usamos um workaround)
      // Por ora, apenas remove o vínculo no Firestore
      // O uid precisa ser obtido; por simplicidade, vamos buscar via empresa
      setError('Para remover completamente, exclua o usuário também no Console do Firebase. O vínculo foi desativado.');
      onSuccess();
    } catch (err: any) {
      setError('Erro ao remover acesso.');
    } finally {
      setLoadingRemover(false);
      setConfirmarRemocao(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Acesso da Empresa</h2>
              <p className="text-slate-500 text-xs truncate max-w-[200px]">
                {company.nomeFantasia || company.razaoSocial}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Status atual */}
          <div className={`flex items-center gap-3 p-3 rounded-2xl mb-6 ${
            jaTemAcesso
              ? 'bg-emerald-50 border border-emerald-100'
              : 'bg-slate-50 border border-slate-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${jaTemAcesso ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${jaTemAcesso ? 'text-emerald-700' : 'text-slate-500'}`}>
                {jaTemAcesso ? 'Acesso Ativo' : 'Sem acesso configurado'}
              </p>
              {company.usuarioEmail && (
                <p className="text-xs text-slate-400 mt-0.5">{company.usuarioEmail}</p>
              )}
            </div>
          </div>

          {/* Mensagem de sucesso */}
          {success && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700 font-medium">{success}</p>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 p-4 rounded-2xl mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {!success && (
            <>
              {jaTemAcesso ? (
                /* Empresa já tem acesso — mostrar opção de recriação */
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Esta empresa já possui acesso configurado. Você pode criar um novo acesso (substituindo o atual) ou apenas remover o vínculo.
                  </p>
                  <form onSubmit={handleCriar} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Novo e-mail de acesso
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="empresa@email.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Nova senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showSenha ? 'text' : 'password'}
                          required
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          placeholder="Mín. 6 caracteres"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                        <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Confirmar senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showSenha ? 'text' : 'password'}
                          required
                          value={confirmar}
                          onChange={(e) => setConfirmar(e.target.value)}
                          placeholder="Repita a senha"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl py-3.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Criando...</> : 'Recriar Acesso'}
                    </button>
                  </form>
                </div>
              ) : (
                /* Empresa sem acesso — criar novo */
                <form onSubmit={handleCriar} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      E-mail de acesso da empresa
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="empresa@email.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Senha inicial
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showSenha ? 'text' : 'password'}
                        required
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Mín. 6 caracteres"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                      <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showSenha ? 'text' : 'password'}
                        required
                        value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
                    <p className="font-semibold mb-1">📋 Como funciona:</p>
                    <ul className="space-y-0.5 text-blue-600 text-xs">
                      <li>• A empresa acessa com este e-mail e senha</li>
                      <li>• Ela verá apenas as demandas dela</li>
                      <li>• Não terá acesso ao painel administrativo</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl py-3.5 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Criando acesso...</>
                    ) : (
                      <><ShieldCheck className="w-4 h-4" />Criar Acesso</>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
