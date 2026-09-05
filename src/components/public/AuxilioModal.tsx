import React, { useState } from 'react';
import { X, Heart, HeartHandshake, CheckCircle, Loader2, ArrowLeft, ShieldCheck, Brain, Stethoscope } from 'lucide-react';
import { motion, PanInfo } from 'motion/react';
import { addAuxilio } from '../../lib/firestoreService';

interface AuxilioModalProps {
  companyId: string;
  onClose: () => void;
  primaryColor: string;
}

export function AuxilioModal({ companyId, onClose, primaryColor }: AuxilioModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    tipoAuxilio: '' as 'psicologico' | 'psiquiatrico' | '',
    nomeFuncionario: '',
    matricula: '',
    telefone: '',
    motivoSolicitacao: 'Ansiedade, estresse ou sobrecarga emocional',
    descricao: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tipoAuxilio) {
      alert("Por favor, selecione o tipo de apoio desejado.");
      return;
    }
    if (!formData.telefone.trim()) {
      alert("Por favor, informe seu WhatsApp ou Telefone para retorno.");
      return;
    }
    setLoading(true);
    try {
      await addAuxilio(companyId, {
        nomeFuncionario: formData.nomeFuncionario,
        matricula: formData.matricula,
        telefone: formData.telefone,
        motivoSolicitacao: formData.motivoSolicitacao,
        tipoAuxilio: formData.tipoAuxilio as 'psicologico' | 'psiquiatrico',
        descricao: formData.descricao || undefined,
      });
      setSuccess(true);
    } catch (error) {
      alert('Erro ao enviar solicitação: ' + (error as Error).message);
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
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
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
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Header Acolhedor */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 shrink-0 bg-purple-50 border-b border-purple-100">
          <div className="flex items-center gap-3">
            {step === 2 && !success && (
              <button onClick={() => setStep(1)} className="p-1 -ml-2 text-purple-600 hover:bg-purple-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-purple-900">Apoio Emocional</h2>
              <p className="text-xs text-purple-700 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Totalmente Sigiloso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          {success ? (
            <div className="py-8 text-center flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Solicitação Enviada!</h3>
              <p className="text-slate-500 mb-8 max-w-sm">
                Sua solicitação de apoio foi recebida com sucesso e total sigilo. A equipe de saúde mental entrará em contato com você em breve pelo WhatsApp. Você não está sozinho! 💙
              </p>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                  <div className="text-center mb-2">
                    <h3 className="text-lg font-semibold text-slate-800">Como podemos ajudar você hoje?</h3>
                    <p className="text-sm text-slate-500 mt-1">Selecione o tipo de apoio que você está buscando.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tipoAuxilio: 'psicologico' })}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                        formData.tipoAuxilio === 'psicologico' 
                          ? 'border-purple-500 bg-purple-50 shadow-md' 
                          : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${formData.tipoAuxilio === 'psicologico' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Brain className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                        <div className={`font-bold text-lg ${formData.tipoAuxilio === 'psicologico' ? 'text-purple-900' : 'text-slate-700'}`}>Psicológico</div>
                        <div className="text-xs text-slate-500 mt-1">Apoio emocional, terapia e conversas construtivas.</div>
                      </div>
                      {formData.tipoAuxilio === 'psicologico' && (
                        <div className="absolute top-3 right-3 text-purple-500"><CheckCircle className="w-5 h-5" /></div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tipoAuxilio: 'psiquiatrico' })}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                        formData.tipoAuxilio === 'psiquiatrico' 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${formData.tipoAuxilio === 'psiquiatrico' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Stethoscope className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                        <div className={`font-bold text-lg ${formData.tipoAuxilio === 'psiquiatrico' ? 'text-blue-900' : 'text-slate-700'}`}>Psiquiátrico</div>
                        <div className="text-xs text-slate-500 mt-1">Acompanhamento médico, sintomas crônicos e medicação.</div>
                      </div>
                      {formData.tipoAuxilio === 'psiquiatrico' && (
                        <div className="absolute top-3 right-3 text-blue-500"><CheckCircle className="w-5 h-5" /></div>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!formData.tipoAuxilio}
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-all shadow-lg active:scale-[0.98] mt-4"
                  >
                    Continuar Solicitação
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-purple-50 text-purple-800 text-sm p-3 rounded-lg border border-purple-100 flex items-start gap-2 mb-2">
                    <Brain className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <p>Você escolheu apoio <strong>{formData.tipoAuxilio === 'psicologico' ? 'Psicológico' : 'Psiquiátrico'}</strong>. Preencha seus dados de contato abaixo. Tudo será mantido em total sigilo.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={formData.nomeFuncionario}
                      onChange={e => setFormData({ ...formData, nomeFuncionario: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">CPF *</label>
                    <input
                      type="text"
                      required
                      value={formData.matricula}
                      onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      WhatsApp / Telefone * <span className="text-purple-600 font-normal text-xs">(obrigatório para retorno)</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.telefone}
                      onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Qual motivo da solicitação? *</label>
                    <select
                      required
                      value={formData.motivoSolicitacao}
                      onChange={e => setFormData({ ...formData, motivoSolicitacao: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none"
                    >
                      <option value="Ansiedade, estresse ou sobrecarga emocional">Ansiedade, estresse ou sobrecarga emocional</option>
                      <option value="Tristeza persistente ou sintomas depressivos">Tristeza persistente ou sintomas depressivos</option>
                      <option value="Problemas familiares ou conjugais">Problemas familiares ou conjugais</option>
                      <option value="Conflitos no ambiente de trabalho">Conflitos no ambiente de trabalho</option>
                      <option value="Assédio moral ou situações de desrespeito">Assédio moral ou situações de desrespeito</option>
                      <option value="Dificuldades financeiras">Dificuldades financeiras</option>
                      <option value="Problemas relacionados ao uso de álcool ou outras drogas">Problemas relacionados ao uso de álcool ou outras drogas</option>
                      <option value="Crise emocional recente">Crise emocional recente</option>
                      <option value="Luto ou perda de familiar/pessoa próxima">Luto ou perda de familiar/pessoa próxima</option>
                      <option value="Violência doméstica ou familiar">Violência doméstica ou familiar</option>
                      <option value="Problemas de saúde física que estão afetando o emocional">Problemas de saúde física que estão afetando o emocional</option>
                      <option value="Dificuldade de adaptação ao trabalho">Dificuldade de adaptação ao trabalho</option>
                      <option value="Orientação sobre saúde mental">Orientação sobre saúde mental</option>
                      <option value="Preciso apenas conversar com um profissional">Preciso apenas conversar com um profissional</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Gostaria de explicar um pouco mais? <span className="text-slate-400 font-normal">(Opcional)</span></label>
                    <textarea
                      rows={3}
                      value={formData.descricao}
                      onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                      placeholder="Sinta-se à vontade para compartilhar um pouco do que está sentindo, se quiser..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Enviando Solicitação...</>
                    ) : (
                      'Enviar Solicitação Confidencial'
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
