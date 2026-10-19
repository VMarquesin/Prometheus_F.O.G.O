import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const API_URL = 'http://localhost:3000';

interface AgenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemEmEdicao: any | null;
  onSuccess: () => void;
}

export const AgenteModal: React.FC<AgenteModalProps> = ({
  isOpen,
  onClose,
  itemEmEdicao,
  onSuccess,
}) => {
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [situacao, setSituacao] = useState('ativo');
  const [orgaoId, setOrgaoId] = useState('');
  const [tipoAgenteId, setTipoAgenteId] = useState('1');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (itemEmEdicao) {
      setNome(itemEmEdicao.nome ?? '');
      setMatricula(itemEmEdicao.matricula ?? '');
      setLatitude(itemEmEdicao.latitude != null ? String(itemEmEdicao.latitude) : '');
      setLongitude(itemEmEdicao.longitude != null ? String(itemEmEdicao.longitude) : '');
      setSituacao(itemEmEdicao.situacao ?? 'ativo');
      setOrgaoId(itemEmEdicao.orgaoId != null ? String(itemEmEdicao.orgaoId) : '');
      setTipoAgenteId(itemEmEdicao.tipoAgenteId != null ? String(itemEmEdicao.tipoAgenteId) : '1');
    } else {
      setNome('');
      setMatricula('');
      setLatitude('-21.9348');
      setLongitude('-50.5146');
      setSituacao('ativo');
      setOrgaoId('');
      setTipoAgenteId('1');
    }
    setErro(null);
  }, [itemEmEdicao, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    const payload: any = {
      nome: nome.trim(),
      matricula: matricula.trim(),
      situacao,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      orgaoId: orgaoId ? parseInt(orgaoId, 10) : null,
      tipoAgenteId: parseInt(tipoAgenteId, 10) || 1,
    };

    try {
      const url = itemEmEdicao
        ? `${API_URL}/agentes/${itemEmEdicao.id}`
        : `${API_URL}/agentes`;
      const method = itemEmEdicao ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ao salvar agente (${res.status})`);
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

        <h2 className="mb-4 text-base font-mono font-bold tracking-wider text-yellow-300">
          {itemEmEdicao ? 'EDITAR AGENTE' : 'NOVO AGENTE'}
        </h2>

        {erro && (
          <div className="mb-4 rounded bg-red-950/40 border border-red-500/40 p-2.5 text-xs text-red-300">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block mb-1 font-mono text-zinc-400">Nome do Agente</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Silva"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-mono text-zinc-400">Matrícula</label>
            <input
              type="text"
              required
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Ex: AG-2026-001"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
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
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-mono text-zinc-400">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-50.5146"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-mono text-zinc-400">Situação</label>
              <select
                value={situacao}
                onChange={(e) => setSituacao(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              >
                <option value="ativo">Ativo</option>
                <option value="em_patrulha">Em Patrulha</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-mono text-zinc-400">ID Órgão (Opcional)</label>
              <input
                type="number"
                value={orgaoId}
                onChange={(e) => setOrgaoId(e.target.value)}
                placeholder="Ex: 1"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
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
              className="rounded-lg bg-yellow-500/20 border border-yellow-500/50 px-4 py-2 font-mono text-xs font-bold text-yellow-300 hover:bg-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.25)] transition-all cursor-pointer disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
