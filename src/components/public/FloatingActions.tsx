import { useState } from 'react';
import { Lightbulb, ShieldAlert, X } from 'lucide-react';
import { SugestaoModal } from './SugestaoModal';
import { DenunciaModal } from './DenunciaModal';

interface FloatingActionsProps {
  empresaId: string;
  empresaNome: string;
  primaryColor: string;
}

export function FloatingActions({ empresaId, empresaNome, primaryColor }: FloatingActionsProps) {
  const [modal, setModal] = useState<'sugestao' | 'denuncia' | null>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Botões flutuantes — mobile-first */}
      <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3">

        {/* Labels + botões secundários (expandidos) */}
        {expanded && (
          <>
            {/* Denúncia */}
            <div className="flex items-center gap-2 animate-fade-in-up">
              <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                Canal de Denúncia
              </span>
              <button
                onClick={() => { setModal('denuncia'); setExpanded(false); }}
                className="w-12 h-12 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90"
                aria-label="Canal de Denúncia"
              >
                <ShieldAlert className="w-5 h-5" />
              </button>
            </div>

            {/* Sugestão */}
            <div className="flex items-center gap-2 animate-fade-in-up">
              <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap" style={{ background: '#f97316' }}>
                Enviar Sugestão
              </span>
              <button
                onClick={() => { setModal('sugestao'); setExpanded(false); }}
                className="w-12 h-12 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90"
                style={{ background: '#f97316' }}
                aria-label="Enviar Sugestão"
              >
                <Lightbulb className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Botão principal — sempre visível */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-14 h-14 text-white rounded-full shadow-xl flex items-center justify-center transition-all active:scale-90"
          style={{
            background: expanded ? '#374151' : primaryColor,
            boxShadow: `0 4px 24px rgba(0,0,0,0.25)`,
          }}
          aria-label="Ações"
        >
          {expanded
            ? <X className="w-6 h-6" />
            : <span className="text-xl">💬</span>
          }
        </button>
      </div>

      {/* Modais */}
      {modal === 'sugestao' && (
        <SugestaoModal
          empresaId={empresaId}
          empresaNome={empresaNome}
          primaryColor={primaryColor}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'denuncia' && (
        <DenunciaModal
          empresaId={empresaId}
          empresaNome={empresaNome}
          primaryColor={primaryColor}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
