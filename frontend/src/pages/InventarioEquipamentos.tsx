import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Plus,
  Landmark,
  MapPin,
  ShieldAlert,
  Cpu,
  Radio,
  Wifi,
  Clock,
  Battery,
  Thermometer,
  FileCode2,
  Activity,
  Edit2,
  Trash2,
  HardDrive,
  PlusSquare,
  Shield,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Copy,
  Check,
  X,
  Camera,
} from 'lucide-react';
import { EquipamentoModal } from '../components/EquipamentoModal';

// Imagens de exemplo ultra-realistas de infraestrutura Smart City / CCO
const LISTA_IMAGENS_EXEMPLO = [
  '/equipamentos/camera_lpr.jpg',
  '/equipamentos/semaforo_smart.jpg',
  '/equipamentos/radar_doppler.jpg',
  '/equipamentos/sensor_iot.jpg',
  '/equipamentos/luminaria_smart.jpg',
];

const obterImagemEquipamento = (item: any, nomeModelo: string): string => {
  if (item.urlImagem && typeof item.urlImagem === 'string' && item.urlImagem.trim() !== '') {
    return item.urlImagem;
  }
  const texto = `${nomeModelo} ${item.tipoEquipamento || ''} ${item.modelo || ''}`.toLowerCase();
  if (texto.includes('cam') || texto.includes('lpr') || texto.includes('ptz') || texto.includes('video') || texto.includes('vigilancia')) {
    return '/equipamentos/camera_lpr.jpg';
  }
  if (texto.includes('semaf') || texto.includes('sinal') || texto.includes('controlad') || texto.includes('cruzamento')) {
    return '/equipamentos/semaforo_smart.jpg';
  }
  if (texto.includes('radar') || texto.includes('veloc') || texto.includes('doppler') || texto.includes('infracao')) {
    return '/equipamentos/radar_doppler.jpg';
  }
  if (texto.includes('sensor') || texto.includes('clima') || texto.includes('estacao') || texto.includes('meteo') || texto.includes('qualidade')) {
    return '/equipamentos/sensor_iot.jpg';
  }
  if (texto.includes('lumin') || texto.includes('poste') || texto.includes('mesh') || texto.includes('luz') || texto.includes('led')) {
    return '/equipamentos/luminaria_smart.jpg';
  }
  return LISTA_IMAGENS_EXEMPLO[Math.abs(Number(item.id) || 0) % LISTA_IMAGENS_EXEMPLO.length];
};

