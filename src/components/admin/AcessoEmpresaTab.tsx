import React, { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Company, EmpresaUsuario } from '../../types';
import { getUsuariosPorEmpresa, removerUsuarioEmpresa } from '../../lib/empresaUsuariosService';

interface Props {
  company: Company;
  onAbrirModal: () => void;
}

export function AcessoEmpresaTab({ company, onAbrirModal }: Props) {
  const [usuarios, setUsuarios] = useState<EmpresaUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarUsuarios();
  }, [company.id]);

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const users = await getUsuariosPorEmpresa(company.id);
      setUsuarios(users);
    } catch (e) {
      console.error('Erro ao buscar usuários da empresa:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverUsuario = async (uid: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este acesso? A empresa perderá imediatamente o acesso ao portal.')) {
      return;
    }
    
    setDeletandoId(uid);
    try {
      await removerUsuarioEmpresa(uid, company.id);
      await carregarUsuarios(); // recarrega a lista
    } catch (e) {
      console.error('Erro ao remover usuário:', e);
      alert('Ocorreu um erro ao excluir o acesso.');
    } finally {
      setDeletandoId(null);
    }
  };

  // Usa a lista real como fonte da verdade, não o campo temUsuario que pode estar desatualizado
  const temAcesso = !loading && usuarios.length > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Acesso da Empresa</h2>
            <p className="text-sm text-slate-500">Gerencie os logins exclusivos desta empresa</p>
          </div>
        </div>

        {/* Status Geral — baseado na lista real de usuários */}
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className={`flex items-center gap-4 p-4 rounded-2xl mb-6 ${
              temAcesso
                ? 'bg-emerald-50 border border-emerald-100'
                : 'bg-amber-50 border border-amber-100'
            }`}>
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                temAcesso ? 'bg-emerald-500' : 'bg-amber-400'
              }`} />
              <div className="flex-1">
                <p className={`font-semibold text-sm ${
                  temAcesso ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {temAcesso
                    ? `${usuarios.length} acesso(s) ativo(s)`
                    : 'Sem acesso configurado'}
                </p>
                {!temAcesso && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    Esta empresa ainda não possui credenciais de acesso ao portal.
                  </p>
                )}
              </div>
            </div>

            {/* Lista de Usuários Vinculados */}
            {usuarios.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Usuários Vinculados</h3>
                {usuarios.map(u => (
                  <div key={u.uid} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{u.email}</p>
                      <p className="text-xs text-slate-500">Adicionado em: {new Date(u.criadoEm).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button
                      onClick={() => handleRemoverUsuario(u.uid)}
                      disabled={deletandoId === u.uid}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Excluir Acesso"
                    >
                      {deletandoId === u.uid ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Explicação */}
        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 mb-6 space-y-2">
          <p className="font-medium text-slate-700">Como funciona:</p>
          <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside">
            <li>A empresa acessa com e-mail e senha próprios</li>
            <li>Ela visualiza apenas suas próprias demandas</li>
            <li>Não tem acesso ao painel administrativo</li>
          </ul>
        </div>

        <button
          onClick={onAbrirModal}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-600/20"
        >
          <KeyRound className="w-4 h-4" />
          {temAcesso ? 'Adicionar Outro Acesso' : 'Criar Acesso para esta Empresa'}
        </button>
      </div>
    </motion.div>
  );
}
