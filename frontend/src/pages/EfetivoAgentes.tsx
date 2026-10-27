import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Radio,
  HardDrive,
  PlusSquare,
  Shield,
  Cpu,
  Wifi,
  Clock,
  Search,
  UserPlus,
  Share2,
  Users,
  Building2,
  Moon,
  Car,
  Video,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Activity,
  Flame,
  MapPin,
  Edit2,
  Trash2,
  User,
  Siren,
} from 'lucide-react';
import { AgenteModal } from '../components/AgenteModal';


export default function EfetivoAgentes() {
  const navigate = useNavigate();

  // Estados de Filtros
  const [busca, setBusca] = useState('');
  const [filtroCorporacao, setFiltroCorporacao] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroSetor, setFiltroSetor] = useState('todos');
  const [tagRapida, setTagRapida] = useState<string | null>(null);

  // Estados de dados reais da API
  const [agentes, setAgentes] = useState<any[]>([]);
  const [dadosAuxiliares, setDadosAuxiliares] = useState<{
    orgaos: Array<{ id: number; nome: string; sigla?: string }>;
    tiposAgentes: Array<{ id: number; nome: string; descricao?: string }>;
  }>({
    orgaos: [],
    tiposAgentes: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<any>(null);
  const [demandasPrioritarias, setDemandasPrioritarias] = useState<
    Array<{
      id: string;
      titulo: string;
      tempo: string;
      severidade: 'critica' | 'moderada';
      detalhes?: string;
      viaturaSugerida?: string;
    }>
  >([]);

  // Relógio UTC dinâmico
  const [utcTime, setUtcTime] = useState('');
  useEffect(() => {
    const atualizarHorario = () => {
      const now = new Date();
      setUtcTime(now.toTimeString().split(' ')[0]);
    };
    atualizarHorario();
    const interval = setInterval(atualizarHorario, 1000);
    return () => clearInterval(interval);
  }, []);

  // Busca de Dados Reais do Banco (API Node.js)
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resAgentes, resAux, resAlertas] = await Promise.all([
          fetch('http://localhost:3000/agentes'),
          fetch('http://localhost:3000/auxiliares').catch(() => null),
          fetch('http://localhost:3000/predicoes?cidade=Tupã,%20SP').catch(() => null),
        ]);

        if (resAgentes.ok) {
          const lista = await resAgentes.json();
          setAgentes(lista || []);
        }

        if (resAux && resAux.ok) {
          const aux = await resAux.json();
          setDadosAuxiliares({
            orgaos: aux.orgaos || [],
            tiposAgentes: aux.tiposAgentes || [],
          });
        }

        if (resAlertas && resAlertas.ok) {
          const alertas = await resAlertas.json();
          if (Array.isArray(alertas) && alertas.length > 0) {
            setDemandasPrioritarias(
              alertas.map((a: any, idx: number) => ({
                id: a.id || `INC-${410 + idx}`,
                titulo: a.titulo,
                tempo: a.janela || 'Agora',
                severidade: a.severidade === 'critica' ? 'critica' : 'moderada',
                detalhes: a.justificativa,
                viaturaSugerida: `VTR-0${(idx % 4) + 1} (${(1.4 + idx * 0.8).toFixed(1)}km)`,
              })),
            );
          } else {
            setDemandasPrioritarias([
              {
                id: 'INC-410',
                titulo: 'Anomalia Térmica e Bloqueio de Via (Av. Brasil x R. 24)',
                tempo: 'Há 4 min',
                severidade: 'critica',
                detalhes: 'Sobrecarga de circuito e congestionamento severo com risco de colisão.',
                viaturaSugerida: 'VTR-09 (1.4km)',
              },
              {
                id: 'INC-411',
                titulo: 'Gargalo Viário Severo com Efeito Cascata',
                tempo: 'Há 9 min',
                severidade: 'moderada',
                detalhes: 'Lentidão projetada em 85% no cruzamento principal.',
                viaturaSugerida: 'VTR-04 (2.1km)',
              },
            ]);
          }
        } else {
          setDemandasPrioritarias([
            {
              id: 'INC-410',
              titulo: 'Anomalia Térmica e Bloqueio de Via (Av. Brasil x R. 24)',
              tempo: 'Há 4 min',
              severidade: 'critica',
              detalhes: 'Sobrecarga de circuito e congestionamento severo com risco de colisão.',
              viaturaSugerida: 'VTR-09 (1.4km)',
            },
            {
              id: 'INC-411',
              titulo: 'Gargalo Viário Severo com Efeito Cascata',
              tempo: 'Há 9 min',
              severidade: 'moderada',
              detalhes: 'Lentidão projetada em 85% no cruzamento principal.',
              viaturaSugerida: 'VTR-04 (2.1km)',
            },
          ]);
        }
      } catch (err) {
        console.error('Erro ao conectar com API de agentes:', err);
      }
    };

    carregarDados();
  }, []);

  // Operativos ativos (ignora inativos para cálculo de KPIs e mini-mapa)
  const agentesAtivos = useMemo(() => {
    return agentes.filter((a) => a.situacao?.toLowerCase() !== 'inativo');
  }, [agentes]);

  // Cálculo Dinâmico de KPIs
  const totalOperativos = agentesAtivos.length;
  const emPatrulhamento = agentesAtivos.filter((a) => {
    const s = a.situacao?.toLowerCase() || '';
    return (
      s === 'patrulhamento ativo' ||
      s === 'patrulhamento' ||
      s === 'em_patrulha' ||
      s === 'em patrulha'
    );
  }).length;
  const disponiveis = agentesAtivos.filter((a) => {
    const s = a.situacao?.toLowerCase() || '';
    return s === 'disponível' || s === 'disponivel' || s === 'ativo' || s === 'base';
  }).length;
  const emDescanso = agentesAtivos.filter((a) => {
    const s = a.situacao?.toLowerCase() || '';
    return s === 'descanso' || s === 'escala';
  }).length;

  // Cálculo de Densidade Operacional Dinâmica por Zona baseado em agentesAtivos
  const densidadeZonas = useMemo(() => {
    const total = agentesAtivos.length || 1;

    let zonaNorte = 0;
    let zonaSul = 0;
    let zonaLeste = 0;
    let zonaCentro = 0;

    agentesAtivos.forEach((ag) => {
      const lat = ag.latitude != null ? Number(ag.latitude) : -21.9348;
      const lng = ag.longitude != null ? Number(ag.longitude) : -50.5146;

      if (lat > -21.932) {
        zonaNorte++;
      } else if (lat < -21.938) {
        zonaSul++;
      } else if (lng > -50.512) {
        zonaLeste++;
      } else {
        zonaCentro++;
      }
    });

    return [
      {
        nome: 'Centro Expandido',
        qtd: zonaCentro,
        percentual: Math.round((zonaCentro / total) * 100),
        barCor: 'bg-cyan-400',
        textCor: 'text-cyan-400',
        glow: 'shadow-[0_0_8px_#22d3ee]',
      },
      {
        nome: 'Zona Norte',
        qtd: zonaNorte,
        percentual: Math.round((zonaNorte / total) * 100),
        barCor: 'bg-blue-500',
        textCor: 'text-blue-400',
        glow: 'shadow-[0_0_8px_#3b82f6]',
      },
      {
        nome: 'Zona Sul',
        qtd: zonaSul,
        percentual: Math.round((zonaSul / total) * 100),
        barCor: 'bg-amber-400',
        textCor: 'text-amber-400',
        glow: 'shadow-[0_0_8px_#f59e0b]',
      },
      {
        nome: 'Zona Leste / Oeste',
        qtd: zonaLeste,
        percentual: Math.round((zonaLeste / total) * 100),
        barCor: 'bg-emerald-400',
        textCor: 'text-emerald-400',
        glow: 'shadow-[0_0_8px_#10b981]',
      },
    ];
  }, [agentesAtivos]);

  // Mapas de resolução rápida para órgãos e tipos de agentes
  const orgaosMap = useMemo(() => {
    const map = new Map<number, { nome: string; sigla?: string }>();
    dadosAuxiliares.orgaos.forEach((org) => map.set(org.id, org));
    return map;
  }, [dadosAuxiliares.orgaos]);

  const tiposAgentesMap = useMemo(() => {
    const map = new Map<number, { nome: string; descricao?: string }>();
    dadosAuxiliares.tiposAgentes.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [dadosAuxiliares.tiposAgentes]);

  // Função para inativar (DELETE /agentes/:id com soft delete imediato)
  const handleInativar = async (id: number) => {
    if (
      window.confirm(
        'Deseja desativar este agente? Ele será movido para o arquivo inativo.',
      )
    ) {
      try {
        const res = await fetch(`http://localhost:3000/agentes/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          // Atualiza o estado removendo-o da tela imediatamente
          setAgentes((prev) => prev.filter((item) => item.id !== id));
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || 'Erro ao desativar agente');
        }
      } catch (err) {
        console.error('Erro na requisição DELETE:', err);
        alert('Erro de comunicação com o servidor ao desativar agente.');
      }
    }
  };

  // Helper de badge e status do agente
  const getStatusInfo = (situacao: string) => {
    switch (situacao) {
      case 'inativo':
        return {
          label: 'INATIVO / ARQUIVADO',
          badgeCor: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          dotColor: 'bg-zinc-600',
        };
      case 'ocorrencia':
        return {
          label: 'EM OCORRÊNCIA',
          badgeCor:
            'bg-red-950/80 text-red-400 border-red-600/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
          dotColor: 'bg-red-500 animate-ping',
        };
      case 'patrulhamento':
      case 'em_patrulha':
        return {
          label: 'PATRULHAMENTO ATIVO',
          badgeCor:
            'bg-cyan-950/80 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]',
          dotColor: 'bg-cyan-400',
        };
      case 'deslocamento':
        return {
          label: 'DESLOCAMENTO TÁTICO',
          badgeCor: 'bg-amber-950/70 text-amber-400 border-amber-600/50',
          dotColor: 'bg-amber-400',
        };
      case 'base':
      case 'ativo':
      default:
        return {
          label: 'DISPONÍVEL NA BASE',
          badgeCor: 'bg-cyan-950/60 text-cyan-300 border-cyan-700',
          dotColor: 'bg-cyan-400',
        };
    }
  };

  // Filtragem inteligente com suporte ao Soft Delete
  const filtrados = useMemo(() => {
    return agentes.filter((ag) => {
      // Oculte por padrão os agentes inativos, a menos que haja um filtro selecionando-os
      if (filtroStatus !== 'inativo' && ag.situacao === 'inativo') {
        return false;
      }

      const org = ag.orgaoId ? orgaosMap.get(ag.orgaoId) : null;
      const tipo = ag.tipoAgenteId ? tiposAgentesMap.get(ag.tipoAgenteId) : null;

      const nome = ag.nome || '';
      const matricula = ag.matricula || '';
      const orgaoNome = org?.nome || ag.corporacaoNome || '';
      const orgaoSigla = org?.sigla || ag.orgaoSigla || '';
      const tipoNome = tipo?.nome || '';
      const viatura = ag.viatura || 'VTR Operacional';

      const termo = busca.toLowerCase();
      const matchesBusca =
        !busca ||
        nome.toLowerCase().includes(termo) ||
        matricula.toLowerCase().includes(termo) ||
        orgaoNome.toLowerCase().includes(termo) ||
        orgaoSigla.toLowerCase().includes(termo) ||
        tipoNome.toLowerCase().includes(termo) ||
        viatura.toLowerCase().includes(termo);

      const matchesCorp =
        filtroCorporacao === 'todas' ||
        String(ag.orgaoId) === filtroCorporacao ||
        (ag.corporacaoId && ag.corporacaoId === filtroCorporacao);

      const matchesStatus =
        filtroStatus === 'todos' || ag.situacao === filtroStatus;

      const matchesSetor =
        filtroSetor === 'todos' || ag.setorId === filtroSetor;

      // Tags rápidas
      let matchesTag = true;
      if (tagRapida === 'ocorrencia') {
        matchesTag = ag.situacao === 'ocorrencia';
      } else if (tagRapida === 'bateria_baixa') {
        matchesTag = (ag.bodycamBateria ?? 85) < 65;
      } else if (tagRapida === 'bodycam_live') {
        matchesTag = ag.bodycamStatus === 'LIVE' || !ag.bodycamStatus;
      }

      return matchesBusca && matchesCorp && matchesStatus && matchesSetor && matchesTag;
    });
  }, [agentes, busca, filtroCorporacao, filtroStatus, filtroSetor, tagRapida, orgaosMap, tiposAgentesMap]);

  return (
    <div className="flex h-screen w-full bg-[#070b10] text-zinc-300 overflow-hidden font-sans select-none">
      {/* 1. SIDEBAR DE NAVEGAÇÃO OPERACIONAL */}
      <aside className="w-64 bg-[#090d14] border-r border-cyan-900/40 flex flex-col justify-between z-20 shrink-0">
        <div>
          {/* Header PROMETHEUS */}
          <div className="p-5 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base font-mono font-bold tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                  PROMETHEUS
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>SYS.ONLINE v4.2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Lateral de Operações */}
          <nav className="p-3 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
              Navegação Operacional
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <Radio className="h-4 w-4 text-zinc-400" />
              <span>Dashboard de Operações</span>
            </button>

            <button
              onClick={() => navigate('/inventario')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <HardDrive className="h-4 w-4 text-zinc-400" />
              <span>Inventário de Equipamentos</span>
            </button>

            <button
              onClick={() => navigate('/cadastro-equipamento')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <PlusSquare className="h-4 w-4 text-zinc-400" />
              <span>Cadastro de Equipamento</span>
            </button>

            {/* ATIVO: EFETIVO DE AGENTES */}
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-cyan-300 bg-cyan-950/40 border-l-4 border-cyan-400 font-semibold shadow-[inset_0_0_15px_rgba(34,211,238,0.1)] cursor-pointer">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span>Efetivo de Agentes</span>
            </button>

            <button
              onClick={() => navigate('/inteligencia')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <Cpu className="h-4 w-4 text-zinc-400" />
              <span>Inteligência Preditiva</span>
            </button>

            <button
              onClick={() => navigate('/crises')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <Siren className="h-4 w-4 text-red-400" />
              <span>Gestão de Crises</span>
            </button>
          </nav>
        </div>

        {/* Footer da Sidebar */}
        <div className="p-4 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
          <div className="flex items-center justify-between mb-1">
            <span>CANAL TELEMETRIA</span>
            <span className="text-cyan-400 font-bold tracking-wider">ENCRYPTED</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>LINK TÁTICO SAT-09 ATIVO</span>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b10]">
        {/* Barra Superior Tática */}
        <header className="px-6 py-3.5 border-b border-zinc-800/80 bg-[#090e16]/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a1017] border border-cyan-900/60 text-cyan-400 text-[11px] font-mono shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-semibold tracking-wider">DEFCON 4 - ESTÁVEL</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a1017] border border-zinc-800 text-cyan-300 text-[11px] font-mono">
              <Wifi className="h-3.5 w-3.5 text-cyan-400" />
              <span>IOT LATENCY:</span>
              <span className="text-white font-bold">12ms</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a1017] border border-zinc-800 text-zinc-300 text-[11px] font-mono">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>{utcTime || '14:28:09'} UTC</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-white tracking-wide">Cmdte. R. Vance</div>
              <div className="text-[10px] font-mono text-zinc-400">CCO Central</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400/60 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono shadow-[0_0_10px_rgba(34,211,238,0.3)]">
              RV
            </div>
          </div>
        </header>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Cabeçalho do Efetivo */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider uppercase mb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                DEFESA INTEGRADA // CCO METROPOLITANO // NÍVEL SIGILO IV
              </div>
              <h2 className="text-xl md:text-2xl font-mono font-bold text-white tracking-tight">
                EFETIVO DE AGENTES & FORÇAS EM CAMPO
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                Monitoramento de biometria tática, comunicação por radiofrequência criptografada, telemetria veicular e despacho dinâmico de forças de intervenção rápida.
              </p>
            </div>

            {/* Botão de Ação Primário + Exportar */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => navigate('/cadastro-agente')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-mono font-bold tracking-wider transition-all shadow-[0_0_16px_rgba(34,211,238,0.4)] cursor-pointer"
              >
                <UserPlus className="h-4 w-4 stroke-[2.5]" />
                <span>+ RECRUTAR / CADASTRAR AGENTE</span>
              </button>

              <button
                onClick={() => alert('Exportando manifesto de prontidão das forças de campo...')}
                className="p-2.5 rounded-lg border border-zinc-800 bg-[#0a1018] text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 4 Cards de KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total */}
            <div className="rounded-xl border border-zinc-800 bg-[#0a1018]/95 p-4 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider block">
                  Total de Operativos
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono font-bold text-white">{totalOperativos}</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">AGENTES</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 block mt-1">
                  100% Homologados CCO
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Users className="h-5 w-5" />
              </div>
            </div>

            {/* KPI 2: Patrulhamento */}
            <div className="rounded-xl border border-cyan-900/50 bg-[#0a1018]/95 p-4 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  Em Patrulhamento
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono font-bold text-white">{emPatrulhamento}</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">AGENTES</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300/80 block mt-1 font-semibold">
                  {totalOperativos > 0 ? ((emPatrulhamento / totalOperativos) * 100).toFixed(1) : 0}% do Efetivo Total
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <Shield className="h-5 w-5" />
              </div>
            </div>

            {/* KPI 3: Disponíveis */}
            <div className="rounded-xl border border-zinc-800 bg-[#0a1018]/95 p-4 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider block">
                  Disponíveis na Base
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono font-bold text-white">{disponiveis}</span>
                  <span className="text-xs font-mono font-bold text-zinc-400">AGENTES</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 block mt-1">
                  Prontos para Reação
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Building2 className="h-5 w-5" />
              </div>
            </div>

            {/* KPI 4: Descanso */}
            <div className="rounded-xl border border-amber-900/40 bg-[#0a1018]/95 p-4 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-500 font-bold tracking-wider block">
                  Descanso / Escala
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono font-bold text-amber-400">{emDescanso}</span>
                  <span className="text-xs font-mono font-bold text-amber-400/80">AGENTES</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400/80 block mt-1 font-semibold">
                  Escala Operacional
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-center justify-center text-amber-400">
                <Moon className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Barra de Ferramentas & Filtros */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Input de Busca */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Filtrar por nome, matrícula..."
                  className="w-full rounded-lg border border-zinc-800 bg-[#0a1018] py-2.5 pl-10 pr-16 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none font-mono transition-all"
                />
                <span className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-[10px] font-mono text-zinc-400">
                  CTRL + K
                </span>
              </div>

              {/* Select Corporações */}
              <select
                value={filtroCorporacao}
                onChange={(e) => setFiltroCorporacao(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-[#0a1018] px-3 py-2.5 text-xs text-zinc-300 font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="todas">Todas as Corporações</option>
                <option value="pmesp">PMESP - Polícia Militar</option>
                <option value="gcm">Guarda Civil Metropolitana</option>
                <option value="cet">CET - Trânsito Viário</option>
                <option value="defesa_civil">Defesa Civil</option>
                <option value="bombeiros">Corpo de Bombeiros</option>
              </select>

              {/* Select Status */}
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-[#0a1018] px-3 py-2.5 text-xs text-zinc-300 font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="ocorrencia">Em Ocorrência</option>
                <option value="patrulhamento">Patrulhamento Ativo</option>
                <option value="deslocamento">Deslocamento Tático</option>
                <option value="base">Disponível na Base</option>
                <option value="inativo">Inativos / Arquivados</option>
              </select>

              {/* Select Setores */}
              <select
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-[#0a1018] px-3 py-2.5 text-xs text-zinc-300 font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos os Setores</option>
                <option value="centro">Setor Centro / Sé</option>
                <option value="sul">Setor Sul</option>
                <option value="norte">Setor Norte</option>
                <option value="leste">Setor Leste</option>
                <option value="oeste">Setor Oeste</option>
              </select>
            </div>

            {/* Linha de Filtros Rápidos */}
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-zinc-500 uppercase text-[10px] font-bold">Filtros Rápidos:</span>
                <button
                  type="button"
                  onClick={() => setTagRapida(tagRapida === 'ocorrencia' ? null : 'ocorrencia')}
                  className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${tagRapida === 'ocorrencia'
                    ? 'bg-red-950 border-red-500 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                    : 'border-red-900/60 bg-red-950/20 text-red-400 hover:border-red-600'
                    }`}
                >
                  ! Ocorrência Ativa (12)
                </button>

                <button
                  type="button"
                  onClick={() => setTagRapida(tagRapida === 'bateria_baixa' ? null : 'bateria_baixa')}
                  className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${tagRapida === 'bateria_baixa'
                    ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : 'border-amber-900/60 bg-amber-950/20 text-amber-400 hover:border-amber-600'
                    }`}
                >
                  Bateria &lt; 25% (3)
                </button>

                <button
                  type="button"
                  onClick={() => setTagRapida(tagRapida === 'bodycam_live' ? null : 'bodycam_live')}
                  className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${tagRapida === 'bodycam_live'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                    : 'border-cyan-900/60 bg-cyan-950/20 text-cyan-400 hover:border-cyan-600'
                    }`}
                >
                  BodyCam Stream (50)
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>Exibindo {filtrados.length} de {agentes.length} Operativos Táticos</span>
              </div>
            </div>
          </div>

          {/* 3. LAYOUT PRINCIPAL: 12 COLUNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-6">
            {/* 4. ÁREA DE AGENTES (8 COLUNAS À ESQUERDA) */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtrados.map((ag) => {
                  const statusInfo = getStatusInfo(ag.situacao || 'ativo');
                  const org = ag.orgaoId ? orgaosMap.get(ag.orgaoId) : null;
                  const orgaoSigla = org?.sigla || ag.orgaoSigla || 'CCO';
                  const corporacaoNome = org?.nome || ag.corporacaoNome || 'SEGURANÇA & OPERAÇÕES';
                  const canalRadio = ag.canalRadio || 'Ch-04 Tático (AES-256)';
                  const pingTempo = ag.pingTempo || 'Há 03s';
                  const setor = ag.setor || 'Setor Operacional Central';
                  const coords =
                    ag.latitude != null && ag.longitude != null
                      ? `(${Number(ag.latitude).toFixed(3)}, ${Number(ag.longitude).toFixed(3)})`
                      : '(-21.934, -50.514)';
                  const bodycamBateria = ag.bodycamBateria ?? 88;
                  const bodycamStatus = ag.bodycamStatus || 'LIVE';
                  const viatura = ag.viatura || 'VTR-09 (Tática)';

                  return (
                    <div
                      key={ag.id}
                      className="rounded-xl border border-zinc-800/90 bg-[#0a1018]/95 p-4 shadow-xl flex flex-col justify-between hover:border-cyan-700/60 transition-all duration-200"
                    >
                      <div>
                        {/* Cabeçalho do Card */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner">
                                <User className="h-5 w-5 text-zinc-400" />
                              </div>
                              <span
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a1018] ${statusInfo.dotColor}`}
                              />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white tracking-wide leading-tight">
                                {ag.nome}
                              </h3>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-0.5">
                                <span>{ag.matricula}</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-cyan-400 font-semibold">{orgaoSigla}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setItemEmEdicao(ag);
                              setIsModalOpen(true);
                            }}
                            className="text-zinc-500 hover:text-white cursor-pointer p-1"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Tag da Corporação & Badge de Status */}
                        <div className="flex items-center justify-between mb-3 text-[10px] font-mono">
                          <span className="text-zinc-400 uppercase font-semibold text-[9px] tracking-wider">
                            {corporacaoNome}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${statusInfo.badgeCor}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Telemetria do Agente */}
                        <div className="space-y-1.5 text-[11px] font-mono text-zinc-300 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/70 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-[10px]">CANAL DE RÁDIO:</span>
                            <span className="font-bold text-white text-[10px]">{canalRadio}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-[10px]">PING / GPS:</span>
                            <span className="text-cyan-300 text-[10px]">
                              {pingTempo} • {setor} <span className="text-zinc-500">{coords}</span>
                            </span>
                          </div>

                          {/* Bodycam e Bateria com Barra de Progresso */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                              <Video className="h-3 w-3 text-zinc-400" /> BODYCAM / BATERIA:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-white">{bodycamBateria}%</span>
                              <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${bodycamBateria < 65 ? 'bg-amber-400' : 'bg-cyan-400'
                                    }`}
                                  style={{ width: `${bodycamBateria}%` }}
                                />
                              </div>
                              <span
                                className={`text-[9px] font-bold ${bodycamStatus === 'LIVE'
                                  ? 'text-cyan-400'
                                  : bodycamStatus === 'DOCKING'
                                    ? 'text-zinc-400'
                                    : 'text-amber-400'
                                  }`}
                              >
                                {bodycamStatus === 'LIVE' ? '● LIVE' : bodycamStatus}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                              <Car className="h-3 w-3 text-zinc-400" /> VIATURA:
                            </span>
                            <span className="text-zinc-300 text-[10px] truncate max-w-[200px]">
                              {viatura}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé com 3 Botões de Ação */}
                      <div className="grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            const lat = ag.latitude != null ? ag.latitude : -21.9348;
                            const lng = ag.longitude != null ? ag.longitude : -50.5146;
                            navigate(`/?lat=${lat}&lng=${lng}`);
                          }}
                          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 hover:text-white hover:border-cyan-500/50 transition-all cursor-pointer"
                          title="Focar no mapa"
                        >
                          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Focar no Mapa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/cadastro-agente/${ag.id}`)}
                          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-cyan-400 hover:text-white hover:bg-cyan-950/40 hover:border-cyan-500/50 transition-all cursor-pointer"
                          title="Editar agente"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInativar(ag.id)}
                          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-rose-400 hover:text-white hover:bg-rose-950/40 hover:border-rose-500/50 transition-all cursor-pointer"
                          title="Desativar agente"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                          <span>Desativar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtrados.length === 0 && (
                <div className="py-16 text-center text-zinc-500 font-mono">
                  Nenhum operativo encontrado com os filtros selecionados.
                </div>
              )}
            </div>

            {/* 5. PAINEL LATERAL (4 COLUNAS À DIREITA) */}
            <div className="lg:col-span-4 space-y-4">
              {/* BLOCO 1: RAIO DE COBERTURA OPERACIONAL */}
              <div className="rounded-xl border border-zinc-800 bg-[#0a1018]/95 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                      Raio de Cobertura Operacional
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800 px-1.5 py-0.5 rounded font-bold">
                    ZONAS DE CALOR
                  </span>
                </div>

                {/* Mini-mapa Real Tático com MapContainer */}
                <div className="relative h-64 rounded-lg overflow-hidden border border-zinc-800 bg-[#090d14]">
                  <MapContainer
                    center={[-21.9348, -50.5146]}
                    zoom={12}
                    zoomControl={false}
                    attributionControl={false}
                    className="h-full w-full rounded-lg"
                    style={{ height: '100%', width: '100%', background: '#090d12' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      className="mapa-cyberpunk"
                    />
                    <Circle
                      center={[-21.9348, -50.5146]}
                      radius={5000}
                      pathOptions={{
                        color: '#06b6d4',
                        fillColor: '#06b6d4',
                        fillOpacity: 0.12,
                        weight: 1.5,
                      }}
                    />
                    {agentesAtivos.map((ag) => {
                      if (ag.latitude == null || ag.longitude == null) return null;
                      return (
                        <CircleMarker
                          key={`mini-ag-${ag.id}`}
                          center={[Number(ag.latitude), Number(ag.longitude)]}
                          radius={5}
                          pathOptions={{
                            color: '#22d3ee',
                            fillColor: '#06b6d4',
                            fillOpacity: 0.9,
                            weight: 1.5,
                          }}
                        >
                          <Popup>
                            <div className="p-1 text-zinc-900 font-mono text-xs">
                              <strong>{ag.nome}</strong>
                              <br />
                              <span className="text-[10px] text-zinc-600">
                                {ag.matricula} ({ag.situacao})
                              </span>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>

              {/* BLOCO 2: DENSIDADE OPERACIONAL POR ZONA */}
              <div className="rounded-xl border border-zinc-800 bg-[#0a1018]/95 p-4 shadow-xl space-y-3">
                <div className="border-b border-zinc-800/80 pb-2">
                  <span className="text-xs font-mono font-bold text-white tracking-wider uppercase block">
                    Densidade Operacional por Zona
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">
                    REGIONAL METROPOLITANA
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  {densidadeZonas.map((zona) => (
                    <div key={zona.nome}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-zinc-300">{zona.nome}</span>
                        <span className={`font-bold ${zona.textCor}`}>
                          {zona.qtd} Ag. ({zona.percentual}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${zona.barCor} ${zona.glow}`}
                          style={{ width: `${Math.max(8, zona.percentual)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé de Telemetria e Paginação */}
        <footer className="px-6 py-3 border-t border-zinc-800/80 bg-[#090e16] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
            <span>TAXA DE ATUALIZAÇÃO TELEMÉTRICA:</span>
            <span className="text-cyan-400 font-bold">1.000ms / WEBSOCKET ATIVO</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <button className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer">
              <ChevronLeft className="h-3 w-3" /> ANTERIOR
            </button>
            <button className="px-2.5 py-1 rounded bg-cyan-400 font-bold text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]">
              1
            </button>
            <button className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 cursor-pointer">
              2
            </button>
            <button className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 cursor-pointer">
              3
            </button>
            <button className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer">
              PRÓXIMO <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </footer>
      </main>

      {/* Modal CRUD Integrado para Recrutar/Editar Agentes */}
      <AgenteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setItemEmEdicao(null);
        }}
        itemEmEdicao={itemEmEdicao}
        onSuccess={() => {
          alert('Registro do agente atualizado com sucesso!');
        }}
      />
    </div>
  );
}
