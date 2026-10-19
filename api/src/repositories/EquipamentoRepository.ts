import prisma from '../prisma';

export interface EquipamentoInput {
  modeloId: number;
  numeroSerie?: string | null;
  situacao: string;
  cep?: string | null;
  bairroId: number;
  logradouro?: string | null;
  numeroReferencia?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  caracteristicasEspecificas?: Record<string, unknown> | null;
  dataInstalacao?: Date | null;
  urlImagem?: string | null;
  tipoLocalId?: number | null;
  orgaoId?: number | null;
  necessidadeManutencao?: string | null;
  dataProximaManutencao?: Date | null;
}

const SELECT_COLUNAS = `
  id,
  modelo_id AS "modeloId",
  numero_serie AS "numeroSerie",
  situacao,
  cep,
  bairro_id AS "bairroId",
  logradouro,
  numero_referencia AS "numeroReferencia",
  ST_Y(coordenadas::geometry) AS latitude,
  ST_X(coordenadas::geometry) AS longitude,
  caracteristicas_especificas AS "caracteristicasEspecificas",
  data_instalacao AS "dataInstalacao",
  url_imagem AS "urlImagem",
  tipo_local_id AS "tipoLocalId",
  orgao_id AS "orgaoId",
  necessidade_manutencao AS "necessidadeManutencao",
  data_proxima_manutencao AS "dataProximaManutencao",
  criado_em AS "criadoEm",
  atualizado_em AS "atualizadoEm"
`;

export class EquipamentoRepository {
  async criar(dados: EquipamentoInput) {
    const latitude = dados.latitude ?? null;
    const longitude = dados.longitude ?? null;
    const caracteristicas =
      dados.caracteristicasEspecificas != null
        ? JSON.stringify(dados.caracteristicasEspecificas)
        : null;

    const resultado = await prisma.$queryRaw<{ id: number }[]>`
      INSERT INTO equipamentos (
        modelo_id, numero_serie, situacao, cep, bairro_id, logradouro,
        numero_referencia, coordenadas, caracteristicas_especificas,
        data_instalacao, url_imagem, tipo_local_id, orgao_id,
        necessidade_manutencao, data_proxima_manutencao, atualizado_em
      )
      VALUES (
        ${dados.modeloId},
        ${dados.numeroSerie ?? null},
        ${dados.situacao},
        ${dados.cep ?? null},
        ${dados.bairroId},
        ${dados.logradouro ?? null},
        ${dados.numeroReferencia ?? null},
        CASE
          WHEN ${longitude}::double precision IS NULL OR ${latitude}::double precision IS NULL THEN NULL
          ELSE ST_SetSRID(ST_MakePoint(${longitude}::double precision, ${latitude}::double precision), 4326)
        END,
        ${caracteristicas}::jsonb,
        ${dados.dataInstalacao ?? null}::timestamp,
        ${dados.urlImagem ?? null},
        ${dados.tipoLocalId ?? null},
        ${dados.orgaoId ?? null},
        ${dados.necessidadeManutencao ?? null},
        ${dados.dataProximaManutencao ?? null}::timestamp,
        CURRENT_TIMESTAMP
      )
      RETURNING id
    `;

    const id = resultado[0].id;
    const criado = await prisma.$queryRawUnsafe<unknown[]>(
      `SELECT ${SELECT_COLUNAS} FROM equipamentos WHERE id = $1`,
      id,
    );
    return criado[0];
  }

  async listar() {
    return prisma.$queryRawUnsafe<unknown[]>(
      `SELECT ${SELECT_COLUNAS} FROM equipamentos ORDER BY id`,
    );
  }
}
