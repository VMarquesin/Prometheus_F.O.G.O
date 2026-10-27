import { useNavigate } from 'react-router-dom';
import { Shield, Cpu, Activity, Radar } from 'lucide-react';

export default function Portal() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#22d3ee_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee_1px,transparent_1px)] bg-[size:48px_48px]" />

      <section className="relative z-10 w-full max-w-5xl text-center">
        <div className="mb-8 flex items-center justify-center gap-6 text-cyan-400">
          <Shield className="h-8 w-8" />
          <Cpu className="h-10 w-10 animate-pulse" />
          <Activity className="h-8 w-8" />
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-[0.25em] pl-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.35)]">
          PROMETHEUS
        </h1>
        <h2 className="mt-4 text-lg md:text-2xl font-mono tracking-[0.4em] text-cyan-300/80 uppercase">
          Projeto F.O.G.O.
        </h2>

        <p className="mt-8 text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          Ferramenta Onisciente de Gestão e Operações. Uma central de inteligência que monitora
          equipamentos urbanos e agentes em campo em tempo real, antecipa falhas com análise
          preditiva e dispara alertas antes que o problema chegue à rua.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="group mt-12 inline-flex items-center gap-3 rounded-lg border border-cyan-400/60 bg-cyan-400/5 px-10 py-4 font-mono text-sm font-bold tracking-[0.3em] text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all duration-300 hover:bg-cyan-400/15 hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] hover:text-white cursor-pointer"
        >
          <Radar className="h-5 w-5 transition-transform duration-500 group-hover:rotate-180" />
          INICIAR SISTEMA
        </button>
      </section>
    </main>
  );
}
