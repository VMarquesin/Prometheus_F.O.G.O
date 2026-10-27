import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  HardDrive,
  PlusSquare,
  Shield,
  Brain,
  Cpu,
  TrendingUp,
  AlertTriangle,
  CloudRain,
  Activity,
  Target,
  Clock,
  Zap,
  Route as RouteIcon,
  Siren,
  Waves,
  MapPin,
  Thermometer,
  SlidersHorizontal,
  Gauge,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

type Severidade = 'critica' | 'moderada';

const CIDADES = ['Tupã, SP', 'Marília, SP', 'São Paulo, SP', 'Campinas, SP'];

// Formato retornado pelo backend (GET /predicoes)
interface AlertaPreditivo {
  id: string;
  severidade: Severidade;
  titulo: string;
  janela: string;
  confianca: string;
  justificativa: string;
}

// Dados do gráfico de barras (falhas reais x projeção algorítmica)
const DADOS_GRAFICO = [
  { hora: '14:00', altura: 28, tipo: 'real' },
  { hora: '15:00', altura: 40, tipo: 'real' },
  { hora: '16:00', altura: 52, tipo: 'real' },
  { hora: '17:00', altura: 38, tipo: 'real' },
  { hora: '17:30', altura: 66, tipo: 'real' },
  { hora: '18:00', altura: 92, tipo: 'pico' },
  { hora: '18:30', altura: 84, tipo: 'projecao' },
  { hora: '19:00', altura: 76, tipo: 'projecao' },
  { hora: '20:00', altura: 58, tipo: 'projecao' },
  { hora: '22:00', altura: 36, tipo: 'projecao' },
];