export default function InventarioEquipamentos() {
  const navigate = useNavigate();

  // Estados de dados reais do Backend
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [dadosAuxiliares, setDadosAuxiliares] = useState<{
    orgaos: Array<{ id: number; nome: string; sigla?: string }>;
    modelos: Array<{ id: number; nome: string; fabricante?: string; tipoEquipamento?: string }>;
    tiposLocais: Array<{ id: number; nome: string }>;
  }>({
    orgaos: [],
    modelos: [],
    tiposLocais: [],
  });

  // Estados de filtros
  const [busca, setBusca] = useState('');
  const [filtroOrgao, setFiltroOrgao] = useState('todos');
  const [filtroLocal, setFiltroLocal] = useState('todos');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Modal de Adicionar / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<any>(null);

  // Modal de Telemetria (Raw JSON)
  const [modalTelemetria, setModalTelemetria] = useState<{ isOpen: boolean; dados: any | null }>({
    isOpen: false,
    dados: null,
  });
  const [copiado, setCopiado] = useState(false);

  // Relógio UTC em tempo real
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
        const [resEquip, resAux] = await Promise.all([
          fetch('http://localhost:3000/equipamentos'),
          fetch('http://localhost:3000/auxiliares').catch(() => null),
        ]);

        if (resEquip.ok) {
          const lista = await resEquip.json();
          setEquipamentos(lista || []);
        }

        if (resAux && resAux.ok) {
          const aux = await resAux.json();
          setDadosAuxiliares({
            orgaos: aux.orgaos || [],
            modelos: aux.modelos || [],
            tiposLocais: aux.tiposLocais || [],
          });
        }
      } catch (err) {
        console.error('Erro ao conectar com API de equipamentos:', err);
      }
    };

    carregarDados();
  }, []);

  // Mapas de resolução rápida para chaves estrangeiras
  const orgaosMap = useMemo(() => {
    const map = new Map<number, { nome: string; sigla?: string }>();
    dadosAuxiliares.orgaos.forEach((org) => map.set(org.id, org));
    return map;
  }, [dadosAuxiliares.orgaos]);

  const modelosMap = useMemo(() => {
    const map = new Map<number, { nome: string; fabricante?: string; tipoEquipamento?: string }>();
    dadosAuxiliares.modelos.forEach((mod) => map.set(mod.id, mod));
    return map;
  }, [dadosAuxiliares.modelos]);

  const tiposLocaisMap = useMemo(() => {
    const map = new Map<number, string>();
    dadosAuxiliares.tiposLocais.forEach((tl) => map.set(tl.id, tl.nome));
    return map;
  }, [dadosAuxiliares.tiposLocais]);

  // Filtragem inteligente com suporte ao Soft Delete
  const filtrados = useMemo(() => {
    return equipamentos.filter((item) => {
      const mod = modelosMap.get(item.modeloId);
      const org = orgaosMap.get(item.orgaoId);
      const tipoLoc = tiposLocaisMap.get(item.tipoLocalId);

      const nomeModelo = mod?.nome || item.modelo || 'Equipamento Smart';
      const nomeOrgao = org?.sigla || org?.nome || item.orgao || '';
      const endereco =
        item.logradouro ||
        (item.latitude && item.longitude
          ? `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`
          : 'Tupã - SP');
      const numSerie = item.numeroSerie || `PRM-EQ-${item.id}`;

      const termo = busca.toLowerCase();
      const matchesBusca =
        !busca ||
        numSerie.toLowerCase().includes(termo) ||
        nomeModelo.toLowerCase().includes(termo) ||
        endereco.toLowerCase().includes(termo) ||
        nomeOrgao.toLowerCase().includes(termo);

      const matchesOrgao =
        filtroOrgao === 'todos' ||
        String(item.orgaoId) === filtroOrgao ||
        nomeOrgao === filtroOrgao;

      const matchesLocal =
        filtroLocal === 'todos' ||
        String(item.tipoLocalId) === filtroLocal ||
        tipoLoc === filtroLocal;

      // Regra de Soft Delete:
      // Se 'todos', não exibe itens 'desativado'.
      // Se especificamente 'desativado', exibe apenas eles.
      let matchesSituacao = true;
      if (filtroSituacao === 'todos') {
        matchesSituacao = item.situacao !== 'desativado';
      } else if (filtroSituacao === 'desativado') {
        matchesSituacao = item.situacao === 'desativado';
      } else {
        matchesSituacao = item.situacao === filtroSituacao;
      }

      const matchesTipo =
        filtroTipo === 'todos' ||
        mod?.tipoEquipamento === filtroTipo ||
        (mod?.nome && mod.nome.toLowerCase().includes(filtroTipo.toLowerCase()));

      return matchesBusca && matchesOrgao && matchesLocal && matchesSituacao && matchesTipo;
    });
  }, [
    equipamentos,
    busca,
    filtroOrgao,
    filtroLocal,
    filtroSituacao,
    filtroTipo,
    modelosMap,
    orgaosMap,
    tiposLocaisMap,
  ]);

  // Contadores de KPIs dinâmicos
  const totalGeral = equipamentos.length;
  const totalAtivos = equipamentos.filter((e) => e.situacao === 'operacional').length;
  const totalCriticos = equipamentos.filter((e) => e.situacao === 'critico').length;
  const totalManutencao = equipamentos.filter((e) => e.situacao === 'manutencao').length;

  // Soft Delete no backend e atualização imediata na tela
  const handleExcluir = async (id: number) => {
    if (
      window.confirm(
        'Deseja desativar este equipamento? Ele será movido para o arquivo inativo.',
      )
    ) {
      try {
        const res = await fetch(`http://localhost:3000/equipamentos/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          // Atualiza o estado local para refletir instantaneamente
          setEquipamentos((prev) =>
            prev.map((item) => (item.id === id ? { ...item, situacao: 'desativado' } : item)),
          );
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || 'Erro ao desativar equipamento');
        }
      } catch (err) {
        console.error('Erro na requisição DELETE:', err);
        alert('Erro de comunicação com o servidor ao desativar equipamento.');
      }
    }
  };

  // Exportação CSV de telemetria baseada no array filtrado
  const handleExportarCSV = () => {
    if (filtrados.length === 0) {
      alert('Nenhum equipamento para exportar com os filtros atuais.');
      return;
    }

    const cabecalhos = ['ID', 'Numero de Serie', 'Situacao', 'Latitude', 'Longitude', 'Data Manutencao'];
    const linhas = filtrados.map((item) => {
      const dataManut = item.dataProximaManutencao
        ? new Date(item.dataProximaManutencao).toISOString().split('T')[0]
        : '--';
      return [
        item.id,
        `"${item.numeroSerie || `PRM-EQ-${item.id}`}"`,
        `"${item.situacao || ''}"`,
        item.latitude != null ? item.latitude : '',
        item.longitude != null ? item.longitude : '',
        `"${dataManut}"`,
      ].join(',');
    });

    const csvContent = [cabecalhos.join(','), ...linhas].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'telemetria_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Visualização de telemetria ao vivo com modal Raw JSON
  const handleVerTelemetria = (equip: any) => {
    setModalTelemetria({ isOpen: true, dados: equip });
    setCopiado(false);
  };

  // Função para copiar JSON da telemetria
  const handleCopiarJSON = () => {
    if (modalTelemetria.dados) {
      navigator.clipboard.writeText(JSON.stringify(modalTelemetria.dados, null, 2));
      setCopiado(true);
      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    }
  };

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

            {/* ATIVO: INVENTÁRIO */}
            <button
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-cyan-300 bg-cyan-950/40 border-l-4 border-cyan-400 font-semibold shadow-[inset_0_0_15px_rgba(34,211,238,0.1)] cursor-pointer"
            >
              <HardDrive className="h-4 w-4 text-cyan-400" />
              <span>Inventário de Equipamentos</span>
            </button>

            <button
              onClick={() => navigate('/cadastro-equipamento')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <PlusSquare className="h-4 w-4 text-zinc-400" />
              <span>Cadastro de Equipamento</span>
            </button>

            <button
              onClick={() => navigate('/efetivo-agentes')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <Shield className="h-4 w-4 text-zinc-400" />
              <span>Efetivo de Agentes</span>
            </button>

            <button
              onClick={() => navigate('/inteligencia')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <Cpu className="h-4 w-4 text-zinc-400" />
              <span>Inteligência Preditiva</span>
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

      {/* 2. ÁREA PRINCIPAL DO INVENTÁRIO */}
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
          {/* Cabeçalho do Inventário com Breadcrumb e Título */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider uppercase mb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                GRID.NODE // TEL-77-SUB-BRAVO / EQUIP_SYS_REGISTRY
              </div>
              <h2 className="text-xl md:text-2xl font-mono font-bold text-white tracking-tight">
                INVENTÁRIO GERAL DE EQUIPAMENTOS IoT & SENSORES
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                Gerenciamento de malha urbana, histórico de manutenção e saúde dos nós operacionais integrados ao CCO.
              </p>
            </div>

            {/* Badges de KPIs */}
            <div className="flex items-center gap-4 bg-[#0a1018] border border-zinc-800/80 rounded-xl px-4 py-2.5 shadow-lg shrink-0">
              <div>
                <div className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Nós Ativos</div>
                <div className="text-sm font-mono font-bold text-cyan-400">
                  {totalAtivos.toLocaleString('pt-BR')}{' '}
                  <span className="text-xs font-normal text-zinc-500">
                    / {totalGeral.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-zinc-800"></div>

              <div>
                <div className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Críticos</div>
                <div className="text-sm font-mono font-bold text-red-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  {totalCriticos}
                </div>
              </div>

              <div className="h-6 w-px bg-zinc-800"></div>

              <div>
                <div className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Manutenção</div>
                <div className="text-sm font-mono font-bold text-amber-400">{totalManutencao}</div>
              </div>
            </div>
          </div>

          {/* Barra de Ferramentas: Busca + Botões de Ação */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Input de Busca */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por Nº de Série, Modelo ou Endereço..."
                className="w-full rounded-lg border border-zinc-800 bg-[#0a1018] py-2.5 pl-10 pr-20 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none font-mono transition-all"
              />
              <span className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-[10px] font-mono text-zinc-400">
                CTRL + K
              </span>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={handleExportarCSV}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-[#0a1018] text-xs font-mono text-zinc-300 hover:text-white hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Exportar Telemetria (CSV/JSON)</span>
              </button>

              <button
                onClick={() => navigate('/cadastro-equipamento')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-mono font-bold tracking-wider transition-all shadow-[0_0_16px_rgba(34,211,238,0.4)] cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>+ Novo Equipamento</span>
              </button>
            </div>
          </div>

          {/* Linha com 4 Selects de Filtros Nativos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Órgão Responsável */}
            <div className="relative">
              <div className="absolute left-3 top-3 pointer-events-none text-zinc-500">
                <Landmark className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <select
                value={filtroOrgao}
                onChange={(e) => setFiltroOrgao(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-800 bg-[#0a1018] py-2.5 pl-9 pr-8 text-xs text-zinc-300 font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos os Órgãos</option>
                {dadosAuxiliares.orgaos.length > 0 ? (
                  dadosAuxiliares.orgaos.map((org) => (
                    <option key={org.id} value={String(org.id)}>
                      {org.nome} {org.sigla ? `(${org.sigla})` : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="CET São Paulo">CET São Paulo</option>
                    <option value="Polícia Militar / COPOM">Polícia Militar / COPOM</option>
                    <option value="Defesa Civil">Defesa Civil</option>
                    <option value="Guarda Municipal">Guarda Municipal</option>
                    <option value="Iluminação Pública">Iluminação Pública</option>
                  </>
                )}
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500 text-[10px]">
                ▼
              </div>
            </div>

            {/* 2. Tipo de Local */}
            <div className="relative">
              <div className="absolute left-3 top-3 pointer-events-none text-zinc-500">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <select
                value={filtroLocal}
                onChange={(e) => setFiltroLocal(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-800 bg-[#0a1018] py-2.5 pl-9 pr-8 text-xs text-zinc-300 font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos os Locais</option>
                {dadosAuxiliares.tiposLocais.length > 0 ? (
                  dadosAuxiliares.tiposLocais.map((tl) => (
                    <option key={tl.id} value={String(tl.id)}>
                      {tl.nome}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Via Arterial">Via Arterial</option>
                    <option value="Cruzamento Semafórico">Cruzamento Semafórico</option>
                    <option value="Túnel / Passagem">Túnel / Passagem</option>
                    <option value="Ponto Crítico de Alagamento">Ponto Crítico de Alagamento</option>
                    <option value="Praça / Espaço Público">Praça / Espaço Público</option>
                  </>
                )}
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500 text-[10px]">
                ▼
              </div>
            </div>

            {/* 3. Situação Operacional */}
            <div className="relative">
              <div className="absolute left-3 top-3 pointer-events-none text-zinc-500">
                <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <select
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-800 bg-[#0a1018] py-2.5 pl-9 pr-8 text-xs text-zinc-300 font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todas as Situações</option>
                <option value="operacional">Operacional</option>
                <option value="manutencao">Manutenção Agendada</option>
                <option value="critico">Falha Crítica</option>
                <option value="desconectado">Desconectado</option>
                <option value="desativado">Inativos / Desativados</option>
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500 text-[10px]">
                ▼
              </div>
            </div>

            {/* 4. Tipo de Equipamento */}
            <div className="relative">
              <div className="absolute left-3 top-3 pointer-events-none text-zinc-500">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-800 bg-[#0a1018] py-2.5 pl-9 pr-8 text-xs text-zinc-300 font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos os Modelos</option>
                <option value="camera">Câmeras LPR & PTZ</option>
                <option value="semaforo">Controladores Semafóricos</option>
                <option value="radar">Radares Micro-Doppler</option>
                <option value="sensor">Estações Meteorológicas</option>
                <option value="luminaria">Luminárias Smart Mesh</option>
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Metadados da Grade de Resultados */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-800/60 pt-3">
            <div>GRID ATIVO: SÃO PAULO - REGIONAL METROPOLITANA | SYNC TAXA: 1.000 Hz</div>
            <div className="text-zinc-400 font-bold uppercase tracking-wider">
              ORDENAÇÃO: <span className="text-cyan-400">URGÊNCIA DE TELEMETRIA</span>
            </div>
          </div>

          {/* Grid de Cards dos Equipamentos Reais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {filtrados.map((item) => {
              const isCritico = item.situacao === 'critico';
              const isManutencao = item.situacao === 'manutencao';
              const isDesconectado = item.situacao === 'desconectado';
              const isDesativado = item.situacao === 'desativado';

              const mod = modelosMap.get(item.modeloId);
              const org = orgaosMap.get(item.orgaoId);
              const nomeModelo = mod?.nome || item.modelo || 'Equipamento Smart CCO';
              const nomeOrgao = org?.sigla || org?.nome || item.orgao || 'Prefeitura Municipal';
              const endereco =
                item.logradouro ||
                (item.latitude && item.longitude
                  ? `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`
                  : 'Setor Operacional Tupã');
              const ipTexto =
                item.caracteristicasEspecificas?.ip ||
                `10.14.${(item.id * 17) % 250}.${item.id + 10}`;
              const imagemSrc = obterImagemEquipamento(item, nomeModelo);
              const hasCustomImg = Boolean(
                item.urlImagem && typeof item.urlImagem === 'string' && item.urlImagem.trim() !== '',
              );

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-xl border bg-[#0a1018]/95 backdrop-blur-md overflow-hidden transition-all duration-200 ${
                    isDesativado
                      ? 'border-zinc-800/60 opacity-60'
                      : isCritico
                        ? 'border-red-600/50 hover:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                        : isManutencao
                          ? 'border-amber-600/40 hover:border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                          : isDesconectado
                            ? 'border-zinc-800 hover:border-zinc-700 opacity-85'
                            : 'border-zinc-800/90 hover:border-cyan-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                  }`}
                >
                  {/* Cabeçalho do Card */}
                  <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/40">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span className="font-mono text-xs font-bold tracking-wider text-cyan-300">
                        {item.numeroSerie || `PRM-EQ-${item.id}`}
                      </span>
                    </div>

                    {/* Badge de Situação com suporte a 'desativado' */}
                    <div>
                      {isDesativado ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                          INATIVO / DESATIVADO
                        </span>
                      ) : isCritico ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-red-950/80 text-red-400 border border-red-600/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                          FALHA CRÍTICA
                        </span>
                      ) : isManutencao ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-amber-950/60 text-amber-400 border border-amber-600/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          MANUTENÇÃO
                        </span>
                      ) : isDesconectado ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-zinc-900 text-zinc-400 border border-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                          DESCONECTADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-cyan-950/70 text-cyan-400 border border-cyan-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          OPERACIONAL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail / Visor Noturno */}
                  <div className="relative h-40 w-full bg-[#0a0e14] overflow-hidden border-b border-zinc-800/50 group">
                    {/* Fallback de erro ativado caso a imagem falhe ao carregar */}
                    <div className="hidden [.fallback-active_&]:flex absolute inset-0 flex-col items-center justify-center overflow-hidden z-0">
                      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                      <Camera className="h-8 w-8 text-zinc-700 mb-2 relative z-10" />
                      <span className="text-[9px] font-mono text-zinc-600 relative z-10 uppercase tracking-widest">
                        Sem Sinal de Telemetria
                      </span>
                    </div>

                    <img
                      src={imagemSrc}
                      alt={item.numeroSerie || nomeModelo}
                      className="h-40 w-full object-cover opacity-75 mix-blend-luminosity filter contrast-125 transition-transform duration-500 group-hover:scale-105 border-b border-zinc-800/50 relative z-10"
                      onError={(e) => {
                        // Se a imagem falhar ao carregar, esconde a img e mostra o fallback pai
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('fallback-active');
                      }}
                    />

                    {/* Gradiente tático e Scanlines sobre a imagem */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a1018] via-transparent to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-10" />

                    {/* Tag de identificação de telemetria */}
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950/85 border border-cyan-800/60 text-[8px] font-mono tracking-wider backdrop-blur-md pointer-events-none shadow-md">
                      <span className={`w-1.5 h-1.5 rounded-full ${hasCustomImg ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`}></span>
                      <span className={hasCustomImg ? 'text-emerald-300 font-bold' : 'text-cyan-300 font-bold'}>
                        {hasCustomImg ? 'FEED ATIVO' : 'TELEMETRIA IA'}
                      </span>
                    </div>

                    {/* Localização & IP no Rodapé da Imagem */}
                    <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-zinc-300 z-20 pointer-events-none">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{endereco}</span>
                      </span>
                      <span className="text-zinc-500 shrink-0 ml-1">IP: {ipTexto}</span>
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-3.5 space-y-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold text-white leading-tight">{nomeModelo}</h3>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-900/60 shrink-0">
                        {nomeOrgao}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.caracteristicasEspecificas?.descricao ||
                        `Nó de monitoramento integrado. Status operacional: ${item.situacao}. Revisão periódica ${item.necessidadeManutencao || 'preditiva'}.`}
                    </p>

                    {/* Grade de Telemetria (2x2) */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 font-mono text-[10px]">
                      <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2 py-1.5 rounded border border-zinc-800/70">
                        <Battery className="h-3.5 w-3.5 text-cyan-400" />
                        <div>
                          <span className="text-zinc-500 uppercase text-[8px] block leading-none">
                            Bateria
                          </span>
                          <span className="font-bold text-white">
                            {90 + (item.id % 10)}%{' '}
                            <span className="text-[8px] font-normal text-zinc-400">AC/SOL</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2 py-1.5 rounded border border-zinc-800/70">
                        <Wifi className="h-3.5 w-3.5 text-zinc-400" />
                        <div>
                          <span className="text-zinc-500 uppercase text-[8px] block leading-none">
                            Rede
                          </span>
                          <span className="font-bold text-white">
                            {-60 - (item.id % 30)} dBm{' '}
                            <span className="text-[8px] font-normal text-zinc-400">5G-SA</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2 py-1.5 rounded border border-zinc-800/70">
                        <Thermometer className="h-3.5 w-3.5 text-zinc-400" />
                        <div>
                          <span className="text-zinc-500 uppercase text-[8px] block leading-none">
                            Temp.
                          </span>
                          <span className="font-bold text-white">{(34 + (item.id % 8)).toFixed(1)}°C</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2 py-1.5 rounded border border-zinc-800/70">
                        <FileCode2 className="h-3.5 w-3.5 text-zinc-400" />
                        <div>
                          <span className="text-zinc-500 uppercase text-[8px] block leading-none">
                            Firmware
                          </span>
                          <span className="font-bold text-zinc-300">v3.{(item.id % 4) + 1}.2</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ações no Rodapé do Card */}
                  <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/50 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleVerTelemetria(item)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all cursor-pointer truncate ${
                        isCritico
                          ? 'border border-red-800 bg-red-950/50 text-red-300 hover:bg-red-900/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          : isDesconectado
                            ? 'border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                            : isDesativado
                              ? 'border border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                              : 'border border-cyan-900/60 bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                      }`}
                    >
                      <Activity className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">Telemetria</span>
                    </button>

                    {/* Botão Editar: Navega para /cadastro-equipamento/:id */}
                    <button
                      onClick={() => navigate(`/cadastro-equipamento/${item.id}`)}
                      className="p-1.5 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-cyan-500/60 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
                      title="Editar Equipamento"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Editar</span>
                    </button>

                    {/* Botão Desativar: Soft Delete com confirmação */}
                    {!isDesativado ? (
                      <button
                        onClick={() => handleExcluir(item.id)}
                        className="p-1.5 px-2.5 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
                        title="Desativar Equipamento"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Desativar</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="p-1.5 px-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50 flex items-center gap-1 text-xs font-mono"
                        title="Equipamento já desativado"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Desativado</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filtrados.length === 0 && (
            <div className="py-16 text-center text-zinc-500 font-mono">
              Nenhum equipamento localizado com os filtros aplicados.
            </div>
          )}
        </div>

        {/* 3. BARRA DE PAGINAÇÃO NO RODAPÉ */}
        <footer className="px-6 py-3 border-t border-zinc-800/80 bg-[#090e16] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>
              STATUS DO REGISTRO: <span className="text-zinc-300 font-bold">EXIBINDO {filtrados.length} DE {totalGeral.toLocaleString('pt-BR')} NÓS</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span>RESPOSTA: <span className="text-cyan-400">42ms</span></span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <button className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer">
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer">
              <ChevronLeft className="h-3.5 w-3.5" />
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
            <span className="px-1 text-zinc-600">...</span>
            <button className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 cursor-pointer">
              247
            </button>
            <button className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer">
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </footer>
      </main>

      {/* Modal CRUD Integrado */}
      <EquipamentoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setItemEmEdicao(null);
        }}
        itemEmEdicao={itemEmEdicao}
        onSuccess={() => {
          alert('Equipamento salvo com sucesso no banco de dados!');
        }}
      />

      {/* Modal de Telemetria (Raw JSON) */}
      {modalTelemetria.isOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1018] border border-cyan-900/60 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <h3 className="font-mono font-bold text-sm tracking-wider text-cyan-400 uppercase">
                  TELEMETRIA RAW (JSON)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalTelemetria({ isOpen: false, dados: null })}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo (Scrollable) */}
            <div className="p-6 overflow-auto flex-1">
              <pre className="bg-zinc-950 p-4 rounded border border-zinc-800 text-cyan-300 font-mono text-xs overflow-auto leading-relaxed">
                <code>{JSON.stringify(modalTelemetria.dados, null, 2)}</code>
              </pre>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-950/40">
              <button
                type="button"
                onClick={handleCopiarJSON}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                  copiado
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                }`}
              >
                {copiado ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar Payload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
