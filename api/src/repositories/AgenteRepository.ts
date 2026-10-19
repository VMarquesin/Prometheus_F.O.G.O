import prisma from '../prisma';

export interface AgenteInput {
  tipoAgenteId: number;
  nome: string;
  matricula: string;
  situacao: string;
  latitude?: number | null;
  longitude?: number | null;
  urlFoto?: string | null;
  orgaoId?: number | null;
}

const SELECT_COLUNAS = `
  id,
  tipo_agente_id AS "tipoAgenteId",
  nome,
  matricula,
  situacao,
  ST_Y(coordenadas_atuais::geometry) AS latitude,
  ST_X(coordenadas_atuais::geometry) AS longitude,
  url_foto AS "urlFoto",
  orgao_id AS "orgaoId",
  atualizado_em AS "atualizadoEm"
`;

export class AgenteRepository {
  async criar(dados: AgenteInput) {
    const latitude = dados.latitude ?? null;
    const longitude = dados.longitude ?? null;

    const resultado = await prisma.$queryRaw<{ id: number }[]>`
      INSERT INTO agentes (
        tipo_agente_id, nome, matricula, situacao, coordenadas_atuais,
        url_foto, orgao_id, atualizado_em
      )
      VALUES (
        ${dados.tipoAgenteId},
        ${dados.nome},
        ${dados.matricula},
        ${dados.situacao},
        CASE
          WHEN ${longitude}::double precision IS NULL OR ${latitude}::double precision IS NULL THEN NULL
          ELSE ST_SetSRID(ST_MakePoint(${longitude}::double precision, ${latitude}::double precision), 4326)
        END,
        ${dados.urlFoto ?? null},
        ${dados.orgaoId ?? null},
        CURRENT_TIMESTAMP
      )
      RETURNING id
    `;

    const id = resultado[0]!.id;
    const criado = await prisma.$queryRawUnsafe<unknown[]>(
      `SELECT ${SELECT_COLUNAS} FROM agentes WHERE id = $1`,
      id,
    );
    return criado[0];
  }

  async listar() {
    return prisma.$queryRawUnsafe<unknown[]>(
      `SELECT ${SELECT_COLUNAS} FROM agentes ORDER BY id`,
    );
  }
}
