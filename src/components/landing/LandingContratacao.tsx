import React, { useState } from 'react';
import {
  FileText, Shield, ArrowUpRight, Check, X,
  AlertTriangle, Phone, Mail, Building, Users,
  Calendar, Lock, MessageSquare, ChevronDown,
  Sparkles, ExternalLink, Hash, Clock, CheckCircle2,
  Building2
} from 'lucide-react';

interface LandingContratacaoProps {
  onGoToLogin?: () => void;
}

export function LandingContratacao({ onGoToLogin }: LandingContratacaoProps) {
  // ─── Estado do Dimensionamento / Simulador ───────────────────────────────
  const [colaboradores, setColaboradores] = useState<number>(45);
  const [modulos, setModulos] = useState<{ [key: string]: boolean }>({
    atestados: true,
    denuncias: true,
    saudeMental: false,
    segurancaNR: true,
  });

  // ─── Formulário de Proposta Formal ────────────────────────────────────────
  const [empresa, setEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [cargo, setCargo] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [desafioPrincipal, setDesafioPrincipal] = useState('atestados_recorrentes');
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);

  // ─── Accordion de Dúvidas Técnicas ─────────────────────────────────────────
  const [duvidaAberta, setDuvidaAberta] = useState<number | null>(0);

  const toggleModulo = (key: string) => {
    setModulos((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Cálculos do Dimensionamento Técnico ──────────────────────────────────
  const modulosAtivos = Object.values(modulos).filter(Boolean).length;
  
  const getDiagnosticoOperacional = (qtd: number) => {
    if (qtd <= 25) {
      return {
        faixa: 'Pequena Operação (Até 25 vidas)',
        riscoComum: 'Falta de registro centralizado e atestados aceitos sem checagem de CRM e CID',
        tempoImplantacao: '24 horas',
        perfilCipa: 'Designado CIPA ou Comissão Interna simplificada',
      };
    }
    if (qtd <= 100) {
      return {
        faixa: 'Média Operação (26 a 100 vidas)',
        riscoComum: 'Passivo trabalhista por acúmulo de CIDs osteomusculares e ausência de canal de denúncias formal',
        tempoImplantacao: '48 horas',
        perfilCipa: 'CIPA obrigatória (Lei Federal 14.457/22 em vigor)',
      };
    }
    return {
      faixa: 'Grande Corporação (Mais de 100 vidas)',
      riscoComum: 'Inconsistência em eventos S-2210/S-2220 do eSocial e múltiplos afastamentos não rastreados',
      tempoImplantacao: '72 horas com homologação em lote',
      perfilCipa: 'SESMT / CIPA ativa com canal auditável externo',
    };
  };

  const diagnostico = getDiagnosticoOperacional(colaboradores);

  const handleEnviarProposta = (e: React.FormEvent) => {
    e.preventDefault();

    const codProtocolo = `MM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setProtocoloGerado(codProtocolo);

    const modulosListados = Object.entries(modulos)
      .filter(([_, ativo]) => ativo)
      .map(([k]) => {
        const labels: Record<string, string> = {
          atestados: 'Triagem de Atestados & CID',
          denuncias: 'Canal de Denúncias (Lei 14.457/22)',
          saudeMental: 'Acolhimento & Suporte Psicológico',
          segurancaNR: 'Segurança Ocupacional & NRs',
        };
        return `[x] ${labels[k] || k}`;
      })
      .join('\n');

    const msg = encodeURIComponent(
      `*PROPOSTA TÉCNICA // MULTIMED CONECTA*\n` +
      `Protocolo: ${codProtocolo}\n\n` +
      `*Dados da Empresa:*\n` +
      `• Razão Social/Fantasia: ${empresa || 'Não informado'}\n` +
      `• CNPJ: ${cnpj || 'Não informado'}\n` +
      `• Solicitante: ${responsavel || 'Não informado'} (${cargo || 'Gestor'})\n` +
      `• E-mail: ${email || 'Não informado'}\n` +
      `• WhatsApp: ${whatsapp || 'Não informado'}\n\n` +
      `*Diagnóstico da Operação:*\n` +
      `• Colaboradores: ~${colaboradores} vidas\n` +
      `• Principal gargalo: ${desafioPrincipal}\n\n` +
      `*Módulos Requisitados:*\n${modulosListados}\n\n` +
      `_Solicitação registrada via Dossiê de Contratação Multimed._`
    );

    // Número de atendimento comercial oficial
    const telefoneVendas = '5511999999999';

    setTimeout(() => {
      window.open(`https://wa.me/${telefoneVendas}?text=${msg}`, '_blank');
    }, 400);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* ─── Navegação em Branco & Azul Oficial ───────────────────────────── */}
      <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div
            className="cursor-pointer group flex items-baseline gap-1.5"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="font-serif text-2xl font-bold tracking-tight text-slate-950">
              Multimed
            </span>
            <span className="font-mono text-xs uppercase text-blue-600 tracking-wider font-bold">
              [CONECTA]
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onGoToLogin) onGoToLogin();
                else window.location.hash = '/login';
              }}
              className="px-3.5 py-2 font-mono text-xs border border-slate-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 transition-colors"
            >
              Área do Cliente &rarr;
            </button>
            <button
              onClick={() => scrollTo('dossie')}
              className="px-4 py-2 font-mono text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wider uppercase transition-colors shadow-sm"
            >
              Iniciar Homologação
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO EDITORIAL: BASE BRANCA, TEXTO SLATE & ACENTOS EM AZUL E VERMELHO ALERTA ── */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-slate-200 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Bloco Editorial Esquerdo (7 colunas) */}
            <div className="lg:col-span-7 pr-0 lg:pr-6">
              <h1 className="font-serif text-4xl sm:text-6xl font-normal leading-[1.08] text-slate-950 tracking-tight">
                Atestado no WhatsApp, CIPA desorganizada e medo de fiscalização.{' '}
                <span className="italic font-light text-blue-600">
                  Sua empresa não precisa operar no improviso.
                </span>
              </h1>

              <p className="mt-8 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-sans">
                Saúde e segurança do trabalho não são papéis para esquecer numa gaveta. Entregamos uma esteira técnica que valida atestados médicos, blinda sua empresa com canal de denúncias obrigatório e alimenta o eSocial sem atrito.
              </p>

              {/* Ações Diretas */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => scrollTo('dimensionamento')}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-md shadow-blue-600/20"
                >
                  Dimensionar Operação da Empresa <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTo('realidade')}
                  className="px-5 py-3.5 border border-slate-300 hover:border-slate-800 font-mono text-xs text-slate-700 transition-colors"
                >
                  Entenda o Gargalo &darr;
                </button>
              </div>

              {/* Indicadores Físicos estilo Carimbo */}
              <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 font-mono">
                <div>
                  <p className="text-2xl font-bold text-slate-950">48h</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">Implantação com portal próprio da sua marca</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">Zero</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">Papéis perdidos ou planilhas desconexas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">100%</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">Conforme Lei 14.457/22 e eSocial</p>
                </div>
              </div>
            </div>

            {/* Ficha Técnica / Dossiê Físico Sobreposto (5 colunas) */}
            <div className="lg:col-span-5 bg-white border-2 border-slate-900 p-6 sm:p-7 relative shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              {/* Selo Carimbado */}
              <div className="absolute -top-3.5 right-6 bg-blue-50 border-2 border-blue-600 text-blue-700 px-3 py-0.5 font-mono text-[10px] uppercase font-bold tracking-widest rotate-[-1deg]">
                REGISTRO EXCLUSIVO PJ
              </div>

              <div className="border-b border-slate-200 pb-4 mb-5">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  DOCUMENTO TÉCNICO // REF: MM-OCUPACIONAL
                </span>
                <h3 className="font-serif text-xl font-bold text-slate-900 mt-1">
                  O Que Mudou na Legislação Trabalhista
                </h3>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <p className="text-red-600 font-bold flex items-center justify-between">
                    <span>1. LEI FEDERAL Nº 14.457/22</span>
                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 font-semibold">EXIGÊNCIA CIPA</span>
                  </p>
                  <p className="text-slate-600 mt-1.5 leading-normal font-sans text-xs">
                    Toda empresa obrigada a constituir CIPA deve ter Canal de Denúncias com garantia de anonimato. Não basta um e-mail comum da diretoria; a auditoria exige protocolo independente.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200">
                  <p className="text-blue-700 font-bold flex items-center justify-between">
                    <span>2. EVENTOS DE SST NO eSOCIAL</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 font-semibold">S-2210 / S-2220 / S-2240</span>
                  </p>
                  <p className="text-slate-600 mt-1.5 leading-normal font-sans text-xs">
                    Acidentes (CAT), exames periódicos e monitoramento de riscos físicos/químicos precisam de validação médica imediata antes do envio contábil.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200">
                  <p className="text-slate-900 font-bold flex items-center justify-between">
                    <span>3. FRAUDES EM ATESTADOS (CID)</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 font-semibold">ABSENTEÍSMO</span>
                  </p>
                  <p className="text-slate-600 mt-1.5 leading-normal font-sans text-xs">
                    Atestados repetidos de 1 dia na sexta ou segunda-feira são o maior dreno silencioso da folha de pagamento. A triagem digital cruza reincidências no ato.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dashed border-slate-300 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Status da sua empresa:</span>
                <span className="text-blue-700 font-bold hover:underline cursor-pointer" onClick={() => scrollTo('dimensionamento')}>
                  Calcular Vulnerabilidade &rarr;
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 01. O CENÁRIO REAL: NARRATIVA CRUA EM FUNDO SUAVE ─────────────── */}
      <section id="realidade" className="py-20 border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold">
              // 01. O Cenário Real
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-slate-950 mt-2">
              A segunda-feira de quem fecha folha de pagamento no Brasil.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed font-sans">
              Você já conhece essa rotina: às 08h30 começam a chegar fotos borradas de atestados no WhatsApp de alguém do RH. O texto é ilegível, o carimbo é suspeito e ninguém tem certeza se o funcionário já acumulou 15 dias pelo mesmo motivo no ano.
            </p>
          </div>

          {/* Composição Assimétrica: Bloco Grande x Colunas de Confronto */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Bloco 1: Atestados (7 colunas) */}
            <div className="lg:col-span-7 bg-white border-2 border-slate-900 p-7 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6 font-mono text-xs text-slate-500 font-medium">
                  <span>FLUXO DE TRIAGEM MULTIMED</span>
                  <span className="text-blue-600 font-bold">[SEM PAPEL]</span>
                </div>
                
                <h3 className="font-serif text-2xl text-slate-950 mb-3">
                  Como funciona a esteira quando o funcionário adoece:
                </h3>
                
                <div className="space-y-4 my-6 font-mono text-xs">
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 border-l-4 border-blue-600">
                    <span className="text-blue-600 font-bold">ETAPA 01:</span>
                    <p className="text-slate-700 font-sans">
                      O colaborador abre o link da sua empresa no navegador do celular (sem baixar app pesado) e anexa a foto do atestado em 30 segundos.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 border-l-4 border-amber-500">
                    <span className="text-amber-700 font-bold">ETAPA 02:</span>
                    <p className="text-slate-700 font-sans">
                      O sistema registra data, horário exato, CID e dias de afastamento, alertando se houver histórico de faltas consecutivas ou atestado duplicado.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 border-l-4 border-emerald-600">
                    <span className="text-emerald-700 font-bold">ETAPA 03:</span>
                    <p className="text-slate-700 font-sans">
                      O RH acessa o painel limpo, aprova ou solicita revisão médica com um clique, e exporta o relatório mensal formatado para a contabilidade.
                    </p>
                  </div>
                </div>
              </div>

              <p className="font-mono text-xs text-slate-500 border-t border-slate-200 pt-4">
                Resultado direto: Fim das mensagens soltas no celular do gestor e prontuário 100% arquivado.
              </p>
            </div>

            {/* Bloco 2: O Perigo da Denúncia sem Canal (5 colunas) */}
            <div className="lg:col-span-5 bg-blue-950 text-white p-7 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-blue-800 pb-3 mb-6 font-mono text-xs text-blue-300">
                  <span>VULNERABILIDADE JURÍDICA</span>
                  <span className="font-bold text-red-400">[LEI 14.457/22]</span>
                </div>

                <h3 className="font-serif text-2xl text-white mb-3">
                  Um processo de assédio pode custar mais que 5 anos de plataforma.
                </h3>

                <p className="text-blue-100/90 text-sm leading-relaxed mb-6 font-sans">
                  Quando um colaborador sofre assédio moral ou sexual e não encontra um canal neutro para falar, a primeira denúncia que ele faz é diretamente no Ministério Público do Trabalho ou numa reclamação trabalhista.
                </p>

                <div className="p-4 bg-blue-900/60 border border-blue-700/60 font-mono text-xs text-blue-100 space-y-2">
                  <p className="text-white font-bold">O Canal Multimed Conecta oferece:</p>
                  <p>• Anonimato real verificado (criptografia de ponta a ponta)</p>
                  <p>• Número de protocolo para o relator acompanhar a apuração</p>
                  <p>• Registro de providências adotadas pela CIPA / Diretoria</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-800 font-mono text-xs text-cyan-300 font-semibold">
                Proteção jurídica imediata comprovável em fiscalizações.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 02. ESTRUTURA TÉCNICA // TABELA DE MÓDULOS ────────────────────── */}
      <section id="arquitetura" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold">
                // 02. Estrutura Técnica
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-slate-950 mt-2">
                O que você contrata e como cada módulo opera.
              </h2>
            </div>
            <p className="font-mono text-xs text-slate-500 font-semibold">
              TABELA DE SERVIÇOS // ATUALIZADA 2026
            </p>
          </div>

          {/* Tabela estilo Diário Oficial com Linhas Marcadas */}
          <div className="border-2 border-slate-900 bg-white divide-y divide-slate-200 shadow-sm">
            {/* Linha 1 */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center hover:bg-slate-50/60 transition-colors">
              <div className="md:col-span-3">
                <span className="font-mono text-[10px] text-blue-600 uppercase font-bold">[MÓDULO 01]</span>
                <h4 className="font-serif text-xl font-bold text-slate-900 mt-1">Gestão de Atestados</h4>
              </div>
              <div className="md:col-span-6 font-sans text-sm text-slate-600 leading-relaxed">
                Envio via web mobile, leitor estruturado de CID, verificação de reincidência de faltas e relatório mensal de absenteísmo por setor da empresa.
              </div>
              <div className="md:col-span-3 font-mono text-xs flex items-center justify-between md:justify-end gap-2">
                <span className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold px-2.5 py-1">Sem papel físico</span>
              </div>
            </div>

            {/* Linha 2 */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center hover:bg-slate-50/60 transition-colors">
              <div className="md:col-span-3">
                <span className="font-mono text-[10px] text-blue-600 uppercase font-bold">[MÓDULO 02]</span>
                <h4 className="font-serif text-xl font-bold text-slate-900 mt-1">Canal de Denúncias & Ética</h4>
              </div>
              <div className="md:col-span-6 font-sans text-sm text-slate-600 leading-relaxed">
                Total conformidade com a Lei 14.457/22. Opção de anonimato absoluto, protocolo de acompanhamento para o denunciante e painel de apuração exclusivo para a CIPA/RH.
              </div>
              <div className="md:col-span-3 font-mono text-xs flex items-center justify-between md:justify-end gap-2">
                <span className="bg-red-50 border border-red-200 text-red-700 font-semibold px-2.5 py-1">Obrigatório CIPA</span>
              </div>
            </div>

            {/* Linha 3 */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center hover:bg-slate-50/60 transition-colors">
              <div className="md:col-span-3">
                <span className="font-mono text-[10px] text-blue-600 uppercase font-bold">[MÓDULO 03]</span>
                <h4 className="font-serif text-xl font-bold text-slate-900 mt-1">Acolhimento & Saúde Mental</h4>
              </div>
              <div className="md:col-span-6 font-sans text-sm text-slate-600 leading-relaxed">
                Triagem sigilosa para colaboradores com queixas de estresse crônico, ansiedade ou burnout (CID F). Prevenção primária antes que a situação evolua para afastamento pelo INSS.
              </div>
              <div className="md:col-span-3 font-mono text-xs flex items-center justify-between md:justify-end gap-2">
                <span className="bg-slate-100 border border-slate-300 text-slate-700 font-semibold px-2.5 py-1">Atenção Primária</span>
              </div>
            </div>

            {/* Linha 4 */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center hover:bg-slate-50/60 transition-colors">
              <div className="md:col-span-3">
                <span className="font-mono text-[10px] text-blue-600 uppercase font-bold">[MÓDULO 04]</span>
                <h4 className="font-serif text-xl font-bold text-slate-900 mt-1">Segurança & NRs</h4>
              </div>
              <div className="md:col-span-6 font-sans text-sm text-slate-600 leading-relaxed">
                Canal direto para relato de quase-acidentes, condições perigosas no ambiente de trabalho e requisição de vistorias técnicas (PGR / PCMSO / LTCAT).
              </div>
              <div className="md:col-span-3 font-mono text-xs flex items-center justify-between md:justify-end gap-2">
                <span className="bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold px-2.5 py-1">Conforme MTE</span>
              </div>
            </div>

            {/* Linha 5 */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center hover:bg-slate-50/60 transition-colors">
              <div className="md:col-span-3">
                <span className="font-mono text-[10px] text-blue-600 uppercase font-bold">[MÓDULO 05]</span>
                <h4 className="font-serif text-xl font-bold text-slate-900 mt-1">Portal com a Marca da Empresa</h4>
              </div>
              <div className="md:col-span-6 font-sans text-sm text-slate-600 leading-relaxed">
                Sua empresa recebe um link exclusivo (`#/empresa/sua-marca`), configurado com sua logo oficial, cores corporativas e mural de comunicados internos.
              </div>
              <div className="md:col-span-3 font-mono text-xs flex items-center justify-between md:justify-end gap-2">
                <span className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold px-2.5 py-1">Pronto em 48h</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 03. DIMENSIONADOR DE OPERAÇÃO ─────────────────────────────────── */}
      <section id="dimensionamento" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold">
              // 03. Dimensionador Operacional
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-slate-950 mt-2">
              Calcule a configuração exata para a sua folha.
            </h2>
            <p className="text-slate-600 text-sm mt-2 font-sans">
              Arraste o cursor abaixo para indicar a quantidade de colaboradores e selecione os módulos que sua empresa precisa hoje.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Controles de Dimensionamento (7 colunas) */}
            <div className="lg:col-span-7 bg-white border-2 border-slate-900 p-6 sm:p-8 shadow-sm">
              <div className="border-b border-slate-200 pb-6 mb-8">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="font-mono text-xs uppercase text-slate-500 font-bold">
                    NÚMERO DE VIDAS / COLABORADORES:
                  </span>
                  <span className="font-mono text-2xl font-bold text-blue-600 bg-blue-50 px-3 py-1 border border-blue-200">
                    {colaboradores} vidas
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="400"
                  step="5"
                  value={colaboradores}
                  onChange={(e) => setColaboradores(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-none appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex justify-between font-mono text-[10px] text-slate-500 mt-2 font-semibold">
                  <span>5 vidas</span>
                  <span>100 vidas</span>
                  <span>250 vidas</span>
                  <span>400+ vidas</span>
                </div>
              </div>

              {/* Checkboxes Técnicos */}
              <div>
                <p className="font-mono text-xs uppercase text-slate-500 mb-4 font-bold">
                  Selecione os módulos necessários:
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div
                    onClick={() => toggleModulo('atestados')}
                    className={`p-3.5 border cursor-pointer flex items-center justify-between transition-colors ${
                      modulos.atestados
                        ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold'
                        : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 border flex items-center justify-center ${modulos.atestados ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                        {modulos.atestados && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span>Gestão e Triagem Digital de Atestados</span>
                    </div>
                    <span className="text-[10px] uppercase text-blue-600">Principal</span>
                  </div>

                  <div
                    onClick={() => toggleModulo('denuncias')}
                    className={`p-3.5 border cursor-pointer flex items-center justify-between transition-colors ${
                      modulos.denuncias
                        ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold'
                        : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 border flex items-center justify-center ${modulos.denuncias ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                        {modulos.denuncias && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span>Canal de Denúncias & Ética (Lei 14.457/22)</span>
                    </div>
                    <span className="text-[10px] uppercase text-red-600 font-bold">Exigência CIPA</span>
                  </div>

                  <div
                    onClick={() => toggleModulo('saudeMental')}
                    className={`p-3.5 border cursor-pointer flex items-center justify-between transition-colors ${
                      modulos.saudeMental
                        ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold'
                        : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 border flex items-center justify-center ${modulos.saudeMental ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                        {modulos.saudeMental && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span>Acolhimento & Prevenção de Burnout (Saúde Mental)</span>
                    </div>
                    <span className="text-[10px] uppercase text-slate-600">Atenção Primária</span>
                  </div>

                  <div
                    onClick={() => toggleModulo('segurancaNR')}
                    className={`p-3.5 border cursor-pointer flex items-center justify-between transition-colors ${
                      modulos.segurancaNR
                        ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold'
                        : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 border flex items-center justify-center ${modulos.segurancaNR ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                        {modulos.segurancaNR && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span>Segurança do Trabalho & Alertas de Quase-Acidente</span>
                    </div>
                    <span className="text-[10px] uppercase text-emerald-700 font-bold">Normas NRs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recibo Técnico / Proposta Estimada (5 colunas) */}
            <div className="lg:col-span-5 bg-white border-2 border-dashed border-slate-400 p-6 sm:p-7 relative shadow-sm">
              <div className="border-b border-slate-200 pb-4 mb-5">
                <span className="font-mono text-[10px] text-blue-600 uppercase tracking-widest font-bold">
                  // LAUDO DE ENQUADRAMENTO OPERACIONAL
                </span>
                <h3 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                  {diagnostico.faixa}
                </h3>
              </div>

              <div className="space-y-4 font-mono text-xs border-b border-slate-200 pb-6 mb-6">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Gargalo mais provável hoje:</span>
                  <span className="text-slate-900 font-medium leading-relaxed block mt-0.5 font-sans text-xs">
                    {diagnostico.riscoComum}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Exigência Legal da CIPA:</span>
                  <span className="text-red-600 font-bold block mt-0.5">
                    {diagnostico.perfilCipa}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Prazo de Homologação:</span>
                  <span className="text-emerald-700 font-bold block mt-0.5">
                    {diagnostico.tempoImplantacao}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Módulos Ativos:</span>
                  <span className="text-blue-700 block mt-0.5 font-bold">
                    {modulosAtivos} de 4 módulos habilitados
                  </span>
                </div>
              </div>

              <button
                onClick={() => scrollTo('dossie')}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Preencher Dossiê de Contratação &rarr;
              </button>

              <p className="font-mono text-[10px] text-slate-500 text-center mt-3">
                * Sem carência, sem taxa de rescisão e com suporte técnico direto.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 04. DOSSIÊ FORMAL DE CONTRATAÇÃO (FORMULÁRIO DIRETO) ────────── */}
      <section id="dossie" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold">
              // 04. Dossiê de Contratação
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-slate-950 mt-2 font-bold">
              Solicitar Homologação da sua Empresa
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto font-sans">
              Preencha os dados da sua empresa. Nossa equipe técnica entra em contato em até 1 hora útil com o contrato e o acesso de homologação.
            </p>
          </div>

          <form onSubmit={handleEnviarProposta} className="bg-white border-2 border-slate-900 p-6 sm:p-10 space-y-6 shadow-[8px_8px_0px_0px_rgba(37,99,235,0.15)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-xs uppercase text-slate-700 font-bold mb-2">
                  Razão Social ou Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Ex: Confecções Silveira Ltda"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white px-4 py-3 text-sm text-slate-900 font-mono outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase text-slate-700 font-bold mb-2">
                  CNPJ da Empresa
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white px-4 py-3 text-sm text-slate-900 font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-xs uppercase text-slate-700 font-bold mb-2">
                  Nome do Responsável / Solicitante *
                </label>
                <input
                  type="text"
                  required
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white px-4 py-3 text-sm text-slate-900 font-mono outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase text-slate-700 font-bold mb-2">
                  Cargo / Setor
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Gerente de RH, Diretor Geral, DP"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white px-4 py-3 text-sm text-slate-900 font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-xs uppercase text-slate-700 font-bold mb-2">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rh@suaempresa.com.br"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white px-4 py-3 text-sm text-slate-900 font-mono outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase text-slate-700 font-bold mb-2">
                  WhatsApp para Contato Rápido *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 90000-0000"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white px-4 py-3 text-sm text-slate-900 font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase text-slate-700 font-bold mb-2">
                Qual é a dor mais urgente da empresa hoje?
              </label>
              <select
                value={desafioPrincipal}
                onChange={(e) => setDesafioPrincipal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white px-4 py-3 text-sm text-slate-900 font-mono outline-none transition-colors"
              >
                <option value="atestados_recorrentes">Controle de atestados médicos e redução de faltas na folha</option>
                <option value="lei_14457_cipa">Implantação obrigatória de Canal de Denúncias da Lei 14.457/22</option>
                <option value="esocial_sst">Adequação aos envios de SST do eSocial (S-2210 / S-2220 / S-2240)</option>
                <option value="saude_mental_burnout">Suporte emocional para conter afastamentos por burnout e estresse</option>
                <option value="todos">Preciso de toda a esteira ocupacional unificada</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-mono text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
              >
                <span>Enviar Dossiê & Falar com Consultor Técnico</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              
              <div className="flex flex-wrap items-center justify-between font-mono text-[11px] text-slate-500 mt-4">
                <span>[SIGILO LGPD ASSEGURADO]</span>
                <span>RESPOSTA EM ATÉ 1 HORA ÚTIL</span>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ─── DÚVIDAS TÉCNICAS (ACCORDION EDITORIAL) ───────────────────────── */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold">
              // Perguntas Frequentes
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-950 mt-2">
              Respostas diretas para quem decide.
            </h2>
          </div>

          <div className="border-t border-slate-300 divide-y divide-slate-200">
            {[
              {
                q: 'Como é feita a implantação na prática e quanto tempo demora?',
                a: 'A implantação não exige que sua equipe de TI instale servidores. Nós cadastramos sua empresa, criamos seu endereço exclusivo e você já pode imprimir o QR Code para colocar no relógio de ponto ou enviar no comunicado do RH. Tempo médio: de 24 a 48 horas.',
              },
              {
                q: 'O colaborador precisa baixar aplicativo na loja do celular?',
                a: 'Não. Aplicativos pesados geram atrito e ninguém usa. A página funciona direto no navegador do celular (PWA leve). O funcionário bate foto do atestado e anexa em 3 cliques.',
              },
              {
                q: 'O Canal de Denúncias garante anonimato jurídico perante a Lei 14.457/22?',
                a: 'Sim. A plataforma não armazena IP e não exige identificação obrigatória. O denunciante recebe um código de protocolo próprio para acompanhar o andamento da averiguação sem expor seu nome.',
              },
              {
                q: 'E se o colaborador entregar um atestado falso ou rasurado?',
                a: 'O sistema arquiva a imagem em alta definição e cruza os dados com o histórico prévio. O gestor pode marcar o documento como sob auditoria e acionar nossa equipe médica para confirmação com o emissor.',
              },
              {
                q: 'Existe contrato de fidelidade com multa se eu quiser cancelar?',
                a: 'Não trabalhamos com cláusulas abusivas de retenção. O contrato é mensal e você permanece enquanto o serviço resolver o problema da sua operação.',
              },
            ].map((item, idx) => {
              const aberta = duvidaAberta === idx;
              return (
                <div key={idx} className="py-5">
                  <button
                    onClick={() => setDuvidaAberta(aberta ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-serif text-lg text-slate-900 hover:text-blue-600 transition-colors font-medium"
                  >
                    <span>{item.q}</span>
                    <span className="font-mono text-sm text-blue-600 ml-4 font-bold">
                      {aberta ? '[-]' : '[+]'}
                    </span>
                  </button>
                  {aberta && (
                    <p className="mt-3 text-sm text-slate-600 font-sans leading-relaxed pl-2 border-l-2 border-blue-600">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── RODAPÉ CORPORATIVO SLATE & BLUE ───────────────────────────────── */}
      <footer className="py-12 bg-slate-950 font-mono text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-baseline justify-between gap-6 pb-8 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-serif text-xl font-bold text-white">
                  Multimed Conecta
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Plataforma de Engenharia Ocupacional, Triagem de Atestados & Compliance Trabalhista.
              </p>
            </div>

            <div className="flex items-center gap-6 text-[11px]">
              <button
                onClick={() => {
                  if (onGoToLogin) onGoToLogin();
                  else window.location.hash = '/login';
                }}
                className="text-blue-400 hover:underline font-bold"
              >
                Acesso Restrito ao Sistema &rarr;
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px]">
            <p>© {new Date().getFullYear()} Multimed Conecta // Operação Nacional.</p>
            <p className="text-slate-500">
              Arquitetura em conformidade com as Normas Regulamentadoras (NRs) e Lei Federal 14.457/22.
            </p>
          </div>
        </div>
      </footer>

      {/* ─── MODAL ANALÓGICO DE PROTOCOLO ─────────────────────────────────── */}
      {protocoloGerado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-slate-900 max-w-md w-full p-6 sm:p-8 font-mono shadow-2xl relative">
            <span className="text-[10px] text-blue-600 uppercase font-bold tracking-widest block mb-2">
              [PROTOCOLO DE HOMOLOGAÇÃO GERADO]
            </span>

            <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
              Dossiê Encaminhado
            </h3>

            <div className="p-3 bg-slate-50 border border-slate-200 my-4 text-xs space-y-1">
              <p className="text-slate-500 font-semibold">Código de Registro:</p>
              <p className="text-blue-600 text-base font-bold">{protocoloGerado}</p>
              <p className="text-slate-600 text-[10px] pt-1">
                A conversa foi aberta no WhatsApp comercial para validação do CNPJ e alinhamento do contrato.
              </p>
            </div>

            <button
              onClick={() => setProtocoloGerado(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Fechar e Voltar ao Dossiê
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
