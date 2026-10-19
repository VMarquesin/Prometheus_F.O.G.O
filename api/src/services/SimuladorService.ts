import prisma from '../prisma';
import webSocketService from '../websocket';

const INTERVALO_MS = 10_000;
const CHANCE_FALHA = 0.1;
const DESLOCAMENTO_MAX = 0.0005; // ~55 metros

export class SimuladorService {
  private timer: NodeJS.Timeout | null = null;

  iniciar() {
    if (this.timer) return;
    console.log('Simulador de telemetria iniciado');

    this.timer = setInterval(async () => {
      try {
        await this.moverAgenteAleatorio();
        await this.simularFalhaEquipamento();
      } catch (error) {
        console.error('Erro no simulador:', error);
      }
    }, INTERVALO_MS);
  }

  parar() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private variacao() {
    return (Math.random() * 2 - 1) * DESLOCAMENTO_MAX;
  }

  private async moverAgenteAleatorio() {
    const sorteado = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM agentes
      WHERE coordenadas_atuais IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 1
    `;
    if (sorteado.length === 0) return;

    const id = sorteado[0]!.id;
    const alteracaoLng = this.variacao();
    const alteracaoLat = this.variacao();

    const atualizado = await prisma.$queryRaw<unknown[]>`
      UPDATE agentes
      SET coordenadas_atuais = ST_SetSRID(
            ST_MakePoint(
              ST_X(coordenadas_atuais::geometry) + ${alteracaoLng}::double precision,
              ST_Y(coordenadas_atuais::geometry) + ${alteracaoLat}::double precision
            ), 4326),
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING
        id,
        tipo_agente_id AS "tipoAgenteId",
        nome,
        matricula,
        situacao,
        ST_Y(coordenadas_atuais::geometry) AS latitude,
        ST_X(coordenadas_atuais::geometry) AS longitude,
        atualizado_em AS "atualizadoEm"
    `;

    if (atualizado.length > 0) {
      webSocketService.getIO().emit('agente_movido', atualizado[0]);
    }
  }

  private async simularFalhaEquipamento() {
    const sorteado = await prisma.$queryRaw<{ id: number; situacao: string }[]>`
      SELECT id, situacao FROM equipamentos
      ORDER BY RANDOM()
      LIMIT 1
    `;
    if (sorteado.length === 0) return;
    if (Math.random() >= CHANCE_FALHA) return;

    const { id, situacao } = sorteado[0]!;
    if (situacao === 'mau_funcionamento') return;

    const atualizado = await prisma.$queryRaw<unknown[]>`
      UPDATE equipamentos
      SET situacao = 'mau_funcionamento',
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING
        id,
        modelo_id AS "modeloId",
        numero_serie AS "numeroSerie",
        situacao,
        ST_Y(coordenadas::geometry) AS latitude,
        ST_X(coordenadas::geometry) AS longitude,
        atualizado_em AS "atualizadoEm"
    `;

    if (atualizado.length > 0) {
      const detalhes = JSON.stringify({
        mensagem: `Equipamento ${id} mudou para status 'mau_funcionamento'`,
        statusAnterior: situacao,
        statusNovo: 'mau_funcionamento',
      });

      await prisma.$executeRaw`
        INSERT INTO historico_eventos (entidade_tipo, entidade_id, evento, detalhes)
        VALUES ('equipamento', ${id}, 'mudanca_status', ${detalhes}::jsonb)
      `;

      webSocketService.getIO().emit('alerta_equipamento', atualizado[0]);
    }
  }
}
