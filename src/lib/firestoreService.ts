/**
 * Serviço Firestore — Empresas, Notícias, Sugestões e Denúncias
 *
 * Estrutura no Firestore:
 *   empresas/{id}                  — dados da empresa
 *   empresas/{id}/noticias/{id}    — posts do blog
 *   empresas/{id}/sugestoes/{id}   — sugestões de visitantes
 *   empresas/{id}/denuncias/{id}   — denúncias de visitantes
 */

import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc,
  getDocs, onSnapshot, query, orderBy, serverTimestamp,
  Timestamp, writeBatch, type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Company, Noticia, Sugestao, Denuncia, Atestado, AuxilioSaudeMental,
  ApoioSaude, SegurancaTrabalho, TipoGestao, PostUniversal, PostUniversalDestinatario,
} from '../types';

// ─── Refs de coleção ─────────────────────────────────────────────────────────

const empresasCol = () => collection(db, 'empresas');
const noticiasCol  = (id: string) => collection(db, 'empresas', id, 'noticias');
const postsUniversaisCol = () => collection(db, 'postsUniversais');
const sugestoesCol = (id: string) => collection(db, 'empresas', id, 'sugestoes');
const denunciasCol = (id: string) => collection(db, 'empresas', id, 'denuncias');
const atestadosCol = (id: string) => collection(db, 'empresas', id, 'atestados');
const auxiliosCol = (id: string) => collection(db, 'empresas', id, 'auxilios');
const apoioSaudeCol = (id: string) => collection(db, 'empresas', id, 'apoioSaude');
const segurancaTrabalhoCol = (id: string) => collection(db, 'empresas', id, 'segurancaTrabalho');

// ─── Helpers de conversão ─────────────────────────────────────────────────────

function tsToIso(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'string') return v;
  return new Date().toISOString();
}

function docToCompany(id: string, d: Record<string, unknown>): Company {
  return {
    id,
    cnpj: (d.cnpj as string) || '',
    razaoSocial: (d.razaoSocial as string) || '',
    nomeFantasia: (d.nomeFantasia as string) || undefined,
    tipoGestao: (d.tipoGestao as TipoGestao) || undefined,
    numeroFuncionarios: (d.numeroFuncionarios as number) || 0,
    dataFundacao: d.dataFundacao ? tsToIso(d.dataFundacao) : undefined,
    email: (d.email as string) || undefined,
    telefone: (d.telefone as string) || undefined,
    endereco: (d.endereco as string) || undefined,
    setor: (d.setor as string) || undefined,
    slug: (d.slug as string) || id,
    descricao: (d.descricao as string) || undefined,
    website: (d.website as string) || undefined,
    corPrimaria: (d.corPrimaria as string) || '#2563EB',
    logoUrl: (d.logoUrl as string) || undefined,
    fundoUrl: (d.fundoUrl as string) || undefined,
    enableSugestoes: d.enableSugestoes !== undefined ? (d.enableSugestoes as boolean) : true,
    enableDenuncias: d.enableDenuncias !== undefined ? (d.enableDenuncias as boolean) : true,
    enableAtestados: d.enableAtestados !== undefined ? (d.enableAtestados as boolean) : true,
    enableAuxilios: d.enableAuxilios !== undefined ? (d.enableAuxilios as boolean) : true,
    enableApoioSaude: d.enableApoioSaude !== undefined ? (d.enableApoioSaude as boolean) : true,
    enableSegurancaTrabalho: d.enableSegurancaTrabalho !== undefined ? (d.enableSegurancaTrabalho as boolean) : true,
    showHeaderTexts: d.showHeaderTexts !== undefined ? (d.showHeaderTexts as boolean) : true,
    noticias: [],
    sugestoes: [],
    denuncias: [],
    atestados: [],
    auxilios: [],
    apoioSaude: [],
    segurancaTrabalho: [],
  };
}

function docToNoticia(id: string, d: Record<string, unknown>): Noticia {
  return {
    id,
    universalPostId: (d.universalPostId as string) || undefined,
    titulo: (d.titulo as string) || '',
    resumo: (d.resumo as string) || undefined,
    conteudo: (d.conteudo as string) || '',
    data: tsToIso(d.data),
    imagemUrl: (d.imagemUrl as string) || undefined,
    categoria: (d.categoria as string) || undefined,
    autor: (d.autor as string) || undefined,
  };
}

