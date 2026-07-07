import React, { useState, useEffect } from 'react';
import { X, FilePlus, CheckCircle, Loader2, ArrowLeft, Upload } from 'lucide-react';
import { motion, PanInfo } from 'motion/react';
import { addAtestado } from '../../lib/firestoreService';
import { uploadImage } from '../../lib/storageService';

interface AtestadoModalProps {
  empresaId: string;
  empresaNome: string;
  primaryColor: string;
  onClose: () => void;
}

export function AtestadoModal({ empresaId, empresaNome, primaryColor, onClose }: AtestadoModalProps) {
  const [nomeFuncionario, setNomeFuncionario] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeMedico, setNomeMedico] = useState('');
  const [crmMedico, setCrmMedico] = useState('');
  const [matricula, setMatricula] = useState('');
  const [dataAfastamento, setDataAfastamento] = useState('');
  const [diasAfastamento, setDiasAfastamento] = useState('1');
  const [motivoCid, setMotivoCid] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);

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
    if (!nomeFuncionario.trim() || !telefone.trim() || !nomeMedico.trim() || !crmMedico.trim() || !dataAfastamento || !diasAfastamento || !arquivo) {
      setErro('Por favor, preencha todos os campos obrigatórios e anexe o atestado.');
      return;
    }
    
    setErro('');
    setLoading(true);
    
    try {
      // 1. Converter a imagem em base64 com compressão
      const arquivoUrl = await uploadImage('atestados', arquivo);

      // 2. Salvar no Firestore
      await addAtestado(empresaId, {
        nomeFuncionario: nomeFuncionario.trim(),
        telefone: telefone.trim(),
        nomeMedico: nomeMedico.trim(),
        crmMedico: crmMedico.trim(),
        matricula: matricula.trim() || undefined,
        dataAfastamento,
        diasAfastamento: parseInt(diasAfastamento, 10),
        motivoCid: motivoCid.trim() || undefined,
        arquivoUrl,
      });

      setEnviado(true);
    } catch (err) {
      console.error(err);
      setErro('Erro ao enviar atestado. Tente anexar uma imagem menor.');
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
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden shrink-0 cursor-grab active:cursor-grabbing touch-none">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0"
          style={{ background: `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}04)`, borderBottom: `1px solid ${primaryColor}20` }}
        >
          <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-gray-500 py-2 pr-3 sm:hidden">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${primaryColor}20` }}>
              <FilePlus className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Enviar Atestado</div>
              <div className="text-xs text-gray-500 truncate max-w-[180px] sm:max-w-xs">{empresaNome}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5">
          {enviado ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${primaryColor}15` }}>
                <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-xl mb-2">Atestado Enviado!</div>
                <div className="text-sm text-gray-500 max-w-xs">Seu atestado foi encaminhado ao RH da empresa com sucesso.</div>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white min-h-[48px]"
                style={{ background: primaryColor }}
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pb-2">
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Nome do Funcionário *</label>
                  <input
                    type="text"
                    required
                    value={nomeFuncionario}
                    onChange={e => setNomeFuncionario(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-800"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">WhatsApp / Telefone *</label>
                    <input
                      type="tel"
                      required
                      value={telefone}
                      onChange={e => setTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-800"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">CPF <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input
                      type="text"
                      value={matricula}
                      onChange={e => setMatricula(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-800"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Nome do Médico *</label>
                    <input
                      type="text"
                      required
                      value={nomeMedico}
                      onChange={e => setNomeMedico(e.target.value)}
                      placeholder="Nome do médico"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-800"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">CRM *</label>
                    <input
                      type="text"
                      required
                      value={crmMedico}
                      onChange={e => setCrmMedico(e.target.value)}
                      placeholder="CRM/UF"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-800"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Início do Afastamento *</label>
                    <input
                      type="date"
                      required
                      value={dataAfastamento}
                      onChange={e => setDataAfastamento(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-800"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Dias de Afastamento *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="365"
                      value={diasAfastamento}
                      onChange={e => setDiasAfastamento(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-800"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">CID / Motivo <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    type="text"
                    value={motivoCid}
                    onChange={e => setMotivoCid(e.target.value)}
                    placeholder="Ex: J00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-800"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Foto do Atestado *</label>
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
                          Remover / Trocar Imagem
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            style={{ color: primaryColor }}
                          >
                            <span>Selecione uma imagem</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                  setArquivo(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">Tire uma foto clara do documento (PNG, JPG)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {erro && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !arquivo}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60 min-h-[56px] mt-2"
                style={{ background: (loading || !arquivo) ? '#9ca3af' : primaryColor }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FilePlus className="w-5 h-5" />}
                {loading ? 'Enviando Atestado...' : 'Enviar Atestado'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
