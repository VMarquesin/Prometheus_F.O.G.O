CREATE EXTENSION IF NOT EXISTS postgis;
-- AlterTable
ALTER TABLE "agentes"
ADD COLUMN "orgao_id" INTEGER,
ADD COLUMN "url_foto" TEXT;

-- AlterTable
ALTER TABLE "equipamentos"
ADD COLUMN "data_proxima_manutencao" TIMESTAMP(6),
ADD COLUMN "necessidade_manutencao" TEXT,
ADD COLUMN "orgao_id" INTEGER,
ADD COLUMN "tipo_local_id" INTEGER,
ADD COLUMN "url_imagem" TEXT;

-- AlterTable
ALTER TABLE "incidentes_alertas"
ADD COLUMN "justificativa_ia" TEXT,
ADD COLUMN "probabilidade" INTEGER;

-- CreateTable
CREATE TABLE "orgaos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "sigla" VARCHAR(20) NOT NULL,
    CONSTRAINT "orgaos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_locais" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    CONSTRAINT "tipos_locais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orgaos_nome_key" ON "orgaos" ("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_locais_nome_key" ON "tipos_locais" ("nome");

-- AddForeignKey
ALTER TABLE "equipamentos"
ADD CONSTRAINT "equipamentos_tipo_local_id_fkey" FOREIGN KEY ("tipo_local_id") REFERENCES "tipos_locais" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos"
ADD CONSTRAINT "equipamentos_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgaos" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agentes"
ADD CONSTRAINT "agentes_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgaos" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_equipamentos_coordenadas ON equipamentos USING GIST (coordenadas);

CREATE INDEX idx_agentes_coordenadas_atuais ON agentes USING GIST (coordenadas_atuais);

CREATE INDEX idx_incidentes_alertas_coordenadas ON incidentes_alertas USING GIST (coordenadas);