function docToPostUniversal(id: string, d: Record<string, unknown>): PostUniversal {
  return {
    id,
    titulo: (d.titulo as string) || '',
    resumo: (d.resumo as string) || undefined,
    conteudo: (d.conteudo as string) || '',
    data: tsToIso(d.data || d.criadoEm),
    imagemUrl: (d.imagemUrl as string) || undefined,
    categoria: (d.categoria as string) || undefined,
    autor: (d.autor as string) || undefined,
    empresaIds: (d.empresaIds as string[]) || [],
    destinatarios: (d.destinatarios as PostUniversalDestinatario[]) || [],
    criadoEm: tsToIso(d.criadoEm),
    atualizadoEm: d.atualizadoEm ? tsToIso(d.atualizadoEm) : undefined,
  };
}

function docToSugestao(id: string, d: Record<string, unknown>): Sugestao {
  return {
    id,
    nome: (d.nome as string) || 'Anônimo',
    email: (d.email as string) || undefined,
    telefone: (d.telefone as string) || undefined,
    categoria: (d.categoria as string) || 'Geral',
    mensagem: (d.mensagem as string) || '',
    anexo: (d.anexo as string) || undefined,
    status: (d.status as Sugestao['status']) || 'nova',
    resposta: (d.resposta as string) || undefined,
    respondidoEm: d.respondidoEm ? tsToIso(d.respondidoEm) : undefined,
    observacaoInterna: (d.observacaoInterna as string) || undefined,
    respondidoPor: (d.respondidoPor as string) || undefined,
    criadoEm: tsToIso(d.criadoEm),
  };
}

function docToDenuncia(id: string, d: Record<string, unknown>): Denuncia {
  return {
    id,
    nome: (d.nome as string) || 'Anônimo',
    email: (d.email as string) || undefined,
    telefone: (d.telefone as string) || undefined,
    tipo: (d.tipo as Denuncia['tipo']) || 'outro',
    descricao: (d.descricao as string) || '',
    provas: (d.provas as string) || undefined,
    status: (d.status as Denuncia['status']) || 'nova',
    resposta: (d.resposta as string) || undefined,
    respondidoEm: d.respondidoEm ? tsToIso(d.respondidoEm) : undefined,
    observacaoInterna: (d.observacaoInterna as string) || undefined,
    respondidoPor: (d.respondidoPor as string) || undefined,
    criadoEm: tsToIso(d.criadoEm),
  };
}

function docToAtestado(id: string, d: Record<string, unknown>): Atestado {
  return {
    id,
    nomeFuncionario: (d.nomeFuncionario as string) || 'Desconhecido',
    telefone: (d.telefone as string) || (d.whatsapp as string) || '',
    nomeMedico: (d.nomeMedico as string) || 'Não informado',
    crmMedico: (d.crmMedico as string) || 'Não informado',
    matricula: (d.matricula as string) || undefined,
    setor: (d.setor as string) || undefined,
    dataAfastamento: (d.dataAfastamento as string) || tsToIso(d.criadoEm),
    diasAfastamento: (d.diasAfastamento as number) || 1,
    motivoCid: (d.motivoCid as string) || undefined,
    arquivoUrl: (d.arquivoUrl as string) || '',
    status: d.status as Atestado['status'] || 'pendente',
    resposta: (d.resposta as string) || undefined,
    respondidoEm: d.respondidoEm ? tsToIso(d.respondidoEm) : undefined,
    observacaoInterna: (d.observacaoInterna as string) || undefined,
    respondidoPor: (d.respondidoPor as string) || undefined,
    criadoEm: tsToIso(d.criadoEm),
  };
}

function docToAuxilio(id: string, d: Record<string, unknown>): AuxilioSaudeMental {
  return {
    id,
    nomeFuncionario: (d.nomeFuncionario as string) || 'Desconhecido',
    matricula: (d.matricula as string) || undefined,
    setor: (d.setor as string) || undefined,
    telefone: (d.telefone as string) || '',
    tipoAuxilio: d.tipoAuxilio as AuxilioSaudeMental['tipoAuxilio'] || 'psicologico',
    motivoSolicitacao: (d.motivoSolicitacao as string) || 'Não informado',
    descricao: (d.descricao as string) || undefined,
    status: d.status as AuxilioSaudeMental['status'] || 'pendente',
    resposta: (d.resposta as string) || undefined,
    respondidoEm: d.respondidoEm ? tsToIso(d.respondidoEm) : undefined,
    observacaoInterna: (d.observacaoInterna as string) || undefined,
    respondidoPor: (d.respondidoPor as string) || undefined,
    criadoEm: tsToIso(d.criadoEm),
  };
}

