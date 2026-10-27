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
  User,
  Landmark,
  Award,
  KeyRound,
  Car,
  Video,
  Navigation,
  CheckCircle2,
  Building2,
  Check,
} from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Ícone ciano tático para o agente no mapa
const ICONE_PIN_AGENTE = L.divIcon({
  className: 'pin-agente-tactical',
  html: `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <span style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(34, 211, 238, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <span style="position: absolute; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #22d3ee; background: rgba(6, 182, 212, 0.6); box-shadow: 0 0 14px #22d3ee;"></span>
      <span style="position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Subcomponente de clique no Leaflet
function SeletorCoordenadasAgente({
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

export default function CadastroAgente() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  // Dados auxiliares do banco de dados (/auxiliares)
  const [dadosAuxiliares, setDadosAuxiliares] = useState<{
    orgaos: Array<{ id: number; nome: string; sigla?: string }>;
    tiposAgentes: Array<{ id: number; nome: string; descricao?: string }>;
  }>({
    orgaos: [],
    tiposAgentes: [],
  });

  // 1. Estados do Formulário
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    orgaoId: '2',
    tipoAgenteId: '1',
    patente: 'resposta_rapida',
    nivelAcesso: 'nivel_4',
    viatura: 'vtr_31',
    canalRadio: 'ch_04',
    bodycamId: 'BCAM-SP-4491-HD // 915MHz LoRaWAN',
    situacao: 'ativo',
    urlFoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
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

  // Gerador de Matrícula Tática Dinâmica
  const gerarMatricula = () => {
    const novaMatricula = `MAT-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`;
    setFormData((prev) => ({
      ...prev,
      matricula: novaMatricula,
    }));
  };

  // Se não houver ID na URL (novo cadastro), inicializa com matrícula gerada
  useEffect(() => {
    if (!id) {
      gerarMatricula();
    }
  }, [id]);

  // Carregar dados auxiliares (órgãos e tipos de agentes)
  useEffect(() => {
    const carregarAuxiliares = async () => {
      try {
        const res = await fetch('http://localhost:3000/auxiliares');
        if (res.ok) {
          const data = await res.json();
          setDadosAuxiliares({
            orgaos: data.orgaos || [],
            tiposAgentes: data.tiposAgentes || [],
          });
          if (!id) {
            setFormData((prev) => ({
              ...prev,
              orgaoId: data.orgaos?.[0] ? String(data.orgaos[0].id) : prev.orgaoId,
              tipoAgenteId: data.tiposAgentes?.[0] ? String(data.tiposAgentes[0].id) : prev.tipoAgenteId,
            }));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados auxiliares:', err);
      }
    };
    carregarAuxiliares();
  }, [id]);

  // Se houver ID vindo do useParams, carregar dados reais do agente para edição
  useEffect(() => {
    if (!id) return;
    const carregarAgente = async () => {
      try {
        const res = await fetch(`http://localhost:3000/agentes/${id}`);
        if (res.ok) {
          const item = await res.json();
          if (item) {
            setFormData((prev) => ({
              ...prev,
              nome: item.nome || '',
              matricula: item.matricula || '',
              orgaoId: item.orgaoId ? String(item.orgaoId) : prev.orgaoId,
              tipoAgenteId: item.tipoAgenteId ? String(item.tipoAgenteId) : prev.tipoAgenteId,
              situacao: item.situacao || 'ativo',
              urlFoto: item.urlFoto || prev.urlFoto,
            }));
            if (item.latitude != null && item.longitude != null) {
              setCoordenadas({
                lat: Number(item.latitude),
                lng: Number(item.longitude),
              });
            }
          }
        } else {
          setErro(`Não foi possível carregar o agente ID #${id}`);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do agente:', err);
        setErro('Falha na conexão ao buscar agente.');
      }
    };
    carregarAgente();
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
      nome: formData.nome.trim(),
      matricula: formData.matricula.trim(),
      situacao: formData.situacao,
      latitude: coordenadas.lat,
      longitude: coordenadas.lng,
      tipoAgenteId: parseInt(formData.tipoAgenteId, 10) || 1,
      orgaoId: parseInt(formData.orgaoId, 10) || null,
      urlFoto: formData.urlFoto || null,
    };

    try {
      const url = id ? `http://localhost:3000/agentes/${id}` : 'http://localhost:3000/agentes';
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
        navigate('/efetivo');
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Falha ao salvar agente.');
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

            <button
              onClick={() => navigate('/cadastro-equipamento')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              <PlusSquare className="h-4 w-4 text-zinc-400" />
              <span>Cadastro de Equipamento</span>
            </button>

            {/* ATIVO: EFETIVO DE AGENTES */}
            <button
              onClick={() => navigate('/efetivo-agentes')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-md text-xs font-mono tracking-wider text-cyan-300 bg-cyan-950/40 border-l-4 border-cyan-400 font-semibold shadow-[inset_0_0_15px_rgba(34,211,238,0.1)] cursor-pointer"
            >
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
                <span>EFETIVO DE AGENTES</span>
                <span className="text-zinc-600">/</span>
                <span>{id ? `EDIÇÃO DE OPERATIVO #${id}` : 'CADASTRO DE OPERATIVO'}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-cyan-300">OP-REG-2025-09</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl md:text-2xl font-mono font-bold text-white tracking-tight">
                  {id ? `Edição de Operativo #${id}` : 'Novo Registro de Operativo / Força em Campo'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-600/50 text-[10px] font-mono text-cyan-400 font-bold uppercase">
                  {id ? 'MODO DE EDIÇÃO ATIVO' : 'FASE: ALOCAÇÃO INICIAL'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a1018] border border-zinc-800 text-xs font-mono">
                <span className={`w-2 h-2 rounded-full ${id ? 'bg-cyan-400' : 'bg-amber-400'} animate-pulse`}></span>
                <span className={`${id ? 'text-cyan-300' : 'text-zinc-300'} font-bold uppercase text-[10px]`}>
                  {id ? 'SINCRONIZAÇÃO BD ATIVA' : 'PROTOCOLO: ENCRIPTAÇÃO F.O.G.O. ATIVA'}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a1018] border border-cyan-900/60 text-xs font-mono text-cyan-400">
                <Radio className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold">GATEWAY: CCO-METRO-01</span>
              </div>
            </div>
          </div>

          {/* Grid Principal Dividido: 8 colunas (Formulário) e 4 colunas (Alocação Geográfica) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUNA ESQUERDA: FORMULÁRIO (8 COLUNAS) */}
            <div className="lg:col-span-8 space-y-6">
              {/* BLOCO 01: Identidade Tática & Registro Operacional */}
              <div className="rounded-xl border border-zinc-800 bg-[#0a1018]/95 p-6 shadow-xl relative backdrop-blur-md">
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-400 font-mono text-xs font-bold">
                      01
                    </span>
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                        Identidade Tática & Registro Operacional
                      </h3>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        HABILITAÇÃO DE OPERATIVO EM MALHA CCO
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-cyan-400">
                    HW/SEC-LVL-4
                  </span>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  {/* Linha 1: Nome Completo */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-zinc-400 uppercase text-[10px] font-bold">
                        Nome Completo do Operativo <span className="text-cyan-400">*</span>
                      </label>
                      <span className="text-[9px] text-zinc-500">IDENTIFICAÇÃO CIVIL / TÁTICA</span>
                    </div>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        placeholder="Ex: Sgt. Lucas Cavalcante"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-3 text-zinc-200 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Linha 2: Matrícula & Órgão */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 uppercase text-[10px] font-bold">
                          Matrícula Institucional / GUID <span className="text-cyan-400">*</span>
                        </label>
                        <span className="text-[9px] text-cyan-400 font-bold">AES-KEY</span>
                      </div>
                      <div className="relative flex items-center">
                        <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                        <input
                          type="text"
                          name="matricula"
                          value={formData.matricula || ''}
                          onChange={handleChange}
                          placeholder="Ex: MAT-2026-12345"
                          className="w-full rounded-lg border border-cyan-800/60 bg-zinc-950 py-2.5 pl-10 pr-24 text-cyan-300 font-mono font-bold tracking-wider focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]"
                        />
                        <button
                          type="button"
                          onClick={gerarMatricula}
                          className="absolute right-2 top-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 hover:border-cyan-500 text-[10px] font-bold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <RotateCw className="h-3 w-3" />
                          <span>GERAR</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 uppercase text-[10px] font-bold">
                          Órgão / Corporação <span className="text-cyan-400">*</span>
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <Landmark className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400 pointer-events-none" />
                        <select
                          name="orgaoId"
                          value={formData.orgaoId}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-8 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                        >
                          {dadosAuxiliares.orgaos.length > 0 ? (
                            dadosAuxiliares.orgaos.map((org) => (
                              <option key={org.id} value={org.id}>
                                {org.nome} {org.sigla ? `(${org.sigla})` : ''}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="2">Polícia Militar - PMESP</option>
                              <option value="4">Guarda Civil Metropolitana - GCM</option>
                              <option value="1">CET - Engenharia de Tráfego</option>
                              <option value="3">Defesa Civil Municipal</option>
                              <option value="5">Corpo de Bombeiros / Resgate</option>
                            </>
                          )}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500 text-[10px]">
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linha 3: Tipo de Agente & Situação Operacional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 uppercase text-[10px] font-bold">
                          Tipo de Agente / Função <span className="text-cyan-400">*</span>
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <Award className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400 pointer-events-none" />
                        <select
                          name="tipoAgenteId"
                          value={formData.tipoAgenteId}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-8 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                        >
                          {dadosAuxiliares.tiposAgentes.length > 0 ? (
                            dadosAuxiliares.tiposAgentes.map((tag) => (
                              <option key={tag.id} value={tag.id}>
                                {tag.nome} {tag.descricao ? `- ${tag.descricao}` : ''}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="1">Agente de Trânsito</option>
                              <option value="2">Guarda Municipal</option>
                              <option value="3">Polícia Militar</option>
                              <option value="4">Defesa Civil</option>
                            </>
                          )}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500 text-[10px]">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-zinc-400 uppercase text-[10px] font-bold">
                          Situação Operacional <span className="text-cyan-400">*</span>
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <Shield className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400 pointer-events-none" />
                        <select
                          name="situacao"
                          value={formData.situacao}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-8 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                        >
                          <option value="ativo">Ativo (Disponível na Base)</option>
                          <option value="patrulhamento">Em Patrulhamento Ativo</option>
                          <option value="deslocamento">Em Deslocamento Tático</option>
                          <option value="ocorrencia">Em Ocorrência</option>
                          <option value="inativo">Inativo / Desativado</option>
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500 text-[10px]">
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* BLOCO 02: Equipamento Vinculado & Telemetria em Campo */}
              <div className="rounded-xl border border-zinc-800 bg-[#0a1018]/95 p-6 shadow-xl relative backdrop-blur-md">
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-400 font-mono text-xs font-bold">
                      02
                    </span>
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                        Equipamento Vinculado & Telemetria em Campo
                      </h3>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        SINCRONISMO BIOMÉTRICO E RADIOTELEMETRIA
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[10px] font-mono text-cyan-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    IOT LINK ACTIVE
                  </span>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  {/* Linha 1: Viatura & Rádio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1.5">
                        Viatura / Transporte Vinculado <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Car className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <select
                          name="viatura"
                          value={formData.viatura}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-8 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                        >
                          <option value="vtr_31">VTR-31 (Chevrolet Trailblazer FT)</option>
                          <option value="vtr_09">VTR-09 (Toyota Hilux Tática)</option>
                          <option value="vtr_14">VTR-14 (Duster Tática Municipal)</option>
                          <option value="moto_cet_03">MOTO-CET-03 (Honda CB 500X)</option>
                          <option value="ur_22">UR-22 (UTI Móvel de Salvamento)</option>
                          <option value="sem_viatura">Sem Viatura (Patrulhamento a Pé / Posto Fixo)</option>
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500 text-[10px]">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-zinc-400 uppercase text-[10px] font-bold block mb-1.5">
                        Canal de Rádio Criptografado (AES-256) <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Radio className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <select
                          name="canalRadio"
                          value={formData.canalRadio}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-8 text-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                        >
                          <option value="ch_04">CH-04 TÁTICO GERAL (450.125 MHz)</option>
                          <option value="ch_01">CH-01 BASE GERAL (QAP Standby)</option>
                          <option value="ch_05">CH-05 TÁTICO LESTE (458.750 MHz)</option>
                          <option value="ch_09">CH-09 URBANO GCM (Interligada)</option>
                          <option value="ch_07">CH-07 RESGATE EMERGENCIAL</option>
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500 text-[10px]">
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: ID Bodycam */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-zinc-400 uppercase text-[10px] font-bold">
                        ID da Bodycam & Frequência IoT <span className="text-cyan-400">*</span>
                      </label>
                      <span className="text-[9px] text-zinc-500">STREAM RTSP / H.265</span>
                    </div>
                    <div className="relative flex items-center">
                      <Video className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400" />
                      <input
                        type="text"
                        name="bodycamId"
                        value={formData.bodycamId}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-3 text-cyan-300 font-mono font-bold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
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
                    <Navigation className="h-4 w-4 text-cyan-400" />
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                        Alocação Geográfica Inicial
                      </h3>
                      <p className="text-[9px] font-mono text-zinc-500 uppercase">
                        BASE E PONTO DE BRIEFING TÁTICO
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-[9px] font-mono text-cyan-400 font-bold">
                    GNSS RTK FIX
                  </span>
                </div>

                {/* Subhead de precisão */}
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-2.5">
                  <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    HDOP: 0.79 (MÁXIMA PRECISÃO)
                  </span>
                  <span>SATS: 16 GPS/GLO</span>
                </div>

                {/* Mensagem instrucional */}
                <div className="mb-3 flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-900/60 p-2 rounded-lg leading-tight">
                  <Navigation className="h-4 w-4 shrink-0 text-cyan-400 animate-pulse" />
                  <span>Clique no mapa para definir o ponto de alocação inicial do turno</span>
                </div>

                {/* Mapa Interativo */}
                <div className="relative h-80 w-full rounded-xl overflow-hidden border border-zinc-800">
                  {/* Badges superiores sobre o mapa */}
                  <div className="absolute top-2 left-2 z-[1000] pointer-events-none">
                    <div className="px-2 py-1 rounded bg-[#0a1018]/90 border border-zinc-800 text-[9px] font-mono text-cyan-300 font-bold shadow-md">
                      SECTOR: 01-CENTRO<br />
                      <span className="text-zinc-400 font-normal">RAIO INICIAL: 1.200 METROS</span>
                    </div>
                  </div>

                  {/* Leaflet MapContainer */}
                  <MapContainer
                    center={[coordenadas.lat, coordenadas.lng]}
                    zoom={15}
                    zoomControl={false}
                    style={{ height: '100%', width: '100%', background: '#090d12' }}
                  >
                    <TileLayer
                      key="cadastro-agente-tiles"
                      className="mapa-cyberpunk"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Captura de clique para redefinir coordenadas */}
                    <SeletorCoordenadasAgente onSelect={setCoordenadas} />

                    {/* Marcador na posição */}
                    <Marker position={[coordenadas.lat, coordenadas.lng]} icon={ICONE_PIN_AGENTE} />
                  </MapContainer>

                  {/* Barra inferior sobre o mapa */}
                  <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-[#0a1018]/90 border-t border-zinc-800 px-3 py-1 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                    <span>GRID GEORREFERENCIADO</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      VARREDURA ATIVA
                    </span>
                  </div>
                </div>

                {/* Displays Digitais de Telemetria Georreferenciada */}
                <div className="mt-4 pt-3 border-t border-zinc-800 space-y-3 font-mono">
                  {/* 2x2 Grid de Coordenadas */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 uppercase block">Latitude Inicial</span>
                      <input
                        type="text"
                        readOnly
                        value={`${coordenadas.lat.toFixed(6)}°`}
                        className="w-full bg-transparent font-bold text-cyan-400 text-xs outline-none cursor-default font-mono mt-0.5"
                      />
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 uppercase block">Longitude Inicial</span>
                      <input
                        type="text"
                        readOnly
                        value={`${coordenadas.lng.toFixed(6)}°`}
                        className="w-full bg-transparent font-bold text-cyan-400 text-xs outline-none cursor-default font-mono mt-0.5"
                      />
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 uppercase block">Altitude Estimada</span>
                      <span className="font-bold text-white text-xs block mt-0.5">760.4 m</span>
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] text-zinc-500 uppercase block">Zona UTM</span>
                      <span className="font-bold text-zinc-300 text-xs block mt-0.5">23K 331420 7394150</span>
                    </div>
                  </div>

                  {/* Base de Partida Detectada */}
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 uppercase">Base de Partida Detectada:</span>
                      <span className="text-cyan-400 font-bold">GEO-FENCE OK</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Building2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>Base Operacional Sé / Batalhão Central 1º BPM/M</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      Ponto de briefing inicial verificado. Rota de evasão e contingência vinculada ao CCO Leste.
                    </p>
                  </div>

                  {/* Sincronia Temporal */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span>SINCRONIA TEMPORAL: RTK-NTP-01</span>
                    <span className="text-cyan-400 font-bold">LATÊNCIA: 8ms</span>
                  </div>

                  {/* Box de Prontidão */}
                  <div className="bg-cyan-950/30 border border-cyan-800/60 p-2.5 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-cyan-400" />
                      <div>
                        <div className="text-[11px] font-bold text-white">Prontidão para Despacho</div>
                        <div className="text-[9px] text-zinc-400">Equipamentos e telemetria checados.</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-900/80 border border-cyan-500/60 text-[9px] font-bold text-cyan-300">
                      STATUS: PRONTO
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
              <span>Operativo homologado e alocado com sucesso! Redirecionando para o Efetivo...</span>
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
                Validação de Registro Operacional em Andamento
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                Todos os campos obrigatórios em conformidade com o protocolo F.O.G.O. v4.2
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/efetivo-agentes')}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-zinc-300 transition-all cursor-pointer"
            >
              Cancelar / Descartar Registro
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
                  <span>Despachando Operativo...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 stroke-[2.5]" />
                  <span>Salvar Registro e Despachar Operativo</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
