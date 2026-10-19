import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { io } from 'socket.io-client';
import {
  Search,
  Plus,
  Radio,
  User,
  Video,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Map as MapIcon,
  Edit2,
  Trash2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
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

type Coordenada = { latitude: number; longitude: number };

const temCoordenadas = <T extends { latitude: number | null; longitude: number | null }>(
  item: T,
): item is T & Coordenada =>
  typeof item.latitude === 'number' &&
  Number.isFinite(item.latitude) &&
  typeof item.longitude === 'number' &&
  Number.isFinite(item.longitude);

// Marcador SVG nativo (sem imagens externas)
const criarPin = (cor: string, pulsar = false) =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:32px;height:42px;">
        ${pulsar
        ? `<span style="position:absolute;left:4px;top:4px;width:24px;height:24px;border-radius:50%;background:${cor};opacity:.6;" class="animate-ping"></span>`
        : ''
      }
        <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="position:relative;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));">
          <path d="M16 0C7.2 0 0 7.1 0 15.9 0 27.5 16 42 16 42s16-14.5 16-26.1C32 7.1 24.8 0 16 0z" fill="${cor}" stroke="#fff" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="#fff"/>
        </svg>
      </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });

const ICONE_AZUL = criarPin('#3b82f6');
const ICONE_VERMELHO = criarPin('#ef4444', true);
const ICONE_CINZA = criarPin('#6b7280');
const ICONE_AGENTE = criarPin('#eab308');

const iconePorSituacao = (situacao: string) => {
  switch (situacao.toLowerCase()) {
    case 'mau_funcionamento':
      return ICONE_VERMELHO;
    case 'operacional':
      return ICONE_AZUL;
    default:
      return ICONE_CINZA;
  }
};

// Camada de mapa de calor (leaflet.heat)
function HeatmapLayer({ pontos }: { pontos: any[] }) {
  const map = useMap();

  useEffect(() => {
    const validos = pontos.filter(p => p.latitude && p.longitude);
    if (validos.length === 0) return;
    const coordenadas = validos.map(p => [p.latitude, p.longitude, 1]);
    const heatOptions = {
      radius: 40,
      blur: 20,
      maxZoom: 14,
      max: 1.0,
      gradient: {
        0.4: 'yellow',
        0.8: 'orange',
        1.0: 'red'
      }
    };

    const camada = (L as any).heatLayer(coordenadas, heatOptions);
    camada.addTo(map);

    return () => {
      map.removeLayer(camada);
    };
  }, [map, pontos]);

  return null;
}

const SITUACOES_EQUIPAMENTO = [
  { valor: 'todos', rotulo: 'Todas as Situações' },
  { valor: 'operacional', rotulo: 'Operacional' },
  { valor: 'mau_funcionamento', rotulo: 'Mau Funcionamento' },
  { valor: 'manutencao', rotulo: 'Manutenção' },
  { valor: 'desativado', rotulo: 'Desativado' },
  { valor: 'ainda_nao_instalado', rotulo: 'Não Instalado' },
];

const SITUACOES_AGENTE = [
  { valor: 'todos', rotulo: 'Todas as Situações' },
  { valor: 'ativo', rotulo: 'Ativo' },
  { valor: 'em_patrulha', rotulo: 'Em Patrulha' },
  { valor: 'inativo', rotulo: 'Inativo' },
];

const abrirFeed = (latitude: number, longitude: number) => {
  window.open(
    `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`,
    '_blank',
    'noopener,noreferrer',
  );
};