function docToApoioSaude(id: string, d: Record<string, unknown>): ApoioSaude {
  return {
    id,
    nomeFuncionario: (d.nomeFuncionario as string) || 'Desconhecido',
    matricula: (d.matricula as string) || '',
    setor: (d.setor as string) || undefined,
    telefone: (d.telefone as string) || '',
    tipoConsulta: (d.tipoConsulta as string) || '',
    motivo: (d.motivo as string) || undefined,
    status: d.status as ApoioSaude['status'] || 'pendente',
    resposta: (d.resposta as string) || undefined,
    respondidoEm: d.respondidoEm ? tsToIso(d.respondidoEm) : undefined,
    observacaoInterna: (d.observacaoInterna as string) || undefined,
    respondidoPor: (d.respondidoPor as string) || undefined,
    criadoEm: tsToIso(d.criadoEm),
  };
}

function docToSegurancaTrabalho(id: string, d: Record<string, unknown>): SegurancaTrabalho {
  return {
    id,
    nome: (d.nome as string) || 'Anônimo',
    email: (d.email as string) || undefined,
    telefone: (d.telefone as string) || undefined,
    categoria: (d.categoria as string) || '',
    mensagem: (d.mensagem as string) || '',
    anexo: (d.anexo as string) || undefined,
    ciente: (d.ciente as boolean) || false,
    status: d.status as SegurancaTrabalho['status'] || 'nova',
    resposta: (d.resposta as string) || undefined,
    respondidoEm: d.respondidoEm ? tsToIso(d.respondidoEm) : undefined,
    observacaoInterna: (d.observacaoInterna as string) || undefined,
    respondidoPor: (d.respondidoPor as string) || undefined,
    criadoEm: tsToIso(d.criadoEm),
  };
}

// ─── Empresas ─────────────────────────────────────────────────────────────────

export function onEmpresasSnapshot(cb: (companies: Company[]) => void, onError?: (err: any) => void): Unsubscribe {
  const q = query(empresasCol(), orderBy('criadoEm', 'desc'));
  return onSnapshot(
    q,
    async (snap) => {
      try {
        const companies: Company[] = [];
        for (const ds of snap.docs) {
          const c = docToCompany(ds.id, ds.data() as Record<string, unknown>);
          const [nSnap, sSnap, dSnap, aSnap, auxSnap, asSnap, stSnap] = await Promise.all([
            getDocs(query(noticiasCol(ds.id),  orderBy('data',      'desc'))),
            getDocs(query(sugestoesCol(ds.id), orderBy('criadoEm',  'desc'))),
            getDocs(query(denunciasCol(ds.id), orderBy('criadoEm',  'desc'))),
            getDocs(query(atestadosCol(ds.id), orderBy('criadoEm',  'desc'))),
            getDocs(query(auxiliosCol(ds.id),  orderBy('criadoEm',  'desc'))),
            getDocs(query(apoioSaudeCol(ds.id),  orderBy('criadoEm',  'desc'))),
            getDocs(query(segurancaTrabalhoCol(ds.id),  orderBy('criadoEm',  'desc'))),
          ]);
          c.noticias  = nSnap.docs.map(n => docToNoticia(n.id,  n.data() as Record<string, unknown>));
          c.sugestoes = sSnap.docs.map(s => docToSugestao(s.id, s.data() as Record<string, unknown>));
          c.denuncias = dSnap.docs.map(d => docToDenuncia(d.id, d.data() as Record<string, unknown>));
          c.atestados = aSnap.docs.map(a => docToAtestado(a.id, a.data() as Record<string, unknown>));
          c.auxilios  = auxSnap.docs.map(x => docToAuxilio(x.id, x.data() as Record<string, unknown>));
          c.apoioSaude  = asSnap.docs.map(x => docToApoioSaude(x.id, x.data() as Record<string, unknown>));
          c.segurancaTrabalho = stSnap.docs.map(x => docToSegurancaTrabalho(x.id, x.data() as Record<string, unknown>));
          companies.push(c);
        }
        cb(companies);
      } catch (err) {
        console.error('Error in onEmpresasSnapshot:', err);
        if (onError) onError(err);
      }
    },
    (err) => {
      console.error('Snapshot listener error:', err);
      if (onError) onError(err);
    }
  );
}

