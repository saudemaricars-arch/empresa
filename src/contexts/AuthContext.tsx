import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Loader2 } from 'lucide-react';
import { getEmpresaUsuarioPorUid } from '../lib/empresaUsuariosService';
import { UserRole } from '../types';

// ─── Tipos do contexto ────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole;           // 'admin' | 'empresa' | null
  empresaId: string | null; // preenchido quando role === 'empresa'
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  empresaId: null,
});

export const useAuth = () => useContext(AuthContext);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // Não está logado
        setUser(null);
        setRole(null);
        setEmpresaId(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        // Verifica se há um vínculo /empresaUsuarios/{uid}
        const vinculo = await getEmpresaUsuarioPorUid(currentUser.uid);

        if (vinculo) {
          if ((vinculo as any).role === 'desativado') {
            console.warn('Acesso negado: Usuário de empresa desativado.');
            setRole(null);
            setEmpresaId(null);
          } else {
            // É um usuário de empresa ativo
            setRole('empresa');
            setEmpresaId(vinculo.empresaId);
          }
        } else {
          // Não há vínculo → é um administrador do sistema
          setRole('admin');
          setEmpresaId(null);
        }
      } catch (err) {
        console.error('Erro ao verificar permissões do usuário:', err);
        // Princípio Fail-Closed: em caso de erro, bloqueia acesso por segurança
        setRole(null);
        setEmpresaId(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Loader central enquanto checa a sessão e o role
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Verificando acesso...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, empresaId }}>
      {children}
    </AuthContext.Provider>
  );
}
