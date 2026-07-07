import React, { useState } from 'react';
import { X, Heart, CheckCircle, Loader2, ArrowLeft, ShieldCheck, Stethoscope, Activity, Brain, Apple } from 'lucide-react';
import { motion, PanInfo } from 'motion/react';
import { addApoioSaude } from '../../lib/firestoreService';

interface ApoioSaudeModalProps {
  companyId: string;
  onClose: () => void;
  primaryColor: string;
}

export function ApoioSaudeModal({ companyId, onClose, primaryColor }: ApoioSaudeModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    tipoConsulta: '',
    nomeFuncionario: '',
    matricula: '',
    telefone: '',
    motivo: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tipoConsulta) {
      alert("Por favor, selecione o tipo de consulta desejada.");
      return;
    }
    setLoading(true);
    try {
      await addApoioSaude(companyId, {
        nomeFuncionario: formData.nomeFuncionario,
        matricula: formData.matricula,
        telefone: formData.telefone,
        tipoConsulta: formData.tipoConsulta,
        motivo: formData.motivo || undefined,
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

  const consultas = [
    { id: 'Clínica', icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'Cardiologista', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
    { id: 'Endocrinologia', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'Psiquiatria', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { id: 'Psicologia', icon: ShieldCheck, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200' },
    { id: 'Nutricionista', icon: Apple, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' }
  ];

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
        <div className="flex justify-center pt-3 pb-2 sm:hidden shrink-0 cursor-grab active:cursor-grabbing touch-none">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 py-4 shrink-0 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-3">
            {step === 2 && !success && (
              <button onClick={() => setStep(1)} className="p-1 -ml-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-900">Apoio à Saúde</h2>
              <p className="text-xs text-blue-700 font-medium">Descontos Especiais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          {success ? (
            <div className="py-8 text-center flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Solicitação Enviada!</h3>
              <p className="text-slate-500 mb-8 max-w-sm">
                Sua solicitação de consulta foi recebida com sucesso. A equipe entrará em contato com você em breve pelo WhatsApp para agendamento! 🩺
              </p>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
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
                    <p className="text-sm text-slate-500 mt-1">Selecione o tipo de consulta que você está buscando</p>
                    <p className="text-xs text-blue-600 font-medium mt-2 bg-blue-50 py-1.5 px-3 rounded-full inline-block">
                      Todas as consultas terão descontos especiais para você colaborador
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {consultas.map((consulta) => (
                      <button
                        key={consulta.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, tipoConsulta: consulta.id })}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          formData.tipoConsulta === consulta.id 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          formData.tipoConsulta === consulta.id ? 'bg-blue-500 text-white' : `${consulta.bg} ${consulta.color}`
                        }`}>
                          <consulta.icon className="w-6 h-6" />
                        </div>
                        <div className={`font-bold text-sm text-center ${formData.tipoConsulta === consulta.id ? 'text-blue-900' : 'text-slate-700'}`}>
                          {consulta.id}
                        </div>
                        {formData.tipoConsulta === consulta.id && (
                          <div className="absolute top-2 right-2 text-blue-500"><CheckCircle className="w-4 h-4" /></div>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={!formData.tipoConsulta}
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98] mt-4"
                  >
                    Continuar Solicitação
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg border border-blue-100 flex items-start gap-2 mb-2">
                    <Stethoscope className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p>Você escolheu consulta com <strong>{formData.tipoConsulta}</strong>. Preencha seus dados de contato abaixo.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={formData.nomeFuncionario}
                      onChange={e => setFormData({ ...formData, nomeFuncionario: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp / Telefone</label>
                    <input
                      type="tel"
                      required
                      value={formData.telefone}
                      onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Gostaria de falar brevemente o motivo? <span className="text-slate-400 font-normal">(Opcional)</span></label>
                    <textarea
                      rows={3}
                      value={formData.motivo}
                      onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      placeholder="Sinta-se à vontade para compartilhar..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Enviando Solicitação...</>
                    ) : (
                      'Enviar Solicitação'
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
