CREATE EXTENSION IF NOT EXISTS postgis;
-- CreateTable
CREATE TABLE "estados" (
    "id" SERIAL NOT NULL,
    "uf" VARCHAR(2) NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    CONSTRAINT "estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cidades" (
    "id" SERIAL NOT NULL,
    "estado_id" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    CONSTRAINT "cidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bairros" (
    "id" SERIAL NOT NULL,
    "cidade_id" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    CONSTRAINT "bairros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_equipamentos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tipos_equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos" (
    "id" SERIAL NOT NULL,
    "marca_id" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo_equipamento_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "modelos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" SERIAL NOT NULL,
    "modelo_id" INTEGER NOT NULL,
    "numero_serie" VARCHAR(100),
    "situacao" VARCHAR(50) NOT NULL,
    "cep" VARCHAR(9),
    "bairro_id" INTEGER NOT NULL,
    "logradouro" VARCHAR(150),
    "numero_referencia" VARCHAR(50),
    "coordenadas" geometry (Point, 4326),
    "caracteristicas_especificas" JSONB,
    "data_instalacao" TIMESTAMP(6),
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_agentes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "descricao" TEXT,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tipos_agentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agentes" (
    "id" SERIAL NOT NULL,
    "tipo_agente_id" INTEGER NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "matricula" VARCHAR(50) NOT NULL,
    "situacao" VARCHAR(50) NOT NULL,
    "coordenadas_atuais" geometry (Point, 4326),
    "atualizado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes" (
    "id" SERIAL NOT NULL,
    "equipamento_id" INTEGER NOT NULL,
    "tipo_manutencao" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "data_prevista" TIMESTAMP(6),
    "data_conclusao" TIMESTAMP(6),
    "descricao" TEXT,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manutencoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_eventos" (
    "id" SERIAL NOT NULL,
    "entidade_tipo" VARCHAR(20) NOT NULL,
    "entidade_id" INTEGER NOT NULL,
    "evento" VARCHAR(100) NOT NULL,
    "detalhes" JSONB,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historico_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidentes_alertas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "criticidade" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "coordenadas" geometry (Point, 4326) NOT NULL,
    "equipamento_id" INTEGER,
    "fonte" TEXT NOT NULL,
    "data_ocorrencia" TIMESTAMP(6) NOT NULL,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "incidentes_alertas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estados_uf_key" ON "estados" ("uf");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nome_key" ON "marcas" ("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_equipamentos_nome_key" ON "tipos_equipamentos" ("nome");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_numero_serie_key" ON "equipamentos" ("numero_serie");

-- CreateIndex
CREATE INDEX "idx_equipamentos_situacao" ON "equipamentos" ("situacao");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_agentes_nome_key" ON "tipos_agentes" ("nome");

-- CreateIndex
CREATE UNIQUE INDEX "agentes_matricula_key" ON "agentes" ("matricula");

-- CreateIndex
CREATE INDEX "idx_agentes_situacao" ON "agentes" ("situacao");

-- CreateIndex
CREATE INDEX "idx_manutencoes_status" ON "manutencoes" ("status");

-- AddForeignKey
ALTER TABLE "cidades"
ADD CONSTRAINT "cidades_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bairros"
ADD CONSTRAINT "bairros_cidade_id_fkey" FOREIGN KEY ("cidade_id") REFERENCES "cidades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelos"
ADD CONSTRAINT "modelos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelos"
ADD CONSTRAINT "modelos_tipo_equipamento_id_fkey" FOREIGN KEY ("tipo_equipamento_id") REFERENCES "tipos_equipamentos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos"
ADD CONSTRAINT "equipamentos_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "modelos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos"
ADD CONSTRAINT "equipamentos_bairro_id_fkey" FOREIGN KEY ("bairro_id") REFERENCES "bairros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agentes"
ADD CONSTRAINT "agentes_tipo_agente_id_fkey" FOREIGN KEY ("tipo_agente_id") REFERENCES "tipos_agentes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes"
ADD CONSTRAINT "manutencoes_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidentes_alertas"
ADD CONSTRAINT "incidentes_alertas_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_equipamentos_coordenadas ON equipamentos USING GIST (coordenadas);

CREATE INDEX idx_agentes_coordenadas_atuais ON agentes USING GIST (coordenadas_atuais);

CREATE INDEX idx_incidentes_alertas_coordenadas ON incidentes_alertas USING GIST (coordenadas);