export async function getEmpresaBySlug(slug: string): Promise<Company | null> {
  const snap = await getDocs(empresasCol());
  for (const ds of snap.docs) {
    if (ds.data().slug === slug) {
      const c = docToCompany(ds.id, ds.data() as Record<string, unknown>);
      try {
        const nSnap = await getDocs(query(noticiasCol(ds.id), orderBy('data', 'desc')));
        c.noticias = nSnap.docs.map(n => docToNoticia(n.id, n.data() as Record<string, unknown>));
      } catch (err) {
        console.warn('Erro ao carregar notícias públicas:', err);
        c.noticias = [];
      }
      return c;
    }
  }
  return null;
}

export async function createEmpresa(company: Omit<Company, 'id' | 'noticias' | 'sugestoes' | 'denuncias'>): Promise<string> {
  const ref = await addDoc(empresasCol(), {
    cnpj: company.cnpj,
    razaoSocial: company.razaoSocial,
    nomeFantasia: company.nomeFantasia || null,
    tipoGestao: company.tipoGestao || 'gerenciada_multimed',
    numeroFuncionarios: company.numeroFuncionarios,
    dataFundacao: company.dataFundacao || null,
    email: company.email || null,
    telefone: company.telefone || null,
    endereco: company.endereco || null,
    setor: company.setor || null,
    slug: company.slug,
    descricao: company.descricao || null,
    website: company.website || null,
    corPrimaria: company.corPrimaria || '#2563EB',
    logoUrl: company.logoUrl || null,
    fundoUrl: company.fundoUrl || null,
    enableSugestoes: company.enableSugestoes !== undefined ? company.enableSugestoes : true,
    enableDenuncias: company.enableDenuncias !== undefined ? company.enableDenuncias : true,
    enableAtestados: company.enableAtestados !== undefined ? company.enableAtestados : true,
    enableAuxilios: company.enableAuxilios !== undefined ? company.enableAuxilios : true,
    enableApoioSaude: company.enableApoioSaude !== undefined ? company.enableApoioSaude : true,
    enableSegurancaTrabalho: company.enableSegurancaTrabalho !== undefined ? company.enableSegurancaTrabalho : true,
    showHeaderTexts: company.showHeaderTexts !== undefined ? company.showHeaderTexts : true,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEmpresa(empresaId: string, updates: Partial<Company>): Promise<void> {
  const { id, noticias, sugestoes, denuncias, atestados, auxilios, apoioSaude, segurancaTrabalho, ...rest } = updates as Company;
  await updateDoc(doc(db, 'empresas', empresaId), { ...rest, atualizadoEm: serverTimestamp() });
}

export async function deleteEmpresa(empresaId: string): Promise<void> {
  const batch = writeBatch(db);
  const [nSnap, sSnap, dSnap, aSnap, auxSnap, asSnap, stSnap] = await Promise.all([
    getDocs(noticiasCol(empresaId)),
    getDocs(sugestoesCol(empresaId)),
    getDocs(denunciasCol(empresaId)),
    getDocs(atestadosCol(empresaId)),
    getDocs(auxiliosCol(empresaId)),
    getDocs(apoioSaudeCol(empresaId)),
    getDocs(segurancaTrabalhoCol(empresaId)),
  ]);
  [...nSnap.docs, ...sSnap.docs, ...dSnap.docs, ...aSnap.docs, ...auxSnap.docs, ...asSnap.docs, ...stSnap.docs].forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'empresas', empresaId));
  await batch.commit();
}

// ─── Notícias / Blog ──────────────────────────────────────────────────────────

export async function addNoticia(empresaId: string, noticia: Omit<Noticia, 'id' | 'data'>): Promise<string> {
  const ref = await addDoc(noticiasCol(empresaId), {
    titulo: noticia.titulo,
    resumo: noticia.resumo || null,
    conteudo: noticia.conteudo,
    imagemUrl: noticia.imagemUrl || null,
    categoria: noticia.categoria || null,
    autor: noticia.autor || null,
    data: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteNoticia(empresaId: string, noticiaId: string): Promise<void> {
  await deleteDoc(doc(db, 'empresas', empresaId, 'noticias', noticiaId));
}

export async function updateNoticia(
  empresaId: string,
  noticiaId: string,
  noticia: Partial<Omit<Noticia, 'id' | 'data'>>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (noticia.titulo !== undefined) updates.titulo = noticia.titulo;
  if (noticia.resumo !== undefined) updates.resumo = noticia.resumo || null;
  if (noticia.conteudo !== undefined) updates.conteudo = noticia.conteudo;
  if (noticia.imagemUrl !== undefined) updates.imagemUrl = noticia.imagemUrl || null;
  if (noticia.categoria !== undefined) updates.categoria = noticia.categoria || null;
  if (noticia.autor !== undefined) updates.autor = noticia.autor || null;
  updates.atualizadoEm = serverTimestamp();

  await updateDoc(doc(db, 'empresas', empresaId, 'noticias', noticiaId), updates);
}

export function onPostsUniversaisSnapshot(cb: (posts: PostUniversal[]) => void): Unsubscribe {
  const q = query(postsUniversaisCol(), orderBy('criadoEm', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map(ds => docToPostUniversal(ds.id, ds.data() as Record<string, unknown>));
      cb(list);
    },
    (err) => console.error('Erro no snapshot de postsUniversais:', err)
  );
}

export async function addUniversalPost(
  empresaIds: string[],
  noticia: Omit<Noticia, 'id' | 'data'>,
  destinatarios?: PostUniversalDestinatario[]
): Promise<string> {
  if (empresaIds.length === 0) return '';
  
  // 1. Criar doc mestre em postsUniversais
  const postRef = doc(postsUniversaisCol());
  const postId = postRef.id;

  const masterData = {
    titulo: noticia.titulo,
    resumo: noticia.resumo || null,
    conteudo: noticia.conteudo,
    imagemUrl: noticia.imagemUrl || null,
    categoria: noticia.categoria || null,
    autor: noticia.autor || null,
    empresaIds,
    destinatarios: destinatarios || [],
    data: serverTimestamp(),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(postRef, masterData);

  // 2. Criar réplica em cada empresa com universalPostId
  const itemData = {
    universalPostId: postId,
    titulo: noticia.titulo,
    resumo: noticia.resumo || null,
    conteudo: noticia.conteudo,
    imagemUrl: noticia.imagemUrl || null,
    categoria: noticia.categoria || null,
    autor: noticia.autor || null,
    data: serverTimestamp(),
  };

  empresaIds.forEach(empresaId => {
    const docRef = doc(noticiasCol(empresaId));
    batch.set(docRef, itemData);
  });

  await batch.commit();
  return postId;
}

export async function updateUniversalPost(
  postId: string,
  updates: Partial<Omit<Noticia, 'id' | 'data'>>,
  empresaIds?: string[]
): Promise<void> {
  const postRef = doc(db, 'postsUniversais', postId);
  const masterUpdates: Record<string, unknown> = {
    atualizadoEm: serverTimestamp(),
  };
  if (updates.titulo !== undefined) masterUpdates.titulo = updates.titulo;
  if (updates.resumo !== undefined) masterUpdates.resumo = updates.resumo || null;
  if (updates.conteudo !== undefined) masterUpdates.conteudo = updates.conteudo;
  if (updates.imagemUrl !== undefined) masterUpdates.imagemUrl = updates.imagemUrl || null;
  if (updates.categoria !== undefined) masterUpdates.categoria = updates.categoria || null;
  if (updates.autor !== undefined) masterUpdates.autor = updates.autor || null;

  await updateDoc(postRef, masterUpdates);

  // Buscar empresaIds se não fornecido
  let targetEmpresaIds = empresaIds;
  if (!targetEmpresaIds) {
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      targetEmpresaIds = (snap.data().empresaIds as string[]) || [];
    } else {
      targetEmpresaIds = [];
    }
  }

  // Atualizar réplicas nas empresas vinculadas
  for (const empresaId of targetEmpresaIds) {
    try {
      const q = query(noticiasCol(empresaId));
      const nSnap = await getDocs(q);
      const batch = writeBatch(db);
      let hasUpdates = false;

      nSnap.forEach(d => {
        const data = d.data();
        if (data.universalPostId === postId) {
          batch.update(d.ref, {
            ...masterUpdates,
            atualizadoEm: serverTimestamp(),
          });
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        await batch.commit();
      }
    } catch (err) {
      console.warn(`Erro ao atualizar réplica na empresa ${empresaId}:`, err);
    }
  }
}

export async function deleteUniversalPost(
  postId: string,
  empresaIds?: string[]
): Promise<void> {
  const postRef = doc(db, 'postsUniversais', postId);

  // Buscar empresaIds se não fornecido
  let targetEmpresaIds = empresaIds;
  if (!targetEmpresaIds) {
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      targetEmpresaIds = (snap.data().empresaIds as string[]) || [];
    } else {
      targetEmpresaIds = [];
    }
  }

  // 1. Deletar réplicas nas empresas
  for (const empresaId of targetEmpresaIds) {
    try {
      const q = query(noticiasCol(empresaId));
      const nSnap = await getDocs(q);
      const batch = writeBatch(db);
      let hasDeletes = false;

      nSnap.forEach(d => {
        const data = d.data();
        if (data.universalPostId === postId) {
          batch.delete(d.ref);
          hasDeletes = true;
        }
      });

      if (hasDeletes) {
        await batch.commit();
      }
    } catch (err) {
      console.warn(`Erro ao deletar réplica da empresa ${empresaId}:`, err);
    }
  }

  // 2. Deletar documento mestre
  await deleteDoc(postRef);
}

export async function deleteUniversalPostByTitle(empresaIds: string[], tituloExact: string): Promise<number> {
  let count = 0;
  const batch = writeBatch(db);
  
  const promises = empresaIds.map(async (empresaId) => {
    const q = query(noticiasCol(empresaId));
    const snaps = await getDocs(q);
    snaps.forEach(docSnap => {
      if (docSnap.data().titulo === tituloExact) {
        batch.delete(docSnap.ref);
        count++;
      }
    });
  });

  await Promise.all(promises);

  if (count > 0) {
    await batch.commit();
  }
  
  return count;
}

export function onNoticiasSnapshot(empresaId: string, cb: (n: Noticia[]) => void): Unsubscribe {
  return onSnapshot(
    query(noticiasCol(empresaId), orderBy('data', 'desc')),
    snap => cb(snap.docs.map(d => docToNoticia(d.id, d.data() as Record<string, unknown>)))
  );
}

// ─── Sugestões ────────────────────────────────────────────────────────────────

export async function addSugestao(
  empresaId: string,
  data: Omit<Sugestao, 'id' | 'status' | 'criadoEm'>
): Promise<string> {
  const ref = await addDoc(sugestoesCol(empresaId), {
    nome: data.nome || 'Anônimo',
    email: data.email || null,
    telefone: data.telefone || null,
    categoria: data.categoria,
    mensagem: data.mensagem,
    anexo: data.anexo || null,
    status: 'nova',
    criadoEm: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSugestaoStatus(
  empresaId: string,
  sugestaoId: string,
  status: Sugestao['status']
): Promise<void> {
  await updateDoc(doc(db, 'empresas', empresaId, 'sugestoes', sugestaoId), { status });
}

export function onSugestoesSnapshot(empresaId: string, cb: (s: Sugestao[]) => void): Unsubscribe {
  return onSnapshot(
    query(sugestoesCol(empresaId), orderBy('criadoEm', 'desc')),
    snap => cb(snap.docs.map(d => docToSugestao(d.id, d.data() as Record<string, unknown>)))
  );
}

// ─── Denúncias ────────────────────────────────────────────────────────────────

export async function addDenuncia(
  empresaId: string,
  data: Omit<Denuncia, 'id' | 'status' | 'criadoEm'>
): Promise<string> {
  const ref = await addDoc(denunciasCol(empresaId), {
    nome: data.nome || 'Anônimo',
    email: data.email || null,
    telefone: data.telefone || null,
    tipo: data.tipo,
    descricao: data.descricao,
    provas: data.provas || null,
    status: 'nova',
    criadoEm: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDenunciaStatus(
  empresaId: string,
  denunciaId: string,
  status: Denuncia['status']
): Promise<void> {
  await updateDoc(doc(db, 'empresas', empresaId, 'denuncias', denunciaId), { status });
}

export function onDenunciasSnapshot(empresaId: string, cb: (d: Denuncia[]) => void): Unsubscribe {
  return onSnapshot(
    query(denunciasCol(empresaId), orderBy('criadoEm', 'desc')),
    snap => cb(snap.docs.map(d => docToDenuncia(d.id, d.data() as Record<string, unknown>)))
  );
}

// ─── Atestados ────────────────────────────────────────────────────────────────

export async function addAtestado(
  empresaId: string,
  data: Omit<Atestado, 'id' | 'status' | 'criadoEm'>
): Promise<string> {
  const ref = await addDoc(atestadosCol(empresaId), {
    nomeFuncionario: data.nomeFuncionario,
    telefone: data.telefone,
    nomeMedico: data.nomeMedico,
    crmMedico: data.crmMedico,
    matricula: data.matricula || null,
    dataAfastamento: data.dataAfastamento,
    diasAfastamento: data.diasAfastamento,
    motivoCid: data.motivoCid || null,
    arquivoUrl: data.arquivoUrl,
    status: 'pendente',
    criadoEm: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAtestadoStatus(
  empresaId: string,
  atestadoId: string,
  status: Atestado['status']
): Promise<void> {
  await updateDoc(doc(db, 'empresas', empresaId, 'atestados', atestadoId), { status });
}

export function onAtestadosSnapshot(empresaId: string, cb: (a: Atestado[]) => void): Unsubscribe {
  return onSnapshot(
    query(atestadosCol(empresaId), orderBy('criadoEm', 'desc')),
    snap => cb(snap.docs.map(d => docToAtestado(d.id, d.data() as Record<string, unknown>)))
  );
}

// ─── Auxílio Saúde Mental ───────────────────────────────────────────────────

export async function addAuxilio(
  companyId: string,
  auxilio: Omit<AuxilioSaudeMental, 'id' | 'status' | 'criadoEm'>
): Promise<void> {
  await addDoc(auxiliosCol(companyId), {
    ...auxilio,
    status: 'pendente',
    criadoEm: serverTimestamp(),
  });
}

export async function updateAuxilioStatus(
  companyId: string,
  auxilioId: string,
  status: AuxilioSaudeMental['status']
): Promise<void> {
  await updateDoc(doc(db, 'empresas', companyId, 'auxilios', auxilioId), { status });
}

export function onAuxiliosSnapshot(
  companyId: string,
  cb: (auxilios: AuxilioSaudeMental[]) => void
): Unsubscribe {
  const q = query(auxiliosCol(companyId), orderBy('criadoEm', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => docToAuxilio(d.id, d.data() as Record<string, unknown>)));
  });
}

// ─── Apoio à Saúde ──────────────────────────────────────────────────────────

export async function addApoioSaude(
  companyId: string,
  data: Omit<ApoioSaude, 'id' | 'status' | 'criadoEm'>
): Promise<void> {
  await addDoc(apoioSaudeCol(companyId), {
    ...data,
    status: 'pendente',
    criadoEm: serverTimestamp(),
  });
}

export async function updateApoioSaudeStatus(
  companyId: string,
  id: string,
  status: ApoioSaude['status']
): Promise<void> {
  await updateDoc(doc(db, 'empresas', companyId, 'apoioSaude', id), { status });
}

export function onApoioSaudeSnapshot(
  companyId: string,
  cb: (items: ApoioSaude[]) => void
): Unsubscribe {
  const q = query(apoioSaudeCol(companyId), orderBy('criadoEm', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => docToApoioSaude(d.id, d.data() as Record<string, unknown>)));
  });
}

// ─── Segurança do Trabalho ──────────────────────────────────────────────────

export async function addSegurancaTrabalho(
  companyId: string,
  data: Omit<SegurancaTrabalho, 'id' | 'status' | 'criadoEm'>
): Promise<void> {
  await addDoc(segurancaTrabalhoCol(companyId), {
    ...data,
    status: 'nova',
    criadoEm: serverTimestamp(),
  });
}

export async function updateSegurancaTrabalhoStatus(
  companyId: string,
  id: string,
  status: SegurancaTrabalho['status']
): Promise<void> {
  await updateDoc(doc(db, 'empresas', companyId, 'segurancaTrabalho', id), { status });
}

export function onSegurancaTrabalhoSnapshot(
  companyId: string,
  cb: (items: SegurancaTrabalho[]) => void
): Unsubscribe {
  const q = query(segurancaTrabalhoCol(companyId), orderBy('criadoEm', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => docToSegurancaTrabalho(d.id, d.data() as Record<string, unknown>)));
  });
}

export interface TratativaDemandaData {
  status: string;
  resposta?: string;
  observacaoInterna?: string;
  respondidoPor?: string;
  respondidoEm?: string;
}

export async function salvarTratativaDemanda(
  empresaId: string,
  modulo: string,
  itemId: string,
  dados: TratativaDemandaData
): Promise<void> {
  let colName = 'sugestoes';
  const m = modulo.toLowerCase();
  if (m === 'sugestoes' || m === 'sugestao' || m === 'sugestão') colName = 'sugestoes';
  else if (m === 'denuncias' || m === 'denuncia' || m === 'denúncia') colName = 'denuncias';
  else if (m === 'atestados' || m === 'atestado') colName = 'atestados';
  else if (m === 'auxilios' || m === 'apoio emocional' || m === 'auxilio' || m === 'auxílio') colName = 'auxilios';
  else if (m === 'apoiosaude' || m === 'apoio à saúde' || m === 'apoio a saude') colName = 'apoioSaude';
  else if (m === 'segurancatrabalho' || m === 'segurança do trabalho' || m === 'seguranca do trabalho') colName = 'segurancaTrabalho';

  const docRef = doc(db, 'empresas', empresaId, colName, itemId);
  const payload: Record<string, any> = {
    status: dados.status,
    atualizadoEm: serverTimestamp(),
  };
  if (dados.resposta !== undefined) payload.resposta = dados.resposta;
  if (dados.observacaoInterna !== undefined) payload.observacaoInterna = dados.observacaoInterna;
  if (dados.respondidoPor !== undefined) payload.respondidoPor = dados.respondidoPor;
  if (dados.respondidoEm !== undefined) payload.respondidoEm = dados.respondidoEm;

  await updateDoc(docRef, payload);
}

// ─── Migração localStorage → Firestore ────────────────────────────────────────

export async function migrateFromLocalStorage(): Promise<number> {
  const saved = localStorage.getItem('companies');
  if (!saved) return 0;
  let parsed: Company[];
  try { parsed = JSON.parse(saved); } catch { return 0; }
  if (!parsed?.length) return 0;

  const existing = await getDocs(empresasCol());
  if (!existing.empty) { localStorage.removeItem('companies'); return 0; }

  let count = 0;
  for (const c of parsed) {
    const empresaRef = doc(db, 'empresas', c.id);
    await setDoc(empresaRef, {
      cnpj: c.cnpj, razaoSocial: c.razaoSocial,
      nomeFantasia: c.nomeFantasia || null,
      numeroFuncionarios: c.numeroFuncionarios,
      dataFundacao: c.dataFundacao || null,
      email: c.email || null, telefone: c.telefone || null,
      endereco: c.endereco || null, setor: c.setor || null,
      slug: c.slug || c.id, descricao: c.descricao || null,
      website: c.website || null, corPrimaria: c.corPrimaria || '#2563EB',
      logoUrl: c.logoUrl || null,
      fundoUrl: c.fundoUrl || null,
      enableSugestoes: true,
      enableDenuncias: true,
      enableAtestados: true,
      enableAuxilios: true,
      showHeaderTexts: true,
      criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(),
    });
    for (const n of (c.noticias || [])) {
      await addDoc(noticiasCol(c.id), {
        titulo: n.titulo, resumo: n.resumo || null,
        conteudo: n.conteudo, imagemUrl: n.imagemUrl || null,
        categoria: n.categoria || null, autor: n.autor || null,
        data: n.data ? Timestamp.fromDate(new Date(n.data)) : serverTimestamp(),
      });
    }
    count++;
  }
  localStorage.removeItem('companies');
  return count;
}
