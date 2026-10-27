import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Radio,
  HardDrive,
  PlusSquare,
  Shield,
  Cpu,
  AlertTriangle,
  Flame,
  Send,
  CheckCircle,
  Clock,
  Car,
  Video,
  X,
  RefreshCw,
  Activity,
  Zap,
  Sparkles,
  Siren,
  Wrench,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

const API_URL = 'http://localhost:3000';

interface Equipamento {
  id: number;
  modeloId?: number;
  numeroSerie: string | null;
  situacao: string;
  latitude: number | null;
  longitude: number | null;
  logradouro?: string | null;
  orgaoId?: number | null;
}

interface Agente {
  id: number;
  tipoAgenteId: number;
  nome: string;
  matricula: string;
  situacao: string;
  latitude: number | null;
  longitude: number | null;
  urlFoto?: string | null;
  orgaoId?: number | null;
  viatura?: string | null;
  canalRadio?: string | null;
}

interface AlertaIA {
  id: string | number;
  origem: string;
  titulo: string;
  tipo: 'critico' | 'atencao' | 'info';
  severidade?: string;
  tempo?: string;
  janela?: string;
  confianca?: string;
  justificativa?: string;
  subtexto?: string;
  latitude?: number;
  longitude?: number;
}

interface CicloCura {
  agenteId: number;
  agenteNome: string;
  equipamentoId: number;
  equipamentoSerie: string;
  segundosRestantes: number;
}

interface CyberToast {
  id: string;
  tipo: 'dispatch' | 'healed' | 'info';
  titulo: string;
  mensagem: string;
}

