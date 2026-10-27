import React, { useEffect, useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const API_URL = 'http://localhost:3000';

const PIN_EQUIP_MODAL = L.divIcon({
  html: `<div style="background-color: #06b6d4; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(6,182,212,0.9);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface EquipamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemEmEdicao: any | null;
  onSuccess: () => void;
}

function ClickMapHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const EquipamentoModal: React.FC<EquipamentoModalProps> = ({
  isOpen,
  onClose,
  itemEmEdicao,
  onSuccess,
}) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -21.9348,
    lng: -50.5146,
  });
  const [situacao, setSituacao] = useState('operacional');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (itemEmEdicao) {
      setCoords({
        lat: itemEmEdicao.latitude != null ? Number(itemEmEdicao.latitude) : -21.9348,
        lng: itemEmEdicao.longitude != null ? Number(itemEmEdicao.longitude) : -50.5146,
      });
      setSituacao(itemEmEdicao.situacao || 'operacional');
    } else {
      setCoords({ lat: -21.9348, lng: -50.5146 });
      setSituacao('operacional');
    }
    setErro(null);
  }, [itemEmEdicao, isOpen]);

  if (!isOpen) return null;

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemEmEdicao?.id) return;
    setSalvando(true);
    setErro(null);

    try {
      const res = await fetch(`${API_URL}/equipamentos/${itemEmEdicao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situacao,
          latitude: coords.lat,
          longitude: coords.lng,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao atualizar equipamento.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro no salvamento:', err);
      setErro(err.message || 'Erro ao processar atualização.');
    } finally {
      setSalvando(false);
    }
  };

  const serialExibicao = itemEmEdicao?.numeroSerie || (itemEmEdicao?.id ? `#${itemEmEdicao.id}` : 'EQUIP-N/A');

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-[#0a1018] p-5 shadow-2xl text-zinc-200 font-sans">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <h2 className="text-sm font-mono font-bold tracking-widest text-cyan-400 uppercase">
                Atualização Rápida Tática
              </h2>
            </div>
            <div className="mt-1 font-mono text-xs text-zinc-400">
              EQUIPAMENTO:{' '}
              <span className="text-white font-bold tracking-wider">{serialExibicao}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {erro && (
          <div className="mb-4 rounded-lg border border-red-800/60 bg-red-950/40 p-2.5 text-xs font-mono text-red-300">
            {erro}
          </div>
        )}

        {/* Formulário / Grid 1 coluna */}
        <form onSubmit={handleSalvar} className="space-y-4">
          {/* Mini-mapa Leaflet */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
              <span className="flex items-center gap-1 font-bold text-zinc-300 uppercase">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" /> Reposicionamento Tático
              </span>
              <span className="text-[10px] text-cyan-400/80">Clique no mapa para mover</span>
            </div>

            <div className="h-48 w-full rounded-md border border-zinc-800 overflow-hidden relative">
              <MapContainer
                key={`map-equip-${itemEmEdicao?.id ?? 'novo'}-${coords.lat}`}
                center={[coords.lat, coords.lng]}
                zoom={15}
                zoomControl={false}
                attributionControl={false}
                style={{ height: '100%', width: '100%', background: '#090d12' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="mapa-cyberpunk"
                />
                <ClickMapHandler
                  onChange={(lat, lng) => setCoords({ lat, lng })}
                />
                <Marker position={[coords.lat, coords.lng]} icon={PIN_EQUIP_MODAL} />
              </MapContainer>
            </div>

            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
              <span>LAT: {coords.lat.toFixed(5)}</span>
              <span>LON: {coords.lng.toFixed(5)}</span>
            </div>
          </div>

          {/* Situação Operacional */}
          <div>
            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-400 mb-1.5">
              Situação Operacional
            </label>
            <select
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              <option value="operacional">Operacional</option>
              <option value="mau_funcionamento">Mau Funcionamento</option>
              <option value="manutencao">Manutenção</option>
              <option value="desativado">Desativado</option>
            </select>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-800/80 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Confirmar Atualização'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
