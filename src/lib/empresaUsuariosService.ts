/**
 * Serviço: empresaUsuariosService
 *
 * Gerencia a coleção /empresaUsuarios que vincula um UID do Firebase Auth
 * a uma empresa específica, definindo o papel (role) do usuário.
 *
 * Estrutura:
 *   /empresaUsuarios/{uid}
 *     - uid: string
 *     - email: string
 *     - empresaId: string
 *     - role: 'empresa'
 *     - criadoEm: timestamp
 *     - criadoPorAdmin: string (email do admin)
 */

import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  deleteField,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  getAuth,
} from 'firebase/auth';
import { db, auth } from './firebase';
import { EmpresaUsuario } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tsToIso(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'string') return v;
  return new Date().toISOString();
}

// ─── Buscar vínculo por UID ──────────────────────────────────────────────────

/**
 * Retorna o vínculo empresaUsuario para o UID informado.
 * Retorna null se não existir (significa que é um admin).
 */
export async function getEmpresaUsuarioPorUid(uid: string): Promise<EmpresaUsuario | null> {
  const ref = doc(db, 'empresaUsuarios', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const d = snap.data() as Record<string, unknown>;
  return {
    uid,
    email: (d.email as string) || '',
    empresaId: (d.empresaId as string) || '',
    role: 'empresa',
    criadoEm: tsToIso(d.criadoEm),
    criadoPorAdmin: (d.criadoPorAdmin as string) || '',
  };
}

// ─── Listar usuários da empresa ──────────────────────────────────────────────

export async function getUsuariosPorEmpresa(empresaId: string): Promise<EmpresaUsuario[]> {
  const q = query(collection(db, 'empresaUsuarios'), where('empresaId', '==', empresaId));
  const snap = await getDocs(q);
  
  return snap.docs.map(ds => {
    const d = ds.data() as Record<string, unknown>;
    return {
      uid: ds.id,
      email: (d.email as string) || '',
      empresaId: (d.empresaId as string) || '',
      role: 'empresa',
      criadoEm: tsToIso(d.criadoEm),
      criadoPorAdmin: (d.criadoPorAdmin as string) || '',
    };
  });
}

// ─── Criar usuário empresa ────────────────────────────────────────────────────

/**
 * Cria um novo usuário no Firebase Auth e vincula ao empresaId.
 *
 * ATENÇÃO: Esta abordagem usa uma instância secundária de auth para não
 * deslogar o admin atual. Após criar o usuário, faz signOut do secundário.
 */
export async function criarUsuarioEmpresa(
  empresaId: string,
  email: string,
  senha: string,
  adminEmail: string
): Promise<{ uid: string; email: string }> {
  // Salva as credenciais do admin para restaurar depois
  const adminUser = auth.currentUser;
  if (!adminUser) throw new Error('Admin não está autenticado.');

  // Cria o usuário usando uma instância secundária do Firebase Auth
  // para não fazer logout do admin
  const { initializeApp, getApp } = await import('firebase/app');
  const { getAuth: getSecondaryAuth } = await import('firebase/auth');

  let secondaryApp;
  try {
    secondaryApp = getApp('secondary');
  } catch {
    // Importa a config do firebase principal
    const firebaseModule = await import('./firebase');
    const primaryApp = firebaseModule.default;
    secondaryApp = initializeApp(primaryApp.options, 'secondary');
  }

  const secondaryAuth = getSecondaryAuth(secondaryApp);
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, senha);
  const newUser = userCredential.user;

  // Faz logout do auth secundário imediatamente
  await signOut(secondaryAuth);

  // Salva o vínculo no Firestore
  await setDoc(doc(db, 'empresaUsuarios', newUser.uid), {
    uid: newUser.uid,
    email,
    empresaId,
    role: 'empresa',
    criadoEm: serverTimestamp(),
    criadoPorAdmin: adminEmail,
  });

  // Atualiza a empresa com flag de que tem usuário
  const { updateEmpresa } = await import('./firestoreService');
  await updateEmpresa(empresaId, {
    temUsuario: true,
    usuarioEmail: email,
  } as any);

  return { uid: newUser.uid, email };
}

// ─── Remover usuário empresa ─────────────────────────────────────────────────

/**
 * Remove o vínculo do empresaUsuario do Firestore.
 * NOTA: A conta no Firebase Auth precisa ser deletada via Console ou Cloud Function.
 * Aqui removemos apenas o vínculo de role, efetivamente bloqueando o acesso ao portal.
 */
export async function removerUsuarioEmpresa(
  uid: string,
  empresaId: string
): Promise<void> {
  // Segurança: ao invés de deletar o documento (o que tornaria o usuário órfão e com privilégios de admin),
  // marcamos o usuário como explicitamente desativado e desvinculado.
  const { setDoc: setD, serverTimestamp: sTs } = await import('firebase/firestore');
  await setD(
    doc(db, 'empresaUsuarios', uid),
    {
      role: 'desativado',
      empresaId: null,
      desativadoEm: sTs(),
    },
    { merge: true }
  );

  // Registra na coleção de segurança para bloqueio imediato no Firestore Rules
  await setD(doc(db, 'usuariosDesativados', uid), {
    uid,
    desativadoEm: sTs(),
  });

  // Verifica se ainda existem outros usuários dessa empresa
  const { getDocs: getD } = await import('firebase/firestore');
  const q = query(collection(db, 'empresaUsuarios'), where('empresaId', '==', empresaId));
  const snap = await getDocs(q);
  const aindaTemUsuarios = snap.docs.length > 0;

  // Atualiza a empresa: se não tem mais usuários, remove as flags
  const { updateEmpresa } = await import('./firestoreService');
  if (aindaTemUsuarios) {
    // Ainda tem outros usuários — atualiza email para o próximo
    const nextUser = snap.docs[0].data();
    await updateEmpresa(empresaId, {
      temUsuario: true,
      usuarioEmail: nextUser.email,
    } as any);
  } else {
    // Sem usuários — remove os campos com deleteField()
    const { updateDoc } = await import('firebase/firestore');
    const { doc: d } = await import('firebase/firestore');
    await updateDoc(d(db, 'empresas', empresaId), {
      temUsuario: false,
      usuarioEmail: deleteField(),
    });
  }
}
