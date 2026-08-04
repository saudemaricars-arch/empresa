import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CheckCircle, Loader2, ArrowLeft, Upload } from 'lucide-react';
import { motion, PanInfo } from 'motion/react';
import { addSegurancaTrabalho } from '../../lib/firestoreService';
import { uploadImage } from '../../lib/storageService';

interface SegurancaTrabalhoModalProps {
  empresaId: string;
  empresaNome: string;
  primaryColor: string;
  onClose: () => void;
}

const CATEGORIAS = [
  'Reportar uma condição insegura',
  'Reportar um ato inseguro',
  'Sugerir melhoria em segurança',
  'Solicitar manutenção de equipamento',
  'Solicitar ou substituir EPI',
  'Relatar risco de acidente',
  'Relatar risco químico',
  'Relatar risco físico (ruído, calor, vibração etc.)',
  'Relatar problema ergonômico',
  'Solicitar avaliação de saúde ocupacional',
  'Informar condição especial (gestação, limitação temporária, retorno ao trabalho)',
  'Comunicar quase acidente (Near Miss)',
  'Esclarecer dúvida sobre normas de segurança',
  'Solicitar treinamento',
  'Relatar problema de organização ou limpeza',
  'Relatar problema ambiental',
  'Outro'
];

export function SegurancaTrabalhoModal({ empresaId, empresaNome, primaryColor, onClose }: SegurancaTrabalhoModalProps) {
  const [anonimo, setAnonimo] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [mensagem, setMensagem] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [aceito, setAceito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim()) { setErro('Por favor, descreva sua solicitação.'); return; }
    if (!aceito) { setErro('Você precisa declarar que as informações são verdadeiras.'); return; }
    setErro('');
    setLoading(true);
    try {
      let anexoUrl = undefined;
      if (arquivo) {
        anexoUrl = await uploadImage('seguranca_trabalho', arquivo);
      }

      await addSegurancaTrabalho(empresaId, {
        nome: anonimo ? 'Anônimo' : (nome.trim() || 'Anônimo'),
        email: email.trim() || undefined,
        telefone: telefone.trim() || undefined,
        categoria,
        mensagem: mensagem.trim(),
        anexo: anexoUrl,
        ciente: aceito
      });
      setEnviado(true);
    } catch {
      setErro('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (e: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 200) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.8 }}
        onDragEnd={handleDragEnd}
        className="
          bg-white w-full flex flex-col
          rounded-t-3xl sm:rounded-2xl
          max-h-[95vh] sm:max-h-[90vh]
          sm:max-w-lg sm:mx-4
          shadow-2xl overflow-hidden
        "
      >
        <div className="flex justify-center pt-3 pb-2 sm:hidden shrink-0 cursor-grab active:cursor-grabbing touch-none">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

        <div
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0 bg-green-50 border-b border-green-100"
        >
          <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-gray-500 py-2 pr-3 sm:hidden">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-green-900 text-sm">Segurança do Trabalho</div>
              <div className="text-xs text-green-700 truncate max-w-[180px] sm:max-w-xs">{empresaNome}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-green-200 text-green-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5">
          {enviado ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-xl mb-2">Solicitação enviada!</div>
                <div className="text-sm text-gray-500 max-w-xs">A equipe de Segurança do Trabalho recebeu sua solicitação e irá analisar em breve.</div>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white min-h-[48px] bg-green-600 hover:bg-green-700"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 pb-2">
              <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAnonimo(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all min-h-[48px] ${anonimo ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                  👤 Anônimo
                </button>
                <button
                  type="button"
                  onClick={() => setAnonimo(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all min-h-[48px] ${!anonimo ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                  🪪 Me identificar
                </button>
              </div>

              {!anonimo && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Nome completo</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 min-h-[48px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">E-mail <span className="text-gray-400 font-normal">(opcional)</span></label>
                      <input
                        type="email"
                        inputMode="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 min-h-[48px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">WhatsApp / Telefone <span className="text-gray-400 font-normal">(opcional)</span></label>
                      <input
                        type="tel"
                        value={telefone}
                        onChange={e => setTelefone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 min-h-[48px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Categoria</label>
                <select
                  required
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm text-gray-800 appearance-none min-h-[48px]"
                >
                  {CATEGORIAS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Conte para nós um pouco melhor sobre sua solicitação: *</label>
                <textarea
                  required
                  rows={4}
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  placeholder="Descreva aqui o que ocorreu ou o que você precisa..."
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Anexo <span className="text-gray-400 font-normal">(opcional)</span></label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-2xl bg-white hover:bg-gray-50 transition-colors">
                  <div className="space-y-1 text-center">
                    {arquivo ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-2" />
                        <div className="text-sm text-gray-700 font-medium">{arquivo.name}</div>
                        <button
                          type="button"
                          onClick={() => setArquivo(null)}
                          className="mt-2 text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Remover / Trocar Arquivo
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label
                            htmlFor="file-upload-seguranca"
                            className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none"
                          >
                            <span>Selecione um arquivo</span>
                            <input
                              id="file-upload-seguranca"
                              name="file-upload-seguranca"
                              type="file"
                              accept="image/*,application/pdf"
                              className="sr-only"
                              onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                  setArquivo(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">Tire uma foto ou anexe um documento (PNG, JPG, PDF)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={aceito}
                  onChange={e => setAceito(e.target.checked)}
                  className="mt-0.5 shrink-0 w-5 h-5 rounded accent-green-500 text-green-600 focus:ring-green-500"
                />
                <span className="text-xs text-gray-600 leading-relaxed font-medium">
                  Estou ciente e declaro que as informações fornecidas são verdadeiras.
                </span>
              </label>

              {erro && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60 min-h-[56px] bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                {loading ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
