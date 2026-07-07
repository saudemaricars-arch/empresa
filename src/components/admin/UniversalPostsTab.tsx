import React, { useState } from 'react';
import { Company } from '../../types';
import { Send, CheckSquare, Square, Building2, Image as ImageIcon, CheckCircle, Loader2, Upload, X } from 'lucide-react';
import { addUniversalPost } from '../../lib/firestoreService';
import { uploadImage } from '../../lib/storageService';

interface UniversalPostsTabProps {
  companies: Company[];
}

export function UniversalPostsTab({ companies }: UniversalPostsTabProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    imagemUrl: '',
    resumo: '',
    conteudo: ''
  });
  
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleAll = () => {
    if (selectedCompanyIds.size === companies.length) {
      setSelectedCompanyIds(new Set());
    } else {
      setSelectedCompanyIds(new Set(companies.map(c => c.id)));
    }
  };

  const toggleCompany = (id: string) => {
    const next = new Set(selectedCompanyIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCompanyIds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCompanyIds.size === 0) {
      alert("Selecione pelo menos uma empresa para enviar o post.");
      return;
    }

    if (!formData.titulo || !formData.conteudo) {
      alert("O título e o conteúdo são obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = formData.imagemUrl;
      
      // Upload image if a file was selected
      if (imagemArquivo) {
        imageUrl = await uploadImage('blog_universal', imagemArquivo);
      }

      await addUniversalPost(Array.from(selectedCompanyIds), { ...formData, imagemUrl: imageUrl });
      setSuccess(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setFormData({ titulo: '', categoria: '', imagemUrl: '', resumo: '', conteudo: '' });
        setImagemArquivo(null);
        setSelectedCompanyIds(new Set());
      }, 3000);
    } catch (error) {
      alert("Erro ao enviar posts universais: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" />
          Posts Universais
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Crie uma publicação aqui e ela será disparada automaticamente para o blog de todas as empresas selecionadas.
        </p>
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center py-16 bg-green-50 border border-green-100 rounded-xl">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-green-900 mb-2">Disparo Concluído!</h3>
          <p className="text-green-700 font-medium">O post foi enviado com sucesso para {selectedCompanyIds.size} empresa(s).</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulário do Post */}
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Título do Post *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: Campanha de Saúde Mental 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Categoria</label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: Comunicados"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Imagem de Capa <span className="text-slate-400 font-normal">(Opcional)</span></label>
                {imagemArquivo || formData.imagemUrl ? (
                  <div className="relative w-full sm:w-64 h-32 rounded-xl overflow-hidden border border-slate-200 group">
                    <img
                      src={imagemArquivo ? URL.createObjectURL(imagemArquivo) : formData.imagemUrl}
                      alt="Capa"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setImagemArquivo(null);
                          setFormData({ ...formData, imagemUrl: '' });
                        }}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full sm:w-64 h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 font-medium">Clique para enviar</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG até 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImagemArquivo(file);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Resumo <span className="text-slate-400 font-normal">(Aparece nos cards)</span></label>
                <textarea
                  rows={2}
                  value={formData.resumo}
                  onChange={e => setFormData({ ...formData, resumo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Breve descrição sobre o assunto..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Conteúdo Completo *</label>
                <textarea
                  required
                  rows={8}
                  value={formData.conteudo}
                  onChange={e => setFormData({ ...formData, conteudo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none font-mono text-sm"
                  placeholder="Escreva o texto do post aqui..."
                />
              </div>
            </div>
          </div>

          {/* Seleção de Empresas e Botão */}
          <div className="space-y-5 flex flex-col">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl flex flex-col overflow-hidden h-[400px] lg:h-auto">
              <div className="bg-slate-100 border-b border-slate-200 p-3 flex items-center justify-between shrink-0">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  Destinatários ({selectedCompanyIds.size})
                </span>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                >
                  {selectedCompanyIds.size === companies.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                </button>
              </div>

              <div className="overflow-y-auto p-2 space-y-1">
                {companies.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCompany(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCompanyIds.has(c.id) ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-100'
                    }`}
                  >
                    {selectedCompanyIds.has(c.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className={`text-sm truncate ${selectedCompanyIds.has(c.id) ? 'font-medium text-blue-900' : 'text-slate-600'}`}>
                      {c.nomeFantasia || c.razaoSocial}
                    </span>
                  </button>
                ))}
                {companies.length === 0 && (
                  <div className="p-4 text-center text-sm text-slate-500 italic">
                    Nenhuma empresa cadastrada.
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedCompanyIds.size === 0}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Disparando...</>
              ) : (
                <><Send className="w-5 h-5" /> Disparar para {selectedCompanyIds.size} Empresa{selectedCompanyIds.size !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
