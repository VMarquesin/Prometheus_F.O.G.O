import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { io } from 'socket.io-client';
import {
  Flame,
  Radio,
  PlusSquare,
  Shield,
  Cpu,
  Wifi,
  Clock,
  Eye,
  EyeOff,
  AlertTriangle,
  Send,
  Maximize2,
  X,
  Search,
  HardDrive,
  Crosshair,
  Siren,
  CheckCircle,
} from 'lucide-react';
import { EquipamentoModal } from '../components/EquipamentoModal';
import { AgenteModal } from '../components/AgenteModal';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const API_URL = 'http://localhost:3000';

interface Equipamento {
  id: number;
  modeloId?: number;
  numeroSerie: string | null;
  situacao: string;
  latitude: number | null;
  longitude: number | null;
  dataInstalacao?: string | null;
  caracteristicasEspecificas?: Record<string, unknown> | null;
  urlImagem?: string | null;
  orgaoId?: number | null;
  dataProximaManutencao?: string | null;
  necessidadeManutencao?: string | null;
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
}

interface AlertaIA {
  id: string | number;
  origem: string;
  titulo: string;
  tipo: 'critico' | 'atencao' | 'info';
  probabilidade?: number;
  tempo: string;
  subtexto?: string;
  latitude?: number;
  longitude?: number;
}

type Coordenada = { latitude: number; longitude: number };

const temCoordenadas = <T extends { latitude: number | null; longitude: number | null }>(
  item: T,
): item is T & Coordenada =>
  typeof item.latitude === 'number' &&
  Number.isFinite(item.latitude) &&
  typeof item.longitude === 'number' &&
  Number.isFinite(item.longitude);

// Marcadores Cyberpunk SVG / HTML puro
const criarPinOperacional = () =>
  L.divIcon({
    className: 'cyber-pin-operacional',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <div class="absolute -inset-1 rounded-full bg-cyan-400 opacity-40 animate-pulse"></div>
        <div class="relative w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_12px_#22d3ee]"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });

const criarPinAgente = () =>
  L.divIcon({
    className: 'cyber-pin-agente',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <div class="absolute -inset-1 rounded-full bg-amber-400 opacity-30 animate-pulse"></div>
        <div class="relative w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white shadow-[0_0_12px_#f59e0b]"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });

const criarPinAlerta = (label: string) =>
  L.divIcon({
    className: 'cyber-pin-alerta',
    html: `
      <div class="relative flex flex-col items-center">
        <div class="relative flex items-center justify-center w-7 h-7">
          <span class="absolute -inset-1.5 rounded-full bg-red-600 opacity-75 animate-ping"></span>
          <span class="relative w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-[0_0_18px_#ef4444]"></span>
        </div>
        <div class="mt-1 bg-zinc-950/95 border border-red-500/80 rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
          <span class="text-red-400 uppercase tracking-wider">${label}</span>
          <span class="bg-red-600 text-white px-1 rounded text-[8px] font-mono">RISCO</span>
        </div>
      </div>
    `,
    iconSize: [32, 48],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });

