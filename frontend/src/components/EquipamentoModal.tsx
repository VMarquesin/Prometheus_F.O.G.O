import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const API_URL = 'http://localhost:3000';

interface EquipamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemEmEdicao: any | null;
  onSuccess: () => void;
}

export const EquipamentoModal: React.FC<EquipamentoModalProps> = ({
  isOpen,
  onClose,
  itemEmEdicao,
  onSuccess,
}) => {
  const [numeroSerie, setNumeroSerie] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [situacao, setSituacao] = useState('operacional');
  const [orgaoId, setOrgaoId] = useState('');
  const [tipoLocalId, setTipoLocalId] = useState('');
  const [modeloId, setModeloId] = useState('1');
  const [bairroId, setBairroId] = useState('1');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (itemEmEdicao) {
      setNumeroSerie(itemEmEdicao.numeroSerie ?? '');
      setLatitude(itemEmEdicao.latitude != null ? String(itemEmEdicao.latitude) : '');
      setLongitude(itemEmEdicao.longitude != null ? String(itemEmEdicao.longitude) : '');
      setSituacao(itemEmEdicao.situacao ?? 'operacional');
      setOrgaoId(itemEmEdicao.orgaoId != null ? String(itemEmEdicao.orgaoId) : '');
      setTipoLocalId(itemEmEdicao.tipoLocalId != null ? String(itemEmEdicao.tipoLocalId) : '');
      setModeloId(itemEmEdicao.modeloId != null ? String(itemEmEdicao.modeloId) : '1');
      setBairroId(itemEmEdicao.bairroId != null ? String(itemEmEdicao.bairroId) : '1');
    } else {
      setNumeroSerie('');
      setLatitude('-21.9348');
      setLongitude('-50.5146');
      setSituacao('operacional');
      setOrgaoId('');
      setTipoLocalId('');
      setModeloId('1');
      setBairroId('1');
    }
    setErro(null);
  }, [itemEmEdicao, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    const payload: any = {
      numeroSerie: numeroSerie.trim() || null,
      situacao,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      orgaoId: orgaoId ? parseInt(orgaoId, 10) : null,
      tipoLocalId: tipoLocalId ? parseInt(tipoLocalId, 10) : null,
      modeloId: parseInt(modeloId, 10) || 1,
      bairroId: parseInt(bairroId, 10) || 1,
    };

    try {
      const url = itemEmEdicao
        ? `${API_URL}/equipamentos/${itemEmEdicao.id}`
        : `${API_URL}/equipamentos`;
      const method = itemEmEdicao ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ao salvar equipamento (${res.status})`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro no salvamento:', err);
      setErro(err.message || 'Erro ao processar requisição.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-zinc-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-base font-mono font-bold tracking-wider text-cyan-300">
          {itemEmEdicao ? 'EDITAR EQUIPAMENTO' : 'NOVO EQUIPAMENTO'}
        </h2>

        {erro && (
          <div className="mb-4 rounded bg-red-950/40 border border-red-500/40 p-2.5 text-xs text-red-300">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block mb-1 font-mono text-zinc-400">Número de Série</label>
            <input
              type="text"
              value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)}
              placeholder="Ex: CAM-TUPA-01"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-mono text-zinc-400">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="-21.9348"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-mono text-zinc-400">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-50.5146"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-mono text-zinc-400">Situação</label>
            <select
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="operacional">Operacional</option>
              <option value="mau_funcionamento">Mau Funcionamento</option>
              <option value="manutencao">Manutenção</option>
              <option value="desativado">Desativado</option>
              <option value="ainda_nao_instalado">Não Instalado</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-mono text-zinc-400">ID Órgão (Opcional)</label>
              <input
                type="number"
                value={orgaoId}
                onChange={(e) => setOrgaoId(e.target.value)}
                placeholder="Ex: 1"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-mono text-zinc-400">ID Tipo Local (Opcional)</label>
              <input
                type="number"
                value={tipoLocalId}
                onChange={(e) => setTipoLocalId(e.target.value)}
                placeholder="Ex: 1"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-mono text-xs text-zinc-400 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-cyan-500/20 border border-cyan-500/50 px-4 py-2 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.25)] transition-all cursor-pointer disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
