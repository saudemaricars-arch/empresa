import { useState } from 'react';
import { Company } from '../types';
import { Link2, Copy, Check, ExternalLink, Globe, Eye, Palette, Info, Upload, Loader2, Image as ImageIcon, X, LayoutTemplate } from 'lucide-react';
import { motion } from 'motion/react';
import { uploadImage } from '../lib/storageService';

interface PublicPageTabProps {
  company: Company;
  onUpdateCompany: (updates: Partial<Company>) => void;
  onOpenPreview: () => void;
}

const PRESET_COLORS = [
  { label: 'Azul Corporativo', value: '#2563EB' },
  { label: 'Índigo', value: '#4F46E5' },
  { label: 'Violeta', value: '#7C3AED' },
  { label: 'Rosa', value: '#DB2777' },
  { label: 'Vermelho', value: '#DC2626' },
  { label: 'Laranja', value: '#EA580C' },
  { label: 'Âmbar', value: '#D97706' },
  { label: 'Verde', value: '#16A34A' },
  { label: 'Teal', value: '#0D9488' },
  { label: 'Ciano', value: '#0891B2' },
  { label: 'Grafite', value: '#374151' },
  { label: 'Preto', value: '#111827' },
];

export function PublicPageTab({ company, onUpdateCompany, onOpenPreview }: PublicPageTabProps) {
  const [copied, setCopied] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFundo, setUploadingFundo] = useState(false);

  const publicUrl = `${window.location.origin}${window.location.pathname}#/empresa/${company.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = publicUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const primaryColor = company.corPrimaria || '#2563EB';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Link Público */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Link da Página Pública</h2>
            <p className="text-sm text-slate-500">Compartilhe este link para que qualquer pessoa possa ver a página da empresa</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 gap-2 overflow-hidden">
            <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-700 truncate font-mono">{publicUrl}</span>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              copied
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir
          </a>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Slug da empresa: <code className="font-mono text-slate-600">{company.slug}</code>.
            Esta URL é gerada automaticamente a partir do nome da empresa.
          </span>
        </div>
      </div>

      {/* Configurações + Preview lado a lado */}
      <div className="flex flex-col-reverse lg:flex-row gap-6 items-start">
        
        {/* Coluna da Esquerda: Configurações */}
        <div className="w-full lg:flex-1 space-y-6">
          
          {/* Personalizar cor */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Palette className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Cor da Marca</h2>
                <p className="text-sm text-slate-500">Personalize a identidade visual da página</p>
              </div>
            </div>

            {/* Cor personalizada */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div
                className="w-8 h-8 rounded-lg border-2 border-white shadow-sm shrink-0"
                style={{ background: primaryColor }}
              />
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-1">Cor atual</div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => onUpdateCompany({ corPrimaria: e.target.value })}
                    className="w-8 h-7 rounded cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => {
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                        onUpdateCompany({ corPrimaria: e.target.value });
                      }
                    }}
                    className="flex-1 text-sm font-mono bg-white border border-slate-200 rounded px-2 py-1 text-slate-700"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Cores pré-definidas */}
            <div className="text-xs text-slate-500 mb-2 font-medium">Cores rápidas</div>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => onUpdateCompany({ corPrimaria: c.value })}
                  className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                    primaryColor === c.value ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'
                  }`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Logo da Empresa */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Logo da Empresa</h2>
                <p className="text-sm text-slate-500">Faça o upload do logo para exibir na página pública</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {company.logoUrl ? (
                <div className="w-24 h-24 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-slate-50 rounded-xl border border-slate-200 border-dashed flex items-center justify-center shrink-0">
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                </div>
              )}
              
              <div className="flex-1">
                <label className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingLogo ? 'Enviando...' : 'Escolher Imagem'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploadingLogo(true);
                        const ext = file.name.split('.').pop();
                        const path = `empresas/${company.id}/logo_${Date.now()}.${ext}`;
                        const url = await uploadImage(path, file);
                        onUpdateCompany({ logoUrl: url });
                      } catch (error) {
                        console.error('Erro ao fazer upload do logo:', error);
                        alert('Erro ao enviar imagem.');
                      } finally {
                        setUploadingLogo(false);
                      }
                    }}
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  Recomendado: imagem quadrada (1:1) com fundo transparente. Tamanho máximo: 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Imagem de Fundo */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Imagem de Fundo</h2>
                <p className="text-sm text-slate-500">Faça o upload de uma imagem de fundo (opcional)</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {company.fundoUrl ? (
                <div className="w-32 h-20 bg-slate-100 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                  <img src={company.fundoUrl} alt="Fundo" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onUpdateCompany({ fundoUrl: undefined })}
                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-600 hover:bg-white"
                    title="Remover fundo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-20 bg-slate-50 rounded-xl border border-slate-200 border-dashed flex items-center justify-center shrink-0">
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                </div>
              )}
              
              <div className="flex-1">
                <label className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors ${uploadingFundo ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingFundo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingFundo ? 'Enviando...' : 'Escolher Imagem'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploadingFundo(true);
                        const ext = file.name.split('.').pop();
                        const path = `empresas/${company.id}/fundo_${Date.now()}.${ext}`;
                        const url = await uploadImage(path, file);
                        onUpdateCompany({ fundoUrl: url });
                      } catch (error) {
                        console.error('Erro ao fazer upload do fundo:', error);
                        alert('Erro ao enviar imagem.');
                      } finally {
                        setUploadingFundo(false);
                      }
                    }}
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  Recomendado: imagem horizontal e escura. Substituirá a cor de fundo caso definida.
                </p>
              </div>
            </div>
          </div>

          {/* Opções de Exibição */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Opções de Exibição</h2>
                <p className="text-sm text-slate-500">Controle os elementos visíveis no cabeçalho</p>
              </div>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={company.showHeaderTexts !== false}
                onChange={(e) => onUpdateCompany({ showHeaderTexts: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <div>
                <div className="text-sm font-medium text-slate-900">Exibir Textos no Cabeçalho</div>
                <div className="text-xs text-slate-500 mt-1">Mostra o Nome da Empresa, Setor, Funcionários e quantidade de Posts logo abaixo da imagem. Desmarque para focar apenas no Logo e Fundo.</div>
              </div>
            </label>
          </div>

          {/* Descrição "Sobre Nós" */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${primaryColor}15` }}
              >
                <Globe className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Descrição da Empresa</h2>
                <p className="text-sm text-slate-500">Aparece na seção "Sobre Nós" da página pública</p>
              </div>
            </div>
            <textarea
              value={company.descricao || ''}
              onChange={(e) => onUpdateCompany({ descricao: e.target.value })}
              rows={4}
              placeholder="Conte um pouco sobre a empresa: missão, visão, valores, história, produtos ou serviços..."
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="mt-2 text-xs text-slate-400 text-right">
              {(company.descricao || '').length} caracteres
            </div>
          </div>

        </div>

        {/* Coluna da Direita: Preview (Sticky) */}
        <div className="w-full lg:w-[380px] sticky top-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Visualizar Página</h2>
                <p className="text-sm text-slate-500">Veja como os visitantes vão enxergar</p>
              </div>
            </div>

            {/* Mini preview da página */}
            <div
              className="flex-1 rounded-xl overflow-hidden border border-slate-200 mb-5 relative"
              style={{ minHeight: '160px' }}
            >
              <div
                className="h-full min-h-[160px] flex flex-col items-center justify-center gap-2 p-4 text-center"
                style={{
                  background: company.fundoUrl 
                    ? `linear-gradient(to bottom, rgba(30, 41, 59, 0.7), rgba(30, 41, 59, 0.95)), url(${company.fundoUrl}) center/cover no-repeat` 
                    : `linear-gradient(135deg, ${primaryColor} 0%, #1e293b 100%)`,
                }}
              >
                <div className="w-10 h-10 flex items-center justify-center shadow-lg rounded-xl overflow-hidden">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} className="w-full h-full object-contain" alt="Logo" />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <div className="w-5 h-5 rounded" style={{ background: primaryColor }} />
                    </div>
                  )}
                </div>
                <div className="text-white font-semibold text-sm">{company.nomeFantasia || company.razaoSocial}</div>
                {company.setor && (
                  <div className="text-white/70 text-xs">{company.setor}</div>
                )}
                <div className="flex gap-1.5 mt-1">
                  <div className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full border border-white/30">
                    {company.noticias?.length || 0} post{(company.noticias?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenPreview}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Abrir Prévia Completa
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
