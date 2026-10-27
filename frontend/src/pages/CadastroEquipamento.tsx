import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  Radio,
  HardDrive,
  PlusSquare,
  Shield,
  Cpu,
  Wifi,
  Clock,
  RotateCw,
  MapPin,
  Save,
  CheckCircle2,
  Navigation,
  Check,
} from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Ícone ciano tático para o cursor no mapa
const ICONE_PIN_CYBER = L.divIcon({
  className: 'pin-cyber-tactical',
  html: `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <span style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(34, 211, 238, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <span style="position: absolute; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #22d3ee; background: rgba(6, 182, 212, 0.5); box-shadow: 0 0 12px #22d3ee;"></span>
      <span style="position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Subcomponente de clique no Leaflet
function SeletorCoordenadas({
  onSelect,
}: {
  onSelect: (coords: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      });
    },
  });
  return null;
}

export default function CadastroEquipamento() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  // Dados auxiliares do banco de dados
  const [dadosAuxiliares, setDadosAuxiliares] = useState<{
    orgaos: Array<{ id: number; nome: string; sigla?: string }>;
    modelos: Array<{ id: number; nome: string; fabricante?: string; tipoEquipamento?: string }>;
    tiposLocais: Array<{ id: number; nome: string }>;
  }>({
    orgaos: [],
    modelos: [],
    tiposLocais: [],
  });

  // 1. Estados do Formulário
  const [formData, setFormData] = useState({
    numeroSerie: '',
    orgaoId: '1',
    tipoLocalId: '1',
    categoria: 'camera_ia',
    modeloId: '1',
    protocolo: 'lorawan',
    situacao: 'operacional',
    necessidadeManutencao: 'preditiva',
    prioridade: 'critico_1',
    dataInstalacao: '',
    dataProximaManutencao: '',
    equipeTecnica: 'equipe_alpha',
  });

  // 2. Coordenadas do mapa (inicial em Tupã-SP)
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number }>({
    lat: -21.9348,
    lng: -50.5146,
  });

  // Estados de feedback de submissão
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  // Cálculo automático de próxima manutenção para 6 meses à frente da instalação
  useEffect(() => {
    if (formData.dataInstalacao && !formData.dataProximaManutencao) {
      const dataInst = new Date(formData.dataInstalacao);
      if (!isNaN(dataInst.getTime())) {
        const data6Meses = new Date(dataInst);
        data6Meses.setMonth(data6Meses.getMonth() + 6);
        setFormData((prev) => ({
          ...prev,
          dataProximaManutencao: data6Meses.toISOString().split('T')[0],
        }));
      }
    }
  }, [formData.dataInstalacao, formData.dataProximaManutencao]);

  // Efeito Duplo:
  // a) Buscar dados auxiliares reais do banco (/auxiliares)
  useEffect(() => {
    const carregarAuxiliares = async () => {
      try {
        const res = await fetch('http://localhost:3000/auxiliares');
        if (res.ok) {
          const data = await res.json();
          setDadosAuxiliares({
            orgaos: data.orgaos || [],
            modelos: data.modelos || [],
            tiposLocais: data.tiposLocais || [],
          });
          // Se for novo cadastro e houver opções, seleciona o primeiro
          if (!id) {
            setFormData((prev) => ({
              ...prev,
              orgaoId: data.orgaos?.[0] ? String(data.orgaos[0].id) : prev.orgaoId,
              modeloId: data.modelos?.[0] ? String(data.modelos[0].id) : prev.modeloId,
              tipoLocalId: data.tiposLocais?.[0] ? String(data.tiposLocais[0].id) : prev.tipoLocalId,
            }));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados auxiliares:', err);
      }
    };
    carregarAuxiliares();
  }, [id]);

  // b) Se existir id vindo do useParams(), buscar equipamento para edição
  useEffect(() => {
    if (!id) return;
    const carregarEquipamento = async () => {
      try {
        const res = await fetch(`http://localhost:3000/equipamentos/${id}`);
        if (res.ok) {
          const item = await res.json();
          if (item) {
            setFormData((prev) => ({
              ...prev,
              numeroSerie: item.numeroSerie || '',
              orgaoId: item.orgaoId ? String(item.orgaoId) : prev.orgaoId,
              modeloId: item.modeloId ? String(item.modeloId) : prev.modeloId,
              tipoLocalId: item.tipoLocalId ? String(item.tipoLocalId) : prev.tipoLocalId,
              situacao: item.situacao || 'operacional',
              necessidadeManutencao: item.necessidadeManutencao || 'preditiva',
              dataInstalacao: item.dataInstalacao
                ? new Date(item.dataInstalacao).toISOString().split('T')[0]
                : item.criadoEm
                  ? new Date(item.criadoEm).toISOString().split('T')[0]
                  : '',
              dataProximaManutencao: item.dataProximaManutencao
                ? new Date(item.dataProximaManutencao).toISOString().split('T')[0]
                : '',
            }));

            if (item.latitude != null && item.longitude != null) {
              setCoordenadas({
                lat: Number(item.latitude),
                lng: Number(item.longitude),
              });
            }
          }
        } else {
          setErro(`Não foi possível carregar o equipamento ID #${id}`);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do equipamento:', err);
        setErro('Falha na conexão ao buscar equipamento');
      }
    };
    carregarEquipamento();
  }, [id]);

  // Função Geradora de ID Cyber
  const gerarNumeroSerie = () => {
    const novoSerial = `PRM-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
    setFormData((prev) => ({
      ...prev,
      numeroSerie: novoSerial,
    }));
  };

  // Se não houver ID na URL (novo cadastro), inicializa com ID aleatório gerado
  useEffect(() => {
    if (!id) {
      gerarNumeroSerie();
    }
  }, [id]);

  // Handler de mudança nos campos
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submissão Inteligente do Formulário (POST ou PUT)
  const handleSalvar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSalvando(true);
    setErro(null);

    const payload = {
      numeroSerie: formData.numeroSerie.trim(),
      situacao: formData.situacao,
      latitude: coordenadas.lat,
      longitude: coordenadas.lng,
      orgaoId: parseInt(formData.orgaoId, 10) || null,
      tipoLocalId: parseInt(formData.tipoLocalId, 10) || 1,
      modeloId: parseInt(formData.modeloId, 10) || 1,
      bairroId: 1,
      necessidadeManutencao: formData.necessidadeManutencao,
      dataInstalacao: formData.dataInstalacao
        ? new Date(formData.dataInstalacao)
        : null,
      dataProximaManutencao: formData.dataProximaManutencao
        ? new Date(formData.dataProximaManutencao)
        : null,
    };

    try {
      const url = id
        ? `http://localhost:3000/equipamentos/${id}`
        : 'http://localhost:3000/equipamentos';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro HTTP ${res.status}`);
      }

      setSucesso(true);
      setTimeout(() => {
        navigate('/inventario');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Erro ao persistir equipamento na API.');
    } finally {
      setSalvando(false);
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

            <button
              onClick={() => navigate('/inventario')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <HardDrive className="h-4 w-4 text-zinc-400" />
              <span>Inventário de Equipamentos</span>
            </button>

            {/* ATIVO: CADASTRO */}
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-cyan-300 bg-cyan-950/40 border-l-4 border-cyan-400 font-semibold shadow-[inset_0_0_15px_rgba(34,211,238,0.1)] cursor-pointer">
              <PlusSquare className="h-4 w-4 text-cyan-400" />
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

      {/* 2. ÁREA PRINCIPAL DO CADASTRO */}
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

        {/* Formulário com Scroll Vertical */}
        <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Cabeçalho da Página e Badges */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider uppercase mb-1 flex items-center gap-2">
                <span>INVENTÁRIO</span>
                <span className="text-zinc-600">/</span>
                <span>{id ? `EDIÇÃO DE NÓ #${id}` : 'CADASTRO DE NÓ IOT'}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-cyan-300">PROT-REG-42</span>
              </div>
              <h2 className="text-xl md:text-2xl font-mono font-bold text-white tracking-tight">
                {id ? `Edição de Equipamento Urbano #${id}` : 'Novo Registro de Equipamento Urbano'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Identificação, Hardware e Alocação Geográfica de sensores e atuadores na malha inteligente.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a1018] border border-zinc-800 text-xs font-mono">
                <span className={`w-2 h-2 rounded-full ${id ? 'bg-cyan-400' : 'bg-amber-400'} animate-pulse`}></span>
                <span className={`${id ? 'text-cyan-300' : 'text-amber-300'} font-bold uppercase text-[10px]`}>
                  {id ? 'Modo de Edição Ativo' : 'Rascunho Não Sincronizado'}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a1018] border border-cyan-900/60 text-xs font-mono text-cyan-400">
                <Radio className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold">GATEWAY: SP-CENTRO-01</span>
              </div>
            </div>
          </div>

          {/* Grid Principal Dividido: 8 colunas (Formulário) e 4 colunas (Alocação Geográfica) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUNA ESQUERDA: FORMULÁRIO (8 COLUNAS) */}
            <div className="lg:col-span-8 space-y-6">
              {/* BLOCO 01: Identificação e Hardware */}
              <div className="rounded-xl border border-zinc-800 bg-[#0a1018]/95 p-6 shadow-xl relative backdrop-blur-md">
                {/* Header do Bloco 01 */}
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-400 font-mono text-xs font-bold">
                      01
                    </span>
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                        Identificação e Hardware
                      </h3>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        CLASSIFICAÇÃO DE ATIVO OPERACIONAL
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-cyan-400">
                    HW-REV-V4.2
                  </span>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  {/* Linha 1: Órgão Responsável e Tipo de Local */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 uppercase text-[10px] font-bold">
                          Órgão Responsável
                        </label>
                        <span className="text-[9px] text-cyan-400 font-bold">*REQ</span>
                      </div>
                      <select
                        name="orgaoId"
                        value={formData.orgaoId}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      >
                        {dadosAuxiliares.orgaos.length > 0 ? (
                          dadosAuxiliares.orgaos.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.nome} {org.sigla ? `(${org.sigla})` : ''}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="3">Defesa Civil Municipal</option>
                            <option value="1">CET São Paulo</option>
                            <option value="2">Polícia Militar / COPOM</option>
                            <option value="4">Guarda Civil Metropolitana</option>
                            <option value="5">Iluminação Pública & Smart City</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 uppercase text-[10px] font-bold">
                          Tipo de Local / Instalação
                        </label>
                        <span className="text-[9px] text-cyan-400 font-bold">*REQ</span>
                      </div>
                      <select
                        name="tipoLocalId"
                        value={formData.tipoLocalId}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      >
                        {dadosAuxiliares.tiposLocais.length > 0 ? (
                          dadosAuxiliares.tiposLocais.map((tl) => (
                            <option key={tl.id} value={tl.id}>
                              {tl.nome}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="1">Via Arterial</option>
                            <option value="2">Cruzamento Semafórico</option>
                            <option value="3">Túnel / Passagem</option>
                            <option value="4">Ponto Crítico de Alagamento</option>
                            <option value="5">Praça / Espaço Público</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Linha 2: Fabricante & Modelo Certificado */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-zinc-400 uppercase text-[10px] font-bold">
                        Fabricante & Modelo Certificado
                      </label>
                      <span className="text-[9px] text-zinc-500">CERT. ANATEL / DEFCON</span>
                    </div>
                    <select
                      name="modeloId"
                      value={formData.modeloId}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      {dadosAuxiliares.modelos.length > 0 ? (
                        dadosAuxiliares.modelos.map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.nome} {mod.fabricante ? `- ${mod.fabricante}` : ''}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="1">SpectraTech CyberNode 900 Ultra-Range</option>
                          <option value="2">Flir-Optics Tactical Vision v4</option>
                          <option value="3">Siemens Sitraffic CCO-900</option>
                          <option value="4">Vaisala RoadSense Multi-Hazard</option>
                          <option value="5">Telensa UrbanMesh Pro 7-Pin</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Linha 3: Identificador Único (UID) e Protocolo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 uppercase text-[10px] font-bold">
                          Identificador Único (UID / GUID)
                        </label>
                        <span className="text-[9px] text-cyan-400 font-bold">SISTEMA F.O.G.O.</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          name="numeroSerie"
                          value={formData.numeroSerie || ''}
                          onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                          placeholder="Ex: PRM-2026-ABCD-1234"
                          className="w-full rounded-lg border border-cyan-800/60 bg-zinc-950 py-2.5 pl-3 pr-10 text-cyan-300 font-mono font-bold tracking-wider focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]"
                        />
                        <button
                          type="button"
                          onClick={gerarNumeroSerie}
                          title="Gerar novo identificador aleatório"
                          className="absolute right-2.5 text-zinc-500 hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 uppercase text-[10px] font-bold">
                          Protocolo de Conexão
                        </label>
                        <span className="text-[9px] text-cyan-400 font-bold">*REQ</span>
                      </div>
                      <select
                        name="protocolo"
                        value={formData.protocolo}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      >
                        <option value="lorawan">LoRaWAN 915MHz Tático</option>
                        <option value="5g_sa">5G Standalone Militar CCO</option>
                        <option value="satelite">SAT DirectLink Baixa Órbita</option>
                        <option value="fibra">Fibra Óptica GPON Dedicada</option>
                      </select>
                    </div>
                  </div>

                  {/* Linha 4: Situação Inicial */}
                  <div>
                    <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1.5">
                      Situação Operacional Inicial
                    </label>
                    <select
                      name="situacao"
                      value={formData.situacao}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="operacional">Operacional (Ativo & Homologado)</option>
                      <option value="manutencao">Manutenção Agendada</option>
                      <option value="mau_funcionamento">Em Análise / Calibração</option>
                      <option value="desativado">Desativado / Em Estoque CCO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BLOCO 02: Protocolo de Manutenção & Ciclo de Vida */}
              <div className="rounded-xl border border-zinc-800 bg-[#0a1018]/95 p-6 shadow-xl relative backdrop-blur-md">
                {/* Header do Bloco 02 */}
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded bg-amber-950 border border-amber-500/50 text-amber-400 font-mono text-xs font-bold">
                      02
                    </span>
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                        Protocolo de Manutenção & Ciclo de Vida
                      </h3>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        CRONOGRAMA SLA E EQUIPES DE PRONTIDÃO
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-amber-400">
                    MTBF 48.000h
                  </span>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  {/* Linha 1: Periodicidade e Prioridade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1.5">
                        Periodicidade de Revisão
                      </label>
                      <select
                        name="necessidadeManutencao"
                        value={formData.necessidadeManutencao}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      >
                        <option value="preditiva">Preditiva por IA & Telemetria</option>
                        <option value="mensal">Mensal Preventiva</option>
                        <option value="trimestral">Trimestral Corretiva</option>
                        <option value="anual">Inspeção Geral Anual</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 uppercase text-[10px] font-bold">
                          Prioridade Operacional
                        </label>
                        <span className="text-[9px] text-amber-400 font-bold">DEFCON LINK</span>
                      </div>
                      <select
                        name="prioridade"
                        value={formData.prioridade}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      >
                        <option value="critico_1">Crítico Nível 1 - Operação 24/7 Redundante</option>
                        <option value="alto_2">Nível 2 - Alta Disponibilidade</option>
                        <option value="padrao_3">Nível 3 - Padrão Urbano</option>
                      </select>
                    </div>
                  </div>

                  {/* Linha 2: Datas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1.5">
                        Data de Instalação em Campo
                      </label>
                      <input
                        type="date"
                        name="dataInstalacao"
                        value={formData.dataInstalacao || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, dataInstalacao: e.target.value })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none scheme-dark"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 uppercase text-[10px] font-bold">
                          Próxima Inspeção Preventiva
                        </label>
                        <span className="text-[9px] text-cyan-400 font-bold">IA CALCULADA</span>
                      </div>
                      <input
                        type="date"
                        name="dataProximaManutencao"
                        value={formData.dataProximaManutencao || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, dataProximaManutencao: e.target.value })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-cyan-300 font-bold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none scheme-dark"
                      />
                    </div>
                  </div>

                  {/* Linha 3: Equipe Técnica */}
                  <div>
                    <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1.5">
                      Equipe Técnica Responsável Designada
                    </label>
                    <select
                      name="equipeTecnica"
                      value={formData.equipeTecnica}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="equipe_alpha">
                        Equipe Alpha - Tática Rápida (Subprefeitura Sé / Paulista)
                      </option>
                      <option value="equipe_bravo">
                        Equipe Bravo - Engenharia Semafórica Central
                      </option>
                      <option value="equipe_charlie">
                        Equipe Charlie - Radares & OCR Noturno
                      </option>
                      <option value="equipe_delta">
                        Equipe Delta - Meteorologia & Defesa Civil
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: ALOCAÇÃO GEOGRÁFICA (4 COLUNAS) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-xl border border-cyan-900/40 bg-[#0a1018]/95 p-5 shadow-2xl backdrop-blur-md">
                {/* Header do Bloco do Mapa */}
                <div className="flex items-start justify-between border-b border-zinc-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                        Alocação Geográfica
                      </h3>
                      <p className="text-[9px] font-mono text-zinc-500 uppercase">
                        PERÍMETRO E FEIXE DE COBERTURA
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-[9px] font-mono text-cyan-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    GNSS RTK
                  </span>
                </div>

                {/* Mensagem instrucional */}
                <div className="mb-3 flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-900/60 p-2 rounded-lg leading-tight">
                  <Navigation className="h-4 w-4 shrink-0 text-cyan-400 animate-pulse" />
                  <span>Clique no mapa para redefinir as coordenadas exatas do nó em tempo real</span>
                </div>

                {/* Mapa Interativo */}
                <div className="relative h-80 w-full rounded-xl overflow-hidden border border-zinc-800">
                  {/* Badges superiores sobre o mapa */}
                  <div className="absolute top-2 left-2 z-[1000] pointer-events-none">
                    <span className="px-2 py-0.5 rounded bg-[#0a1018]/90 border border-zinc-800 text-[9px] font-mono text-cyan-400 font-bold shadow-md">
                      RAIO: 500M (R-500)
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 z-[1000] pointer-events-none">
                    <span className="px-2 py-0.5 rounded bg-[#0a1018]/90 border border-zinc-800 text-[9px] font-mono text-white font-bold shadow-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      HDOP: 0.82 (PRECISO)
                    </span>
                  </div>

                  {/* Leaflet MapContainer */}
                  <MapContainer
                    center={[coordenadas.lat, coordenadas.lng]}
                    zoom={15}
                    zoomControl={false}
                    style={{ height: '100%', width: '100%', background: '#090d12' }}
                  >
                    <TileLayer
                      key="cadastro-osm-tiles"
                      className="mapa-cyberpunk"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Captura de clique para redefinir coordenadas */}
                    <SeletorCoordenadas onSelect={setCoordenadas} />

                    {/* Marcador na posição */}
                    <Marker position={[coordenadas.lat, coordenadas.lng]} icon={ICONE_PIN_CYBER} />
                  </MapContainer>

                  {/* Barra inferior sobre o mapa */}
                  <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-[#0a1018]/90 border-t border-zinc-800 px-3 py-1 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                    <span>SATS: 14 GPS/GLONASS</span>
                    <span className="text-cyan-400 font-bold">FIX: 3D DGPS</span>
                  </div>
                </div>

                {/* Displays Digitais de Telemetria Georreferenciada */}
                <div className="mt-4 pt-3 border-t border-zinc-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase font-bold">
                    <span>Telemetria Georreferenciada</span>
                    <span className="text-cyan-400">Lock Automático</span>
                  </div>

                  {/* 2x2 Grid de Displays Digitais */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 uppercase block">Latitude</span>
                      <input
                        type="text"
                        readOnly
                        value={coordenadas.lat.toFixed(6)}
                        className="w-full bg-transparent font-bold text-white text-xs outline-none cursor-default font-mono mt-0.5"
                      />
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 uppercase block">Longitude</span>
                      <input
                        type="text"
                        readOnly
                        value={coordenadas.lng.toFixed(6)}
                        className="w-full bg-transparent font-bold text-white text-xs outline-none cursor-default font-mono mt-0.5"
                      />
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 uppercase block">Altitude Estimada</span>
                      <span className="font-bold text-cyan-300 text-xs block mt-0.5">782.4 m</span>
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 uppercase block">Zona UTM</span>
                      <span className="font-bold text-zinc-300 text-xs block mt-0.5">23K 331044 7393400</span>
                    </div>
                  </div>

                  {/* Detecção de Bairro / Referência */}
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-xs">
                    <span className="text-[9px] text-zinc-500 uppercase block">
                      Bairro / Referência Detectada
                    </span>
                    <span className="font-bold text-white text-[11px] block mt-0.5 truncate">
                      Centro Operacional // Av. Brasil x R. Tamoios, Setor 01
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {erro && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-500 text-cyan-300 text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Check className="h-4 w-4" />
              <span>Registro de nó homologado com sucesso! Redirecionando para o Inventário...</span>
            </div>
          )}
        </form>

        {/* 6. BARRA INFERIOR FIXA (FOOTER DE AÇÕES) */}
        <footer className="px-6 py-4 border-t border-zinc-800 bg-[#090e16] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">
                Validação de Registro em Andamento
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                Todos os campos obrigatórios preenchidos conforme protocolo F.O.G.O.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/inventario')}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-zinc-300 transition-all cursor-pointer"
            >
              Cancelar / Descartar
            </button>

            <button
              type="button"
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-mono font-bold tracking-wider transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>{id ? 'Atualizando Registro...' : 'Gravando Registro...'}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 stroke-[2.5]" />
                  <span>{id ? 'Atualizar Equipamento e Salvar' : 'Salvar Registro e Ativar Telemetria'}</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