export default function Dashboard() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'equipamentos' | 'agentes'>('equipamentos');
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [modoHeatmap, setModoHeatmap] = useState(false);
  const [alertasIA, setAlertasIA] = useState<any[]>([]);

  // Modais de CRUD
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [isAgenteModalOpen, setIsAgenteModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<any | null>(null);

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

  const handleExcluir = async (tipo: 'equipamento' | 'agente', id: number) => {
    if (!confirm(`Deseja realmente excluir este ${tipo}?`)) return;

    try {
      const rota = tipo === 'equipamento' ? 'equipamentos' : 'agentes';
      await fetch(`${API_URL}/${rota}/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Erro ao excluir:', err);
    } finally {
      if (tipo === 'equipamento') {
        setEquipamentos((prev) => prev.filter((item) => item.id !== id));
      } else {
        setAgentes((prev) => prev.filter((item) => item.id !== id));
      }
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
      setAlertasIA((atual) => [...atual, alerta]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const trocarAba = (aba: 'equipamentos' | 'agentes') => {
    setAbaAtiva(aba);
    setFiltroSituacao('todos');
    setTermoBusca('');
  };

  // KPIs
  const operacionais = equipamentos.filter((e) => e.situacao.toLowerCase() === 'operacional').length;
  const agentesAtivos = agentes.filter((a) => {
    const sit = a.situacao.toLowerCase();
    return sit !== 'inativo' && sit !== 'folga';
  }).length;

  // Listas filtradas
  const equipamentosFiltrados = equipamentos.filter((item) => {
    const termo = termoBusca.toLowerCase().trim();
    const matchTexto =
      !termo ||
      (item.numeroSerie ?? '').toLowerCase().includes(termo) ||
      String(item.id).includes(termo);
    const matchSit = filtroSituacao === 'todos' || item.situacao.toLowerCase() === filtroSituacao;
    return matchTexto && matchSit;
  });

  const agentesFiltrados = agentes.filter((item) => {
    const termo = termoBusca.toLowerCase().trim();
    const matchTexto =
      !termo ||
      item.nome.toLowerCase().includes(termo) ||
      item.matricula.toLowerCase().includes(termo);
    const matchSit = filtroSituacao === 'todos' || item.situacao.toLowerCase() === filtroSituacao;
    return matchTexto && matchSit;
  });

  // Pontos do heatmap: equipamentos que precisam de atenção + alertas da IA preditiva
  const pontosHeatmap = useMemo<any[]>(
    () => [
      ...equipamentos.filter(
        (eq) => eq.situacao === 'mau_funcionamento' || eq.necessidadeManutencao === 'imediata',
      ),
      ...alertasIA,
    ],
    [equipamentos, alertasIA],
  );

  const classeSituacaoEquip = (situacao: string) => {
    const sit = situacao.toLowerCase();
    if (sit === 'mau_funcionamento')
      return 'bg-red-500/20 text-red-400 border border-red-500/40';
    if (sit === 'operacional') return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
    return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
  };

  const situacoesDisponiveis = abaAtiva === 'equipamentos' ? SITUACOES_EQUIPAMENTO : SITUACOES_AGENTE;

  return (
    <div className="flex h-screen w-full flex-row overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Painel Lateral */}
      <aside
        className={`h-full shrink-0 overflow-y-auto bg-zinc-900 border-r border-zinc-800 transition-all duration-300 ${isSidebarOpen ? 'w-96 p-4' : 'w-0 p-0 border-r-0 overflow-hidden'
          }`}
      >
        {isSidebarOpen && (
          <div className="flex min-h-full flex-col">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
              <h1 className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Central de Operações F.O.G.O.
              </h1>
            </div>

            <button
              onClick={() => {
                setItemEmEdicao(null);
                if (abaAtiva === 'equipamentos') {
                  setIsEquipModalOpen(true);
                } else {
                  setIsAgenteModalOpen(true);
                }
              }}
              className="mb-3.5 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all hover:bg-cyan-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              ADICIONAR NOVO
            </button>

            {/* Abas */}
            <div className="mb-3.5 grid grid-cols-2 gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
              <button
                onClick={() => trocarAba('equipamentos')}
                className={`flex items-center justify-center gap-2 rounded-md py-2 font-mono text-xs font-medium transition-all cursor-pointer ${abaAtiva === 'equipamentos'
                  ? 'border border-cyan-500/30 bg-zinc-800 text-cyan-300'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <Radio className="h-3.5 w-3.5" />
                Equipamentos
              </button>
              <button
                onClick={() => trocarAba('agentes')}
                className={`flex items-center justify-center gap-2 rounded-md py-2 font-mono text-xs font-medium transition-all cursor-pointer ${abaAtiva === 'agentes'
                  ? 'border border-yellow-500/30 bg-zinc-800 text-yellow-300'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <User className="h-3.5 w-3.5" />
                Agentes
              </button>
            </div>

            {/* Filtros */}
            <div className="mb-3.5 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder={
                    abaAtiva === 'equipamentos' ? 'Buscar por serial ou ID...' : 'Buscar por nome ou matrícula...'
                  }
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <select
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {situacoesDisponiveis.map((s) => (
                  <option key={s.valor} value={s.valor}>
                    {s.rotulo}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista */}
            <div className="flex-1 space-y-2.5">
              {abaAtiva === 'equipamentos' ? (
                equipamentosFiltrados.length === 0 ? (
                  <p className="py-8 text-center font-mono text-xs text-zinc-500">
                    Nenhum equipamento encontrado.
                  </p>
                ) : (
                  equipamentosFiltrados.map((item) => {
                    const falha = item.situacao.toLowerCase() === 'mau_funcionamento';
                    return (
                      <div
                        key={item.id}
                        className={`flex gap-3 rounded-lg border p-3 text-xs transition-all ${falha
                          ? 'border-red-500/40 bg-red-950/20'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                          }`}
                      >
                        {item.urlImagem ? (
                          <img
                            src={item.urlImagem}
                            alt={item.numeroSerie ?? `Equipamento ${item.id}`}
                            className="h-12 w-12 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-cyan-400">
                            <Video className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="truncate font-mono font-semibold text-zinc-200">
                              {item.numeroSerie ?? `Equipamento #${item.id}`}
                            </span>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${classeSituacaoEquip(item.situacao)}`}
                            >
                              {item.situacao}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                            <MapPin className="h-3 w-3 text-zinc-500" />
                            {temCoordenadas(item) ? (
                              <span>
                                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                              </span>
                            ) : (
                              <span className="italic text-zinc-500">Sem coordenadas</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : agentesFiltrados.length === 0 ? (
                <p className="py-8 text-center font-mono text-xs text-zinc-500">
                  Nenhum agente encontrado.
                </p>
              ) : (
                agentesFiltrados.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs transition-all hover:border-zinc-700"
                  >
                    {item.urlFoto ? (
                      <img
                        src={item.urlFoto}
                        alt={item.nome}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-yellow-400">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-zinc-200">{item.nome}</span>
                        <span className="shrink-0 rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-yellow-400">
                          {item.situacao}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-400">
                        Matrícula: {item.matricula}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <MapPin className="h-3 w-3 text-zinc-500" />
                        {temCoordenadas(item) ? (
                          <span>
                            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                          </span>
                        ) : (
                          <span className="italic text-zinc-500">Sem sinal GPS</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Área do Mapa */}
      <main className="relative h-full flex-1">
        {/* Botão recolher/exibir sidebar */}
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          title={isSidebarOpen ? 'Recolher painel' : 'Exibir painel'}
          className="absolute left-0 top-4 z-[1000] flex h-9 w-7 items-center justify-center rounded-r-md border border-l-0 border-zinc-700 bg-zinc-900/90 text-zinc-300 shadow-lg backdrop-blur transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer"
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {/* Barra Superior de Indicadores */}
        <div className="absolute left-1/2 top-4 z-[1000] flex -translate-x-1/2 flex-wrap justify-center gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-4 py-2 shadow-2xl backdrop-blur">
            <Radio className="h-5 w-5 text-cyan-400" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Equipamentos</p>
              <p className="font-mono text-base font-bold text-zinc-100">{equipamentos.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-4 py-2 shadow-2xl backdrop-blur">
            <Users className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Agentes</p>
              <p className="font-mono text-base font-bold text-zinc-100">{agentes.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-4 py-2 shadow-2xl backdrop-blur">
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Operacionais</p>
              <p className="font-mono text-base font-bold text-blue-400">{operacionais}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-4 py-2 shadow-2xl backdrop-blur">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Agentes Ativos</p>
              <p className="font-mono text-base font-bold text-emerald-400">{agentesAtivos}</p>
            </div>
          </div>

          <button
            onClick={() => setModoHeatmap((prev) => !prev)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider shadow-2xl backdrop-blur transition-all cursor-pointer ${modoHeatmap
              ? 'border-orange-500/60 bg-orange-500/20 text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.35)]'
              : 'border-zinc-700/60 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800'
              }`}
          >
            {modoHeatmap ? <Flame className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
            {modoHeatmap ? 'Mapa de Calor' : 'Visão Padrão'}
          </button>
        </div>

        <MapContainer center={[-21.9348, -50.5146]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {modoHeatmap && <HeatmapLayer pontos={pontosHeatmap} />}

          {!modoHeatmap &&
            equipamentos.map(
              (e) =>
                temCoordenadas(e) && (
                  <Marker
                    key={`eq-${e.id}`}
                    position={[e.latitude, e.longitude]}
                    icon={iconePorSituacao(e.situacao)}
                  >
                    <Popup>
                      <div className="min-w-[230px] max-w-[290px] p-1 text-zinc-900">
                        <div className="mb-2 border-b pb-1.5">
                          <strong className="text-sm font-semibold">
                            {e.numeroSerie ?? `Equipamento #${e.id}`}
                          </strong>
                        </div>

                        <div className="space-y-1 text-xs text-zinc-700">
                          <div>
                            <span className="font-semibold text-zinc-800">Nº Série: </span>
                            <span className="font-mono">{e.numeroSerie ?? 'Não informado'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-800">Situação: </span>
                            <span
                              className={
                                e.situacao.toLowerCase() === 'mau_funcionamento'
                                  ? 'font-bold text-red-600'
                                  : e.situacao.toLowerCase() === 'operacional'
                                    ? 'font-bold text-blue-600'
                                    : ''
                              }
                            >
                              {e.situacao}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-800">Órgão: </span>
                            <span>{e.orgaoId != null ? `#${e.orgaoId}` : 'Não vinculado'}</span>
                          </div>
                          {e.dataProximaManutencao && (
                            <div>
                              <span className="font-semibold text-zinc-800">Próxima manutenção: </span>
                              <span>{new Date(e.dataProximaManutencao).toLocaleDateString()}</span>
                            </div>
                          )}
                          {e.caracteristicasEspecificas &&
                            Object.keys(e.caracteristicasEspecificas).length > 0 && (
                              <div className="mt-2 border-t border-zinc-200 pt-1">
                                <span className="mb-1 block text-[11px] font-semibold text-zinc-800">
                                  Características:
                                </span>
                                <div className="max-h-20 overflow-y-auto rounded bg-zinc-100 p-1.5 font-mono text-[10px] text-zinc-800">
                                  {Object.entries(e.caracteristicasEspecificas).map(([chave, valor]) => (
                                    <div key={chave} className="truncate">
                                      <strong>{chave}:</strong> {String(valor)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>

                        <button
                          onClick={() => abrirFeed(e.latitude, e.longitude)}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded bg-zinc-900 px-2 py-1.5 text-[11px] font-semibold text-cyan-300 hover:bg-zinc-800 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> Visualizar Feed da Câmera
                        </button>

                        <div className="mt-2 flex items-center justify-end gap-2 border-t border-zinc-200 pt-2">
                          <button
                            onClick={() => {
                              setItemEmEdicao(e);
                              setIsEquipModalOpen(true);
                            }}
                            className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" /> Editar
                          </button>
                          <button
                            onClick={() => handleExcluir('equipamento', e.id)}
                            className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" /> Excluir
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ),
            )}

          {!modoHeatmap &&
            agentes.map(
              (a) =>
                temCoordenadas(a) && (
                  <Marker key={`ag-${a.id}`} position={[a.latitude, a.longitude]} icon={ICONE_AGENTE}>
                    <Popup>
                      <div className="min-w-[200px] max-w-[260px] p-1 text-zinc-900">
                        <div className="mb-2 border-b pb-1.5">
                          <strong className="text-sm font-semibold">{a.nome}</strong>
                        </div>
                        <div className="space-y-1 text-xs text-zinc-700">
                          <div>
                            <span className="font-semibold text-zinc-800">Matrícula: </span>
                            <span className="font-mono">{a.matricula}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-800">Situação: </span>
                            <span>{a.situacao}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-800">Tipo Agente ID: </span>
                            <span className="font-mono">#{a.tipoAgenteId}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2 border-t border-zinc-200 pt-2">
                          <button
                            onClick={() => {
                              setItemEmEdicao(a);
                              setIsAgenteModalOpen(true);
                            }}
                            className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" /> Editar
                          </button>
                          <button
                            onClick={() => handleExcluir('agente', a.id)}
                            className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" /> Excluir
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ),
            )}
        </MapContainer>
      </main>

      {/* Modais de Criação e Edição */}
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
    </div>
  );
}