export default function InteligenciaPreditiva() {
  const navigate = useNavigate();

  const [cidadeAlvo, setCidadeAlvo] = useState('Tupã, SP');
  const [alertasPreditivos, setAlertasPreditivos] = useState<AlertaPreditivo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ titulo: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // Consulta o motor de Inteligência Preditiva (Open-Meteo + regras)
  const handleRecalcular = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        'http://localhost:3000/predicoes?cidade=' + encodeURIComponent(cidadeAlvo),
      );
      const dados = await res.json();
      setAlertasPreditivos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao buscar predições:', err);
      setAlertasPreditivos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleRecalcular();
  }, []);

  const handleAcaoPreditiva = (alertaId: string, tipoAcao?: string) => {
    let titulo = 'Ação Tática Executada. Gargalo Mitigado.';
    if (tipoAcao === 'protocolo_defesa') {
      titulo = 'Protocolo Preventivo Defesa Civil Acionado.';
    } else if (tipoAcao === 'simulacao_rota') {
      titulo = 'Rota de Desvio Simulada no PMV com Sucesso.';
    } else if (tipoAcao === 'dispensar') {
      titulo = 'Alerta Preditivo Arquivado com Sucesso.';
    }

    setToastMsg({ titulo, tipo: 'sucesso' });
    setTimeout(() => setToastMsg(null), 4000);
    setAlertasPreditivos((prev) => prev.filter((a) => a.id !== alertaId));
  };

  const totalCriticos = alertasPreditivos.filter((a) => a.severidade === 'critica').length;

  const navBtn =
    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer';

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-300 overflow-hidden font-sans">
      {/* SIDEBAR */}
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

            {/* ATIVO */}
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-black bg-cyan-400 border-l-4 border-cyan-200 font-bold shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer">
              <Cpu className="h-4 w-4" />
              <span>Inteligência Preditiva</span>
            </button>
            <button onClick={() => navigate('/crises')} className={navBtn}>
              <Siren className="h-4 w-4 text-zinc-400" />
              <span>Gestão de Crises</span>
            </button>
          </nav>
        </div>

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

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-950">
        {/* HEADER */}
        <header className="rounded-xl border border-zinc-800 bg-gradient-to-br from-[#0d1520] to-zinc-950 p-6 flex items-start justify-between gap-6 shadow-xl">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-cyan-800/60 bg-cyan-950/50 text-cyan-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                NEURAL LOGIC V4.2 ACTIVE
              </span>
              <span className="text-zinc-500">// CCO-PRED-CORE-09</span>
            </div>
            <h2 className="text-3xl font-bold leading-tight text-white tracking-tight">
              CENTRAL DE INTELIGÊNCIA PREDITIVA &{' '}
              <span className="text-cyan-400">ANÁLISE DE RISCO URBANO</span>
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Algoritmos de aprendizado profundo (Deep Learning) treinados em 10 anos de
              telemetria meteorológica, fluxo viário e histórico de incidentes em tempo real.
            </p>

            {/* Barra de controle: cidade alvo */}
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 shadow-lg">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-zinc-500">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" /> Cidade Alvo
              </span>
              <select
                value={cidadeAlvo}
                onChange={(e) => setCidadeAlvo(e.target.value)}
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-mono font-bold text-cyan-300 focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                {CIDADES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleRecalcular}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-md border border-cyan-500/50 bg-cyan-900/40 px-3 py-1.5 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-900/70 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Processando...' : 'Recalcular Projeções'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 font-mono">
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              <div>
                <div className="text-[9px] text-zinc-500 uppercase">Modelo Ativo</div>
                <div className="text-xs font-bold text-white">PROMETHEUS-NEURAL-V4</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2">
              <Target className="h-4 w-4 text-cyan-400" />
              <div>
                <div className="text-[9px] text-zinc-500 uppercase">Acurácia Histórica</div>
                <div className="text-xs font-bold text-cyan-300">94.6%</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <div>
                <div className="text-[9px] text-zinc-500 uppercase">Janela de Projeção</div>
                <div className="text-xs font-bold text-white">12 Horas à Frente</div>
              </div>
            </div>
          </div>
        </header>

        {/* GRÁFICOS */}
        <section className="grid grid-cols-2 gap-6">
          {/* Card 1 - Barras */}
          <div className="rounded-xl border border-zinc-800 bg-[#0a1018] p-5 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  <CloudRain className="h-3 w-3" /> Telemetria Preditiva // Clima & Hardware
                </div>
                <h3 className="mt-1 text-lg font-bold text-white leading-snug">
                  Tendência de Falhas de Hardware & Riscos Climáticos
                </h3>
              </div>
              <div className="flex flex-col gap-1 text-[9px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-cyan-600"></span> Falhas Reais
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-0.5 bg-amber-400"></span> Projeção Algorítmica
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-orange-400/80"></span> Pico de Estresse
                </span>
              </div>
            </div>

            <div className="relative mt-4 h-44 rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 pt-8 pb-2">
              <div className="absolute right-[22%] top-2 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[9px] font-mono text-white shadow">
                <span className="text-amber-400 font-bold">PICO 18:00 (89% ESTRESSE)</span>
                <br />
                Subestação Elétrica + Semáforos
              </div>
              <div className="flex h-full items-end gap-2">
                {DADOS_GRAFICO.map((d) => (
                  <div key={d.hora} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className={`w-full rounded-t-sm transition-all hover:brightness-125 ${d.tipo === 'real'
                        ? 'bg-cyan-600'
                        : d.tipo === 'pico'
                          ? 'bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.6)]'
                          : 'bg-orange-300/50'
                        }`}
                      style={{ height: `${d.altura}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-1 flex justify-between px-3 text-[9px] font-mono text-zinc-500">
              {DADOS_GRAFICO.map((d) => (
                <span key={d.hora} className={d.tipo === 'pico' ? 'text-amber-400 font-bold' : ''}>
                  {d.hora}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Thermometer className="h-4 w-4 text-amber-400" />
                Sobrecarga térmica estimada em 38 transformadores da Baixada de {cidadeAlvo}{' '}
                durante pico pluviométrico.
              </div>
              <span className="shrink-0 rounded border border-amber-700/60 bg-amber-950/50 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                RISCO: ALTO
              </span>
            </div>
          </div>

          {/* Card 2 - Curva */}
          <div className="rounded-xl border border-zinc-800 bg-[#0a1018] p-5 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  <TrendingUp className="h-3 w-3" /> Fluxo Viário // ML Predictive
                </div>
                <h3 className="mt-1 text-lg font-bold text-white leading-snug">
                  Pico de Congestionamento & Gargalos
                </h3>
              </div>
              <span className="rounded border border-red-800/60 bg-red-950/50 px-2 py-0.5 text-[10px] font-mono font-bold text-red-400">
                TENDÊNCIA: SATURAÇÃO
              </span>
            </div>

            <div className="relative mt-4 h-32 rounded-lg border border-zinc-800/80 bg-zinc-950/70 overflow-hidden">
              <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <linearGradient id="curvaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 105 C 80 100, 120 90, 160 55 S 230 10, 260 12 S 330 80, 400 100 L400 120 L0 120 Z"
                  fill="url(#curvaFill)"
                />
                <path
                  d="M0 105 C 80 100, 120 90, 160 55 S 230 10, 260 12 S 330 80, 400 100"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute left-[55%] top-1 rounded bg-red-600 px-2 py-0.5 text-[9px] font-mono font-bold text-white">
                18h30: +85% Lentidão
              </span>
            </div>

            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-orange-400 uppercase">
                <AlertTriangle className="h-3.5 w-3.5" /> Gargalo crítico previsto: Corredor
                Norte-Sul · {cidadeAlvo}
              </div>
              <p className="mt-1 text-xs text-zinc-300">
                Volume projetado de 4.360 veículos/hora contra capacidade nominal de 2.800
                veículos no túnel Ayrton Senna entre 18:15 e 19:40.
              </p>
              <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                <span>
                  VELOCIDADE MÉDIA: <b className="text-white">6 km/h</b>
                </span>
                <span>
                  ÍNDICE RETENÇÃO: <b className="text-red-400">91/100</b>
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                <div className="text-[9px] font-mono uppercase text-zinc-500">Tempo de Retardo</div>
                <div className="text-lg font-mono font-bold text-white">+38 min</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                <div className="text-[9px] font-mono uppercase text-zinc-500">
                  Interseções Afetadas
                </div>
                <div className="text-lg font-mono font-bold text-cyan-300">14 Cruzamentos</div>
              </div>
            </div>
          </div>
        </section>

        {/* ALERTAS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Activity className="h-5 w-5 text-cyan-400" />
              {alertasPreditivos.length} ALERTAS PREDITIVOS EM VIGÊNCIA
              {totalCriticos > 0 && (
                <span className="rounded-full bg-red-700 px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                  {totalCriticos} {totalCriticos > 1 ? 'Críticos' : 'Crítico'}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase">
              Filtrar por confiança:
              <span className="rounded border border-cyan-800 bg-cyan-950/50 px-2 py-0.5 text-cyan-300">
                ≥ 90% conf.
              </span>
              <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5">Todos</span>
            </div>
          </div>

          {alertasPreditivos.map((a) => {
            const critica = a.severidade === 'critica';
            const isClima = a.id.startsWith('PRE-CLM');
            const isTermico = a.id.startsWith('PRE-TRM');

            return (
              <article
                key={a.id}
                className={`rounded-xl border border-zinc-800 border-l-4 bg-[#0a1018] p-5 shadow-lg ${critica ? 'border-l-red-500' : 'border-l-orange-400'
                  }`}
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span
                        className={`rounded px-2 py-0.5 font-bold uppercase ${critica
                          ? 'bg-red-700 text-white'
                          : 'bg-orange-950/60 border border-orange-700/60 text-orange-300'
                          }`}
                      >
                        Severidade {critica ? 'Crítica' : 'Moderada'}
                      </span>
                      <span className="text-zinc-500">ID: {a.id}</span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <MapPin className="h-3 w-3" /> {cidadeAlvo}
                      </span>
                    </div>
                    <h4 className="mt-2 text-2xl font-bold text-white leading-tight">
                      {a.titulo}
                    </h4>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 font-mono">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-right">
                      <div className="text-[9px] text-zinc-500 uppercase">Janela Estimada</div>
                      <div className="text-xs font-bold text-amber-400">{a.janela}</div>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-right">
                      <div className="text-[9px] text-zinc-500 uppercase">Confiança IA</div>
                      <div className="text-xs font-bold text-cyan-300">{a.confianca}</div>
                    </div>
                  </div>
                </div>

                {/* Corpo */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* Esquerda */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">Predição</div>
                    {isClima ? (
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-800/60 bg-red-950/50">
                            <Waves className="h-6 w-6 text-red-400" />
                          </div>
                          <div className="text-sm text-zinc-300">
                            Precipitação pluviométrica detectada em tempo real com saturação do solo e risco de inundação.
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                          <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                            <div className="text-zinc-500">FONTE DADOS</div>
                            <div className="font-bold text-amber-400">Open-Meteo</div>
                          </div>
                          <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                            <div className="text-zinc-500">JANELA</div>
                            <div className="font-bold text-white">{a.janela}</div>
                          </div>
                          <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                            <div className="text-zinc-500">CONFIANÇA</div>
                            <div className="font-bold text-cyan-300">{a.confianca}</div>
                          </div>
                        </div>
                      </div>
                    ) : isTermico ? (
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-amber-800/60 bg-amber-950/50">
                            <Thermometer className="h-6 w-6 text-amber-400" />
                          </div>
                          <div className="text-sm text-zinc-300">
                            Estresse térmico severo em controladores e sensores IoT decorrente de temperatura elevada.
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                          <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                            <div className="text-zinc-500">RISCO HARDWARE</div>
                            <div className="font-bold text-amber-400">Degradação</div>
                          </div>
                          <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                            <div className="text-zinc-500">JANELA</div>
                            <div className="font-bold text-white">{a.janela}</div>
                          </div>
                          <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                            <div className="text-zinc-500">CONFIANÇA</div>
                            <div className="font-bold text-cyan-300">{a.confianca}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="text-[10px] font-mono uppercase text-zinc-500">
                          Simulação de Ajuste Semafórico
                        </div>
                        <div className="mt-1 flex items-end gap-3">
                          <span className="text-5xl font-bold text-cyan-300">-42%</span>
                          <span className="pb-1 text-xs text-zinc-300">
                            Congestionamento
                            <br />
                            Estimado
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                          <span>Eixo Principal {cidadeAlvo}</span>
                          <span className="text-cyan-300">+18s Verde</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div className="h-full w-3/4 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Direita */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-cyan-400">
                      <Brain className="h-3.5 w-3.5" /> Justificativa da IA (
                      {critica ? 'Causalidade & Histórico Correlacionado' : 'Análise de Padrão Recorrente'}
                      )
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{a.justificativa}</p>
                  </div>
                </div>

                {/* Rodapé */}
                <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Tempo estimado de intervenção: {a.janela}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {critica ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAcaoPreditiva(a.id, 'protocolo_defesa')}
                          className="flex items-center gap-2 rounded-lg border border-red-500/60 bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition-all cursor-pointer"
                        >
                          <Siren className="h-4 w-4" /> Acionar Protocolo Preventivo Defesa Civil
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcaoPreditiva(a.id, 'simulacao_rota')}
                          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-black hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                        >
                          <RouteIcon className="h-4 w-4" /> Simular Rota de Desvio no Painel de
                          Mensagem Variável (PMV)
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="mr-auto flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                          <Gauge className="h-3.5 w-3.5" /> Programação disponível no controlador
                          viário IoT
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAcaoPreditiva(a.id, 'revisar_ciclo')}
                          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer"
                        >
                          <SlidersHorizontal className="h-4 w-4" /> Revisar Ciclo Manualmente
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcaoPreditiva(a.id, 'ajuste_semaforo')}
                          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-black hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                        >
                          <Zap className="h-4 w-4" /> Aplicar Ajuste Semafórico Preditivo
                        </button>
                      </>
                    )}
                    {critica && (
                      <button
                        type="button"
                        onClick={() => handleAcaoPreditiva(a.id, 'dispensar')}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-all cursor-pointer"
                      >
                        Dispensar Alerta
                      </button>
                    )}
                    {!critica && (
                      <button
                        type="button"
                        onClick={() => handleAcaoPreditiva(a.id, 'dispensar')}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
                      >
                        Dispensar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {isLoading && alertasPreditivos.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-[#0a1018] py-12 text-center font-mono text-sm text-cyan-300">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-cyan-400" />
              Consultando motor preditivo para {cidadeAlvo}...
            </div>
          )}

          {!isLoading && alertasPreditivos.length === 0 && (
            <div className="rounded-xl border border-emerald-900/60 bg-[#0a1018] py-14 px-6 text-center shadow-lg">
              <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3 animate-pulse" />
              <div className="font-mono text-sm font-bold uppercase tracking-wider text-emerald-400">
                MALHA URBANA ESTÁVEL. Nenhuma anomalia preditiva detectada para a janela atual.
              </div>
            </div>
          )}
        </section>
      </main>

      {/* CYBER-TOAST FLUTUANTE */}
      {toastMsg && (
        <div className="fixed bottom-8 right-8 z-[5000] bg-zinc-950/95 border border-cyan-500 text-cyan-300 px-6 py-4 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] font-mono text-sm animate-fade-in-up flex items-center gap-3 backdrop-blur-md transition-all duration-300">
          <CheckCircle className="h-5 w-5 text-cyan-400 shrink-0" />
          <span>{toastMsg.titulo}</span>
        </div>
      )}
    </div>
  );
}