export default function GestaoCrises() {
  const navigate = useNavigate();

  // Dados reais da API
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [alertasIA, setAlertasIA] = useState<AlertaIA[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal de Despacho
  const [modalDespacho, setModalDespacho] = useState<{
    isOpen: boolean;
    equipamento: Equipamento | null;
  }>({
    isOpen: false,
    equipamento: null,
  });
  const [agenteSelecionadoId, setAgenteSelecionadoId] = useState<string>('');

  // Notificações Cyber-Toast
  const [toasts, setToasts] = useState<CyberToast[]>([]);

  // Ciclos de Cura Ativos (Contador Regressivo de 15 segundos)
  const [ciclosAtivos, setCiclosAtivos] = useState<{ [equipamentoId: number]: CicloCura }>({});

  const showToast = (tipo: 'dispatch' | 'healed' | 'info', titulo: string, mensagem: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, tipo, titulo, mensagem }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [resEq, resAg, resPred] = await Promise.all([
        fetch(`${API_URL}/equipamentos`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch(`${API_URL}/agentes`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch(`${API_URL}/predicoes?cidade=Tupã,%20SP`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      setEquipamentos(Array.isArray(resEq) ? resEq : []);
      setAgentes(Array.isArray(resAg) ? resAg : []);

      if (Array.isArray(resPred) && resPred.length > 0) {
        setAlertasIA(
          resPred.map((p: any) => ({
            id: p.id,
            origem: 'NEURAL-V4 PREDITIVO',
            titulo: p.titulo,
            tipo: p.severidade === 'critica' ? 'critico' : 'atencao',
            janela: p.janela,
            confianca: p.confianca,
            justificativa: p.justificativa,
            tempo: 'Tempo Real',
          })),
        );
      } else {
        setAlertasIA([
          {
            id: 'IA-ALERTA-01',
            origem: 'SENSOR-IOT-942B',
            titulo: 'Anomalia Térmica e Sobrecarga de Loop Semafórico',
            tipo: 'critico',
            confianca: '94.2%',
            tempo: 'Há 1 min',
            justificativa: 'Temperatura de placa a 68°C combinada com pico de fluxo veicular.',
          },
        ]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados em Gestão de Crises:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();

    const socket = io(API_URL);

    socket.on('agente_movido', (dados: Pick<Agente, 'id' | 'latitude' | 'longitude'>) => {
      setAgentes((atual) =>
        atual.map((a) =>
          a.id === dados.id ? { ...a, latitude: dados.latitude, longitude: dados.longitude } : a,
        ),
      );
    });

    socket.on('alerta_equipamento', (dados: Pick<Equipamento, 'id'>) => {
      setEquipamentos((atual) =>
        atual.map((e) => (e.id === dados.id ? { ...e, situacao: 'mau_funcionamento' } : e)),
      );
      showToast(
        'info',
        'FALHA DETECTADA',
        `Alerta de telemetria recebido para Equipamento #${dados.id}`,
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Interval para o contador regressivo dos ciclos de cura de 15 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCiclosAtivos((prev) => {
        const next: { [key: number]: CicloCura } = {};
        let mudou = false;

        Object.entries(prev).forEach(([eqId, ciclo]) => {
          if (ciclo.segundosRestantes > 1) {
            next[Number(eqId)] = {
              ...ciclo,
              segundosRestantes: ciclo.segundosRestantes - 1,
            };
            mudou = true;
          } else {
            mudou = true;
          }
        });

        return mudou ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 1. Equipamentos com Defeito
  const equipamentosComDefeito = useMemo(() => {
    return equipamentos.filter((e) => {
      const sit = (e.situacao || '').toLowerCase().trim();
      return (
        sit === 'mau_funcionamento' ||
        sit === 'falha_critica' ||
        sit.includes('mau') ||
        sit.includes('falha')
      );
    });
  }, [equipamentos]);

  // 2. Unidades em Ocorrência (Agentes despachados)
  const agentesEmOcorrencia = useMemo(() => {
    return agentes.filter((a) => {
      const sit = (a.situacao || '').toLowerCase().trim();
      return (
        sit === 'em ocorrência' ||
        sit === 'em ocorrencia' ||
        sit === 'em_ocorrencia' ||
        sit === 'ocorrencia'
      );
    });
  }, [agentes]);

  // 3. Agentes Disponíveis para o Modal de Despacho
  const agentesDisponiveis = useMemo(() => {
    return agentes.filter((a) => {
      const sit = (a.situacao || '').toLowerCase().trim();
      return (
        sit !== 'inativo' &&
        sit !== 'em ocorrência' &&
        sit !== 'em ocorrencia' &&
        sit !== 'em_ocorrencia' &&
        (sit.includes('patrulh') || sit.includes('dispon') || sit === 'ativo')
      );
    });
  }, [agentes]);

  // FLUXO DE AUTOMAÇÃO (A MÁGICA): Despacho com Ciclo de Cura de 15s
  const handleDespacharAgente = async (agenteId: number, equipamentoId: number) => {
    const agente = agentes.find((a) => a.id === agenteId);
    const equipamento = equipamentos.find((e) => e.id === equipamentoId);

    const agenteNome = agente?.nome || `Agente #${agenteId}`;
    const eqSerie = equipamento?.numeroSerie || `#${equipamentoId}`;

    try {
      // 1. Muda situação do Agente para 'Em Ocorrência'
      const resAgente = await fetch(`${API_URL}/agentes/${agenteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: 'Em Ocorrência' }),
      });

      if (!resAgente.ok) {
        throw new Error('Falha ao despachar agente no backend');
      }

      // 2. Notificação Cyber-Toast imediata
      showToast(
        'dispatch',
        'UNIDADE DESPACHADA // INTERVENÇÃO TÁTICA',
        `${agenteNome} mobilizado para reparo emergencial em ${eqSerie}. Telemetria de autocura iniciada.`,
      );

      // Registra o ciclo de cura com 15 segundos
      setCiclosAtivos((prev) => ({
        ...prev,
        [equipamentoId]: {
          agenteId,
          agenteNome,
          equipamentoId,
          equipamentoSerie: eqSerie,
          segundosRestantes: 15,
        },
      }));

      // Fecha modal e recarrega tela
      setModalDespacho({ isOpen: false, equipamento: null });
      setAgenteSelecionadoId('');
      await carregarDados();

      // 3. O CICLO DE CURA (Simulação de tempo real - 15 segundos)
      setTimeout(async () => {
        try {
          // Dois requests simultâneos: Agente volta para 'Patrulhamento Ativo' e Equipamento para 'Operacional'
          await Promise.all([
            fetch(`${API_URL}/agentes/${agenteId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ situacao: 'Patrulhamento Ativo' }),
            }),
            fetch(`${API_URL}/equipamentos/${equipamentoId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ situacao: 'Operacional' }),
            }),
          ]);

          // Remove do ciclo ativo
          setCiclosAtivos((prev) => {
            const next = { ...prev };
            delete next[equipamentoId];
            return next;
          });

          // Notificação de Sucesso Cyber-Toast
          showToast(
            'healed',
            'AUTOCURA CONCLUÍDA COM SUCESSO',
            `Equipamento ${eqSerie} restaurado para OPERACIONAL. ${agenteNome} retornou ao PATRULHAMENTO ATIVO.`,
          );

          // Recarrega dados atualizados da tela
          await carregarDados();
        } catch (err) {
          console.error('Erro ao concluir ciclo de cura:', err);
        }
      }, 15000);
    } catch (err) {
      console.error('Erro ao despachar unidade:', err);
      showToast(
        'info',
        'ERRO DE DESPACHO',
        'Não foi possível despachar o agente. Verifique a conexão com a API.',
      );
    }
  };

  const navBtn =
    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer';

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-300 overflow-hidden font-sans">
      {/* 1. SIDEBAR LATERAL CYBER-TÁTICA */}
      <aside className="w-64 bg-[#090d14] border-r border-cyan-900/40 flex flex-col justify-between z-20 shrink-0">
        <div>
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

          <nav className="p-3 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
              Navegação Operacional
            </div>

            <button onClick={() => navigate('/dashboard')} className={navBtn}>
              <Radio className="h-4 w-4 text-zinc-400" />
              <span>Dashboard de Operações</span>
            </button>
            <button onClick={() => navigate('/inventario')} className={navBtn}>
              <HardDrive className="h-4 w-4 text-zinc-400" />
              <span>Inventário de Equipamentos</span>
            </button>
            <button onClick={() => navigate('/cadastro-equipamento')} className={navBtn}>
              <PlusSquare className="h-4 w-4 text-zinc-400" />
              <span>Cadastro de Equipamento</span>
            </button>
            <button onClick={() => navigate('/efetivo')} className={navBtn}>
              <Shield className="h-4 w-4 text-zinc-400" />
              <span>Efetivo de Agentes</span>
            </button>
            <button onClick={() => navigate('/inteligencia')} className={navBtn}>
              <Cpu className="h-4 w-4 text-zinc-400" />
              <span>Inteligência Preditiva</span>
            </button>

            {/* ABA ATIVA: GESTÃO DE CRISES */}
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-black bg-gradient-to-r from-red-500 to-orange-400 border-l-4 border-red-300 font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer">
              <Siren className="h-4 w-4 animate-pulse" />
              <span>Gestão de Crises</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
          <div className="flex items-center justify-between mb-1">
            <span>CANAL TELEMETRIA</span>
            <span className="text-red-400 font-bold tracking-wider">DEFCON 2</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
            <span>AUTO-RESOLUÇÃO MESH ATIVA</span>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
        {/* CABEÇALHO */}
        <header className="p-6 border-b border-zinc-800/80 bg-gradient-to-r from-[#0d1520] via-zinc-950 to-[#120a10] flex items-center justify-between shrink-0 shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-red-800/60 bg-red-950/50 text-red-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                AUTONOMOUS CRISIS TRIAGE
              </span>
              <span className="text-zinc-500">// F.O.G.O-CORE-DISPATCH</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              CENTRAL DE DESPACHO E{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]">
                RESOLUÇÃO AUTÔNOMA
              </span>
            </h1>
            <p className="mt-1 text-xs text-zinc-400 max-w-2xl font-sans">
              Triagem em tempo real de falhas de hardware e anomalias preditivas com orquestração
              tática de agentes e ciclo simulado de autocura em 15 segundos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={carregarDados}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-cyan-500/50 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
              title="Recarregar Dados"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-950/30 text-xs font-mono">
              <Flame className="h-4 w-4 text-red-500 animate-bounce" />
              <div className="text-left">
                <div className="text-[9px] text-zinc-400 uppercase font-semibold">Crises Ativas</div>
                <div className="text-sm font-bold text-red-400 font-mono">
                  {equipamentosComDefeito.length + alertasIA.length}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/30 text-xs font-mono">
              <Car className="h-4 w-4 text-amber-400" />
              <div className="text-left">
                <div className="text-[9px] text-zinc-400 uppercase font-semibold">Em Despacho</div>
                <div className="text-sm font-bold text-amber-300 font-mono">
                  {agentesEmOcorrencia.length}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* CORPO: GRID 2 COLUNAS */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUNA 1: ALERTAS ATIVOS */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                <h2 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
                  Alertas Ativos & Falhas de Hardware ({equipamentosComDefeito.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Prioridade Tática Alta
              </span>
            </div>

            {/* Lista de Equipamentos com Defeito */}
            <div className="space-y-3">
              {equipamentosComDefeito.map((eq) => {
                const ciclo = ciclosAtivos[eq.id];
                const emCura = !!ciclo;

                return (
                  <div
                    key={eq.id}
                    className={`rounded-xl border p-4 transition-all duration-300 shadow-xl ${
                      emCura
                        ? 'border-amber-500/60 bg-gradient-to-br from-amber-950/20 via-[#0a1018] to-amber-950/10'
                        : 'border-red-500/50 bg-[#0a1018] hover:border-red-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-red-600/90 text-white font-bold uppercase tracking-wider">
                            Falha Crítica
                          </span>
                          <span className="text-zinc-500 font-mono">ID #{eq.id}</span>
                          <span className="text-zinc-400 font-mono">
                            {eq.numeroSerie || 'Série Desconhecida'}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-bold text-white tracking-wide">
                          Equipamento em Mau Funcionamento
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {eq.logradouro || 'Localização central monitorada'}
                          {eq.latitude && eq.longitude && (
                            <span className="text-cyan-400 font-mono text-[11px] ml-2">
                              ({eq.latitude.toFixed(4)}, {eq.longitude.toFixed(4)})
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Botão de Despachar ou Banner de Cura */}
                      {!emCura ? (
                        <button
                          type="button"
                          onClick={() => setModalDespacho({ isOpen: true, equipamento: eq })}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer shrink-0"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Despachar Unidade</span>
                        </button>
                      ) : (
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-600/60 text-amber-300 font-mono text-xs font-bold animate-pulse">
                            <Wrench className="h-3.5 w-3.5" />
                            <span>EM RESOLUÇÃO ({ciclo.segundosRestantes}s)</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Barra de Progresso do Ciclo de Cura (15s) */}
                    {emCura && (
                      <div className="mt-3 pt-3 border-t border-amber-900/40 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            Operador {ciclo.agenteNome} em intervenção no local
                          </span>
                          <span className="text-zinc-400 font-mono">
                            Autocura em {ciclo.segundosRestantes}s
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-1000 shadow-[0_0_10px_#f59e0b]"
                            style={{
                              width: `${((15 - ciclo.segundosRestantes) / 15) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Alertas da Inteligência Artificial */}
              {alertasIA.map((alerta) => (
                <div
                  key={alerta.id}
                  className="rounded-xl border border-orange-500/40 bg-[#0a1018] p-4 shadow-lg space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="flex items-center gap-1.5 text-orange-400 font-bold uppercase">
                      <Cpu className="h-3.5 w-3.5" /> {alerta.origem}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-orange-950/80 border border-orange-700/60 text-orange-300 font-bold">
                      {alerta.confianca || '92%'} Confiança IA
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100">{alerta.titulo}</h3>
                  {alerta.justificativa && (
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      {alerta.justificativa}
                    </p>
                  )}

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      {alerta.tempo || 'Janela: Imediata'}
                    </span>
                    <span className="text-cyan-400 uppercase tracking-wider">
                      Telemetria Preditiva
                    </span>
                  </div>
                </div>
              ))}

              {equipamentosComDefeito.length === 0 && alertasIA.length === 0 && (
                <div className="rounded-xl border border-emerald-900/60 bg-[#0a1018] py-16 px-6 text-center shadow-lg">
                  <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3 animate-pulse" />
                  <h3 className="font-mono text-base font-bold text-emerald-300 uppercase tracking-wider">
                    SISTEMA OPERACIONAL ESTÁVEL
                  </h3>
                  <p className="mt-1 font-mono text-xs text-zinc-400">
                    Nenhum equipamento em falha crítica ou alerta ativo registrado.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* COLUNA 2: UNIDADES EM OCORRÊNCIA */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Siren className="h-5 w-5 text-amber-400" />
                <h2 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
                  Unidades em Ocorrência ({agentesEmOcorrencia.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                Monitoramento Tático Live
              </span>
            </div>

            <div className="space-y-3">
              {agentesEmOcorrencia.map((ag) => {
                const viatura = (ag as any).viatura || `VTR-${String(ag.id).padStart(2, '0')}`;
                const canal = ag.canalRadio || 'Ch-04 Tático (AES-256)';

                // Checa se o agente está envolvido em algum ciclo de autocura
                const cicloDoAgente = Object.values(ciclosAtivos).find((c) => c.agenteId === ag.id);

                return (
                  <div
                    key={ag.id}
                    className="rounded-xl border border-amber-500/50 bg-gradient-to-br from-[#0d141e] to-[#0a1018] p-4 shadow-xl space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-11 w-11 rounded-full bg-zinc-900 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                            <Shield className="h-5 w-5" />
                          </div>
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-[#0a1018] animate-ping" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white tracking-wide">{ag.nome}</h3>
                            <span className="px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-700/60 text-amber-300 font-mono text-[10px] font-bold uppercase">
                              Em Ocorrência
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                            <span>{ag.matricula}</span>
                            <span>•</span>
                            <span className="text-cyan-400 font-semibold">{viatura}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <div className="text-[10px] text-zinc-500 uppercase">Canal Rádio</div>
                        <div className="text-white font-bold">{canal}</div>
                      </div>
                    </div>

                    {/* Status da Missão / Ciclo de Resolução */}
                    {cicloDoAgente ? (
                      <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-600/40 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-amber-300 font-bold flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 animate-spin text-amber-400" />
                            Restaurando {cicloDoAgente.equipamentoSerie}
                          </span>
                          <span className="text-white font-mono font-bold">
                            {cicloDoAgente.segundosRestantes}s restantes
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 transition-all duration-1000 shadow-[0_0_8px_#f59e0b]"
                            style={{
                              width: `${((15 - cicloDoAgente.segundosRestantes) / 15) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-zinc-300">
                          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                          Setor Operacional em Atendimento
                        </span>
                        <span className="text-cyan-300 font-semibold">PATRULHA DESPACHADA</span>
                      </div>
                    )}

                    {/* Métricas e Telemetria do Agente */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Video className="h-3 w-3 text-cyan-400" />
                        <span>BODYCAM: LIVE</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-emerald-400" />
                        <span>LINK SAT: 100%</span>
                      </div>
                      <div className="text-right text-zinc-500 font-semibold">
                        GPS SINCRONIZADO
                      </div>
                    </div>
                  </div>
                );
              })}

              {agentesEmOcorrencia.length === 0 && (
                <div className="rounded-xl border border-zinc-800 bg-[#0a1018] py-16 px-6 text-center shadow-lg">
                  <Shield className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="font-mono text-sm font-bold text-zinc-400 uppercase tracking-wider">
                    NENHUMA UNIDADE EM OCORRÊNCIA
                  </h3>
                  <p className="mt-1 font-mono text-xs text-zinc-500">
                    Todas as equipes estão em patrulhamento preventivo ou disponíveis na base.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* 3. MODAL DE DESPACHO DE UNIDADE (DARK CYBER) */}
      {modalDespacho.isOpen && modalDespacho.equipamento && (
        <div className="fixed inset-0 z-[3000] bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-[#0a1018] border border-cyan-900/80 w-full max-w-lg p-6 rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(34,211,238,0.2)] flex flex-col gap-4 text-zinc-100">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Siren className="h-5 w-5 text-red-500 animate-pulse" />
                <h3 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
                  DESPACHAR UNIDADE TÁTICA
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalDespacho({ isOpen: false, equipamento: null });
                  setAgenteSelecionadoId('');
                }}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Resumo do Equipamento em Falha */}
            <div className="rounded-lg border border-red-500/50 bg-red-950/20 p-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-red-400 font-bold uppercase">EQUIPAMENTO COM FALHA</span>
                <span className="text-zinc-400">ID #{modalDespacho.equipamento.id}</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                {modalDespacho.equipamento.numeroSerie || 'Série Desconhecida'}
              </h4>
              <p className="text-xs text-zinc-400">
                {modalDespacho.equipamento.logradouro || 'Coordenadas operacionais em zona crítica'}
              </p>
            </div>

            {/* Seleção de Agente Disponível */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-zinc-300 tracking-wider flex items-center justify-between">
                <span>Agentes Disponíveis ({agentesDisponiveis.length})</span>
                <span className="text-[10px] text-zinc-500 font-normal">
                  Filtro: Patrulhamento / Disponível
                </span>
              </label>

              {agentesDisponiveis.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {agentesDisponiveis.map((ag) => {
                    const viatura = (ag as any).viatura || `VTR-${String(ag.id).padStart(2, '0')}`;
                    const isSelected = agenteSelecionadoId === String(ag.id);

                    return (
                      <div
                        key={ag.id}
                        onClick={() => setAgenteSelecionadoId(String(ag.id))}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                            : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-400'
                                : 'border-zinc-600 bg-transparent'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white font-mono">{ag.nome}</div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              Matrícula: {ag.matricula} • {viatura}
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 uppercase">
                          {ag.situacao}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-amber-700/60 bg-amber-950/20 text-center text-xs font-mono text-amber-300">
                  Nenhum agente em patrulhamento ou disponível no momento.
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setModalDespacho({ isOpen: false, equipamento: null });
                  setAgenteSelecionadoId('');
                }}
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!agenteSelecionadoId}
                onClick={() => {
                  if (modalDespacho.equipamento) {
                    handleDespacharAgente(
                      Number(agenteSelecionadoId),
                      modalDespacho.equipamento.id,
                    );
                  }
                }}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                <span>Confirmar Despacho (Inicia Ciclo de Cura 15s)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CYBER-TOAST NOTIFICATIONS (FIXED TOP-RIGHT) */}
      <div className="fixed top-5 right-5 z-[4000] flex flex-col gap-2 pointer-events-none max-w-md w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-in slide-in-from-top-4 flex items-start gap-3 ${
              t.tipo === 'dispatch'
                ? 'border-amber-500/80 bg-[#0a1018]/95 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                : t.tipo === 'healed'
                ? 'border-emerald-500/80 bg-[#0a1018]/95 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                : 'border-cyan-500/80 bg-[#0a1018]/95 shadow-[0_0_25px_rgba(34,211,238,0.3)]'
            }`}
          >
            {t.tipo === 'dispatch' && (
              <Siren className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            )}
            {t.tipo === 'healed' && (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {t.tipo === 'info' && (
              <Activity className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <div
                className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                  t.tipo === 'dispatch'
                    ? 'text-amber-300'
                    : t.tipo === 'healed'
                    ? 'text-emerald-300'
                    : 'text-cyan-300'
                }`}
              >
                {t.titulo}
              </div>
              <p className="mt-1 text-xs text-zinc-200 leading-snug font-sans">
                {t.mensagem}
              </p>
            </div>

            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