const PIN_OPERACIONAL = criarPinOperacional();
const PIN_AGENTE = criarPinAgente();
const PIN_DESATIVADO = L.divIcon({
  className: 'cyber-pin-desativado',
  html: `<div class="w-3 h-3 bg-zinc-500 rounded-full border-2 border-zinc-300"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -8],
});

// Camada de Mapa de Calor (leaflet.heat) com paleta tática
function HeatmapLayer({ pontos }: { pontos: any[] }) {
  const map = useMap();

  useEffect(() => {
    const validos = pontos.filter((p) => p && p.latitude && p.longitude);
    if (validos.length === 0) return;
    const coordenadas = validos.map((p) => [p.latitude, p.longitude, p.intensidade || 0.9]);

    const heatOptions = {
      radius: 50,
      blur: 28,
      maxZoom: 15,
      max: 1.0,
      gradient: {
        0.2: '#06b6d4',
        0.5: '#eab308',
        0.8: '#f97316',
        1.0: '#ef4444',
      },
    };

    const camada = (L as any).heatLayer(coordenadas, heatOptions);
    camada.addTo(map);

    return () => {
      map.removeLayer(camada);
    };
  }, [map, pontos]);

  return null;
}

const abrirFeed = (latitude: number, longitude: number) => {
  window.open(
    `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`,
    '_blank',
    'noopener,noreferrer',
  );
};

function MapFlyTo({ lat, lng }: { lat: string | null; lng: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([parseFloat(lat), parseFloat(lng)], 18, { duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
}

function MapController({ coordenadaFoco }: { coordenadaFoco?: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (coordenadaFoco && coordenadaFoco.lat && coordenadaFoco.lng) {
      map.flyTo([coordenadaFoco.lat, coordenadaFoco.lng], 17, { duration: 1.5 });
    }
  }, [coordenadaFoco, map]);
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const focoLat = searchParams.get('lat');
  const focoLng = searchParams.get('lng');
  const focoMapa = location.state?.focoMapa;
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [modoHeatmap, setModoHeatmap] = useState(false);
  const [mostrarWidgets, setMostrarWidgets] = useState(true);
  const [alertasIA, setAlertasIA] = useState<AlertaIA[]>([
    {
      id: '1',
      origem: 'SENSOR-IOT-942B',
      titulo: 'Anomalia Térmica e Bloqueio de Via (Av. Brasil x R. 24)',
      tipo: 'critico',
      probabilidade: 89,
      tempo: 'Há 42s',
      subtexto: 'Probabilidade Incêndio: 89%',
      latitude: -21.9348,
      longitude: -50.5146,
    },
    {
      id: '2',
      origem: 'SEMAFORO-TX-104',
      titulo: 'Falha de Sincronia de Ciclo (Bairro Central). Manutenção sugerida em 2h.',
      tipo: 'atencao',
      tempo: 'Há 2 min',
      subtexto: 'Desvio: +1.8s fase verde',
    },
    {
      id: '3',
      origem: 'RADAR-VEL-088',
      titulo: 'Telemetria restabelecida via malha Mesh LoRaWAN tática. Perda de pacotes: 0.02%.',
      tipo: 'info',
      tempo: 'Há 4 min',
    },
  ]);
  const [despachoModal, setDespachoModal] = useState<{ isOpen: boolean; alerta: any }>({
    isOpen: false,
    alerta: null,
  });
  const [agenteSelecionado, setAgenteSelecionado] = useState('');
  const [toastMsg, setToastMsg] = useState<{ titulo: string; tipo: 'sucesso' | 'info' } | null>(null);

  const mostrarToast = (mensagem: string, tipo: 'sucesso' | 'info' = 'sucesso') => {
    setToastMsg({ titulo: mensagem, tipo });
    setTimeout(() => setToastMsg(null), 4000);
  };
  const [menuAtivo, setMenuAtivo] = useState<
    'dashboard' | 'inventario' | 'cadastro' | 'efetivo' | 'inteligencia'
  >('dashboard');

  // Drawer lateral de inventário rápido
  const [isInventarioDrawerOpen, setIsInventarioDrawerOpen] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');

  // Modais de CRUD
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [isAgenteModalOpen, setIsAgenteModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<any | null>(null);

  // Relógio UTC dinâmico
  const [utcTime, setUtcTime] = useState(() => new Date().toUTCString().slice(17, 25));

  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toUTCString().slice(17, 25));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const carregarDados = () => {
    fetch(`${API_URL}/equipamentos`)
      .then((res) => res.json())
      .then(setEquipamentos)
      .catch((err) => console.error('Erro ao buscar equipamentos:', err));

    fetch(`${API_URL}/agentes`)
      .then((res) => res.json())
      .then(setAgentes)
      .catch((err) => console.error('Erro ao buscar agentes:', err));
  };

  const handleDespachar = async () => {
    if (!agenteSelecionado) {
      mostrarToast('Por favor, selecione um agente disponível.', 'info');
      return;
    }

    const idDoAgente = agenteSelecionado;
    const alertaId = despachoModal.alerta?.id;

    try {
      const res = await fetch(`${API_URL}/agentes/${idDoAgente}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: 'Em Ocorrência' }),
      });

      if (!res.ok) {
        throw new Error('Falha ao despachar agente');
      }

      mostrarToast('Unidade despachada! Resolução da anomalia em andamento...');

      if (alertaId != null) {
        setAlertasIA((prev) => prev.filter((a) => String(a.id) !== String(alertaId)));
      }

      setDespachoModal({ isOpen: false, alerta: null });
      setAgenteSelecionado('');
      carregarDados();

      // A Mágica (Auto-Healing): Ciclo de 15 segundos
      setTimeout(async () => {
        try {
          await fetch(`${API_URL}/agentes/${idDoAgente}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ situacao: 'Patrulhamento Ativo' }),
          });

          carregarDados();
          mostrarToast('Ocorrência finalizada com sucesso. Unidade livre para novo patrulhamento.');
        } catch (err) {
          console.error('Erro no auto-healing do agente:', err);
        }
      }, 15000);
    } catch (err) {
      console.error('Erro ao despachar agente:', err);
      mostrarToast('Erro ao despachar agente. Verifique a conexão com o servidor.', 'info');
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
    });

    socket.on('novo_alerta_ia', (alerta: any) => {
      setAlertasIA((atual) => [
        {
          id: alerta.id || Date.now(),
          origem: alerta.fonte || 'PROMETHEUS_IA',
          titulo: alerta.titulo || 'Anomalia Operacional Detectada',
          tipo: alerta.criticidade === 'alta' ? 'critico' : 'atencao',
          probabilidade: alerta.probabilidade || 85,
          tempo: 'Agora',
          latitude: alerta.latitude,
          longitude: alerta.longitude,
        },
        ...atual,
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Alertas Táticos Renderizados a partir do state dinâmico
  const listaAlertasRender: AlertaIA[] = alertasIA;

  // Cálculos de Indicadores Operacionais
  const totalEquipamentos = equipamentos.length;
  const operacionais = equipamentos.filter((e) => e.situacao.toLowerCase() === 'operacional').length;
  const taxaDisponibilidade =
    totalEquipamentos > 0 ? ((operacionais / totalEquipamentos) * 100).toFixed(1) : '99.4';
  const agentesAtivos = agentes.filter((a) => {
    const sit = a.situacao.toLowerCase();
    return sit !== 'inativo' && sit !== 'folga';
  }).length;

  // Pontos combinados para o mapa de calor
  const pontosHeatmap = useMemo<any[]>(() => {
    const falhas = equipamentos
      .filter((eq) => eq.situacao === 'mau_funcionamento' || eq.necessidadeManutencao === 'imediata')
      .map((eq) => ({ latitude: eq.latitude, longitude: eq.longitude, intensidade: 1.0 }));

    const alertas = listaAlertasRender
      .filter((al) => al.latitude && al.longitude)
      .map((al) => ({ latitude: al.latitude, longitude: al.longitude, intensidade: 0.9 }));

    // Se estiver vazio, usa o centro de Tupã para demonstração térmica radiante
    if (falhas.length === 0 && alertas.length === 0) {
      return [{ latitude: -21.9348, longitude: -50.5146, intensidade: 0.95 }];
    }
    return [...falhas, ...alertas];
  }, [equipamentos, listaAlertasRender]);

  // Filtros da gaveta de inventário
  const equipamentosFiltrados = equipamentos.filter((item) => {
    const termo = termoBusca.toLowerCase().trim();
    const matchTexto =
      !termo ||
      (item.numeroSerie ?? '').toLowerCase().includes(termo) ||
      String(item.id).includes(termo);
    const matchSit = filtroSituacao === 'todos' || item.situacao.toLowerCase() === filtroSituacao;
    return matchTexto && matchSit;
  });

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-300 overflow-hidden font-sans select-none">
      {/* 1. NAVEGAÇÃO LATERAL (SIDEBAR CYBER) */}
      <aside className="w-64 bg-[#0a0e14] border-r border-zinc-800/80 flex flex-col justify-between shrink-0 z-30">
        <div>
          {/* Logo / Header da Sidebar */}
          <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.25)]">
              <Flame className="h-5 w-5 fill-orange-500/40" />
            </div>
            <div>
              <div className="font-mono font-black tracking-widest text-white text-sm">
                PROMETHEUS
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                SYS.ONLINE V4.2
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div className="px-5 pt-6 pb-2 text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-bold">
            Navegação Operacional
          </div>

          {/* Menus de Navegação */}
          <nav className="space-y-1 px-2">
            <button
              onClick={() => {
                setMenuAtivo('dashboard');
                setIsInventarioDrawerOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider transition-all cursor-pointer ${menuAtivo === 'dashboard'
                ? 'text-cyan-300 bg-cyan-950/40 border-l-4 border-cyan-400 font-semibold shadow-[inset_0_0_15px_rgba(6,182,212,0.15)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
            >
              <Radio className="h-4 w-4 text-cyan-400" />
              <span>Dashboard de Operações</span>
            </button>

            <button
              onClick={() => {
                navigate('/inventario');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider transition-all cursor-pointer ${menuAtivo === 'inventario'
                ? 'text-cyan-300 bg-cyan-950/40 border-l-4 border-cyan-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
            >
              <HardDrive className="h-4 w-4 text-zinc-400" />
              <span>Inventário de Equipamentos</span>
            </button>

            <button
              onClick={() => {
                navigate('/cadastro-equipamento');
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <PlusSquare className="h-4 w-4 text-zinc-400" />
              <span>Cadastro de Equipamento</span>
            </button>

            <button
              onClick={() => {
                navigate('/efetivo-agentes');
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <Shield className="h-4 w-4 text-zinc-400" />
              <span>Efetivo de Agentes</span>
            </button>

            <button
              onClick={() => navigate('/inteligencia')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider transition-all cursor-pointer ${modoHeatmap
                ? 'text-orange-300 bg-orange-950/30 border-l-4 border-orange-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
            >
              <Cpu className="h-4 w-4 text-orange-400" />
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

      {/* 2. ÁREA CENTRAL DO MAPA */}
      <main className="flex-1 relative h-full w-full overflow-hidden">
        {/* Faixa Superior: Status Bar Tática */}
        <div className="absolute top-3 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
          {/* Indicadores de Estado Tático */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a1017]/90 border border-cyan-900/60 text-cyan-400 text-[11px] font-mono backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-semibold tracking-wider">DEFCON 4 - ESTÁVEL</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a1017]/90 border border-zinc-800 text-cyan-300 text-[11px] font-mono backdrop-blur-md shadow-lg">
              <Wifi className="h-3.5 w-3.5 text-cyan-400" />
              <span>IOT LATENCY:</span>
              <span className="text-white font-bold">12ms</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a1017]/90 border border-zinc-800 text-zinc-300 text-[11px] font-mono backdrop-blur-md shadow-lg">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>{utcTime} UTC</span>
            </div>
          </div>

          {/* Identificação do Operador */}
          <div className="flex items-center gap-3 px-3 py-1 rounded-full bg-[#0a1017]/90 border border-zinc-800 backdrop-blur-md shadow-lg pointer-events-auto">
            <div className="text-right">
              <div className="text-xs font-semibold text-white tracking-wide">Cmdte. R. Vance</div>
              <div className="text-[10px] font-mono text-zinc-400">CCO Central</div>
            </div>
            <div className="w-7 h-7 rounded-full bg-cyan-900/40 border border-cyan-400/50 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono">
              RV
            </div>
          </div>
        </div>

        {/* 3. BARRA FLUTUANTE DE KPIs (CENTRALIZADA) */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-5 bg-[#0a1018]/92 border border-cyan-900/50 rounded-xl px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-md pointer-events-auto">
          {/* KPI 1: Equipamentos */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider">
                Equipamentos Ativos
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold font-mono text-white">
                  {operacionais > 0 ? operacionais : totalEquipamentos}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  / {totalEquipamentos || 1500}
                </span>
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/40">
                  {taxaDisponibilidade}%
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800"></div>

          {/* KPI 2: Agentes */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-950/60 border border-yellow-800/40 flex items-center justify-center text-yellow-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider">
                Agentes em Campo
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold font-mono text-white">
                  {agentesAtivos || 64}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">Operativos</span>
                <span className="text-[10px] font-mono font-semibold text-yellow-400 bg-yellow-950/60 px-1.5 py-0.2 rounded border border-yellow-800/40">
                  12 Viaturas
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800"></div>

          {/* KPI 3: % Disponibilidade */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider">
                % Disponibilidade Malha
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold font-mono text-white">
                  {taxaDisponibilidade}%
                </span>
                <span className="text-[9px] font-mono uppercase text-zinc-400">
                  UPTIME SAT-MESH
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800"></div>

          {/* Toggle Switch: Mapa Térmico */}
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-mono font-bold leading-tight text-right text-cyan-300">
              MAPA TÉRMICO
              <br />
              <span className={modoHeatmap ? 'text-cyan-400' : 'text-zinc-500'}>
                {modoHeatmap ? 'ATIVO' : 'INATIVO'}
              </span>
            </div>

            <button
              onClick={() => setModoHeatmap(!modoHeatmap)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${modoHeatmap
                ? 'bg-cyan-500 shadow-[0_0_12px_#22d3ee]'
                : 'bg-zinc-800 border border-zinc-700'
                }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${modoHeatmap ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          <div className="h-8 w-px bg-zinc-800"></div>

          {/* Toggle: Widgets Inferiores */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarWidgets(!mostrarWidgets)}
              title={mostrarWidgets ? 'Ocultar Painéis Inferiores' : 'Exibir Painéis Inferiores'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold cursor-pointer transition-all duration-300 ${mostrarWidgets
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
            >
              {mostrarWidgets ? (
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-zinc-500" />
              )}
              <span>WIDGETS</span>
              <span
                className={`w-2 h-2 rounded-full ${mostrarWidgets ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-zinc-600'
                  }`}
              />
            </button>
          </div>

          <div className="h-8 w-px bg-zinc-800"></div>

          {/* Filtros rápidos visuais */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1 bg-zinc-900/90 px-2 py-1 rounded border border-zinc-800 text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Semáforos
            </span>
            <span className="flex items-center gap-1 bg-zinc-900/90 px-2 py-1 rounded border border-zinc-800 text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Câmeras OCR
            </span>
            <span className="flex items-center gap-1 bg-zinc-900/90 px-2 py-1 rounded border border-zinc-800 text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Meteorologia
            </span>
          </div>
        </div>

        {/* 4. MAPA LEAFLET COM ESTILO DARK TÁTICO */}
        <MapContainer
          center={[-21.9348, -50.5146]}
          zoom={14}
          zoomControl={false}
          style={{ height: '100%', width: '100%', background: '#090d12' }}
        >
          <MapFlyTo lat={focoLat} lng={focoLng} />
          <MapController coordenadaFoco={focoMapa} />
          {/* Basemap Dark Matter CartoDB (Público sem API Key) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="mapa-cyberpunk"
          />

          {/* Renderização do Heatmap quando ativado */}
          {modoHeatmap && <HeatmapLayer pontos={pontosHeatmap} />}

          {/* Marcadores de Equipamentos */}
          {!modoHeatmap &&
            equipamentos.map((e) => {
              if (!temCoordenadas(e)) return null;
              const isFalha = e.situacao.toLowerCase() === 'mau_funcionamento';
              const icon = isFalha
                ? criarPinAlerta(e.numeroSerie ?? `#${e.id}`)
                : e.situacao.toLowerCase() === 'operacional'
                  ? PIN_OPERACIONAL
                  : PIN_DESATIVADO;

              return (
                <Marker key={`eq-${e.id}`} position={[e.latitude, e.longitude]} icon={icon}>
                  <Popup>
                    <div className="min-w-[240px] p-1.5 text-zinc-900 font-sans">
                      <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                        <strong className="text-sm font-mono font-bold text-zinc-900">
                          {e.numeroSerie ?? `Equipamento #${e.id}`}
                        </strong>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${isFalha ? 'bg-red-100 text-red-600' : 'bg-cyan-100 text-cyan-700'
                            }`}
                        >
                          {e.situacao}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-zinc-700 font-mono">
                        <div>
                          <span className="text-zinc-500">Órgão: </span>
                          <span>{e.orgaoId ? `#${e.orgaoId}` : 'Não vinculado'}</span>
                        </div>
                        {e.dataProximaManutencao && (
                          <div>
                            <span className="text-zinc-500">Manutenção: </span>
                            <span>{new Date(e.dataProximaManutencao).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-zinc-500">Coord: </span>
                          <span>
                            {e.latitude.toFixed(4)}, {e.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => abrirFeed(e.latitude, e.longitude)}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded bg-zinc-900 px-2 py-1.5 text-[11px] font-mono font-semibold text-cyan-300 hover:bg-zinc-800 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" /> Visualizar Feed da Câmera
                      </button>

                      <div className="mt-2 border-t border-zinc-200 pt-2">
                        <button
                          onClick={() => {
                            setItemEmEdicao(e);
                            setIsEquipModalOpen(true);
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-900/40 border border-cyan-500/50 py-2 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-900/70 hover:text-cyan-200 transition-all cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                        >
                          <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Atualização Rápida</span>
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Marcadores de Agentes */}
          {!modoHeatmap &&
            agentes.map(
              (a) =>
                temCoordenadas(a) && (
                  <Marker
                    key={`ag-${a.id}`}
                    position={[a.latitude, a.longitude]}
                    icon={PIN_AGENTE}
                  >
                    <Popup>
                      <div className="min-w-[200px] p-1.5 text-zinc-900 font-sans">
                        <div className="border-b pb-1.5 mb-2">
                          <strong className="text-sm font-semibold">{a.nome}</strong>
                          <div className="text-[10px] font-mono text-zinc-500">
                            Matrícula: {a.matricula}
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-zinc-700 font-mono">
                          <div>
                            <span className="text-zinc-500">Situação: </span>
                            <span className="font-semibold">{a.situacao}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Tipo Agente: </span>
                            <span>#{a.tipoAgenteId}</span>
                          </div>
                        </div>

                        <div className="mt-3 border-t border-zinc-200 pt-2">
                          <button
                            onClick={() => {
                              setItemEmEdicao(a);
                              setIsAgenteModalOpen(true);
                            }}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-900/40 border border-cyan-500/50 py-2 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-900/70 hover:text-cyan-200 transition-all cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                          >
                            <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Atualização Rápida</span>
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ),
            )}
        </MapContainer>

        {/* 5 e 6: PAINÉIS FLUTUANTES INFERIORES CONDICIONAIS */}
        {mostrarWidgets && (
          <>
            {/* 5. WIDGET FLUTUANTE INFERIOR ESQUERDO: TELEMETRIA SETORIAL */}
            <div className="absolute bottom-5 left-5 z-[1000] w-80 bg-[#0a1018]/94 border border-cyan-900/40 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-md pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white tracking-wider">
                    Telemetria Setorial
                  </span>
                </div>
                <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 font-semibold">
                  HISTÓRICO 6H
                </span>
              </div>

              {/* Legenda */}
              <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-cyan-400"></span> Densidade Tráfego
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-orange-400"></span> Índice Térmico
                </span>
              </div>

              {/* Gráfico Vetorial Cyber */}
              <div className="relative py-1">
                <svg viewBox="0 0 280 80" className="w-full h-16 overflow-visible">
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Área sombreada */}
                  <path
                    d="M 0 72 Q 70 68, 110 52 T 190 28 T 280 42 L 280 80 L 0 80 Z"
                    fill="url(#cyanGrad)"
                  />
                  {/* Linha Ciano Tráfego */}
                  <path
                    d="M 0 72 Q 70 68, 110 52 T 190 28 T 280 42"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                  />
                  {/* Linha Laranja Índice Térmico Tracejada */}
                  <path
                    d="M 0 76 Q 80 74, 130 62 T 220 56 T 280 50"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  {/* Ponto atual ciano */}
                  <circle cx="280" cy="42" r="3.5" fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="280" cy="50" r="3" fill="#f97316" stroke="#ffffff" strokeWidth="1" />
                </svg>

                <div className="text-right text-[10px] font-mono font-bold text-cyan-400 mt-1">
                  FLUXO CRÍTICO: <span className="text-white">+38%</span>
                </div>
              </div>

              {/* Métricas do Setor */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="text-[9px] text-zinc-500 uppercase">Poluição Particulada</div>
                  <div className="font-bold text-white">38.2 µg/m³</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-zinc-500 uppercase">Vento / Azimute</div>
                  <div className="font-bold text-cyan-300">14.8 kt • 192°</div>
                </div>
              </div>
            </div>

            {/* 6. WIDGET FLUTUANTE INFERIOR DIREITO: ÚLTIMOS ALERTAS IA */}
            <div className="absolute bottom-5 right-5 z-[1000] w-96 max-h-[460px] bg-[#0a1018]/96 border border-cyan-900/50 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-md flex flex-col pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                    Últimos Alertas IA
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/60 text-[9px] font-mono font-bold text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  LIVE FEED
                </div>
              </div>

              {/* Lista de Alertas */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {listaAlertasRender.map((alerta) => {
                  if (alerta.tipo === 'critico') {
                    return (
                      <div
                        key={alerta.id}
                        className="rounded-lg border border-red-500/50 bg-red-950/20 p-2.5 space-y-1.5 transition-all hover:border-red-400"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="flex items-center gap-1 text-red-400 font-bold">
                            <AlertTriangle className="h-3 w-3" />
                            {alerta.origem}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-bold tracking-wider uppercase">
                            Alta Severidade
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-zinc-100 leading-snug">
                          {alerta.titulo}
                        </p>

                        <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                          <span>{alerta.subtexto || `Probabilidade: ${alerta.probabilidade}%`}</span>
                          <span>{alerta.tempo}</span>
                        </div>

                        <div className="pt-1 flex items-center gap-2">
                          <button
                            onClick={() => navigate('/?lat=' + alerta.latitude + '&lng=' + alerta.longitude)}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-white cursor-pointer"
                          >
                            <Maximize2 className="h-3 w-3" /> Focar no Mapa
                          </button>
                          <button
                            onClick={() => {
                              setDespachoModal({ isOpen: true, alerta });
                              setAgenteSelecionado('');
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono font-bold cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                          >
                            <Send className="h-3 w-3" /> Despachar Agente
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (alerta.tipo === 'atencao') {
                    return (
                      <div
                        key={alerta.id}
                        className="rounded-lg border border-yellow-500/40 bg-yellow-950/20 p-2.5 space-y-1.5 transition-all hover:border-yellow-400"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-yellow-400 font-bold">{alerta.origem}</span>
                          <span className="px-1.5 py-0.2 rounded bg-yellow-500/80 text-black font-bold uppercase">
                            Atenção
                          </span>
                        </div>
                        <p className="text-xs text-zinc-200 font-medium">{alerta.titulo}</p>
                        <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                          <span>{alerta.subtexto}</span>
                          <span>{alerta.tempo}</span>
                        </div>
                        <div className="pt-1 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              mostrarToast('Ajuste Semafórico Preditivo Aplicado!');
                              setAlertasIA((prev) => prev.filter((a) => a.id !== alerta.id));
                            }}
                            className="px-2 py-0.5 rounded bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-mono font-bold cursor-pointer transition-all"
                          >
                            Aplicar Ajuste Semafórico
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={alerta.id}
                      className="rounded-lg border border-cyan-800/40 bg-cyan-950/20 p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-cyan-400 font-bold">{alerta.origem}</span>
                        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1 rounded border border-cyan-800">
                          SISTEMA
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-medium">{alerta.titulo}</p>
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            mostrarToast('Alerta de telemetria arquivado.');
                            setAlertasIA((prev) => prev.filter((a) => a.id !== alerta.id));
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-cyan-300 text-[10px] font-mono cursor-pointer transition-all"
                        >
                          Dispensar
                        </button>
                      </div>
                    </div>
                  );
                })}

                {listaAlertasRender.length === 0 && (
                  <div className="py-8 text-center text-xs font-mono text-emerald-400 flex flex-col items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-emerald-400 animate-pulse" />
                    <span>Nenhum alerta ativo na fila. Malha operacional estável.</span>
                  </div>
                )}
              </div>

              {/* Barra de Coordenadas Inferior */}
              <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                <span className="text-cyan-400">● LAT: -21.9348</span>
                <span>LON: -50.5146</span>
                <span>ALT: 760m</span>
                <span>WGS-84</span>
              </div>
            </div>
          </>
        )}

        {/* 7. DRAWER LATERAL DE INVENTÁRIO (QUANDO CLICADO NO MENU) */}
        {isInventarioDrawerOpen && (
          <div className="absolute top-0 left-0 bottom-0 z-[1050] w-96 bg-[#0a0e14]/98 border-r border-cyan-900/60 p-5 shadow-2xl backdrop-blur-md flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h2 className="text-sm font-mono font-bold text-cyan-400 tracking-wider">
                INVENTÁRIO DE EQUIPAMENTOS
              </h2>
              <button
                onClick={() => setIsInventarioDrawerOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filtros */}
            <div className="space-y-2 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="Filtrar por serial ou ID..."
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <select
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:border-cyan-500 focus:outline-none"
              >
                <option value="todos">Todas as Situações</option>
                <option value="operacional">Operacional</option>
                <option value="mau_funcionamento">Mau Funcionamento</option>
                <option value="manutencao">Manutenção</option>
                <option value="desativado">Desativado</option>
              </select>
            </div>

            {/* Lista com scroll */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {equipamentosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 hover:border-cyan-700/60 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-semibold text-zinc-200">
                      {item.numeroSerie ?? `Equipamento #${item.id}`}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${item.situacao === 'mau_funcionamento'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        }`}
                    >
                      {item.situacao}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {temCoordenadas(item)
                      ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                      : 'Sem sinal de GPS'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 8. MODAIS DE CRUD (PRESERVADOS E INTEGRADOS) */}
      <EquipamentoModal
        isOpen={isEquipModalOpen}
        onClose={() => {
          setIsEquipModalOpen(false);
          setItemEmEdicao(null);
        }}
        itemEmEdicao={itemEmEdicao}
        onSuccess={carregarDados}
      />

      <AgenteModal
        isOpen={isAgenteModalOpen}
        onClose={() => {
          setIsAgenteModalOpen(false);
          setItemEmEdicao(null);
        }}
        itemEmEdicao={itemEmEdicao}
        onSuccess={carregarDados}
      />

      {/* 9. MODAL DE DESPACHO DE AGENTE */}
      {despachoModal.isOpen && (
        <div className="fixed inset-0 z-[3000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a1018] border border-cyan-900 w-full max-w-md p-6 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_25px_rgba(6,182,212,0.15)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
                  DESPACHAR UNIDADE DE INTERVENÇÃO
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDespachoModal({ isOpen: false, alerta: null });
                  setAgenteSelecionado('');
                }}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {despachoModal.alerta && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/20 p-3 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {despachoModal.alerta.origem}
                  </span>
                  <span className="text-zinc-400">{despachoModal.alerta.tempo}</span>
                </div>
                <p className="text-xs text-zinc-200 font-medium leading-snug">
                  {despachoModal.alerta.titulo}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
                Selecione o Agente Disponível
              </label>
              <select
                value={agenteSelecionado}
                onChange={(e) => setAgenteSelecionado(e.target.value)}
                className="w-full rounded-lg border border-cyan-800/60 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="">Selecione um agente disponível...</option>
                {agentes
                  .filter((ag) => {
                    const sit = (ag.situacao || '').toLowerCase().trim();
                    return sit !== 'inativo' && sit !== 'em ocorrência' && sit !== 'em ocorrencia';
                  })
                  .map((ag) => {
                    const viatura =
                      (ag as any).viatura || `VTR-${String(ag.id).padStart(2, '0')} (Tática)`;
                    return (
                      <option key={ag.id} value={ag.id}>
                        {ag.nome} - {viatura}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setDespachoModal({ isOpen: false, alerta: null });
                  setAgenteSelecionado('');
                }}
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDespachar}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Confirmar Despacho
              </button>
            </div>
          </div>
        </div>
      )}

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
